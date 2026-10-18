import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { themes, themeTokens, themeSwatches, normalizeTheme, readTheme, saveTheme, themeStorageKey } from '../src/shared/theme/themes.ts';

function contrast(a, b) {
  const luminance = hex => {
    const [r,g,b] = hex.slice(1).match(/../g).map(channel => parseInt(channel,16)/255).map(channel => channel<=0.04045 ? channel/12.92 : ((channel+0.055)/1.055)**2.4);
    return r*0.2126+g*0.7152+b*0.0722;
  };
  const values = [luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (values[0]+0.05)/(values[1]+0.05);
}
test('twenty-one unique light themes use the approved reference Original palette and remove all overrides on return', () => {
  assert.equal(themes.length,21);
  assert.equal(new Set(themes.map(theme=>theme.id)).size,21);
  const original = themes[0];
  assert.equal(original.id,'original');
  assert.deepEqual([original.background,original.secondary,original.softSurface,original.accent,original.foreground],['#F8FBFA','#F1F7F5','#EDF4F6','#527E75','#344B49']);
  const css = readFileSync(new URL('../src/styles/brand.css',import.meta.url),'utf8');
  for(const [name,token] of Object.entries({background:'cream',secondary:'surface',softSurface:'blush',accent:'rose',foreground:'ink'})) {
    assert.equal(original[name],css.match(new RegExp(`--lunara-${token}:\\s*(#[\\dA-Fa-f]{6});`))[1]);
  }
  assert.deepEqual(themeTokens(original),{});
  for(const theme of themes) {
    for(const key of ['background','secondary','softSurface','accent','foreground']) assert.match(theme[key],/^#[0-9A-F]{6}$/);
    assert.notEqual(theme.background,'#FFFFFF');
    assert.ok(contrast(theme.foreground,theme.background)>=4.5,theme.id);
  }
});
test('all sixteen existing palettes and semantic colors retain their pre-extension snapshot', () => {
  const snapshot = themes.slice(0,16).map(theme=>({theme,tokens:themeTokens(theme)}));
  assert.equal(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),'c324ebe23eb0fa2e84577ea77472b3e2eae387a5ac736c014220009b82b6fb31');
  for(const theme of themes.slice(0,16)) assert.deepEqual(themeSwatches(theme),[theme.background,theme.secondary,theme.softSurface,theme.accent,theme.foreground]);
});
test('creative themes preserve all six approved colors and supply readable secondary and campaign roles', () => {
  const approved = {
    'wildflower-pop': ['#FBFAF6','#FFF3ED','#B94E66','#7DB9C4','#D4D877','#383943'],
    'cobalt-citrus': ['#FAFAF7','#EEF0FF','#3D57AB','#F4B65B','#A8CFA0','#293250'],
    'orchid-picnic': ['#FCFAF9','#F2EBF8','#954F9D','#E47558','#D8DD8B','#4A3A4F'],
    'ocean-confetti': ['#F8FBFA','#E9F5F3','#147A81','#F18EAD','#F3CF70','#27464B'],
    'folk-bloom': ['#FBF9F3','#F3E6D7','#A64740','#8EA7D2','#96B06A','#4B3736'],
  };
  assert.deepEqual(themes.slice(16).map(theme=>theme.id),Object.keys(approved));
  for(const theme of themes.slice(16)) {
    assert.deepEqual(themeSwatches(theme),approved[theme.id]);
    const tokens=themeTokens(theme);
    assert.equal(tokens['--lunara-accent-secondary'],approved[theme.id][3]);
    assert.equal(tokens['--lunara-accent-tertiary'],approved[theme.id][4]);
    assert.equal(tokens['--lunara-campaign-surface'],approved[theme.id][4]);
    assert.ok(contrast(tokens['--lunara-campaign-foreground'],tokens['--lunara-campaign-surface'])>=4.5,theme.id+' campaign');
    for(const surface of [theme.background,theme.secondary,theme.softSurface,'#FFFFFF']) assert.ok(contrast(tokens['--lunara-accent-secondary-strong'],surface)>=4.5,theme.id+' secondary text/icon');
  }
});
test('every new theme supplies readable text/CTA/focus/control tokens on its actual light surfaces', () => {
  for(const theme of themes.slice(1)) {
    const tokens=themeTokens(theme);
    assert.equal(tokens['--lunara-rose'],theme.accent,'Preserve base accent');
    assert.equal(tokens['--lunara-footer-background'],theme.secondary,'New footers stay light');
    assert.equal(tokens['--lunara-section-secondary'],theme.secondary,'Journey follows the active secondary color');
    assert.equal(tokens['--lunara-card-surface'],'#FFFFFF','Reference card surface stays independent of pastel sections');
    assert.notEqual(tokens['--lunara-card-surface'],tokens['--lunara-section-secondary'],'Story/navbar differ from Journey in every theme');
    for(const surface of [theme.background,theme.secondary,theme.softSurface,'#FFFFFF']) {
      for(const token of ['--lunara-rose-strong','--lunara-body','--lunara-ink','--lunara-footer-foreground']) assert.ok(contrast(tokens[token],surface)>=4.5,`${theme.id} ${token} / ${surface}`);
      assert.ok(contrast(tokens['--lunara-focus-ring'],surface)>=3,theme.id+' focus');
      assert.ok(contrast(tokens['--lunara-control-border'],surface)>=3,theme.id+' control');
    }
    assert.ok(contrast('#FFFFFF',tokens['--lunara-rose-strong'])>=4.5,theme.id+' CTA');
    assert.ok(contrast('#FFFFFF',tokens['--lunara-primary-hover'])>=4.5,theme.id+' hover');
    assert.ok(!Object.keys(tokens).some(key=>/success|warning|danger|info|sidebar|admin-background/.test(key)),'Status/admin-specific palette stays independent');
  }
});
test('preferences accept only exact registered IDs, recover from invalid/blocked storage and preserve other keys', () => {
  for(const invalid of [undefined,null,'','dark','Sage Green','sage-green ','__proto__',{},1]) assert.equal(normalizeTheme(invalid),'original');
  assert.equal(readTheme(),'original');
  assert.equal(readTheme({getItem(){throw new Error('blocked');}}),'original');
  const values=new Map([['lunara_language','vi'],['lunara.cart.v1','untouched']]);
  const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  for(const theme of themes) {saveTheme(theme.id,storage);assert.equal(readTheme(storage),theme.id);}
  assert.equal(values.get(themeStorageKey),'folk-bloom');
  assert.equal(values.get('lunara_language'),'vi');assert.equal(values.get('lunara.cart.v1'),'untouched');
  assert.doesNotThrow(()=>saveTheme('sea-glass',{setItem(){throw new Error('quota');}}));
});
