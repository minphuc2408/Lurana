import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryWardOptions, normalizeAddressSearch } from '../src/features/cart/delivery-address.ts';

test('checkout exposes only wards returned by active delivery options, without a static city fallback',()=>{
 const options={provinces:[{province_name:'Thành phố Hà Nội',wards:[{ward_name:'Hoàn Kiếm',fee:20000}]}]};
 assert.deepEqual(deliveryWardOptions('Thành phố Hà Nội',options),[{value:'Hoàn Kiếm',label:'Hoàn Kiếm'}]);
 assert.deepEqual(deliveryWardOptions('Thành phố Hồ Chí Minh',options),[]);
 assert.deepEqual(deliveryWardOptions('Thành phố Hà Nội',null),[]);
});
test('accent-insensitive location search handles Vietnamese d',()=>{assert.equal(normalizeAddressSearch('  Đống Đa  '),'dong da');});
