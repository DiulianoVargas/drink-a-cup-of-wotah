import { MESSAGES, pickMessage } from '@/domain/messages';

const seeds = Array.from({ length: 40 }, (_, i) => i);

describe('pickMessage (FR-020, contracts/notifications.md)', () => {
  it('has the 8 texts from the design, verbatim', () => {
    expect(MESSAGES.map((m) => m.title)).toEqual([
      'Hora de um golinho! 💧',
      'Psiu… tô com sedinha 🥺',
      'Bora de água? 💧',
      'Pausa pra hidratar ✨',
      'Sua garrafinha lembrou de você',
      'Glub glub? 💦',
      'Um golinho pra dar energia ☀️',
      'Falta pouquinho! 💧',
    ]);
  });

  it('"Falta pouquinho!" is used exactly when 1 glass is left', () => {
    for (const seed of seeds) {
      expect(pickMessage(1, 1750, seed)).toEqual({
        title: 'Falta pouquinho! 💧',
        body: 'Mais 1 copo e a meta de hoje tá feita.',
      });
      expect(pickMessage(3, 1250, seed).title).not.toBe('Falta pouquinho! 💧');
    }
  });

  it('"Já são {x} L hoje" never appears at 0 ml', () => {
    for (const seed of seeds) expect(pickMessage(8, 0, seed).body).not.toMatch(/Já são/);
  });

  it('fills {n} with singular/plural and {x} with liters', () => {
    const bodies = seeds.map((s) => pickMessage(3, 1250, s).body);
    expect(bodies).toContain('Faltam 3 copos pra meta de hoje.');
    expect(bodies).toContain('Já são 1,25 L hoje. Bora pro próximo?');
  });

  it('is deterministic for a seed and varies across seeds', () => {
    expect(pickMessage(5, 750, 7)).toEqual(pickMessage(5, 750, 7));
    expect(new Set(seeds.map((s) => pickMessage(5, 750, s).title)).size).toBe(7);
  });

  it('never blames the user', () => {
    for (const m of MESSAGES) expect(`${m.title} ${m.body}`).not.toMatch(/falhou|desidratad/i);
  });
});
