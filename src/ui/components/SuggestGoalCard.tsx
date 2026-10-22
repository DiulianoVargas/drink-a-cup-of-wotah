import { StyleSheet, Text, View } from 'react-native';
import { formatLiters } from '@/domain/format';
import { suggestGoalCardText } from '@/domain/settingsCopy';
import { MAX_FONT_SCALE, typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { Pill } from './Pill';

type Props = {
  weightKg: number;
  suggestedMl: number;
  currentMl: number;
  onAccept: () => void;
  onKeep: () => void;
};

/** FR-012: after a weight change, *offer* the new goal; never change it by itself. */
export function SuggestGoalCard({ weightKg, suggestedMl, currentMl, onAccept, onKeep }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.mintTint }]}
      accessibilityLiveRegion="polite"
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[typography.body, { color: colors.mintInk }]}
      >
        {suggestGoalCardText(weightKg, suggestedMl)}
      </Text>
      <View style={styles.actions}>
        <Pill
          tone="mint"
          label={`Atualizar pra ${formatLiters(suggestedMl)} L`}
          onPress={onAccept}
          style={styles.pill}
        />
        <Pill
          tone="secondary"
          label={`Manter ${formatLiters(currentMl)} L`}
          onPress={onKeep}
          style={styles.pill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 16, gap: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { minHeight: 44, flexGrow: 1 },
});
