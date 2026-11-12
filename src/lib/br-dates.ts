// Datas comemorativas brasileiras relevantes para marketing no Instagram.
const FIXED: [number, number, string][] = [
  [1, 1, "Ano Novo"], [3, 8, "Dia Internacional da Mulher"], [3, 15, "Dia do Consumidor"],
  [4, 21, "Tiradentes"], [5, 1, "Dia do Trabalhador"], [6, 12, "Dia dos Namorados"],
  [6, 24, "São João (Festas Juninas)"], [7, 20, "Dia do Amigo"], [8, 11, "Dia do Estudante"],
  [9, 7, "Independência do Brasil"], [9, 15, "Dia do Cliente"], [10, 12, "Dia das Crianças / Nossa Senhora Aparecida"],
  [10, 15, "Dia do Professor"], [10, 31, "Halloween / Dia do Saci"], [11, 2, "Finados"],
  [11, 15, "Proclamação da República"], [11, 20, "Dia da Consciência Negra"],
  [12, 24, "Véspera de Natal"], [12, 25, "Natal"], [12, 31, "Réveillon"],
];
const iso = (d: Date) => d.toISOString().slice(0, 10);
function nthWeekday(y: number, m: number, wd: number, n: number) {
  const d = new Date(Date.UTC(y, m - 1, 1, 12));
  d.setUTCDate(1 + ((wd - d.getUTCDay() + 7) % 7) + (n - 1) * 7);
  return d;
}
function easter(y: number) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day, 12));
}
function yearDates(y: number) {
  const list = FIXED.map(([m, d, n]) => ({ date: new Date(Date.UTC(y, m - 1, d, 12)), name: n }));
  const e = easter(y);
  const carnaval = new Date(e); carnaval.setUTCDate(e.getUTCDate() - 47);
  const bf = nthWeekday(y, 11, 5, 4);
  list.push({ date: carnaval, name: "Carnaval" }, { date: e, name: "Páscoa" },
    { date: nthWeekday(y, 5, 0, 2), name: "Dia das Mães" }, { date: nthWeekday(y, 8, 0, 2), name: "Dia dos Pais" },
    { date: bf, name: "Black Friday" });
  return list;
}
/** Datas entre o início e início + 30 dias + antecedência (para preparar conteúdos antecipados). */
export function brazilianDatesInWindow(startDate: string, leadDays = 21) {
  const start = new Date(`${startDate}T12:00:00Z`);
  if (!Number.isFinite(start.getTime())) return [];
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 29 + leadDays);
  const y = start.getUTCFullYear();
  return [...yearDates(y), ...yearDates(y + 1)]
    .filter((x) => x.date >= start && x.date <= end)
    .sort((a, b) => +a.date - +b.date)
    .map((x) => ({ date: iso(x.date), name: x.name }));
}
