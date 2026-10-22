import { createLiveActivity } from 'expo-widgets';
import '@/widgets/WotahDay';

describe('WotahDay Live Activity', () => {
  it('is registered as "WotahDay" and compiled to an isolated widget function', () => {
    const [name, layout] = (createLiveActivity as jest.Mock).mock.calls[0];
    expect(name).toBe('WotahDay');
    // babel-preset-expo's widgets plugin turns the 'widget' function into source text.
    expect(typeof layout).toBe('string');
  });

  it('defines every region and uses the namespaced "Bebi 💧" target', () => {
    const layout: string = (createLiveActivity as jest.Mock).mock.calls[0][1];
    for (const region of [
      'banner',
      'compactLeading',
      'compactTrailing',
      'minimal',
      'expandedLeading',
      'expandedTrailing',
      'expandedBottom',
    ]) {
      expect(layout).toContain(region);
    }
    expect(layout).toContain('wotah-drink');
    expect(layout).toContain('Bom trabalho! 🎉');
    expect(layout).toContain('Meta de hoje batida. Lembretes só amanhã!');
  });

  it('contains no business rule (expression/goal thresholds come from the domain)', () => {
    const layout: string = (createLiveActivity as jest.Mock).mock.calls[0][1];
    expect(layout).not.toMatch(/0\.25|\* ?4|expressionFor/);
  });
});
