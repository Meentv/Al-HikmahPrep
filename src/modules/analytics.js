// Derive every metric from submitted answer records or actual flashcard reviews.
const Stats = (() => {
  function grade(a) {
    let correct = 0,
      answered = 0;
    for (const id of a.ids)
      if (Object.hasOwn(a.answers, id)) {
        answered++;
        if (a.answers[id] === Catalog.get(id).answer) correct++;
      }
    return {
      correct,
      answered,
      wrong: answered - correct,
      blank: a.ids.length - answered,
      total: a.ids.length,
      percent: H.percent(correct, a.ids.length),
    };
  }
  function digest(history, subject = null, window = 'all') {
    const today = H.key();
    const from = window === 'all' ? '' : H.dayOffset(today, 1 - Number(window));
    const attempts = history.filter(
      (a) => (!subject || a.subject === subject) && (!from || H.key(a.completedAt) >= from)
    );
    const counts = { correct: 0, answered: 0, wrong: 0, unique: new Set(), topics: {}, daily: {} };
    for (const a of attempts) {
      const day = H.key(a.completedAt);
      const daily = (counts.daily[day] ||= { correct: 0, answered: 0, sessions: 0 });
      daily.sessions++;
      for (const id of a.ids) {
        if (!Object.hasOwn(a.answers, id)) continue;
        const q = Catalog.get(id);
        const record = (counts.topics[Catalog.topicKey(q.subject, q.topic)] ||= {
          subject: q.subject,
          topic: q.topic,
          answered: 0,
          correct: 0,
        });
        counts.unique.add(id);
        counts.answered++;
        daily.answered++;
        record.answered++;
        if (a.answers[id] === q.answer) {
          counts.correct++;
          daily.correct++;
          record.correct++;
        } else counts.wrong++;
      }
    }
    return {
      ...counts,
      attempts,
      accuracy: counts.answered ? H.percent(counts.correct, counts.answered) : null,
    };
  }
  function problematic(history, subject = null) {
    const last = new Map();
    const flagged = new Set();
    for (const a of history) {
      if (subject && a.subject !== subject) continue;
      for (const id of a.flags) flagged.add(id);
      for (const id of a.ids)
        if (Object.hasOwn(a.answers, id) && !last.has(id))
          last.set(id, a.answers[id] !== Catalog.get(id).answer);
    }
    return new Set(
      [...last]
        .filter(([, wrong]) => wrong)
        .map(([id]) => id)
        .concat([...flagged])
    );
  }
  function current(state = Store.data, digestAll = digest(state.history)) {
    const today = H.key();
    const active = (day) =>
      Boolean((digestAll.daily[day]?.answered || 0) + (state.reviews[day]?.length || 0));
    const todayAnswered = digestAll.daily[today]?.answered || 0;
    const todayCards = state.reviews[today]?.length || 0;
    const todaySessions = digestAll.daily[today]?.sessions || 0;
    let day = active(today) ? today : H.dayOffset(today, -1);
    let streak = 0;
    while (streak < 400 && active(day)) {
      streak++;
      day = H.dayOffset(day, -1);
    }
    const week = Array.from({ length: 7 }, (_, i) => {
      const day = H.dayOffset(today, i - 6);
      return { day, active: active(day), today: day === today };
    });
    return { today, todayAnswered, todayCards, todaySessions, streak, week };
  }
  const weak = (digest) =>
    Object.values(digest.topics)
      .filter((t) => t.correct < t.answered)
      .sort((a, b) => a.correct / a.answered - b.correct / b.answered || b.answered - a.answered);
  const due = (state = Store.data) =>
    state.reminders.filter((r) => r.day >= H.key()).sort((a, b) => a.day.localeCompare(b.day));
  const notices = (state = Store.data) => [
    ...due(state).map((r) => ({
      ...r,
      id: `reminder-${r.id}`,
      icon: 'calendar',
      title: r.label,
      summary: `${Catalog.courses[r.subject].name} · ${H.date(H.dayAt(r.day))}`,
      route: '#announcements/reminders',
    })),
    ...Catalog.demos,
  ];
  const badges = (state = Store.data, sum = digest(state.history), day = current(state, sum)) => [
    {
      icon: 'zap',
      tone: 'lime',
      title: 'First step',
      desc: 'Submit a quiz with an answer',
      unlocked: sum.answered > 0,
    },
    {
      icon: 'layers',
      tone: 'lilac',
      title: 'Recall builder',
      desc: 'Mark 10 cards understood',
      unlocked: state.understood.length >= 10,
    },
    {
      icon: 'flame',
      tone: 'sand',
      title: 'Momentum',
      desc: 'Study three days in a row',
      unlocked: day.streak >= 3,
    },
    {
      icon: 'target',
      tone: 'blue',
      title: 'Wide reader',
      desc: 'Answer 40 different questions',
      unlocked: sum.unique.size >= 40,
    },
  ];
  return { grade, digest, current, problematic, weak, due, notices, badges };
})();
