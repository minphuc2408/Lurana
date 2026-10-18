import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { colorClass } from '../src/shared/lib/color-classes.ts';

function luminance(hex) {
  const channels = hex.replace('#', '').match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + 0.05) / (values[1] + 0.05); }

test('essential text colors pass contrast on their actual brand backgrounds', () => {
  const css = fs.readFileSync(new URL('../src/styles/brand.css', import.meta.url), 'utf8');
  const root = css.match(/:root\s*\{([^}]+)\}/)?.[1];
  assert.ok(root, 'Base brand palette is defined at :root');
  const palette = Object.fromEntries([...root.matchAll(/--lunara-([\w-]+):\s*(#[\da-fA-F]{6});/g)].map(match => [match[1], match[2]]));
  const statusText = color => colorClass(color, 'color').match(/#[\da-fA-F]{6}/)?.[0];
  for (const [foreground, background] of [['#FFFFFF', palette['rose-strong']], [palette.body, palette.cream], [palette['rose-strong'], '#FFFFFF'], [palette['rose-light'], palette.sidebar], [statusText('#7A9E7E'), '#EDF7EF'], [statusText('#D4A020'), '#FDF8E8'], [statusText('#5B8DD9'), '#EDF3FC']]) {
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
  }
});
