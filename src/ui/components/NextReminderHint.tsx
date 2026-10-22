import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { nextReminderText } from '@/domain/homeCopy';
import { fonts, MAX_FONT_SCALE } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type Props = { nextReminderAt: number | null; goalMet: boolean; now: Date };

/** "Próximo lembrete às 14h30" / "Lembretes de hoje encerrados. Até amanhã!" */
export function NextReminderHint({ nextReminderAt, goalMet, now }: Props) {
  const { colors } = useTheme();
  const text = nextReminderText(nextReminderAt, now, goalMet);
  if (!text) return null;
  return (
    <View style={styles.row}>
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={9} stroke={colors.ink2} strokeWidth={2} fill="none" />
        <Path
          d="M12 7v5l3 2"
          stroke={colors.ink2}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.text, { color: colors.ink2 }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontFamily: fonts.nunitoBold, fontSize: 14 },
});
