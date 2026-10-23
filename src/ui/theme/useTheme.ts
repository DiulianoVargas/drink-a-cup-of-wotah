import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ColorTokens } from './tokens';

export type Theme = { dark: boolean; colors: ColorTokens };

/** Light/dark tokens following the system appearance (FR-033). */
export function useTheme(): Theme {
  const dark = useColorScheme() === 'dark';
  return { dark, colors: dark ? darkColors : lightColors };
}
