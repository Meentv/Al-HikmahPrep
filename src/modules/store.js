// Versioned, local-only storage. Validate at the boundary; retain old stable question IDs.
const Store = (() => {
  const KEY = 'hikmahprep.gns203.v5';
  const OLD = [
    'hikmahprep.gns203.v4',
    'hikmahprep.gns203.v3',
    'hikmahprep.v2',
    'hikmahprep.gns205.v1',
  ];
  const DEFAULT = {
    name: 'Student',
    theme: 'dark',
    goal: 10,
    cardGoal: 5,
    notifications: true,
    sound: false,
    collapsed: false,
  };
  const MAX_HISTORY = 600;
  const MAX_NOTES = 40;
  const MAX_NOTE_LENGTH = 8000;
  const noteBody = (value) =>
    typeof value === 'string'
      ? value
          .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
          .slice(0, MAX_NOTE_LENGTH)
      : '';
  const kinds = ['quick', 'topic', 'saved', 'custom', 'full'];
  const list = (value) => (Array.isArray(value) ? value : []);
  const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
  const validIds = (value, subject) =>
    H.unique(
      list(value).filter(
        (id) =>
          Number.isInteger(id) &&
          Catalog.get(id) &&
          (!subject || Catalog.get(id).subject === subject)
      )
    );
  const blank = () => ({
    version: 5,
    prefs: { ...DEFAULT },
    sessions: [],
    history: [],
    saved: [],
    savedTopics: [],
    collections: [],
    understood: [],
    flash: {},
    reviews: {},
    reminders: [],
    notes: [],
    read: [],
    awards: [],
  });
  const uniqueBy = (values, prop = 'id') => {
    const seen = new Set();
    return values.filter((item) => !seen.has(item[prop]) && !!seen.add(item[prop]));
  };

  function attempts(raw, completed = false) {
    if (!object(raw) || !H.token(raw.id) || (completed && !H.finiteTime(raw.completedAt)))
      return [];
    const ids = validIds(raw.ids);
    if (!ids.length) return [];
    const current = list(raw.ids)[H.int(raw.index, 0, Math.max(0, list(raw.ids).length - 1), 0)];
    const currentSubject = Catalog.get(current)?.subject;
    const keys = H.unique(ids.map((id) => Catalog.get(id).subject)).sort(
      (a, b) => Number(b === currentSubject) - Number(a === currentSubject)
    );
    const exam = raw.mode === 'mock' || raw.mode === 'exam';
    const duration = exam ? H.int(raw.duration, 60000, 10800000, ids.length * 60000) : 0;
    const savedMs = H.int(raw.remaining, 0, duration, duration);
    return keys.map((subject) => {
      const qs = ids.filter((id) => Catalog.get(id).subject === subject);
      const answers = Object.create(null);
      for (const id of qs) {
        const value = raw.answers?.[id];
        if (Number.isInteger(value) && value >= 0 && value < Catalog.get(id).options.length)
          answers[id] = value;
      }
      const mixed = keys.length > 1;
      const kind = kinds.includes(raw.kind)
        ? raw.kind
        : exam
          ? 'full'
          : raw.mode === 'topic'
            ? 'topic'
            : raw.mode === 'quick'
              ? 'quick'
              : 'custom';
      const splitTime = (number) =>
        mixed ? Math.round((number * qs.length) / ids.length) : number;
      return {
        id: mixed ? `${raw.id.slice(0, 80)}-${subject}` : raw.id,
        previousId: mixed ? raw.id : H.token(raw.previousId) ? raw.previousId : null,
        oldPaper: Catalog.courses[subject].legacyPaper || null,
        optionSeed: H.int(raw.optionSeed, 0, 4294967295, 0),
        subject,
        mode: exam ? 'exam' : 'practice',
        kind,
        ids: qs,
        answers,
        flags: validIds(raw.flags, subject).filter((id) => qs.includes(id)),
        index: qs.includes(current)
          ? qs.indexOf(current)
          : Math.max(
              0,
              qs.findIndex((id) => !Object.hasOwn(answers, id))
            ),
        createdAt: H.finiteTime(raw.createdAt)
          ? raw.createdAt
          : completed
            ? raw.completedAt
            : Date.now(),
        topic: Catalog.isTopic(subject, raw.topic) ? raw.topic : null,
        duration: exam ? Math.max(60000, splitTime(duration)) : 0,
        remaining: exam
          ? splitTime(
              mixed && H.finiteTime(raw.deadline)
                ? Math.max(0, Math.min(duration, raw.deadline - Date.now()))
                : savedMs
            )
          : 0,
        deadline:
          exam && !mixed && !completed && H.finiteTime(raw.deadline)
            ? Math.min(raw.deadline, Date.now() + duration)
            : null,
        ...(completed ? { completedAt: raw.completedAt, expired: Boolean(raw.expired) } : {}),
      };
    });
  }

  function clean(data) {
    const state = blank();
    if (!object(data)) return state;
    const pref = object(data.prefs) ? data.prefs : {};
    state.prefs = {
      name: H.text(pref.name).slice(0, 50) || DEFAULT.name,
      theme: ['light', 'dark', 'system'].includes(pref.theme) ? pref.theme : DEFAULT.theme,
      goal: H.int(pref.goal, 1, 120, DEFAULT.goal),
      cardGoal: H.int(pref.cardGoal, 1, 120, DEFAULT.cardGoal),
      notifications: pref.notifications !== false,
      sound: pref.sound === true,
      collapsed: pref.collapsed === true,
    };
    state.history = uniqueBy(
      list(data.history)
        .slice(0, MAX_HISTORY)
        .flatMap((a) => attempts(a, true))
    )
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, MAX_HISTORY);
    const historyIds = new Set(state.history.map((a) => a.id));
    const pending = Array.isArray(data.sessions)
      ? data.sessions
      : object(data.sessions)
        ? [data.sessions['205'], data.sessions['204']]
        : [data.active];
    state.sessions = uniqueBy(
      pending
        .slice(0, 16)
        .flatMap((a) => attempts(a))
        .filter((a) => !historyIds.has(a.id))
    );
    state.saved = validIds(data.saved);
    state.savedTopics = H.unique(
      list(data.savedTopics).filter((item) => {
        if (typeof item !== 'string') return false;
        const [s, t, tail] = item.split(':');
        return tail === undefined && Catalog.isTopic(s, t);
      })
    );
    state.collections = uniqueBy(
      list(data.collections)
        .slice(0, 24)
        .filter((c) => object(c) && H.token(c.id) && H.text(c.name))
        .map((c) => ({
          id: c.id,
          name: H.text(c.name).slice(0, 48),
          ids: validIds(c.ids).filter((id) => state.saved.includes(id)),
        }))
    );
    state.understood = validIds(data.understood);
    for (const subject of Catalog.keys) {
      const deck = data.flash?.[subject];
      if (!object(deck)) continue;
      const pool = validIds(deck.ids, subject);
      state.flash[subject] = {
        ids: pool,
        index: H.int(deck.index, 0, Math.max(0, pool.length - 1), 0),
        filter: ['all', 'hard', 'known'].includes(deck.filter) ? deck.filter : 'all',
      };
    }
    if (object(data.reviews)) {
      for (const day of Object.keys(data.reviews).filter(H.validDay).sort().slice(-400))
        state.reviews[day] = validIds(data.reviews[day]);
    }
    state.notes = uniqueBy(
      list(data.notes)
        .slice(0, MAX_NOTES)
        .filter((n) => object(n) && H.token(n.id))
        .map((n) => ({
          id: n.id,
          subject: Catalog.isCourse(n.subject) ? n.subject : null,
          title: H.text(n.title).slice(0, 80),
          body: noteBody(n.body),
          updated: H.finiteTime(n.updated) ? n.updated : Date.now(),
        }))
    ).sort((a, b) => b.updated - a.updated);
    state.reminders = uniqueBy(
      list(data.reminders)
        .slice(0, 32)
        .filter(
          (r) => object(r) && H.token(r.id) && H.validDay(r.day) && Catalog.isCourse(r.subject)
        )
        .map((r) => ({
          id: r.id,
          day: r.day,
          subject: r.subject,
          label: H.text(r.label).slice(0, 60) || 'Examination',
        }))
    );
    state.read = H.unique(list(data.read).filter(H.token)).slice(-120);
    state.awards = H.unique(list(data.awards).filter(H.token)).slice(-400);
    return state;
  }

  let available = true;
  let snapshot = null;
  let state = blank();
  try {
    snapshot = localStorage.getItem(KEY);
    for (const key of [KEY, ...OLD]) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      try {
        const parsed = JSON.parse(stored);
        if (object(parsed)) {
          state = clean(parsed);
          break;
        }
      } catch {
        /* A damaged snapshot is not trusted. Try the prior save. */
      }
    }
    localStorage.setItem(`${KEY}.probe`, '1');
    localStorage.removeItem(`${KEY}.probe`);
  } catch {
    available = false;
  }

  function refresh() {
    if (!available) return false;
    try {
      const packed = localStorage.getItem(KEY);
      if (packed !== snapshot && packed !== null) {
        state = clean(JSON.parse(packed));
        snapshot = packed;
        return true;
      }
    } catch {
      /* Keep in-memory state when storage is inaccessible or corrupt. */
    }
    return false;
  }

  function change(update) {
    refresh();
    const result = update(state);
    if (available) {
      try {
        const packed = JSON.stringify(state);
        localStorage.setItem(KEY, packed);
        snapshot = packed;
      } catch {
        available = false;
      }
    }
    return result;
  }

  function clear(all = false) {
    change((s) => {
      const baseline = blank();
      if (!all)
        Object.assign(baseline, {
          prefs: s.prefs,
          saved: s.saved,
          savedTopics: s.savedTopics,
          collections: s.collections,
          reminders: s.reminders,
          notes: s.notes,
          read: s.read,
        });
      Object.assign(s, baseline);
    });
    for (const key of OLD) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* No browser access. */
      }
    }
  }

  return {
    KEY,
    MAX_HISTORY,
    MAX_NOTES,
    MAX_NOTE_LENGTH,
    noteBody,
    get data() {
      return state;
    },
    get available() {
      return available;
    },
    change,
    refresh,
    clear,
  };
})();
