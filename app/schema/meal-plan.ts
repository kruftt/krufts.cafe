import * as z from "zod";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

// 0 = Monday ... 6 = Sunday
export type Day = z.infer<typeof Day>;
export const Day = z.int().min(0).max(6);

export type Add = z.infer<typeof Add>;
export const Add = z.object({
	day: Day,
	recipeIds: z.array(z.int()).min(1).max(50),
});

export type SetNote = z.infer<typeof SetNote>;
export const SetNote = z.object({
	day: Day,
	text: z.string().max(500),
});
