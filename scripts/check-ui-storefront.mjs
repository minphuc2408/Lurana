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
const responsive = process.argv.includes('--responsive');
const responsiveWidths = [320,360,375,390,414,430,540,600,639,640,641,767,768,769,820,912,1023,1024,1025,1100,1279,1280,1281,1366,1440,1535,1536,1550,1600,1920,2000,2560,3440,3840];
const viewports = responsive
  ? [...responsiveWidths.map(width=>({width,height:width<640?844:width<1024?1024:1080,mobile:width<1024})),
    ...[[568,320],[667,375],[740,360],[844,390],[915,412],[1024,600],[1280,720],[1920,600]].map(([width,height])=>({width,height,mobile:width<1024})),
    {width:320,height:600,mobile:false},{width:640,height:600,mobile:false},{width:960,height:540,mobile:false},
    {width:390,height:844,mobile:true,deviceScaleFactor:3},{width:768,height:1024,mobile:true,deviceScaleFactor:2}]
  : [320,390,640,768,1024,1440,1920].map(width=>({width,height:1000,mobile:width<768}));
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
const navigationCases=[];
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

  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  const click=async selector=>{await evaluate("document.querySelector("+JSON.stringify(selector)+").click()");await frame();};
  const chooseControl=async(id,value)=>{if(await evaluate("innerWidth<640&&!document.querySelector('#"+id+"').getClientRects().length")){await click('[data-shop-filter-toggle]');await waitFor("document.querySelector('#"+id+"').getClientRects().length>0");}await click('#'+id);await waitFor("document.querySelector('[role=option][data-value="+JSON.stringify(value)+"]')");await click('[role=option][data-value="'+value+'"]');await waitFor("!document.querySelector('[role=listbox]')");};
  const localeJson={en:JSON.parse(readFileSync('src/shared/i18n/locales/en/common.json','utf8')),vi:JSON.parse(readFileSync('src/shared/i18n/locales/vi/common.json','utf8'))};
  const preservedVietnameseCopy=['✦ Studio hoa cao cấp','Nơi những đóa hoa','Kể câu chuyện của bạn','Được tạo nên bằng tình yêu và sự chăm chút, mỗi mẫu hoa Lunarra là một tác phẩm sống, thay bạn gửi những điều khó nói.','Tùy chọn giao hàng','Chọn khu vực và thời gian khi đặt hàng','Chăm chút từng đóa hoa','Được kết bằng tình yêu và sự tận tâm','Thanh toán khi nhận hàng','Nhận hoa rồi thanh toán','Món quà đầy tâm ý','Gửi trao cảm xúc trong từng khoảnh khắc'];
  await navigate('/');await evaluate("localStorage.removeItem('lunara.cart.v1');localStorage.setItem('lunara_language','en');localStorage.setItem('lunara.theme.v1','original')");await navigate('/');
  await evaluate("document.querySelectorAll('[data-story-photo]').forEach(image=>{image.loading='eager'})");
  await waitFor("[...document.querySelectorAll('[data-hero-image], [data-story-photo]')].length===4&&[...document.querySelectorAll('[data-hero-image], [data-story-photo]')].every(image=>image.complete&&image.naturalWidth>=600&&new URL(image.currentSrc).origin===location.origin)");
  for(const theme of responsive?themes.map(item=>item.id):['original','sage-green']){
    await choose(theme);
    for(const language of ['en','vi']){
      await click('[data-language-switcher] button[lang='+language+']');
      if(language==='vi'){
        const homeCopy=await evaluate("document.querySelector('[data-home-layout]').innerText.replace(/\\s+/g,' ').toLocaleLowerCase('vi')");
        for(const text of preservedVietnameseCopy)assertNode.ok(homeCopy.includes(text.toLocaleLowerCase('vi')),'Preserved owner copy: '+text);
        await assert("getComputedStyle(document.querySelector('[data-home-hero] h1 span')).fontStyle==='italic'",'Hero emphasis preserved');
      }
      for(const viewport of viewports){
        const {width,height}=viewport;
        await send('Emulation.setDeviceMetricsOverride',{deviceScaleFactor:1,...viewport});await frame();
        await assert('document.documentElement.scrollWidth<=innerWidth','Home overflow '+language+'/'+width);
        await assert("(()=>{const e=document.querySelector('#featured');return getComputedStyle(e).borderTopWidth==='1px'&&e.getBoundingClientRect().width===document.documentElement.clientWidth&&getComputedStyle(e,'::before').boxShadow==='none'})()",'Actual 1px divider spans viewport');
        await assert("getComputedStyle(document.querySelector('[data-storefront-header]')).borderBottomWidth==='0px'&&getComputedStyle(document.querySelector('[data-storefront-header]')).boxShadow!=='none'",'Header shadow without bottom separator');
        await evaluate("document.querySelector('#header-search input').focus({preventScroll:true})");await frame();
        await assert("(()=>{const form=document.querySelector('#header-search'),input=form.querySelector('input'),header=document.querySelector('[data-storefront-header]'),f=getComputedStyle(form),i=getComputedStyle(input);return f.borderTopWidth==='0px'&&i.borderTopWidth==='0px'&&i.outlineStyle==='none'&&f.backgroundColor===getComputedStyle(header).backgroundColor&&f.boxShadow!=='none'})()",'Search uses navigation color/shadow without focused border');
        await assert("(()=>{const e=document.querySelector('[data-language-switcher]');return getComputedStyle(e).fontSize==='12px'&&[...e.querySelectorAll('button')].every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44})})()",'EN VI readable labels and touch targets');
        await assert("document.querySelector('[data-header-utility]').getBoundingClientRect().height>=48",'Utility bar fits 44px controls');
        await assert("(()=>{const s=getComputedStyle(document.querySelector('[data-home-story]')).backgroundColor;return s===getComputedStyle(document.querySelector('[data-header-main]')).backgroundColor&&s!==getComputedStyle(document.querySelector('[data-home-journey]')).backgroundColor})()",'Story shares navbar body surface and differs from Journey');
        await assert("(()=>{const a=document.querySelector('#featured'),b=document.querySelector('[data-home-journey]'),s=getComputedStyle(b);return s.borderTopWidth==='0px'&&s.backgroundColor!==getComputedStyle(a).backgroundColor&&Math.abs(a.getBoundingClientRect().bottom-b.getBoundingClientRect().top)<1&&b.getBoundingClientRect().width===document.documentElement.clientWidth})()",'Featured and Journey meet without separator on distinct full-width surfaces');
        await assert("document.querySelectorAll('[data-storefront-footer] [data-footer-coming-soon]').length===14",'All deferred footer destinations preserved');
        for(const label of ['Main Store address','HCMC Store address','Hanoi Branch address']){
          await assert("document.querySelector('[data-storefront-footer]').innerText.includes("+JSON.stringify(localeJson[language][label])+")",'Footer address '+label);
        }
        await assert("document.querySelector('[data-storefront-footer]').innerText.includes('CÔNG TY TNHH LUNARA')&&document.querySelector('[data-storefront-footer]').innerText.includes('001')",'Legal text preserved');
        if(responsive){
          await assert("(()=>{const root=document.querySelector('[data-home-layout]'),shells=[root.children[0],document.querySelector('#featured').firstElementChild,document.querySelector('[data-home-journey]').firstElementChild,document.querySelector('[data-home-story]').firstElementChild].map(e=>e.getBoundingClientRect());return shells.every(r=>Math.abs(r.width-shells[0].width)<1&&Math.abs(r.x-shells[0].x)<1)&&(innerWidth<1920||shells[0].width>1440)&&(innerWidth<2560||shells[0].width===1600)})()",'Aligned content scales for ultrawide '+width);
          await assert("(()=>{const hero=document.querySelector('[data-home-hero]'),copy=hero.firstElementChild.firstElementChild.getBoundingClientRect(),image=document.querySelector('[data-hero-visual]').getBoundingClientRect();return innerWidth>=1024?copy.right<=image.left&&copy.top<image.bottom&&image.top<copy.bottom:image.top>=copy.bottom})()",'Hero composition follows reference breakpoint '+width);
          await assert("(()=>{const grid=document.querySelector('[data-home-story]').firstElementChild.children[1].firstElementChild,a=grid.children[0].getBoundingClientRect(),b=grid.children[1].getBoundingClientRect();return Math.abs(a.top-b.top)<1&&Math.abs(a.bottom-b.bottom)<1})()",'Story photo columns align '+width);
          await assert("[...document.querySelectorAll('[data-product-price], [data-home-layout] h1, [data-home-layout] h2')].every(e=>e.scrollWidth<=e.clientWidth+1)",'Essential text stays within its bounds '+width);
          await click('#header-theme');await waitFor("Boolean(document.querySelector('[role=listbox]'))");
          await assert("(()=>{const r=document.querySelector('[role=listbox]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1})()",'Theme menu fits viewport '+width+'/'+height);await key('Escape');
          if(width<1024){
            await click('[data-header-menu-toggle]');
            await assert("(()=>{const nav=document.querySelector('[data-main-navigation]'),r=nav.getBoundingClientRect(),header=document.querySelector('[data-storefront-header]').getBoundingClientRect();return r.height>0&&r.top>=header.bottom-1&&r.bottom<=innerHeight+1})()",'Mobile navigation fits available height '+width+'/'+height);
            await evaluate("document.querySelector('[data-header-contact]').focus()");await frame();
            await assert("(()=>{const a=document.querySelector('[data-header-contact]').getBoundingClientRect(),b=document.querySelector('[data-main-navigation]').getBoundingClientRect();return a.top>=b.top&&a.bottom<=b.bottom})()",'Last menu item remains keyboard reachable '+width+'/'+height);await key('Escape');
          }
          if(theme==='original'&&language==='vi'&&[390,768,1024,1440,2560,3840].includes(width)&&height>=844){
            await evaluate('scrollTo(0,0)');await frame();await screenshot('responsive-after-'+width);
          }
        }
        layoutCases.push({theme,language,width,height});
      }
    }
    if(responsive)console.log('PASS responsive '+theme);
  }
  for(const language of ['en','vi'])for(const width of [390,1440]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});await frame();
    await click('[data-language-switcher] button[lang='+language+']');
    await evaluate("window.scrollTo(0,document.body.scrollHeight)");await frame();
    if(width===1440&&language==='vi')await screenshot('footer-ref-1440');
    await click('[data-storefront-footer] a[href="/shop"]');await waitFor("location.pathname==='/shop'&&document.querySelector('[data-shop-layout]')");await frame();
    await assert('scrollY===0','Footer to Shop resets scroll');
    await assert("!document.querySelector('[data-shop-layout] input')&&!document.querySelector('[data-shop-layout] nav[aria-label=Breadcrumb]')",'No duplicate search or breadcrumb');
    await assert("document.querySelectorAll('[data-shop-layout] [data-product-appearance=featured]').length===8",'Shop reuses Featured cards');
    for(const responsiveWidth of [320,390,640,768,1024,1440,1920]){
      await send('Emulation.setDeviceMetricsOverride',{width:responsiveWidth,height:1000,deviceScaleFactor:1,mobile:responsiveWidth<768});await frame();
      await assert('document.documentElement.scrollWidth<=innerWidth','Shop overflow '+responsiveWidth);
      if(responsiveWidth>=1440)await assert("(()=>{const e=document.querySelector('[data-shop-filters]');const a=e.children[0].getBoundingClientRect(),b=e.querySelector('#shop-price-range').parentElement.parentElement.getBoundingClientRect();return Math.abs(a.top+a.height/2-b.top-b.height/2)<2&&a.right<=b.left})()",'Categories and both controls share row');
    }
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});await frame();
    await chooseControl('shop-price-range','500-1000');
    await assert("(()=>{const cards=[...document.querySelectorAll('[data-shop-layout] [data-product-id]')];return cards.length>0&&cards.every(e=>{const n=Number(e.querySelector('[data-product-price]').innerText.replace(/[^0-9]/g,''));return n>=500000&&n<1000000})})()",'Actual price filtering');
    await chooseControl('shop-price-range','all');await chooseControl('shop-sort','high');
    await assert("(()=>{const prices=[...document.querySelectorAll('[data-shop-layout] [data-product-price]')].map(e=>Number(e.innerText.replace(/[^0-9]/g,'')));return prices.every((n,i)=>i===0||n<=prices[i-1])})()",'Visible prices sorted');
    await evaluate('window.scrollTo(0,150)');await frame();
    await click('[data-shop-filters] [role=group] button:nth-child(2)');
    await assert("new URLSearchParams(location.search).get('category')==='bouquets'",'Category synchronizes URL');
    await assert("document.querySelectorAll('[data-shop-layout] [data-product-id]').length===4",'Category filtering');
    await assert('scrollY===150','Category filter keeps current scroll');
    await click('[data-header-tracking]');await waitFor("location.pathname==='/orders/track'");await frame();
    await evaluate("window.scrollTo(0,document.body.scrollHeight)");await evaluate('history.back()');
    await waitFor("location.pathname==='/shop'&&new URLSearchParams(location.search).get('category')==='bouquets'");await frame();
    await assert('scrollY===0','Back to a filtered catalog resets scroll');
    await click('[data-shop-filters] [role=group] button:first-child');await chooseControl('shop-sort','featured');
    if(language==='vi')await screenshot('shop-ref-'+width);
    await click('[data-shop-layout] [data-product-id="1"] [data-product-add]');
    await assert("JSON.parse(localStorage.getItem('lunara.cart.v1')).lines.some(e=>e.variantId===1)",'Quick add uses smallest size S');
    await evaluate("window.scrollTo(0,document.body.scrollHeight)");await frame();
    await click('[data-shop-layout] [data-product-id="1"] [data-product-image-link]');
    await waitFor("location.pathname==='/shop/blush-peony-bouquet'");await frame();await assert('scrollY===0','Product navigation resets scroll');
    await evaluate("window.scrollTo(0,document.body.scrollHeight)");await click('[data-header-cart]');await waitFor("location.pathname==='/cart'");await frame();await assert('scrollY===0','Cart navigation resets scroll');
    await evaluate("window.scrollTo(0,document.body.scrollHeight)");await click('[data-header-tracking]');await waitFor("location.pathname==='/orders/track'");await frame();await assert('scrollY===0','Tracking navigation resets scroll');
    await evaluate("window.scrollTo(0,document.body.scrollHeight)");
    if(width<1024)await click('[data-header-menu-toggle]');
    await click('[data-main-navigation] a[href="/"]');await waitFor("location.pathname==='/'");await frame();await assert('scrollY===0','Home navigation resets scroll');
    if(width>=1024) await assert("getComputedStyle(document.querySelector('[data-main-navigation] a[href=\"/\"]'),'::after').animationDuration==='0.15s'",'Underline duration 150ms');
    await evaluate("window.scrollTo(0,document.body.scrollHeight)");await frame();
    await evaluate("document.querySelector('[data-footer-coming-soon]').scrollIntoView({block:'center'});document.querySelector('[data-footer-coming-soon]').focus({preventScroll:true})");await frame();
    await evaluate('document.fonts.ready.then(()=>true)');await frame();
    await click('[data-footer-coming-soon]');await waitFor("Boolean(document.querySelector('[role=dialog]'))");await key('Escape');await waitFor("!document.querySelector('[role=dialog]')");await frame();
    await assert("(()=>{const e=document.querySelector('[data-footer-coming-soon]'),r=e.getBoundingClientRect();return location.pathname==='/'&&document.activeElement===e&&r.top>=0&&r.bottom<=innerHeight&&scrollY>0})()",'Footer notice returns focus to visible trigger without route reset');
    await click('[data-header-tracking]');await waitFor("location.pathname==='/orders/track'");await frame();
    await evaluate('history.back()');await waitFor("location.pathname==='/'");await frame();await assert('scrollY===0','Back navigation starts at top');
    routeCases.push({language,width});
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await navigate('/');
  await evaluate("window.scrollTo(0,scrollY+document.querySelector('#featured').getBoundingClientRect().top-document.querySelector('[data-storefront-header]').getBoundingClientRect().height-60)");await screenshot('thin-divider');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await assert("getComputedStyle(document.querySelector('[data-main-navigation] a[aria-current=page]'),'::after').animationName==='none'",'Reduced-motion disables underline animation');
  if(exceptions.length||orderWrites)throw new Error(JSON.stringify({exceptions,orderWrites}));
  const result={responsive,layoutCases:layoutCases.length,interactionGroups:routeCases.length,footerPreserved:true,routeScroll:true,search:true,compactLanguage:true,thinDivider:true,priceFilter:true,sort:true,smallestVariant:true,orderWrites,exceptions};
  writeFileSync(path.join(root,'.security-review',responsive?'storefront-responsive-results.json':'storefront-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){try{await screenshot('storefront-failure');}catch{}throw error;}
finally{if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}ws.close();}browser.kill();}
