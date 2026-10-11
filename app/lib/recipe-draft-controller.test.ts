import { describe, expect, it, mock } from "bun:test";
import type { Recipe } from "@schema";
import type { RecipeData } from "@services/recipe";
import { createDraftController, DraftConflictError, type DraftControllerDeps } from "./recipe-draft-controller";
import { Field } from "./recipe-draft";

const DELAY = 40;
const IDLE = 20;
const MAX_WAIT = 120;

const initial = {
	id: 1,
	version: 3,
	name: "Soup",
	tags: [],
	published: false,
	prepTime: 5,
	cookTime: 20,
	serves: "2",
	intro: "",
	body: { ingredientGroups: [], steps: [] },
	user: { name: "Kruft", handle: "kruft" },
} as unknown as RecipeData;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function setup(overrides: Partial<DraftControllerDeps> = {}) {
	let version = initial.version;
	const save = mock(async (_input: Recipe.Save) => ({ version: ++version }));
	const load = mock(async () => ({ ...initial, name: "Server Soup", version: 10 }));
	const c = createDraftController(initial, {
		save,
		load,
		delayMs: DELAY,
		idleMs: IDLE,
		maxWaitMs: MAX_WAIT,
		...overrides,
	});
	const status = () => c.store.get(c.statusAtom);
	const draft = () => c.store.get(c.draftAtom);
	return { c, save, load, status, draft };
}

const name = Field.recipe("name");
const prep = Field.recipe("prepTime");

describe("createDraftController", () => {
	it("ignores updates that don't change the draft", () => {
		const { c, status } = setup();
		c.setField(name, "Soup");
		expect(c.isDirty()).toBe(false);
		expect(status()).toBe("saved");
	});

	it("groups edits into one save with the latest draft and converted times", async () => {
		const { c, save, status } = setup();
		c.setField(name, "Stew");
		c.setField(prep, "7");
		expect(status()).toBe("dirty");

		await sleep(DELAY + IDLE + 20);
		expect(save).toHaveBeenCalledTimes(1);
		expect(save.mock.calls[0]?.[0]).toMatchObject({ id: 1, version: 3, name: "Stew", prepTime: 7 });
		expect(status()).toBe("saved");
	});

	it("saves at about delayMs when there are no further edits", async () => {
		const { c, save } = setup();
		c.setField(name, "Stew");
		await sleep(DELAY - 15);
		expect(save).not.toHaveBeenCalled();
		await sleep(30);
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("waits for a pause when an edit lands just before delayMs", async () => {
		const { c, save } = setup();
		c.setField(name, "Stew");
		await sleep(DELAY - 10);
		c.setField(name, "Stews");
		await sleep(15); // past delayMs, but only ~15ms idle
		expect(save).not.toHaveBeenCalled();
		await sleep(IDLE + 15);
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("saves at maxWaitMs during continuous editing", async () => {
		const { c, save } = setup();
		const start = Date.now();
		while (Date.now() - start < MAX_WAIT + 40 && save.mock.calls.length === 0) {
			c.setField(name, `Stew ${Date.now()}`);
			await sleep(IDLE / 2);
		}
		expect(save).toHaveBeenCalled();
		expect(Date.now() - start).toBeLessThan(MAX_WAIT + 40);
	});

	it("sends edits made during a save in a follow-up, and saveNow waits for it", async () => {
		let release!: () => void;
		let version = 3;
		const save = mock(async (_input: Recipe.Save) => {
			if (save.mock.calls.length === 1) await new Promise<void>((r) => (release = r));
			return { version: ++version };
		});
		const { c, status } = setup({ save });

		c.setField(name, "Stew");
		const first = c.flush();
		expect(status()).toBe("saving");
		c.setField(name, "Stews");
		expect(status()).toBe("saving");

		const done = c.saveNow();
		release();
		expect(await done).toBe(true);
		await first;
		expect(save).toHaveBeenCalledTimes(2);
		expect(save.mock.calls[1]?.[0]).toMatchObject({ name: "Stews", version: 4 });
		expect(status()).toBe("saved");
	});

	it("skips saving an invalid draft and resumes once it is fixed", async () => {
		const { c, save, status } = setup();
		c.setField(prep, "");
		expect(await c.saveNow()).toBe(false);
		expect(save).not.toHaveBeenCalled();
		expect(status()).toBe("invalid");
		expect(c.isDirty()).toBe(true);

		c.setField(prep, "12");
		expect(status()).toBe("dirty");
		expect(await c.saveNow()).toBe(true);
		expect(save.mock.calls[0]?.[0]).toMatchObject({ prepTime: 12 });
	});

	it("reloads the draft on a conflict", async () => {
		const save = mock(async () => {
			throw new DraftConflictError();
		});
		const { c, load, status, draft } = setup({ save });
		c.setField(name, "Stew");
		expect(await c.saveNow()).toBe(true);
		expect(load).toHaveBeenCalledTimes(1);
		expect(status()).toBe("conflict");
		expect(draft().name).toBe("Server Soup");
		expect(c.isDirty()).toBe(false);
	});

	it("stays dirty after a failed save and succeeds on retry", async () => {
		let fail = true;
		const save = mock(async () => {
			if (fail) throw new Error("Network down");
			return { version: 4 };
		});
		const { c, status } = setup({ save });
		c.setField(name, "Stew");
		expect(await c.saveNow()).toBe(false);
		expect(status()).toBe("error");
		expect(c.store.get(c.messageAtom)).toBe("Network down");

		fail = false;
		expect(await c.saveNow()).toBe(true);
		expect(status()).toBe("saved");
	});

	it("cancels the pending timer when saving immediately", async () => {
		const { c, save } = setup();
		c.setField(name, "Stew");
		await c.saveNow();
		await sleep(DELAY + IDLE + 20);
		expect(save).toHaveBeenCalledTimes(1);
	});
});
