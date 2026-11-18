# Design and implementation — Prism

Prism replaces the Study Desk skin. It keeps the working study engine and uses a new optical-book motif, a violet-blue palette, and clearer choices for getting started. It does not copy a dashboard template.

## 1 · Audit and research

- Inspected the existing shell, catalogue and quiz/storage modules before changing the app. Kept scoring, subject-scoped routing, resume and review, v1–v5 compatibility, existing source credit and the original question files.
- Reviewed [Brilliant](https://brilliant.org/) for the distinction between interactive learning and practice, [Krackerz Learning on Awwwards](https://www.awwwards.com/sites/krackerz-learning) for a 2026 education example with deliberate artwork and interaction, and [navigation patterns](https://brainy.ink/paper/navigation-design-patterns) for grouping secondary destinations. Applied different artwork, palette and interactions specific to HikmahPrep.
- Used [MDN's backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) and [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) documentation for progressive enhancement. No dependency or third-party client code ships.

## 2 · Design system

- A dark violet ink palette and a separate paper-light theme. Lilac indicates action/focus; purple, teal and amber identify the three course tiles. Focus, selection and correctness have shape, border, label, or icon cues in addition to colour.
- The embedded optical-glass book gives the workspace an identity. The sticky utility bars and small hero elements use selective blur when supported, with opaque fallbacks. Questions, options, editor fields, reviews, and analytics use solid backgrounds for reading.
- Manrope and a local Noto Sans Arabic subset ship with OFL notices. Mixed script gets explicit direction isolation and Arabic language metadata where it appears in the authored content. All visuals are embedded; the home view makes no network calls for libraries or assets.

## 3 · Navigation and scope

The desktop rail groups Workspace, Exam Prep and Overview. Mobile provides Home, Courses, Practice, Exams and Cards, with remaining destinations in More. Notes is in Workspace, More, Quick actions and command search. Course links scope reading, practice, notes and exams. Hash aliases and existing question deep links still resolve. A note deep link only resolves in the browser that has that note; it does not make the note shareable.

## 4 · Core study

The Dashboard surfaces resume/start, the current goal, course coverage, recent activity, weak-topic suggestions, notes and personal reminders. Course detail exposes actual question counts, editorial difficulty, a topic map and a revision guide. Arabic and Entrepreneurship receive new authored banks and page-level attribution. The Islam bank remains exactly the original 60.

Practice and mock setup share six count choices. The pool is recalculated after filter changes; unavailable choices are disabled. Fisher–Yates sampling prevents repeats. Shuffled handout answers use a persisted seed and canonical answer indexes, so appearance cannot change the answer key. Existing past options and past results keep their original order. Old active sessions still operate without a seed. The timer stores an absolute deadline while running and remaining time when paused. A correct answer, incorrect answer and unanswered item remain distinct in review.

## 5 · Learning tools and privacy

Flashcards can be shuffled, filtered and resumed with recall goals. The active card face has an accessible description. Bookmarks and collections drive filtered practice. The notebook is plain text, supports multi-line Arabic, and does not rerender the editor while typing. Changes save locally with a short debounce, on explicit save, and before leaving the page. Course filters and local search make saved notes findable; deleting and resetting require confirmation.

## 6 · Analytics

Coverage uses distinct submitted question IDs. Score is correct / all questions; answer accuracy excludes blanks. Streak/goal days are counted in Africa/Lagos. Trend chart data is also available as a table. No artificial growth numbers or institutional notifications are used. Demo announcements and real personal reminders are distinguished.

## 7 · Motion and touch

- Mouse tracking is limited to the decorative hero. At most one animation-frame update is requested per pointer event burst. The art translates by up to 7 px and rotates by up to 1° in either direction; controls do not move under the pointer. Touch does not require hover effects.
- Off-screen sections get a short entrance once on intersection. Their content is never held invisible waiting for JS. A native scroll timeline fills the read-progress line on compatible browsers. Unsupported motion APIs fall back to short CSS route transitions or static rendering.
- `prefers-reduced-motion` suppresses route movement, pointer tracking, entrance effects, scroll progress and flip movement. State changes still happen. Dialogs use native focus handling; session counts are native labelled radios.

## 8 · QA

The redesigned routes, controls, motion, local storage, previous answer keys and new source mappings were tested against the actual bundle. See [TESTING.md](TESTING.md) for the browser, simulated session and HTTP results and their limits.
