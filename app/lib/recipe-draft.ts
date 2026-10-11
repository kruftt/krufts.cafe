import { Recipe, RecipeBody } from "@schema";
import * as z from "zod";

// The editor's form state: every editable value exactly as typed. Times stay strings until save.
export type Draft = Omit<Recipe.Fields, "prepTime" | "cookTime"> & {
	prepTime: string;
	cookTime: string;
	body: RecipeBody.Body;
};

export type DraftValues = Recipe.Fields & { body: RecipeBody.Body };

const Minutes = z.string().regex(/^\d+$/, "Whole minutes only.");
const DraftValues = Recipe.Fields.extend({ body: RecipeBody.Body });

// Validates the whole draft and converts it to saveable values.
export function parseDraft(draft: Draft): { ok: true; value: DraftValues } | { ok: false; message: string } {
	const result = DraftValues.safeParse({
		...draft,
		prepTime: Minutes.safeParse(draft.prepTime).success ? Number(draft.prepTime) : Number.NaN,
		cookTime: Minutes.safeParse(draft.cookTime).success ? Number(draft.cookTime) : Number.NaN,
	});
	// zod paths like body.ingredientGroups.0.ingredients.2.amount aren't readable; fields show their own errors.
	if (!result.success) return { ok: false, message: "Can't save until invalid fields are fixed." };
	return { ok: true, value: result.data };
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

export function fromRecipe(recipe: DraftValues): Draft {
	const { name, tags, published, prepTime, cookTime, serves, intro, body } = recipe;
	return { name, tags, published, prepTime: String(prepTime), cookTime: String(cookTime), serves, intro, body };
}

type TopFields = Omit<Draft, "body">;

export function setField<K extends keyof TopFields>(draft: Draft, field: K, value: TopFields[K]): Draft {
	return draft[field] === value ? draft : { ...draft, [field]: value };
}

// Lookups

function findGroup(draft: Draft, id: string) {
	return draft.body.ingredientGroups.find((g) => g.id === id);
}

function findIngredient(draft: Draft, id: string) {
	for (const group of draft.body.ingredientGroups) {
		const ingredient = group.ingredients.find((i) => i.id === id);
		if (ingredient) return ingredient;
	}
}

function findStep(draft: Draft, id: string) {
	return draft.body.steps.find((s) => s.id === id);
}

function findInstruction(draft: Draft, id: string) {
	for (const step of draft.body.steps) {
		const instruction = step.instructions.find((i) => i.id === id);
		if (instruction) return instruction;
	}
}

export function groupIds(draft: Draft) {
	return draft.body.ingredientGroups.map((g) => g.id);
}

export function ingredientIds(draft: Draft, groupId: string) {
	return findGroup(draft, groupId)?.ingredients.map((i) => i.id) ?? [];
}

export function stepIds(draft: Draft) {
	return draft.body.steps.map((s) => s.id);
}

export function instructionIds(draft: Draft, stepId: string) {
	return findStep(draft, stepId)?.instructions.map((i) => i.id) ?? [];
}

export function sameIds(a: string[], b: string[]) {
	return a.length === b.length && a.every((id, i) => id === b[i]);
}

// Editable string fields. `key` identifies the field stably, for memoizing subscriptions.
// `get` returns "" for a missing item: one may be read in the render just before its parent drops it.

export interface DraftField {
	key: string;
	get: (draft: Draft) => string;
	set: (draft: Draft, value: string) => Draft;
	schema: z.ZodType<string>;
}

export const Field = {
	recipe(name: "name" | "prepTime" | "cookTime" | "serves" | "intro"): DraftField {
		const schema = name === "prepTime" || name === "cookTime" ? Minutes : Recipe.Fields.shape[name];
		return {
			key: `recipe:${name}`,
			get: (d) => d[name],
			set: (d, v) => setField(d, name, v),
			schema,
		};
	},
	group(id: string, name: "name"): DraftField {
		return {
			key: `group:${id}:${name}`,
			get: (d) => findGroup(d, id)?.[name] ?? "",
			set: (d, v) => updateGroup(d, id, { [name]: v }),
			schema: RecipeBody.IngredientGroup.shape[name],
		};
	},
	ingredient(id: string, name: "amount" | "units" | "name" | "preparation"): DraftField {
		return {
			key: `ingredient:${id}:${name}`,
			get: (d) => findIngredient(d, id)?.[name] ?? "",
			set: (d, v) => updateIngredient(d, id, { [name]: v }),
			schema: RecipeBody.Ingredient.shape[name] as z.ZodType<string>,
		};
	},
	step(id: string, name: "name" | "intro"): DraftField {
		return {
			key: `step:${id}:${name}`,
			get: (d) => findStep(d, id)?.[name] ?? "",
			set: (d, v) => updateStep(d, id, { [name]: v }),
			schema: RecipeBody.Step.shape[name],
		};
	},
	instruction(id: string, name: "text"): DraftField {
		return {
			key: `instruction:${id}:${name}`,
			get: (d) => findInstruction(d, id)?.[name] ?? "",
			set: (d, v) => updateInstruction(d, id, { [name]: v }),
			schema: RecipeBody.Instruction.shape[name],
		};
	},
};

// Ingredient groups

export function addGroup(draft: Draft, id: string = newId()): Draft {
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

export function addIngredient(draft: Draft, groupId: string, id: string = newId()): Draft {
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

export function addStep(draft: Draft, id: string = newId()): Draft {
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

export function addInstruction(draft: Draft, stepId: string, id: string = newId()): Draft {
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
