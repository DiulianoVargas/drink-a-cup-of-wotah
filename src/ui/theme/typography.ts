import type { TextStyle } from 'react-native';

// Font keys as registered by @expo-google-fonts (loaded in src/app/_layout.tsx).
export const fonts = {
  fredokaMedium: 'Fredoka_500Medium',
  fredokaSemiBold: 'Fredoka_600SemiBold',
  nunitoRegular: 'Nunito_400Regular',
  nunitoBold: 'Nunito_700Bold',
  nunitoExtraBold: 'Nunito_800ExtraBold',
};

/** Dynamic Type up to the large (non-accessibility) sizes (Constitution VI). */
export const MAX_FONT_SCALE = 1.35;

export const typography = {
  counter: { fontFamily: fonts.fredokaSemiBold, fontSize: 50, fontVariant: ['tabular-nums'] },
  counterUnit: { fontFamily: fonts.fredokaMedium, fontSize: 27 },
  title: { fontFamily: fonts.fredokaMedium, fontSize: 28 },
  heading: { fontFamily: fonts.fredokaMedium, fontSize: 24 },
  body: { fontFamily: fonts.nunitoRegular, fontSize: 17 },
  button: { fontFamily: fonts.nunitoExtraBold, fontSize: 15 },
  caption: { fontFamily: fonts.nunitoBold, fontSize: 13 },
} satisfies Record<string, TextStyle>;
