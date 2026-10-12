import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { prisma } from "@lib/prisma";
import type { RecipeBody } from "@schema";
import {
	addMealPlanEntries,
	clearMealPlan,
	findMealPlan,
	removeMealPlanEntry,
	setMealPlanNote,
} from "./meal-plan";
import { saveRecipe } from "./recipe";

const body: RecipeBody.Body = { ingredientGroups: [], steps: [] };

describe("meal plan (database)", () => {
	const ownerId = `test-owner-${crypto.randomUUID()}`;
	const plannerId = `test-planner-${crypto.randomUUID()}`;
	let publishedId: number;
	let draftId: number;

	beforeAll(async () => {
		for (const id of [ownerId, plannerId]) {
			await prisma.user.create({
				data: { id, name: "Tester", email: `${id}@example.test`, handle: id },
			});
		}
	});

	beforeEach(async () => {
		await prisma.recipe.deleteMany({ where: { userId: { in: [ownerId, plannerId] } } });
		await clearMealPlan(plannerId);
		await clearMealPlan(ownerId);
		publishedId = (
			await prisma.recipe.create({ data: { name: "Public", userId: ownerId, published: true } })
		).id;
		draftId = (await prisma.recipe.create({ data: { name: "Draft", userId: ownerId } })).id;
	});

	afterAll(async () => {
		await prisma.user.deleteMany({ where: { id: { in: [ownerId, plannerId] } } });
	});

	it("appends entries to the end of a day", async () => {
		await addMealPlanEntries(plannerId, { day: 2, recipeIds: [publishedId] });
		await addMealPlanEntries(plannerId, { day: 2, recipeIds: [publishedId, publishedId] });

		const { entries } = await findMealPlan(plannerId);
		expect(entries.map((e) => e.position)).toEqual([0, 1, 2]);
		expect(entries.every((e) => e.day === 2)).toBe(true);
	});

	it("skips other users' unpublished recipes", async () => {
		const result = await addMealPlanEntries(plannerId, { day: 0, recipeIds: [draftId] });
		expect(result.count).toBe(0);

		await addMealPlanEntries(ownerId, { day: 0, recipeIds: [draftId] });
		expect((await findMealPlan(ownerId)).entries).toHaveLength(1);
	});

	it("only removes the caller's own entries", async () => {
		await addMealPlanEntries(plannerId, { day: 0, recipeIds: [publishedId] });
		const [entry] = (await findMealPlan(plannerId)).entries;

		await removeMealPlanEntry(ownerId, entry!.id);
		expect((await findMealPlan(plannerId)).entries).toHaveLength(1);

		await removeMealPlanEntry(plannerId, entry!.id);
		expect((await findMealPlan(plannerId)).entries).toHaveLength(0);
	});

	it("sets, replaces, and clears a day note", async () => {
		await setMealPlanNote(plannerId, { day: 4, text: " Eating out " });
		expect((await findMealPlan(plannerId)).notes).toEqual({ 4: "Eating out" });

		await setMealPlanNote(plannerId, { day: 4, text: "Leftovers" });
		expect((await findMealPlan(plannerId)).notes).toEqual({ 4: "Leftovers" });

		await setMealPlanNote(plannerId, { day: 4, text: "  " });
		expect((await findMealPlan(plannerId)).notes).toEqual({});
	});

	it("unpublishing drops the recipe from other users' plans but not the owner's", async () => {
		await addMealPlanEntries(plannerId, { day: 1, recipeIds: [publishedId] });
		await addMealPlanEntries(ownerId, { day: 1, recipeIds: [publishedId] });

		const result = await saveRecipe(ownerId, {
			id: publishedId,
			version: 0,
			name: "Public",
			tags: [],
			published: false,
			prepTime: 0,
			cookTime: 0,
			serves: "4",
			intro: "",
			body,
		});
		expect(result.ok).toBe(true);

		expect((await findMealPlan(plannerId)).entries).toHaveLength(0);
		expect((await findMealPlan(ownerId)).entries).toHaveLength(1);
	});

	it("deleting a recipe cascades to plan entries", async () => {
		await addMealPlanEntries(plannerId, { day: 1, recipeIds: [publishedId] });
		await prisma.recipe.delete({ where: { id: publishedId } });
		expect((await findMealPlan(plannerId)).entries).toHaveLength(0);
	});
});
