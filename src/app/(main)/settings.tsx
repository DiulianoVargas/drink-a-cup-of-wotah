import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { suggestGoalMl } from '@/domain/goal';
import { formatTimeOfDay, glassesText, remindersDescription } from '@/domain/settingsCopy';
import type { Profile } from '@/domain/types';
import { useWotahStore } from '@/state/store';
import { Pill } from '@/ui/components/Pill';
import { Stepper } from '@/ui/components/Stepper';
import { SuggestGoalCard } from '@/ui/components/SuggestGoalCard';
import { WheelPicker } from '@/ui/components/WheelPicker';
import { HALF_HOURS, WEIGHTS } from '@/ui/pickerValues';
import { MAX_FONT_SCALE, typography } from '@/ui/theme/typography';
import { useTheme } from '@/ui/theme/useTheme';
import { getApp } from '@/usecases/container';

type Editing = null | 'weight' | 'wake' | 'sleep';

/** Ajustes (FR-011, FR-012): every change applies immediately and keeps today's total. */
export default function Settings() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useWotahStore((s) => s.profile);
  const [editing, setEditing] = useState<Editing>(null);
  /** FR-012: the new-goal offer appears only right after a weight change, until answered. */
  const [offerForWeight, setOfferForWeight] = useState<number | null>(null);
  if (!profile) return null;

  const update = (patch: Partial<Profile>) => {
    getApp().updateProfile(patch);
  };
  const suggested = suggestGoalMl(profile.weightKg);
  const showSuggestion = offerForWeight === profile.weightKg && suggested !== profile.dailyGoalMl;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.line }]}
        >
          <Text style={[typography.heading, { color: colors.ink }]}>‹</Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[typography.title, { color: colors.ink }]}
        >
          Ajustes
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Você">
          <Row label="Peso" value={`${profile.weightKg} kg`} onPress={() => setEditing('weight')} />
          {showSuggestion && (
            <SuggestGoalCard
              weightKg={profile.weightKg}
              suggestedMl={suggested}
              currentMl={profile.dailyGoalMl}
              onAccept={() => {
                setOfferForWeight(null);
                update({ dailyGoalMl: suggested });
              }}
              onKeep={() => setOfferForWeight(null)}
            />
          )}
        </Section>

        <Section title="Meta diária">
          <View style={styles.goal}>
            <Stepper
              size="compact"
              valueMl={profile.dailyGoalMl}
              onChange={(ml) => update({ dailyGoalMl: ml })}
            />
            <Text
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              style={[typography.caption, { color: colors.ink2 }]}
            >
              {glassesText(profile.dailyGoalMl)}
            </Text>
          </View>
        </Section>

        <Section title="Rotina">
          <Row
            label="Acordo"
            value={formatTimeOfDay(profile.wakeMinutes)}
            onPress={() => setEditing('wake')}
          />
          <Row
            label="Durmo"
            value={formatTimeOfDay(profile.sleepMinutes)}
            onPress={() => setEditing('sleep')}
          />
        </Section>

        <Section title="Lembretes">
          <View style={styles.row}>
            <Text
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              style={[typography.body, { color: colors.ink, flex: 1 }]}
            >
              Lembretes de água
            </Text>
            <Switch
              accessibilityLabel="Lembretes de água"
              value={profile.remindersEnabled}
              onValueChange={(on) => update({ remindersEnabled: on })}
              trackColor={{ true: colors.plusButton, false: colors.line }}
            />
          </View>
          <Text
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[typography.caption, { color: colors.ink2 }]}
          >
            {remindersDescription(profile)}
          </Text>
        </Section>
      </ScrollView>

      <Modal
        transparent
        visible={editing !== null}
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          onPress={() => setEditing(null)}
        />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {editing === 'weight' && (
            <WheelPicker
              values={WEIGHTS}
              value={profile.weightKg}
              onChange={(kg) => {
                setOfferForWeight(kg);
                update({ weightKg: kg });
              }}
              format={String}
              unit="kg"
              accessibilityLabel="Peso em quilos"
            />
          )}
          {editing === 'wake' && (
            <WheelPicker
              values={HALF_HOURS}
              value={profile.wakeMinutes}
              onChange={(m) => m !== profile.sleepMinutes && update({ wakeMinutes: m })}
              format={formatTimeOfDay}
              accessibilityLabel="Horário em que acordo"
            />
          )}
          {editing === 'sleep' && (
            <WheelPicker
              values={HALF_HOURS}
              value={profile.sleepMinutes}
              onChange={(m) => m !== profile.wakeMinutes && update({ sleepMinutes: m })}
              format={formatTimeOfDay}
              accessibilityLabel="Horário em que durmo"
            />
          )}
          <Pill label="Pronto" onPress={() => setEditing(null)} style={styles.done} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[typography.button, styles.sectionTitle, { color: colors.ink2 }]}
      >
        {title}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>{children}</View>
    </View>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint="Toque para alterar"
      onPress={onPress}
      style={styles.row}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[typography.body, { color: colors.ink, flex: 1 }]}
      >
        {label}
      </Text>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[typography.heading, { color: colors.ink, fontSize: 20 }]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    height: 56,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 20, gap: 20, paddingBottom: 48 },
  section: { gap: 8 },
  sectionTitle: { paddingLeft: 6, fontSize: 13 },
  card: { borderRadius: 24, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12 },
  goal: { alignItems: 'center', gap: 8 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  done: { alignSelf: 'stretch', marginHorizontal: 24 },
});
