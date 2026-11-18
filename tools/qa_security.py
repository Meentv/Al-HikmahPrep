"""Defensive checks scoped to the generated files and owned loopback preview."""
from base64 import b64encode
from hashlib import sha256
from http.client import HTTPConnection
from pathlib import Path
import re

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = 'http://127.0.0.1:3000/'
KEY = 'hikmahprep.gns203.v5'


def request(method, path, headers=None):
    conn=HTTPConnection('127.0.0.1',3000,timeout=6)
    try:
        conn.request(method,path,headers=headers or {})
        r=conn.getresponse()
        return r.status,{k.lower():v for k,v in r.getheaders()},r.read()
    finally:
        conn.close()


def static_checks():
    html=(ROOT/'site/index.html').read_bytes()
    script=re.findall(br'<script>([\s\S]*?)</script>',html)
    assert len(script)==1
    digest=b64encode(sha256(script[0]).digest()).decode()
    status, headers, body=request('GET','/')
    assert status==200 and body==html
    csp=headers['content-security-policy']
    assert f"script-src 'sha256-{digest}'" in csp
    assert "connect-src 'none'" in csp and "form-action 'none'" in csp
    assert headers['x-content-type-options']=='nosniff' and headers['referrer-policy']=='no-referrer' and 'camera=()' in headers['permissions-policy']
    assert "frame-ancestors 'none'" in (ROOT/'site/_headers').read_text()
    assert request('HEAD','/index.html')[2]==b''
    assert request('GET','/',{'If-None-Match':headers['etag']})[0]==304
    for route in ['/uploads/GNS204%20PQ.pdf','/uploads/GNS%20203.pdf','/uploads/Intro%2520Entrepreneurship.pdf','/src/app.js','/src/data/arabic-revision.js','/README.md','/_headers','/docs/DESIGN.md']:
        assert request('GET',route)[0]==404,route
    assert request('POST','/')[0]==405
    print('HTTP: content hash/CSP, policy headers, validators, method allowlist, no source or document exposure: pass')


def browser_checks(browser):
    page=browser.new_page(reduced_motion='reduce')
    observed=[]
    page.on('request',lambda req: observed.append(req.url))
    page.goto(URL+'#settings')
    profile='<mark>Student</mark>'
    page.get_by_label('Display name').fill(profile)
    page.get_by_role('button',name='Save settings').click()
    page.goto(URL+'#dashboard');expect(page.locator('h1')).to_contain_text(profile)
    assert page.locator('mark').count()==0
    page.goto(URL+'#bookmarks');page.get_by_role('button',name='New collection').click()
    page.get_by_label('Collection name').fill('<mark>Collection</mark>')
    page.get_by_role('button',name='Create collection').click()
    expect(page.locator('.tab').filter(has_text='<mark>Collection</mark>')).to_be_visible()
    page.goto(URL+'#announcements/reminders')
    page.get_by_label('Reminder title').fill('<mark>Reminder</mark>')
    page.get_by_label('Exam date').fill(page.locator('[name=day]').get_attribute('min'))
    page.get_by_role('button',name='Add reminder').click()
    expect(page.locator('#personal-reminders')).to_contain_text('<mark>Reminder</mark>')
    assert page.locator('mark').count()==0
    run=page.evaluate('''() => {const node=document.createElement('script');node.textContent='window.__unapproved = true'; document.head.append(node);return window.__unapproved===true;}''')
    assert not run,'Unexpected inline script execution'
    page.goto(URL+'#__proto__/constructor')
    expect(page.locator('h1')).to_contain_text('Welcome back')
    assert all(url.startswith(URL) for url in observed),observed
    page.close()
    stale=browser.new_page(reduced_motion='reduce')
    stale.goto(URL)
    stale.evaluate('''(k) => localStorage.setItem(k,JSON.stringify({prefs:{theme:'bad',goal:50000},saved:[1,1,101,5000,"12"],sessions:[{id:"safe-record",mode:'practice',ids:[1,101,5000],index:1,answers:{1:999,101:1},flags:[1,101,3000]}],reminders:[{id:'bad',subject:'constructor',day:'2026-02-31'}]}))''',KEY)
    stale.goto(URL+'#quiz/safe-record');stale.reload()
    expect(stale.locator('.quiz-head')).to_contain_text('Basic Concepts of Islam')
    expect(stale.locator('#question-map button')).to_have_count(1)
    expect(stale.locator('#option-list input').nth(1)).to_be_checked()
    stale.get_by_role('button',name='Save & exit').click()
    # Browser refresh normalizes untrusted snapshots again, even if the raw key remains unchanged.
    stale.goto(URL+'#bookmarks');expect(stale.locator('.q-row')).to_have_count(2)
    stale.goto(URL+'#announcements/reminders');expect(stale.locator('#personal-reminders')).to_contain_text('No personal reminders')
    stale.close()
    print('Browser: literal text sinks, CSP blocks unapproved script, safe route fallback and tampered-store validation; no external requests: pass')


if __name__=='__main__':
    static_checks()
    with sync_playwright() as p:
        browser=p.chromium.launch()
        browser_checks(browser)
        browser.close()
