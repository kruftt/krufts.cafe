import type { Recipe } from "@schema";
import type { RecipeData } from "@services/recipe";
import { atom, createStore } from "jotai";
import * as Ops from "./recipe-draft";
import type { Draft, DraftField, DraftValues } from "./recipe-draft";

export class DraftConflictError extends Error {}

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict" | "invalid";

export interface DraftControllerDeps {
	/** Throws DraftConflictError when the recipe was changed elsewhere. */
	save: (input: Recipe.Save) => Promise<{ version: number }>;
	load: () => Promise<DraftValues & { version: number }>;
	/** Minimum wait after the first unsaved edit. */
	delayMs: number;
	/** Then wait for this long without edits... */
	idleMs: number;
	/** ...but never longer than this after the first unsaved edit. */
	maxWaitMs: number;
	now?: () => number;
}

export type DraftController = ReturnType<typeof createDraftController>;

// Owns the draft and its autosave, outside React. The draft lives in its own jotai store:
// the root store is rebuilt when root loader data changes, which would swap the draft out.
export function createDraftController(initial: RecipeData, deps: DraftControllerDeps) {
	const now = deps.now ?? Date.now;
	const store = createStore();
	const draftAtom = atom<Draft>(Ops.fromRecipe(initial));
	const statusAtom = atom<SaveStatus>("saved");
	const messageAtom = atom("");

	let version = initial.version;
	let dirty = false;
	let saving: Promise<void> | null = null;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let firstEditAt = 0;
	let lastEditAt = 0;

	function setStatus(status: SaveStatus, message = "") {
		store.set(statusAtom, status);
		store.set(messageAtom, message);
	}

	function update(fn: (d: Draft) => Draft) {
		const prev = store.get(draftAtom);
		const next = fn(prev);
		if (next === prev) return;
		store.set(draftAtom, next);
		dirty = true;
		lastEditAt = now();
		if (!saving) setStatus("dirty");
		if (!timer) {
			firstEditAt = lastEditAt;
			timer = setTimeout(onTimer, deps.delayMs);
		}
	}

	// Save once the user pauses, but no sooner than delayMs and no later than maxWaitMs after the first edit.
	function onTimer() {
		const idle = now() - lastEditAt;
		if (idle < deps.idleMs && now() - firstEditAt < deps.maxWaitMs) {
			timer = setTimeout(onTimer, deps.idleMs - idle);
			return;
		}
		void flush();
	}

	// Save pending edits now. Calls during a save share its promise, which resolves once
	// nothing is left dirty (edits made mid-save go out in a follow-up) or the save fails.
	function flush() {
		if (timer) clearTimeout(timer);
		timer = null;
		saving ??= save().finally(() => {
			saving = null;
		});
		return saving;
	}

	async function save(): Promise<void> {
		if (!dirty) return;

		const parsed = Ops.parseDraft(store.get(draftAtom));
		if (!parsed.ok) {
			setStatus("invalid", parsed.message);
			return;
		}

		dirty = false;
		setStatus("saving");

		try {
			const result = await deps.save({ id: initial.id, version, ...parsed.value });
			version = result.version;
			if (dirty) await save();
			else setStatus("saved");
		} catch (err) {
			if (err instanceof DraftConflictError) {
				setStatus(
					"conflict",
					"This recipe was changed in another tab. Reloaded the latest version; unsaved changes here were discarded.",
				);
				try {
					const fresh = await deps.load();
					store.set(draftAtom, Ops.fromRecipe(fresh));
					version = fresh.version;
					dirty = false;
				} catch {
					setStatus("error", "Couldn't reload the latest version.");
				}
				return;
			}
			dirty = true;
			setStatus("error", err instanceof Error ? err.message : "Save failed.");
		}
	}

	return {
		store,
		draftAtom,
		statusAtom,
		messageAtom,
		recipe: { id: initial.id, user: initial.user },

		update,
		flush,
		/** Resolves true once everything is saved, false if the draft is invalid or the save failed. */
		saveNow: async () => {
			await flush();
			return !dirty;
		},
		isDirty: () => dirty,

		setField: (field: DraftField, value: string) => update((d) => field.set(d, value)),
		setPublished: (published: boolean) => update((d) => Ops.setField(d, "published", published)),
		setTags: (tags: string[]) => update((d) => Ops.setField(d, "tags", tags)),

		addGroup: () => update((d) => Ops.addGroup(d)),
		removeGroup: (id: string) => update((d) => Ops.removeGroup(d, id)),
		addIngredient: (groupId: string) => update((d) => Ops.addIngredient(d, groupId)),
		removeIngredient: (id: string) => update((d) => Ops.removeIngredient(d, id)),
		addStep: () => update((d) => Ops.addStep(d)),
		removeStep: (id: string) => update((d) => Ops.removeStep(d, id)),
		addInstruction: (stepId: string) => update((d) => Ops.addInstruction(d, stepId)),
		removeInstruction: (id: string) => update((d) => Ops.removeInstruction(d, id)),
	};
}
