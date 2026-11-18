// Canonical catalogue, authored rows, source bounds and session invariants.
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = resolve(__dirname, '..');
const files = [
  'src/questions.js',
  'src/gns204.js',
  ...['arabic-revision', 'business-revision', 'revision'].map((n) => `src/data/${n}.js`),
  ...['core', 'catalog', 'store', 'analytics', 'components', 'quiz'].map(
    (n) => `src/modules/${n}.js`
  ),
];
const {
  Catalog: c,
  GNS205_QUESTIONS: business,
  GNS204_QUESTIONS: islamic,
  Quiz,
  Stats,
  ARABIC_REVISION_ROWS,
  BUSINESS_REVISION_ROWS,
} = vm.runInNewContext(
  files.map((f) => readFileSync(resolve(root, f), 'utf8')).join('\n') +
    '\n({Catalog,GNS205_QUESTIONS,GNS204_QUESTIONS,Quiz,Stats,ARABIC_REVISION_ROWS,BUSINESS_REVISION_ROWS})'
);
const plain = (x) => JSON.parse(JSON.stringify(x));
const sizes = [20, 40, 60, 80, 100, 120];
assert.deepEqual(plain(Quiz.sizes), sizes);
assert.equal(c.all.length, 300);
assert.equal(new Set(c.all.map((q) => q.id)).size, 300);
for (const [key, source, offset, expected] of [
  ['business', business, 0, 20],
  ['islamic', islamic, 100, 60],
]) {
  const bank = c.courses[key].bank;
  for (let i = 0; i < expected; i++) {
    const q = bank[i];
    assert.equal(q.number, i + 1);
    assert.equal(q.id, offset + i + 1);
    assert.equal(q.subject, key);
    assert(q.sourceType === 'past');
    assert.deepEqual(plain(Quiz.order({ optionSeed: 121 }, q)), [0, 1, 2, 3]);
    for (const prop of ['text', 'options', 'answer', 'explanation', 'note', 'reference', 'topic'])
      assert.equal(JSON.stringify(q[prop]), JSON.stringify(source[i][prop]));
  }
}
for (const [subject, rows, min, max, offset, expected] of [
  ['arabic', ARABIC_REVISION_ROWS, 2, 24, 2000, 120],
  ['business', BUSINESS_REVISION_ROWS, 1, 40, 1000, 100],
]) {
  const seen = new Set();
  const fields = rows
    .trim()
    .split('\n')
    .map((line) => line.split('|'));
  assert.equal(fields.length, expected);
  for (const [number, page, topic, level, prompt, key, ...rest] of fields) {
    const q = c.get(offset + Number(number));
    assert(!seen.has(number));
    seen.add(number);
    assert(
      q && q.subject === subject && q.sourceType === 'revision' && q.number === Number(number)
    );
    assert(page >= min && page <= max && Number.isInteger(Number(page)));
    assert(q.origin.endsWith(`PDF p. ${page}`));
    assert.equal(q.topic, topic);
    assert.equal(q.level, { f: 'foundation', a: 'applied', c: 'challenge' }[level]);
    assert.equal(q.text, prompt);
    assert.equal(q.options[q.answer], key);
    assert.equal(q.explanation, rest.at(-1));
    assert.deepEqual(
      plain(q.options).filter((_, i) => i !== q.answer),
      rest.slice(0, -1)
    );
  }
}
for (const [subject, total] of [
  ['arabic', 120],
  ['business', 120],
  ['islamic', 60],
]) {
  const bank = c.courses[subject].bank;
  assert.equal(bank.length, total);
  assert.deepEqual(
    plain(bank.map((q) => q.number)),
    Array.from({ length: total }, (_, i) => i + 1)
  );
  const prompts = new Set();
  for (const q of bank) {
    const norm = q.text.toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim();
    assert(!prompts.has(norm), q.text);
    prompts.add(norm);
    assert(
      q.explanation.trim() &&
        c.difficulty[q.level] &&
        c.isTopic(subject, q.topic) &&
        c.topics[q.topic]
    );
    assert.equal(new Set(q.options.map((x) => x.trim().toLowerCase())).size, 4);
    assert(q.options.every((x) => x.trim()));
    assert(q.answer >= 0 && q.answer < 4 && Number.isInteger(q.answer));
  }
  for (const mode of ['practice', 'exam']) {
    assert.equal(Quiz.make(subject, mode).ids.length, 60);
    for (const count of sizes.filter((n) => n <= total)) {
      const a = Quiz.make(subject, mode, { count });
      assert.equal(a.ids.length, count);
      assert.equal(new Set(a.ids).size, count);
      assert(a.ids.every((id) => c.get(id).subject === subject));
      assert.notDeepEqual(plain(a.ids), plain(bank.slice(0, count).map((q) => q.id)));
      if (mode === 'exam') assert.equal(a.duration, count * 60000);
      const q = c.get(a.ids[0]);
      const permutation = plain(Quiz.order(a, q));
      assert.deepEqual(plain(Quiz.order(plain(a), q)), permutation);
      assert.deepEqual([...permutation].sort(), [0, 1, 2, 3]);
      a.answers[q.id] = q.answer;
      assert.equal(Stats.grade(a).correct, 1);
      assert.equal(Stats.grade(a).blank, count - 1);
    }
  }
}
assert.equal(Quiz.pool('business', { source: 'past' }).length, 20);
assert.equal(Quiz.pool('business', { source: 'revision' }).length, 100);
assert.equal(Quiz.pool('islamic', { source: 'revision' }).length, 0);
assert.equal(Quiz.make('arabic', 'practice', { source: 'past' }), null);
assert.equal(Quiz.make('business', 'exam', { count: 120, minutes: 3 }).duration, 180000);
const q = c.get(2001);
assert(
  new Set(Array.from({ length: 25 }, (_, i) => Quiz.order({ optionSeed: i + 1 }, q).join())).size >=
    4
);
console.log(
  '300 valid items; 80 unchanged original mappings, 220 page-referenced revisions, isolated shuffled pools, stable answer permutations and canonical grades: pass'
);
