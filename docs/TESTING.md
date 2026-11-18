# HikmahPrep Prism — release verification

**Run date:** 18 November 2026, Africa/Lagos. These results are for the Prism bundle, not the prior Study Desk release. Tests used the owned loopback preview on port 3000. The app itself is HTML, CSS and vanilla JavaScript; the test tools are optional.

## Functional and responsive coverage

| Area | Verified on the rebuilt release |
|---|---|
| Catalogue | 300 unique IDs and 4 distinct options per question. All 80 original questions, options, keys, explanations and references match the previous release. There are 220 authored rows with page references, validated topic bindings and answer mappings. Arabic source pages were visually checked and ambiguous items corrected. Source checks are not an official university key. |
| Navigation | 11 grouped rail destinations, collapse/expand and tooltip; quick actions, Ctrl+K and arrow/Enter/Escape; Back/Forward and prior hash links; mobile Home, Courses, Practice, Exams, Cards and More. Notes works in the command palette and mobile More sheet. |
| Study | Separate Arabic, Entrepreneurship and Islam views, `#120` deep link and Arabic glyph font coverage; topic/difficulty, bookmark collection and keyword search; author/page labels in the question explanations. |
| Counts and shuffle | All six lengths in both modes; 60 selected by default. Disabled higher lengths on Islam, 20/100 past/revision filter behaviour on Entrepreneurship, exact small-pool fallback, and zero-match handling. No duplicate or cross-subject IDs. Display letters are stable across resume/review while grading uses canonical answer keys. |
| Practice and exams | 80-question shuffled practice, reload with answers, flags and exact order intact; 120-question Arabic mock with a manually set limit. Regression coverage for immediate practice feedback, clearing answers, map moves, restart, mock answer concealment, save/pause, cancel, auto-submit, grading and exam history. |
| Notes | Creating, typing, autosaving, saving explicitly, switching subject, searching, deleting and cancelling deletion. Verified Arabic, line breaks, leading spaces and literal markup survive reload; instant navigation flushes edits. Reset progress keeps notes, clear all removes them. With blocked storage, notes work and explicitly state they are temporary. |
| Other tools | Flashcard flip and accessible active-face description, difficult/understood, shuffle and persisted position. Bookmarks, collections, daily goals, trends and chart data, personal reminders, notifications/demos and reset remain functional. |
| Compatibility | v1–v4 migrations and a prior v5 save with preserved answers, bookmarks and chosen theme; old mixed histories are partitioned by subject. Standalone file playback and a script-only sandboxed iframe worked. |
| Layout and motion | 10 viewport widths (320, 390, 600, 715, 800, 861, 1024, 1280, 1440 and 1920 px) × 11 views checked with no horizontal page overflow or duplicate DOM IDs in the tested states. Desktop, tablet-width layouts and touch emulation. Verified pointer-follow and release, scroll entry, native route transitions, reduced motion and missing-API fallback. |

**Axe-core 4.10.3:** no automatically detected WCAG A/AA violations across **42 scans** (21 states × light and dark), including mixed-script study, an expanded answer review, feedback, dialog, and desktop/mobile notes. Also exercised keyboard focus and touch in Chromium. This is not a full manual accessibility audit, a multi-engine matrix, or a conformance certificate.

## Static load and isolated sessions

On each wave the test runner opened and held 1,000 independent TCP connections before releasing a GET burst. It required a complete gzip `200` response on every connection and checked the decompressed SHA-256 against the built file. No records or user devices were involved.

| Wave | Ready connections | Verified HTTP 200 | Errors | Connection setup | Burst after release |
|---|---:|---:|---:|---:|---:|
| 1 | 1,000 | 1,000 | 0 | 111 ms | 329 ms |
| 2 | 1,000 | 1,000 | 0 | 112 ms | 337 ms |
| 3 | 1,000 | 1,000 | 0 | 124 ms | 256 ms |

**3,000/3,000** verified responses. After connection setup: **211 ms median, 305 ms p95, 313 ms max**. Sandbox had 2 reported CPUs, ~1.9 GiB RAM, a 4,096 listen backlog and an 8,192 descriptor limit for the server/client. Peak simultaneous connections were 1,000, not 3,000. This is a loopback burst benchmark, not the Arena proxy, a CDN test, a sustained soak test, or a promise of 1,000 concurrent real students.

**120/120 simulated mock sessions** across all three banks reached a running timer before any was submitted, then finished with separate storage, IDs and known scores. This jsdom harness executes the same bundle in isolated windows and omits CSS and decorative assets. It shares compilation and checks result windows in small batches to stay within the test runner's heap; an initial run that retained all review DOMs exceeded that heap. Browser tests separately exercised visual rendering, shuffled practice, and timed expiry.

## Browser performance lab

Three cold Chromium runs at 390 × 844, using 4× CPU slowdown, 140 ms latency and roughly 1.6 Mbit/s downstream. **Median LCP: 1.45 s; max CLS: 0.0000**. Longest initial tasks were 202–231 ms under this throttle; this is a potential optimisation area, not an INP measurement. The full bundle is **495,018 B raw, 200,425 B Brotli, 207,645 B gzip**, with no separate image, font or API requests. Answers and explanations for closed Study/Review items are built only on demand so long sets do not start with thousands of hidden option nodes. The lab also exercised touch navigation and starting a 60-question practice under the same settings. These are local emulated results, not field data or a physical-phone test.

## Defensive verification and limitations

The generated script hash matches the restrictive CSP; an unapproved inline script is blocked. Profile, collection, note and reminder text stays literal. Unsupported methods and source/document paths are refused by the local preview. Invalid course IDs, option indexes, and dates in stored records are not trusted. Initial and core browser workflows made no third-party requests. The production `_headers` adds anti-framing when the host applies it; verify it after publishing.

All progress and notes are local, unencrypted, and not synced or backed up. Browser policies can block storage; private browsing, clearing site data or moving to another origin can lose access. No official grade or secured exam can be inferred from a client-side score. See [SECURITY.md](SECURITY.md).

## Reproduce

```sh
python build.py
ulimit -n 8192
node serve.mjs
```

In another shell:

```sh
node tools/check_catalog.cjs
python -m pip install playwright
python -m playwright install chromium
python tools/qa_browser.py
python tools/qa_revision.py
AXE_PATH=/path/to/local/axe.min.js python tools/qa_accessibility.py
python tools/qa_security.py
python tools/qa_lab.py
ulimit -n 8192
python tools/load_test.py --clients 1000 --waves 3
npm install --no-save --no-package-lock jsdom@26.1.0
node --max-old-space-size=1250 tools/quiz_session_test.cjs 120
```

Built HTML SHA-256: `aac07191b3a9c2c8855c3fe24203dac9178de084f8ff795bf30a0c10d659d8c8`.
