// Reminder texts (FR-020; design/Wotah Live Activity.html › "8 variações de texto"). PT-BR, never guilt.
import { formatLiters } from './format';

type Message = { title: string; body: string | ((n: number, liters: string) => string) };

const glasses = (n: number) => (n === 1 ? 'Falta 1 copo' : `Faltam ${n} copos`);

export const MESSAGES: { title: string; body: string }[] = [];

const TEMPLATES: Message[] = [
  { title: 'Hora de um golinho! 💧', body: (n) => `${glasses(n)} pra meta de hoje.` },
  { title: 'Psiu… tô com sedinha 🥺', body: 'Um copo agora e eu fico felizona.' },
  { title: 'Bora de água? 💧', body: '250 ml e você já tá mais pertinho.' },
  { title: 'Pausa pra hidratar ✨', body: 'Pega um copo, respira, volta. Pronto!' },
  { title: 'Sua garrafinha lembrou de você', body: 'Bebe um copinho comigo?' },
  { title: 'Glub glub? 💦', body: 'Só um copo e a gente segue o dia.' },
  {
    title: 'Um golinho pra dar energia ☀️',
    body: (_, x) => `Já são ${x} L hoje. Bora pro próximo?`,
  },
  { title: 'Falta pouquinho! 💧', body: 'Mais 1 copo e a meta de hoje tá feita.' },
];

const ENERGY = 6; // "Já são {x} L hoje": needs something already drunk
const LAST_GLASS = 7; // "Falta pouquinho!": exactly one glass left

// Rendered with sample values, for display and copy checks.
for (const t of TEMPLATES) {
  MESSAGES.push({ title: t.title, body: typeof t.body === 'string' ? t.body : t.body(3, '1,25') });
}

/** Deterministic variant for a reminder: `seed` comes from the day and the reminder position. */
export function pickMessage(
  remainingGlasses: number,
  consumedMl: number,
  seed: number,
): { title: string; body: string } {
  let index: number;
  if (remainingGlasses === 1) {
    index = LAST_GLASS;
  } else {
    const eligible = [0, 1, 2, 3, 4, 5, ENERGY].filter((i) => i !== ENERGY || consumedMl > 0);
    index = eligible[Math.abs(Math.trunc(seed)) % eligible.length];
  }
  const t = TEMPLATES[index];
  return {
    title: t.title,
    body: typeof t.body === 'string' ? t.body : t.body(remainingGlasses, formatLiters(consumedMl)),
  };
}
