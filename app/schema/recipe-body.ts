import { AMOUNT_REGEX } from "@lib/amount";
import * as z from "zod";

const ItemId = z.string().min(1).max(64);
const ShortText = z.string().max(200);
const LongText = z.string().max(5000);

export type Ingredient = z.infer<typeof Ingredient>;
export const Ingredient = z.object({
	id: ItemId,
	amount: z.union([z.literal(""), z.string().regex(AMOUNT_REGEX, "Invalid format")]),
	units: ShortText,
	name: ShortText,
	preparation: ShortText,
});

export type IngredientGroup = z.infer<typeof IngredientGroup>;
export const IngredientGroup = z.object({
	id: ItemId,
	name: ShortText,
	ingredients: z.array(Ingredient).max(200),
});

export type Instruction = z.infer<typeof Instruction>;
export const Instruction = z.object({
	id: ItemId,
	text: LongText,
});

export type Step = z.infer<typeof Step>;
export const Step = z.object({
	id: ItemId,
	name: ShortText,
	intro: LongText,
	instructions: z.array(Instruction).max(200),
});

export type Body = z.infer<typeof Body>;
export const Body = z.object({
	ingredientGroups: z.array(IngredientGroup).max(50),
	steps: z.array(Step).max(100),
});

export const emptyBody: Body = { ingredientGroups: [], steps: [] };
