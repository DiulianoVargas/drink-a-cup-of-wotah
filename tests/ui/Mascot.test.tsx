import { render, screen } from '@testing-library/react-native';
import { Mascot, waterY } from '@/ui/components/Mascot';

describe('Mascot', () => {
  it.each(['thirsty', 'excited', 'radiant', 'celebrating'] as const)(
    'renders the %s expression',
    async (expression) => {
      await render(
        <Mascot
          level={0.5}
          expression={expression}
          width={200}
          accessibilityLabel={`garrafa ${expression}`}
        />,
      );
      expect(screen.getByLabelText(`garrafa ${expression}`)).toBeTruthy();
    },
  );

  it('keeps the 260:320 aspect ratio', async () => {
    await render(
      <Mascot level={0} expression="thirsty" width={260} accessibilityLabel="garrafa" />,
    );
    expect(screen.getByLabelText('garrafa')).toHaveStyle({ width: 260, height: 320 });
  });

  it('maps the level to the design water line (278 − p × 214), capped', () => {
    expect(waterY(0)).toBe(278);
    expect(waterY(0.5)).toBe(171);
    expect(waterY(1)).toBe(64);
    expect(waterY(1.5)).toBe(64);
  });
});
