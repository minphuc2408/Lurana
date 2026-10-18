import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mode = 'lookup-ref';
const baseUrl = process.argv[2] || 'http://127.0.0.1:5173';
if (new URL(baseUrl).hostname !== '127.0.0.1') throw new Error('UI checks require the local preview on 127.0.0.1');
const profile = path.join(root, '.security-review', `refactor-edge-${mode}-${Date.now()}`);
mkdirSync(profile, { recursive: true });
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--no-first-run',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE fonts.googleapis.com, EXCLUDE fonts.gstatic.com', 'about:blank',
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
  await evaluate('document.fonts.ready.then(()=>true)');
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
    if (response.method === 'Fetch.requestPaused') handleLookupRequest(response.params).catch(()=>{});
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });


  // Synthetic callback and response-only lookup interception; no order writes or real customer data.
  await send('Page.addScriptToEvaluateOnNewDocument',{source:"window.turnstile={render:(el,o)=>{setTimeout(()=>o.callback('synthetic-lookup-token'),30);return 'mock';},remove:()=>{}}"});
  let scenario='PENDING';
  let lookupRequests=0;
  let orderWrites=0;
  const states=['PENDING','CONFIRMED','PREPARING','IN_TRANSIT','DELIVERED'];
  const requests=[];
  const results=[];
  const orderFor=status=>{
    const completed=status==='CANCELLED'?states.slice(0,4):states.slice(0,states.indexOf(status)+1);
    const history=status==='CANCELLED'?[...completed,'CANCELLED']:completed;
    return {order_number:'LN-UI-LOOKUP-ONLY',status_code:status,payment_method:'COD',payment_status:status==='DELIVERED'?'PAID':'UNPAID',subtotal:450000,discount_total:0,delivery_fee:20000,grand_total:470000,placed_at:'2026-10-17T01:00:00Z',
      sender:{name:'Synthetic sender',phone:'0900000001',email:null,is_anonymous:false},recipient:{name:'Synthetic recipient',phone:'0900000002',province_name:'Thành phố Hà Nội',ward_name:'Hoàn Kiếm',address_line:'Synthetic street 123'},
      delivery:{method_code:'STANDARD',date:'2026-10-18',time_slot:'08:00-10:00'},card:{type:'GREETING_CARD',message:'Synthetic greeting'},customer_note:'Synthetic note',
      items:[{sku:'UI-ONLY',name_vi:'Bó hoa kiểm thử',name_en:'Synthetic bouquet',size:'M',image_url:null,unit_price:450000,quantity:1,line_total:450000}],
      timeline:history.map((to_status,index)=>({from_status:index?history[index-1]:null,to_status,note:to_status==='CANCELLED'?'Synthetic cancellation reason':index?null:'Đặt hàng',occurred_at:'2026-10-17T0'+(index+1)+':00:00Z'})),delivered_at:status==='DELIVERED'?'2026-10-17T05:00:00Z':null,paid_at:status==='DELIVERED'?'2026-10-17T05:00:00Z':null};
  };
  async function handleLookupRequest(params) {
    const payload=JSON.parse(params.request.postData||'{}');
    requests.push(payload);lookupRequests++;
    const selected=scenario;
    if(selected==='NETWORK')return send('Fetch.failRequest',{requestId:params.requestId,errorReason:'Failed'});
    if(selected==='SLOW')await delay(800);
    const code=selected==='NOT_FOUND'?404:selected==='RATE_LIMITED'?429:selected==='INTERNAL'?503:200;
    const response=code===200?{data:orderFor(selected==='SLOW'?'DELIVERED':selected)}:{error:{code:selected,message:'Synthetic lookup error'}};
    return send('Fetch.fulfillRequest',{requestId:params.requestId,responseCode:code,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(response)).toString('base64')});
  }
  await send('Fetch.enable',{patterns:[{urlPattern:'*/api/orders/lookup',requestStage:'Request'}]});
  await send('Network.enable');
  ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Network.requestWillBeSent'&&message.params.request.method==='POST'&&new URL(message.params.request.url).pathname==='/api/orders')orderWrites++;});
  await navigate('/orders/track?order=LN-PREFILL-ONLY');
  await assert("document.querySelector('input[name=orderNumber]').value==='LN-PREFILL-ONLY' && !document.querySelector('[data-order-detail]')",'URL only prefills; must never auto-lookup or show sample order');
  if(lookupRequests!==0)throw new Error('No automatic lookup allowed');
  await assert("!document.querySelector('[data-order-lookup-page] nav') && !document.querySelector('[data-order-lookup-page]').innerText.includes('THEO DÕI HÀNH TRÌNH') && !document.querySelector('[data-order-lookup-page]').innerText.includes('Nhập mã đơn hàng hoặc')",'Removed lookup breadcrumb/eyebrow/intro must be absent');
  await input('input[name=orderNumber]','LN-UI-LOOKUP-ONLY');
  await waitFor("!document.querySelector('[data-lookup-submit]').disabled");
  await evaluate("document.querySelector('[data-lookup-submit]').click()");
  if(lookupRequests!==0)throw new Error('Code alone must not look up');
  await input('input[name=phone]','invalid');
  await evaluate("document.querySelector('[data-lookup-submit]').click()");
  await waitFor("Boolean(document.querySelector('[role=alert]'))");
  if(lookupRequests!==0)throw new Error('Invalid phone must not reach API');
  await input('input[name=phone]','0900000001');
  for(const status of [...states,'CANCELLED']) {
    scenario=status;
    await waitFor("!document.querySelector('[data-lookup-submit]').disabled");
    await evaluate("document.querySelector('[data-lookup-submit]').click()");
    await waitFor("document.querySelector('[data-order-status]')?.dataset.statusCode==='"+status+"' && !document.querySelector('[data-lookup-submit]').disabled");
    const progress=await evaluate("[...document.querySelectorAll('[data-progress-code]')].map(x=>({code:x.dataset.progressCode,reached:x.dataset.reached==='true',current:x.getAttribute('aria-current')==='step'}))");
    if(status==='CANCELLED') {
      if(progress.some(x=>x.current)||progress.find(x=>x.code==='DELIVERED').reached)throw new Error('Cancelled order must not claim ongoing/completed delivery');
      await assert("document.querySelector('[data-order-cancellation]').innerText.includes('Synthetic cancellation reason')",'Cancellation must display API reason');
    }else {
      if(progress.filter(x=>x.current).length!==1||progress.find(x=>x.current).code!==status||progress.filter(x=>x.reached).length!==states.indexOf(status)+1)throw new Error('Incorrect normal milestone mapping');
    }
    for(const language of ['en','vi']) {
      await evaluate("document.querySelector('[data-language-switcher] button[lang="+language+"]').click()");
      for(const width of [320,390,640,768,1024,1440]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
        await assert('document.documentElement.scrollWidth <= innerWidth','Lookup overflow '+status+'/'+language+'/'+width);
        await assert(`(() => {
          const centered = selector => {
            const rect = document.querySelector(selector).getBoundingClientRect();
            return Math.abs(rect.left + rect.width / 2 - document.documentElement.clientWidth / 2) < 2;
          };
          const header = document.querySelector('[data-order-lookup-page] > header');
          const form = document.querySelector('[data-lookup-form-panel]').getBoundingClientRect();
          const result = document.querySelector('[data-lookup-result]').getBoundingClientRect();
          return centered('[data-lookup-form-panel]') && centered('[data-lookup-result]')
            && Math.abs(form.width - result.width) < 2
            && Math.abs(form.width - (Math.min(document.documentElement.clientWidth, 1240) - (innerWidth < 640 ? 40 : 64))) < 2
            && Math.abs(header.getBoundingClientRect().width - form.width) < 2
            && getComputedStyle(header).textAlign === 'center'
            && getComputedStyle(header).borderBottomWidth === '1px'
            && getComputedStyle(header).paddingBottom === '24px'
            && getComputedStyle(header).marginBottom === '32px'
            && getComputedStyle(header.firstElementChild).fontSize === (innerWidth < 640 ? '30px' : '36px');
        })()`, 'Lookup centered panels and checkout-style heading '+status+'/'+language+'/'+width);
        await assert("getComputedStyle(document.querySelector('[data-order-progress]')).gridTemplateColumns.split(' ').length==="+(width<768?1:5),'Progress responsive columns');
        results.push({status,language,width});
      }
    }
    if(status==='PREPARING') {
      await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
      await evaluate("document.querySelector('[data-lookup-result]').scrollIntoView({block:'start'});window.scrollBy(0,-100)");await delay(100);await screenshot('progress-desktop');
      await send('Emulation.setDeviceMetricsOverride',{width:390,height:1100,deviceScaleFactor:1,mobile:true});
      await evaluate('window.scrollTo(0,0)');await screenshot('lookup-mobile');
    }
  }
  await assert("document.querySelector('a[href=\"tel:0987656789\"]').innerText==='0987656789' && Boolean(document.querySelector('[data-lookup-result] a[href=\"/shop\"]'))",'Approved hotline and shop link');
  await evaluate("document.querySelector('[data-lookup-result] details').open=true");
  await assert("document.querySelectorAll('[data-order-timeline] li').length===5",'API history must remain available');
  await input('input[name=phone]','0900000003');
  await assert("!document.querySelector('[data-order-detail]')",'Editing credentials must clear private result');
  for(const code of ['NOT_FOUND','RATE_LIMITED','INTERNAL','NETWORK']) {
    scenario=code;
    await waitFor("!document.querySelector('[data-lookup-submit]').disabled");
    await evaluate("document.querySelector('[data-lookup-submit]').click()");
    await waitFor("Boolean(document.querySelector('[role=alert]')) && !document.querySelector('[data-lookup-submit]').disabled");
    await assert("!document.querySelector('[data-order-detail]')",'Failure must not show stale/private/demo order');
    await assert("(() => {const r=document.querySelector('[role=alert]').getBoundingClientRect();const f=document.querySelector('[data-lookup-form-panel]').getBoundingClientRect();return Math.abs(r.width-f.width)<2 && Math.abs(r.left+r.width/2-document.documentElement.clientWidth/2)<2;})()",'Error panel must fill centered content');
  }
  scenario='SLOW';
  await evaluate("document.querySelector('[data-lookup-submit]').click()");
  await waitFor("document.querySelector('[data-lookup-submit]').disabled");
  await input('input[name=phone]','0900000004');
  await delay(1000);
  await assert("!document.querySelector('[data-order-detail]')",'Late response must not repopulate result after editing');
  if(requests.some(payload=>!payload.order_number||!payload.phone)||orderWrites||exceptions.length)throw new Error(JSON.stringify({orderWrites,exceptions}));
  await assert("[...Object.values(localStorage),...Object.values(sessionStorage)].every(value=>!value.includes('0900000001')&&!value.includes('Synthetic recipient')&&!value.includes('Synthetic greeting'))",'Lookup PII must never enter browser storage');
  await navigate('/orders/track');
  await assert("!document.querySelector('[data-order-detail]') && document.querySelector('input[name=phone]').value===''",'Reload must clear private lookup data');
  const result={states:[...states,'CANCELLED'],layoutCases:results.length,lookupRequests,orderApiWrites:orderWrites,breadcrumb:false,phoneAndCodeRequired:true,staleResponsesIgnored:true,hotline:'0987656789',exceptions:exceptions.length,provider:'synthetic callback; all lookup replies intercepted'};
  writeFileSync(path.join(root,'.security-review/lookup-ref-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
} catch(error) {
 try{await screenshot('failure');console.error(JSON.stringify(exceptions));}catch{}
 throw error;
} finally {
 if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}ws.close();}
 browser.kill();
}
