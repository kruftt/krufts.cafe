import { describe, expect, it } from "bun:test";
import { groupPlannedRecipes } from "./shopping-list";

const soup = { id: 1, name: "Soup" };
const bread = { id: 2, name: "Bread" };

describe("groupPlannedRecipes", () => {
	it("returns nothing for an empty plan", () => {
		expect(groupPlannedRecipes([])).toEqual([]);
	});

	it("merges repeats of a recipe and counts them", () => {
		const grouped = groupPlannedRecipes([
			{ day: 0, recipe: soup },
			{ day: 0, recipe: bread },
			{ day: 3, recipe: soup },
			{ day: 3, recipe: soup },
		]);
		expect(grouped).toEqual([
			{ recipe: soup, days: [0, 3], count: 3 },
			{ recipe: bread, days: [0], count: 1 },
		]);
	});

	it("sorts days even when entries arrive out of order", () => {
		const grouped = groupPlannedRecipes([
			{ day: 5, recipe: soup },
			{ day: 1, recipe: soup },
		]);
		expect(grouped[0]?.days).toEqual([1, 5]);
	});
});
