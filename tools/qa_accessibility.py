"""Run axe checks against both themes; give an existing local axe-core bundle path."""
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

BASE = 'http://127.0.0.1:3000/'
AXE = Path(os.environ.get('AXE_PATH', '/tmp/axe-hikmah.min.js'))
KEY = 'hikmahprep.gns203.v5'

with sync_playwright() as p:
    assert AXE.is_file(), 'Set AXE_PATH to a local axe-core minified JS bundle.'
    browser=p.chromium.launch()
    failures=[]
    for theme in ['light','dark']:
        page=browser.new_page(viewport={'width':1440,'height':900}, reduced_motion='reduce', bypass_csp=True)
        page.add_init_script(script=f"localStorage.setItem('{KEY}', JSON.stringify({{prefs:{{theme:'{theme}'}}}}));")
        page.goto(BASE)
        page.add_script_tag(path=AXE)
        def axe(label):
            findings=page.evaluate('''() => axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa']}}).then(a=>a.violations.map(v=>[v.id,v.nodes.map(n=>[n.target,n.failureSummary])]))''')
            if findings: failures.append((theme,label,findings))
            print(f'{theme} | {label}: {len(findings)} axe findings')
        for path,sel in [('dashboard','.desk-hero'),('courses/business','.topic-list'),('study/islamic/60','.q-content'),('practice/business','#practice-form'),('exams/islamic','#exam-form'),('flashcards','.flash-flip'),('bookmarks','#saved-query'),('performance','.chart-empty'),('announcements','#reminder-form'),('settings','#settings-form'),('notes','.notebook-empty'),('notes/arabic/new','#note-body'),('study/arabic/120','.q-content')]:
            page.goto(f'{BASE}#{path}')
            expect(page.locator(sel).first).to_be_visible()
            axe(path)
        page.keyboard.press('Control+k')
        expect(page.locator('#command-query')).to_be_focused()
        axe('command palette');page.keyboard.press('Escape')
        page.goto(BASE+'#practice/business')
        page.get_by_role('button',name='Quick start · 60').click()
        expect(page.locator('.question-panel')).to_be_visible()
        axe('practice question')
        page.locator('#option-list input').first.check()
        axe('practice feedback')
        page.get_by_role('button',name='Finish practice').click()
        expect(page.get_by_role('dialog')).to_be_visible()
        axe('submit dialog')
        page.get_by_role('button',name='Submit & see score').click()
        expect(page.locator('.result-hero')).to_be_visible()
        page.locator('#review-list summary').first.click()
        expect(page.locator('#review-list .answers-read').first).to_be_visible()
        axe('result and expanded review')
        page.set_viewport_size({'width':390,'height':820})
        page.goto(BASE+'#dashboard')
        expect(page.locator('.mobile-nav')).to_be_visible()
        axe('mobile home')
        page.get_by_role('button',name='More destinations').click()
        axe('mobile More')
        page.get_by_role('dialog').get_by_role('link',name='Notes',exact=True).click()
        page.get_by_role('button',name='New note').click()
        axe('mobile notes editor')
        page.close()
    browser.close()
    assert not failures, failures
