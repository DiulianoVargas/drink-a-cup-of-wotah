import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { MAX_FONT_SCALE, typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type Props = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'mint';
  accessibilityHint?: string;
  style?: ViewStyle;
};

/** Rounded pill button ("Continuar", "Bebi 💧", "Atualizar pra 2,5 L"). Min 44 pt tall. */
export function Pill({ label, onPress, tone = 'primary', accessibilityHint, style }: Props) {
  const { colors } = useTheme();
  const palette = {
    primary: { bg: colors.plusButton, fg: colors.onWater, border: colors.plusButton },
    secondary: { bg: 'transparent', fg: colors.ink, border: colors.lineStrong },
    mint: { bg: colors.mint, fg: colors.mintInk, border: colors.mint },
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[typography.button, { color: palette.fg, fontSize: 17 }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 54,
    borderRadius: 27,
    borderWidth: 2,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
