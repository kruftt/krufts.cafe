import type { ProcedureOptions } from "@hooks/editor";
import type { Recipe, RecipeBody } from "@schema";
import type * as z from "zod";

export type Draft = Recipe.Fields & { body: RecipeBody.Body };

export type FieldSaver = (value: string, options: ProcedureOptions) => void;

// Validates one field with its zod schema, then applies it to the draft.
export function fieldSaver<T>(
	schema: z.ZodType<T>,
	update: (fn: (d: Draft) => Draft) => void,
	apply: (draft: Draft, value: T) => Draft,
): FieldSaver {
	return (value, options) => {
		const result = schema.safeParse(value);
		if (!result.success) {
			options.onError(result.error.issues[0] ?? { message: "Invalid value" });
			return;
		}
		update((d) => apply(d, result.data));
		options.onSuccess();
	};
}

type GroupFields = Omit<RecipeBody.IngredientGroup, "id" | "ingredients">;
type IngredientFields = Omit<RecipeBody.Ingredient, "id">;
type StepFields = Omit<RecipeBody.Step, "id" | "instructions">;
type InstructionFields = Omit<RecipeBody.Instruction, "id">;

function newId() {
	return crypto.randomUUID();
}

function withBody(draft: Draft, body: Partial<RecipeBody.Body>): Draft {
	return { ...draft, body: { ...draft.body, ...body } };
}

function patchById<T extends { id: string }>(items: T[], id: string, patch: (item: T) => T) {
	let changed = false;
	const next = items.map((item) => {
		if (item.id !== id) return item;
		changed = true;
		return patch(item);
	});
	return changed ? next : items;
}

function removeById<T extends { id: string }>(items: T[], id: string) {
	const next = items.filter((item) => item.id !== id);
	return next.length === items.length ? items : next;
}

export function fromRecipe(recipe: Draft): Draft {
	const { name, tags, published, prepTime, cookTime, serves, intro, body } = recipe;
	return { name, tags, published, prepTime, cookTime, serves, intro, body };
}

export function setField<K extends keyof Recipe.Fields>(draft: Draft, field: K, value: Recipe.Fields[K]): Draft {
	return draft[field] === value ? draft : { ...draft, [field]: value };
}

// Ingredient groups

export function addGroup(draft: Draft, id = newId()): Draft {
	return withBody(draft, {
		ingredientGroups: [...draft.body.ingredientGroups, { id, name: "", ingredients: [] }],
	});
}

export function updateGroup(draft: Draft, groupId: string, patch: Partial<GroupFields>): Draft {
	const groups = patchById(draft.body.ingredientGroups, groupId, (g) => ({ ...g, ...patch }));
	return groups === draft.body.ingredientGroups ? draft : withBody(draft, { ingredientGroups: groups });
}

export function removeGroup(draft: Draft, groupId: string): Draft {
	const groups = removeById(draft.body.ingredientGroups, groupId);
	return groups === draft.body.ingredientGroups ? draft : withBody(draft, { ingredientGroups: groups });
}

// Ingredients

export function addIngredient(draft: Draft, groupId: string, id = newId()): Draft {
	const ingredient = { id, amount: "", units: "", name: "", preparation: "" };
	const groups = patchById(draft.body.ingredientGroups, groupId, (g) => ({
		...g,
		ingredients: [...g.ingredients, ingredient],
	}));
	return groups === draft.body.ingredientGroups ? draft : withBody(draft, { ingredientGroups: groups });
}

function mapIngredients(
	draft: Draft,
	fn: (ingredients: RecipeBody.Ingredient[]) => RecipeBody.Ingredient[],
): Draft {
	let changed = false;
	const groups = draft.body.ingredientGroups.map((g) => {
		const ingredients = fn(g.ingredients);
		if (ingredients === g.ingredients) return g;
		changed = true;
		return { ...g, ingredients };
	});
	return changed ? withBody(draft, { ingredientGroups: groups }) : draft;
}

export function updateIngredient(draft: Draft, ingredientId: string, patch: Partial<IngredientFields>): Draft {
	return mapIngredients(draft, (items) => patchById(items, ingredientId, (i) => ({ ...i, ...patch })));
}

export function removeIngredient(draft: Draft, ingredientId: string): Draft {
	return mapIngredients(draft, (items) => removeById(items, ingredientId));
}

// Steps

export function addStep(draft: Draft, id = newId()): Draft {
	return withBody(draft, {
		steps: [...draft.body.steps, { id, name: "", intro: "", instructions: [] }],
	});
}

export function updateStep(draft: Draft, stepId: string, patch: Partial<StepFields>): Draft {
	const steps = patchById(draft.body.steps, stepId, (s) => ({ ...s, ...patch }));
	return steps === draft.body.steps ? draft : withBody(draft, { steps });
}

export function removeStep(draft: Draft, stepId: string): Draft {
	const steps = removeById(draft.body.steps, stepId);
	return steps === draft.body.steps ? draft : withBody(draft, { steps });
}

// Instructions

export function addInstruction(draft: Draft, stepId: string, id = newId()): Draft {
	const steps = patchById(draft.body.steps, stepId, (s) => ({
		...s,
		instructions: [...s.instructions, { id, text: "" }],
	}));
	return steps === draft.body.steps ? draft : withBody(draft, { steps });
}

function mapInstructions(
	draft: Draft,
	fn: (instructions: RecipeBody.Instruction[]) => RecipeBody.Instruction[],
): Draft {
	let changed = false;
	const steps = draft.body.steps.map((s) => {
		const instructions = fn(s.instructions);
		if (instructions === s.instructions) return s;
		changed = true;
		return { ...s, instructions };
	});
	return changed ? withBody(draft, { steps }) : draft;
}

export function updateInstruction(draft: Draft, instructionId: string, patch: Partial<InstructionFields>): Draft {
	return mapInstructions(draft, (items) => patchById(items, instructionId, (i) => ({ ...i, ...patch })));
}

export function removeInstruction(draft: Draft, instructionId: string): Draft {
	return mapInstructions(draft, (items) => removeById(items, instructionId));
}
