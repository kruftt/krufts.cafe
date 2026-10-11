import * as Ops from "@lib/recipe-draft";
import { type Draft, fieldSaver } from "@lib/recipe-draft";
import { useTRPCClient } from "@lib/trpc";
import { Recipe, RecipeBody } from "@schema";
import type { RecipeData } from "@services/recipe";
import { TRPCClientError } from "@trpc/client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type * as z from "zod";

const SAVE_DELAY_MS = 500;

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";

function useDraftState(initial: RecipeData) {
	const trpcClient = useTRPCClient();
	const recipeId = initial.id;

	const [draft, setDraft] = useState<Draft>(() => Ops.fromRecipe(initial));
	const [slug, setSlug] = useState(initial.slug);
	const [status, setStatus] = useState<SaveStatus>("saved");
	const [message, setMessage] = useState("");

	const draftRef = useRef(draft);
	const versionRef = useRef(initial.version);
	const dirtyRef = useRef(false);
	const inFlightRef = useRef(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	async function reload() {
		const fresh = await trpcClient.recipe.find.query({ id: recipeId });
		const next = Ops.fromRecipe(fresh);
		draftRef.current = next;
		versionRef.current = fresh.version;
		dirtyRef.current = false;
		setDraft(next);
		setSlug(fresh.slug);
	}

	async function flush() {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = null;
		if (inFlightRef.current || !dirtyRef.current) return;

		dirtyRef.current = false;
		inFlightRef.current = true;
		setStatus("saving");

		try {
			const result = await trpcClient.recipe.save.mutate({
				id: recipeId,
				version: versionRef.current,
				...draftRef.current,
			});
			versionRef.current = result.version;
			setSlug(result.slug);
			inFlightRef.current = false;
			setMessage("");
			if (dirtyRef.current) await flush();
			else setStatus("saved");
		} catch (err) {
			inFlightRef.current = false;
			if (err instanceof TRPCClientError && err.data?.code === "CONFLICT") {
				setStatus("conflict");
				setMessage("This recipe was changed in another tab. Reloaded the latest version; unsaved changes here were discarded.");
				await reload().catch(() => setStatus("error"));
				return;
			}
			dirtyRef.current = true;
			setStatus("error");
			setMessage(err instanceof Error ? err.message : "Save failed.");
		}
	}

	function update(fn: (d: Draft) => Draft) {
		const next = fn(draftRef.current);
		if (next === draftRef.current) return;
		draftRef.current = next;
		dirtyRef.current = true;
		setDraft(next);
		if (!inFlightRef.current) setStatus("dirty");
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(flush, SAVE_DELAY_MS);
	}

	// Flush pending edits when leaving the editor.
	// biome-ignore lint/correctness/useExhaustiveDependencies: flush reads refs only; run on unmount
	useEffect(() => {
		return () => {
			if (dirtyRef.current) void flush();
		};
	}, []);

	// Warn before closing the tab with unsaved edits.
	useEffect(() => {
		if (status === "saved" || status === "conflict") return;
		const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener("beforeunload", onBeforeUnload);
		return () => window.removeEventListener("beforeunload", onBeforeUnload);
	}, [status]);

	const saveRecipeField = <K extends "name" | "prepTime" | "cookTime" | "serves" | "intro">(field: K) =>
		fieldSaver(Recipe.Fields.shape[field] as unknown as z.ZodType<Recipe.Fields[K]>, update, (d, v) =>
			Ops.setField(d, field, v),
		);

	return {
		recipe: { id: recipeId, slug, user: initial.user },
		draft,
		status,
		message,
		retry: () => void flush(),
		update,

		saveRecipeField,
		setPublished: (published: boolean) => update((d) => Ops.setField(d, "published", published)),
		setTags: (tags: string[]) => update((d) => Ops.setField(d, "tags", tags)),

		addGroup: () => update((d) => Ops.addGroup(d)),
		removeGroup: (id: string) => update((d) => Ops.removeGroup(d, id)),
		saveGroupField: (id: string, field: "name") =>
			fieldSaver(RecipeBody.IngredientGroup.shape[field], update, (d, v) =>
				Ops.updateGroup(d, id, { [field]: v }),
			),

		addIngredient: (groupId: string) => update((d) => Ops.addIngredient(d, groupId)),
		removeIngredient: (id: string) => update((d) => Ops.removeIngredient(d, id)),
		saveIngredientField: (id: string, field: "amount" | "units" | "name" | "preparation") =>
			fieldSaver(RecipeBody.Ingredient.shape[field] as z.ZodType<string>, update, (d, v) =>
				Ops.updateIngredient(d, id, { [field]: v }),
			),

		addStep: () => update((d) => Ops.addStep(d)),
		removeStep: (id: string) => update((d) => Ops.removeStep(d, id)),
		saveStepField: (id: string, field: "name" | "intro") =>
			fieldSaver(RecipeBody.Step.shape[field], update, (d, v) => Ops.updateStep(d, id, { [field]: v })),

		addInstruction: (stepId: string) => update((d) => Ops.addInstruction(d, stepId)),
		removeInstruction: (id: string) => update((d) => Ops.removeInstruction(d, id)),
		saveInstructionField: (id: string, field: "text") =>
			fieldSaver(RecipeBody.Instruction.shape[field], update, (d, v) =>
				Ops.updateInstruction(d, id, { [field]: v }),
			),
	};
}

export type RecipeDraftContextValue = ReturnType<typeof useDraftState>;

const RecipeDraftContext = createContext<RecipeDraftContextValue | null>(null);

export function RecipeDraftProvider({ recipe, children }: React.PropsWithChildren<{ recipe: RecipeData }>) {
	const value = useDraftState(recipe);
	return <RecipeDraftContext value={value}>{children}</RecipeDraftContext>;
}

export function useRecipeDraft(): RecipeDraftContextValue {
	const ctx = useContext(RecipeDraftContext);
	if (!ctx) throw new Error("useRecipeDraft used outside RecipeDraftProvider");
	return ctx;
}
