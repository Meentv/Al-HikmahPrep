// Session lifecycle, persisted deadlines and score transitions.
const Sessions = (() => {
  let clockId = null,
    clockHandle = null;
  const get = (id) => Store.data.sessions.find((a) => a.id === id);
  function add(attempt) {
    Store.change((s) => {
      s.sessions = [
        attempt,
        ...s.sessions.filter((a) => a.subject !== attempt.subject || a.mode !== attempt.mode),
      ];
    });
  }
  function stop() {
    clearInterval(clockHandle);
    clockId = null;
    clockHandle = null;
  }
  function pause(id) {
    if (clockId === id) stop();
    const current = get(id);
    if (current?.mode !== 'exam' || current.deadline == null) return;
    Store.change((s) => {
      const a = s.sessions.find((a) => a.id === id);
      if (a?.deadline != null) {
        a.remaining = Quiz.left(a);
        a.deadline = null;
      }
    });
  }
  function start(id, expire) {
    const a = get(id);
    if (a?.mode !== 'exam') {
      stop();
      return;
    }
    if (clockId === id && a.deadline != null) return;
    stop();
    if (a.deadline == null && a.remaining > 0)
      Store.change((s) => {
        const a = s.sessions.find((a) => a.id === id);
        if (a?.deadline == null && a?.remaining > 0) a.deadline = Date.now() + a.remaining;
      });
    function tick() {
      const a = get(id);
      if (!a) {
        stop();
        return;
      }
      const ms = Quiz.left(a),
        label = H.$('#timer');
      if (ms <= 0) {
        stop();
        expire(id);
        return;
      }
      if (!label) return;
      const value = H.clock(ms);
      if (label.textContent !== value) {
        label.textContent = value;
        const parent = label.closest('.timer');
        parent.classList.toggle('low', ms <= 60000);
        parent.querySelector('progress').value = ms;
      }
    }
    clockId = id;
    clockHandle = setInterval(tick, 250);
    tick();
  }
  function mutate(id, fn) {
    return Store.change((s) => {
      const a = s.sessions.find((a) => a.id === id);
      return a ? fn(a) : null;
    });
  }
  function finish(id, expired = false) {
    if (clockId === id) stop();
    return Store.change((s) => {
      const a = s.sessions.find((a) => a.id === id);
      if (!a || s.history.some((item) => item.id === id)) return null;
      expired ||= a.mode === 'exam' && Quiz.left(a) <= 0;
      const result = {
        ...a,
        remaining: expired ? 0 : Quiz.left(a),
        deadline: null,
        completedAt: Date.now(),
        expired,
      };
      s.history = [result, ...s.history].slice(0, Store.MAX_HISTORY);
      s.sessions = s.sessions.filter((item) => item.id !== id);
      return result;
    });
  }
  function restart(id) {
    if (clockId === id) stop();
    const a = get(id);
    if (!a) return null;
    const fresh = {
      ...a,
      id: H.uid(),
      previousId: null,
      ids: a.optionSeed ? H.shuffle(a.ids) : a.ids,
      optionSeed: a.optionSeed ? Quiz.randomSeed() : 0,
      index: 0,
      answers: Object.create(null),
      flags: [],
      createdAt: Date.now(),
      deadline: null,
      remaining: a.duration,
    };
    add(fresh);
    return fresh;
  }
  return { get, add, stop, pause, start, mutate, finish, restart };
})();
