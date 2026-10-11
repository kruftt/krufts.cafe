import { useTRPC, useTRPCClient } from "@lib/trpc";
import {
	Ingredient,
	IngredientGroup,
	Instruction,
	type Model,
	Recipe,
	Step,
} from "@schema";
import type {
	IngredientData,
	IngredientGroupData,
	InstructionData,
	RecipeData,
	StepData,
} from "@services/recipe";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import type * as z from "zod";
import type { ProcedureOptions } from "./editor";

function makeFieldUpdater<S extends z.ZodObject<z.ZodRawShape>>(
	schema: S,
	// biome-ignore lint/suspicious/noExplicitAny: dynamic field construction requires any
	mutation: { mutate: (vars: any, options: any) => void },
) {
	return (id: number | undefined, field: keyof z.infer<S>) => {
		return (value: string, options: ProcedureOptions) => {
			if (!id) return options.onError({ message: "Waiting for server..." });
			const result = (schema.shape[field as string] as z.ZodType).safeParse(value);
			if (result.success) {
				mutation.mutate({ id, [field]: result.data }, options);
			} else {
				if (result.error.issues[0]) options.onError(result.error.issues[0]);
			}
		};
	};
}

type WithClientKey<T> = Omit<T, "id"> & { id?: number; clientKey?: string }

export type CachedIngredientData = WithClientKey<IngredientData>
export type CachedInstructionData = WithClientKey<InstructionData>

export type CachedIngredientGroupData = WithClientKey<
	Omit<IngredientGroupData, "ingredients"> & { ingredients: CachedIngredientData[] }
>
export type CachedStepData = WithClientKey<
	Omit<StepData, "instructions"> & { instructions: CachedInstructionData[] }
>

export type CachedRecipeData = Omit<RecipeData, "ingredientGroups" | "steps"> & {
	ingredientGroups: CachedIngredientGroupData[]
	steps: CachedStepData[]
}

export const RecipeIdContext = createContext<number | null>(null);

export function useRecipeId(): number {
	const id = useContext(RecipeIdContext);
	if (id === null) throw new Error("useRecipeId used outside RecipeIdContext.Provider");
	return id;
}

export function recipeQueryKey(recipeId: number) {
	return ["recipe", recipeId] as const;
}

export function useRecipeCache(recipeId: number) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const queryKey = recipeQueryKey(recipeId);

	function updateCache(updater: (old: CachedRecipeData) => CachedRecipeData) {
		queryClient.setQueryData<CachedRecipeData>(queryKey, (old) => {
			if (!old) return old;
			return updater(old);
		});
	}

	async function cancelAndSnapshot() {
		await queryClient.cancelQueries({ queryKey });
		return queryClient.getQueryData<CachedRecipeData>(queryKey);
	}

	function restore(previous: CachedRecipeData | undefined) {
		queryClient.setQueryData(queryKey, previous);
	}

	// Recipe
	const updateRecipe = useMutation({
		...trpc.recipe.update.mutationOptions(),
		onSuccess: (updated) => {
			updateCache((old) => ({ ...old, ...updated }));
		},
	});

	const updateRecipeField = makeFieldUpdater(Recipe.Update, updateRecipe);

	// Ingredient Groups
	const addIngredientGroup = useMutation<
		{ id: number },
		Error,
		IngredientGroup.Create,
		{ previous: CachedRecipeData | undefined; clientKey: string }
	>({
		mutationFn: (vars) => trpcClient.ingredientGroup.create.mutate(vars),
		onMutate: async (vars) => {
			const previous = await cancelAndSnapshot();
			const clientKey = crypto.randomUUID();
			updateCache((old) => ({
				...old,
				ingredientGroups: [...old.ingredientGroups, { ...vars, name: "", clientKey, ingredients: [] }],
			}));
			return { previous, clientKey };
		},
		onSuccess: ({ id }, _vars, ctx) => {
			updateCache((old) => ({
				...old,
				ingredientGroups: old.ingredientGroups.map((g) =>
					g.clientKey === ctx?.clientKey ? { ...g, id } : g,
				),
			}));
		},
		onError: (_err, _vars, ctx) => restore(ctx?.previous),
	});

	const updateIngredientGroup = useMutation({
		...trpc.ingredientGroup.update.mutationOptions(),
		onSuccess: (updated) => {
			updateCache((old) => ({
				...old,
				ingredientGroups: old.ingredientGroups.map((g) =>
					g.id === updated.id ? { ...g, ...updated } : g,
				),
			}));
		},
	});

	const removeIngredientGroup = useMutation<
		Omit<IngredientGroupData, "ingredients">,
		Error,
		Model.Id,
		{ previous: CachedRecipeData | undefined }
	>({
		mutationFn: (vars) => trpcClient.ingredientGroup.delete.mutate(vars),
		onMutate: async ({ id }) => {
			const previous = await cancelAndSnapshot();
			updateCache((old) => ({
				...old,
				ingredientGroups: old.ingredientGroups.filter((g) => g.id !== id),
			}));
			return { previous };
		},
		onError: (_err, _vars, ctx) => restore(ctx?.previous),
	});

	const updateIngredientGroupField = makeFieldUpdater(IngredientGroup.Update, updateIngredientGroup);

	// Ingredients
	const addIngredient = useMutation<
		{ id: number },
		Error,
		Ingredient.Create,
		{ previous: CachedRecipeData | undefined; clientKey: string }
	>({
		mutationFn: (vars) => trpcClient.ingredient.create.mutate(vars),
		onMutate: async (vars) => {
			const previous = await cancelAndSnapshot();
			const clientKey = crypto.randomUUID();
			updateCache((old) => ({
				...old,
				ingredientGroups: old.ingredientGroups.map((g) =>
					g.id === vars.groupId
						? { ...g, ingredients: [...g.ingredients, { ...vars, amount: "", units: "", name: "", preparation: "", clientKey }] }
						: g,
				),
			}));
			return { previous, clientKey };
		},
		onSuccess: ({ id }, _vars, ctx) => {
			updateCache((old) => ({
				...old,
				ingredientGroups: old.ingredientGroups.map((g) => ({
					...g,
					ingredients: g.ingredients.map((i) =>
						i.clientKey === ctx?.clientKey ? { ...i, id } : i,
					),
				})),
			}));
		},
		onError: (_err, _vars, ctx) => restore(ctx?.previous),
	});

	const updateIngredient = useMutation({
		...trpc.ingredient.update.mutationOptions(),
		onSuccess: (updated) => {
			updateCache((old) => ({
				...old,
				ingredientGroups: old.ingredientGroups.map((g) => ({
					...g,
					ingredients: g.ingredients.map((i) =>
						i.id === updated.id ? { ...i, ...updated } : i,
					),
				})),
			}));
		},
	});

	const removeIngredient = useMutation<
		IngredientData,
		Error,
		Model.Id,
		{ previous: CachedRecipeData | undefined }
	>({
		mutationFn: (vars) => trpcClient.ingredient.delete.mutate(vars),
		onMutate: async ({ id }) => {
			const previous = await cancelAndSnapshot();
			updateCache((old) => ({
				...old,
				ingredientGroups: old.ingredientGroups.map((g) => ({
					...g,
					ingredients: g.ingredients.filter((i) => i.id !== id),
				})),
			}));
			return { previous };
		},
		onError: (_err, _vars, ctx) => restore(ctx?.previous),
	});

	const updateIngredientField = makeFieldUpdater(Ingredient.Update, updateIngredient);

	// Steps
	const addStep = useMutation<
		{ id: number },
		Error,
		Step.Create,
		{ previous: CachedRecipeData | undefined; clientKey: string }
	>({
		mutationFn: (vars) => trpcClient.step.create.mutate(vars),
		onMutate: async (vars) => {
			const previous = await cancelAndSnapshot();
			const clientKey = crypto.randomUUID();
			updateCache((old) => ({
				...old,
				steps: [...old.steps, { ...vars, name: "", intro: "", clientKey, instructions: [] }],
			}));
			return { previous, clientKey };
		},
		onSuccess: ({ id }, _vars, ctx) => {
			updateCache((old) => ({
				...old,
				steps: old.steps.map((s) =>
					s.clientKey === ctx?.clientKey ? { ...s, id } : s,
				),
			}));
		},
		onError: (_err, _vars, ctx) => restore(ctx?.previous),
	});

	const updateStep = useMutation({
		...trpc.step.update.mutationOptions(),
		onSuccess: (updated) => {
			updateCache((old) => ({
				...old,
				steps: old.steps.map((s) =>
					s.id === updated.id ? { ...s, ...updated } : s,
				),
			}));
		},
	});

	const removeStep = useMutation<
		Omit<StepData, "instructions">,
		Error,
		Model.Id,
		{ previous: CachedRecipeData | undefined }
	>({
		mutationFn: (vars) => trpcClient.step.delete.mutate(vars),
		onMutate: async ({ id }) => {
			const previous = await cancelAndSnapshot();
			updateCache((old) => ({
				...old,
				steps: old.steps.filter((s) => s.id !== id),
			}));
			return { previous };
		},
		onError: (_err, _vars, ctx) => restore(ctx?.previous),
	});

	const updateStepField = makeFieldUpdater(Step.Update, updateStep);

	// Instructions
	const addInstruction = useMutation<
		{ id: number },
		Error,
		Instruction.Create,
		{ previous: CachedRecipeData | undefined; clientKey: string }
	>({
		mutationFn: (vars) => trpcClient.instruction.create.mutate(vars),
		onMutate: async (vars) => {
			const previous = await cancelAndSnapshot();
			const clientKey = crypto.randomUUID();
			updateCache((old) => ({
				...old,
				steps: old.steps.map((s) =>
					s.id === vars.stepId
						? { ...s, instructions: [...s.instructions, { ...vars, text: "", clientKey }] }
						: s,
				),
			}));
			return { previous, clientKey };
		},
		onSuccess: ({ id }, _vars, ctx) => {
			updateCache((old) => ({
				...old,
				steps: old.steps.map((s) => ({
					...s,
					instructions: s.instructions.map((i) =>
						i.clientKey === ctx?.clientKey ? { ...i, id } : i,
					),
				})),
			}));
		},
		onError: (_err, _vars, ctx) => restore(ctx?.previous),
	});

	const updateInstruction = useMutation({
		...trpc.instruction.update.mutationOptions(),
		onSuccess: (updated) => {
			updateCache((old) => ({
				...old,
				steps: old.steps.map((s) => ({
					...s,
					instructions: s.instructions.map((i) =>
						i.id === updated.id ? { ...i, ...updated } : i,
					),
				})),
			}));
		},
	});

	const removeInstruction = useMutation<
		InstructionData,
		Error,
		Model.Id,
		{ previous: CachedRecipeData | undefined }
	>({
		mutationFn: (vars) => trpcClient.instruction.delete.mutate(vars),
		onMutate: async ({ id }) => {
			const previous = await cancelAndSnapshot();
			updateCache((old) => ({
				...old,
				steps: old.steps.map((s) => ({
					...s,
					instructions: s.instructions.filter((i) => i.id !== id),
				})),
			}));
			return { previous };
		},
		onError: (_err, _vars, ctx) => restore(ctx?.previous),
	});

	const updateInstructionField = makeFieldUpdater(Instruction.Update, updateInstruction);

	return {
		updateRecipe,
		updateRecipeField,
		addIngredientGroup,
		updateIngredientGroupField,
		removeIngredientGroup,
		addIngredient,
		updateIngredientField,
		removeIngredient,
		addStep,
		updateStepField,
		removeStep,
		addInstruction,
		updateInstructionField,
		removeInstruction,
	};
}
