import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import app from '../worker/index.ts';
import { createTestDb } from '../tests/helpers/worker.mjs';
import { signSession } from '../worker/lib/auth.ts';
const fixture = createTestDb();
const syntheticEnv={DB:fixture.db,ADMIN_PASSWORD:'isolated-delivery-admin-password-24-characters',JWT_SECRET:'isolated-delivery-jwt-secret-32-characters-distinct'};
let testOrigin;
const bridge=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,testOrigin);
  if(url.pathname.startsWith('/api/')){
   const chunks=[];for await(const c of req)chunks.push(c);
   const response=await app.request(url.href,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})},syntheticEnv);
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  let file=path.resolve('dist/client','.'+url.pathname);
  const staticRoot=path.resolve('dist/client');if(!file.startsWith(staticRoot+path.sep))file=path.join(staticRoot,'index.html');
  if(!existsSync(file)||!path.extname(file))file=path.join(staticRoot,'index.html');
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(readFileSync(file));
 }catch{res.writeHead(500);res.end('Isolated test bridge error');}
});
await new Promise(resolve=>bridge.listen(0,'127.0.0.1',resolve));testOrigin='http://127.0.0.1:'+bridge.address().port;
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mode = 'delivery-admin';
const baseUrl = testOrigin;
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



  const token=await signSession(syntheticEnv);
  await send('Network.setCookie',{name:'lunara_admin',value:token,url:baseUrl,httpOnly:true,sameSite:'Strict'});
  await navigate('/admin/delivery-zones');
  await waitFor("Boolean(document.querySelector('[data-testid=zone-create]')) && !document.body.innerText.includes('Loading')");
  await evaluate("document.querySelector('[data-testid=zone-create]').click()");
  await waitFor("Boolean(document.querySelector('[role=dialog] input[name=province_name]'))");
  const choose=async(name,text)=>{
   await evaluate("document.querySelector('[role=dialog] input[name="+name+"]').focus();document.querySelector('[role=dialog] input[name="+name+"]').click()");
   await input('[role=dialog] input[name='+name+']',text);
   await waitFor("document.querySelectorAll('[role=option]').length>0");await evaluate("document.querySelector('[role=option]').click()");await delay(100);
  };
  await choose('province_name','ha noi');
  await evaluate("document.querySelector('[role=dialog] input[name=ward_name]').focus();document.querySelector('[role=dialog] input[name=ward_name]').click()");
  await waitFor("document.querySelectorAll('[role=option]').length===126");
  await choose('ward_name','cua nam');await input('input[name=fee]','21000');
  await assert("!document.querySelector('[data-testid=zone-form-save]').disabled",'Imported ward selection should enable save');
  await evaluate("document.querySelector('[data-testid=zone-form-save]').click()");await waitFor("!document.querySelector('[role=dialog]')");
  const created=fixture.sqlite.prepare('SELECT id,fee FROM delivery_zones WHERE ward_name=?').get('Cửa Nam');
  if(!created||created.fee!==21000)throw new Error('UI did not persist selected catalog ward');
  await navigate('/shop');await evaluate("localStorage.setItem('lunara.cart.v1',JSON.stringify({version:1,lines:[{variantId:1,quantity:1}]}))");
  await navigate('/cart');await waitFor("Boolean(document.querySelector('input[name=province_name]'))");
  await evaluate("document.querySelector('input[name=province_name]').focus();document.querySelector('input[name=province_name]').click()");
  await waitFor("document.querySelectorAll('[role=option]').length===1");await assert("!document.body.innerText.includes('Hồ Chí Minh')",'HCMC must not be offered');
  await evaluate("document.querySelector('[role=option]').click()");await delay(100);
  await evaluate("document.querySelector('input[name=ward_name]').focus();document.querySelector('input[name=ward_name]').click()");
  await waitFor("document.querySelectorAll('[role=option]').length===2");
  await assert("[...document.querySelectorAll('[role=option]')].some(x=>x.innerText==='Cửa Nam')",'Configured ward must appear');
  await input('input[name=ward_name]','cua nam');await evaluate("document.querySelector('[role=option]').click()");
  await waitFor("document.querySelector('[data-quote-amount=Total]')?.innerText.includes('471')");
  await navigate('/admin/delivery-zones');await waitFor("Boolean(document.querySelector('[data-testid=zone-toggle-"+created.id+"]'))");
  await evaluate("document.querySelector('[data-testid=zone-toggle-"+created.id+"]').click()");
  await waitFor("document.querySelector('[data-zone-id=\""+created.id+"\"]').getAttribute('data-active')==='false'");
  await navigate('/cart');await waitFor("Boolean(document.querySelector('input[name=province_name]'))");
  await evaluate("document.querySelector('input[name=province_name]').click()");await waitFor("document.querySelectorAll('[role=option]').length===1");await evaluate("document.querySelector('[role=option]').click()");await delay(100);
  await evaluate("document.querySelector('input[name=ward_name]').focus();document.querySelector('input[name=ward_name]').click()");await waitFor("document.querySelectorAll('[role=option]').length===1");
  await assert("document.querySelector('[role=option]').innerText==='Hoàn Kiếm'",'Disabled ward must disappear, Hoan Kiem remains');
  await input('input[name=ward_name]','cua nam');await assert("document.querySelectorAll('[role=option]').length===0",'Unconfigured search must not invent a ward');
  const response=await evaluate("fetch('/api/checkout/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{variant_id:1,quantity:1}],province_name:'Thành phố Hà Nội',ward_name:'Cửa Nam',delivery_method_code:'STANDARD'})}).then(async r=>({status:r.status,code:(await r.json()).error?.code}))");
  if(response.status!==422||response.code!=='NO_DELIVERY_ZONE')throw new Error('Direct quote bypassed coverage');
  for(const language of ['vi','en']){
   await evaluate("document.querySelector('[data-language-switcher] button[lang="+language+"]').click()");
   for(const width of [320,390,768,1440]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});await assert('document.documentElement.scrollWidth<='+ (width+1),'Overflow '+language+'/'+width);}
  }
  await screenshot('checkout');
  if(exceptions.length)throw new Error(JSON.stringify(exceptions));
  if(fixture.sqlite.prepare('SELECT COUNT(*) AS n FROM orders').get().n!==0)throw new Error('Test created an order');
  const result={groups:7,importedProvinces:1,importedWards:126,createViaAdmin:true,hideAfterDisable:true,unconfiguredQuote:422,locales:['en','vi'],widths:[320,390,768,1440],exceptions:0,database:'isolated in-memory; no staging credentials'};
  writeFileSync(path.join(root,'.security-review','delivery-admin-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
} catch(error){try{await screenshot('failure');console.error(JSON.stringify(exceptions));}catch{}throw error;}
finally{if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}ws.close();}browser.kill();await new Promise(resolve=>bridge.close(resolve));fixture.close();}
