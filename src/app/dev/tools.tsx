import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { clearSpikeLog, scheduleSpikeNotification, spikeLog } from '@/dev/spikes';
import { dbInfo } from '@/services/db/client';
import { spikeActivity } from '@/widgets/SpikeActivity';
import { useTheme } from '@/ui/theme/useTheme';

/** Dev-only screen to run spikes S1–S4 on the device (quickstart › Spikes). */
export default function DevTools() {
  const { colors } = useTheme();
  const [log, setLog] = useState<string[]>(() => (__DEV__ ? spikeLog() : []));
  const [info, setInfo] = useState('');
  if (!__DEV__) return <Redirect href="/" />;

  const run = (label: string, fn: () => unknown) => async () => {
    try {
      const out = await fn();
      setInfo(`${label}: ${out === undefined ? 'ok' : JSON.stringify(out)}`);
    } catch (e) {
      setInfo(`${label}: ERROR ${String(e)}`);
    }
    setLog(spikeLog());
  };

  return (
    <ScrollView contentContainerStyle={styles.root} style={{ backgroundColor: colors.bg }}>
      <Button label="S1 · Notificação em 60 s (ação DRINK)" onPress={run('S1', scheduleSpikeNotification)} />
      <Button
        label="S2/S4 · Iniciar Live Activity de teste"
        onPress={run('S2', () => spikeActivity.start({ count: 0, pending: 0, seq: 0, imagePath: null }).getId())}
      />
      <Button
        label="S2 · Instâncias ativas"
        onPress={run('S2 instances', () => spikeActivity.getInstances().map((i) => i.getId()))}
      />
      <Button
        label="S2 · Encerrar atividades"
        onPress={run('S2 end', () => Promise.all(spikeActivity.getInstances().map((i) => i.end('immediate'))))}
      />
      <Button label="S3 · Caminho do banco" onPress={run('S3', dbInfo)} />
      <Button label="Atualizar log" onPress={run('log', () => undefined)} />
      <Button label="Limpar log" onPress={run('clear', clearSpikeLog)} />
      <Text selectable style={[styles.mono, { color: colors.ink }]}>{info}</Text>
      {log.map((line) => (
        <Text key={line} selectable style={[styles.mono, { color: colors.ink2 }]}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, { backgroundColor: colors.plusButton }]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, gap: 10 },
  button: { borderRadius: 22, paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
  buttonText: { fontWeight: '800', color: '#12303D' },
  mono: { fontFamily: 'Menlo', fontSize: 12 },
});
