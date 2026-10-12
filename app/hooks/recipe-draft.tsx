import type { Draft, DraftField } from "@lib/recipe-draft";
import * as Ops from "@lib/recipe-draft";
import { createDraftController, DraftConflictError, type DraftController } from "@lib/recipe-draft-controller";
import { useTRPCClient } from "@lib/trpc";
import type { RecipeData } from "@services/recipe";
import { TRPCClientError } from "@trpc/client";
import { useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const RecipeDraftContext = createContext<DraftController | null>(null);

export function RecipeDraftProvider({ recipe, children }: React.PropsWithChildren<{ recipe: RecipeData }>) {
	const trpcClient = useTRPCClient();
	const [controller] = useState(() =>
		createDraftController(recipe, {
			save: async (input) => {
				try {
					return await trpcClient.recipe.save.mutate(input);
				} catch (err) {
					if (err instanceof TRPCClientError && err.data?.code === "CONFLICT") throw new DraftConflictError();
					throw err;
				}
			},
			load: () => trpcClient.recipe.find.query({ id: recipe.id }),
			delayMs: 5000,
			idleMs: 1000,
			maxWaitMs: 30000,
		}),
	);
	const status = useAtomValue(controller.statusAtom, { store: controller.store });

	// Flush pending edits when leaving the editor.
	useEffect(() => {
		return () => {
			if (controller.isDirty()) void controller.flush();
		};
	}, [controller]);

	// Save right away when the tab is hidden; mobile browsers may kill it without warning.
	useEffect(() => {
		const onVisibilityChange = () => {
			if (document.visibilityState === "hidden") void controller.flush();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => document.removeEventListener("visibilitychange", onVisibilityChange);
	}, [controller]);

	// Warn before closing the tab with unsaved edits.
	useEffect(() => {
		if (status === "saved" || status === "conflict") return;
		const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener("beforeunload", onBeforeUnload);
		return () => window.removeEventListener("beforeunload", onBeforeUnload);
	}, [status]);

	return <RecipeDraftContext value={controller}>{children}</RecipeDraftContext>;
}

export function useRecipeDraft(): DraftController {
	const ctx = useContext(RecipeDraftContext);
	if (!ctx) throw new Error("useRecipeDraft used outside RecipeDraftProvider");
	return ctx;
}

// Subscribes to one slice of the draft; the component re-renders only when that slice changes.
function useDraftSelect<T>(select: (d: Draft) => T, deps: unknown[], equal?: (a: T, b: T) => boolean) {
	const { store, draftAtom } = useRecipeDraft();
	// biome-ignore lint/correctness/useExhaustiveDependencies: callers pass the values `select` closes over
	const selected = useMemo(() => selectAtom(draftAtom, select, equal), [draftAtom, ...deps]);
	return useAtomValue(selected, { store });
}

export function useFieldValue(field: DraftField) {
	return useDraftSelect(field.get, [field.key]);
}

export function useGroupIds() {
	return useDraftSelect(Ops.groupIds, [], Ops.sameIds);
}

export function useIngredientIds(groupId: string) {
	return useDraftSelect((d) => Ops.ingredientIds(d, groupId), [groupId], Ops.sameIds);
}

export function useStepIds() {
	return useDraftSelect(Ops.stepIds, [], Ops.sameIds);
}

export function useInstructionIds(stepId: string) {
	return useDraftSelect((d) => Ops.instructionIds(d, stepId), [stepId], Ops.sameIds);
}

export function useIngredientGroups() {
	return useDraftSelect((d) => d.body.ingredientGroups, []);
}

export function useTags() {
	return useDraftSelect((d) => d.tags, []);
}

export function usePublished() {
	return useDraftSelect((d) => d.published, []);
}

export function useSaveStatus() {
	const { store, statusAtom, messageAtom } = useRecipeDraft();
	return {
		status: useAtomValue(statusAtom, { store }),
		message: useAtomValue(messageAtom, { store }),
	};
}
