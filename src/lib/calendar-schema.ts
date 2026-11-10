import { z } from "zod";

const contentSchema = z.object({
  title: z.string().trim().min(1),
  hook: z.string().trim().min(1),
  caption: z.string().trim().min(1),
  cta: z.string().trim().min(1),
  photoIdea: z.string().trim().min(1),
  bestTime: z.string().trim().min(1),
});

export const calendarSchema = z.object({
  strategy: z.string().min(1),
  pillars: z.array(z.string()),
  posts: z.array(contentSchema.extend({
    day: z.number().int().min(1).max(30),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    format: z.enum(["Reels", "Carrossel", "Post"]),
    pillar: z.string().min(1),
    hashtags: z.array(z.string()).min(5).max(10),
    story: contentSchema,
  })).length(30),
}).superRefine((calendar, ctx) => {
  calendar.posts.forEach((post, index) => {
    if (post.day !== index + 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dias devem ir de 1 a 30", path: ["posts", index, "day"] });
    const first = calendar.posts[0];
    if (!first) return;
    const expected = new Date(`${first.date}T12:00:00Z`);
    expected.setUTCDate(expected.getUTCDate() + index);
    if (!Number.isFinite(expected.getTime()) || expected.toISOString().slice(0, 10) !== post.date) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Datas devem ser consecutivas", path: ["posts", index, "date"] });
  });
});

export type CalendarStory = z.infer<typeof contentSchema>;