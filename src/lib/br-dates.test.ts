import { test } from "node:test";
import { strict as assert } from "node:assert";
import { brazilianDatesInWindow } from "./br-dates";
test("inclui Black Friday e Natal antecipado a partir de novembro", () => {
  const names = brazilianDatesInWindow("2026-11-12").map((d) => `${d.date} ${d.name}`);
  assert.ok(names.includes("2026-11-27 Black Friday"));
  assert.ok(names.includes("2026-12-25 Natal"));
  assert.ok(!names.some((n) => n.includes("Finados")));
});
test("Dia das Mães é o 2º domingo de maio", () => {
  assert.ok(brazilianDatesInWindow("2026-05-01").some((d) => d.date === "2026-05-10" && d.name === "Dia das Mães"));
});
