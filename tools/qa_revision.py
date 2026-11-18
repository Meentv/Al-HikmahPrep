"""Browser coverage of handout banks, session counts and local notebooks."""
import re
from playwright.sync_api import expect, sync_playwright
from qa_browser import BASE, KEY, goto, state, finish


def number_choices(page):
    return page.locator('.count-choice input').evaluate_all('els => els.map(el => [Number(el.value), el.disabled])')


def choose(page, n):
    page.locator('.count-choice').filter(has=page.locator(f'input[value="{n}"]')).click()
    expect(page.locator('input[name=count]:checked')).to_have_value(str(n))


def keyed_answer(page, qid):
    # The canonical slot is deliberately distinct from the answer's current display letter.
    index = (qid - 2001) % 4
    opt = page.locator(f'#option-list input[value="{index}"]')
    label = opt.locator('xpath=..')
    letter = label.locator('.option-letter').inner_text()
    label.click()
    expect(opt).to_be_checked()
    return index, letter


def sessions(browser):
    page = browser.new_page(reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    for mode in ['practice', 'exams']:
        for subject, total in [('business', 120), ('arabic', 120), ('islamic', 60)]:
            goto(page, f'{mode}/{subject}', '.session-form')
            assert number_choices(page) == [[n, n > total] for n in [20, 40, 60, 80, 100, 120]]
            expect(page.locator('input[name=count]:checked')).to_have_value('60')
            expect(page.get_by_label('Shuffle questions')).to_be_checked()
            if mode == 'exams':
                expect(page.get_by_label('Time limit (minutes)')).to_have_value('60')
    goto(page, 'practice/business', '#practice-form')
    choose(page, 100)
    page.get_by_label('Question source').select_option('revision')
    expect(page.locator('#pool-status')).to_contain_text('100 matching questions')
    expect(page.locator('input[name=count]:checked')).to_have_value('100')
    page.get_by_label('Question source').select_option('past')
    expect(page.locator('input[name=count]:checked')).to_have_value('20')
    expect(page.locator('#pool-status')).to_contain_text('Larger sets need more matching questions.')
    page.get_by_label('Question source').select_option('saved')
    expect(page.locator('#start-session')).to_be_disabled()
    expect(page.locator('#pool-status')).to_contain_text('No questions match')
    goto(page, 'study/arabic/120', '.q-content')
    expect(page.locator('.q-row')).to_have_count(1)
    expect(page.locator('.q-content')).to_contain_text('Basic Arabic Conversation II · PDF p. 24')
    expect(page.locator('.q-summary bdi[lang=ar]').first).to_be_visible()
    page.evaluate('document.fonts.ready')
    assert page.evaluate("document.fonts.check('500 18px \"Noto Study Arabic\"', 'السلام عليكم')")
    goto(page, 'courses/arabic', '.guide-entry')
    page.locator('.guide-entry summary').first.click()
    expect(page.locator('.guide-entry p').first).to_contain_text('السلام عليكم')

    goto(page, 'practice/arabic', '#practice-form')
    choose(page, 80)
    page.get_by_role('button', name='Start practice', exact=True).click()
    expect(page.locator('#question-map button')).to_have_count(80)
    activity = state(page)['sessions'][0]
    qid = activity['ids'][0]
    assert len(set(activity['ids'])) == 80 and all(2001 <= q <= 2120 for q in activity['ids'])
    assert activity['optionSeed'] != 0
    option_order = page.locator('#option-list input').evaluate_all('els => els.map(el => el.value)')
    value, letter = keyed_answer(page, qid)
    expect(page.locator('#feedback')).to_contain_text(f'Correct. The answer is {letter}:')
    expect(page.locator('#feedback')).to_contain_text('PDF p.')
    page.get_by_role('button', name='Flag for review').click()
    page.get_by_role('button', name='Next question').click()
    page.get_by_role('button', name='Save & exit').click()
    expect(page.locator('.resume-row')).to_contain_text('Question 2 of 80')
    page.reload()
    page.locator('.resume-row').click()
    expect(page.locator('.question-meta')).to_contain_text('QUESTION 02 / 80')
    page.get_by_role('button', name='Previous').click()
    expect(page.locator(f'#option-list input[value="{value}"]')).to_be_checked()
    assert page.locator('#option-list input').evaluate_all('els => els.map(el => el.value)') == option_order
    resumed = state(page)['sessions'][0]
    assert resumed['ids'] == activity['ids'] and resumed['optionSeed'] == activity['optionSeed'] and resumed['flags'] == [qid]
    finish(page, 'Finish practice')
    expect(page.locator('#review-list .answers-read')).to_have_count(0)
    page.locator('#review-list summary').first.click()
    expect(page.locator('#review-list .q-row').first.locator('.answers-read .right > span')).to_have_text(letter)
    expect(page.locator('.score-ring')).to_have_attribute('aria-label', 'Score 1 percent')

    goto(page, 'exams/arabic', '#exam-form')
    choose(page, 120)
    expect(page.get_by_label('Time limit (minutes)')).to_have_value('120')
    page.get_by_label('Time limit (minutes)').fill('4')
    choose(page, 100)
    expect(page.get_by_label('Time limit (minutes)')).to_have_value('4')
    choose(page, 120)
    page.get_by_role('button', name='Begin mock exam').click()
    expect(page.locator('#timer')).to_have_text('04:00')
    expect(page.locator('#question-map button')).to_have_count(120)
    attempt = state(page)['sessions'][0]
    assert sorted(attempt['ids']) == list(range(2001, 2121)) and attempt['ids'] != sorted(attempt['ids'])
    value, letter = keyed_answer(page, attempt['ids'][0])
    expect(page.locator('#feedback')).to_be_empty()
    assert page.locator('.option.correct,.option.incorrect').count() == 0
    finish(page, 'Submit exam')
    expect(page.locator('#review-list .q-row')).to_have_count(120)
    expect(page.locator('.score-ring')).to_have_attribute('aria-label', 'Score 1 percent')
    assert not errors, errors
    page.close()
    print('All session controls and filters, attributed Arabic, 80-item practice with preserved order, 120-item timed mock, canonical scoring and review letters: pass')


def notes(browser):
    page = browser.new_page(reduced_motion='reduce')
    page.goto(BASE)
    page.keyboard.press('Control+k')
    page.locator('#command-query').fill('notes')
    page.keyboard.press('Enter')
    expect(page.locator('h1')).to_have_text('Notes')
    expect(page.locator('.notebook-empty')).to_be_visible()
    page.get_by_label('Show notes for').select_option('arabic')
    expect(page).to_have_url(BASE+'#notes/arabic')
    page.get_by_role('button', name='New note').click()
    expect(page.locator('#note-title')).to_be_focused()
    expect(page.get_by_role('combobox', name='Subject', exact=True)).to_have_value('arabic')
    title = '<mark>Arabic phrases</mark>'
    body = '\n  السلام عليكم\n   Keep the opening space.\n</textarea><mark>plain text only</mark>'
    page.get_by_label('Title', exact=True).fill(title)
    page.get_by_label('Your notes').fill(body)
    expect(page.locator('#note-status')).to_have_text('Saved in this browser')
    link = page.url
    assert re.search(r'#notes/arabic/[a-z\d-]{8,}$', link) and not link.endswith('/new')
    page.reload()
    expect(page.locator('#note-title')).to_have_value(title)
    expect(page.locator('#note-body')).to_have_value(body)
    expect(page.locator('.note-row')).to_contain_text(title)
    assert page.locator('mark').count() == 0
    page.get_by_label('Find a note').fill('phrases')
    expect(page.locator('.note-row')).to_have_count(1)
    page.get_by_label('Find a note').fill('السلام')
    expect(page.locator('.note-row')).to_have_count(1)
    page.get_by_label('Find a note').fill('nothing on this subject now')
    expect(page.locator('.note-row')).to_have_count(0)
    # Leave before the debounce completes. Route navigation must flush immediately.
    page.evaluate("""() => {
      const el=document.querySelector('#note-body');el.value+='\\nLast line';
      el.dispatchEvent(new InputEvent('input',{bubbles:true}));location.hash='#dashboard';
    }""")
    expect(page.locator('h1')).to_contain_text('Welcome back')
    assert state(page)['notes'][0]['body'] == body+'\nLast line'
    page.goto(link)
    expect(page.locator('#note-body')).to_have_value(body+'\nLast line')
    page.get_by_role('button', name='Delete note', exact=True).click()
    page.get_by_role('button', name='Cancel', exact=True).click()
    expect(page.locator('#note-body')).to_have_value(body+'\nLast line')
    page.get_by_role('button', name='New note', exact=True).click()
    expect(page.locator('#note-editor-title')).to_have_text('New study note')
    expect(page.locator('#note-title')).to_be_focused()
    page.get_by_label('Title', exact=True).fill('Move me to a different subject')
    page.get_by_role('combobox', name='Subject', exact=True).select_option('business')
    page.get_by_role('button', name='Save note', exact=True).click()
    expect(page.locator('#note-status')).to_have_text('Saved in this browser')
    assert len(state(page)['notes']) == 2 and state(page)['notes'][0]['subject'] == 'business'
    page.get_by_label('Show notes for').select_option('business')
    expect(page.locator('.note-row')).to_have_count(1)
    page.locator('.note-row').click()
    expect(page.locator('#note-title')).to_have_value('Move me to a different subject')
    page.get_by_role('button', name='Delete note', exact=True).click()
    page.get_by_role('dialog').get_by_role('button', name='Delete note', exact=True).click()
    expect(page.locator('#note-library-title')).to_be_visible()
    assert len(state(page)['notes']) == 1
    goto(page, 'settings', '#settings-form')
    page.get_by_role('button', name='Reset progress', exact=True).click()
    page.get_by_role('dialog').get_by_role('button', name='Reset progress', exact=True).click()
    assert len(state(page)['notes']) == 1
    page.get_by_role('button', name='Clear saved data').click()
    page.get_by_role('dialog').get_by_role('button', name='Clear all data').click()
    assert state(page)['notes'] == []
    page.close()
    # v5 was already installed on the previous release. Adding note and shuffle fields must not invalidate it.
    page = browser.new_page(reduced_motion='reduce')
    page.add_init_script(f'''localStorage.setItem('{KEY}', JSON.stringify({{
      version:5, prefs:{{name:'Returning Student', theme:'light'}}, saved:[1,160],
      sessions:[{{id:'legacy-five',mode:'practice',ids:[1,2],answers:{{1:2}},flags:[1],index:0}}]
    }}));''')
    page.goto(BASE+'#quiz/legacy-five')
    expect(page.locator('html')).to_have_attribute('data-theme','light')
    expect(page.locator('#option-list input').nth(2)).to_be_checked()
    expect(page.get_by_role('button',name='Remove review flag')).to_be_visible()
    expect(page.locator('#feedback')).to_contain_text('Correct. The answer is C: Capital')
    goto(page,'bookmarks','.q-row')
    expect(page.locator('.q-row')).to_have_count(2)
    goto(page,'notes','.notebook-empty')
    expect(page.locator('#note-list')).to_contain_text('No notes here yet')
    page.close()
    print('Notes keyboard entry, course scope, bilingual plain-text autosave and reload, immediate route flush, search, deletion and resets; unchanged v5 saves: pass')


if __name__ == '__main__':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        sessions(browser)
        notes(browser)
        browser.close()
