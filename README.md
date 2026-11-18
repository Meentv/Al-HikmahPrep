# HikmahPrep 2026 — Prism

A frontend-only revision workspace for Al-Hikmah University 200-level students. **Open `site/index.html`**, or use the live preview to keep local storage on one origin. There is no account, backend, runtime package, CDN dependency or PDF viewer.

## Start studying

| Separate question bank | Past questions | New handout revision | Total |
|---|---:|---:|---:|
| Basic Arabic Conversation II | — | 120 | 120 |
| Entrepreneurship | 20 | 100 | 120 |
| Basic Concepts of Islam | 60 | — | 60 |
| **Total** | **80** | **220** | **300** |

GNS 203 is the workspace label; it does not rename the historical GNS 204 and GNS 205 sources. Questions, practice, and exams never mix subjects. Generated questions are labelled as revision, include explanations and cite the relevant PDF page. They are not official past questions or an official marking key.

- **Practice and Examinations:** 60 questions by default; choose 20, 40, 60, 80, 100, or 120 where the bank allows it. Filtering makes ineligible sizes unavailable and offers the exact pool size when it falls between presets. Islam has 60 questions; no repeats are added to enable larger sessions. Practice can be filtered by topic, level, handout/past-paper source, bookmarks or collection. Mocks offer a time limit (1–180 minutes) and source selection.
- **Shuffle and resume:** Normal sessions sample without replacement. New handout answers also shuffle; printed answer order stays intact for past questions. An unfinished session keeps its question IDs/order, option order, answers, flags, and position. Restart clears answers and flags and reshuffles the same selection if it was originally shuffled. Practice reveals feedback as you answer; a mock reveals the key only after submission or expiry. Scores give one point for a correct answer; blanks and wrong answers score zero.
- **Notes:** Use the rail, mobile **More**, command palette, or a course's **Course notes** link. Create, edit, search, organise by subject, or delete a private plain-text note. Notes automatically save shortly after edits and on navigation; **Save note** saves immediately. Up to 40 notes, 80 characters per title, and 8,000 per body. Arabic and English are supported. Reset study progress keeps notes; clear all data removes them after confirmation.
- **Other study tools:** Read the question banks and course revision guides; use flashcards, topic bookmarks, collections, analytics, study goals, and personal exam reminders. Announcements labelled *Demo* are examples, not university notices. Activity, coverage, streaks, and scores use real local answers and reviewed cards. Goals use Africa/Lagos dates.
- **Navigation and appearance:** Hash routes support Back/Forward and direct links. Use **Ctrl+K / ⌘K** to find a page, course, or question (e.g. `Arabic #120`). The default for new browsers is dark; light/system and existing preferences are supported. Frosted accents do not replace opaque reading surfaces. The book responds to a fine mouse pointer, and below-fold sections animate on entry. Reduced-motion settings disable those effects.

## Run or publish

```sh
python build.py
node serve.mjs
# Open http://localhost:3000/ (or the Arena preview)
```

`build.py` uses only Python's standard library. `serve.mjs` is an optional static preview and local test server, not a required application service. Deploy **only** `site/` on HTTPS; apply the supplied `_headers` if the host supports it, or configure equivalent headers. The single file also works offline without Node. Persistence in a file viewer, in private mode, or on `file://` depends on its storage policy. If storage is blocked the app identifies this and uses temporary in-memory state.

### Deploy to Vercel

Leave **Root Directory** unset (the repository root) so Vercel can read `vercel.json`. It selects the **Other** framework preset, skips install and build, and publishes the checked-in `site/` directory. Open your deployment at `/`, not `/site/`. The page keeps its generated script policy in the HTML; `vercel.json` sets the response headers because Vercel does not read `site/_headers`.

If an existing deployment returns `404: NOT_FOUND`, redeploy from a commit containing `vercel.json`. To fix a deployment from an older commit, set the **Output Directory** override to `site`, choose **Other**, and leave the build and install commands blank. Keep **Root Directory** at the repository root. For production, deploy from your project's configured production branch (usually `main`).

After changing `src/`, run `python3 build.py` and commit the regenerated `site/index.html` and `site/_headers` before deploying. Vercel serves those checked-in files as-is.

### Folder structure

```text
HikmahPrep/
├── vercel.json                 # Vercel static deployment settings
├── site/                       # publishable index.html and optional _headers
├── src/
│   ├── shell.html, sprite.svg  # document and inlined icon set
│   ├── app.js                  # route, focus and event controller
│   ├── questions.js, gns204.js  # original 80 questions, unchanged
│   ├── data/                   # two handout banks, source metadata, revision guides
│   ├── modules/                # state, catalogue, views, sessions, notes, motion
│   ├── css/                    # tokens, shell, dashboard, learning, glass accents
│   └── assets/, licenses/      # embedded WebP, WOFF2 fonts, OFL notices
├── tools/                      # catalogue, browser, accessibility and local load tests
├── docs/                       # decisions, verification, privacy and limitations
├── build.py, serve.mjs
└── README.md
```

### Data and source notes

- `GNS 203.pdf`: *Basic Arabic Conversation II*, Dr. A.A. Atotileto, edited by Dr. M.J. Dosunmu, Al-Hikmah University. Whitespace, bidi, and ambiguous labels were checked against rendered pages. In particular, pages 14–15 are the hotel lesson despite a duplicated English bank heading.
- `Intro%20Entrepreneurship.pdf`: the supplied *Intro Entrepreneurship* handout; questions are based on PDF pages 1–40 (page 41 has no substantive teaching material).
- Retained sources: *GNS 205 Solved* (credited to Solaahudeen B.A.A Attibyaaniy) and the *GNS 204* 2019/2020 past paper, Al-Hikmah University General Studies Unit. Existing editorial key corrections and references remain. Source PDFs are not included in the published files or distributable ZIPs.
- The handout row format is `permanent course number | PDF page | topic | f/a/c | prompt | key | distractor 1 | distractor 2 | distractor 3 | explanation`. New business IDs are `1021–1120`; Arabic IDs are `2001–2120`. Keep permanent course numbers and canonical option indexes stable once shipped. Update `tools/check_catalog.cjs` when intentionally expanding coverage.

## Storage and verification

The same `hikmahprep.gns203.v5` key preserves data on the same browser origin and still imports v1–v4. Different origins or browser profiles do not share saves. Browser storage is not encrypted or backed up; clearing it loses the data. Mocks are practice assessments, not secured exams.

See [Design decisions](docs/DESIGN.md), [Testing report](docs/TESTING.md), and [Privacy and defensive review](docs/SECURITY.md).

Created by **Meendev** · [WhatsApp 09132798151](https://wa.me/2349132798151)
