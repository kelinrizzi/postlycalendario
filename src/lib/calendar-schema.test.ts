import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { calendarSchema } from "./calendar-schema";

const content = { title: "Bolos veganos", hook: "Como preparar bolos veganos?", caption: "Receita de bolo vegano artesanal", cta: "Seria uma má ideia experimentar?", photoIdea: "Fatia de bolo vegano em close na bancada da cozinha", bestTime: "19h" };
function validCalendar() {
  return { strategy: "Bolos veganos artesanais", pillars: ["Receitas"], posts: Array.from({ length: 30 }, (_, index) => {
    const date = new Date("2026-11-10T12:00:00Z"); date.setUTCDate(date.getUTCDate() + index);
    return { ...content, day: index + 1, date: date.toISOString().slice(0, 10), format: "Post", pillar: "Receitas", hashtags: ["#bolo", "#vegan", "#receita", "#confeitaria", "#artesanal"], story: { ...content, photoIdea: "Foto vertical do preparo da massa vegana" } };
  }) };
}
describe("Calendário diário", () => {
  test("exige exatamente 30 conteúdos de feed", () => {
    assert.equal(calendarSchema.safeParse(validCalendar()).success, true);
    const calendar = validCalendar(); calendar.posts.pop();
    assert.equal(calendarSchema.safeParse(calendar).success, false);
  });
  test("exige um story junto a cada conteúdo, sem substituir o feed", () => {
    const calendar = validCalendar();
    assert.equal(calendarSchema.parse(calendar).posts.filter(post => post.story).length, 30);
    assert.equal(calendarSchema.safeParse({ ...calendar, posts: calendar.posts.map(({ story, ...post }) => post) }).success, false);
    calendar.posts[0].format = "Story";
    assert.equal(calendarSchema.safeParse(calendar).success, false);
  });
  test("exige sugestão de foto no feed e no story", () => {
    const calendar = validCalendar(); calendar.posts[0].photoIdea = "";
    assert.equal(calendarSchema.safeParse(calendar).success, false);
    calendar.posts[0].photoIdea = content.photoIdea; calendar.posts[0].story.photoIdea = "";
    assert.equal(calendarSchema.safeParse(calendar).success, false);
  });
  test("mantém os dias e datas consecutivos", () => {
    const calendar = validCalendar(); calendar.posts[1].date = calendar.posts[0].date;
    assert.equal(calendarSchema.safeParse(calendar).success, false);
  });
});