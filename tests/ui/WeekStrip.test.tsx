import { render, screen } from '@testing-library/react-native';
import { StreakBadge } from '@/ui/components/StreakBadge';
import { WeekStrip } from '@/ui/components/WeekStrip';

const week = [
  { dayKey: '2026-10-16', status: 'full', label: 'sex' },
  { dayKey: '2026-10-17', status: 'partial', label: 'sáb' },
  { dayKey: '2026-10-18', status: 'empty', label: 'dom' },
  { dayKey: '2026-10-19', status: 'full', label: 'seg' },
  { dayKey: '2026-10-20', status: 'full', label: 'ter' },
  { dayKey: '2026-10-21', status: 'full', label: 'qua' },
  { dayKey: '2026-10-22', status: 'partial', label: 'hoje' },
] as const;

describe('WeekStrip (FR-028)', () => {
  it('shows the 7 days with PT-BR accessibility labels', async () => {
    await render(<WeekStrip days={[...week]} />);
    expect(screen.getByText('Últimos 7 dias')).toBeTruthy();
    expect(screen.getByLabelText('sex: meta batida')).toBeTruthy();
    expect(screen.getByLabelText('sáb: parcial')).toBeTruthy();
    expect(screen.getByLabelText('dom: sem registro')).toBeTruthy();
    expect(screen.getByLabelText('hoje: parcial')).toBeTruthy();
  });
});

describe('StreakBadge (FR-029)', () => {
  it.each([
    [0, null],
    [1, '🔥 1 dia'],
    [5, '🔥 5 dias'],
  ])('%i → %s', async (days, text) => {
    await render(<StreakBadge days={days} />);
    if (text) expect(screen.getByText(text)).toBeTruthy();
    else expect(screen.queryByText(/🔥/)).toBeNull();
  });
});
