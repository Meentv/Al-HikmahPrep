// Subject-only session construction and stateless quiz/result views.
const Quiz = (() => {
  const { ico, stamp, tag, link, btn, heading, sec, empty, courseTabs, optionList, note, tab } = UI;
  const sizes = [20, 40, 60, 80, 100, 120];
  const defaultSize = (total) =>
    total >= 60 ? 60 : sizes.filter((n) => n <= total).at(-1) || total;
  const randomSeed = () => (Math.random() * 4294967295) >>> 0 || 1;
  function order(a, q) {
    const list = q.options.map((_, i) => i);
    if (!a.optionSeed || q.sourceType === 'past') return list;
    let x = (a.optionSeed ^ Math.imul(q.id, 2654435761)) >>> 0 || 1;
    for (let i = list.length - 1; i > 0; i--) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      const j = (x >>> 0) % (i + 1);
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  function counts(total) {
    const initial = defaultSize(total);
    return `<fieldset class="length-controls" aria-describedby="pool-status"><legend>Number of questions</legend><div class="count-grid">${sizes.map((n) => `<label class="count-choice"><input type="radio" name="count" value="${n}"${n > total ? ' disabled' : ''}${n === initial ? ' checked' : ''}><span><strong>${n}</strong><small>${n === 60 ? 'Default' : 'Questions'}</small></span></label>`).join('')}</div><label class="count-alt"${!total || sizes.includes(total) ? ' hidden' : ''}><input type="radio" id="count-all" name="count" value="${total}"${initial === total && !sizes.includes(total) ? ' checked' : ''}${!total || sizes.includes(total) ? ' disabled' : ''}> <span id="count-all-label">Use all ${total} matching questions</span></label></fieldset>`;
  }
  function pool(subject, { topic = 'all', level = 'all', source = 'all' } = {}, s = Store.data) {
    if (!Catalog.isCourse(subject)) return [];
    const collection = s.collections.find((c) => c.id === source);
    return Catalog.courses[subject].bank.filter(
      (q) =>
        (topic === 'all' || q.topic === topic) &&
        (level === 'all' || q.level === level) &&
        (source === 'all' ||
          (source === 'saved'
            ? s.saved.includes(q.id)
            : source === 'past' || source === 'revision'
              ? q.sourceType === source
              : collection?.ids.includes(q.id)))
    );
  }
  function make(subject, mode, options = {}) {
    const items = pool(subject, options);
    if (!items.length) return null;
    const chosen = options.shuffle === false ? items : H.shuffle(items);
    const size = H.int(options.count, 1, items.length, defaultSize(items.length));
    const duration = mode === 'exam' ? H.int(options.minutes, 1, 180, size) * 60000 : 0;
    const optionSeed = options.shuffle === false ? 0 : randomSeed();
    const started = Date.now();
    return {
      id: H.uid(),
      subject,
      mode,
      optionSeed,
      kind:
        mode === 'exam'
          ? 'full'
          : options.source && !['all', 'past', 'revision'].includes(options.source)
            ? 'saved'
            : Catalog.isTopic(subject, options.topic)
              ? 'topic'
              : (options.level && options.level !== 'all') ||
                  (options.source && options.source !== 'all')
                ? 'custom'
                : 'quick',
      topic: Catalog.isTopic(subject, options.topic) ? options.topic : null,
      answers: Object.create(null),
      flags: [],
      index: 0,
      ids: chosen.slice(0, size).map((q) => q.id),
      duration,
      remaining: duration,
      deadline: null,
      createdAt: started,
    };
  }
  const left = (a) =>
    a.deadline == null ? a.remaining : Math.max(0, Math.min(a.duration, a.deadline - Date.now()));
  function setup(s, subject, target, mode) {
    const exam = mode === 'exam',
      page = exam ? 'exams' : 'practice';
    const title = exam ? 'Examinations' : 'Practice';
    if (!subject)
      return `${Desk.pick(page, title, exam ? 'Set up a timed mock in just one subject.' : 'Choose one subject. Start with 60 questions or set your own length.')}${exam ? examHistory(s) : ''}`;
    const c = Catalog.courses[subject];
    const pending = s.sessions.filter((a) => a.subject === subject && a.mode === mode);
    const presetTopic = Catalog.isTopic(subject, target) ? target : 'all';
    const source =
      ['saved', 'past', 'revision'].includes(target) || s.collections.some((x) => x.id === target)
        ? target
        : 'all';
    const total = pool(subject, { topic: presetTopic, source }, s).length;
    const sourceOptions = [
      ['all', 'Entire bank'],
      ...(c.bank.some((q) => q.sourceType === 'past') ? [['past', 'Past questions only']] : []),
      ...(c.bank.some((q) => q.sourceType === 'revision')
        ? [['revision', 'Handout revision only']]
        : []),
      ['saved', 'My bookmarked questions'],
      ...s.collections.map((c) => [c.id, c.name]),
    ];
    return `${heading(exam ? 'Set up a timed mock' : 'Build a practice session', c.name, `${Catalog.code} / ${exam ? 'EXAMINATIONS' : 'PRACTICE'}`, courseTabs(page, subject))}
    ${pending.length ? `<div class="panel activity-list pending">${pending.map(UI.resumeRow).join('')}</div>` : ''}
    <div class="split quiz-setup"><section class="panel pad stack"><div class="panel-kicker">${stamp(exam ? 'clipboard' : 'zap', c.tone)}<div><span class="eyebrow">${exam ? 'EXAM SETTINGS' : 'PRACTICE SETTINGS'}</span><h2>${exam ? 'Timed mock exam' : 'Choose your session length'}</h2></div></div>
    <form id="${exam ? 'exam-form' : 'practice-form'}" class="stack session-form" data-subject="${subject}">
      ${exam ? `<div class="notice">${ico('clock')}<span>Set your question count and time limit. Explanations unlock after submission.</span></div>` : ''}
      ${counts(total)}
      <div class="form-grid">${exam ? `<label class="field"><span>Time limit (minutes)</span><input name="minutes" type="number" min="1" max="180" value="${defaultSize(total) || 60}" required></label>` : `<label class="field"><span>Topic</span><select name="topic">${optionList([['all', 'All topics'], ...c.topics.map((t) => [t, Catalog.topics[t]])], presetTopic)}</select></label><label class="field"><span>Difficulty</span><select name="level">${optionList([['all', 'All levels'], ...Object.entries(Catalog.difficulty)], 'all')}</select></label>`}<label class="field"><span>Question source</span><select name="source">${optionList(sourceOptions, source)}</select></label></div>
      <p id="pool-status" class="muted tiny" role="status"></p>
      <label class="check-line"><input name="shuffle" type="checkbox" checked><span>Shuffle questions</span></label>
      <div class="form-actions"><button type="submit" class="btn" id="start-session">${ico(exam ? 'play' : 'zap')} ${exam ? 'Begin mock exam' : 'Start practice'} ${ico('arrow-right')}</button></div>
    </form></section>
    <aside class="panel pad instructions"><span class="eyebrow">BEFORE YOU BEGIN</span><h2>${exam ? 'Exam instructions' : 'How practice works'}</h2><ol>${(exam
      ? [
          [
            'clock',
            'Watch the clock',
            'The timer starts when your exam opens. When it reaches zero your answers are submitted.',
          ],
          [
            'flag',
            'Flag and return',
            'Jump between questions, flag one to revisit, or save and exit to pause.',
          ],
          [
            'check-circle',
            'Review after submitting',
            'Each correct answer earns one point. Blank and wrong answers earn zero.',
          ],
        ]
      : [
          [
            'zap',
            'Learn as you answer',
            'See the correct answer and an explanation as soon as you choose an option.',
          ],
          [
            'flag',
            'Set questions aside',
            'Flag for review during the session or bookmark a question for later.',
          ],
          [
            'device',
            'Pick up where you left off',
            'Your last answer and position are kept in this browser.',
          ],
        ]
    )
      .map(
        ([icon, t, d]) =>
          `<li>${stamp(icon, c.tone)}<div><strong>${t}</strong><p>${d}</p></div></li>`
      )
      .join(
        ''
      )}</ol>${!exam ? btn(`Quick start · ${defaultSize(c.bank.length)}`, 'quick-start', { kind: 'secondary', icon: 'zap', data: { subject } }) : ''}</aside></div>${exam ? examHistory(s, subject) : ''}`;
  }
  function examHistory(s, subject) {
    const history = s.history.filter(
      (a) => a.mode === 'exam' && (!subject || a.subject === subject)
    );
    return `<section class="spaced">${sec('Examination history', H.plural(history.length, 'submitted mock'))}${history.length ? `<div class="panel activity-list">${history.map(UI.resultRow).join('')}</div>` : empty('clipboard', 'No mock exams yet', 'After you submit an examination, you can review its score and all your answers here.')}</section>`;
  }
  function map(a) {
    return a.ids
      .map((id, i) => {
        const answered = Object.hasOwn(a.answers, id),
          flagged = a.flags.includes(id);
        return `<button class="map-cell${answered ? ' answered' : ''}${flagged ? ' flagged' : ''}" type="button" data-action="jump" data-index="${i}"${i === a.index ? ' aria-current="step"' : ''} aria-label="Question ${i + 1}, ${answered ? 'answered' : 'unanswered'}${flagged ? ', flagged' : ''}">${i + 1}</button>`;
      })
      .join('');
  }
  function feedback(a, q) {
    if (a.mode === 'exam' || !Object.hasOwn(a.answers, q.id)) return '';
    return (
      UI.note(
        `${a.answers[q.id] === q.answer ? 'Correct.' : 'Not quite.'} The answer is ${'ABCD'[order(a, q).indexOf(q.answer)]}: ${q.options[q.answer]}`,
        a.answers[q.id] === q.answer ? 'check-circle' : 'info',
        a.answers[q.id] === q.answer ? '' : 'warn'
      ) + UI.explain(q)
    );
  }
  function view(a) {
    const c = Catalog.courses[a.subject],
      q = Catalog.get(a.ids[a.index]);
    const exam = a.mode === 'exam',
      g = Stats.grade(a),
      selected = a.answers[q.id];
    return `<div class="quiz-head">${heading(UI.attemptName(a), c.name, `${Catalog.code} / ${exam ? 'EXAMINATION' : 'PRACTICE'}`, `<div class="cluster quiz-controls">${exam ? `<div class="timer" role="timer" aria-label="Time remaining">${ico('clock')}<strong id="timer" class="tabular">${H.clock(left(a))}</strong><span class="sr-only"> remaining</span>${UI.progress(left(a), a.duration, 'Time left in mock exam')}</div>` : ''}${btn('Save & exit', 'save-exit', { icon: 'device', kind: 'secondary' })}</div>`)}</div>
    <div class="quiz-layout"><section class="panel pad question-panel" aria-labelledby="question-title"><div class="spread question-meta wrap"><div class="cluster">${tag(`QUESTION ${H.pad(a.index + 1)} / ${H.pad(a.ids.length)}`, c.tone)}${tag(Catalog.topics[q.topic])}${tag(Catalog.difficulty[q.level])}</div><div class="cluster">${UI.bookmarks(q)}${UI.iconBtn(a.flags.includes(q.id) ? 'Remove review flag' : 'Flag for review', 'flag', 'flag', {}, a.flags.includes(q.id))}</div></div>
    <h2 id="question-title" dir="auto" tabindex="-1">${UI.rich(q.text)}</h2><fieldset id="option-list"><legend class="sr-only">Select one answer</legend>${options(a, q)}</fieldset>
    <span id="answer-announce" class="sr-only" role="status"></span><div id="feedback" class="answer-feedback">${feedback(a, q)}</div><div class="spread question-foot wrap"><div class="cluster">${btn('Previous', 'jump', { icon: 'arrow-left', kind: 'secondary', disabled: a.index === 0, data: { index: a.index - 1 } })}${btn('Clear answer', 'clear-answer', { plain: true, disabled: selected == null })}</div>${a.index < a.ids.length - 1 ? btn('Next question', 'jump', { end: 'arrow-right', data: { index: a.index + 1 } }) : btn('Submit session', 'submit-quiz', { end: 'check' })}</div></section>
    <aside class="panel pad navigator" aria-label="Question navigator"><div class="spread"><h2>Question navigator</h2>${tag(exam ? 'Timed' : 'Untimed')}</div><div id="answered-line">${UI.line('Answered', g.answered, g.total)}</div><div id="question-map" class="question-map">${map(a)}</div><div class="map-legend"><span><i></i> Current</span><span><i></i> Answered</span><span><i></i> Flagged</span></div><div class="stack navigator-actions">${btn(exam ? 'Submit exam' : 'Finish practice', 'submit-quiz', { icon: 'check-circle' })}${btn('Restart session', 'restart', { kind: 'secondary', icon: 'refresh' })}</div><p class="muted tiny">${ico('device')} ${Store.available ? 'Saved in this browser' : 'Progress lasts until you close this view'}</p></aside></div>`;
  }
  function options(a, q) {
    const answer = a.answers[q.id],
      revealed = a.mode !== 'exam' && answer != null;
    return order(a, q)
      .map(
        (i, slot) =>
          `<label class="option${answer === i ? ' selected' : ''}${revealed && i === q.answer ? ' correct' : ''}${revealed && answer === i && i !== q.answer ? ' incorrect' : ''}"><input type="radio" name="answer" value="${i}"${answer === i ? ' checked' : ''}><span class="option-letter">${'ABCD'[slot]}</span><span class="option-text"${UI.arabicOnly(q.options[i]) ? ' lang="ar" dir="rtl"' : ''}>${UI.rich(q.options[i])}</span><span class="option-mark">${revealed && i === q.answer ? ico('check') : revealed && answer === i ? ico('x') : ''}</span></label>`
      )
      .join('');
  }
  function result(a, filter) {
    const c = Catalog.courses[a.subject],
      g = Stats.grade(a);
    return `${heading(a.mode === 'exam' ? 'Examination result' : 'Practice summary', `${c.name} · ${H.date(a.completedAt)}`, `${Catalog.code} / ANSWER REVIEW`, link('Performance', '#performance/' + a.subject, { kind: 'secondary', icon: 'chart' }))}
    <section class="result-hero"><div><span class="hero-tag">${ico(a.expired ? 'clock' : 'check-circle')} ${a.expired ? 'TIME IS UP' : 'SESSION SUBMITTED'}</span><h2>${g.percent >= 75 ? 'Strong work.' : g.percent >= 45 ? 'Good progress.' : 'Keep building.'}</h2><p>${g.correct} of ${g.total} questions correct. ${g.blank ? `${H.plural(g.blank, 'unanswered question')}.` : ''}</p>${link('Practise again', `#${a.mode === 'exam' ? 'exams' : 'practice'}/${a.subject}`, { kind: 'signal', end: 'arrow-right' })}</div><div class="score-ring" aria-label="Score ${g.percent} percent" role="img">${UI.ring(g.correct, g.total, 'Score')}<strong>${g.percent}%</strong></div></section>
    <section class="metrics review-metrics" aria-label="Score breakdown">${UI.med('check-circle', 'lime', 'Correct', g.correct, '')}${UI.med('x', 'rose', 'Incorrect', g.wrong, '')}${UI.med('minus', 'sand', 'Unanswered', g.blank, '')}</section>
    <section class="spaced">${sec('Review your answers', 'Open any question to see its answer and explanation.')}<div class="tabs review-tabs" aria-label="Filter review">${[
      ['all', 'All', g.total],
      ['correct', 'Correct', g.correct],
      ['wrong', 'Incorrect', g.wrong],
      ['blank', 'Unanswered', g.blank],
    ]
      .map(([k, l, n]) => tab(l, 'review-filter', k, filter === k, n))
      .join('')}</div><div class="q-list" id="review-list">${review(a, filter)}</div></section>`;
  }
  function review(a, filter) {
    const rows = a.ids
      .map((id, i) => {
        const q = Catalog.get(id),
          chosen = a.answers[id];
        return {
          q,
          number: i + 1,
          chosen,
          status: chosen == null ? 'blank' : chosen === q.answer ? 'correct' : 'wrong',
        };
      })
      .filter((r) => filter === 'all' || filter === r.status);
    return rows.length
      ? rows.map((r) => UI.question(r.q, { ...r, result: true })).join('')
      : empty('list', 'Nothing to review here', 'Choose a different answer filter.');
  }
  return {
    sizes,
    defaultSize,
    randomSeed,
    order,
    pool,
    make,
    left,
    setup,
    map,
    feedback,
    options,
    view,
    result,
    review,
  };
})();
