import { StyleSheet, Text, View } from 'react-native';
import { formatStreak } from '@/domain/format';
import { fonts, MAX_FONT_SCALE } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/** "🔥 5 dias" in a peach chip; hidden when there is no streak (FR-029). */
export function StreakBadge({ days }: { days: number }) {
  const { colors } = useTheme();
  const text = formatStreak(days);
  if (!text) return null;
  return (
    <View
      style={[styles.chip, { backgroundColor: colors.peachTint }]}
      accessible
      accessibilityLabel={`Sequência de ${days} ${days === 1 ? 'dia' : 'dias'} batendo a meta`}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[styles.text, { color: colors.peachInk }]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center' },
  text: { fontFamily: fonts.nunitoExtraBold, fontSize: 15 },
});
