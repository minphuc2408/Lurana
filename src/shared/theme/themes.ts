/** White first, followed by the owner's exact Monochrome gray steps. */
export const monochromeScale = {
  0: '#FFFFFF',
  50: '#F2F2F2', 100: '#DBDBDB', 200: '#C4C4C4', 300: '#ADADAD',
  400: '#969696', 500: '#808080', 600: '#696969', 700: '#525252',
  800: '#3B3B3B', 900: '#1B1B1B', 950: '#0D0D0D',
} as const;

/** Owner-approved local pink accents for the default Monochrome storefront. */
export const monochromePinkScale = {
  25: '#FFF5F8',
  50: '#FBEAF0', 100: '#F4C3D5', 200: '#EC9CBA', 300: '#E5769F', 400: '#DE4F83',
} as const;

/** Stable IDs preserve saved choices; the Green Mist palette mirrors brand.css. */
export const themes = [
  { id: 'original', name: 'Green Mist', background: '#F8FBFA', secondary: '#F1F7F5', softSurface: '#EDF4F6', accent: '#527E75', foreground: '#344B49' },
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
  { id: 'wildflower-pop', name: 'Wildflower Pop', background: '#FBFAF6', secondary: '#FFF3ED', softSurface: mix('#7DB9C4', '#FBFAF6', 0.88), accent: '#B94E66', secondaryAccent: '#7DB9C4', tertiaryAccent: '#D4D877', foreground: '#383943' },
  { id: 'cobalt-citrus', name: 'Cobalt Citrus', background: '#FAFAF7', secondary: '#EEF0FF', softSurface: mix('#F4B65B', '#FAFAF7', 0.88), accent: '#3D57AB', secondaryAccent: '#F4B65B', tertiaryAccent: '#A8CFA0', foreground: '#293250' },
  { id: 'orchid-picnic', name: 'Orchid Picnic', background: '#FCFAF9', secondary: '#F2EBF8', softSurface: mix('#E47558', '#FCFAF9', 0.88), accent: '#954F9D', secondaryAccent: '#E47558', tertiaryAccent: '#D8DD8B', foreground: '#4A3A4F' },
  { id: 'ocean-confetti', name: 'Ocean Confetti', background: '#F8FBFA', secondary: '#E9F5F3', softSurface: mix('#F18EAD', '#F8FBFA', 0.88), accent: '#147A81', secondaryAccent: '#F18EAD', tertiaryAccent: '#F3CF70', foreground: '#27464B' },
  { id: 'folk-bloom', name: 'Folk Bloom', background: '#FBF9F3', secondary: '#F3E6D7', softSurface: mix('#8EA7D2', '#FBF9F3', 0.88), accent: '#A64740', secondaryAccent: '#8EA7D2', tertiaryAccent: '#96B06A', foreground: '#4B3736' },
  { id: 'monochrome', name: 'Original', background: monochromeScale[50], secondary: monochromeScale[100], softSurface: monochromeScale[200], accent: monochromeScale[900], foreground: monochromeScale[900] },
] as const;
export type ThemeId = typeof themes[number]['id'];
export type Theme = typeof themes[number];
export const themeStorageKey = 'lunara.theme.v1';
export const defaultThemeId: ThemeId = 'monochrome';
export const themeDefaultVersionKey = 'lunara.theme.default.v1';
/** Legacy previews keep five swatches; creative palettes show all six approved colors. */
export function themeSwatches(theme: Theme): string[] {
  return 'secondaryAccent' in theme
    ? [theme.background, theme.secondary, theme.accent, theme.secondaryAccent, theme.tertiaryAccent, theme.foreground]
    : [theme.background, theme.secondary, theme.softSurface, theme.accent, theme.foreground];
}
export function normalizeTheme(value: unknown): ThemeId {
  return themes.find(theme => theme.id === value)?.id ?? defaultThemeId;
}
export function readTheme(storage?: Pick<Storage, 'getItem'>): ThemeId {
  try { return normalizeTheme(storage?.getItem(themeStorageKey)); } catch { return defaultThemeId; }
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
  // Green Mist retains the legacy "original" ID and its CSS fallback palette.
  if (theme.id === 'original') return {};
  // Monochrome uses the owner's exact steps instead of interpolating new grays.
  if (theme.id === 'monochrome') {
    const gray = monochromeScale;
    const pink = monochromePinkScale;
    const white = gray[0];
    // Only secondary backgrounds that shared the footer's gray 100 move to gray 50.
    const secondarySurface = gray[50];
    return {
      ...Object.fromEntries(Object.entries(gray).map(([step, color]) => [`--color-${step}`, color])),
      ...Object.fromEntries(Object.entries(pink).map(([step, color]) => [`--lunara-pink-${step}`, color])),
      '--lunara-white': white,
      '--lunara-header-background': white,
      '--lunara-page-background': 'var(--lunara-header-background)',
      '--lunara-filter-selected': pink[400],
      '--lunara-shop-intro': pink[25],
      '--lunara-featured-background': pink[25], '--lunara-story-background': pink[25],
      '--lunara-floating-cart-background': pink[50], '--lunara-floating-cart-foreground': gray[900],
      '--lunara-header-count-background': pink[400], '--lunara-header-count-foreground': white,
      '--lunara-preference-surface': white, '--lunara-preference-border': gray[100],
      '--lunara-preference-active': pink[400], '--lunara-preference-active-foreground': white,
      '--lunara-preference-hover': pink[50],
      '--lunara-detail-surface': white,
      '--lunara-detail-accent': pink[400], '--lunara-detail-selected-surface': pink[50],
      '--lunara-detail-selected-border': pink[400], '--lunara-detail-thumbnail-hover': pink[100],
      '--lunara-detail-thumbnail-hover-border': pink[200],
      '--lunara-detail-buy': pink[400], '--lunara-detail-buy-hover': pink[300],
      '--lunara-detail-buy-foreground': gray[900],
      '--lunara-pagination-selected': pink[50], '--lunara-pagination-selected-border': pink[400],
      '--lunara-pagination-hover': pink[50],
      '--lunara-cream': gray[50], '--lunara-surface': secondarySurface, '--lunara-blush': gray[200],
      '--lunara-card-surface': gray[50], '--lunara-section-secondary': secondarySurface,
      '--lunara-rose': gray[900], '--lunara-rose-strong': gray[900], '--lunara-rose-light': gray[400],
      '--lunara-ink': gray[900], '--lunara-body': gray[700], '--lunara-muted': gray[700],
      '--lunara-border': gray[200], '--lunara-primary-hover': gray[950], '--lunara-focus-ring': gray[800],
      '--lunara-control-border': gray[600], '--lunara-control-surface': gray[50],
      '--lunara-accent-secondary': gray[400], '--lunara-accent-secondary-soft': secondarySurface,
      '--lunara-accent-secondary-strong': gray[900],
      '--lunara-accent-tertiary': gray[300], '--lunara-accent-tertiary-soft': secondarySurface,
      '--lunara-accent-tertiary-strong': gray[900],
      '--lunara-campaign-surface': 'transparent', '--lunara-campaign-foreground': gray[900],
      '--lunara-secondary-link': gray[900], '--lunara-editorial-label': pink[400],
      '--lunara-featured-rule': gray[200], '--lunara-story-rule': gray[200],
      '--lunara-journey-surface': white, '--lunara-journey-icon-surface': pink[50],
      '--lunara-journey-icon-foreground': pink[400], '--lunara-journey-step-foreground': pink[400],
      '--lunara-product-favorite': pink[400], '--lunara-product-favorite-hover': pink[400],
      '--lunara-product-favorite-active': pink[400],
      '--lunara-product-action-icon': white,
      '--lunara-product-action-surface': pink[400], '--lunara-product-action-foreground': gray[900],
      '--lunara-product-action-border': pink[400], '--lunara-product-action-hover': pink[400],
      '--lunara-product-action-hover-foreground': gray[900],
      '--lunara-product-action-added': pink[400], '--lunara-product-action-added-foreground': gray[900],
      '--lunara-product-action-added-border': pink[400], '--lunara-product-action-added-hover': pink[400],
      '--lunara-utility-background': secondarySurface, '--lunara-utility-foreground': gray[700],
      '--lunara-utility-ink': gray[900], '--lunara-utility-focus': gray[800], '--lunara-utility-border': gray[200],
      '--lunara-editorial-ink': gray[900], '--lunara-editorial-body': gray[700],
      '--lunara-editorial-border': gray[200], '--lunara-editorial-blush': gray[200], '--lunara-editorial-surface': secondarySurface,
      '--lunara-footer-background': pink[25], '--lunara-footer-foreground': gray[900],
      '--lunara-footer-muted': gray[700], '--lunara-footer-copyright': gray[700],
      '--lunara-footer-link': gray[700], '--lunara-footer-heading': gray[900],
      '--lunara-footer-border': gray[200], '--lunara-footer-hover': gray[950],
      '--lunara-footer-focus': gray[800],
      '--lunara-sidebar': white, '--lunara-admin-background': gray[50],
      '--lunara-admin-panel': white, '--lunara-admin-soft-surface': gray[50],
      '--lunara-admin-border': gray[100],
      '--lunara-admin-primary': pink[400], '--lunara-admin-primary-hover': pink[300],
      '--lunara-admin-primary-foreground': gray[900],
      '--lunara-admin-sidebar-foreground': gray[900], '--lunara-admin-sidebar-muted': gray[700],
      '--lunara-admin-sidebar-logo': gray[900], '--lunara-admin-sidebar-border': gray[100],
      '--lunara-admin-sidebar-hover': gray[50],
      '--lunara-admin-active-surface': pink[50], '--lunara-admin-active-foreground': gray[900],
      '--lunara-admin-active-border': pink[400], '--lunara-admin-header-border': gray[100],
      '--lunara-header-ink': gray[900], '--lunara-header-body': gray[900],
      '--lunara-nav-ink': gray[900], '--lunara-nav-active': pink[400],
      '--lunara-nav-hover': pink[400], '--lunara-text-hover': gray[950],
      '--lunara-icon-foreground': gray[900], '--lunara-icon-hover': gray[950],
      '--lunara-icon-button-background': gray[50], '--lunara-icon-button-hover': secondarySurface,
      '--lunara-search-button-background': pink[400], '--lunara-search-button-foreground': gray[900],
      '--lunara-search-button-hover': pink[400], '--lunara-search-icon-hover': gray[950],
      '--lunara-services-background': white,
      '--lunara-service-icon-background': pink[50], '--lunara-service-icon-hover': pink[100],
      '--lunara-service-icon-foreground': pink[400], '--lunara-service-icon-foreground-hover': pink[400],
      '--lunara-lookup-panel': white,
      '--lunara-lookup-button': gray[200], '--lunara-lookup-button-hover': gray[300],
      '--lunara-lookup-button-foreground': gray[900], '--lunara-lookup-button-foreground-hover': gray[950],
      '--lunara-hero-backdrop': gray[950], '--lunara-hero-foreground': white,
      '--lunara-hero-button-background': white, '--lunara-hero-button-foreground': gray[900],
      '--lunara-hero-button-hover': gray[50],
      '--lunara-hero-overlay': `color-mix(in srgb, ${gray[950]} 65%, transparent)`,
    };
  }
  const { background, secondary, softSurface, accent, foreground } = theme;
  const cardSurface = '#FFFFFF';
  const creative = 'secondaryAccent' in theme ? theme : null;
  const secondarySoft = creative ? mix(creative.secondaryAccent, background, 0.7) : softSurface;
  const tertiarySoft = creative ? mix(creative.tertiaryAccent, background, 0.76) : secondary;
  const surfaces = [background, secondary, softSurface, cardSurface, ...(creative ? [secondarySoft, tertiarySoft] : [])];
  const primary = accessibleColor(accent, foreground, surfaces, 4.6);
  const body = accessibleColor(mix(foreground, background, 0.2), foreground, surfaces, 4.6);
  const border = mix(accent, background, 0.72);
  const secondaryStrong = creative ? accessibleColor(creative.secondaryAccent, '#000000', surfaces, 4.6) : primary;
  const tertiaryStrong = creative ? accessibleColor(creative.tertiaryAccent, '#000000', [...surfaces, creative.tertiaryAccent], 4.6) : primary;
  const adminActiveSurface = mix(accent, '#1A0D12', 0.82);
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
    // Omit these overrides for legacy palettes so their CSS fallbacks keep exactly the same colors.
    ...(creative ? {
      '--lunara-accent-secondary': creative.secondaryAccent,
      '--lunara-accent-secondary-soft': secondarySoft,
      '--lunara-accent-secondary-strong': secondaryStrong,
      '--lunara-accent-tertiary': creative.tertiaryAccent,
      '--lunara-accent-tertiary-soft': tertiarySoft,
      '--lunara-accent-tertiary-strong': tertiaryStrong,
      // Paper surfaces and primary interactions; extra hues stay in the logo and small line art.
      '--lunara-campaign-surface': 'transparent',
      '--lunara-campaign-foreground': primary,
      '--lunara-utility-background': secondary,
      '--lunara-utility-foreground': body,
      '--lunara-utility-ink': foreground,
      '--lunara-utility-focus': primary,
      '--lunara-utility-border': border,
      '--lunara-secondary-link': primary,
      '--lunara-editorial-label': primary,
      '--lunara-featured-rule': border,
      '--lunara-story-rule': border,
      '--lunara-journey-surface': secondary,
      '--lunara-journey-icon-surface': 'transparent',
      '--lunara-journey-icon-foreground': secondaryStrong,
      '--lunara-product-action-surface': cardSurface,
      '--lunara-product-action-foreground': primary,
      '--lunara-product-action-border': border,
      '--lunara-product-action-hover': primary,
      '--lunara-footer-link': body,
      '--lunara-footer-heading': foreground,
      '--lunara-footer-hover': primary,
      '--lunara-footer-border': border,
      '--lunara-admin-active-surface': adminActiveSurface,
      '--lunara-admin-active-foreground': accessibleColor(accent, '#FFFFFF', ['#1A0D12', adminActiveSurface], 4.6),
      '--lunara-admin-active-border': accessibleColor(accent, '#FFFFFF', ['#1A0D12'], 3.1),
      '--lunara-admin-header-border': border,
    } : {}),
  };
}
