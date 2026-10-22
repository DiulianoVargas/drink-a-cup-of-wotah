import { StyleSheet, Text } from 'react-native';
import { formatLiters } from '@/domain/format';
import { MAX_FONT_SCALE, typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/** "1,25 / 2 L": drunk amount in Fredoka 600 (tabular), goal smaller in ink2 (FR-004). */
export function ProgressCounter({ consumedMl, goalMl }: { consumedMl: number; goalMl: number }) {
  const { colors } = useTheme();
  return (
    <Text
      accessibilityLabel={`${formatLiters(consumedMl)} de ${formatLiters(goalMl)} litros`}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[typography.counter, styles.counter, { color: colors.ink }]}
      testID="progress-counter"
    >
      {formatLiters(consumedMl)}
      <Text style={[typography.counterUnit, { color: colors.ink2 }]}>
        {` / ${formatLiters(goalMl)} L`}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  counter: { textAlign: 'center' },
});
