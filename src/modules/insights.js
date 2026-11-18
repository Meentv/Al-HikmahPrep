// Local analytics, reminders, achievements and student settings.
const Insights = (() => {
  const {
    ico,
    stamp,
    tag,
    btn,
    link,
    heading,
    sec,
    line,
    empty,
    tab,
    med,
    note,
    optionList,
    courseTabs,
  } = UI;
  function chart(total) {
    const rows = Object.entries(total.daily)
      .filter(([, v]) => v.answered)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10);
    if (!rows.length)
      return `<div class="chart-empty"><div aria-hidden="true"></div><p>${ico('activity')} No submitted answers in this range.</p></div>`;
    const points = rows.map(([day, n]) => ({ day, ...n, pct: H.percent(n.correct, n.answered) }));
    const delta = points.at(-1).pct - points[0].pct;
    const change =
      points.length > 1
        ? `<p class="muted tiny trend-change">${delta === 0 ? 'No change' : 'Change: ' + (delta > 0 ? '+' : '') + delta + ' percentage points'} from first to latest day shown.</p>`
        : '';
    return `<figure class="trend" aria-label="Accuracy by active study day"><div class="trend-axis" aria-hidden="true"><span>100%</span><span>50%</span><span>0%</span></div><div class="trend-plot" style="--columns:${points.length}">${points.map((v) => `<div class="trend-slot" title="${H.esc(H.date(H.dayAt(v.day)))}: ${v.pct}% accuracy"><span class="trend-stick" style="--amount:${v.pct}%" aria-hidden="true"></span><span class="trend-key">${H.esc(v.day.slice(5).replace('-', '/'))}</span></div>`).join('')}</div></figure>${change}<details class="data-table"><summary>View chart data</summary><table><thead><tr><th scope="col">Study day</th><th scope="col">Answered</th><th scope="col">Accuracy</th></tr></thead><tbody>${points.map((v) => `<tr><td>${H.esc(H.date(H.dayAt(v.day)))}</td><td>${v.answered}</td><td>${v.pct}%</td></tr>`).join('')}</tbody></table></details>`;
  }
  function performance(s, subject, range) {
    const sum = Stats.digest(s.history, subject, range),
      day = Stats.current(s),
      weak = Stats.weak(sum);
    const subjects = subject ? [subject] : Catalog.keys;
    return `${heading('Performance', 'See what you know and what needs another look.', `${Catalog.code} / STUDY INSIGHTS`, courseTabs('performance', subject, true))}
      <div class="spread wrap filters"><span class="muted tiny">All metrics reflect submitted sessions on this browser.</span><div class="tabs" aria-label="Date range">${[
        ['7', '7 days'],
        ['30', '30 days'],
        ['all', 'All time'],
      ]
        .map(([v, l]) => tab(l, 'range', v, range === v))
        .join('')}</div></div>
      <section class="metrics" aria-label="Answer analytics">${med('target', 'lilac', 'Overall accuracy', sum.accuracy == null ? '—' : `${sum.accuracy}%`, '', 'Correct / answered')}${med('activity', 'blue', 'Questions attempted', sum.answered, '', 'Includes repeat attempts')}${med('check-circle', 'lime', 'Correct answers', sum.correct, '')}${med('x', 'rose', 'Incorrect answers', sum.wrong, '')}</section>
      <div class="split performance-layout"><section class="panel pad">${sec('Accuracy over time', 'The last 10 active study days in this range.')}${chart(sum)}</section><section class="panel pad stack">${sec('Course performance', 'Coverage includes unique answered questions.')}${subjects
        .map((k) => {
          const c = Catalog.courses[k],
            n = c.bank.filter((q) => sum.unique.has(q.id)).length;
          const sub = subject ? sum : Stats.digest(s.history, k, range);
          return `<div class="course-stat"><div class="panel-kicker">${stamp(c.icon, c.tone)}<strong>${H.esc(c.name)}</strong></div>${line('Coverage', n, c.bank.length)}<span class="muted tiny">${sub.accuracy == null ? 'No answers submitted' : `${sub.accuracy}% accuracy · ${H.plural(sub.answered, 'answer')}`}</span></div>`;
        })
        .join('')}</section></div>
      <div class="split spaced" data-reveal><section class="panel pad">${sec('Topic performance', 'Answers, not guesses about your ability.')}${
        Object.values(sum.topics).length
          ? `<div class="topic-stats">${Object.values(sum.topics)
              .sort(
                (a, b) =>
                  a.subject.localeCompare(b.subject) ||
                  Catalog.topics[a.topic].localeCompare(Catalog.topics[b.topic])
              )
              .map(
                (t) =>
                  `${line(`${Catalog.topics[t.topic]} · ${Catalog.courses[t.subject].short}`, t.correct, t.answered, `${t.correct}/${t.answered} · ${H.percent(t.correct, t.answered)}%`)}`
              )
              .join('')}</div>`
          : `<p class="muted tiny">Submit a practice session to see accuracy by topic.</p>`
      }</section><section class="panel pad stack">${sec('Topics to revisit', 'Sorted by your lowest accuracy.')}${
        weak.length
          ? weak
              .slice(0, 4)
              .map(
                (t) =>
                  `<div class="topic-row"><a href="#practice/${t.subject}/${t.topic}"><strong>${H.esc(Catalog.topics[t.topic])}</strong><small>${H.esc(Catalog.courses[t.subject].short)} · ${t.correct}/${t.answered} correct</small></a>${ico('chevron-right')}</div>`
              )
              .join('')
          : `<p class="muted tiny">No weak topics identified in this range.</p>`
      }</section></div>
      <section class="spaced">${sec('Recent results', H.plural(sum.attempts.length, 'submitted session'))}${sum.attempts.length ? `<div class="panel activity-list">${sum.attempts.slice(0, 40).map(UI.resultRow).join('')}</div>` : empty('chart', 'No results in this range', 'Finish a quiz to get meaningful feedback.', link('Start practice', '#practice', { end: 'arrow-right' }))}</section>
      <section class="spaced" data-reveal>${sec('Achievements', 'Milestones from all study activity in this browser.')}
      <div class="badge-grid">${Stats.badges(s, Stats.digest(s.history), day)
        .map(
          (b) =>
            `<article class="panel badge-card ${b.unlocked ? 'unlocked' : ''}">${stamp(b.icon, b.tone)}<h3>${b.title}</h3><p class="muted tiny">${b.desc}</p>${tag(b.unlocked ? 'Earned' : 'Not yet', b.unlocked ? 'lime' : '', b.unlocked ? 'check' : 'lock')}</article>`
        )
        .join('')}</div></section>`;
  }
  function announcements(s, active, reminders) {
    const demos = Catalog.demos.filter((d) => active === 'all' || d.category === active);
    const scheduled = [...s.reminders].sort((a, b) => a.day.localeCompare(b.day));
    return `${heading('Announcements', 'Keep track of examination dates and study notices.', `${Catalog.code} / NOTICEBOARD`, tag('Local reminders', 'lime', 'bell'))}
    <div class="split announcements-layout"><section class="panel pad stack"><div class="panel-kicker">${stamp('megaphone', 'lilac')}<div><span class="eyebrow">SAMPLE NOTICEBOARD</span><h2>Student notices</h2></div></div>${note('The notices below are demonstrations, not official university announcements. No live university feed is connected.')}
    <div class="tabs" aria-label="Notice categories">${['all', 'Exams', 'Academic', 'Courses'].map((k) => tab(k === 'all' ? 'All notices' : k, 'announce-filter', k, k === active)).join('')}</div><div class="notice-list">${demos.map((n) => `<article class="notice-row">${stamp(n.icon, 'sand')}<div><div class="cluster">${tag(n.category)}${tag('DEMO', 'sand')}</div><h3>${H.esc(n.title)}</h3><p class="muted tiny">${H.esc(n.summary)}</p>${n.route ? link(n.category === 'Exams' ? 'Add a personal reminder' : 'Browse courses', n.route, { plain: true, end: 'arrow-right' }) : ''}</div></article>`).join('')}</div></section>
    <section class="panel pad stack" id="personal-reminders"><div class="panel-kicker">${stamp('calendar', 'lime')}<div><span class="eyebrow">YOUR TIMETABLE</span><h2>Exam reminders</h2></div></div><p class="muted tiny">Add dates from your actual examination timetable. Upcoming reminders appear here and in Notifications.</p>
    <form id="reminder-form" class="stack"><label class="field"><span>Reminder title</span><input name="label" type="text" required maxlength="60" placeholder="e.g. Entrepreneurship mock" ${reminders ? 'autofocus' : ''}></label><label class="field"><span>Subject</span><select name="subject">${optionList(UI.courseOptions(), 'business')}</select></label><label class="field"><span>Exam date</span><input name="day" type="date" required min="${H.key()}" max="2099-12-31"></label><div class="form-actions"><button class="btn" type="submit">${ico('plus')} Add reminder</button></div></form>
    ${scheduled.length ? `<div class="topic-list">${scheduled.map((r) => `<div class="topic-row"><div><strong>${H.esc(r.label)}</strong><small>${H.esc(Catalog.courses[r.subject].short)} · ${H.date(H.dayAt(r.day))}${r.day < H.key() ? ' · Past' : ''}</small></div>${UI.iconBtn('Remove reminder', 'trash', 'remove-reminder', { id: r.id })}</div>`).join('')}</div>` : `<p class="muted tiny">No personal reminders yet.</p>`}</section></div>`;
  }
  function settings(s) {
    const p = s.prefs;
    return `${heading('Settings', 'Make this workspace yours. Changes are local to this browser.', 'WORKSPACE / PREFERENCES')}
    <div class="split settings-layout"><section class="panel pad stack"><div class="panel-kicker"><span class="avatar">${H.esc(H.initials(p.name))}</span><div><span class="eyebrow">STUDENT PROFILE</span><h2>Profile & preferences</h2></div></div><p class="muted tiny">Al-Hikmah University · 200 Level · ${Catalog.code}</p>
    <form class="stack" id="settings-form"><div class="form-grid"><label class="field"><span>Display name</span><input name="name" maxlength="50" autocomplete="off" value="${H.esc(p.name)}" required></label><label class="field"><span>Appearance</span><select name="theme">${optionList(
      [
        ['light', 'Light'],
        ['dark', 'Dark'],
        ['system', 'Match device'],
      ],
      p.theme
    )}</select></label></div>
    <div class="form-grid"><label class="field"><span>Daily question target</span><input name="goal" type="number" min="1" max="120" value="${p.goal}" required></label><label class="field"><span>Daily flashcard target</span><input name="cardGoal" type="number" min="1" max="120" value="${p.cardGoal}" required></label></div>
    <label class="switch-line"><span><strong>In-app notifications</strong><small>Goal celebrations and reminder badges, no push notifications.</small></span><input name="notifications" type="checkbox" role="switch"${p.notifications ? ' checked' : ''}></label>
    <label class="switch-line"><span><strong>Practice sound</strong><small>A short tone after selecting an answer in practice.</small></span><input name="sound" type="checkbox" role="switch"${p.sound ? ' checked' : ''}></label><div class="form-actions"><button class="btn" type="submit">${ico('check')} Save settings</button></div></form></section>
    <div class="stack"><section class="panel pad stack"><div class="panel-kicker">${stamp('shield', 'lime')}<div><span class="eyebrow">PRIVATE BY DESIGN</span><h2>Local storage</h2></div></div><p class="muted tiny">No account, analytics tracker or server sync. Use the same browser and address to keep your data. Nothing is shared when you answer a question.</p>${!Store.available ? note('Browser storage is blocked. Progress will be lost on reload.', 'info', 'warn') : ''}</section>
    <section class="panel pad stack"><div class="panel-kicker">${stamp('trash', 'rose')}<div><span class="eyebrow">MANAGE DATA</span><h2>Reset your workspace</h2></div></div><p class="muted tiny">Reset progress keeps your bookmarks, notes, reminders, and settings. Clear saved data removes all HikmahPrep records in this browser.</p><div class="cluster">${btn('Reset progress', 'reset-progress', { kind: 'secondary' })}${btn('Clear saved data', 'clear-data', { kind: 'danger' })}</div></section></div></div>`;
  }
  return { performance, announcements, settings };
})();
