// Shared DOM, formatting, and validation utilities. No untrusted strings become markup.
const H = (() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (text) =>
    String(text ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const text = (value) =>
    typeof value === 'string'
      ? value.trim().replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '')
      : '';
  const norm = (value) =>
    String(value ?? '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[’ʻʾʿ']/g, '');
  const words = (value) => norm(value).trim().split(/\s+/).filter(Boolean);
  const match = (value, q) => words(q).every((word) => norm(value).includes(word));
  const int = (value, min, max, fallback = min) =>
    Number.isFinite(Number(value)) && value !== '' && value != null
      ? Math.min(max, Math.max(min, Math.round(Number(value))))
      : fallback;
  const finiteTime = (value) => Number.isFinite(value) && value > 0 && value < 4102444800000;
  const token = (value) => typeof value === 'string' && /^[a-z0-9-]{1,96}$/i.test(value);
  const uid = () =>
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const unique = (values) => [...new Set(values)];
  const shuffle = (values) => {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const pad = (n) => String(n).padStart(2, '0');
  const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
  const percent = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);
  const opts = { timeZone: 'Africa/Lagos' };
  const keyFormat = new Intl.DateTimeFormat('en-CA', {
    ...opts,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const key = (at = Date.now()) => {
    const parts = Object.fromEntries(
      keyFormat.formatToParts(at).map(({ type, value }) => [type, value])
    );
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const cal = new Intl.DateTimeFormat('en-NG', {
    ...opts,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const calLong = new Intl.DateTimeFormat('en-NG', {
    ...opts,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const validDay = (value) =>
    typeof value === 'string' &&
    /^20\d{2}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  const dayAt = (value) => Date.parse(`${value}T12:00:00Z`);
  const dayOffset = (value, by) => key(dayAt(value) + by * 86400000);
  const date = (timestamp) => cal.format(timestamp);
  const longDate = () => calLong.format(Date.now());
  const weekday = (value) =>
    new Intl.DateTimeFormat('en-NG', { ...opts, weekday: 'short' }).format(dayAt(value));
  const initials = (value) =>
    Array.from(
      value
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => Array.from(s)[0] || '')
        .join('')
    )
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'S';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = (ms) => {
    const s = Math.ceil(Math.max(0, ms) / 1000);
    return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  };
  const safeRef = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        ['quran.com', 'sunnah.com'].includes(url.hostname)
        ? url.href
        : '';
    } catch {
      return '';
    }
  };
  return {
    $,
    $$,
    esc,
    text,
    norm,
    words,
    match,
    int,
    finiteTime,
    token,
    uid,
    unique,
    shuffle,
    pad,
    plural,
    percent,
    key,
    date,
    longDate,
    dayAt,
    dayOffset,
    validDay,
    weekday,
    initials,
    reduce,
    clock,
    safeRef,
  };
})();
