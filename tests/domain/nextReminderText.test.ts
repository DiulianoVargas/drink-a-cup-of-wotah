import { nextReminderText } from '@/domain/homeCopy';
import { at } from '../helpers/time';

describe('nextReminderText (Home, design "Próximo lembrete às 14h30")', () => {
  const now = at('2026-10-22', '10:00');
  it.each([
    [at('2026-10-22', '14:30').getTime(), false, 'Próximo lembrete às 14h30'],
    [at('2026-10-23', '09:45').getTime(), false, 'Próximo lembrete amanhã às 9h45'],
    [at('2026-10-23', '09:45').getTime(), true, 'Lembretes de hoje encerrados. Até amanhã!'],
    [null, true, 'Lembretes de hoje encerrados. Até amanhã!'],
    [null, false, null],
  ])('%s (goal met: %s) → %s', (nextAt, goalMet, expected) => {
    expect(nextReminderText(nextAt, now, goalMet)).toBe(expected);
  });
});
