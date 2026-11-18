// Dashboard, course library and subject-scoped study bank.
const Desk = (() => {
  const { ico, stamp, tag, link, btn, heading, sec, line, empty, courseTabs, tab, med } = UI;
  const coverage = (sum, course) => course.bank.filter((q) => sum.unique.has(q.id)).length;
  function card(course, sum, compact = false) {
    const id = course.slug,
      attempted = coverage(sum, course),
      total = course.bank.length;
    return `<article class="panel course-card ${compact ? 'course-compact' : ''}">
      <div class="course-banner tone-${course.tone}">${stamp(course.icon, course.tone)}<span class="course-code">${Catalog.code} <span> / </span> ${H.pad(Catalog.keys.indexOf(id) + 1)}</span><span class="course-ornament" aria-hidden="true"></span></div>
      <div class="course-body"><div class="eyebrow">${H.esc(course.area)}</div><h${compact ? 3 : 2}><a href="#courses/${id}">${H.esc(course.name)}</a></h${compact ? 3 : 2}><p>${H.esc(course.description)}</p>
      ${!compact ? `<div class="cluster course-labels">${tag(H.plural(total, 'question'), 'lime', 'list')}${tag(H.plural(course.topics.length, 'topic'), 'lilac')}${tag('3 indicative levels')}</div>` : ''}
      ${line(compact ? 'Question coverage' : 'Unique questions answered', attempted, total, `${attempted} / ${total}`)}
      ${!compact ? `<div class="cluster">${course.topics.map((topic) => link(Catalog.topics[topic], `#study/${id}/${topic}`, { plain: true })).join('')}</div>` : ''}
      <div class="cluster course-links">${link(compact ? 'Open course' : 'Practice', compact ? `#courses/${id}` : `#practice/${id}`, { end: 'arrow-right', label: `${compact ? 'Open course' : 'Practise'}: ${course.name}` })}${compact ? tag(H.plural(total, 'question')) : link('Examination', `#exams/${id}`, { kind: 'secondary', icon: 'clipboard' })}</div></div>
    </article>`;
  }
  function goal(s, day) {
    const n = day.todayAnswered,
      target = s.prefs.goal;
    return `<section class="panel day-card" aria-labelledby="day-title"><div class="spread"><span class="eyebrow">${ico('target')} DAILY FOCUS</span>${UI.iconBtn('Edit study goals', 'edit', 'goals')}</div>
      <h2 id="day-title">Today’s goal</h2>
      <div class="day-body">${UI.ring(n, target, 'Questions answered today')}<div><strong>${n >= target ? 'Goal complete!' : 'Questions completed'}</strong><small>${n >= target ? 'Nice work showing up.' : 'Answers from submitted quizzes'}</small></div></div>
      <ol class="week" aria-label="Last seven study days">${day.week.map((d) => `<li class="${d.today ? 'is-today' : ''} ${d.active ? 'did-study' : ''}" aria-label="${H.esc(H.weekday(d.day))}: ${d.active ? 'studied' : 'no study logged'}${d.today ? ', today' : ''}"><span>${H.weekday(d.day).slice(0, 1)}</span><i>${d.active ? ico('check') : ''}</i></li>`).join('')}</ol>
      <p class="day-foot">${ico('layers')} ${day.todayCards} / ${s.prefs.cardGoal} cards today <span class="day-sessions">${H.plural(day.todaySessions, 'session')} today</span></p></section>`;
  }
  function dashboard(s) {
    const sum = Stats.digest(s.history),
      day = Stats.current(s, sum);
    const resume = s.sessions[0],
      reminder = Stats.due(s)[0],
      weak = Stats.weak(sum)[0];
    return `<header class="dash-head"><div><div class="eyebrow dash-kicker"><i></i> LEARNING WORKSPACE <span> / </span> 200 LEVEL</div><h1 tabindex="-1">Welcome back, ${H.esc(s.prefs.name)}<span>.</span></h1><p>Pick up where you left off, or choose your next subject.</p></div><span class="dash-date">${ico('calendar')}${H.esc(H.longDate())}</span></header>
    <div class="bento hero-grid"><section class="desk-hero" aria-labelledby="hero-title" data-kinetic><span class="hero-art" aria-hidden="true"></span><span class="hero-glint" aria-hidden="true"></span><div class="hero-inner"><div class="hero-tag">${ico('sparkle')} ${Catalog.code} REVISION</div><h2 id="hero-title">Make it<br><em>stick.</em></h2><p>Practise with questions from your course handouts, then revisit what you missed.</p><div class="cluster">${resume ? link('Resume session', `#quiz/${resume.id}`, { kind: 'signal', icon: 'play', end: 'arrow-right' }) : link('Start practice', '#practice', { kind: 'signal', icon: 'zap', end: 'arrow-right' })}${link('Explore courses', '#courses', { kind: 'hero-link', end: 'arrow-up-right' })}</div></div><div class="hero-caption" aria-hidden="true"><i></i> HIKMAHPREP <span>LOCAL EDITION</span></div></section>
    ${goal(s, day)}</div>
    <section class="metrics" aria-label="Your study numbers">
      ${med('book', 'lime', 'Bank coverage', sum.unique.size, ` / ${Catalog.all.length}`, 'Unique questions answered')}
      ${med('target', 'lilac', 'Accuracy', sum.accuracy == null ? '—' : `${sum.accuracy}%`, '', sum.answered ? 'Across submitted answers' : 'No answers submitted yet')}
      ${med('flame', 'sand', 'Study streak', day.streak, ` ${day.streak === 1 ? 'day' : 'days'}`, 'Study on consecutive days')}
      ${med('activity', 'blue', 'Questions attempted', sum.answered, '', 'Includes repeat practice')}
    </section>
    <section class="shelf-section" aria-label="Your courses" data-reveal>${sec('Your courses', 'Three separate question banks.', link('View library', '#courses', { plain: true, end: 'arrow-right' }))}<div class="course-grid">${Catalog.keys.map((id) => card(Catalog.courses[id], sum, true)).join('')}</div></section>
    <div class="bento activity-zone" data-reveal><section aria-label="Study activity">${sec('Recent activity', 'Your latest sessions.', link('View all', '#performance', { plain: true, end: 'arrow-right' }))}<div class="panel activity-list">${s.sessions.slice(0, 2).map(UI.resumeRow).join('') + s.history.slice(0, 3).map(UI.resultRow).join('') || `<div class="activity-blank">${stamp('history', 'lilac')}<div><strong>No activity yet</strong><p>After your first session, you’ll see your progress here.</p></div></div>`}</div>
    <section class="panel pad notebook-teaser"><div class="panel-kicker">${stamp('edit', 'lilac')}<div><span class="eyebrow">YOUR NOTEBOOK</span><h3>${s.notes.length ? H.plural(s.notes.length, 'study note') : 'Write it in your own words'}</h3></div></div><p class="muted tiny">Jot down useful examples and tricky ideas as you revise.</p>${link('Open notes', '#notes', { plain: true, end: 'arrow-right' })}</section></section>
    <div class="day-stack"><section class="panel pad"><div class="panel-kicker">${stamp('sparkle', 'lime')}<div><span class="eyebrow">RECOMMENDED REVISION</span><h3>${weak ? H.esc(Catalog.topics[weak.topic]) : 'Start with practice'}</h3></div></div><p class="muted tiny">${weak ? `You got ${weak.correct} of ${weak.answered} answered questions right in this topic.` : 'We’ll suggest topics to revisit after you submit an attempt.'}</p>${link(weak ? 'Revise this topic' : 'Choose a subject', weak ? `#practice/${weak.subject}/${weak.topic}` : '#practice', { plain: true, end: 'arrow-right' })}</section>
    <section class="panel pad"><div class="panel-kicker">${stamp('calendar', 'sand')}<div><span class="eyebrow">UPCOMING EXAMS</span><h3>${reminder ? H.esc(reminder.label) : 'No reminders set'}</h3></div></div><p class="muted tiny">${reminder ? `${H.esc(Catalog.courses[reminder.subject].short)} · ${H.esc(H.date(H.dayAt(reminder.day)))}` : 'Add an exam date from your timetable.'}</p>${link(reminder ? 'View reminders' : 'Add a reminder', '#announcements/reminders', { plain: true, end: 'arrow-right' })}</section></div></div>`;
  }
  function courses(s, subject) {
    const sum = Stats.digest(s.history);
    if (!subject)
      return `${heading('My courses', 'Explore your three subject banks and plan your revision.', `${Catalog.code} / COURSE LIBRARY`, tag('200 Level', 'lime', 'cap'))}<div class="course-grid library">${Catalog.keys.map((key) => card(Catalog.courses[key], sum)).join('')}</div>`;
    const course = Catalog.courses[subject];
    return `${heading(course.name, course.description, `${Catalog.code} / COURSE LIBRARY`, courseTabs('courses', subject))}
      <div class="split"><section class="panel pad stack"><div class="panel-kicker">${stamp(course.icon, course.tone)}<div><span class="eyebrow">${H.esc(course.area)}</span><h2>Course overview</h2></div></div>${line('Unique questions answered', coverage(sum, course), course.bank.length)}<div class="cluster">${Object.entries(
        Catalog.difficulty
      )
        .map(([key, title]) =>
          tag(`${title} · ${course.bank.filter((q) => q.level === key).length}`, course.tone)
        )
        .join(
          ''
        )}</div><p class="muted tiny">Difficulty bands are study aids, not university ratings.</p><div class="cluster">${link('Read question bank', `#study/${subject}`, { icon: 'book' })}${link('Practise', `#practice/${subject}`, { kind: 'secondary', icon: 'zap' })}${link('Timed mock', `#exams/${subject}`, { kind: 'secondary', icon: 'clipboard' })}${link('Course notes', `#notes/${subject}`, { kind: 'secondary', icon: 'edit' })}</div></section>
      <section class="panel pad">${sec('Topic map', 'Open a topic to study its questions.')}<div class="topic-list">${course.topics.map((topic) => `<div class="topic-row"><a href="#study/${subject}/${topic}"><strong>${H.esc(Catalog.topics[topic])}</strong><small>${H.plural(course.bank.filter((q) => q.topic === topic).length, 'question')}</small></a>${UI.iconBtn(Store.data.savedTopics.includes(Catalog.topicKey(subject, topic)) ? 'Remove topic bookmark' : 'Bookmark ' + Catalog.topics[topic], 'bookmark', 'topic-save', { subject, topic }, Store.data.savedTopics.includes(Catalog.topicKey(subject, topic)))}</div>`).join('')}</div></section></div>
      <section class="spaced" data-reveal aria-labelledby="revision-guide-title"><div class="section-title"><div><h2 id="revision-guide-title">Revision guide</h2><p>Key ideas to review before starting a session.</p></div></div><div class="study-guide">${STUDY_GUIDES[subject].map((item) => `<details class="guide-entry"><summary>${H.esc(item.title)} <small>${H.esc(item.pages)}</small></summary><p>${UI.rich(item.body)}</p></details>`).join('')}</div><p class="source muted tiny">${ico('info')} ${H.esc(course.credit)}</p></section>`;
  }
  function pick(page, title, copy) {
    return `${heading(title, copy, `${Catalog.code} / ${page === 'study' ? 'READ & REVISE' : 'PREPARE'}`)}<div class="course-grid pick-grid">${Catalog.keys
      .map((key) => {
        const c = Catalog.courses[key];
        return `<article class="panel pad pick-card tone-${c.tone}"><div class="spread">${stamp(c.icon, c.tone)}${tag(H.plural(c.bank.length, 'question'))}</div><h2>${H.esc(c.name)}</h2><p>${H.esc(c.description)}</p>${link(page === 'study' ? 'Open question bank' : page === 'exams' ? 'Set up mock' : 'Choose practice', `#${page}/${key}`, { end: 'arrow-right', label: `${page === 'study' ? 'Open question bank' : page === 'exams' ? 'Set up mock' : 'Choose practice'}: ${c.name}` })}</article>`;
      })
      .join('')}</div>`;
  }
  function bank(s, subject, filt, detail) {
    if (!subject)
      return pick(
        'study',
        'Study',
        'Choose a subject to read practice questions and explanations.'
      );
    const c = Catalog.courses[subject];
    return `${heading('Question bank', `${c.name} · ${H.plural(c.bank.length, 'question')}`, `${Catalog.code} / STUDY`, courseTabs('study', subject))}<section class="panel pad bank-controls" aria-label="Question bank filters"><div class="search-field"><label class="sr-only" for="bank-query">Search this question bank</label>${ico('search')}<input class="search-input" type="search" id="bank-query" placeholder="Search keywords or #question…" value="${H.esc(filt.q)}" maxlength="100" autocomplete="off"></div><label class="field"><span>Difficulty</span><select id="bank-level">${UI.optionList([['all', 'All levels'], ...Object.entries(Catalog.difficulty)], filt.level)}</select></label><div class="tabs topic-tabs" aria-label="Filter topics">${tab('All topics', 'bank-topic', 'all', filt.topic === 'all', c.bank.length)}${c.topics.map((t) => tab(Catalog.topics[t], 'bank-topic', t, filt.topic === t, c.bank.filter((q) => q.topic === t).length)).join('')}</div></section><div id="bank-results">${bankResults(subject, filt, detail)}</div><p class="source muted tiny">${ico('info')} ${H.esc(c.credit)} ${subject === 'arabic' ? 'Revision items cite the relevant handout pages.' : 'Past-question numbering is preserved. Revision material is not an official answer key.'}</p>`;
  }
  function bankResults(subject, filt, detail) {
    const c = Catalog.courses[subject];
    const items = c.bank.filter(
      (q) =>
        (filt.topic === 'all' || q.topic === filt.topic) &&
        (filt.level === 'all' || q.level === filt.level) &&
        Catalog.search(q, filt.q)
    );
    return `<div class="bank-summary spread wrap"><span role="status">${H.plural(items.length, 'question')}</span>${filt.topic === 'all' ? link('Practise this subject', `#practice/${subject}`, { plain: true, end: 'arrow-right' }) : `<div class="cluster">${btn(Store.data.savedTopics.includes(Catalog.topicKey(subject, filt.topic)) ? 'Unsave topic' : 'Save topic', 'topic-save', { data: { subject, topic: filt.topic }, icon: 'bookmark', kind: 'secondary', pressed: Store.data.savedTopics.includes(Catalog.topicKey(subject, filt.topic)) })}${link('Practise this topic', `#practice/${subject}/${filt.topic}`, { plain: true, end: 'arrow-right' })}</div>`}</div><div class="q-list">${items.length ? items.map((q) => UI.question(q, { open: String(q.number) === detail })).join('') : empty('search', 'No matches', 'Try another keyword, difficulty or topic.', btn('Clear filters', 'bank-clear', { kind: 'secondary' }))}</div>`;
  }
  return { dashboard, courses, pick, bank, bankResults };
})();
