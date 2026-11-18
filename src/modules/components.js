// Reusable semantic templates. Escape every dynamic string and attribute at the sink.
const UI = (() => {
  const { esc } = H;
  const arabicOnly = (value) =>
    /\p{Script=Arabic}/u.test(value) && !/\p{Script=Latin}/u.test(value);
  const arabicPhrase =
    /([\p{Script_Extensions=Arabic}\u200c\u200d]+(?: +[\p{Script_Extensions=Arabic}\u200c\u200d]+)*)/gu;
  // Escape each segment before adding direction/language metadata for Arabic learners and AT.
  const rich = (value) =>
    String(value ?? '')
      .split(arabicPhrase)
      .map((part, i) => (i % 2 ? `<bdi lang="ar" dir="rtl">${esc(part)}</bdi>` : esc(part)))
      .join('');
  const ico = (name, cls = '') =>
    `<svg class="${esc(cls)}" aria-hidden="true" focusable="false"><use href="#i-${esc(name)}"/></svg>`;
  const stamp = (icon, tone = 'lime') =>
    `<span class="stamp tone-${esc(tone)}">${ico(icon)}</span>`;
  const values = (data) =>
    Object.entries(data || {})
      .map(([key, value]) => ` data-${key}="${esc(value)}"`)
      .join('');
  const link = (label, href, cfg = {}) =>
    `<a class="${cfg.plain ? 'text-link' : `btn ${esc(cfg.kind || '')}`}" href="${esc(href)}"${cfg.label ? ` aria-label="${esc(cfg.label)}"` : ''}>${cfg.icon ? ico(cfg.icon) : ''}${esc(label)}${cfg.end ? ico(cfg.end) : ''}</a>`;
  const btn = (label, action, cfg = {}) =>
    `<button type="button" class="${cfg.plain ? 'text-link' : `btn ${esc(cfg.kind || '')}`}" data-action="${esc(action)}"${values(cfg.data)}${cfg.disabled ? ' disabled' : ''}${cfg.pressed == null ? '' : ` aria-pressed="${cfg.pressed}"`}>${cfg.icon ? ico(cfg.icon) : ''}${esc(label)}${cfg.end ? ico(cfg.end) : ''}</button>`;
  const iconBtn = (label, icon, action, data = {}, pressed = null, disabled = false) =>
    `<button type="button" class="icon-btn" aria-label="${esc(label)}" title="${esc(label)}" data-action="${esc(action)}"${values(data)}${pressed == null ? '' : ` aria-pressed="${pressed}"`}${disabled ? ' disabled' : ''}>${ico(icon)}</button>`;
  const tag = (label, tone = '', icon = '') =>
    `<span class="chip${tone ? ` tone-${esc(tone)}` : ''}">${icon ? ico(icon) : ''}${esc(label)}</span>`;
  const heading = (title, description, label = '', aside = '') =>
    `<header class="phead"><div>${label ? `<span class="eyebrow">${esc(label)}</span>` : ''}<h1 tabindex="-1">${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ''}</div>${aside}</header>`;
  const sec = (title, description = '', aside = '') =>
    `<div class="section-title"><div><h2>${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ''}</div>${aside}</div>`;
  const empty = (icon, title, copy, action = '') =>
    `<div class="empty">${stamp(icon)}<h3>${esc(title)}</h3><p>${esc(copy)}</p>${action}</div>`;
  const note = (message, icon = 'info', variant = '') =>
    `<p class="notice ${esc(variant)}">${ico(icon)}<span>${rich(message)}</span></p>`;
  const progress = (n, max, label) =>
    `<progress value="${Math.max(0, Math.min(n, max))}" max="${Math.max(1, max)}" aria-label="${esc(label)}"></progress>`;
  const line = (label, n, max, count = `${n} / ${max}`) =>
    `<div class="progress-line"><div class="spread"><span>${esc(label)}</span><strong>${esc(count)}</strong></div>${progress(n, max, label)}</div>`;
  const ring = (n, max, label) =>
    `<div class="ring" role="img" aria-label="${esc(label)}: ${n} of ${max}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="ring-track" cx="50" cy="50" r="41"/><circle class="ring-arc" cx="50" cy="50" r="41" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100 - Math.min(100, H.percent(n, max))}"/></svg><div><strong>${n}</strong><small>of ${max}</small></div></div>`;
  const optionList = (pairs, selected) =>
    pairs
      .map(
        ([id, label]) =>
          `<option value="${esc(id)}"${selected === id ? ' selected' : ''}>${esc(label)}</option>`
      )
      .join('');
  const tab = (label, action, id, selected, n = null) =>
    `<button class="tab" type="button" data-action="${esc(action)}" data-value="${esc(id)}" aria-pressed="${selected}">${esc(label)}${n == null ? '' : `<span class="tab-number">${n}</span>`}</button>`;
  const courseTabs = (page, subject, includeAll = false) =>
    `<nav class="tabs course-tabs" aria-label="Choose subject">${(includeAll
      ? [[null, 'All subjects', 'books']]
      : []
    )
      .concat(
        Catalog.keys.map((slug) => [slug, Catalog.courses[slug].name, Catalog.courses[slug].icon])
      )
      .map(
        ([slug, name, icon]) =>
          `<a class="tab" href="#${page}${slug ? '/' + slug : ''}"${slug === subject ? ' aria-current="page"' : ''}>${ico(icon)}${esc(name)}</a>`
      )
      .join('')}</nav>`;
  const courseOptions = () => Catalog.keys.map((slug) => [slug, Catalog.courses[slug].name]);
  const bookmarks = (q, extra = {}) =>
    iconBtn(
      Store.data.saved.includes(q.id) ? 'Remove bookmark' : 'Bookmark question',
      'bookmark',
      'bookmark',
      { qid: q.id, ...extra },
      Store.data.saved.includes(q.id)
    );
  const explain = (q) => {
    const ref = H.safeRef(q.reference?.url);
    return `<div class="explain"><strong>Why this is correct</strong><p>${rich(q.explanation)}</p>${q.note ? `<p class="muted tiny"><strong>Source note:</strong> ${esc(q.note)}</p>` : ''}${q.origin ? `<p class="source-line muted tiny">${esc(q.origin)}</p>` : ''}${ref ? `<a class="text-link" href="${esc(ref)}" target="_blank" rel="noopener noreferrer">${esc(q.reference.label)}${ico('arrow-up-right')}</a>` : ''}</div>`;
  };
  const questionAnswers = (q, chosen = null, order = null) =>
    `<ul class="answers-read">${(order || q.options.map((_, i) => i)).map((i, slot) => `<li class="${i === q.answer ? 'right' : i === chosen ? 'wrong' : ''}"><span>${'ABCD'[slot]}</span><div>${rich(q.options[i])}${i === q.answer ? '<small>Correct answer</small>' : i === chosen ? '<small>Your answer</small>' : ''}</div></li>`).join('')}</ul>${explain(q)}`;
  function question(
    q,
    {
      chosen = null,
      result = false,
      number = q.number,
      open = false,
      manage = false,
      order = null,
    } = {}
  ) {
    const state =
      chosen === q.answer
        ? ['Correct', 'lime']
        : chosen == null
          ? ['Unanswered', 'sand']
          : ['Incorrect', 'rose'];
    return `<article class="q-row" data-qid="${q.id}"><details class="q-details"${open ? ' open' : ''}><summary><span class="q-number">${H.pad(number)}</span><span class="q-summary"><small>${esc(Catalog.topics[q.topic])} · ${q.sourceType === 'past' ? 'Past paper' : 'Revision'}</small><strong dir="auto">${rich(q.text)}</strong></span>${result ? tag(...state) : ''}${ico('chevron-down', 'q-chevron')}</summary><div class="q-content">${open ? questionAnswers(q, chosen, order) : ''}</div></details><div class="q-acts">${bookmarks(q)}${manage ? iconBtn('Organise saved question', 'folder', 'organise', { qid: q.id }) : ''}</div></article>`;
  }
  const attemptName = (a) =>
    a.mode === 'exam'
      ? 'Timed mock'
      : {
          quick: 'Quick practice',
          topic: 'Topic practice',
          saved: 'Saved-question practice',
          custom: 'Custom practice',
        }[a.kind] || 'Practice';
  const resultRow = (a) => {
    const g = Stats.grade(a);
    const course = Catalog.courses[a.subject];
    return `<a class="activity-row" href="#result/${esc(a.id)}">${stamp(a.mode === 'exam' ? 'clipboard' : 'zap', course.tone)}<span class="activity-label"><strong>${esc(attemptName(a))}</strong><small>${esc(course.short)} · ${esc(H.date(a.completedAt))}</small></span><span class="activity-score">${g.percent}%</span>${ico('chevron-right')}</a>`;
  };
  const resumeRow = (a) =>
    `<a class="activity-row resume-row" href="#quiz/${esc(a.id)}">${stamp('play', Catalog.courses[a.subject].tone)}<span class="activity-label"><strong>Resume ${esc(a.mode === 'exam' ? 'mock exam' : 'practice')}</strong><small>${esc(Catalog.courses[a.subject].short)} · Question ${a.index + 1} of ${a.ids.length}</small></span>${ico('arrow-right')}</a>`;
  const med = (icon, tone, title, value, suffix, foot = '') =>
    `<article class="panel metric"><div class="metric-top">${stamp(icon, tone)}<span>${esc(title)}</span></div><div class="metric-value tabular" role="img" aria-label="${esc(`${value}${suffix || ''}`)}">${typeof value === 'number' && value > 0 ? `<span data-count="${value}">${value}</span>` : esc(value)}${suffix ? `<small>${esc(suffix)}</small>` : ''}</div>${foot ? `<p>${esc(foot)}</p>` : ''}</article>`;
  return {
    ico,
    rich,
    arabicOnly,
    stamp,
    link,
    btn,
    iconBtn,
    tag,
    heading,
    sec,
    empty,
    note,
    progress,
    line,
    ring,
    optionList,
    tab,
    courseTabs,
    courseOptions,
    bookmarks,
    explain,
    question,
    questionAnswers,
    attemptName,
    resultRow,
    resumeRow,
    med,
  };
})();
