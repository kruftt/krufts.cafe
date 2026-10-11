---
title: Recipe Draft Store - Plan
type: refactor
date: 2026-10-11
execution: code
---

# Recipe Draft Store - Plan

## Goal

Make the recipe draft the editor's single source of truth. Keystrokes write straight to the draft. Each component subscribes only to the slice it renders, so typing re-renders only the input being edited. Autosave reads the draft directly, so it never misses text that hasn't been committed yet.

**Removes:** blur-to-commit, `useEditor` with its prop-sync block, `fieldSaver`, and the need for any registry of pending inputs.

**Keeps:** the pure `Draft → Draft` operations in `app/lib/recipe-draft.ts`, the save protocol (whole document, version-checked `recipe.save`), immediate saves when the tab is hidden, Live is clicked or the editor unmounts, and immediate follow-up saves for edits made during a save.

**Changes the autosave timing** (D9): at least 5 s after the first unsaved edit, then wait for 1 s without edits, but never more than 30 s after the first unsaved edit.

**Out of scope:** undo/redo, patch-based saves, and saving before navigation through the site header (`useBlocker`).

## Key decisions

- **D1. The draft is form state.** Every editable value is stored exactly as typed. `prepTime` and `cookTime` become strings in `Draft`; they are the only fields whose type changes. Values are converted and validated as a whole only at save time. This is why the draft can be the single source of truth: no lossy text ↔ value mapping, so inputs never need local text.
- **D2. A per-editor jotai store, not the root store.** `app/root.tsx:75` recreates the root store whenever root loader data changes. A draft held there could be swapped out from under the controller. The controller creates its own store with `createStore()`, and components read from it with `useAtomValue(atom, { store })`. This avoids a nested `<Provider>`, which would hide the global atoms (session, pins) from the editor.
- **D3. A framework-free controller.** `createDraftController(initial, deps)` in `app/lib/recipe-draft-controller.ts` owns the store, the timer, dirty tracking and save sequencing. tRPC is injected through `deps`, so the controller can be unit-tested with `bun:test` without React.
- **D4. A stable context value.** The context holds the controller object, created once with `useState`. Status and message are atoms in the controller's store, so a status change re-renders only `SaveStatus` and the provider (whose `children` element is unchanged, so nothing below it re-renders).
- **D5. Slice subscriptions.** Each component subscribes with a memoized `selectAtom`:
  - field inputs subscribe to their string;
  - list parents subscribe to id arrays, using a shallow-equality check;
  - list items are `memo` components whose props are only ids and indexes.

  The draft operations already preserve object identity for unchanged parts, so unchanged slices compare equal.
- **D6. Field specs.** A small pure table (`DraftField`: `key`, `get`, `set`, `schema`) describes every editable string field. Inputs bind to a spec instead of to ad hoc callbacks. `key` is a stable string (e.g. `"ingredient:<id>:amount"`) used to memoize the selector.
- **D7. Validation at the edges.**
  - **Per field:** validated on blur and on Enter in single-line inputs. The error is local UI state in the field component. While an error is showing, each change re-validates and clears it once the value is valid. Typing never adds a new error.
  - **Whole draft:** validated before each save by `parseDraft`. If it's invalid, no request is sent; status becomes `invalid` with a message; the draft stays dirty; the next edit re-arms the timer. `saveNow()` returns false, so Live stays put and `beforeunload` still warns.
  - **Pausing mid-value:** D9 waits for a 1 s pause, so this only happens when the user pauses for over a second (or hits the 30 s cap) while a field holds an invalid value (e.g. `1/` on the way to `1/2`). The status shows `invalid` and the save is skipped. The next keystroke sets the status back to `dirty` and re-arms the timer. This is accepted: it's honest, and the alternative (substituting last-saved values for invalid fields) would bring back a second copy of the state.
- **D9. Minimum delay, then wait for a pause, with a cap.** The first unsaved edit records `firstEditAt` and starts a `delayMs` (5 s) timer. Every edit records `lastEditAt`. When the timer fires, it saves if the user has been idle for at least `idleMs` (1 s) or if `maxWaitMs` (30 s) has passed since `firstEditAt`. Otherwise it reschedules itself for the rest of the idle window. This mostly avoids saving mid-word and mid-value (which shrinks the D7 mid-typing case to "paused for over 1 s on an invalid value"), and the cap stops steady typing from postponing the save forever. Immediate saves (hidden tab, Live, unmount) ignore it.
- **D8. The tag input stays local.** "Add new tag..." is an add-form, not a draft field. `TagsEditor` keeps its own text and error with `useState`, and writes only through `setTags`.

## Design

### Draft and fields (`app/lib/recipe-draft.ts`)

```ts
export type Draft = Omit<Recipe.Fields, "prepTime" | "cookTime"> & {
  prepTime: string; cookTime: string; body: RecipeBody.Body;
};

export function fromRecipe(recipe: Recipe.Fields & { body: RecipeBody.Body }): Draft  // times → String()
export function parseDraft(draft: Draft):
  | { ok: true; value: Recipe.Fields & { body: RecipeBody.Body } }
  | { ok: false; message: string }
// Checks times with Minutes, then parses { ...draft, prepTime: Number(..), cookTime: Number(..) }
// with Recipe.Fields.extend({ body: RecipeBody.Body }). Message is generic ("Can't save until invalid
// fields are fixed."): zod paths like body.ingredientGroups.0.ingredients.2.amount aren't readable,
// and the offending field shows its own error on blur.

const Minutes = z.string().regex(/^\d+$/, "Whole minutes only.");

export interface DraftField { key: string; get(d: Draft): string; set(d: Draft, v: string): Draft; schema: z.ZodType<string>; }
export const Field = {
  recipe(name: "name" | "prepTime" | "cookTime" | "serves" | "intro"): DraftField,
  group(id: string, name: "name"): DraftField,
  ingredient(id: string, name: "amount" | "units" | "name" | "preparation"): DraftField,
  step(id: string, name: "name" | "intro"): DraftField,
  instruction(id: string, name: "text"): DraftField,
};
// get returns "" for a missing item (one may be read in the render just before its parent drops it).
// set goes through setField / updateGroup / updateIngredient / updateStep / updateInstruction.
// Schemas: Recipe.Fields.shape.{name,serves,intro}, Minutes for times, RecipeBody shapes for body fields.

export function groupIds(d: Draft): string[]
export function ingredientIds(d: Draft, groupId: string): string[]
export function stepIds(d: Draft): string[]
export function instructionIds(d: Draft, stepId: string): string[]
export function sameIds(a: string[], b: string[]): boolean
```

`setField` is widened to `keyof Omit<Draft, "body">` with `Draft[K]` values. `fieldSaver`, `FieldSaver`, and the `ProcedureOptions` import are deleted.

### Controller (`app/lib/recipe-draft-controller.ts`)

```ts
export class DraftConflictError extends Error {}
export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict" | "invalid";

interface Deps {
  save(input: Recipe.Save): Promise<{ version: number }>;  // throws DraftConflictError on CONFLICT
  load(): Promise<Recipe.Fields & { body: RecipeBody.Body; version: number }>;
  delayMs: number;    // 5000: minimum wait after the first unsaved edit
  idleMs: number;     // 1000: then wait for this long without edits
  maxWaitMs: number;  // 30000: but never longer than this after the first unsaved edit
  now?: () => number; // defaults to Date.now; injectable for tests
}

export function createDraftController(initial: RecipeData, deps: Deps) → {
  store, draftAtom, statusAtom, messageAtom,
  recipe: { id, user },                  // static
  update(fn: (d: Draft) => Draft): void,
  setField(field: DraftField, value: string): void,
  flush(): Promise<void>, saveNow(): Promise<boolean>, isDirty(): boolean,
  setPublished, setTags, addGroup, removeGroup, addIngredient, removeIngredient,
  addStep, removeStep, addInstruction, removeInstruction,
}
```

The controller's state is plain variables: `version`, `dirty`, `saving: Promise<void> | null`, `timer`, `firstEditAt`, `lastEditAt`. It reads and writes the draft with `store.get`/`store.set`.

- **`update(fn)`:** if `fn` returns the same draft, it does nothing. Otherwise it sets the draft, marks it dirty and records `lastEditAt = now()`. If no save is running, status becomes `dirty`. If no timer is pending, it records `firstEditAt = now()` and sets `timer = setTimeout(onTimer, delayMs)`.
- **`onTimer()`** (internal): computes `idle = now() - lastEditAt`. If `idle < idleMs` and `now() - firstEditAt < maxWaitMs`, it sets `timer = setTimeout(onTimer, idleMs - idle)`. Otherwise it calls `flush()`.
- **`flush()`:** clears the timer, then `saving ??= save().finally(() => saving = null)` and returns `saving`.
- **`save()`** (internal):
  1. If not dirty, return.
  2. Run `parseDraft`. If invalid: status `invalid`, message set, stay dirty, return.
  3. Clear dirty, status `saving`, call `deps.save({ id, version, ...value })`.
  4. On success: store the new version and clear the message. If dirty again, run `save()` once more; otherwise status `saved`.
  5. On `DraftConflictError`: status `conflict`, then `load()` and set the draft, version and `dirty = false`. If `load` fails: status `error`.
  6. On any other error: set dirty, status `error`, message.
- **`saveNow()`:** `await flush(); return !dirty`.

This is the same logic as today's `useDraftState`, moved out of React.

### Hooks (`app/hooks/recipe-draft.tsx`)

- **`RecipeDraftProvider({ recipe })`:** creates the controller once with `useState`. `deps.save` wraps `trpcClient.recipe.save.mutate` and maps a `TRPCClientError` with code `CONFLICT` to `DraftConflictError`; `deps.load` wraps `recipe.find.query`; the timings are 5000 / 1000 / 30000. The provider has three effects, moved from today's hook: flush on unmount, flush when `visibilitychange` reports hidden, and `beforeunload` while the status (read with `useAtomValue(statusAtom, { store })`) is neither `saved` nor `conflict`.
- **`useRecipeDraft()`:** returns the controller.
- **`useDraftSelect(select, deps, equal?)`:** `useAtomValue(useMemo(() => selectAtom(draftAtom, select, equal), deps), { store })`. This is the only place that needs a biome-ignore for exhaustive dependencies.
- **`useFieldValue(field)`:** `useDraftSelect(field.get, [field.key])`.
- **List hooks:** `useGroupIds()`, `useIngredientIds(groupId)`, `useStepIds()`, `useInstructionIds(stepId)`, all using `sameIds` for equality.
- **Other hooks:** `useTags()`, `usePublished()`, `useSaveStatus()` (returns `{ status, message }`).

`app/hooks/editor.ts` is deleted, and its export is removed from `app/hooks/index.ts`.

### Controls

- **`InputEditor` / `TextareaEditor`** (`app/components/controls`) become presentational: `value`, `onChange(value: string)`, `error?`, plus native props. They keep their current markup and classes, minus `busy`/`disabled`. The `clear`, `reset` and `ctrl` options are gone.
- **New `app/components/recipe/editor/draft-field.tsx`:** `DraftInput` and `DraftTextarea` take `{ field: DraftField }` plus native props. Each uses `useFieldValue(field)`, writes changes with `controller.setField(field, v)`, and keeps the local `error` state described in D7.

### Components

| Component | Props | Subscribes to |
|---|---|---|
| `RecipeEditor` | – | `useGroupIds`, `useStepIds` |
| `PublishToggle` (new, in recipe-editor.tsx) | – | `usePublished` |
| `LiveLink` (new, in recipe-editor.tsx) | – | name; click → `saveNow()` then navigate (as now) |
| `TotalTime` (new, in recipe-editor.tsx) | – | `prepTime`, `cookTime` → `Number(x) \|\| 0` sum |
| `TagsEditor` | – | `useTags`; new-tag text/error are local state |
| `IngredientGroupEditor` (memo) | `groupId` | `useIngredientIds(groupId)`, group name (for `DeletionDialog`) |
| `IngredientEditor` (memo) | `ingredientId` | – (four `DraftInput`/`DraftTextarea`) |
| `StepEditor` (memo) | `stepId`, `index` | `useInstructionIds(stepId)`, step name (for `DeletionDialog`) |
| `InstructionEditor` (memo) | `instructionId`, `index` | – |
| `SaveStatus` | – | `useSaveStatus`; adds an `invalid` state (alert icon + message, no Retry) |

Header fields (name, prep, cook, serves, intro) render as `DraftInput`/`DraftTextarea` directly inside `RecipeEditor`. That's safe because their subscriptions live in those child components, not in `RecipeEditor`. The author name comes from `controller.recipe.user`. Focus-after-add logic (`requestAnimationFrame` + DOM query) is unchanged.

## Units

1. **U1. Draft model.** Change `Draft`, `fromRecipe`; add `parseDraft`, `Minutes`, `Field`, id selectors, `sameIds`; widen `setField`; delete `fieldSaver`.
   - Tests in `recipe-draft.test.ts`:
     - update `base` to string times;
     - replace the `fieldSaver` tests with `Field` get/set round trips (including the missing-id → `""` case);
     - `parseDraft`: valid, empty name, `prepTime: ""`, `prepTime: "1a"`;
     - `sameIds`.
2. **U2. Controller.** Add `recipe-draft-controller.ts` and `recipe-draft-controller.test.ts`, using a fake `save`/`load`, short timings (`delayMs: 40`, `idleMs: 20`, `maxWaitMs: 120`), and real waits with margin. Cases:
   - an unchanged update leaves the draft clean;
   - several edits produce one save, sent with the latest draft;
   - with no edits after the first, it saves at about `delayMs`;
   - an edit shortly before `delayMs` pushes the save to about `idleMs` after that edit;
   - edits every `idleMs / 2` save once `maxWaitMs` is reached;
   - an edit made during a save produces a follow-up save, and `saveNow` resolves after it;
   - an invalid draft sends no request: status `invalid`, `saveNow` false; once fixed, it saves;
   - a conflict reloads the draft: status `conflict`, not dirty;
   - an error sets status `error` and stays dirty; `flush` retries successfully.
3. **U3. Hooks.** Rewrite `app/hooks/recipe-draft.tsx` as in Design; delete `app/hooks/editor.ts` and its export.
4. **U4. Controls.** Make `InputEditor`/`TextareaEditor` presentational; add `draft-field.tsx`.
5. **U5. Components.** Rewire per the table; add `memo`; update `SaveStatus`; rewrite the `TagsEditor` input with local state.
6. **U6. Verify.**
   - Run `bunx tsc --noEmit`, `bun test`, and `bunx biome lint` on the changed files.
   - Manual check in the browser:
     - typing shows "Unsaved changes"; the save happens 1 s after you stop typing (no earlier than 5 s after the first keystroke), including while focus stays in the field;
     - typing nonstop saves by 30 s;
     - React DevTools "highlight updates" shows only the edited input re-rendering;
     - clearing a time field shows its error on blur, the status shows invalid, and saving resumes once it's fixed;
     - Live saves first;
     - adding or deleting groups, ingredients, steps and instructions works, and focus-after-add works;
     - tags can be added and removed, and the duplicate-tag error shows;
     - an edit in a second tab produces the conflict message and the draft reloads.

The app type-checks again only after U5, so apply the type-check gate at U6.

## Coherence check

- **Is the draft really the single source of truth?** Yes. Inputs render `useFieldValue` and write `setField`, with no local copy of the text. The only local state left is per-field `error` (UI-only) and the new-tag text (not draft data, D8).
- **Does the timing compose with save sequencing?** Yes. `onTimer` only ever ends in `flush()`, so all saves still go through the single `saving` promise. Edits made during a save set `dirty` and are picked up by the follow-up save. Because that save clears `timer`, the next edit starts a fresh window and sets a new `firstEditAt`. Immediate saves call `flush()` directly, which clears any pending timer.
- **Does save ever miss text?** No. Every keystroke is in the store before the timer, Live, a hidden tab or unmount can trigger a save.
- **Can an invalid value reach the server?** No. `parseDraft` uses the same zod schemas as `recipe.save`, and the times are checked with `Minutes` before conversion. That closes the `"" → 0` coercion gap.
- **Does a conflict reload update the inputs?** Yes. The inputs are controlled from the store, which is the job today's prop-sync block did, so they update for free.
- **Re-render scope.**
  - Typing in a field re-renders only that `DraftInput`.
  - Typing in a group or step name also re-renders its parent editor (for the dialog name); its memo'd children are skipped.
  - Typing the recipe name re-renders `LiveLink`.
  - Typing a time re-renders `TotalTime`.
  - Adding or removing an item re-renders its list parent; existing memo'd siblings are skipped.
  - Status changes re-render `SaveStatus` and the provider only.
- **Is the store stable across root revalidation?** Yes. It's owned by the controller (D2), and the controller lives as long as the `RecipeDraftProvider` instance (keyed by recipe id in `edit.$id.tsx`, which has `shouldRevalidate: false`).
- **StrictMode.** In development the `useState` initializer may run twice; the discarded controller has no timer because timers start only on `update`. The double-run effect cleanup flushes a clean draft, which is a no-op.
- **Selector cost.** Each draft change re-runs every field selector: about 4 per ingredient, and `Field.ingredient.get` scans the groups. Even at the schema limits that's cheap in practice (tens of thousands of comparisons per keystroke). If it ever shows up in profiling, index ids once per draft with a `WeakMap<Draft, Map>`.
- **Nothing else uses the removed APIs.** `useEditor`, `ProcedureOptions` and `fieldSaver` are used only by the two controls, `tags-editor.tsx` and `recipe-draft.ts`, all of which this plan rewrites. `InputEditor`/`TextareaEditor` are used only inside `components/recipe/editor`.
