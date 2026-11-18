// Native dialogs share one focus trap, focus restoration, and keyboard dismissal.
const Overlays = (() => {
  const { $, $$ } = H,
    { ico, iconBtn, btn } = UI;
  const dialog = $('#overlay');
  let opener = null,
    commands = [],
    active = 0,
    runner = null;
  const link = (label, href, icon) =>
    `<a class="dialog-link" href="${H.esc(href)}">${ico(icon)}${H.esc(label)}${ico('chevron-right')}</a>`;
  function show(title, body, kind = '', target = '') {
    if (!dialog.open) opener = document.activeElement;
    dialog.className = kind;
    dialog.innerHTML = `<div class="dialog-body"><header class="dialog-head"><h2 id="overlay-title">${H.esc(title)}</h2>${iconBtn('Close dialog', 'x', 'close-overlay')}</header>${body}</div>`;
    if (!dialog.open) dialog.showModal();
    const node = (target && $(target, dialog)) || $('.dialog-head button', dialog);
    node?.focus({ preventScroll: true });
  }
  function close(restore = true) {
    if (!restore) opener = null;
    if (dialog.open) dialog.close();
    const more = $('[data-action="more"]');
    if (more) more.setAttribute('aria-expanded', 'false');
  }
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
    commands = [];
    runner = null;
    const more = $('[data-action="more"]');
    if (more) more.setAttribute('aria-expanded', 'false');
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        close();
    }
  });
  function confirm(title, copy, action, label, kind = '') {
    show(
      title,
      `<p class="dialog-note">${H.esc(copy)}</p><div class="cluster">${btn('Cancel', 'close-overlay', { kind: 'secondary' })}${btn(label, action, { kind })}</div>`,
      '',
      '[data-action="close-overlay"].btn'
    );
  }
  function search(onPick) {
    runner = onPick;
    active = 0;
    show(
      'Find anything',
      `<div class="search-bar">${ico('search')}<label class="sr-only" for="command-query">Search pages, courses and questions</label><input id="command-query" class="search-input" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="command-results" placeholder="Search pages, courses or questions…" autocomplete="off" maxlength="100"></div><div class="cmd-list" id="command-results" role="listbox" aria-label="Search results"></div><p class="dialog-note"><kbd>↑</kbd> <kbd>↓</kbd> move &nbsp; <kbd>Enter</kbd> open &nbsp; <kbd>Esc</kbd> close</p>`,
      'search-dialog',
      '#command-query'
    );
    query('');
  }
  function query(term) {
    const box = $('#command-results'),
      input = $('#command-query');
    if (!box || !input) return;
    const exact = (label) => H.match(label, term);
    const fuzzy = (label) => {
      const letters = H.norm(term).trim().replace(/\s/g, '');
      let i = 0;
      for (const char of H.norm(label)) if (letters[i] === char) i++;
      return letters.length >= 2 && i === letters.length;
    };
    const pages = Catalog.navItems.map(([route, title, icon]) => ({
      title,
      icon,
      desc: 'Page',
      href: `#${route}`,
    }));
    const courses = Catalog.keys.map((k) => {
      const c = Catalog.courses[k];
      return {
        title: c.name,
        desc: `${Catalog.code} · Course`,
        icon: c.icon,
        href: `#courses/${k}`,
      };
    });
    const actions = [
      { title: 'Edit study goals', desc: 'Action', icon: 'target', action: 'goals' },
      { title: 'Switch light or dark theme', desc: 'Action', icon: 'moon', action: 'theme' },
      {
        title: 'Add an exam reminder',
        desc: 'Action',
        icon: 'calendar',
        href: '#announcements/reminders',
      },
    ];
    const q = H.text(term);
    const base = [...pages, ...courses, ...actions];
    const exactNumber = /^#\d+$/.test(q);
    commands = q
      ? [
          ...base.filter((r) => exact(`${r.title} ${r.desc}`)),
          ...Catalog.all
            .filter((item) => q.length >= 2 && Catalog.search(item, q))
            .sort((a, b) =>
              exactNumber ? Number(b.sourceType === 'past') - Number(a.sourceType === 'past') : 0
            )
            .slice(0, 10)
            .map((item) => ({
              title: item.text,
              desc: `${Catalog.courses[item.subject].short} · Question ${item.number}`,
              icon: 'book',
              href: `#study/${item.subject}/${item.number}`,
            })),
          ...base.filter((r) => !exact(`${r.title} ${r.desc}`) && fuzzy(r.title)).slice(0, 4),
        ].slice(0, 16)
      : [pages[0], pages[3], pages[4], pages[5], ...courses, ...actions];
    active = 0;
    box.innerHTML = commands.length
      ? commands
          .map(
            (r, i) =>
              `<button id="cmd-${i}" class="cmd-option" tabindex="-1" type="button" role="option" aria-selected="${i === 0}" data-action="command-pick" data-index="${i}">${ico(r.icon)}<span><strong>${UI.rich(r.title)}</strong><small>${H.esc(r.desc)}</small></span>${ico('arrow-right')}</button>`
          )
          .join('')
      : `<span class="muted tiny" role="status">No matching pages or questions.</span>`;
    if (commands.length) input.setAttribute('aria-activedescendant', 'cmd-0');
    else input.removeAttribute('aria-activedescendant');
  }
  function move(delta) {
    if (!commands.length) return;
    active = (active + delta + commands.length) % commands.length;
    $$('.cmd-option', dialog).forEach((el, i) =>
      el.setAttribute('aria-selected', String(i === active))
    );
    $('#command-query')?.setAttribute('aria-activedescendant', `cmd-${active}`);
    $(`#cmd-${active}`)?.scrollIntoView({ block: 'nearest' });
  }
  function choose(index = active) {
    const choice = commands[index],
      cb = runner;
    if (!choice || !cb) return;
    close(false);
    cb(choice);
  }
  function profile(s) {
    show(
      'Student profile',
      `<div class="panel-kicker"><span class="avatar">${H.esc(H.initials(s.prefs.name))}</span><div><h3>${H.esc(s.prefs.name)}</h3><p class="dialog-note">Al-Hikmah University · 200 Level</p></div></div>${link('Profile & settings', '#settings', 'settings')}${link('My performance', '#performance', 'chart')}${btn('Switch theme', 'theme', { kind: 'secondary', icon: 'moon' })}<p class="dialog-note">Local profile only. No account or sign-in.</p>`,
      'pop'
    );
  }
  function quick() {
    show(
      'Quick actions',
      `${link('Start a practice session', '#practice', 'zap')}${link('Set up a mock exam', '#exams', 'clipboard')}${link('Review flashcards', '#flashcards', 'layers')}${link('Open notes', '#notes', 'edit')}${link('Add an exam reminder', '#announcements/reminders', 'calendar')}${btn('Edit study goals', 'goals', { kind: 'secondary', icon: 'target' })}`,
      'pop'
    );
  }
  function more() {
    show(
      'More destinations',
      `<div class="stack">${Catalog.navItems
        .filter(
          ([key]) => !['dashboard', 'courses', 'practice', 'exams', 'flashcards'].includes(key)
        )
        .map(([r, t, i]) => link(t, `#${r}`, i))
        .join('')}${btn('Switch theme', 'theme', { kind: 'secondary', icon: 'moon' })}</div>`,
      'mobile-sheet'
    );
    $('[data-action="more"]')?.setAttribute('aria-expanded', 'true');
  }
  function notifications(s) {
    const announcements = Stats.notices(s);
    const unread = s.prefs.notifications
      ? announcements.filter((n) => !s.read.includes(n.id)).length
      : 0;
    show(
      'Notifications',
      `<p class="dialog-note">${s.prefs.notifications ? (unread ? H.plural(unread, 'unread item') : 'You’re all caught up.') : 'Notification badges are off. Personal reminders are still listed.'}</p><div class="cmd-list">${announcements.map((n) => `<a class="dialog-link" href="${H.esc(n.route || '#announcements')}">${ico(n.icon)}<span><strong>${H.esc(n.title)}</strong><small>${n.day ? 'Personal reminder' : 'Demo notice'} · ${H.esc(n.summary)}</small></span>${ico('chevron-right')}</a>`).join('')}</div><div class="cluster">${btn('Mark all as read', 'notices-read', { kind: 'secondary', icon: 'check' })}${link('Noticeboard', '#announcements', 'megaphone')}</div>`,
      'pop'
    );
  }
  function goals(s) {
    show(
      'Study goals',
      `<p class="dialog-note">Daily targets reset at midnight in Lagos. Only submitted answers and distinct reviewed cards count.</p><form class="stack" id="goals-form"><label class="field"><span>Daily question target</span><input name="goal" type="number" min="1" max="120" value="${s.prefs.goal}" required></label><label class="field"><span>Daily flashcard target</span><input name="cardGoal" type="number" min="1" max="120" value="${s.prefs.cardGoal}" required></label><button type="submit" class="btn">${ico('check')} Save goals</button></form>`,
      '',
      'input'
    );
  }
  function newCollection() {
    show(
      'New revision collection',
      `<form id="collection-form" class="stack"><label class="field"><span>Collection name</span><input name="name" maxlength="48" required autocomplete="off" placeholder="e.g. Concepts to revisit"></label><button class="btn" type="submit">${ico('plus')} Create collection</button></form>`,
      '',
      'input'
    );
  }
  function organise(q, s) {
    if (!s.collections.length) {
      show(
        'Organise saved question',
        `<p class="dialog-note">Create a collection first, then add your saved question to it.</p>${btn('New collection', 'new-collection', { icon: 'plus' })}`
      );
      return;
    }
    show(
      'Organise saved question',
      `<p class="dialog-note">Add this question to one or more revision collections.</p><form id="organise-form" class="stack" data-qid="${q.id}">${s.collections.map((c) => `<label class="check-line"><input type="checkbox" name="collection" value="${H.esc(c.id)}"${c.ids.includes(q.id) ? ' checked' : ''}>${H.esc(c.name)}</label>`).join('')}<button type="submit" class="btn">${ico('check')} Save collections</button></form>`
    );
  }
  return {
    get open() {
      return dialog.open;
    },
    show,
    close,
    confirm,
    search,
    query,
    move,
    choose,
    profile,
    quick,
    more,
    notifications,
    goals,
    newCollection,
    organise,
  };
})();
