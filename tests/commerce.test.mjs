import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../worker/index.ts';
import { createTestDb } from './helpers/worker.mjs';
import { getProduct, getProducts, loadCatalog, loadProductDetail, normalizeProduct, selectProducts } from '../src/features/shop/shop.service.ts';
import { cartReducer, readCart, saveCart, CART_STORAGE_KEY } from '../src/features/cart/cart.service.ts';
import { formatVND } from '../src/shared/lib/format.ts';
import { apiRequest, ApiError } from '../src/shared/api/client.ts';
import { requestQuote } from '../src/features/cart/quote.service.ts';
let fixture;
before(async () => { fixture = createTestDb(); const original = globalThis.fetch; globalThis.fetch = (url, options) => app.request(String(url), options, { DB: fixture.db }); try { await loadCatalog(); } finally { globalThis.fetch = original; } });
after(() => fixture.close());
const item = (id, size = 'S', qty = 1) => { const p=getProduct(id),v=p.variants.find(v=>v.size_code===size);return {...p,id:'variant:'+v.id,productId:p.id,variantId:v.id,price:v.price,size,qty,maxQuantity:v.max_quantity}; };
test('catalog is an API snapshot with variant prices, categories and no fabricated ratings', () => {
 const products=getProducts();assert.equal(products.length,8);assert.equal(products[0].price,450000);assert.equal(products[0].rating,undefined);
 products[0].variants[0].price=1;assert.equal(getProduct(1).variants[0].price,450000);
 const product=getProduct(1);product.variants[0].price=1;assert.equal(getProduct(1).variants[0].price,450000);
 assert.equal(getProduct(999),undefined);
});
test('adapter selects primary image and lowest variant price; empty variants are supported', () => {
 const base={id:100,slug:'test',category_code:'bouquets',name_vi:'Hoa',name_en:'Flower',badge_code:null,is_featured:false,description_vi:'Hoa do cửa hàng mô tả',description_en:'Description written by the shop'};
 const p=normalizeProduct({...base,images:[{url:'secondary',is_primary:false},{url:'primary',is_primary:true}],variants:[{price:600000},{price:350000}]},[{code:'bouquets',name_en:'Bouquets'}]);
 assert.equal(p.description_vi,base.description_vi);assert.equal(p.description_en,base.description_en);
 assert.equal(p.image,'primary');assert.equal(p.price,350000);assert.equal(p.category,'Bouquets');assert.equal(p.reviews,undefined);
 assert.equal(normalizeProduct({...base,images:[],variants:[]}).image,'');
});
test('category code, accented search and price sorting compose over DB products', () => {
 const products=getProducts();assert.deepEqual(selectProducts(products,{category:'bouquets',search:'PASTEL',sort:'low'}).map(p=>p.id),[2]);
 assert.deepEqual(selectProducts(products,{category:'All',search:'mau don',sort:'featured'}).map(p=>p.id),[1]);
 assert.deepEqual(selectProducts(products,{category:'All',search:'missing flower',sort:'featured'}),[]);
 assert.equal(products[0].id,1);
});
test('cart merges same variant and keeps sizes separate', () => {
 let cart=cartReducer([],{type:'add',item:item(1)});cart=cartReducer(cart,{type:'add',item:item(1)});cart=cartReducer(cart,{type:'add',item:item(1,'M')});
 assert.deepEqual(cart.map(line=>[line.variantId,line.qty]),[[1,2],[2,1]]);
});
test('cart uses API stock limits, caps 15 lines and rejects invalid additions', () => {
 let cart=cartReducer([],{type:'add',item:item(1,'L',10)});
 assert.equal(cartReducer(cart,{type:'quantity',id:cart[0].id,delta:100})[0].qty,10);
 assert.equal(cartReducer(cart,{type:'quantity',id:cart[0].id,delta:-100})[0].qty,1);
 assert.equal(cartReducer(cart,{type:'add',item:{...item(2),qty:0}}),cart);
 for(let id=1;id<=15;id++)cart=cartReducer(cart,{type:'add',item:{...item(1),id:'v'+id,variantId:100+id}});
 assert.equal(cart.length,15);assert.equal(cartReducer(cart,{type:'add',item:{...item(1),id:'extra'}}),cart);
});
test('cart persistence stores only variant IDs/quantities and handles blocked or corrupt storage', () => {
 const values=new Map();const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
 saveCart([item(1,'M',2)],storage);assert.deepEqual(JSON.parse(values.get(CART_STORAGE_KEY)),{version:1,lines:[{variantId:2,quantity:2}]});
 assert.deepEqual(readCart(storage),[{variantId:2,quantity:2}]);
 for(const value of ['broken','null',JSON.stringify({version:0,lines:[]}),JSON.stringify({version:1,lines:[{variantId:1,quantity:21}]})]) {values.set(CART_STORAGE_KEY,value);assert.deepEqual(readCart(storage),[]);}
 values.set(CART_STORAGE_KEY,JSON.stringify({version:1,lines:[{variantId:1,quantity:1,price:1},{variantId:1,quantity:2}]}));assert.deepEqual(readCart(storage),[{variantId:1,quantity:3}]);
 assert.deepEqual(readCart({getItem(){throw new Error('blocked');}}),[]);assert.doesNotThrow(()=>saveCart([],{setItem(){throw new Error('blocked');}}));
});
test('quote client sends only IDs, quantities and delivery selections to real Hono pricing', async t => {
 let body; t.mock.method(globalThis,'fetch',(url, options)=>{body=JSON.parse(options.body);return app.request(String(url),options,{DB:fixture.db});});
 const result=await requestQuote([item(1,'S',1)],'Thành phố Hà Nội','Phường Hoàn Kiếm','STANDARD');
 assert.deepEqual(body.items,[{variant_id:1,quantity:1}]);assert.equal(body.price,undefined);assert.equal(result.grand_total,470000);assert.equal(result.delivery_fee,20000);
});
test('API wrapper preserves error codes and rejects malformed responses/network errors', async t => {
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({error:{code:'NO_DELIVERY_ZONE',message:'Demo',details:[]}}),{status:422}));
 await assert.rejects(()=>apiRequest('/test'),e=>e instanceof ApiError&&e.code==='NO_DELIVERY_ZONE'&&e.status===422);
 t.mock.method(globalThis,'fetch',async()=>new Response('<html>error</html>',{status:500}));await assert.rejects(()=>apiRequest('/test'),e=>e.code==='BAD_RESPONSE');
 t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('offline');});await assert.rejects(()=>apiRequest('/test'),e=>e.code==='NETWORK');
});
test('VND remains VND when switching English/Vietnamese and has no decimal prices', () => {
 assert.equal(formatVND(450000,'vi').replace(/\s/g,' '),'450.000 ₫');assert.match(formatVND(450000,'en'),/450,000/);assert.match(formatVND(450000,'en'),/₫/);
});


test('product-detail client reads the live slug endpoint, gallery and variants; missing products stay 404', async t => {
 t.mock.method(globalThis, 'fetch', (url, options) => app.request(String(url), options, { DB: fixture.db }));
 const product = await loadProductDetail('blush-peony-bouquet');
 assert.equal(product.id, 1); assert.equal(product.images.length, 1);
 assert.deepEqual(product.variants.map(variant => variant.size_code), ['S', 'M', 'L']);
 assert.equal(product.variants.find(variant => variant.size_code === 'M').price, 650000);
 await assert.rejects(() => loadProductDetail('does-not-exist'), error => error instanceof ApiError && error.status === 404 && error.code === 'NOT_FOUND');
});
