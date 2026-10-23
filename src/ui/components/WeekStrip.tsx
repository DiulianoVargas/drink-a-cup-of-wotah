import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { WeekDay } from '@/domain/history';
import { fonts, MAX_FONT_SCALE } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

const STATUS_PT = { full: 'meta batida', partial: 'parcial', empty: 'sem registro' } as const;

/** "Últimos 7 dias": full / partial / empty circles (FR-028; design/Wotah Telas.html › Home). */
export function WeekStrip({ days }: { days: WeekDay[] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.title, { color: colors.ink2 }]}>
        Últimos 7 dias
      </Text>
      <View style={styles.row}>
        {days.map((d) => {
          const today = d.label === 'hoje';
          return (
            <View
              key={d.dayKey}
              style={styles.day}
              accessible
              accessibilityLabel={`${d.label}: ${STATUS_PT[d.status]}`}
            >
              {d.status === 'full' && (
                <View style={[styles.dot, { backgroundColor: colors.water }]}>
                  <Svg width={16} height={16} viewBox="0 0 24 24">
                    <Path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      stroke={colors.onWater}
                      strokeWidth={3}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              )}
              {d.status === 'partial' && (
                <View style={[styles.dot, styles.ring, { borderColor: colors.water }]}>
                  <View style={[styles.partialFill, { backgroundColor: colors.water }]} />
                </View>
              )}
              {d.status === 'empty' && (
                <View
                  style={[
                    styles.dot,
                    styles.ring,
                    styles.dashed,
                    { borderColor: colors.lineStrong },
                  ]}
                />
              )}
              <Text
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[
                  styles.label,
                  {
                    color: today ? colors.ink : colors.ink2,
                    fontFamily: today ? fonts.nunitoExtraBold : fonts.nunitoBold,
                  },
                ]}
              >
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', borderRadius: 26, padding: 12, gap: 8 },
  title: { fontFamily: fonts.nunitoExtraBold, fontSize: 12, paddingLeft: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { flex: 1, alignItems: 'center', gap: 5 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: { borderWidth: 2.5 },
  dashed: { borderStyle: 'dashed' },
  partialFill: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  label: { fontSize: 12 },
});
