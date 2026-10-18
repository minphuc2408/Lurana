import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { themes } from '../src/shared/theme/themes.ts';

const origin=process.argv[2]||'http://127.0.0.1:4173';
if(new URL(origin).hostname!=='127.0.0.1')throw new Error('Loopback preview only');
const fontFile=process.argv.find(a=>a.startsWith('--font-cache='))?.slice(13);
const fonts=fontFile?JSON.parse(readFileSync(fontFile,'utf8')):{};
const profile=path.resolve('.security-review/product-detail-edge-'+Date.now());mkdirSync(profile,{recursive:true});
const photo='/assets/'+readdirSync('dist/client/assets').find(f=>f.startsWith('hero-1400')&&f.endsWith('.jpg'));
const products=Array.from({length:5},(_,i)=>({id:50001+i,slug:'ui-flowers-'+(i+1),category_code:'bouquets',name_en:'Synthetic bouquet '+(i+1),name_vi:'Bó hoa kiểm thử '+(i+1),description_en:'Synthetic product description for browser acceptance.',description_vi:'Mô tả sản phẩm tổng hợp để kiểm tra giao diện.',badge_code:null,is_featured:true,images:[0,1,2].map((n)=>({url:origin+photo+'?photo='+n,alt_en:'Synthetic bouquet photo',alt_vi:'Ảnh hoa kiểm thử',is_primary:n===0})),variants:['S','M','L'].map((size,n)=>({id:(50001+i)*10+n+1,sku:'UI-'+i+'-'+size,size_code:size,price:[450000,650000,850000][n],compare_at_price:null,in_stock:n<2,low_stock:n===1,max_quantity:[5,3,0][n]}))}));
const options={provinces:[{province_name:'Thành phố Hà Nội',default_fee:null,free_from_amount:null,wards:[{ward_name:'Hoàn Kiếm',fee:30000}]}],methods:[{code:'STANDARD',surcharge:0}],time_slots:['14:00-16:00'],limits:{max_cart_lines:15,max_quantity_per_line:20,max_advance_days:30}};
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--disable-sync','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws,id=0,scenario='normal',orderWrites=0;const pending=new Map(),exceptions=[],checks=[],layouts=[];
function send(method,params={}){const n=++id,p=new Promise((resolve,reject)=>pending.set(n,{resolve,reject}));ws.send(JSON.stringify({id:n,method,params}));return p;}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function waitFor(expression){for(let n=0;n<180;n++){if(await evaluate('Boolean('+expression+')'))return;await pause(50);}throw new Error('Timeout: '+expression);}
async function frame(){await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');}
async function check(expression,message){assert.ok(await evaluate(expression),message);}
async function click(selector){await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await frame();}
async function key(value){await send('Input.dispatchKeyEvent',{type:'keyDown',key:value});await send('Input.dispatchKeyEvent',{type:'keyUp',key:value});await frame();}
async function navigate(route){await send('Page.navigate',{url:origin+route});await waitFor("document.readyState==='complete'&&document.querySelector('h1')");await frame();}
async function pointer(selector){const p=await evaluate('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()');await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});await frame();}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync('.security-review/product-detail-'+name+'.png',Buffer.from(r.data,'base64'));}
async function intercept({requestId,request}){
 const url=new URL(request.url),respond=(status,body)=>send('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});
 if(url.pathname.startsWith('/api/')){
  if(request.method!=='GET'){if(url.pathname!=='/api/checkout/quote')orderWrites++;return send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});}
  if(url.pathname==='/api/admin/me')return respond(401,{error:{code:'UNAUTHORIZED'}});
  if(url.pathname==='/api/categories')return respond(200,{data:[{id:900,code:'bouquets',slug:'bouquets',name_en:'Bouquets',name_vi:'Bó hoa',image_url:null}]});
  if(url.pathname==='/api/products')return respond(200,{data:{items:products}});
  if(url.pathname==='/api/delivery/options')return respond(200,{data:options});
  const product=products.find(p=>url.pathname==='/api/products/'+p.slug);
  if(product){if(scenario==='missing')return respond(404,{error:{code:'NOT_FOUND'}});if(scenario==='error')return respond(503,{error:{code:'INTERNAL'}});return respond(200,{data:{...product,images:scenario==='no-photo'?[]:product.images,variants:scenario==='sold-out'?product.variants.map(v=>({...v,in_stock:false,max_quantity:0})):product.variants}});}
  throw new Error('Unexpected API route '+url.pathname);
 }
 if(fonts[request.url]){const font=fonts[request.url];return send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:font.mime},{name:'Access-Control-Allow-Origin',value:'*'}],body:font.body});}
 return send(url.origin===origin?'Fetch.continueRequest':'Fetch.failRequest',url.origin===origin?{requestId}:{requestId,errorReason:'BlockedByClient'});
}
try{
 let target;for(let n=0;n<150;n++){try{const port=readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0].trim();target=(await(await fetch('http://127.0.0.1:'+port+'/json')).json()).find(t=>t.type==='page');}catch{}if(target)break;await pause(50);}assert.ok(target,'Edge unavailable');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(new Error(JSON.stringify(m.error))):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.exception?.description);if(m.method==='Fetch.requestPaused')intercept(m.params).catch(e=>{exceptions.push(e.message);send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'}).catch(()=>{});});});
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await navigate('/');await evaluate("localStorage.removeItem('lunara.cart.v1');localStorage.setItem('lunara_language','vi')");await navigate('/');await waitFor("document.querySelector('[data-product-favorite]')");
 await click('[data-product-favorite]');await check("document.querySelector('[data-product-favorite]').getAttribute('aria-pressed')==='true'&&!document.querySelector('[data-wishlist-drawer]')",'Card heart only toggles');
 await check("document.querySelector('[data-header-wishlist-count]').textContent==='1'",'Shared favorite count');
 await evaluate("document.querySelector('[data-header-wishlist]').focus()");await click('[data-header-wishlist]');await waitFor("document.querySelector('[data-wishlist-item]')");
 await check("(()=>{const r=document.querySelector('[data-wishlist-drawer]').getBoundingClientRect();return Math.abs(r.right-innerWidth)<1&&Math.abs(r.width-innerWidth/4)<1&&r.height===innerHeight})()",'Right sidebar quarter width');
 await pause(250);await screenshot('wishlist');
 await send('Emulation.setDeviceMetricsOverride',{width:768,height:1100,deviceScaleFactor:1,mobile:true});await frame();await check("(()=>{const r=document.querySelector('[data-wishlist-drawer]').getBoundingClientRect();return Math.abs(r.right-innerWidth)<1&&r.width>=innerWidth/4&&r.width<=innerWidth*.35})()",'Readable tablet sidebar');await screenshot('wishlist-tablet');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await waitFor("!document.querySelector('[data-wishlist-drawer]')");await check("document.querySelector('[data-header-wishlist]').getClientRects().length===0",'Mobile drawer closes on resize');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('[data-header-wishlist]').focus()");await click('[data-header-wishlist]');await waitFor("document.querySelector('[data-wishlist-item]')");
 await click('[data-wishlist-continue]');await waitFor("!document.querySelector('[data-wishlist-drawer]')");await check("location.pathname==='/'&&document.activeElement.matches('[data-header-wishlist]')",'Continue closes and restores focus');checks.push('Wishlist toggle/count/sidebar/tablet/mobile resize/focus');
 await click('[data-product-image-link]');await waitFor("document.querySelector('[data-product-detail]')");await check("document.querySelector('[data-detail-favorite]').getAttribute('aria-pressed')==='true'",'Favorites survive client navigation');
 await check("document.querySelectorAll('[data-detail-sizes] input').length===3&&!document.querySelector('[data-detail-sizes] [data-dropdown]')",'All sizes visible');
 await click('[data-detail-sizes] label:has(input[value="500012"])');await check("document.querySelector('[data-detail-price]').textContent.replace(/[^0-9]/g,'')==='650000'",'Size changes price');
 await click('[data-detail-quantity] button:last-child');await click('[data-detail-quantity] button:last-child');await check("document.querySelector('[data-detail-quantity] output').textContent==='3'&&document.querySelector('[data-detail-quantity] button:last-child').disabled",'Quantity bounded by stock');
 await click('[data-detail-add]');await check("location.pathname==='/shop/ui-flowers-1'&&JSON.parse(localStorage.getItem('lunara.cart.v1')).lines.some(l=>l.variantId===500012&&l.quantity===3)",'Add exact variant/quantity and stay');
 await check("document.querySelector('[data-detail-add]').disabled",'Existing cart quantity included in limit');
 await click('[data-detail-sizes] label:has(input[value="500011"])');await click('[data-detail-quantity] button:last-child');await click('[data-order-now]');await waitFor("location.pathname==='/cart'&&document.querySelector('[data-proceed-checkout]')");
 await check("JSON.parse(localStorage.getItem('lunara.cart.v1')).lines.some(l=>l.variantId===500011&&l.quantity===2)",'Buy adds selected quantity and opens cart');checks.push('Size/stock/quantity/add/buy routing');
 await click('[data-proceed-checkout]');await waitFor("document.querySelector('[data-checkout-form]')");
 for(const selector of ['input[name=senderName]','input[name=senderPhone]','textarea']){await pointer(selector);await check("(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle==='none'&&s.boxShadow==='none'})()",'Pointer focus without border ring '+selector);}
 await pointer('input[name=senderName]');await key('Tab');await check("getComputedStyle(document.activeElement).outlineStyle!=='none'",'Keyboard focus retained');
 const checkoutHeading=await evaluate("(()=>{const e=document.querySelector('[data-checkout-page] h1'),s=getComputedStyle(e),h=getComputedStyle(e.parentElement);return{font:s.fontSize,tracking:s.letterSpacing,align:h.textAlign,border:h.borderBottomWidth,padding:h.paddingBottom,margin:h.marginBottom}})()");checks.push('Checkout pointer focus and keyboard focus');
 await navigate('/orders/track');const lookupHeading=await evaluate("(()=>{const e=document.querySelector('[data-order-lookup-page] h1'),s=getComputedStyle(e),h=getComputedStyle(e.parentElement);return{font:s.fontSize,tracking:s.letterSpacing,align:h.textAlign,border:h.borderBottomWidth,padding:h.paddingBottom,margin:h.marginBottom}})()");assert.deepEqual(lookupHeading,checkoutHeading);checks.push('Lookup heading matches checkout');
 await click('[data-header-wishlist]');await waitFor("document.querySelector('[data-wishlist-empty]')");await key('Escape');await waitFor("!document.querySelector('[data-wishlist-drawer]')");checks.push('Reload clears favorites');
 for(const state of ['no-photo','sold-out','missing','error']){scenario=state;await navigate('/shop/ui-flowers-1');if(state==='no-photo')await check("document.querySelector('[data-product-detail]')&&!document.querySelector('[data-product-zoom]')",'Empty gallery');if(state==='sold-out')await check("document.querySelector('[data-detail-add]').disabled&&document.querySelector('[data-order-now]').disabled",'Sold out cannot add');if(state==='missing'||state==='error')await check("!document.querySelector('[data-product-detail]')&&!document.querySelector('[data-order-now]')",'Missing/error state');}checks.push('No-photo/sold-out/missing/error states');
 scenario='normal';await evaluate("localStorage.removeItem('lunara.cart.v1')");await navigate('/shop/ui-flowers-1');await waitFor("document.querySelector('[data-product-detail]')");
 for(const theme of themes){await click('#header-theme');await waitFor("document.querySelector('[role=option][data-value="+JSON.stringify(theme.id)+"]')");await click('[role=option][data-value="'+theme.id+'"]');
  for(const language of ['en','vi']){await click('[data-language-switcher] button[lang='+language+']');for(const width of [320,390,768,1024,1440,2560,3840]){await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await frame();await check('document.documentElement.scrollWidth<=innerWidth','Detail overflow '+theme.id+'/'+language+'/'+width);await check("document.querySelectorAll('[data-related-products] [data-product-id]').length===4&&!document.querySelector('[data-related-products] [data-product-id=\"50001\"]')",'Four other recommendations');await check("document.querySelector('[data-related-view-all]').getAttribute('href')==='/shop'",'View more links to all flowers');await check("document.querySelector('[data-detail-favorite]').getClientRects().length>0===(innerWidth>=768)",'Mobile wishlist deferred');await check("document.querySelector('[data-product-editorial]').innerText.includes("+JSON.stringify(language==='vi'?'Nội dung đang được cập nhật.':'Details are being updated.')+")",'Editorial placeholders');layouts.push({theme:theme.id,language,width});}}
  console.log('PASS detail '+theme.id);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await evaluate('window.scrollTo(0,0)');await screenshot('desktop');await evaluate("document.querySelector('[data-product-editorial]').scrollIntoView({block:'start'})");await screenshot('editorial');
 await click('[data-detail-favorite]');await click('[data-header-wishlist]');await waitFor("document.querySelector('[data-wishlist-item]')");await click('[data-wishlist-item] button');await waitFor("document.querySelector('[data-wishlist-empty]')");await key('Escape');await waitFor("!document.querySelector('[data-wishlist-drawer]')");
 await check("![...Object.keys(localStorage),...Object.keys(sessionStorage)].some(k=>/wishlist|favorite/i.test(k))",'No wishlist storage');
 await click('[data-related-view-all]');await waitFor("location.pathname==='/shop'");checks.push('Remove favorite and related view-all navigation');
 assert.equal(orderWrites,0);assert.deepEqual(exceptions,[]);const result={checks,layoutCases:layouts.length,themes:themes.length,orderWrites,exceptions,apiMode:'Synthetic public API responses; no API writes; optional cached fonts'};writeFileSync('.security-review/product-detail-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){try{await screenshot('failure');writeFileSync('.security-review/product-detail-failure.json',JSON.stringify({message:error.message,exceptions,state:await evaluate('({url:location.href,text:document.body.innerText})')},null,2));}catch{}throw error;}
finally{try{if(ws?.readyState===WebSocket.OPEN)await send('Browser.close');ws?.close();}catch{}browser.kill();}
