import {
  awakeHint,
  formatTimeOfDay,
  glassesText,
  goalSuggestionText,
  remindersDescription,
  suggestGoalCardText,
} from '@/domain/settingsCopy';
import { hm } from '../helpers/time';

describe('onboarding and settings copy (design/Wotah Telas.html)', () => {
  it('goal suggestion', () => {
    expect(goalSuggestionText(70, 2500)).toBe(
      'Pra 70 kg, a gente sugere 2,5 L por dia. Pode ajustar do seu jeito.',
    );
  });

  it.each([
    [2500, '10 copos de 250 ml'],
    [500, '2 copos de 250 ml'],
  ])('glassesText(%i) → %s', (goal, expected) => {
    expect(glassesText(goal)).toBe(expected);
  });

  it.each([
    [hm(8), hm(22), 2000, '14 horas acordado · um lembrete a cada ~1h'],
    [hm(7, 30), hm(22), 2500, '14h30 acordado · um lembrete a cada ~1h'],
    [hm(8), hm(22), 4000, '14 horas acordado · um lembrete a cada ~52 min'],
    [hm(8), hm(10), 2000, '2 horas acordado · um lembrete a cada ~30 min'],
  ])('awakeHint(%i, %i, %i) → %s', (wake, sleep, goal, expected) => {
    expect(awakeHint({ wakeMinutes: wake, sleepMinutes: sleep, dailyGoalMl: goal })).toBe(expected);
  });

  it('reminders description', () => {
    expect(
      remindersDescription({ wakeMinutes: hm(8), sleepMinutes: hm(22), dailyGoalMl: 2000 }),
    ).toBe('Um lembrete a cada ~1h, das 8h às 22h. Quando você bate a meta, eu paro até amanhã.');
  });

  it('suggest-goal card after a weight change (FR-012)', () => {
    expect(suggestGoalCardText(72, 2500)).toBe(
      'Com 72 kg, a sugestão é 2,5 L por dia. Quer atualizar sua meta?',
    );
  });

  it.each([
    [hm(8), '08:00'],
    [hm(22, 30), '22:30'],
    [0, '00:00'],
  ])('formatTimeOfDay(%i) → %s', (minutes, expected) => {
    expect(formatTimeOfDay(minutes)).toBe(expected);
  });
});
