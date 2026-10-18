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
let ws,nextId=0,orderWrites=0,routeName='',activeOrigin=baseUrl,adminPreview=false;
const pending=new Map(),exceptions=[],layoutCases=[],routeCases=[],baseline={};
const checkedFonts=new Set();
const navigationCases=[],homePaletteCases=[],originalRoundTrips=[];
const adminCases=[];
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
async function assert(expression,label){if(!await evaluate('Boolean('+expression+')'))throw new Error(label+' '+routeName);}
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
  await waitFor("document.querySelectorAll('[role=option] [data-theme-option]').length==="+themes.length);
  const preview=await evaluate("[...document.querySelector('[data-theme-option=\""+id+"\"] svg').children].map(rect=>rect.getAttribute('fill'))");
  const theme=themes.find(item=>item.id===id);
  assertNode.deepEqual(preview,'secondaryAccent' in theme?[theme.background,theme.secondary,theme.accent,theme.secondaryAccent,theme.tertiaryAccent,theme.foreground]:[theme.background,theme.secondary,theme.softSurface,theme.accent,theme.foreground],'Theme preview '+id);
  await evaluate("document.querySelector('[role=option][data-value=\""+id+"\"]').click()");
  await waitFor("document.documentElement.dataset.lunaraTheme==='"+id+"' && !document.querySelector('[role=listbox]')");
}
async function screenshot(name){const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(root,'.security-review','themes-'+name+'.png'),Buffer.from(data,'base64'));}
function rgb(hex){return 'rgb('+hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')+')';}
const stylesExpression=`(()=>{const style=(selector)=>{const e=document.querySelector(selector);if(!e)return null;const s=getComputedStyle(e);return {color:s.color,background:s.backgroundColor,border:s.borderColor,font:s.fontFamily,fontSize:s.fontSize};};return {header:style('[data-storefront-header]'),title:style('h1'),story:style('[data-home-story] h2'),footer:style('[data-storefront-footer]'),footerLink:style('[data-storefront-footer] nav a'),footerCopy:style('[data-storefront-footer] > div:last-child'),input:style('main input'),card:style('[data-product-id]'),body:style('body')};})()`;
async function checkHomePalette(theme) {
  const fallbackBefore=await evaluate("(()=>{const image=document.querySelector('[data-product-id] img'),r=image.getBoundingClientRect();return {alt:image.alt,width:r.width,height:r.height}})()");
  await evaluate("(()=>{const image=document.querySelector('[data-product-id] img');if(!image.hasAttribute('data-image-fallback'))image.dispatchEvent(new Event('error'))})()");
  await waitFor("Boolean(document.querySelector('[data-product-id] [data-image-fallback]'))");
  const colors=await evaluate(`(()=>{
    const root=getComputedStyle(document.documentElement);
    const token=name=>{const e=document.createElement('span');e.style.color=root.getPropertyValue('--lunara-'+name);document.body.append(e);const color=getComputedStyle(e).color;e.remove();return color};
    const targets={page:['[data-home-layout]','backgroundColor','cream'],header:['[data-storefront-header]','backgroundColor','card-surface'],navbarBody:['[data-header-main]','backgroundColor','card-surface'],navigation:['[data-main-navigation]','backgroundColor','card-surface'],searchSurface:['#header-search','backgroundColor','card-surface'],utility:['[data-header-utility]','backgroundColor','utility-background'],logo:['[data-storefront-logo]','color','ink'],heading:['h1','color','ink'],accent:['h1 span','color','rose-strong'],cta:['[data-home-hero] a','backgroundColor','rose-strong'],copy:['[data-home-hero] p','color','body'],input:['#header-search input','color','ink'],heroFrame:['[data-hero-visual]','backgroundColor','blush'],featured:['#featured','backgroundColor','cream'],productFrame:['[data-product-image-link]','backgroundColor','blush'],productAdd:['[data-product-add]','backgroundColor','card-surface'],price:['[data-product-price]','color','ink'],journey:['[data-home-journey]','backgroundColor','section-secondary'],story:['[data-home-story]','backgroundColor','card-surface'],storyHeading:['[data-home-story] h2','color','ink'],storyCopy:['[data-home-story] p','color','body'],storyLink:['[data-story-link]','color','rose-strong'],footer:['[data-storefront-footer]','backgroundColor','footer-background']};
    Object.assign(targets,{footerText:['[data-storefront-footer]','color','body'],footerTitle:['[data-storefront-footer] h4','color','ink'],footerLink:['[data-storefront-footer] a[href="/shop"]','color','body'],footerBorder:['[data-footer-bottom]','borderTopColor','border'],serviceIcon:['[data-home-services] svg','color','accent-secondary-strong'],journeyIcon:['[data-home-journey] li svg','color','accent-secondary-strong'],journeyMarker:['[data-home-journey] li > span','color','campaign-foreground'],journeyMarkerSurface:['[data-home-journey] li > span','backgroundColor','campaign-surface']});
    const actual={},expected={};for(const [name,[selector,property,color]] of Object.entries(targets)){actual[name]=getComputedStyle(document.querySelector(selector))[property];expected[name]=token(color)};
    const image=document.querySelector('[data-product-id] [data-image-fallback]'),r=image.getBoundingClientRect(),fallback={color:getComputedStyle(image).backgroundColor,mask:getComputedStyle(image).maskImage,alt:image.alt,width:r.width,height:r.height};
    const logoColors=[...document.querySelectorAll('[data-storefront-logo-art] path')].flatMap(path=>{const style=getComputedStyle(path);return [style.fill,style.stroke]});
    return {actual,expected,fallback,logoColors,allowedLogoColors:['none',token('rose'),token('rose-strong'),token('rose-light'),token('accent-secondary'),token('accent-tertiary')],language:document.documentElement.lang,width:innerWidth};
  })()`);
  assertNode.equal(colors.expected.heading,rgb(theme.foreground),'Registered heading '+theme.id);
  assertNode.equal(colors.expected.page,rgb(theme.background),'Registered background '+theme.id);
  assertNode.equal(colors.expected.journey,rgb(theme.secondary),'Reference secondary-section role '+theme.id);
  assertNode.equal(colors.expected.story,rgb('#FFFFFF'),'Reference surface-card role '+theme.id);
  assertNode.deepEqual(colors.actual,colors.expected,'Home uses selected palette without local color overrides: '+theme.id);
  assertNode.equal(colors.actual.utility,rgb(theme.softSurface),'Utility stays within the active palette: '+theme.id);
  assertNode.equal(colors.actual.footer,rgb(theme.secondary),'Footer stays within the active palette: '+theme.id);
  assertNode.ok(colors.logoColors.length>0&&colors.logoColors.every(color=>colors.allowedLogoColors.includes(color)),'Logo illustration follows the active palette: '+theme.id);
  if('secondaryAccent' in theme){
    assertNode.ok(colors.logoColors.includes(rgb(theme.secondaryAccent))&&colors.logoColors.includes(rgb(theme.tertiaryAccent)),'Logo renders both distinct accents: '+theme.id);
    assertNode.equal(colors.actual.journeyMarkerSurface,rgb(theme.tertiaryAccent),'Campaign marker preserves the tertiary accent: '+theme.id);
  }else{
    assertNode.equal(colors.actual.serviceIcon,colors.expected.accent,'Legacy service icon color: '+theme.id);
    assertNode.equal(colors.actual.journeyMarkerSurface,'rgba(0, 0, 0, 0)','Legacy marker remains transparent: '+theme.id);
  }
  assertNode.equal(colors.fallback.color,colors.expected.accent,'Failed image icon follows the active palette: '+theme.id);
  assertNode.notEqual(colors.fallback.mask,'none','Failed image retains its visible icon');
  assertNode.deepEqual({alt:colors.fallback.alt,width:colors.fallback.width,height:colors.fallback.height},fallbackBefore,'Failed image retains its label and dimensions');
  assertNode.equal(colors.actual.story,colors.actual.header,'Story uses the navbar main surface: '+theme.id);
  assertNode.notEqual(colors.actual.story,colors.actual.journey,'Story and Journey use distinct surfaces: '+theme.id);
  homePaletteCases.push({theme:theme.id,language:colors.language,width:colors.width});
}
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
async function checkAdminPalettes(product) {
  // Synthetic read responses exercise shared admin colors without credentials or server writes.
  adminPreview=true;
  apiCache['/api/admin/products']={data:{items:[{...product,category_id:apiCache['/api/categories'].data[0].id,status:'ACTIVE',archived_at:null,variants:product.variants.map(variant=>({...variant,product_id:product.id,stock_quantity:variant.in_stock?10:0,low_stock_threshold:2,is_active:true}))}]}};
  for(const theme of themes.filter(item=>'secondaryAccent' in item))for(const language of ['en','vi'])for(const width of [390,1440]){
    await evaluate("localStorage.setItem('lunara.theme.v1',"+JSON.stringify(theme.id)+");localStorage.setItem('lunara_language',"+JSON.stringify(language)+")");
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
    routeName='/admin/stock';await send('Page.navigate',{url:baseUrl+routeName});
    await waitFor("document.querySelector('[data-testid=admin-products] table input[name=price]')");await frame();
    await assert("document.documentElement.dataset.lunaraTheme==='"+theme.id+"'&&document.documentElement.lang==='"+language+"'",'Admin keeps preference');
    await assert("document.documentElement.scrollWidth<=innerWidth",'Admin contains table scrolling');
    await assert("getComputedStyle(document.querySelector('[data-testid=admin-products]')).color==='"+rgb(theme.foreground)+"'",'Admin text palette');
    const ratios=await evaluate(contrastExpression);assertNode.deepEqual(ratios.failing,[],'Admin control contrast '+theme.id);
    await evaluate("document.querySelector('[data-testid=product-create]').click()");await waitFor("document.querySelector('[data-testid=product-form] input[name=name_en]')");
    await assert("getComputedStyle(document.querySelector('[role=dialog]')).color==='"+rgb(theme.foreground)+"'",'Admin modal text palette');
    await assert("getComputedStyle(document.querySelector('[role=dialog]')).backgroundColor==='rgb(255, 255, 255)'",'Admin retains readable white modal');
    await assert("(()=>{const r=document.querySelector('[role=dialog]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1})()",'Admin modal fits viewport');
    await key('Escape');await waitFor("!document.querySelector('[role=dialog]')");
    adminCases.push({theme:theme.id,language,width});
  }
  console.log('PASS creative admin table/form '+adminCases.length+' cases');
}
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
      const body=adminPreview&&url.pathname==='/api/admin/me'?{data:{role:'ADMIN'}}:apiCache[url.pathname]||{error:{code:'UNAUTHORIZED'}};
      send('Fetch.fulfillRequest',{requestId,responseCode:url.pathname==='/api/admin/me'&&!adminPreview?401:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')}).catch(()=>{});
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
  if(!process.argv.includes('--admin-only')){
  if(baselineUrl){activeOrigin=baselineUrl;await navigate('/');await evaluate(seed);for(const route of routes){await navigate(route);if(route==='/shop')await waitFor("Boolean(document.querySelector('[data-product-id]'))");baseline[route]=await evaluate(stylesExpression);}writeFileSync(path.join(root,'.security-review/themes-original-baseline.json'),JSON.stringify(baseline,null,2));activeOrigin=baseUrl;}
  await navigate('/');await evaluate(seed);await navigate('/');await waitFor("Boolean(document.querySelector('#header-theme'))");
  if(Object.keys(baseline).length){for(const route of routes){await navigate(route);const actual=await evaluate(stylesExpression);for(const [selector,expected] of Object.entries(baseline[route]))if(expected!==null)assertNode.deepEqual(actual[selector],expected,'Original style regression '+route+' '+selector);}}
  await navigate('/');
  await checkHomePalette(themes[0]);
  await assert("document.querySelectorAll('#header-theme').length===1 && document.querySelector('#header-theme').getAttribute('aria-label').includes('Original')",'One accessible theme control');
  // The shared Radix control supplies typeahead, checked state, dismissal and focus restoration.
  await evaluate("document.querySelector('#header-theme').focus()");await key('ArrowDown');
  await waitFor("Boolean(document.querySelector('[role=listbox]'))");
  await assert("(()=>{const option=document.querySelector('[role=option][data-highlighted]');return option&&parseFloat(getComputedStyle(option).outlineWidth)>=2})()",'Theme menu keyboard focus indicator');
  await key('End');await key('Enter');await waitFor("document.documentElement.dataset.lunaraTheme==='"+themes.at(-1).id+"'");
  await assert("document.activeElement.id==='header-theme'",'Restore trigger focus after keyboard choice');
  await evaluate("document.querySelector('#header-theme').click()");await waitFor("Boolean(document.querySelector('[role=listbox]'))");
  await assert("Boolean(document.querySelector('[role=option][data-value=\""+themes.at(-1).id+"\"][aria-selected=true]'))",'Checked option');
  await key('Escape');await waitFor("!document.querySelector('[role=listbox]')");
  await assert("document.activeElement.id==='header-theme'",'Escape focus');
  await evaluate("document.querySelector('#header-theme').click()");await waitFor("Boolean(document.querySelector('[role=listbox]'))");
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:30,y:300,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:30,y:300,button:'left',clickCount:1});await waitFor("!document.querySelector('[role=listbox]')");
  for(const theme of process.argv.includes('--navigation-only')?[]:themes){
    await choose(theme.id);
    await navigate('/');await delay(200);
    for(const language of ['en','vi']){
      await evaluate("document.querySelector('[data-language-switcher] button[lang="+language+"]').click()");await waitFor("document.documentElement.lang==='"+language+"'");await evaluate('document.fonts.ready.then(()=>true)');
      await delay(200);
      if(fontCacheFile)for(const family of language==='en'?['Fraunces','Inter']:['Lora','Be Vietnam Pro']){
        await assert("[...document.fonts].some(face=>face.family.replaceAll('\"','')==='"+family+"'&&face.status==='loaded')",'Actual locale font '+family);checkedFonts.add(family);
      }
      for(const width of [320,360,390,640,768,1024,1280,1440]){
        await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});await frame();
        await assert('document.documentElement.scrollWidth<=innerWidth','Overflow '+theme.id+'/'+language+'/'+width);
        await assert("(()=>{const main=document.querySelector('[data-header-main]'),logo=main.children[0].getBoundingClientRect(),search=main.children[1].getBoundingClientRect(),actions=main.children[2].getBoundingClientRect();return logo.right<=actions.left+1&&actions.right<=innerWidth&&(innerWidth>=1024?logo.right<=search.left+1&&search.right<=actions.left+1:search.top>=Math.max(logo.bottom,actions.bottom))})()",'Header rows fit '+theme.id+'/'+language+'/'+width);
        await assert("(()=>{const e=document.querySelector('[data-header-utility] > div'),a=e.children[0].getBoundingClientRect(),b=e.children[1].getBoundingClientRect();return a.right<=b.left+1&&b.right<=innerWidth})()",'Utility row fits '+width);
        await checkHomePalette(theme);
        await evaluate("document.querySelector('#header-theme').click()");await waitFor("Boolean(document.querySelector('[role=listbox]'))");
        await assert("(()=>{const list=document.querySelector('[role=listbox]'),r=list.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&r.height<=340&&list.querySelectorAll('[data-theme-option]').length==="+themes.length+"})()",'Theme popup bounds '+width);
        await assert("getComputedStyle(document.querySelector('[role=listbox]')).backgroundColor==='"+rgb('#FFFFFF')+"'",'Theme popup surface-card role '+theme.id);
        await key('Escape');layoutCases.push({theme:theme.id,language,width});
      }
    }
    await assert("localStorage.getItem('lunara.theme.v1')==='"+theme.id+"'",'Persistence '+theme.id);
    for(const route of routes){
      await navigate(route);await assert("document.documentElement.dataset.lunaraTheme==='"+theme.id+"'",'Route persistence');
      await assert("getComputedStyle(document.querySelector('[data-storefront-logo]')).color==='"+rgb(theme.foreground)+"'",'Header palette across routes '+theme.id+' '+route);
      if(theme.id!=='original'){
        await assert("getComputedStyle(document.querySelector('[data-d1-storefront]')).backgroundColor==='"+rgb(theme.background)+"'",'Root palette '+theme.id);
        await assert("getComputedStyle(document.querySelector('[data-storefront-footer]')).backgroundColor==='"+rgb(theme.secondary)+"'",'Light footer '+theme.id);
        await assert("getComputedStyle(document.querySelector('h1')).color==='"+rgb(theme.foreground)+"'",'Route heading palette '+theme.id);
        const ratios=await evaluate(contrastExpression);if(ratios.failing.length)throw new Error('Actual text contrast '+theme.id+' '+route+' '+JSON.stringify(ratios));
      }
      routeCases.push({theme:theme.id,route});
    }
    if('secondaryAccent' in theme){
      await navigate('/');await evaluate("document.querySelector('[data-footer-coming-soon]').click()");await waitFor("Boolean(document.querySelector('[role=dialog]'))");
      await assert("getComputedStyle(document.querySelector('[role=dialog]')).backgroundColor==='"+rgb(theme.background)+"'",'Creative dialog portal '+theme.id);await key('Escape');
      await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await navigate('/');await screenshot(theme.id+'-desktop');
      await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await screenshot(theme.id+'-mobile');
    }
    await navigate('/');await choose('original');await delay(200);await checkHomePalette(themes[0]);
    await assert("document.documentElement.style.length===0",'Original clears theme tokens after '+theme.id);
    await navigate('/');await checkHomePalette(themes[0]);
    originalRoundTrips.push(theme.id);
    if(theme.id==='sage-green'){await screenshot('original-restored-desktop');await choose('sage-green');await delay(200);await screenshot('sage-green-desktop');}
    await choose(theme.id);await navigate('/');await checkHomePalette(theme);
    console.log('PASS '+theme.id);
  }
  if(fontCacheFile&&!process.argv.includes('--navigation-only'))assertNode.equal(checkedFonts.size,4,'All four locale fonts were checked while their locale was active');
  // Persistent search and navigation use real catalog routes; deferred actions show a notice.
  const click=async selector=>{await evaluate("document.querySelector("+JSON.stringify(selector)+").click()");await frame();};
  const input=async(selector,value)=>{await evaluate("(()=>{const e=document.querySelector("+JSON.stringify(selector)+");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,"+JSON.stringify(value)+");e.dispatchEvent(new Event('input',{bubbles:true}));})()");await frame();};
  const visible=selector=>"(()=>{const e=document.querySelector("+JSON.stringify(selector)+");return e&&e.getBoundingClientRect().width>0})()";
  const openMenu=async()=>{if(await evaluate('innerWidth<1024&&!document.querySelector("[data-header-menu-toggle]").matches("[aria-expanded=true]")'))await click('[data-header-menu-toggle]');};
  const submenu=async kind=>{await openMenu();await evaluate("document.querySelector('[data-header-submenu-trigger="+kind+"]').focus()");await key('ArrowDown');await waitFor(visible('[data-storefront-submenu='+kind+']'));};
  for(const language of ['en','vi'])for(const width of [320,390,768,1024,1440]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
    await navigate('/');await click('[data-language-switcher] button[lang='+language+']');
    await assert(visible('#header-search input'),'Always visible search');
    await input('#header-search input','  hoa hồng & quà  ');await choose('sage-green');
    await assert("document.querySelector('#header-search input').value==='  hoa hồng & quà  '",'Theme preserves query');
    await click('#header-search button[type=submit]');
    await waitFor("location.pathname==='/shop'&&new URLSearchParams(location.search).get('q')==='hoa hồng & quà'");
    await assert("document.querySelector('#header-search input').value==='hoa hồng & quà'",'Query synchronized with route');
    await submenu('flowers');
    const categories=apiCache['/api/categories'].data;
    await assert("document.querySelectorAll('[data-storefront-submenu=flowers] a').length==="+(categories.length+1),'Only DB categories');
    await key('Escape');await waitFor("!document.querySelector('[data-storefront-submenu]')");
    await assert("document.activeElement.matches('[data-header-submenu-trigger=flowers]')",'Submenu Escape returns focus');
    await submenu('flowers');await click('[data-storefront-submenu=flowers] a[href*="category=bouquets"]');
    await waitFor("new URLSearchParams(location.search).get('category')==='bouquets'&&!document.querySelector('[data-storefront-submenu]')");
    await assert("innerWidth>=1024||document.querySelector('[data-header-menu-toggle]').getAttribute('aria-expanded')==='false'",'Category closes mobile navigation');
    await openMenu();await click('[data-main-navigation] a[href*="category=gift-sets"]');
    await waitFor("new URLSearchParams(location.search).get('category')==='gift-sets'");
    await assert("document.querySelector('[data-main-navigation] a[href*=gift-sets]').getAttribute('aria-current')==='page'",'Gift category active');
    await click('[data-header-tracking]');await waitFor("location.pathname==='/orders/track'");
    await assert("document.querySelector('[data-header-cart-count]').textContent==='1'",'Shared cart badge');
    if(width>=768){
      await evaluate("document.querySelector('[data-header-wishlist]').focus()");
      await click('[data-header-wishlist]');await waitFor(visible('[data-wishlist-drawer]'));
      await assert("location.pathname==='/orders/track'&&document.querySelector('[data-wishlist-empty]')",'Memory-only wishlist drawer');
      await key('Escape');await waitFor("!document.querySelector('[role=dialog]')");
      await assert("document.activeElement.matches('[data-header-wishlist]')",'Wishlist focus restoration');
    }else await assert("document.querySelector('[data-header-wishlist]').getClientRects().length===0",'Wishlist deferred on mobile');
    for(const selector of ['[data-header-support]','[data-header-hotline]','[data-header-contact]']){
      if(selector.includes('contact'))await openMenu();
      await evaluate("document.querySelector("+JSON.stringify(selector)+").focus()");
      await click(selector);await waitFor(visible('[role=dialog]'));
      await assert("location.pathname==='/orders/track'&&document.querySelector('[data-feature-unavailable]')",'Notice without navigation');
      await key('Escape');await waitFor("!document.querySelector('[role=dialog]')");
      await assert(selector.includes('contact')&&width<1024?"document.activeElement.matches('[data-header-menu-toggle]')":"document.activeElement.matches("+JSON.stringify(selector)+")",'Notice focus restoration');
    }
    await submenu('occasions');await key('Home');await key('Enter');
    await waitFor(visible('[role=dialog]'));await assert("!document.querySelector('[data-storefront-submenu]')",'Occasion notice dismisses dropdown');
    await key('Escape');await waitFor("!document.querySelector('[role=dialog]')");
    await assert(width<1024?"document.activeElement.matches('[data-header-menu-toggle]')":"document.activeElement.matches('[data-header-submenu-trigger=occasions]')",'Occasion focus restoration');
    if(width<1024){
      await openMenu();await key('Escape');await assert("document.querySelector('[data-header-menu-toggle]').getAttribute('aria-expanded')==='false'",'Mobile Escape');
      await openMenu();await send('Input.dispatchMouseEvent',{type:'mousePressed',x:10,y:850,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:10,y:850,button:'left',clickCount:1});
      await assert("document.querySelector('[data-header-menu-toggle]').getAttribute('aria-expanded')==='false'",'Mobile outside click');
    }
    await click('[data-header-cart]');await waitFor("location.pathname==='/cart'");
    if([320,390,1440].includes(width)){await navigate('/');await screenshot('navigation-'+language+'-'+width);}
    navigationCases.push({language,width});console.log('PASS navigation '+language+' '+width);
  }
  await navigate('/checkout');await waitFor("Boolean(document.querySelector('[name=senderName]'))");
  await evaluate("(()=>{const e=document.querySelector('[name=senderName]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'UI theme check');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
  for(const theme of themes.filter(item=>'secondaryAccent' in item)){
    await choose(theme.id);await assert("document.querySelector('[name=senderName]').value==='UI theme check'",'Switch preserves in-memory form '+theme.id);
  }
  await assert("!localStorage.getItem('lunara.cart.v1').includes('UI theme check')",'No form storage');
  await navigate('/shop');await choose('ocean-confetti');
  const boot=await send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__themeBoot=[];new MutationObserver(()=>{if(document.querySelector('[data-d1-storefront]')&&!window.__themeBoot.length)window.__themeBoot.push(document.documentElement.dataset.lunaraTheme);}).observe(document,{subtree:true,childList:true});"});
  await send('Page.reload');await waitFor("Boolean(document.querySelector('#header-theme'))");
  await assert("document.documentElement.dataset.lunaraTheme==='ocean-confetti' && window.__themeBoot[0]==='ocean-confetti'",'Saved theme before first render');
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
  }else await navigate('/');
  await checkAdminPalettes(product);
  if(exceptions.length||orderWrites)throw new Error(JSON.stringify({exceptions,orderWrites}));
  const result={themes:themes.length,homePaletteCases:homePaletteCases.length,originalRoundTrips:originalRoundTrips.length,navigationCases:navigationCases.length,layoutCases:layoutCases.length,routeCases:routeCases.length,adminCases:adminCases.length,originalBaselineRoutes:Object.keys(baseline).length,fonts:[...checkedFonts],apiMode:'Public GET snapshots; catalog/delivery intercepted; admin reads synthetic',keyboard:true,escape:true,outsideClick:true,portal:true,boot:true,persistence:true,blockedStorage:true,formPreserved:true,orderWrites,exceptions};
  if(process.argv.includes('--admin-only'))for(const key of ['keyboard','escape','outsideClick','portal','boot','persistence','blockedStorage','formPreserved'])delete result[key];
  writeFileSync(path.join(root,'.security-review',process.argv.includes('--admin-only')?'themes-admin-results.json':'themes-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){try{await screenshot('failure');writeFileSync(path.join(root,'.security-review/themes-failure.json'),JSON.stringify({message:error.message,routeName,state:await evaluate("({lang:document.documentElement.lang,theme:document.documentElement.dataset.lunaraTheme,width:innerWidth,text:document.body.innerText.slice(0,1200)})"),exceptions},null,2));}catch{}throw error;}
finally{if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}ws.close();}browser.kill();}
