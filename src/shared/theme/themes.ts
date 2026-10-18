/** Base palettes stay separate from accessible semantic colors. Original mirrors brand.css. */
export const themes = [
  { id: 'original', name: 'Original', background: '#F8FBFA', secondary: '#F1F7F5', softSurface: '#EDF4F6', accent: '#527E75', foreground: '#344B49' },
  { id: 'sage-green', name: 'Sage Green', background: '#FAFAF7', secondary: '#F2F5EF', softSurface: '#E5EBE0', accent: '#5B7164', foreground: '#37453D' },
  { id: 'champagne', name: 'Champagne', background: '#FAF9F6', secondary: '#F7F1E8', softSurface: '#EDE4D6', accent: '#786958', foreground: '#4F463E' },
  { id: 'powder-blue', name: 'Powder Blue', background: '#FAFBFC', secondary: '#F0F5F9', softSurface: '#E3ECF3', accent: '#5B7386', foreground: '#3B4E5C' },
  { id: 'lavender-mist', name: 'Lavender Mist', background: '#FAF9FC', secondary: '#F5F1FA', softSurface: '#EBE4F3', accent: '#786786', foreground: '#4E4557' },
  { id: 'peach-cream', name: 'Peach Cream', background: '#FCFAF7', secondary: '#FFF3EA', softSurface: '#F8E5D8', accent: '#956E60', foreground: '#594A44' },
  { id: 'butter-cream', name: 'Butter Cream', background: '#FCFBF6', secondary: '#FCF6DE', softSurface: '#F7EBC1', accent: '#776237', foreground: '#4A4232' },
  { id: 'mint-sorbet', name: 'Mint Sorbet', background: '#F8FCFA', secondary: '#F0F9F4', softSurface: '#DDF0E6', accent: '#4E786B', foreground: '#34564E' },
  { id: 'sea-glass', name: 'Sea Glass', background: '#F8FBFB', secondary: '#EBF6F5', softSurface: '#D5EAE7', accent: '#42766F', foreground: '#2E514F' },
  { id: 'pistachio-milk', name: 'Pistachio Milk', background: '#FBFCF8', secondary: '#F3F7E7', softSurface: '#E6EDCC', accent: '#6C7950', foreground: '#414C35' },
  { id: 'cloud-silver', name: 'Cloud Silver', background: '#FAFAFB', secondary: '#F2F4F5', softSurface: '#E6EAED', accent: '#5E707A', foreground: '#39474E' },
  { id: 'oat-taupe', name: 'Oat Taupe', background: '#FBF9F7', secondary: '#F4EEE9', softSurface: '#E8DDD6', accent: '#78665D', foreground: '#4C403C' },
  { id: 'dusty-mauve', name: 'Dusty Mauve', background: '#FCFAFB', secondary: '#F8F0F4', softSurface: '#EDDDE6', accent: '#866776', foreground: '#51414A' },
  { id: 'periwinkle-milk', name: 'Periwinkle Milk', background: '#FAFAFE', secondary: '#F1F2FC', softSurface: '#E1E5F7', accent: '#626C99', foreground: '#3E4565' },
  { id: 'coral-shell', name: 'Coral Shell', background: '#FDFAF9', secondary: '#FCF1EF', softSurface: '#F5DDD8', accent: '#936158', foreground: '#5E423D' },
  { id: 'linen-olive', name: 'Linen Olive', background: '#FBFAF6', secondary: '#F4F3E9', softSurface: '#E8E7D1', accent: '#6E7253', foreground: '#424637' },
] as const;
export type ThemeId = typeof themes[number]['id'];
export type Theme = typeof themes[number];
export const themeStorageKey = 'lunara.theme.v1';
export function normalizeTheme(value: unknown): ThemeId {
  return themes.find(theme => theme.id === value)?.id ?? 'original';
}
export function readTheme(storage?: Pick<Storage, 'getItem'>): ThemeId {
  try { return normalizeTheme(storage?.getItem(themeStorageKey)); } catch { return 'original'; }
}
export function saveTheme(theme: ThemeId, storage?: Pick<Storage, 'setItem'>) {
  try { storage?.setItem(themeStorageKey, theme); } catch { /* Preference remains usable in memory. */ }
}
function channels(hex: string) { return hex.slice(1).match(/../g)!.map(value => parseInt(value, 16)); }
function mix(a: string, b: string, weight: number) {
  const end = channels(b);
  return '#' + channels(a).map((value, index) => Math.round(value * (1 - weight) + end[index] * weight).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function luminance(hex: string) {
  const [r, g, b] = channels(hex).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
export function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
function accessibleColor(color: string, target: string, backgrounds: string[], ratio: number) {
  for (let step = 0; step <= 100; step++) {
    const candidate = mix(color, target, step / 100);
    if (backgrounds.every(background => contrast(candidate, background) >= ratio)) return candidate;
  }
  return target;
}
export function themeTokens(theme: Theme): Record<string, string> {
  // Removing overrides restores every original token, including the legacy component palette.
  if (theme.id === 'original') return {};
  const { background, secondary, softSurface, accent, foreground } = theme;
  const cardSurface = '#FFFFFF';
  const surfaces = [background, secondary, softSurface, cardSurface];
  const primary = accessibleColor(accent, foreground, surfaces, 4.6);
  const body = accessibleColor(mix(foreground, background, 0.2), foreground, surfaces, 4.6);
  const border = mix(accent, background, 0.72);
  return {
    '--lunara-cream': background, '--lunara-surface': secondary, '--lunara-blush': softSurface,
    '--lunara-card-surface': cardSurface, '--lunara-section-secondary': secondary, '--lunara-utility-background': softSurface,
    '--lunara-rose': accent, '--lunara-rose-strong': primary, '--lunara-rose-light': mix(accent, background, 0.45),
    '--lunara-ink': foreground, '--lunara-body': body, '--lunara-muted': body, '--lunara-border': border,
    '--lunara-primary-hover': mix(primary, foreground, 0.45), '--lunara-focus-ring': primary,
    '--lunara-control-border': accessibleColor(border, foreground, surfaces, 3.1), '--lunara-control-surface': secondary,
    '--lunara-editorial-ink': foreground, '--lunara-editorial-body': body, '--lunara-editorial-border': border,
    '--lunara-editorial-blush': softSurface, '--lunara-editorial-surface': secondary,
    '--lunara-footer-background': secondary, '--lunara-footer-foreground': foreground,
    '--lunara-footer-muted': body, '--lunara-footer-copyright': body,
    '--lunara-footer-border': border, '--lunara-footer-hover': primary,
  };
}
