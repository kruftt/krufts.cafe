import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { prisma } from "@lib/prisma";
import type { Recipe, RecipeBody } from "@schema";
import { findRecipes, ingredientNamesOf, saveRecipe } from "./recipe";

const body: RecipeBody.Body = {
	ingredientGroups: [
		{
			id: "g1",
			name: "Dough",
			ingredients: [
				{ id: "i1", amount: "2", units: "cup", name: "Flour", preparation: "" },
				{ id: "i2", amount: "1", units: "tsp", name: "Salt", preparation: "" },
			],
		},
	],
	steps: [{ id: "s1", name: "Mix", intro: "", instructions: [{ id: "n1", text: "Stir." }] }],
};

describe("ingredientNamesOf", () => {
	it("collects ingredient names across groups in order", () => {
		expect(ingredientNamesOf(body)).toEqual(["Flour", "Salt"]);
	});

	it("drops blank names, trims, and removes duplicates", () => {
		const names = ingredientNamesOf({
			steps: [],
			ingredientGroups: [
				{ id: "g1", name: "", ingredients: [
					{ id: "a", amount: "", units: "", name: " Butter ", preparation: "" },
					{ id: "b", amount: "", units: "", name: "", preparation: "" },
				] },
				{ id: "g2", name: "", ingredients: [
					{ id: "c", amount: "", units: "", name: "Butter", preparation: "" },
					{ id: "d", amount: "", units: "", name: "Sugar", preparation: "" },
				] },
			],
		});
		expect(names).toEqual(["Butter", "Sugar"]);
	});

	it("handles an empty body", () => {
		expect(ingredientNamesOf({ ingredientGroups: [], steps: [] })).toEqual([]);
	});
});

describe("saveRecipe (database)", () => {
	const ownerId = `test-owner-${crypto.randomUUID()}`;
	const otherId = `test-other-${crypto.randomUUID()}`;
	let recipeId: number;

	const payload = (overrides: Partial<Recipe.Save> = {}): Recipe.Save => ({
		id: recipeId,
		version: 0,
		name: "Test Bread",
		tags: ["baking"],
		published: false,
		prepTime: 10,
		cookTime: 30,
		serves: "4",
		intro: "A loaf.",
		body,
		...overrides,
	});

	beforeAll(async () => {
		for (const id of [ownerId, otherId]) {
			await prisma.user.create({
				data: { id, name: "Tester", email: `${id}@example.test`, handle: id },
			});
		}
	});

	beforeEach(async () => {
		await prisma.recipe.deleteMany({ where: { userId: { in: [ownerId, otherId] } } });
		const recipe = await prisma.recipe.create({ data: { name: "Draft", userId: ownerId } });
		recipeId = recipe.id;
	});

	afterAll(async () => {
		await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
	});

	it("saves every field with the current version", async () => {
		const result = await saveRecipe(ownerId, payload());
		expect(result).toEqual({ ok: true, version: 1, slug: "test-bread" });

		const saved = await prisma.recipe.findUniqueOrThrow({ where: { id: recipeId } });
		expect(saved).toMatchObject({
			name: "Test Bread",
			slug: "test-bread",
			tags: ["baking"],
			prepTime: 10,
			cookTime: 30,
			serves: "4",
			intro: "A loaf.",
			version: 1,
			body,
		});
		expect(saved.ingredientNames).toEqual(["Flour", "Salt"]);
	});

	it("rejects a stale version and changes nothing", async () => {
		await saveRecipe(ownerId, payload());
		const result = await saveRecipe(ownerId, payload({ name: "Other Name" }));
		expect(result).toMatchObject({ ok: false, code: "CONFLICT" });

		const saved = await prisma.recipe.findUniqueOrThrow({ where: { id: recipeId } });
		expect(saved.name).toBe("Test Bread");
		expect(saved.version).toBe(1);
	});

	it("rejects another user's recipe", async () => {
		const result = await saveRecipe(otherId, payload());
		expect(result).toMatchObject({ ok: false, code: "FORBIDDEN" });

		const saved = await prisma.recipe.findUniqueOrThrow({ where: { id: recipeId } });
		expect(saved.name).toBe("Draft");
	});

	it("reports a missing recipe", async () => {
		const result = await saveRecipe(ownerId, payload({ id: 2_000_000_000 }));
		expect(result).toMatchObject({ ok: false, code: "NOT_FOUND" });
	});

	it("rejects a name whose slug the author already uses", async () => {
		await prisma.recipe.create({ data: { name: "Taken", slug: "taken", userId: ownerId } });
		const result = await saveRecipe(ownerId, payload({ name: "Taken" }));
		expect(result).toMatchObject({ ok: false, code: "BAD_REQUEST" });

		const saved = await prisma.recipe.findUniqueOrThrow({ where: { id: recipeId } });
		expect(saved.name).toBe("Draft");
		expect(saved.version).toBe(0);
	});

	it("list queries omit the body", async () => {
		const rows = await findRecipes({ userId: ownerId });
		expect(rows.length).toBeGreaterThan(0);
		for (const row of rows) expect(row).not.toHaveProperty("body");
	});
});
