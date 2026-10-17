import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assertNode from 'node:assert/strict';
import { themes } from '../src/shared/theme/themes.ts';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const baselineUrl = process.argv.find(arg=>arg.startsWith('--baseline='))?.slice(11);
const baselineFile = process.argv.find(arg=>arg.startsWith('--baseline-file='))?.slice(16);
const fontCacheFile = process.argv.find(arg=>arg.startsWith('--font-cache='))?.slice(13);
const fontCache = fontCacheFile ? JSON.parse(readFileSync(fontCacheFile,'utf8')) : {};
const apiCacheFile = process.argv.find(arg=>arg.startsWith('--api-cache='))?.slice(12);
const apiCache = apiCacheFile ? JSON.parse(readFileSync(apiCacheFile,'utf8')) : {};
for(const url of [baseUrl,baselineUrl].filter(Boolean)) if(new URL(url).hostname!=='127.0.0.1') throw new Error('Local previews only');
const root=process.cwd(), profile=path.join(root,'.security-review','themes-edge-'+Date.now());
mkdirSync(profile,{recursive:true});
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
  '--headless','--disable-gpu','--disable-background-networking','--disable-sync','--no-first-run',
  '--remote-debugging-port=0',`--user-data-dir=${profile}`,
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE fonts.googleapis.com, EXCLUDE fonts.gstatic.com','about:blank',
],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws,nextId=0,orderWrites=0,routeName='',activeOrigin=baseUrl;
const pending=new Map(),exceptions=[],layoutCases=[],routeCases=[],baseline={};
const checkedFonts=new Set();
if(baselineFile)Object.assign(baseline,JSON.parse(readFileSync(baselineFile,'utf8')));
async function send(method,params={}) {
  const id=++nextId, result=new Promise((resolve,reject)=>pending.set(id,{resolve,reject}));
  ws.send(JSON.stringify({id,method,params}));return result;
}
async function evaluate(expression) {
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
}
async function waitFor(expression) {
  for(let i=0;i<200;i++){if(await evaluate('Boolean('+expression+')'))return;await delay(50);}
  throw new Error('Timeout '+routeName+': '+expression);
}
async function assert(expression,label){if(!await evaluate(expression))throw new Error(label+' '+routeName);}
async function frame(){await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');}
async function navigate(route){
  routeName=route;await send('Page.navigate',{url:activeOrigin+route});
  await waitFor('document.readyState==="complete" && document.querySelector("[data-d1-storefront]") && document.querySelector("h1")');
  if(route==='/'||route==='/shop')await waitFor("Boolean(document.querySelector('[data-product-id]'))");
  if(route==='/checkout')await waitFor("Boolean(document.querySelector('[name=senderName]'))");
  if(route==='/cart')await waitFor("Boolean(document.querySelector('[data-proceed-checkout]'))");
  await frame();
}
async function key(key,code=key){await send('Input.dispatchKeyEvent',{type:'keyDown',key,code});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code});await frame();}
async function choose(id){
  await evaluate("document.querySelector('#header-theme').click()");
  await waitFor("document.querySelectorAll('[role=option] [data-theme-option]').length===16");
  await evaluate("document.querySelector('[role=option][data-value=\""+id+"\"]').click()");
  await waitFor("document.documentElement.dataset.lunaraTheme==='"+id+"' && !document.querySelector('[role=listbox]')");
}
async function screenshot(name){const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(root,'.security-review','themes-'+name+'.png'),Buffer.from(data,'base64'));}
function rgb(hex){return 'rgb('+hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')+')';}
const stylesExpression=`(()=>{const style=(selector)=>{const e=document.querySelector(selector);if(!e)return null;const s=getComputedStyle(e);return {color:s.color,background:s.backgroundColor,border:s.borderColor,font:s.fontFamily,fontSize:s.fontSize};};return {header:style('[data-storefront-header]'),title:style('h1'),story:style('[data-home-story] h2'),footer:style('[data-storefront-footer]'),footerLink:style('[data-storefront-footer] nav a'),footerCopy:style('[data-storefront-footer] > div:last-child'),input:style('main input'),card:style('[data-product-id]'),body:style('body')};})()`;
const contrastExpression=`(()=>{
  const ctx=document.createElement('canvas').getContext('2d',{willReadFrequently:true});
  const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data]};
  const lum=rgb=>{const [r,g,b]=rgb.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return r*.2126+g*.7152+b*.0722};
  const contrast=(a,b)=>{const[l,d]=[lum(a),lum(b)].sort((x,y)=>y-x);return(l+.05)/(d+.05)};
  const back=e=>{if(!e)return[255,255,255,255];const color=rgba(getComputedStyle(e).backgroundColor),alpha=color[3]/255;if(alpha===1)return color;const parent=back(e.parentElement);return color.slice(0,3).map((v,i)=>v*alpha+parent[i]*(1-alpha)).concat(255)};
  const controls=[...document.querySelectorAll('main a, main button, main input, [data-storefront-footer] a, [data-storefront-header] button')].filter(e=>e.getBoundingClientRect().width>0&&!e.disabled);
  const ratios=controls.map(e=>({text:(e.innerText||e.getAttribute('aria-label')||e.tagName).slice(0,60),ratio:contrast(rgba(getComputedStyle(e).color),back(e))}));
  return {minimum:Math.min(...ratios.map(x=>x.ratio)),failing:ratios.filter(x=>x.ratio<4.5)};
})()`;
try {
  let target;
  for(let i=0;i<200;i++){try{const port=readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0].trim();target=(await(await fetch('http://127.0.0.1:'+port+'/json')).json()).find(t=>t.type==='page');}catch{}if(target)break;await delay(50);}
  if(!target)throw new Error('Edge unavailable');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const job=pending.get(m.id);pending.delete(m.id);m.error?job?.reject(new Error(JSON.stringify(m.error))):job?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.exception?.description);if(m.method==='Fetch.requestPaused'){
    const {requestId,request}=m.params,url=new URL(request.url);
    if(['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)) {
      const cached=fontCache[request.url];
      const response=cached ? send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:cached.mime},{name:'Access-Control-Allow-Origin',value:'*'}],body:cached.body}) : send('Fetch.failRequest',{requestId,errorReason:'Failed'});
      response.catch(()=>{});
    } else if(request.method==='GET'&&(apiCache[url.pathname]||url.pathname==='/api/admin/me')) {
      const body=apiCache[url.pathname]||{error:{code:'UNAUTHORIZED'}};
      send('Fetch.fulfillRequest',{requestId,responseCode:url.pathname==='/api/admin/me'?401:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')}).catch(()=>{});
    } else if(request.method!=='GET'&&url.pathname!=='/api/checkout/quote'){orderWrites++;send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'}).catch(()=>{});}else send('Fetch.continueRequest',{requestId}).catch(()=>{});
  }});
  await send('Page.enable');await send('Runtime.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:'*/api/*',requestStage:'Request'},{urlPattern:'*fonts.googleapis.com/*',requestStage:'Request'},{urlPattern:'*fonts.gstatic.com/*',requestStage:'Request'}]});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  const getSnapshot=async route=>{if(!apiCache[route]){const response=await fetch(baseUrl+route);if(!response.ok)throw new Error('Public snapshot '+route+' HTTP '+response.status);apiCache[route]=await response.json();}return apiCache[route];};
  const productResponse=await getSnapshot('/api/products');
  const product=productResponse.data.items.find(p=>p.variants.some(v=>v.in_stock));
  if(!product)throw new Error('A local sample product in stock is required');
  const variant=product.variants.find(v=>v.in_stock);
  await Promise.all(['/api/categories','/api/delivery/options','/api/products/'+product.slug].map(getSnapshot));
  const seed=`localStorage.setItem('lunara_language','en');localStorage.setItem('lunara.theme.v1','original');localStorage.setItem('lunara.cart.v1',JSON.stringify({version:1,lines:[{variantId:${variant.id},quantity:1}]}));`;
  const routes=['/','/shop','/shop/'+product.slug,'/cart','/checkout','/orders/track','/about'];
  if(baselineUrl){activeOrigin=baselineUrl;await navigate('/');await evaluate(seed);for(const route of routes){await navigate(route);if(route==='/shop')await waitFor("Boolean(document.querySelector('[data-product-id]'))");baseline[route]=await evaluate(stylesExpression);}writeFileSync(path.join(root,'.security-review/themes-original-baseline.json'),JSON.stringify(baseline,null,2));activeOrigin=baseUrl;}
  await navigate('/');await evaluate(seed);await navigate('/');await waitFor("Boolean(document.querySelector('#header-theme'))");
  if(Object.keys(baseline).length){for(const route of routes){await navigate(route);const actual=await evaluate(stylesExpression);for(const [selector,expected] of Object.entries(baseline[route]))if(expected!==null)assertNode.deepEqual(actual[selector],expected,'Original style regression '+route+' '+selector);}}
  await navigate('/');
  await assert("document.querySelectorAll('#header-theme').length===1 && document.querySelector('#header-theme').getAttribute('aria-label').includes('Original')",'One accessible theme control');
  // The shared Radix control supplies typeahead, checked state, dismissal and focus restoration.
  await evaluate("document.querySelector('#header-theme').focus()");await key('ArrowDown');
  await waitFor("Boolean(document.querySelector('[role=listbox]'))");
  await assert("(()=>{const option=document.querySelector('[role=option][data-highlighted]');return option&&parseFloat(getComputedStyle(option).outlineWidth)>=2})()",'Theme menu keyboard focus indicator');
  await key('End');await key('Enter');await waitFor("document.documentElement.dataset.lunaraTheme==='linen-olive'");
  await assert("document.activeElement.id==='header-theme'",'Restore trigger focus after keyboard choice');
  await evaluate("document.querySelector('#header-theme').click()");await waitFor("Boolean(document.querySelector('[role=listbox]'))");
  await assert("Boolean(document.querySelector('[role=option][data-value=\"linen-olive\"][aria-selected=true]'))",'Checked option');
  await key('Escape');await waitFor("!document.querySelector('[role=listbox]')");
  await assert("document.activeElement.id==='header-theme'",'Escape focus');
  await evaluate("document.querySelector('#header-theme').click()");await waitFor("Boolean(document.querySelector('[role=listbox]'))");
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:30,y:300,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:30,y:300,button:'left',clickCount:1});await waitFor("!document.querySelector('[role=listbox]')");
  for(const theme of themes){
    await choose(theme.id);
    for(const language of ['en','vi']){
      await evaluate("document.querySelector('[data-language-switcher] button[lang="+language+"]').click()");await waitFor("document.documentElement.lang==='"+language+"'");await evaluate('document.fonts.ready.then(()=>true)');
      if(fontCacheFile)for(const family of language==='en'?['Fraunces','Inter']:['Lora','Be Vietnam Pro']){
        await assert("[...document.fonts].some(face=>face.family.replaceAll('\"','')==='"+family+"'&&face.status==='loaded')",'Actual locale font '+family);checkedFonts.add(family);
      }
      for(const width of [320,360,390,640,768,1024,1280,1440]){
        await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});await frame();
        await assert('document.documentElement.scrollWidth<=innerWidth','Overflow '+theme.id+'/'+language+'/'+width);
        await assert("(()=>{const actions=document.querySelector('#header-theme').parentElement;const logo=document.querySelector('[data-storefront-logo]').getBoundingClientRect(),r=actions.getBoundingClientRect();return logo.right<=r.left+1&&r.right<=innerWidth})()",'Header overlap '+theme.id+'/'+language+'/'+width);
        await assert("(()=>{const parts=[...document.querySelector('[data-storefront-header] > div').children].filter(e=>getComputedStyle(e).display!=='none');return parts.every((e,i)=>!i||parts[i-1].getBoundingClientRect().right<=e.getBoundingClientRect().left+1)})()",'Header navigation overlap '+theme.id+'/'+language+'/'+width);
        await evaluate("document.querySelector('#header-theme').click()");await waitFor("Boolean(document.querySelector('[role=listbox]'))");
        await assert("(()=>{const list=document.querySelector('[role=listbox]'),r=list.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&r.height<=340&&list.querySelectorAll('[data-theme-option]').length===16})()",'Theme popup bounds '+width);
        await key('Escape');layoutCases.push({theme:theme.id,language,width});
      }
    }
    await assert("localStorage.getItem('lunara.theme.v1')==='"+theme.id+"'",'Persistence '+theme.id);
    for(const route of routes){
      await navigate(route);await assert("document.documentElement.dataset.lunaraTheme==='"+theme.id+"'",'Route persistence');
      if(theme.id!=='original'){
        await assert("getComputedStyle(document.querySelector('[data-d1-storefront]')).backgroundColor==='"+rgb(theme.background)+"'",'Root palette '+theme.id);
        await assert("getComputedStyle(document.querySelector('[data-storefront-footer]')).backgroundColor==='"+rgb(theme.secondary)+"'",'Light footer '+theme.id);
        await assert("getComputedStyle(document.querySelector('h1')).color==='"+rgb(theme.foreground)+"'",'Route heading palette '+theme.id);
        const ratios=await evaluate(contrastExpression);if(ratios.failing.length)throw new Error('Actual text contrast '+theme.id+' '+route+' '+JSON.stringify(ratios));
      }
      routeCases.push({theme:theme.id,route});
    }
    console.log('PASS '+theme.id);
  }
  if(fontCacheFile)assertNode.equal(checkedFonts.size,4,'All four locale fonts were checked while their locale was active');
  for(const width of [1280,1440]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await evaluate("document.querySelector('[data-header-search-toggle]').click()");await frame();
    await assert("(()=>{const parts=[...document.querySelector('[data-storefront-header] > div').children].filter(e=>getComputedStyle(e).display!=='none');return parts.every((e,i)=>!i||parts[i-1].getBoundingClientRect().right<=e.getBoundingClientRect().left+1)})()",'Expanded desktop search and theme fit');
    await choose('sea-glass');await assert("Boolean(document.querySelector('#header-search'))",'Theme preserves expanded search');
    await evaluate("document.querySelector('#header-search button[type=button]').click()");
  }
  await navigate('/checkout');await waitFor("Boolean(document.querySelector('[name=senderName]'))");
  await evaluate("(()=>{const e=document.querySelector('[name=senderName]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'UI theme check');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await choose('mint-sorbet');await assert("document.querySelector('[name=senderName]').value==='UI theme check'",'Switch preserves in-memory form');
  await assert("!localStorage.getItem('lunara.cart.v1').includes('UI theme check')",'No form storage');
  await navigate('/shop');await choose('sea-glass');
  const boot=await send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__themeBoot=[];new MutationObserver(()=>{if(document.querySelector('[data-d1-storefront]')&&!window.__themeBoot.length)window.__themeBoot.push(document.documentElement.dataset.lunaraTheme);}).observe(document,{subtree:true,childList:true});"});
  await send('Page.reload');await waitFor("Boolean(document.querySelector('#header-theme'))");
  await assert("document.documentElement.dataset.lunaraTheme==='sea-glass' && window.__themeBoot[0]==='sea-glass'",'Saved theme before first render');
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:boot.identifier});
  await evaluate("localStorage.setItem('lunara.theme.v1','invalid')");await navigate('/');
  await assert("document.documentElement.dataset.lunaraTheme==='original' && !document.documentElement.style.getPropertyValue('--lunara-cream')",'Invalid ID fallback');
  await choose('champagne');await choose('original');await assert("document.documentElement.style.length===0",'Return Original removes overrides');
  // Portals inherit the selected palette instead of the Original component colors.
  await choose('lavender-mist');await evaluate("document.querySelector('[data-footer-coming-soon]').click()");await waitFor("Boolean(document.querySelector('[role=dialog]'))");
  await assert("getComputedStyle(document.querySelector('[role=dialog]')).backgroundColor==='"+rgb(themes.find(t=>t.id==='lavender-mist').background)+"'",'Dialog portal theme');await key('Escape');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await navigate('/');await screenshot('lavender-desktop');
  await evaluate("document.querySelector('#header-theme').click()");await waitFor("Boolean(document.querySelector('[role=listbox]'))");await screenshot('switcher-desktop');await key('Escape');
  await send('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});await evaluate("document.querySelector('#header-theme').click()");await waitFor("Boolean(document.querySelector('[role=listbox]'))");await screenshot('switcher-mobile');await key('Escape');
  const blocked=await send('Page.addScriptToEvaluateOnNewDocument',{source:"Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError')};Storage.prototype.setItem=function(){throw new DOMException('Blocked','QuotaExceededError')};"});
  await navigate('/');await assert("document.documentElement.dataset.lunaraTheme==='original'",'Blocked storage fallback');await choose('coral-shell');
  await assert("document.documentElement.dataset.lunaraTheme==='coral-shell'",'Blocked storage in-memory choice');
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:blocked.identifier});
  if(exceptions.length||orderWrites)throw new Error(JSON.stringify({exceptions,orderWrites}));
  const result={themes:themes.length,layoutCases:layoutCases.length,routeCases:routeCases.length,originalBaselineRoutes:Object.keys(baseline).length,fonts:[...checkedFonts],apiMode:'Public GET snapshots; browser catalog/delivery reads intercepted',keyboard:true,escape:true,outsideClick:true,portal:true,boot:true,persistence:true,blockedStorage:true,formPreserved:true,orderWrites,exceptions};
  writeFileSync(path.join(root,'.security-review/themes-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){try{await screenshot('failure');writeFileSync(path.join(root,'.security-review/themes-failure.json'),JSON.stringify({message:error.message,routeName,state:await evaluate("({lang:document.documentElement.lang,theme:document.documentElement.dataset.lunaraTheme,width:innerWidth,text:document.body.innerText.slice(0,1200)})"),exceptions},null,2));}catch{}throw error;}
finally{if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}ws.close();}browser.kill();}
