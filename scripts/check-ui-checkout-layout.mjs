import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mode = 'checkout-layout';
const baseUrl = process.argv[2] || 'http://127.0.0.1:4184';
if (new URL(baseUrl).hostname !== '127.0.0.1') throw new Error('UI checks require the local preview on 127.0.0.1');
const profile = path.join(root, '.security-review', `refactor-edge-${mode}-${Date.now()}`);
mkdirSync(profile, { recursive: true });
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--no-first-run',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', 'about:blank',
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
  for (let i = 0; i < 100; i++) {
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
  for (let i = 0; i < 100; i++) {
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
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });


  // This profile uses a synthetic Turnstile callback; no provider or server bypass is configured.
  await send('Page.addScriptToEvaluateOnNewDocument',{source:"window.turnstile={render:(el,o)=>{setTimeout(()=>o.callback('synthetic-ui-only-token'),30);return 'mock';},remove:()=>{}}"});
  let quoteRequests=0; let orderRequests=0;
  ws.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if(message.method==='Network.requestWillBeSent') {
      const path=new URL(message.params.request.url).pathname;
      if(path==='/api/checkout/quote')quoteRequests++;
      if(path==='/api/orders')orderRequests++;
    }
  });
  await send('Network.enable');
  // Fail any accidental order submission in the isolated browser before it reaches local D1.
  await send('Fetch.enable',{patterns:[{urlPattern:'*/api/orders',requestStage:'Request'}]});
  await navigate('/shop');
  await evaluate("localStorage.setItem('lunara_language','en'); localStorage.setItem('lunara.cart.v1',JSON.stringify({version:1,lines:[{variantId:1,quantity:1}]}))");
  await navigate('/cart');
  await waitFor("Boolean(document.querySelector('input[name=province_name]'))");
  await assert("Boolean(document.querySelector('[data-checkout-form]')) && !document.querySelector('input[name=senderName]').disabled && !document.querySelector('[data-checkout-start]')",'Form must be available before selecting a location');
  await input('input[name=senderName]','Before address');
  if(quoteRequests!==0)throw new Error('Typing before address requested quote');
  const choose=async(name,text)=>{
    await evaluate("document.querySelector('input[name="+name+"]').focus();document.querySelector('input[name="+name+"]').click()");
    await input('input[name='+name+']',text);
    await waitFor("document.querySelectorAll('[role=option]').length>0");
    await evaluate("document.querySelector('[role=option]').click()");
    await waitFor("!document.querySelector('[role=listbox]')");
  };
  await choose('province_name','ha noi');
  await waitFor("!document.querySelector('input[name=ward_name]').disabled");
  await choose('ward_name','hoan kiem');
  await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('470')");
  await waitFor("document.querySelectorAll('[data-checkout-block]').length===3");
  await assert("document.querySelector('[data-checkout-review]').disabled && document.querySelector('input[value=COD]').checked && !document.querySelector('input[name=termsAccepted]').checked",'Default COD/consent gate is incorrect');
  await assert("!document.body.innerText.includes('50%') && !document.body.innerText.includes('deposit')",'Deposit note must be absent');
  await assert("document.querySelector('[data-checkout-payment]').getBoundingClientRect().top > document.querySelector('[data-quote-amount=Total]').getBoundingClientRect().top",'Payment must follow total');
  const quotesBefore=quoteRequests;
  await input('input[name=senderName]','Demo customer');
  await input('input[name=senderPhone]','0900000001');
  await evaluate("document.querySelector('input[name=sameRecipient]').click()");
  await waitFor("document.querySelector('input[name=recipientName]').value==='Demo customer' && document.querySelector('input[name=recipientPhone]').readOnly");
  await input('input[name=senderName]','Demo updated');
  await input('input[name=senderPhone]','0900000002');
  await assert("document.querySelector('input[name=recipientName]').value==='Demo updated' && document.querySelector('input[name=recipientPhone]').value==='0900000002'",'Sender edits must continue syncing');
  await evaluate("document.querySelector('input[name=sameRecipient]').click()");
  await waitFor("!document.querySelector('input[name=recipientName]').readOnly");
  await input('input[name=recipientName]','Separate demo');
  await assert("document.querySelector('input[name=senderName]').value==='Demo updated'",'Separate recipient must not alter sender');
  await evaluate("document.querySelector('input[name=sameRecipient]').click()");
  await input('input[name=address]','Demo street 123');
  await assert("!document.querySelector('textarea[name=cardMessage]')",'No card must hide the message');
  const selectCard=async(value)=>{
    await evaluate("document.querySelector('[data-dropdown-name=cardType]').click()");
    await waitFor("Boolean(document.querySelector('[role=option][data-value="+value+"]'))");
    await evaluate("document.querySelector('[role=option][data-value="+value+"]').click()");
    await delay(80);
  };
  await selectCard('GREETING_CARD');
  await input('textarea[name=cardMessage]','Cleared demo');
  await selectCard('NONE');
  await assert("!document.querySelector('textarea[name=cardMessage]')",'Selecting no card must hide the message again');
  await selectCard('BANNER');
  await assert("document.querySelector('textarea[name=cardMessage]').value===''",'Selecting no card must clear hidden unsent text');
  await input('textarea[name=cardMessage]','Demo greeting');
  await input('textarea[name=note]','Synthetic browser check');
  await assert("document.querySelector('[data-checkout-review]').disabled",'Complete details without consent must remain disabled');
  await evaluate("document.querySelector('input[name=termsAccepted]').click()");
  await waitFor("!document.querySelector('[data-checkout-review]').disabled");
  await input('input[name=senderPhone]','invalid');
  await assert("document.querySelector('[data-checkout-review]').disabled",'Invalid phone must disable review');
  await input('input[name=senderPhone]','0900000002');
  await waitFor("!document.querySelector('[data-checkout-review]').disabled");
  await delay(450);
  if(quoteRequests!==quotesBefore)throw new Error('Contact/card/consent input triggered quote');
  await evaluate("document.querySelector('input[value=BANK_TRANSFER]').click()");
  await waitFor("Boolean(document.querySelector('[role=dialog] [data-feature-unavailable]'))");
  await assert("document.querySelector('[role=dialog]').innerText.includes('under development')",'Bank transfer dialog must explain availability');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await waitFor("!document.querySelector('[role=dialog]')");
  await assert("document.querySelector('input[value=COD]').checked && !document.querySelector('input[value=BANK_TRANSFER]').checked",'Closing bank notification must restore COD');
  await evaluate("document.querySelector('input[value=BANK_TRANSFER]').click()");
  await waitFor("Boolean(document.querySelector('[role=dialog]'))");
  await click('Close');
  await waitFor("!document.querySelector('[role=dialog]') && document.querySelector('input[value=COD]').checked");
  await waitFor("!document.querySelector('[data-checkout-review]').disabled");
  await assert("!document.querySelector('a[href*=tramhoa]')",'Terms must not link to another website');
  const currentUrl=await evaluate('location.href');
  await evaluate("document.querySelector('[data-checkout-terms]').click()");
  await waitFor("Boolean(document.querySelector('[role=dialog]'))");
  await assert("document.querySelector('[role=dialog]').innerText.includes('To be updated') && document.querySelector('input[name=termsAccepted]').checked",'Terms placeholder must preserve consent');
  await click('Close');
  await waitFor("!document.querySelector('[role=dialog]')");
  if(await evaluate('location.href')!==currentUrl)throw new Error('Terms dialog navigated away');
  await screenshot('desktop');
  for(const language of ['vi','en']){
    await evaluate("document.querySelector('[data-language-switcher] button[lang="+language+"]').click()");
    await waitFor("document.documentElement.lang==='"+language+"'");
    for(const width of [320,390,768,1440]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
      await assert('document.documentElement.scrollWidth<='+ (width+1),'Checkout overflow '+language+'/'+width);
      await assert("(()=>{const a=document.querySelector('[data-checkout-block=sender]').getBoundingClientRect();const b=document.querySelector('[data-checkout-block=recipient]').getBoundingClientRect();const c=document.querySelector('[data-checkout-block=card]').getBoundingClientRect();return b.top>a.bottom && c.top>b.bottom && Math.abs(a.left-b.left)<2})()",'Three blocks must stay in one vertical column');
      await assert("(()=>{const a=document.querySelector('input[name=sameRecipient]').getBoundingClientRect();const b=document.querySelector('input[name=anonymous]').getBoundingClientRect();return Math.abs(a.top-b.top)<2 && b.left>a.left})()",'Both checkboxes must share a row');
      if(width>=640)for(const pair of [['senderName','senderPhone'],['recipientName','recipientPhone'],['province_name','ward_name']]){
        await assert("(()=>{const a=document.querySelector('input[name="+pair[0]+"] ').getBoundingClientRect();const b=document.querySelector('input[name="+pair[1]+"] ').getBoundingClientRect();return Math.abs(a.top-b.top)<2 && b.left>a.left})()",'Field pair must share a row: '+pair.join('/'));
      }
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
  await evaluate("document.querySelector('[data-language-switcher] button[lang=vi]').click()");
  await screenshot('mobile');
  await evaluate("document.querySelector('[data-checkout-review]').click()");
  await waitFor("Boolean(document.querySelector('[data-checkout-confirm]')) && !document.querySelector('[data-checkout-submit]').disabled");
  await assert("document.querySelector('[data-checkout-confirm]').innerText.includes('Demo updated') && document.querySelector('[data-checkout-confirm]').innerText.includes('Demo greeting')",'Review must display synchronized details and card message');
  await evaluate("document.querySelector('input[name=termsAccepted]').click()");
  await waitFor("document.querySelector('[data-checkout-submit]').disabled");
  await evaluate("document.querySelector('[data-checkout-submit]').click()");
  await delay(150);
  if(orderRequests!==0)throw new Error('Unchecked consent must not submit an order');
  await evaluate("document.querySelector('input[name=termsAccepted]').click()");
  await waitFor("!document.querySelector('[data-checkout-submit]').disabled");
  await evaluate("document.querySelector('[data-checkout-edit]').click()");
  await waitFor("Boolean(document.querySelector('[data-checkout-form]'))");
  await assert("document.querySelector('input[name=termsAccepted]').checked && document.querySelector('input[name=sameRecipient]').checked && document.querySelector('input[name=senderName]').value==='Demo updated'",'Editing must preserve form and choices');
  if(exceptions.length)throw new Error(JSON.stringify(exceptions));
  const result={groups:12,locales:['en','vi'],widths:[320,390,768,1440],quoteRequests,typingQuoteRequests:0,orderRequests,exceptions:exceptions.length,turnstile:'synthetic browser callback; provider not tested'};
  writeFileSync(path.join(root,'.security-review','checkout-layout-results.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));

} catch(error) {
 try{await screenshot('failure');console.error(JSON.stringify(exceptions));}catch{}
 throw error;
} finally {
 if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}ws.close();}
 browser.kill();
}
