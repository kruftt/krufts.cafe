import type { RecipeBody } from "@schema";
import { formatAmount, type ParsedAmount, parseAmount } from "./amount";

// Instructions embed ingredients as tokens: {{id}} uses the whole amount, {{id|1/2}} uses part of it
// (in the ingredient's own units). Step intros are plain text and never parsed.
const TOKEN = /\{\{([\w-]+)(?:\|([^{}]*))?\}\}/g;

type Ingredient = RecipeBody.Ingredient;
export type IngredientMap = ReadonlyMap<string, Ingredient>;

export type Segment =
	| { type: "text"; text: string }
	| { type: "ingredient"; ingredient: Ingredient; amount: ParsedAmount | null; partial: boolean }
	| { type: "missing"; reason: "ingredient" | "amount"; raw: string };

export type StepIngredient = { ingredient: Ingredient; amount: ParsedAmount | null };

export function ingredientMap(groups: RecipeBody.IngredientGroup[]): IngredientMap {
	return new Map(groups.flatMap((g) => g.ingredients.map((i) => [i.id, i] as const)));
}

export function token(id: string, amount?: string) {
	return amount ? `{{${id}|${amount}}}` : `{{${id}}}`;
}

export function hasTokens(text: string) {
	return new RegExp(TOKEN.source).test(text);
}

export function parseInstruction(text: string, ingredients: IngredientMap): Segment[] {
	const segments: Segment[] = [];
	let last = 0;
	for (const match of text.matchAll(TOKEN)) {
		const [raw, id = "", override = ""] = match;
		if (match.index > last) segments.push({ type: "text", text: text.slice(last, match.index) });
		last = match.index + raw.length;

		const ingredient = ingredients.get(id);
		const partial = override.trim() !== "";
		const amount = parseAmount(partial ? override.trim() : (ingredient?.amount ?? ""));
		if (!ingredient) segments.push({ type: "missing", reason: "ingredient", raw });
		else if (partial && !amount) segments.push({ type: "missing", reason: "amount", raw });
		else segments.push({ type: "ingredient", ingredient, amount, partial });
	}
	if (last < text.length) segments.push({ type: "text", text: text.slice(last) });
	return segments;
}

function sumAmounts(amounts: ParsedAmount[]): ParsedAmount {
	const ranged = amounts.some((a) => a.high !== undefined);
	return {
		value: amounts.reduce((n, a) => n + a.value, 0),
		...(ranged && { high: amounts.reduce((n, a) => n + (a.high ?? a.value), 0) }),
		fraction: amounts.every((a) => a.fraction),
	};
}

// Every ingredient a step's instructions use, in order of first mention. A whole-amount mention
// anywhere in the step wins; otherwise the partial amounts are summed.
export function summarizeStep(step: RecipeBody.Step, ingredients: IngredientMap): StepIngredient[] {
	const uses = new Map<string, { ingredient: Ingredient; whole: boolean; parts: ParsedAmount[] }>();
	for (const instruction of step.instructions) {
		for (const seg of parseInstruction(instruction.text, ingredients)) {
			if (seg.type !== "ingredient") continue;
			const use = uses.get(seg.ingredient.id) ?? { ingredient: seg.ingredient, whole: false, parts: [] };
			uses.set(seg.ingredient.id, use);
			if (!seg.partial) use.whole = true;
			else if (seg.amount) use.parts.push(seg.amount);
		}
	}
	return [...uses.values()].map(({ ingredient, whole, parts }) => ({
		ingredient,
		amount: whole || parts.length === 0 ? parseAmount(ingredient.amount) : sumAmounts(parts),
	}));
}

export function formatIngredient(ingredient: Ingredient, amount: ParsedAmount | null, scale: number) {
	return [amount ? formatAmount(amount, scale) : "", ingredient.units, ingredient.name].filter(Boolean).join(" ");
}
