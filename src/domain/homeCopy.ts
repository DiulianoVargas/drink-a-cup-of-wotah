// Home headline and subtitle per state (design/Wotah Telas.html › Home). PT-BR, never guilt-tripping.
import { GLASS_ML } from './constants';
import { toDayKey } from './day';
import { formatClock, formatLiters } from './format';
import { expressionFor } from './progress';
import type { MascotExpression } from './types';

const remainingGlasses = (consumedMl: number, goalMl: number) =>
  Math.max(0, Math.ceil((goalMl - consumedMl) / GLASS_ML));

/** "22h" / "23h30" from minutes since midnight. */
const clockFromMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

/** 1000 → "1.000" (pt-BR thousands separator, independent of the device locale). */
const groupThousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function homeCopy(
  consumedMl: number,
  goalMl: number,
  sleepMinutes: number,
): { message: string; sub: string } {
  const left = remainingGlasses(consumedMl, goalMl);
  if (consumedMl === 0) {
    return {
      message: 'Bom dia! Bora começar com um golinho?',
      sub: `${goalMl / GLASS_ML} copos de 250 ml até as ${clockFromMinutes(sleepMinutes)}`,
    };
  }
  if (consumedMl * 4 < goalMl) {
    return {
      message: 'Que bom, já começou!',
      sub: left === 1 ? 'Falta 1 copo pra meta' : `Faltam ${left} copos pra meta`,
    };
  }
  if (consumedMl < goalMl) {
    return {
      message: 'Tá indo muito bem!',
      sub: left === 1 ? 'Falta só 1 copo pra meta' : `Faltam ${left} copos pra meta`,
    };
  }
  if (consumedMl === goalMl) {
    return { message: 'Bom trabalho! 🎉', sub: 'Você bateu a meta de hoje' };
  }
  return {
    message: 'Bom trabalho! 🎉',
    sub: `Meta batida e mais ${groupThousands(consumedMl - goalMl)} ml de bônus`,
  };
}

/** Subtitle of the "Desfazer último gole" option. */
export function undoMenuHint(consumedMl: number): string {
  return consumedMl > 0
    ? `Volta pra ${formatLiters(consumedMl - GLASS_ML)} L`
    : 'Nada pra desfazer ainda';
}

const EXPRESSION_PT: Record<MascotExpression, string> = {
  thirsty: 'com sede',
  excited: 'animada',
  radiant: 'radiante',
  celebrating: 'comemorando',
};

/** VoiceOver summary of the mascot: "Garrafa com 1,25 de 2 litros, animada". */
export function mascotLabel(consumedMl: number, goalMl: number): string {
  const expression = EXPRESSION_PT[expressionFor(consumedMl, goalMl)];
  return `Garrafa com ${formatLiters(consumedMl)} de ${formatLiters(goalMl)} litros, ${expression}`;
}

/** Home hint under the counter (design: "Próximo lembrete às 14h30"). */
export function nextReminderText(
  nextAt: number | null,
  now: Date,
  goalMet: boolean,
): string | null {
  if (goalMet) return 'Lembretes de hoje encerrados. Até amanhã!';
  if (nextAt === null) return null;
  const when = new Date(nextAt);
  const sameDay = toDayKey(when) === toDayKey(now);
  return `Próximo lembrete ${sameDay ? '' : 'amanhã '}às ${formatClock(when)}`;
}
