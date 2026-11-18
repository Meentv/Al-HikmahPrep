// Plain-text course notebooks. Editing never rerenders the focused fields.
const Notebook = (() => {
  const { $, esc } = H;
  const { heading, ico, iconBtn, btn, link, optionList, courseOptions, stamp } = UI;
  const titleOf = (note) => note.title || 'Untitled note';

  function list(s, subject, selected, query) {
    const notes = s.notes.filter(
      (n) => (!subject || n.subject === subject) && H.match(`${n.title} ${n.body}`, query)
    );
    const path = `#notes/${subject || 'all'}`;
    return `<p class="note-list-count muted tiny" role="status">${H.plural(notes.length, 'note')}${query ? ' found' : ''}</p>${notes.length ? notes.map((n) => `<a href="${path}/${esc(n.id)}" class="note-row"${n.id === selected ? ' aria-current="page"' : ''}>${ico('edit')}<span><strong dir="auto">${esc(titleOf(n))}</strong><small>${esc(n.subject ? Catalog.courses[n.subject].short : 'General')} · ${esc(H.date(n.updated))}</small></span>${ico('chevron-right')}</a>`).join('') : `<p class="note-list-empty muted">${query ? 'Try another search.' : 'No notes here yet.'}</p>`}`;
  }

  function view(s, subject, id, query) {
    const note = s.notes.find((n) => n.id === id);
    const activeSubject = note ? note.subject : subject;
    const editor = note || id === 'new';
    const max = s.notes.length >= Store.MAX_NOTES;
    const next = btn('New note', 'new-note', { icon: 'plus', disabled: max });
    return `${heading('Notes', 'Keep definitions, examples and questions to revisit in one place.', 'WORKSPACE / NOTEBOOK', next)}
      <div class="notebook-layout">
        <section class="panel notebook-library" aria-labelledby="note-library-title">
          <div class="spread"><h2 id="note-library-title">Your notebook</h2><span class="chip tone-lilac" id="notebook-total">${H.plural(s.notes.length, 'note')}</span></div>
          <label class="field"><span>Show notes for</span><select id="note-filter">${optionList([['all', 'All subjects'], ...courseOptions()], subject || 'all')}</select></label>
          <label class="search-field"><span class="sr-only">Find a note</span>${ico('search')}<input class="search-input" id="note-query" type="search" maxlength="100" autocomplete="off" placeholder="Find a note…" value="${esc(query)}"></label>
          <div id="note-list" class="note-list">${list(s, subject, id, query)}</div>
        </section>
        ${
          editor
            ? `<section class="panel notebook-editor" aria-labelledby="note-editor-title"><div class="spread wrap"><div class="panel-kicker">${stamp('edit', 'lilac')}<div><span class="eyebrow">PRIVATE NOTE</span><h2 id="note-editor-title">${note ? 'Edit note' : 'New study note'}</h2></div></div>${note ? iconBtn('Delete note', 'trash', 'delete-note') : ''}</div>
          <form id="note-form" class="stack" data-note-id="${esc(note?.id || '')}"><div class="form-grid note-fields"><label class="field"><span>Title</span><input id="note-title" name="title" dir="auto" value="${esc(note?.title)}" maxlength="80" placeholder="Untitled note"></label><label class="field"><span>Subject</span><select name="subject">${optionList([['general', 'General / no subject'], ...courseOptions()], activeSubject || 'general')}</select></label></div>
          <label class="field"><span>Your notes</span><textarea name="body" id="note-body" dir="auto" maxlength="${Store.MAX_NOTE_LENGTH}" rows="10" placeholder="What did you learn? What do you want to revisit?">${esc(note?.body?.startsWith('\n') ? '\n' + note.body : note?.body)}</textarea></label>
          <div class="spread wrap note-editor-foot"><p id="note-status" class="muted tiny" role="status">${note ? (Store.available ? 'Saved in this browser' : 'Kept in this session only') : 'Changes save as you type.'}</p><button class="btn" type="submit">${ico('check')} Save note</button></div></form></section>`
            : `<section class="panel notebook-empty" aria-labelledby="note-editor-title"><div class="notebook-motif" aria-hidden="true">${ico('edit')}</div><span class="eyebrow">YOUR SPACE TO THINK</span><h2 id="note-editor-title">${max ? 'Choose a note to edit.' : 'Give what you learn a place to land.'}</h2><p>${max ? `Your notebook is full (${Store.MAX_NOTES} notes). Delete a note to make room.` : 'Start a note for a subject, jot down a tricky question, or write a recap in your own words.'}</p>${subject ? link('Open course', `#courses/${subject}`, { kind: 'secondary', end: 'arrow-right' }) : ''}</section>`
        }
      </div><p class="muted tiny note-privacy">${ico('lock')} ${Store.available ? 'Notes stay in this browser. They do not sync to other devices.' : 'Browser storage is unavailable. Notes last as long as this page is open.'}</p>`;
  }

  // Called on debounce, Save, and before any route change. Store.refresh merges other tabs first.
  function save(form) {
    const title = H.text(form.elements.title.value).slice(0, 80);
    const body = Store.noteBody(form.elements.body.value);
    const value = form.elements.subject.value;
    const subject = Catalog.isCourse(value) ? value : null;
    if (!form.dataset.noteId && !title && !body.trim())
      return { message: 'Enter a title or write something to save.' };
    const id = form.dataset.noteId || H.uid();
    const result = Store.change((s) => {
      const former = s.notes.find((n) => n.id === id);
      if (!former && form.dataset.noteId)
        return { message: 'This note was deleted in another tab.' };
      if (!former && s.notes.length >= Store.MAX_NOTES)
        return { message: `Your notebook is full (${Store.MAX_NOTES} notes).` };
      if (!former || former.title !== title || former.body !== body || former.subject !== subject) {
        s.notes = [
          { id, title, body, subject, updated: Date.now() },
          ...s.notes.filter((n) => n.id !== id),
        ];
      }
      return { id, subject };
    });
    if (result.id) {
      form.dataset.noteId = result.id;
      result.message = Store.available
        ? 'Saved in this browser'
        : 'Storage unavailable · kept for this page only';
      // The new draft becomes an editable note without losing cursor or undo history.
      const remove = $('button[data-action="delete-note"]', form.parentElement);
      if (!remove) {
        $('.notebook-editor > .spread').insertAdjacentHTML(
          'beforeend',
          iconBtn('Delete note', 'trash', 'delete-note')
        );
        $('#note-editor-title').textContent = 'Edit note';
      }
    }
    return result;
  }
  return { view, list, save };
})();
