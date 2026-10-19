import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { themes } from '../src/shared/theme/themes.ts';

const origin = process.argv[2] || 'http://127.0.0.1:4174';
const phase = process.argv[3];
assert.ok(['before','after'].includes(phase),'Use <loopback preview> before|after');
assert.equal(new URL(origin).hostname,'127.0.0.1','Local previews only');
const output = path.resolve('.security-review/creative-theme-audit');
const profile = path.join(output,'edge-'+Date.now());
mkdirSync(path.join(output,phase),{recursive:true});mkdirSync(profile,{recursive:true});
const fonts = JSON.parse(readFileSync('.security-review/themes-font-cache.json','utf8'));
const cache = JSON.parse(readFileSync('.security-review/themes-api-cache.json','utf8'));
const photo = '/assets/'+readdirSync('dist/client/assets').find(file=>file.startsWith('hero-1400-'));
const products = cache['/api/products'].data.items.slice(0,4).map(product=>({...product,is_featured:true,images:[{url:origin+photo,alt_en:'Local sample flowers',alt_vi:'Ảnh hoa mẫu local',is_primary:true}]}));
cache['/api/products']={data:{items:products}};
for(const product of products)cache['/api/products/'+product.slug]={data:product};
cache['/api/admin/me']={data:{role:'ADMIN'}};
cache['/api/admin/products']={data:{items:[{...products[0],category_id:cache['/api/categories'].data[0].id,status:'ACTIVE',archived_at:null,variants:products[0].variants.map(variant=>({...variant,product_id:products[0].id,stock_quantity:10,low_stock_threshold:2,is_active:true}))}]}};
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--disable-sync','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws,nextId=0,writes=0;
const pending=new Map(),exceptions=[],snapshots={},checks=[],accentUsage=[];
function send(method,params={}){const id=++nextId,result=new Promise((resolve,reject)=>pending.set(id,{resolve,reject}));ws.send(JSON.stringify({id,method,params}));return result;}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function waitFor(expression){for(let i=0;i<200;i++){if(await evaluate('Boolean('+expression+')'))return;await pause(50);}throw new Error('Timeout '+expression);}
async function frame(){await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');}
async function intercept({requestId,request}){
  const url=new URL(request.url),fulfill=(body,mime='application/json')=>send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:mime},{name:'Access-Control-Allow-Origin',value:'*'}],body:mime==='application/json'?Buffer.from(JSON.stringify(body)).toString('base64'):body});
  if(url.pathname.startsWith('/api/')){if(request.method!=='GET'){writes++;return send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});}assert.ok(cache[url.pathname],'Unexpected API '+url.pathname);return fulfill(cache[url.pathname]);}
  if(fonts[request.url])return fulfill(fonts[request.url].body,fonts[request.url].mime);
  return send(url.origin===origin?'Fetch.continueRequest':'Fetch.failRequest',url.origin===origin?{requestId}:{requestId,errorReason:'BlockedByClient'});
}
const measure=`(()=>{
 const round=n=>Math.round(n*1000)/1000;
 const properties=['color','backgroundColor','borderColor','boxShadow','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textAlign','display','position','padding','margin','borderWidth','borderRadius'];
 const elements=[...document.querySelectorAll('[data-d1-storefront] *, main *, header *, aside *')];
 return elements.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,text:e.children.length?'':e.textContent,geometry:[r.x,r.y,r.width,r.height].map(round),style:properties.map(p=>s[p])}});
})()`;
const readUsage=`(()=>{const selectors={primary:'[data-home-hero] a',secondary:'[data-header-utility]',heroLabel:'[data-home-hero] > div > div > span',quickAdd:'[data-product-add]',journey:'[data-home-journey]',journeyIcon:'[data-home-journey] li > div',secondaryLink:'[data-story-link]',footer:'[data-storefront-footer]',footerHeading:'[data-storefront-footer] h4'};return Object.fromEntries(Object.entries(selectors).map(([key,selector])=>{const e=document.querySelector(selector),s=getComputedStyle(e),r=e.getBoundingClientRect();return [key,{color:s.color,background:s.backgroundColor,width:r.width,height:r.height}]}))})()`;
const textContrast=`(()=>{
 const ctx=document.createElement('canvas').getContext('2d',{willReadFrequently:true});
 const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data]};
 const lum=rgb=>{const [r,g,b]=rgb.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return r*.2126+g*.7152+b*.0722};
 const contrast=(a,b)=>{const[l,d]=[lum(a),lum(b)].sort((x,y)=>y-x);return(l+.05)/(d+.05)};
 const back=e=>{if(!e)return[255,255,255,255];const c=rgba(getComputedStyle(e).backgroundColor),alpha=c[3]/255;if(alpha===1)return c;const p=back(e.parentElement);return c.slice(0,3).map((v,i)=>v*alpha+p[i]*(1-alpha)).concat(255)};
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),failing=[];let node;
 // The fixed Zalo wordmark is painted over a white SVG speech bubble, not its blue ancestor background.
 while(node=walker.nextNode()){if(!node.textContent.trim())continue;const e=node.parentElement,r=e.getBoundingClientRect();if(r.width<2||r.height<2||e.closest('script,style,[disabled],[aria-disabled=true],[data-zalo-contact]'))continue;
 let visible=true;for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.visibility==='hidden'||s.opacity==='0'){visible=false;break;}}if(!visible)continue;
 const ratio=contrast(rgba(getComputedStyle(e).color),back(e));if(ratio<4.5)failing.push({text:node.textContent.trim().slice(0,70),ratio,color:getComputedStyle(e).color});}
 return failing;
})()`;
async function capture(name,full=false){const size=await evaluate('({width:innerWidth,height:document.documentElement.scrollHeight})');const params=full?{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,...size,scale:1}}:{format:'png',captureBeyondViewport:false};const r=await send('Page.captureScreenshot',params);writeFileSync(path.join(output,phase,name+'.png'),Buffer.from(r.data,'base64'));}
async function load(theme,language,width,route='/'){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===390?844:1000,deviceScaleFactor:1,mobile:width===390});
  await evaluate("localStorage.setItem('lunara.theme.v1',"+JSON.stringify(theme.id)+");localStorage.setItem('lunara_language',"+JSON.stringify(language)+");localStorage.removeItem('lunara.cart.v1')");
  await send('Page.navigate',{url:origin+route});
  await waitFor(route.startsWith('/admin')?"document.querySelector('[data-testid=admin-products] table input')":"document.querySelector('[data-home-story]')&&document.querySelectorAll('[data-product-id]').length===4");
  await evaluate("document.querySelectorAll('img').forEach(e=>e.loading='eager');Promise.all([document.fonts.ready,...[...document.images].map(e=>e.decode().catch(()=>{}))]).then(()=>true)");
  await evaluate('scrollTo(0,0)');await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await frame();await pause(100);
}
function report(){
  const creative=themes.filter(theme=>'secondaryAccent' in theme);
  writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Lunarra — đối chiếu đa sắc</title><style>body{margin:0;background:#fbfaf6;color:#383943;font:15px system-ui}header{position:sticky;top:0;padding:16px 24px;background:#fff;border-bottom:1px solid #ddd;z-index:1}h1{font-size:22px;margin:0 0 8px}p{margin:8px 0;line-height:1.6}select{padding:8px;margin-right:12px}main{padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0;min-width:0}figcaption{font-weight:600;padding:8px}img{width:100%;display:block;border:1px solid #ddd}main.mobile{max-width:850px;margin:auto}.note{padding:0 24px}@media(max-width:650px){main{grid-template-columns:1fr}}</style><header><h1>Lunarra · Creative Multicolor — trước / sau</h1><p>Primary: CTA · Secondary: tiện ích, liên kết phụ, quick-add · Tertiary: nhãn Hero, Journey. Cùng nội dung, font và kích thước; catalog/ảnh mẫu local, không ghi API.</p><label>Theme <select id="theme">${creative.map(theme=>`<option value="${theme.id}">${theme.name}</option>`).join('')}</select></label><label>Màn hình <select id="viewport"><option value="desktop">Desktop 1440px</option><option value="mobile">Mobile 390px</option></select></label><label>Vùng <select id="region"><option value="hero">Hero</option><option value="featured">Featured</option><option value="journey">Journey / Story</option><option value="footer">Footer</option><option value="full">Toàn trang</option></select></label></header><main id="comparison"><figure><figcaption>Trước</figcaption><a id="beforeLink"><img id="before" alt="Trước điều chỉnh màu"></a></figure><figure><figcaption>Sau</figcaption><a id="afterLink"><img id="after" alt="Sau điều chỉnh màu"></a></figure></main><p class="note">Bấm ảnh để xem PNG ở kích thước gốc. Các con số kiểm chứng nằm trong after.json.</p><script>const controls=['theme','viewport','region'].map(id=>document.getElementById(id));function update(){const[t,v,r]=controls.map(e=>e.value);document.getElementById('comparison').className=v;for(const phase of ['before','after']){const src=phase+'/'+t+'-'+v+'-'+r+'.png';document.getElementById(phase).src=src;document.getElementById(phase+'Link').href=src}}controls.forEach(e=>e.onchange=update);update();</script></html>`);
}
try{
  let target;for(let i=0;i<200;i++){try{const port=readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0].trim();target=(await(await fetch('http://127.0.0.1:'+port+'/json')).json()).find(t=>t.type==='page');}catch{}if(target)break;await pause(50);}assert.ok(target,'Edge unavailable');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const job=pending.get(m.id);pending.delete(m.id);m.error?job?.reject(new Error(JSON.stringify(m.error))):job?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.exception?.description);if(m.method==='Fetch.requestPaused')intercept(m.params).catch(error=>{exceptions.push(error.message);send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'}).catch(()=>{});});});
  await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await send('Page.navigate',{url:origin});await waitFor("document.querySelector('[data-home-story]')");
  const baseline=phase==='after'?JSON.parse(readFileSync(path.join(output,'before.json'),'utf8')):null;
  if(baseline)assert.deepEqual(themes,baseline.palettes,'All 21 registered palettes remain unchanged');
  for(const theme of themes){
    for(const language of ['en','vi'])for(const width of [390,1440]){
      await load(theme,language,width);const name=theme.id+'/'+language+'/'+width;const tree=await evaluate(measure);snapshots[name]=tree;
      if(baseline){assert.deepEqual(tree.map(e=>({tag:e.tag,text:e.text,geometry:e.geometry,typography:e.style.slice(4)})),baseline.snapshots[name].map(e=>({tag:e.tag,text:e.text,geometry:e.geometry,typography:e.style.slice(4)})),'Layout/type/content '+name);if(!('secondaryAccent' in theme))assert.deepEqual(tree,baseline.snapshots[name],'Legacy computed styles '+name);}
      checks.push(name);
      if(baseline&&'secondaryAccent' in theme)assert.deepEqual(await evaluate(textContrast),[],'Rendered text AA '+name);
      if('secondaryAccent' in theme&&language==='vi'){
        const usage=await evaluate(readUsage);accentUsage.push({theme:theme.id,width,usage});
        if(baseline){
          const rgb=hex=>'rgb('+hex.slice(1).match(/../g).map(value=>parseInt(value,16)).join(', ')+')';
          assert.equal(usage.secondary.background,rgb(theme.secondaryAccent),'Visible raw secondary outside logo');
          assert.equal(usage.heroLabel.background,rgb(theme.tertiaryAccent),'Visible raw tertiary in Hero');
          assert.ok(usage.secondary.width>=width-20&&usage.secondary.height>=35&&usage.heroLabel.width>100&&usage.heroLabel.height>=15,'Accent areas visibly span existing surfaces');
          assert.equal(usage.journeyIcon.background,rgb(theme.tertiaryAccent),'Visible raw tertiary repeated in Journey');
          assert.ok(usage.journeyIcon.width>=48&&usage.journeyIcon.height>=48,'Journey accent has visible area');
        }
        const prefix=theme.id+'-'+(width===390?'mobile':'desktop');await capture(prefix+'-full',true);await capture(prefix+'-hero');
        for(const [region,selector] of [['featured','#featured'],['journey','[data-home-journey]'],['footer','[data-storefront-footer]']]){
          await evaluate("scrollTo(0,Math.max(0,document.querySelector("+JSON.stringify(selector)+").getBoundingClientRect().top+scrollY-document.querySelector('[data-storefront-header]').getBoundingClientRect().height-20))");await frame();await capture(prefix+'-'+region);
        }
      }
    }
    // Active sidebar and header border changes also retain every legacy admin appearance.
    for(const width of [390,1440]){
      await load(theme,'en',width,'/admin/stock');const name=theme.id+'/admin/'+width;const tree=await evaluate(measure);snapshots[name]=tree;
      if(baseline){assert.deepEqual(tree.map(e=>e.geometry),baseline.snapshots[name].map(e=>e.geometry),'Admin layout '+name);if(!('secondaryAccent' in theme))assert.deepEqual(tree,baseline.snapshots[name],'Legacy admin computed styles '+name);}
      if(baseline&&'secondaryAccent' in theme)assert.deepEqual(await evaluate(textContrast),[],'Rendered admin text AA '+name);
      checks.push(name);
    }
    console.log('PASS '+phase+' '+theme.id);
  }
  assert.deepEqual(exceptions,[]);assert.equal(writes,0);
  const result={phase,palettes:themes,snapshots,accentUsage,checks:checks.length,legacyStyleCases:phase==='after'?96:0,creativeScreenshotPairs:10,writes,exceptions,apiMode:'Synthetic catalog/admin reads and local sample photos; fonts from local cache'};
  writeFileSync(path.join(output,phase+'.json'),JSON.stringify(result));
  if(phase==='after')report();console.log(JSON.stringify({...result,palettes:undefined,snapshots:undefined,accentUsage:undefined}));
}catch(error){try{await capture('failure');}catch{}throw error;}
finally{if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}ws.close();}browser.kill();}
