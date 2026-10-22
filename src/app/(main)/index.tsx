import { StyleSheet, Text, View } from 'react-native';
import { formatProgress } from '@/domain/format';
import { useWotahStore } from '@/state/store';
import { typography } from '@/ui/theme/typography';
import { useTheme } from '@/ui/theme/useTheme';

/** Placeholder Home (T030); composed in US1 (T042). */
export default function Home() {
  const { colors } = useTheme();
  const today = useWotahStore((s) => s.today);
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Text style={[typography.counter, { color: colors.ink }]}>
        {today ? formatProgress(today.consumedMl, today.goalMl) : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
