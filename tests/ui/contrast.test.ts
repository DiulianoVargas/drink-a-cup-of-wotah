import { darkColors, lightColors, type ColorTokens } from '@/ui/theme/tokens';

// WCAG 2.x relative luminance and contrast ratio (Constitution VI: text contrast AA).
const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** [foreground, background, minimum ratio] — 4.5 for body text, 3 for large/bold UI text. */
const PAIRS: [keyof ColorTokens, keyof ColorTokens, number][] = [
  ['ink', 'bg', 4.5],
  ['ink', 'surface', 4.5],
  ['ink2', 'bg', 4.5],
  ['ink2', 'surface', 4.5],
  ['ink', 'surface2', 4.5],
  ['onWater', 'plusButton', 4.5],
  ['toastInk', 'toastBg', 4.5],
  ['mintInk', 'mintTint', 4.5],
  ['peachInk', 'peachTint', 4.5],
];

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
] as const)('%s theme contrast (WCAG AA)', (_, colors) => {
  it.each(PAIRS)('%s on %s ≥ %f', (fg, bg, min) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(min);
  });
});
