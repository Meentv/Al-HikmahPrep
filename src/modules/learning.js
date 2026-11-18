// Revision decks, curated bookmarks and collections. All quiz links stay subject-scoped.
const Learning = (() => {
  const { ico, stamp, tag, link, btn, heading, sec, empty, optionList, courseTabs, tab } = UI;
  function deck(s, subject) {
    const prior = s.flash[subject];
    const filter = prior?.filter || 'all';
    const hard = filter === 'hard' ? Stats.problematic(s.history, subject) : null;
    const possible = Catalog.courses[subject].bank
      .filter(
        (q) =>
          filter === 'all' ||
          (filter === 'known'
            ? s.understood.includes(q.id)
            : !s.understood.includes(q.id) && (s.saved.includes(q.id) || hard.has(q.id)))
      )
      .map((q) => q.id);
    const ids = H.unique([
      ...(prior?.ids || []).filter((id) => possible.includes(id)),
      ...possible,
    ]);
    const priorId = prior?.ids[prior.index];
    const index = ids.includes(priorId)
      ? ids.indexOf(priorId)
      : H.int(prior?.index, 0, Math.max(0, ids.length - 1), 0);
    return { ids, index, filter };
  }
  function flash(s, subject, flipped) {
    const c = Catalog.courses[subject],
      d = deck(s, subject),
      q = Catalog.get(d.ids[d.index]);
    const n = s.reviews[H.key()]?.length || 0,
      goal = s.prefs.cardGoal;
    const known = c.bank.filter((q) => s.understood.includes(q.id)).length;
    return `${heading('Flashcards', 'Recall the answer before turning the card over.', `${Catalog.code} / ACTIVE RECALL`, courseTabs('flashcards', subject))}
    <div class="split flash-layout"><div class="stack"><div class="spread wrap"><div class="tabs" aria-label="Flashcard deck">${[
      ['all', 'All cards'],
      ['hard', 'Difficult'],
      ['known', 'Understood'],
    ]
      .map(([id, label]) => tab(label, 'deck-filter', id, d.filter === id))
      .join(
        ''
      )}</div>${btn('Shuffle', 'deck-shuffle', { kind: 'secondary', icon: 'shuffle', disabled: d.ids.length < 2 })}</div>
    ${q ? `<button class="flash-flip${flipped ? ' flipped' : ''}" data-action="flip" type="button" aria-pressed="${flipped}" aria-label="${flipped ? 'Show question' : 'Reveal answer'}" aria-describedby="${flipped ? 'flash-answer flash-explanation' : 'flash-prompt'}"><span class="flash-core"><span class="flash-face flash-front" aria-hidden="${flipped}"><span class="flash-label">${ico('layers')} CARD ${H.pad(d.index + 1)} / ${H.pad(d.ids.length)}</span><span class="flash-text" id="flash-prompt">${UI.rich(q.text)}</span><span class="flash-hint">${ico('swap')} Tap to reveal answer</span></span><span class="flash-face flash-back" aria-hidden="${!flipped}"><span class="flash-label">${ico('check-circle')} ${H.esc(Catalog.topics[q.topic])}</span><span class="flash-text" id="flash-answer" dir="auto">${UI.rich(q.options[q.answer])}</span><span class="flash-explanation" id="flash-explanation">${UI.rich(q.explanation)}</span><span class="flash-hint">${ico('swap')} Tap to return</span></span></span></button><div class="spread wrap flash-actions"><div class="cluster">${btn('Previous', 'deck-move', { kind: 'secondary', icon: 'arrow-left', data: { delta: -1 }, disabled: d.index === 0 })}${btn('Next card', 'deck-move', { kind: 'secondary', end: 'arrow-right', data: { delta: 1 }, disabled: d.index === d.ids.length - 1 })}</div><div class="cluster">${UI.bookmarks(q)}${btn(s.understood.includes(q.id) ? 'Marked understood' : 'Mark as understood', 'understood', { icon: 'check', data: { qid: q.id }, pressed: s.understood.includes(q.id) })}</div></div>` : empty('layers', 'No cards in this deck', d.filter === 'hard' ? 'Questions you bookmark, flag in a submitted quiz, or recently answer incorrectly appear here until marked understood.' : 'Mark a card as understood to see it here.', btn('All cards', 'deck-filter', { data: { value: 'all' }, kind: 'secondary' }))}</div>
    <aside class="panel pad stack flash-aside"><div class="panel-kicker">${stamp('target', 'lilac')}<div><span class="eyebrow">DAILY REVISION</span><h2>Recall target</h2></div></div><div class="day-body">${UI.ring(n, goal, 'Unique cards reviewed today')}<div><strong>${n >= goal ? 'Target met' : 'Cards turned today'}</strong><small>Each distinct card counts once.</small></div></div>${UI.line('Understood in this subject', known, c.bank.length)}${btn('Edit study goals', 'goals', { kind: 'secondary', icon: 'edit' })}</aside></div>`;
  }
  function markReview(subject, d) {
    const id = d.ids[d.index];
    if (!id || Catalog.get(id).subject !== subject) return;
    const day = H.key();
    if (Store.data.reviews[day]?.includes(id)) return;
    Store.change((s) => {
      s.flash[subject] = d;
      s.reviews[day] = H.unique([...(s.reviews[day] || []), id]);
      const keys = Object.keys(s.reviews).sort();
      for (const past of keys.slice(0, Math.max(0, keys.length - 400))) delete s.reviews[past];
    });
  }
  function bookmarks(s, filt) {
    const selected = s.collections.find((c) => c.id === filt.collection);
    const ids = selected ? selected.ids : s.saved;
    return `${heading('Bookmarks', 'Build a revision shelf of questions and topics you want to revisit.', `${Catalog.code} / SAVED REVISION`, btn('New collection', 'new-collection', { icon: 'plus' }))}
    <div class="split bookmark-layout"><section class="stack"><div class="panel pad stack"><div class="spread wrap"><div class="search-field"><label for="saved-query" class="sr-only">Search saved questions</label>${ico('search')}<input class="search-input" id="saved-query" type="search" placeholder="Search saved questions" value="${H.esc(filt.q)}" maxlength="100"></div><label class="field"><span>Subject</span><select id="saved-subject">${optionList([['all', 'All subjects'], ...UI.courseOptions()], filt.subject)}</select></label></div><div class="tabs" aria-label="Collections">${tab('All saved', 'collection-filter', 'all', !selected, s.saved.length)}${s.collections.map((c) => tab(c.name, 'collection-filter', c.id, selected?.id === c.id, c.ids.length)).join('')}</div><div class="cluster">${Catalog.keys
      .filter((key) => ids.some((id) => Catalog.get(id).subject === key))
      .map((key) =>
        link(
          `Practise ${Catalog.courses[key].short}`,
          `#practice/${key}/${selected?.id || 'saved'}`,
          {
            kind: 'subtle',
            icon: 'zap',
          }
        )
      )
      .join(
        ''
      )}${selected ? btn('Remove collection', 'delete-collection', { kind: 'secondary', icon: 'trash', data: { id: selected.id } }) : ''}</div></div><div id="saved-results">${savedResults(s, filt)}</div></section>
    <aside class="panel pad stack"><div class="panel-kicker">${stamp('bookmark', 'lilac')}<div><span class="eyebrow">REVISION TOPICS</span><h2>Saved topics</h2></div></div>${
      s.savedTopics.length
        ? `<div class="topic-list">${s.savedTopics
            .map((key) => {
              const [subject, topic] = key.split(':');
              return `<div class="topic-row"><a href="#practice/${subject}/${topic}"><strong>${H.esc(Catalog.topics[topic])}</strong><small>${H.esc(Catalog.courses[subject].short)}</small></a>${UI.iconBtn('Remove topic bookmark', 'bookmark', 'topic-save', { subject, topic }, true)}</div>`;
            })
            .join('')}</div>`
        : `<p class="muted tiny">Save topics from your course or question bank to revise them here.</p>`
    }${link('Browse the banks', '#study', { kind: 'secondary', icon: 'book' })}</aside></div>`;
  }
  function savedResults(s, filt) {
    const col = s.collections.find((c) => c.id === filt.collection);
    const qs = (col ? col.ids : s.saved)
      .map(Catalog.get)
      .filter(
        (q) => (filt.subject === 'all' || q.subject === filt.subject) && Catalog.search(q, filt.q)
      );
    return `<div class="bank-summary" role="status">${H.plural(qs.length, 'saved question')}</div><div class="q-list">${qs.length ? qs.map((q) => UI.question(q, { manage: true })).join('') : empty('bookmark', filt.q ? 'No matches' : 'No saved questions here', filt.q ? 'Try another keyword or subject.' : 'Use the bookmark icon in Study, Practice or your answer review.', link('Open a question bank', '#study', { kind: 'secondary', end: 'arrow-right' }))}</div>`;
  }
  return { deck, flash, markReview, bookmarks, savedResults };
})();
