import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mode = 'story';
const i18nOnly = process.argv.includes('--i18n-only');
const checkFonts = process.argv.includes('--fonts');
const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
if (new URL(baseUrl).hostname !== '127.0.0.1') throw new Error('UI checks require the local preview on 127.0.0.1');
const profile = path.join(root, '.security-review', `refactor-edge-${mode}-${Date.now()}`);
mkdirSync(profile, { recursive: true });
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--no-first-run',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  `--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1${checkFonts ? ', EXCLUDE fonts.googleapis.com, EXCLUDE fonts.gstatic.com, EXCLUDE images.unsplash.com' : ''}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
const pending = new Map();
let nextId = 0;
const exceptions = [];
let routeName = '';
async function send(method, params = {}) {
  const id = ++nextId;
  const response = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  ws.send(JSON.stringify({ id, method, params }));
  return response;
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text + ': ' + response.exceptionDetails.exception?.description);
  return response.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 400; i++) {
    if (await evaluate(expression)) return;
    await delay(50);
  }
  throw new Error(`Timeout on ${routeName}: ${expression}`);
}
async function navigate(route) {
  routeName = route;
  await send('Page.navigate', { url: `${baseUrl}${route}` });
  await waitFor('document.readyState === "complete" && document.querySelector("#root")?.innerText.length > 20');
  await delay(200);
  if (checkFonts) await evaluate('document.fonts.ready.then(() => true)');
}
async function click(text) {
  const ok = await evaluate(`(() => { const scope = document.querySelector('[role="dialog"]') || document; const el = [...scope.querySelectorAll('button,a')].find(e => e.textContent.trim() === ${JSON.stringify(text)} && e.getBoundingClientRect().width > 0); if(!el) return false; el.click(); return true; })()`);
  if (!ok) throw new Error(`Missing visible control: ${text} on ${routeName}`);
  await delay(100);
}
async function input(selector, value) {
  const ok = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  if (!ok) throw new Error(`Missing input: ${selector}`);
  await delay(100);
}
async function assert(expression, message) {
  if (!await evaluate(expression)) throw new Error(message);
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(path.join(root, '.security-review', `${mode}-${name}.png`), Buffer.from(data, 'base64'));
}
try {
  let target;
  for (let i = 0; i < 400; i++) {
    try { const port = readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {}
    if (target) break;
    await delay(50);
  }
  if (!target) throw new Error('Edge debugging connection unavailable');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  ws.addEventListener('message', event => {
    const response = JSON.parse(event.data);
    if (response.id) {
      const job = pending.get(response.id);
      pending.delete(response.id);
      if (response.error) job?.reject(new Error(JSON.stringify(response.error)));
      else job?.resolve(response.result);
    }
    if (response.method === 'Runtime.exceptionThrown') exceptions.push({ route: routeName, detail: response.params.exceptionDetails.exception?.description });
    if (response.method === 'Fetch.requestPaused') send('Fetch.failRequest', { requestId: response.params.requestId, errorReason: 'Failed' }).catch(() => {});
  });
  await send('Page.enable');
  await send('Runtime.enable');
  const results=[];
  let orderWrites=0;
  await send('Network.enable');
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Network.requestWillBeSent'&&m.params.request.method==='POST'&&new URL(m.params.request.url).pathname==='/api/orders')orderWrites++;});
  await navigate('/');
  await waitFor("Boolean(document.querySelector('[data-home-story]'))");
  await assert("document.querySelector('[data-home-story]').previousElementSibling.hasAttribute('data-home-journey') && document.querySelector('[data-home-journey]').previousElementSibling.id==='featured'",'Story must follow the featured collection and gifting journey');
  const checkLayout=async(route)=>{
    for(const language of ['vi','en']) {
      await evaluate("document.querySelector('[data-language-switcher] button[lang="+language+"]').click()");
      await waitFor("document.documentElement.lang==='"+language+"'");
      await evaluate('document.fonts.ready.then(()=>true)');
      for(const width of [320,390,640,768,1024,1280,1440]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
        await assert('document.documentElement.scrollWidth <= innerWidth','Horizontal overflow '+route+'/'+language+'/'+width);
        await assert("(()=>{const children=[...document.querySelector('[data-storefront-header] > div').children].filter(x=>getComputedStyle(x).display!=='none');return children.every((x,i)=>i===0||children[i-1].getBoundingClientRect().right<=x.getBoundingClientRect().left+1)})()",'Header controls overlap '+language+'/'+width);
        if(route==='/about') {
          await assert("!document.querySelector('[data-story-page] nav') && document.querySelectorAll('[data-story-page] h1').length===1",'Story article must have one h1 and no breadcrumb');
          await assert("document.querySelector('meta[name=robots]').content==='noindex, nofollow'",'Local draft must remain noindex');
        }
        results.push({route,language,width});
      }
    }
  };
  await checkLayout('/');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate("document.querySelector('[data-language-switcher] button[lang=vi]').click();document.querySelector('[data-home-story]').scrollIntoView({block:'center'})");
  await waitFor("[...document.querySelectorAll('[data-home-story] img')].every(x=>x.complete&&x.naturalWidth>0&&x.currentSrc.startsWith('https://images.unsplash.com/'))");
  await screenshot('home-desktop');
  await evaluate("document.querySelector('[data-story-link]').click()");
  await waitFor("location.pathname.replace(/\\/$/,'')==='/about' && Boolean(document.querySelector('[data-story-page]'))");
  await evaluate('window.scrollTo(0,0)');
  await checkLayout('/about');
  await assert("!document.querySelector('[data-story-page]').innerText.includes('18 Hẻm Yên Tĩnh') && document.querySelector('[data-story-locations]').innerText.includes('142 Nguyễn Văn Cừ')",'Story contact must reuse footer data');
  await assert("document.querySelector('[data-story-opening-hours]').innerText.includes('08:00 — 20:00') && document.querySelector('[data-story-opening-hours]').innerText.includes('08:30 — 19:30')",'Approved reference opening hours');
  const locations=await evaluate("({story:[...document.querySelectorAll('[data-story-locations] a')].map(x=>x.href),footer:[...document.querySelectorAll('[data-storefront-footer] address a')].map(x=>x.href)})");
  if(JSON.stringify(locations.story)!==JSON.stringify(locations.footer))throw new Error('Story and footer locations must share URLs');
  await assert("[...document.querySelectorAll('[data-storefront-footer] a')].every(x=>!x.href.includes('lurana')&&!x.href.includes('flowercorner'))",'Placeholder links must consistently use Lunarra');
  const photoCount=await evaluate("document.querySelectorAll('[data-story-page] img').length");
  for(let index=0;index<photoCount;index++) {
    await evaluate("document.querySelectorAll('[data-story-page] img')["+index+"].scrollIntoView({block:'center'})");
    await waitFor("(()=>{const x=document.querySelectorAll('[data-story-page] img')["+index+"];return x.complete&&x.naturalWidth>0&&x.currentSrc.startsWith('https://images.unsplash.com/')})()");
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate("document.querySelector('[data-language-switcher] button[lang=vi]').click();window.scrollTo(0,0)");
  await screenshot('article-desktop');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
  await screenshot('article-mobile');
  await evaluate("document.querySelector('[data-header-menu-toggle]').click()");
  await assert("document.querySelector('[data-header-menu-toggle]').getAttribute('aria-expanded')==='true'",'Mobile navigation must open');
  await evaluate("[...document.querySelectorAll('[data-storefront-header] a[href=\"/about\"]')].find(x=>x.getBoundingClientRect().width>0).click()");
  await waitFor("document.querySelector('[data-header-menu-toggle]').getAttribute('aria-expanded')==='false'");
  if(exceptions.length||orderWrites)throw new Error(JSON.stringify({exceptions,orderWrites}));
  const result={layoutCases:results.length,locales:['en','vi'],widths:[320,390,640,768,1024,1280,1440],referencePhotos:7,footerLocations:locations.story.length,breadcrumb:false,noindex:true,mobileNavigation:true,orderWrites,exceptions:exceptions.length};
  writeFileSync(path.join(root,'.security-review/story-ui-results.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
} catch (error) {
  try {
    await screenshot('failure');
    writeFileSync(path.join(root, '.security-review', 'ui-failure.json'), JSON.stringify({ error: error.message, route: routeName, state: await evaluate("({url:location.href,text:document.body.innerText,cart:localStorage.getItem('lunara.cart.v1')})"), exceptions }, null, 2));
  } catch {}
  throw error;
} finally {
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} ws.close(); }
  browser.kill();
}
