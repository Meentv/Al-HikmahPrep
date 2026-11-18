"""Small reproducible Chromium lab run, not production field metrics."""
from statistics import median
from playwright.sync_api import expect, sync_playwright

B='http://127.0.0.1:3000/'
with sync_playwright() as p:
    browser=p.chromium.launch()
    samples=[]
    for i in range(3):
        context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
        context.add_init_script('''window.lab={lcp:0,cls:0,lt:0,ltMax:0};
          new PerformanceObserver(list=>{for(const e of list.getEntries())lab.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
          new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)lab.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
          new PerformanceObserver(list=>{for(const e of list.getEntries()){lab.lt++;lab.ltMax=Math.max(lab.ltMax,e.duration);}}).observe({type:'longtask',buffered:true});''')
        page=context.new_page();cdp=context.new_cdp_session(page)
        cdp.send('Network.enable')
        cdp.send('Network.setCacheDisabled',{'cacheDisabled':True})
        cdp.send('Network.emulateNetworkConditions',{'offline':False,'latency':140,'downloadThroughput':200000,'uploadThroughput':93750,'connectionType':'cellular4g'})
        cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
        page.goto(B,wait_until='load');expect(page.locator('.desk-hero')).to_be_visible()
        page.evaluate('document.fonts.ready');page.wait_for_function('window.lab.lcp > 0');page.wait_for_timeout(350)
        metrics=page.evaluate('''() => ({...window.lab, encoded:performance.getEntriesByType('navigation')[0].encodedBodySize})''')
        page.get_by_role('navigation',name='Mobile navigation').get_by_role('link',name='Practice').tap()
        expect(page.locator('.pick-grid')).to_be_visible()
        page.get_by_role('link',name='Choose practice: Entrepreneurship').tap()
        expect(page.locator('#practice-form')).to_be_visible()
        page.get_by_role('button',name='Quick start · 60').tap()
        expect(page.locator('.question-panel')).to_be_visible()
        samples.append(metrics);context.close()
        print(f"Run {i+1}: LCP {metrics['lcp']:.0f} ms, CLS {metrics['cls']:.4f}, initial long tasks {metrics['lt']} (longest {metrics['ltMax']:.0f} ms), encoded {metrics['encoded']} B")
    browser.close()
    print(f"Three emulated mobile cold loads: median LCP {median(v['lcp'] for v in samples):.0f} ms, max CLS {max(v['cls'] for v in samples):.4f}.")
