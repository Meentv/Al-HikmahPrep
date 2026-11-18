// Optional jsdom exercise of actual bundled app code in independent simulated documents.
const assert = require('node:assert/strict');
const { Script } = require('node:vm');
const { setTimeout: wait } = require('node:timers/promises');
const { JSDOM, VirtualConsole } = require('jsdom');
const count = Number(process.argv[2] || 120);
const port = Number(process.env.PORT || 3000);
assert(Number.isInteger(count) && count > 0 && count <= 150, 'Use 1–150 simulated documents');
assert(Number.isInteger(port) && port > 0 && port <= 65535, 'Use a valid loopback port');
const url = `http://127.0.0.1:${port}/`;
const clients = [],
  errors = [];

async function poll(group, test) {
  for (let i = 0; i < 120; i++) {
    if (group.every(test)) return;
    await wait(25);
  }
  throw new Error('A simulated window did not reach the expected state');
}
async function run() {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  assert.equal(res.status, 200);
  // Compile the exact bundled script once, then execute it in each independent window.
  // CSS/fonts/illustration and the SVG symbol sheet are not needed by jsdom for this test.
  const payload = await res.text();
  const [element, code] = payload.match(/<script>([\s\S]*?)<\/script>/);
  const script = new Script(code, { filename: 'hikmahprep-bundle.js' });
  const html = payload
    .replace(element, '')
    .replace(/<style>[\s\S]*?<\/style>/, '')
    .replace(/<svg class="sprite"[\s\S]*?<\/svg>/, '');
  const consoleRelay = new VirtualConsole();
  consoleRelay.on('jsdomError', (e) => errors.push(e.message));
  const store = (w) => JSON.parse(w.localStorage.getItem('hikmahprep.gns203.v5'));
  const find = (c, sel) => c.w.document.querySelector(sel);
  for (let i = 0; i < count; i++) {
    const subject = ['business', 'islamic', 'arabic'][i % 3];
    const n = i % 17 === 0 && subject !== 'islamic' ? 120 : [20, 40, 60][Math.floor(i / 3) % 3];
    const key = { business: 2, islamic: 1, arabic: 0 }[subject];
    const dom = new JSDOM(html, {
      url: `${url}#exams/${subject}`,
      runScripts: 'outside-only',
      virtualConsole: consoleRelay,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: true, addEventListener() {} });
        w.scrollTo = () => {};
        w.HTMLElement.prototype.scrollIntoView ??= function () {};
        w.HTMLDialogElement.prototype.showModal ??= function () {
          this.setAttribute('open', '');
        };
        w.HTMLDialogElement.prototype.close ??= function () {
          this.removeAttribute('open');
        };
      },
    });
    script.runInContext(dom.getInternalVMContext());
    clients.push({ w: dom.window, subject, n, key, correct: i % 4 > 0 });
  }
  for (const c of clients) {
    const form = find(c, '#exam-form');
    form.elements.shuffle.checked = false;
    form.elements.count.value = String(c.n);
    form.dispatchEvent(new c.w.Event('submit', { bubbles: true, cancelable: true }));
  }
  await poll(clients, (c) => find(c, '#timer'));
  console.log(`${count} simulated windows reached a running exam before any submission.`);
  const ids = new Set();
  // Verify and release result DOMs in small waves, rather than holding every review page in the test heap.
  for (let i = 0; i < clients.length; i += 8) {
    const group = clients.slice(i, i + 8);
    for (const c of group) {
      const { sessions } = store(c.w),
        a = sessions[0];
      assert.equal(sessions.length, 1);
      assert.equal(a.subject, c.subject);
      assert.equal(a.ids.length, c.n);
      const belongs = {
        business: (id) => (id >= 1 && id <= 20) || (id >= 1021 && id <= 1120),
        islamic: (id) => id >= 101 && id <= 160,
        arabic: (id) => id >= 2001 && id <= 2120,
      }[c.subject];
      assert(a.ids.every(belongs));
      assert.equal(new Set(a.ids).size, c.n);
      const answer = c.correct ? c.key : (c.key + 1) % 4;
      find(c, `input[name=answer][value="${answer}"]`).click();
      find(c, '[data-action=submit-quiz]').click();
      find(c, '[data-action=confirm-action]').click();
    }
    await poll(group, (c) => find(c, '.score-ring'));
    for (const c of group) {
      const { sessions, history } = store(c.w);
      assert.equal(sessions.length, 0);
      assert.equal(history.length, 1);
      assert.equal(history[0].subject, c.subject);
      ids.add(history[0].id);
      assert.equal(
        find(c, '.score-ring').getAttribute('aria-label'),
        `Score ${Math.round((100 * (c.correct ? 1 : 0)) / c.n)} percent`
      );
      c.w.close();
      c.w = null;
    }
  }
  assert.equal(ids.size, count);
  assert.deepEqual(errors, []);
  console.log(
    `${count}/${count} overlapping simulated mock sessions finished with isolated question banks, saves and scores.`
  );
}
run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => clients.forEach((c) => c.w?.close()));
