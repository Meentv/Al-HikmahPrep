// Hash routing, shell coordination and delegated interactions. Views and data stay separate.
const App = (() => {
  const { $, $$, esc } = H;
  const view = $('#view');
  const labels = Object.fromEntries(Catalog.navItems.map(([id, name]) => [id, name]));
  const aliases = { overview: 'dashboard', bank: 'study', results: 'performance' };
  const mobile = matchMedia('(max-width: 860px)');
  const system = matchMedia('(prefers-color-scheme: dark)');
  const bankDefault = () => ({ q: '', topic: 'all', level: 'all' });
  const savedDefault = () => ({ q: '', collection: 'all', subject: 'all' });
  let route = null,
    bank = bankDefault(),
    saved = savedDefault(),
    review = 'all',
    range = 'all',
    announcement = 'all',
    flipped = false,
    noteQuery = '';
  let transition = null,
    navSequence = 0,
    toastTimer = null,
    noteTimer = null,
    noteDirty = false,
    confirmAction = null,
    soundContext = null;
  const screen = () => Store.data;
  const active = () => (route?.page === 'quiz' ? Sessions.get(route.key) : null);
  const selectedResult = () =>
    route?.page === 'result' ? screen().history.find((a) => a.id === route.key) : null;
  const finished = (id) => screen().history.find((a) => a.id === id || a.previousId === id);
  const actionOf = (page) =>
    ({
      quiz: active()?.mode === 'exam' ? 'exams' : 'practice',
      result: selectedResult()?.mode === 'exam' ? 'exams' : 'performance',
    })[page] || page;

  function readRoute() {
    let [page, key = '', detail = ''] = location.hash.slice(1, 180).split('/');
    if (Object.hasOwn(aliases, page)) page = aliases[page];
    if (page === 'quiz') {
      const a = key
        ? screen().sessions.find((a) => a.id === key || a.previousId === key || a.oldPaper === key)
        : screen().sessions[0];
      return a
        ? { page, key: a.id, subject: a.subject, detail: '' }
        : { page: 'practice', key: '', subject: null, detail: '' };
    }
    if (page === 'result') {
      const a = H.token(key) ? finished(key) : null;
      return a
        ? { page, key: a.id, subject: a.subject, detail: '' }
        : { page: 'performance', key: '', subject: null, detail: '' };
    }
    if (!Object.hasOwn(labels, page)) page = 'dashboard';
    let subject =
      Catalog.isCourse(key) &&
      ['courses', 'study', 'practice', 'exams', 'flashcards', 'performance'].includes(page)
        ? key
        : null;
    if (page === 'notes') {
      subject = Catalog.isCourse(key) ? key : null;
      const valid =
        detail === 'new' || (H.token(detail) && screen().notes.some((n) => n.id === detail));
      return { page, key: subject || 'all', subject, detail: valid ? detail : '' };
    }
    if (page === 'flashcards' && !subject) subject = Catalog.defaultCourse;
    if (page === 'announcements' && key === 'reminders')
      return { page, key, subject: null, detail: '' };
    detail = subject && H.token(detail) ? detail : '';
    return { page, key: subject || '', subject, detail };
  }

  function navigate(hash) {
    const value = hash.startsWith('#') ? hash : `#${hash}`;
    if (location.hash === value) applyRoute(false, true);
    else location.hash = value;
  }

  function applyRoute(initial = false, instant = false) {
    flushNote();
    Store.refresh();
    const next = readRoute();
    if (next.page !== 'notes' || next.subject !== route?.subject) noteQuery = '';
    if (route?.page === 'quiz' && (next.page !== 'quiz' || next.key !== route.key))
      Sessions.pause(route.key);
    if (
      next.page === 'study' &&
      (route?.page !== next.page || route.subject !== next.subject || route.detail !== next.detail)
    ) {
      bank = bankDefault();
      if (Catalog.isTopic(next.subject, next.detail)) bank.topic = next.detail;
      else if (
        /^\d{1,3}$/.test(next.detail) &&
        Catalog.courses[next.subject]?.bank.some((q) => String(q.number) === next.detail)
      )
        bank.q = `#${next.detail}`;
    }
    if (next.page === 'flashcards' && (route?.page !== next.page || route.key !== next.key))
      flipped = false;
    if (next.page === 'result' && route?.key !== next.key) review = 'all';
    if (Overlays.open) Overlays.close(false);
    const run = ++navSequence;
    if (transition) {
      transition.skipTransition();
      transition = null;
    }
    const swap = () => {
      if (run !== navSequence) return;
      route = next;
      paint();
      if (!initial) {
        window.scrollTo(0, 0);
        if (route.page === 'announcements' && route.key === 'reminders') {
          $('#personal-reminders')?.scrollIntoView({ block: 'start' });
          $('#reminder-form input')?.focus({ preventScroll: true });
        } else if (route.page === 'notes' && route.detail) {
          const field = $('#note-title');
          field?.focus({ preventScroll: true });
          if (mobile.matches) field?.scrollIntoView({ block: 'nearest' });
        } else $('h1', view)?.focus({ preventScroll: true });
      }
      if (route.page === 'quiz') Sessions.start(route.key, finishExpired);
    };
    if (
      !initial &&
      !instant &&
      !H.reduce() &&
      typeof document.startViewTransition === 'function' &&
      route?.page !== next.page
    ) {
      document.documentElement.classList.add('motion-view');
      const move = document.startViewTransition(swap);
      transition = move;
      move.finished.then(
        () => {
          if (transition === move) {
            transition = null;
            document.documentElement.classList.remove('motion-view');
          }
        },
        () => {
          if (transition === move) {
            transition = null;
            document.documentElement.classList.remove('motion-view');
          }
        }
      );
    } else {
      document.documentElement.classList.remove('motion-view');
      swap();
      if (!initial && !instant && !H.reduce()) {
        view.classList.remove('route-enter');
        requestAnimationFrame(() => {
          if (run === navSequence) view.classList.add('route-enter');
        });
      }
    }
  }

  function chrome() {
    const s = screen(),
      prefs = s.prefs;
    const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && system.matches);
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.dataset.collapsed = String(prefs.collapsed);
    $('#theme-color').content = dark ? '#0c0c16' : '#f4f3fb';
    const toggle = $('[data-action="rail"]');
    toggle.setAttribute('aria-expanded', String(!prefs.collapsed));
    toggle.setAttribute('aria-label', prefs.collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    $('[data-action="theme"].theme-top').innerHTML = UI.ico(dark ? 'sun' : 'moon');
    $$('[data-profile-name]').forEach((el) => (el.textContent = prefs.name));
    $$('[data-initials]').forEach((el) => (el.textContent = H.initials(prefs.name)));
    $('#notice-dot').hidden =
      !prefs.notifications || !Stats.notices(s).some((n) => !s.read.includes(n.id));
    $('#local-status').innerHTML =
      `${UI.ico(Store.available ? 'device' : 'info')} ${Store.available ? 'Progress stays in this browser' : 'Storage blocked · progress is temporary'}`;
    if (!route) return;
    const current = actionOf(route.page);
    $$('[data-nav]').forEach((el) => {
      if (el.dataset.nav === current) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
    const more = $('[data-action="more"]');
    if (more)
      more.classList.toggle(
        'secondary-current',
        !['dashboard', 'courses', 'practice', 'exams', 'flashcards'].includes(current)
      );
    const title =
      route.page === 'quiz'
        ? UI.attemptName(active() || { kind: 'quick' })
        : route.page === 'result'
          ? 'Answer review'
          : labels[route.page];
    $('#breadcrumbs').innerHTML =
      `<a href="#dashboard">Workspace</a>${UI.ico('chevron-right')}<strong aria-current="page">${esc(title)}</strong>`;
    document.title = `${title} · HikmahPrep`;
  }

  function paint() {
    const s = screen();
    const { page, subject, detail, key } = route;
    const html = {
      dashboard: () => Desk.dashboard(s),
      courses: () => Desk.courses(s, subject),
      study: () => Desk.bank(s, subject, bank, detail),
      practice: () => Quiz.setup(s, subject, detail, 'practice'),
      exams: () => Quiz.setup(s, subject, '', 'exam'),
      quiz: () =>
        active() ? Quiz.view(active()) : Desk.pick('practice', 'Practice', 'Choose a subject.'),
      result: () =>
        selectedResult()
          ? Quiz.result(selectedResult(), review)
          : Insights.performance(s, null, range),
      flashcards: () => Learning.flash(s, subject, flipped),
      bookmarks: () => Learning.bookmarks(s, saved),
      performance: () => Insights.performance(s, subject, range),
      announcements: () => Insights.announcements(s, announcement, key === 'reminders'),
      settings: () => Insights.settings(s),
      notes: () => Notebook.view(s, subject, detail, noteQuery),
    }[page]();
    view.classList.remove('route-enter');
    view.innerHTML = html;
    chrome();
    updatePool();
    if (!H.reduce()) {
      const digits = $$('[data-count]', view);
      if (digits.length) {
        const started = performance.now();
        const animate = (now) => {
          const fraction = Math.min(1, (now - started) / 270);
          for (const el of digits)
            if (el.isConnected)
              el.textContent = String(
                Math.round(Number(el.dataset.count) * (1 - Math.pow(1 - fraction, 3)))
              );
          if (fraction < 1 && digits.some((el) => el.isConnected)) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }
    Motion.update(view);
  }

  function updateNoteList() {
    const form = $('#note-form');
    const list = $('#note-list');
    if (list)
      list.innerHTML = Notebook.list(
        screen(),
        route.subject,
        form?.dataset.noteId || route.detail,
        noteQuery
      );
    const badge = $('#notebook-total');
    if (badge) badge.textContent = H.plural(screen().notes.length, 'note');
    const add = $('[data-action="new-note"]', view);
    if (add) add.disabled = screen().notes.length >= Store.MAX_NOTES;
  }
  function flushNote(explicit = false) {
    clearTimeout(noteTimer);
    if (!explicit && !noteDirty) return;
    const form = $('#note-form');
    noteDirty = false;
    if (!form) return;
    const result = Notebook.save(form);
    const status = $('#note-status');
    if (result.id && route?.detail === 'new') {
      route.detail = result.id;
      if (location.hash === `#notes/${route.key}/new`) {
        try {
          history.replaceState(null, '', `#notes/${route.key}/${result.id}`);
        } catch {
          /* Restricted embeds may disallow history replacement. */
        }
      }
    }
    if (status.textContent !== result.message) status.textContent = result.message;
    if (explicit && result.id) showToast(result.message, Store.available ? 'check-circle' : 'info');
    if (result.id) updateNoteList();
  }

  function showToast(message, icon = 'check-circle') {
    const el = $('#toast');
    el.innerHTML = `${UI.ico(icon)}<span>${esc(message)}</span>`;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 3300);
  }
  function achievements() {
    const s = screen(),
      day = Stats.current(s);
    const targets = [
      [`${day.today}-answers`, day.todayAnswered >= s.prefs.goal, 'Daily question goal complete.'],
      [`${day.today}-recall`, day.todayCards >= s.prefs.cardGoal, 'Daily flashcard goal complete.'],
    ];
    const achieved = targets.filter(([id, ready]) => ready && !s.awards.includes(id));
    if (achieved.length) {
      Store.change((s) => {
        s.awards = H.unique([...s.awards, ...achieved.map(([id]) => id)]).slice(-400);
      });
      if (s.prefs.notifications)
        showToast(achieved.map(([, , message]) => message).join(' '), 'trophy');
    }
  }
  function tone(correct) {
    if (!screen().prefs.sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      soundContext ||= new Audio();
      soundContext.resume().catch(() => {});
      const osc = soundContext.createOscillator(),
        gain = soundContext.createGain(),
        at = soundContext.currentTime;
      osc.frequency.value = correct ? 630 : 390;
      gain.gain.setValueAtTime(0.001, at);
      gain.gain.exponentialRampToValueAtTime(0.045, at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.17);
      osc.connect(gain).connect(soundContext.destination);
      osc.start(at);
      osc.stop(at + 0.18);
    } catch {
      /* Sound is optional. */
    }
  }
  function startAttempt(subject, mode, options) {
    if (!Catalog.isCourse(subject)) return;
    Store.refresh();
    const a = Quiz.make(subject, mode, options);
    if (!a) {
      showToast('No questions match these settings.', 'info');
      return;
    }
    const existing = screen().sessions.find(
      (item) => item.subject === subject && item.mode === mode
    );
    const go = () => {
      Sessions.add(a);
      Overlays.close(false);
      navigate(`quiz/${a.id}`);
    };
    if (existing) {
      confirmAction = go;
      Overlays.show(
        'Replace unfinished session?',
        `<p class="dialog-note">This replaces only the unfinished ${mode === 'exam' ? 'mock exam' : 'practice'} in ${esc(Catalog.courses[subject].name)}. Other subjects and completed results stay saved.</p><div class="cluster">${UI.link('Resume instead', `#quiz/${existing.id}`, { kind: 'secondary', icon: 'play' })}${UI.btn('Start new session', 'confirm-action')}</div>`
      );
    } else go();
  }
  function finishExpired(id) {
    finish(id, true);
  }
  function finish(id, expired = false) {
    const a = Sessions.finish(id, expired);
    if (a) {
      Overlays.close(false);
      navigate(`result/${a.id}`);
      achievements();
    }
  }
  function updatePool() {
    const form = $('.session-form');
    if (!form) return;
    const { topic, level, source, minutes } = form.elements;
    const total = Quiz.pool(form.dataset.subject, {
      topic: topic?.value || 'all',
      level: level?.value || 'all',
      source: source.value,
    }).length;
    const alt = $('#count-all', form);
    const oldChoice = $('input[name="count"]:checked', form)?.value;
    alt.disabled = !total || Quiz.sizes.includes(total);
    alt.closest('label').hidden = alt.disabled;
    alt.value = String(total);
    $('#count-all-label').textContent = `Use all ${total} matching questions`;
    const counts = $$('input[name="count"]', form);
    counts
      .filter((el) => el !== alt)
      .forEach((el) => {
        el.disabled = Number(el.value) > total;
      });
    const current =
      counts.find((el) => el.checked && !el.disabled) ||
      counts.find((el) => Number(el.value) === Quiz.defaultSize(total) && !el.disabled);
    if (current) current.checked = true;
    else
      counts.forEach((el) => {
        el.checked = false;
      });
    if (
      minutes &&
      !minutes.dataset.custom &&
      (form.dataset.lastCount !== current?.value || oldChoice !== current?.value)
    )
      minutes.value = current?.value || '60';
    form.dataset.lastCount = current?.value || '';
    $('#pool-status').textContent = total
      ? `${H.plural(total, 'matching question')} in this subject. ${total < 120 ? 'Larger sets need more matching questions.' : 'No repeats in a session.'}`
      : 'No questions match. Change a filter or source.';
    $('#start-session').disabled = !current;
  }
  function refreshQuiz(preserve = null, announce = false) {
    const a = active();
    if (!a) return;
    const q = Catalog.get(a.ids[a.index]),
      g = Stats.grade(a);
    // Reuse radio inputs so keyboard focus survives answer selection.
    $$('#option-list .option').forEach((row) => {
      const i = Number($('input', row).value);
      const selected = a.answers[q.id] === i,
        revealed = a.mode !== 'exam' && Object.hasOwn(a.answers, q.id);
      row.classList.toggle('selected', selected);
      row.classList.toggle('correct', revealed && i === q.answer);
      row.classList.toggle('incorrect', revealed && selected && i !== q.answer);
      $('input', row).checked = selected;
      $('.option-mark', row).innerHTML =
        revealed && i === q.answer ? UI.ico('check') : revealed && selected ? UI.ico('x') : '';
    });
    $('#feedback').innerHTML = Quiz.feedback(a, q);
    if (announce && a.mode !== 'exam')
      $('#answer-announce').textContent =
        a.answers[q.id] === q.answer
          ? 'Correct. Explanation available below.'
          : 'Not quite. The correct answer and explanation are below.';
    const map = $('#question-map'),
      y = map.scrollTop;
    map.innerHTML = Quiz.map(a);
    map.scrollTop = y;
    $('#answered-line').innerHTML = UI.line('Answered', g.answered, g.total);
    $('[data-action="clear-answer"]').disabled = !Object.hasOwn(a.answers, q.id);
    const flag = $('[data-action="flag"]');
    const flagLabel = a.flags.includes(q.id) ? 'Remove review flag' : 'Flag for review';
    flag.setAttribute('aria-pressed', String(a.flags.includes(q.id)));
    flag.setAttribute('aria-label', flagLabel);
    flag.title = flagLabel;
    preserve?.focus?.({ preventScroll: true });
    chrome();
  }
  function updateBank() {
    const box = $('#bank-results');
    if (!box || !route.subject) return;
    $$('[data-action="bank-topic"]').forEach((el) =>
      el.setAttribute('aria-pressed', String(el.dataset.value === bank.topic))
    );
    box.innerHTML = Desk.bankResults(route.subject, bank, route.detail);
  }
  function updateSaved() {
    const box = $('#saved-results');
    if (box) box.innerHTML = Learning.savedResults(screen(), saved);
  }
  function toggleBookmark(id) {
    if (!Catalog.get(id)) return;
    const added = Store.change((s) => {
      if (s.saved.includes(id)) {
        s.saved = s.saved.filter((q) => q !== id);
        for (const c of s.collections) c.ids = c.ids.filter((q) => q !== id);
        return false;
      }
      s.saved.push(id);
      return true;
    });
    if (route.page === 'bookmarks') paint();
    else
      $$('[data-action="bookmark"]')
        .filter((el) => Number(el.dataset.qid) === id)
        .forEach((el) => {
          const label = added ? 'Remove bookmark' : 'Bookmark question';
          el.setAttribute('aria-pressed', String(added));
          el.setAttribute('aria-label', label);
          el.title = label;
        });
    chrome();
    showToast(added ? 'Question bookmarked.' : 'Bookmark removed.', 'bookmark');
  }
  function toggleTopic(subject, topic) {
    if (!Catalog.isTopic(subject, topic)) return;
    const key = Catalog.topicKey(subject, topic);
    const put = Store.change((s) => {
      if (s.savedTopics.includes(key)) {
        s.savedTopics = s.savedTopics.filter((t) => t !== key);
        return false;
      }
      s.savedTopics.push(key);
      return true;
    });
    if (route.page === 'study') updateBank();
    else paint();
    showToast(put ? 'Topic saved.' : 'Saved topic removed.', 'bookmark');
  }
  function updateDeck(update) {
    if (route.page !== 'flashcards') return;
    Store.change((s) => {
      const d = Learning.deck(s, route.subject);
      update(d);
      s.flash[route.subject] = d;
    });
    flipped = false;
    paint();
  }
  function flip() {
    const card = $('.flash-flip');
    if (!card || route.page !== 'flashcards') return;
    const d = Learning.deck(screen(), route.subject);
    flipped = !flipped;
    card.classList.toggle('flipped', flipped);
    card.setAttribute('aria-pressed', String(flipped));
    card.setAttribute('aria-label', flipped ? 'Show question' : 'Reveal answer');
    card.setAttribute(
      'aria-describedby',
      flipped ? 'flash-answer flash-explanation' : 'flash-prompt'
    );
    $('.flash-front').setAttribute('aria-hidden', String(flipped));
    $('.flash-back').setAttribute('aria-hidden', String(!flipped));
    if (flipped) {
      Learning.markReview(route.subject, d);
      const s = screen(),
        n = s.reviews[H.key()]?.length || 0,
        goal = s.prefs.cardGoal;
      $('.flash-aside .day-body').innerHTML =
        UI.ring(n, goal, 'Unique cards reviewed today') +
        `<div><strong>${n >= goal ? 'Target met' : 'Cards turned today'}</strong><small>Each distinct card counts once.</small></div>`;
      achievements();
      chrome();
    }
  }

  function handle(action, d = {}, node = null) {
    if (!route) return;
    const a = active();
    switch (action) {
      case 'rail':
        Store.change((s) => {
          s.prefs.collapsed = !s.prefs.collapsed;
        });
        chrome();
        break;
      case 'theme': {
        const t = screen().prefs.theme;
        Store.change((s) => {
          s.prefs.theme = t === 'dark' || (t === 'system' && system.matches) ? 'light' : 'dark';
        });
        Overlays.close();
        chrome();
        if (route.page === 'settings') paint();
        break;
      }
      case 'search':
        Overlays.search((choice) => (choice.href ? navigate(choice.href) : handle(choice.action)));
        break;
      case 'command-pick':
        Overlays.choose(Number(d.index));
        break;
      case 'profile':
        Overlays.profile(screen());
        break;
      case 'quick':
        Overlays.quick();
        break;
      case 'more':
        Overlays.more();
        break;
      case 'notifications':
        Overlays.notifications(screen());
        break;
      case 'notices-read':
        Store.change((s) => {
          s.read = H.unique([...s.read, ...Stats.notices(s).map((n) => n.id)]).slice(-120);
        });
        chrome();
        Overlays.notifications(screen());
        break;
      case 'goals':
        Overlays.goals(screen());
        break;
      case 'close-overlay':
        Overlays.close();
        break;
      case 'confirm-action': {
        const run = confirmAction;
        confirmAction = null;
        run?.();
        break;
      }
      case 'quick-start':
        if (route.page === 'practice' && route.subject === d.subject)
          startAttempt(d.subject, 'practice', { shuffle: true });
        break;
      case 'new-note':
        if (route.page === 'notes' && screen().notes.length < Store.MAX_NOTES) {
          flushNote();
          const target = `notes/${route.key}/new`;
          if (location.hash === `#${target}` && route.detail === 'new')
            $('#note-title')?.focus({ preventScroll: true });
          else navigate(target);
        }
        break;
      case 'delete-note': {
        if (route.page !== 'notes') break;
        flushNote();
        const id = $('#note-form')?.dataset.noteId;
        if (!screen().notes.some((n) => n.id === id)) break;
        confirmAction = () => {
          Store.change((s) => {
            s.notes = s.notes.filter((n) => n.id !== id);
          });
          Overlays.close(false);
          navigate(`notes/${route.key}`);
          showToast('Note deleted.');
        };
        Overlays.confirm(
          'Delete this note?',
          'This removes the note from this browser. It cannot be undone.',
          'confirm-action',
          'Delete note',
          'danger'
        );
        break;
      }
      case 'jump': {
        const i = Number(d.index);
        if (!a || !Number.isInteger(i) || i < 0 || i >= a.ids.length) break;
        Sessions.mutate(a.id, (item) => {
          item.index = i;
        });
        paint();
        const map = $('#question-map');
        const target = $('[aria-current="step"]', map);
        if (target && map.scrollHeight > map.clientHeight)
          map.scrollTop = target.offsetTop - map.offsetTop - 24;
        window.scrollTo(0, 0);
        $('#question-title').focus({ preventScroll: true });
        break;
      }
      case 'flag':
        if (a) {
          const id = a.ids[a.index];
          Sessions.mutate(a.id, (item) => {
            item.flags = item.flags.includes(id)
              ? item.flags.filter((q) => q !== id)
              : [...item.flags, id];
          });
          refreshQuiz(node);
        }
        break;
      case 'clear-answer':
        if (a) {
          Sessions.mutate(a.id, (item) => {
            delete item.answers[item.ids[item.index]];
          });
          refreshQuiz($('#option-list input'));
        }
        break;
      case 'save-exit':
        if (a) {
          Sessions.pause(a.id);
          navigate(`${a.mode === 'exam' ? 'exams' : 'practice'}/${a.subject}`);
          showToast(
            Store.available
              ? 'Session saved. Pick up here later.'
              : 'Session kept while this page stays open.',
            'device'
          );
        }
        break;
      case 'submit-quiz':
        if (a) {
          const g = Stats.grade(a);
          confirmAction = () => finish(a.id);
          Overlays.confirm(
            a.mode === 'exam' ? 'Submit this examination?' : 'Finish this practice?',
            `You answered ${g.answered} of ${g.total} questions. ${g.blank ? `${H.plural(g.blank, 'blank answer')} will score zero. ` : ''}You can review the detailed answers afterwards.`,
            'confirm-action',
            'Submit & see score'
          );
        }
        break;
      case 'restart':
        if (a) {
          confirmAction = () => {
            const fresh = Sessions.restart(a.id);
            Overlays.close(false);
            if (fresh) navigate(`quiz/${fresh.id}`);
          };
          Overlays.confirm(
            'Restart this session?',
            'Your answers and flags will be reset. This uses the same questions, reshuffled if shuffle was on. Other sessions and results stay saved.',
            'confirm-action',
            'Restart'
          );
        }
        break;
      case 'review-filter':
        if (selectedResult() && ['all', 'correct', 'wrong', 'blank'].includes(d.value)) {
          review = d.value;
          $('#review-list').innerHTML = Quiz.review(selectedResult(), review);
          $$('[data-action="review-filter"]').forEach((el) =>
            el.setAttribute('aria-pressed', String(el.dataset.value === review))
          );
        }
        break;
      case 'bank-topic':
        if (d.value === 'all' || Catalog.isTopic(route.subject, d.value)) {
          bank.topic = d.value;
          updateBank();
        }
        break;
      case 'bank-clear':
        bank = bankDefault();
        paint();
        $('#bank-query')?.focus();
        break;
      case 'bookmark':
        toggleBookmark(Number(d.qid));
        break;
      case 'topic-save':
        toggleTopic(d.subject, d.topic);
        break;
      case 'new-collection':
        Overlays.newCollection();
        break;
      case 'collection-filter':
        if (d.value === 'all' || screen().collections.some((c) => c.id === d.value)) {
          saved.collection = d.value;
          paint();
          $$('[data-action="collection-filter"]')
            .find((el) => el.dataset.value === d.value)
            ?.focus({ preventScroll: true });
        }
        break;
      case 'organise': {
        const q = Catalog.get(d.qid);
        if (q && screen().saved.includes(q.id)) Overlays.organise(q, screen());
        break;
      }
      case 'delete-collection':
        if (screen().collections.some((c) => c.id === d.id)) {
          confirmAction = () => {
            Store.change((s) => {
              s.collections = s.collections.filter((c) => c.id !== d.id);
            });
            saved.collection = 'all';
            Overlays.close(false);
            paint();
            showToast('Collection removed. Questions are still bookmarked.');
          };
          Overlays.confirm(
            'Remove this collection?',
            'Its questions will remain in All saved.',
            'confirm-action',
            'Remove collection',
            'danger'
          );
        }
        break;
      case 'flip':
        flip();
        break;
      case 'deck-filter':
        if (['all', 'hard', 'known'].includes(d.value))
          updateDeck((deck) => Object.assign(deck, { ids: [], index: 0, filter: d.value }));
        break;
      case 'deck-shuffle':
        updateDeck((deck) => Object.assign(deck, { ids: H.shuffle(deck.ids), index: 0 }));
        break;
      case 'deck-move':
        updateDeck((deck) => {
          deck.index = H.int(deck.index + Number(d.delta), 0, Math.max(0, deck.ids.length - 1), 0);
        });
        $('.flash-flip')?.focus({ preventScroll: true });
        break;
      case 'understood': {
        const id = Number(d.qid);
        if (route.page !== 'flashcards' || Catalog.get(id)?.subject !== route.subject) break;
        const yes = Store.change((s) => {
          const prior = s.understood.includes(id);
          s.understood = prior ? s.understood.filter((v) => v !== id) : [...s.understood, id];
          return !prior;
        });
        if (Learning.deck(screen(), route.subject).filter !== 'all') flipped = false;
        paint();
        showToast(yes ? 'Marked as understood.' : 'Moved back to revision.', 'check');
        break;
      }
      case 'range':
        if (['7', '30', 'all'].includes(d.value)) {
          range = d.value;
          paint();
          $$('[data-action="range"]')
            .find((el) => el.dataset.value === range)
            ?.focus({ preventScroll: true });
        }
        break;
      case 'announce-filter':
        if (['all', 'Exams', 'Academic', 'Courses'].includes(d.value)) {
          announcement = d.value;
          paint();
          $$('[data-action="announce-filter"]')
            .find((el) => el.dataset.value === announcement)
            ?.focus({ preventScroll: true });
        }
        break;
      case 'remove-reminder':
        if (screen().reminders.some((r) => r.id === d.id)) {
          confirmAction = () => {
            Store.change((s) => {
              s.reminders = s.reminders.filter((r) => r.id !== d.id);
            });
            Overlays.close(false);
            paint();
            showToast('Reminder removed.');
          };
          Overlays.confirm(
            'Remove exam reminder?',
            'This removes the reminder from your personal timetable.',
            'confirm-action',
            'Remove reminder',
            'danger'
          );
        }
        break;
      case 'reset-progress':
      case 'clear-data': {
        const all = action === 'clear-data';
        confirmAction = () => {
          Sessions.stop();
          Store.clear(all);
          review = 'all';
          range = 'all';
          flipped = false;
          saved = savedDefault();
          Overlays.close(false);
          paint();
          $('h1', view)?.focus();
          showToast(
            all
              ? 'HikmahPrep data cleared from this browser.'
              : 'Study progress reset. Bookmarks, notes and settings kept.'
          );
        };
        Overlays.confirm(
          all ? 'Clear all saved data?' : 'Reset study progress?',
          all
            ? 'This deletes your profile, sessions, scores, bookmarks, cards, notes and reminders in this browser. This cannot be undone.'
            : 'This deletes sessions, scores, flashcard progress and streaks. Your bookmarks, notes, reminders and settings stay.',
          'confirm-action',
          all ? 'Clear all data' : 'Reset progress',
          'danger'
        );
        break;
      }
    }
  }

  function formSubmit(form) {
    const f = new FormData(form),
      val = (name) => f.get(name);
    if (form.id === 'note-form') {
      flushNote(true);
    } else if (form.id === 'practice-form' || form.id === 'exam-form') {
      if (form.dataset.subject !== route.subject) return;
      startAttempt(route.subject, form.id === 'exam-form' ? 'exam' : 'practice', {
        topic: val('topic') || 'all',
        level: val('level') || 'all',
        source: val('source') || 'all',
        count: val('count'),
        minutes: val('minutes'),
        shuffle: f.has('shuffle'),
      });
    } else if (form.id === 'settings-form' || form.id === 'goals-form') {
      const settings = form.id === 'settings-form';
      const name = H.text(val('name')).slice(0, 50);
      if (settings && !name) {
        showToast('Enter a display name.', 'info');
        return;
      }
      Store.change((s) => {
        s.prefs.goal = H.int(val('goal'), 1, 120, s.prefs.goal);
        s.prefs.cardGoal = H.int(val('cardGoal'), 1, 120, s.prefs.cardGoal);
        if (settings) {
          s.prefs.name = name;
          s.prefs.theme = ['light', 'dark', 'system'].includes(val('theme'))
            ? val('theme')
            : 'light';
          s.prefs.notifications = f.has('notifications');
          s.prefs.sound = f.has('sound');
        }
      });
      Overlays.close(false);
      paint();
      showToast(settings ? 'Settings saved.' : 'Study goals updated.');
    } else if (form.id === 'collection-form') {
      const name = H.text(val('name')).slice(0, 48);
      if (
        !name ||
        screen().collections.length >= 24 ||
        screen().collections.some((c) => H.norm(c.name) === H.norm(name))
      ) {
        showToast('Use a new collection name. Up to 24 collections are supported.', 'info');
        return;
      }
      const id = H.uid();
      Store.change((s) => {
        s.collections.push({ id, name, ids: [] });
      });
      saved.collection = id;
      Overlays.close(false);
      paint();
      showToast('Revision collection created.', 'folder');
    } else if (form.id === 'organise-form') {
      const id = Number(form.dataset.qid),
        selected = f.getAll('collection');
      if (!Catalog.get(id) || !screen().saved.includes(id)) return;
      Store.change((s) => {
        for (const c of s.collections) {
          c.ids = c.ids.filter((q) => q !== id);
          if (selected.includes(c.id)) c.ids.push(id);
        }
      });
      Overlays.close(false);
      paint();
      showToast('Collections updated.', 'folder');
    } else if (form.id === 'reminder-form') {
      const day = val('day'),
        subject = val('subject'),
        label = H.text(val('label')).slice(0, 60);
      if (
        !H.validDay(day) ||
        day < H.key() ||
        !Catalog.isCourse(subject) ||
        !label ||
        screen().reminders.length >= 32
      ) {
        showToast(
          'Enter a valid future date and a title. Up to 32 reminders are supported.',
          'info'
        );
        return;
      }
      Store.change((s) => {
        s.reminders.push({ id: H.uid(), day, subject, label });
      });
      paint();
      showToast('Exam reminder added.', 'calendar');
    }
  }

  function mount() {
    $('#rail-nav').innerHTML = Catalog.nav
      .map(
        (group) =>
          `<div class="rail-group"><span class="rail-group-label">${group.label}</span>${group.items.map(([id, name, icon]) => `<a class="rail-link" href="#${id}" data-nav="${id}" data-tip="${esc(name)}" aria-label="${esc(name)}">${UI.ico(icon)}<span class="rail-label">${esc(name)}</span></a>`).join('')}</div>`
      )
      .join('');
    $('#mobile-nav').innerHTML =
      [
        ['dashboard', 'Home', 'layout'],
        ['courses', 'Courses', 'books'],
        ['practice', 'Practice', 'zap'],
        ['exams', 'Exams', 'clipboard'],
        ['flashcards', 'Cards', 'layers'],
      ]
        .map(
          ([id, name, icon]) =>
            `<a class="mobile-link" href="#${id}" data-nav="${id}">${UI.ico(icon)}${name}</a>`
        )
        .join('') +
      `<button class="mobile-link" data-action="more" type="button" aria-expanded="false" aria-controls="overlay" aria-label="More destinations">${UI.ico('more')}More</button>`;
    document.body.insertAdjacentHTML(
      'beforeend',
      '<span class="rail-tip" aria-hidden="true" hidden></span>'
    );
    const tooltip = $('.rail-tip');
    const peek = (e) => {
      const el = e.target.closest('.rail-link');
      if (!el || !screen().prefs.collapsed || mobile.matches) return;
      const box = el.getBoundingClientRect();
      tooltip.textContent = el.dataset.tip;
      tooltip.style.left = `${box.right + 12}px`;
      tooltip.style.top = `${box.top + 5}px`;
      tooltip.hidden = false;
    };
    $('#rail-nav').addEventListener('pointerover', peek);
    $('#rail-nav').addEventListener('focusin', peek);
    $('#rail-nav').addEventListener('pointerout', () => (tooltip.hidden = true));
    $('#rail-nav').addEventListener('focusout', () => (tooltip.hidden = true));
    if (/Mac|iPhone|iPad/.test(navigator.platform)) $('#key-hint').textContent = '⌘ K';
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (el && !el.disabled) {
        handle(el.dataset.action, el.dataset, el);
        return;
      }
      const link = e.target.closest('a[href^="#"]');
      if (
        link &&
        e.button === 0 &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey &&
        !e.defaultPrevented
      ) {
        e.preventDefault();
        if (link.classList.contains('skip')) $('#main').focus();
        else navigate(link.getAttribute('href'));
      }
    });
    // An unopened row only needs a summary. Render its answers on first expansion.
    document.addEventListener(
      'toggle',
      (e) => {
        const detail = e.target;
        if (!detail.isConnected || !detail.matches?.('.q-details[open]')) return;
        const body = $('.q-content', detail);
        const q = Catalog.get(detail.closest('.q-row').dataset.qid);
        if (!q || !body || body.firstElementChild) return;
        const a = selectedResult();
        body.innerHTML = UI.questionAnswers(q, a?.answers[q.id], a ? Quiz.order(a, q) : null);
      },
      true
    );
    document.addEventListener('submit', (e) => {
      e.preventDefault();
      formSubmit(e.target);
    });
    document.addEventListener('input', (e) => {
      const input = e.target;
      if (input.closest('#note-form')) {
        noteDirty = true;
        clearTimeout(noteTimer);
        if (!e.isComposing) noteTimer = setTimeout(flushNote, 450);
      } else if (input.id === 'note-query') {
        noteQuery = input.value.slice(0, 100);
        updateNoteList();
      } else if (input.id === 'command-query') Overlays.query(input.value);
      else if (input.name === 'minutes' && input.closest('#exam-form'))
        input.dataset.custom = 'true';
      else if (input.id === 'bank-query') {
        bank.q = input.value.slice(0, 100);
        updateBank();
      } else if (input.id === 'saved-query') {
        saved.q = input.value.slice(0, 100);
        updateSaved();
      }
    });
    document.addEventListener('change', (e) => {
      const input = e.target;
      if (input.closest('.session-form')) updatePool();
      if (input.matches('#note-form select')) {
        noteDirty = true;
        clearTimeout(noteTimer);
        noteTimer = setTimeout(flushNote, 450);
      }
      if (input.id === 'note-filter')
        navigate(`notes/${Catalog.isCourse(input.value) ? input.value : 'all'}`);
      if (input.id === 'bank-level') {
        bank.level = Object.hasOwn(Catalog.difficulty, input.value) ? input.value : 'all';
        updateBank();
      }
      if (input.id === 'saved-subject') {
        saved.subject = Catalog.isCourse(input.value) ? input.value : 'all';
        updateSaved();
      }
      if (input.name === 'answer' && input.matches('#option-list input') && active()) {
        const a = active(),
          id = a.ids[a.index],
          q = Catalog.get(id),
          answer = Number(input.value);
        if (!Number.isInteger(answer) || answer < 0 || answer >= q.options.length) return;
        if (a.mode === 'exam' && Quiz.left(a) <= 0) {
          finish(a.id, true);
          return;
        }
        Sessions.mutate(a.id, (item) => {
          item.answers[id] = answer;
        });
        if (a.mode !== 'exam') tone(answer === q.answer);
        refreshQuiz(null, true);
      }
    });
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handle('search');
        return;
      }
      if (e.target.id === 'command-query') {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          Overlays.move(e.key === 'ArrowDown' ? 1 : -1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          Overlays.choose();
        }
      }
    });
    window.addEventListener('hashchange', () => applyRoute());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) flushNote();
    });
    window.addEventListener('pagehide', () => {
      flushNote();
      if (route?.page === 'quiz') Sessions.pause(route.key);
    });
    window.addEventListener('pageshow', (e) => {
      if (e.persisted && route?.page === 'quiz') Sessions.start(route.key, finishExpired);
    });
    window.addEventListener('storage', (e) => {
      if (e.key === Store.KEY && Store.refresh()) {
        if (!Overlays.open && !document.activeElement?.matches('input,select,textarea'))
          applyRoute(false, true);
        else chrome();
      }
    });
    system.addEventListener('change', chrome);
    mobile.addEventListener('change', () => {
      tooltip.hidden = true;
      if (Overlays.open && $('#overlay').classList.contains('mobile-sheet')) Overlays.close(false);
    });
    Motion.mount();
    applyRoute(true, true);
  }
  return { mount };
})();
App.mount();
