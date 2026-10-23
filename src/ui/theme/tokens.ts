// Source of truth: design/Wotah Sistema.html (contracts/design-tokens.md).

export const lightColors = {
  bg: '#F3F9FB',
  surface: '#FFFFFF',
  surface2: '#E6F4F8',
  line: '#DCEBF0',
  ink: '#2B4656',
  ink2: '#567282',
  water: '#9FD8EA',
  waveBack: '#C4EAF4',
  glass: '#FFFFFF',
  plusButton: '#86CDE3',
  waterAccent: '#CDEEF6',
  mint: '#BEEBD8',
  peach: '#FFD0BE',
  pink: '#F7C6D6',
  // Extra component tokens from design/Wotah Telas.html (Home).
  lineStrong: '#B9D3DC',
  onWater: '#1F3E4D',
  mintTint: '#E3F6EE',
  mintInk: '#2C6652',
  peachTint: '#FFE8DF',
  peachInk: '#8A4A35',
  toastBg: '#2B4656',
  toastInk: '#F3F9FB',
  toastAccent: '#CDEEF6',
  scrim: 'rgba(43,70,86,0.22)',
  // Opening screen, design/Wotah Splash.html (contracts/splash.md).
  splashTop: '#E3F4F9',
  splashBottom: '#FDEDE6',
};

export type ColorTokens = typeof lightColors;

export const darkColors: ColorTokens = {
  bg: '#121D25',
  surface: '#1B2A34',
  surface2: '#223540',
  line: '#2A3F4A',
  ink: '#E5F0F4',
  ink2: '#9DB4BF',
  water: '#7FBFD4',
  waveBack: '#A6D3E0',
  glass: '#D3E6EC',
  plusButton: '#8CCBDE',
  waterAccent: '#2F5868',
  mint: '#8ECDB6',
  peach: '#E9B3A0',
  pink: '#E3AFC0',
  lineStrong: '#46616F',
  onWater: '#10283A',
  mintTint: '#1F3A33',
  mintInk: '#BEEBD8',
  peachTint: '#3A2B27',
  peachInk: '#F5CDBE',
  toastBg: '#E5F0F4',
  toastInk: '#14232C',
  toastAccent: '#2B6E86',
  scrim: 'rgba(0,0,0,0.45)',
  // Not in the design file; proposed in research R15, confirmed on device (T114).
  splashTop: '#172631',
  splashBottom: '#241F23',
};

/** Opacity of the `water` glow behind the splash mascot (kept out of ColorTokens: colors are strings). */
export const splashGlowOpacity = { light: 0.45, dark: 0.25 };

/** Fixed character colors: identical in both themes. */
export const mascotColors = {
  outline: '#2B4656',
  cap: '#FFC9B6',
  capStripes: '#E9A08A',
  cheeks: '#F6A9BF',
  tongue: '#F4A0B4',
  glow: '#FFE2CC',
  dropEyesOnBlack: '#12303D',
  white: '#FFFFFF',
  confettiPink: '#F7C6D6',
  confettiMint: '#BEEBD8',
  confettiPeach: '#FFD0BE',
  confettiWater: '#9FD8EA',
  waterLight: '#CDEEF6',
};

export const radii = {
  cardLarge: 36,
  card: 24,
  pill: 22,
};

export const shadow = {
  shadowColor: '#2B4656',
  shadowOpacity: 0.4,
  shadowRadius: 15,
  shadowOffset: { width: 0, height: 16 },
};

/** Minimum touch target (Constitution VI). */
export const MIN_TOUCH = 44;
