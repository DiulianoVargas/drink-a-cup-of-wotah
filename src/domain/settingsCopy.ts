// Onboarding and Settings copy (design/Wotah Telas.html). PT-BR.
import { GLASS_ML } from './constants';
import { formatLiters } from './format';
import { awakeMinutes, estimateIntervalMinutes } from './reminders';
import type { Profile } from './types';

type Routine = Pick<Profile, 'wakeMinutes' | 'sleepMinutes' | 'dailyGoalMl'>;

const pad = (n: number) => String(n).padStart(2, '0');

/** "08:00" for the time pickers. */
export const formatTimeOfDay = (minutes: number) =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** "8h" / "22h30" for sentences. */
const clock = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${pad(m)}`;
};

/** "~1h45" / "~2h" / "~30 min". */
const approxInterval = (minutes: number) => {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `~${h}h` : `~${h}h${pad(m)}`;
};

export const goalSuggestionText = (weightKg: number, suggestedMl: number) =>
  `Pra ${weightKg} kg, a gente sugere ${formatLiters(suggestedMl)} L por dia. Pode ajustar do seu jeito.`;

export const glassesText = (goalMl: number) => `${goalMl / GLASS_ML} copos de 250 ml`;

/** "14 horas acordado · um lembrete a cada ~1h45". */
export function awakeHint(routine: Routine): string {
  const awake = awakeMinutes(routine);
  const hours = awake % 60 === 0 ? `${awake / 60} horas` : clock(awake);
  return `${hours} acordado · um lembrete a cada ${approxInterval(estimateIntervalMinutes(routine))}`;
}

export function remindersDescription(routine: Routine): string {
  return `Um lembrete a cada ${approxInterval(estimateIntervalMinutes(routine))}, das ${clock(
    routine.wakeMinutes,
  )} às ${clock(routine.sleepMinutes)}. Quando você bate a meta, eu paro até amanhã.`;
}

export const suggestGoalCardText = (weightKg: number, suggestedMl: number) =>
  `Com ${weightKg} kg, a sugestão é ${formatLiters(suggestedMl)} L por dia. Quer atualizar sua meta?`;
