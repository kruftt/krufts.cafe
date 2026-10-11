import { describe, expect, it, mock } from "bun:test";
import { RecipeBody } from "@schema";
import * as Ops from "./recipe-draft";
import type { Draft } from "./recipe-draft";

const base: Draft = {
	name: "Soup",
	tags: [],
	published: false,
	prepTime: 5,
	cookTime: 20,
	serves: "2",
	intro: "",
	body: {
		ingredientGroups: [
			{
				id: "g1",
				name: "Base",
				ingredients: [
					{ id: "i1", amount: "1", units: "cup", name: "Stock", preparation: "" },
					{ id: "i2", amount: "2", units: "", name: "Carrot", preparation: "diced" },
				],
			},
			{ id: "g2", name: "Garnish", ingredients: [] },
		],
		steps: [
			{ id: "s1", name: "Prep", intro: "", instructions: [{ id: "n1", text: "Chop." }] },
			{ id: "s2", name: "Cook", intro: "", instructions: [{ id: "n2", text: "Simmer." }] },
		],
	},
};

describe("ingredients", () => {
	it("adds an ingredient with a new unique id and empty fields", () => {
		const next = Ops.addIngredient(base, "g2");
		const added = next.body.ingredientGroups[1]?.ingredients;
		expect(added).toHaveLength(1);
		expect(added?.[0]).toMatchObject({ amount: "", units: "", name: "", preparation: "" });
		const ids = next.body.ingredientGroups.flatMap((g) => g.ingredients.map((i) => i.id));
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("updates only the targeted ingredient", () => {
		const next = Ops.updateIngredient(base, "i2", { name: "Parsnip" });
		expect(next.body.ingredientGroups[0]?.ingredients[1]?.name).toBe("Parsnip");
		expect(next.body.ingredientGroups[0]?.ingredients[0]).toBe(base.body.ingredientGroups[0]?.ingredients[0]);
		expect(next.body.ingredientGroups[1]).toBe(base.body.ingredientGroups[1]);
		expect(next.body.steps).toBe(base.body.steps);
	});

	it("removes an ingredient", () => {
		const next = Ops.removeIngredient(base, "i1");
		expect(next.body.ingredientGroups[0]?.ingredients.map((i) => i.id)).toEqual(["i2"]);
	});
});

describe("groups", () => {
	it("adds an empty group at the end", () => {
		const next = Ops.addGroup(base, "g3");
		expect(next.body.ingredientGroups.at(-1)).toEqual({ id: "g3", name: "", ingredients: [] });
	});

	it("renames a group", () => {
		const next = Ops.updateGroup(base, "g2", { name: "Topping" });
		expect(next.body.ingredientGroups[1]?.name).toBe("Topping");
	});

	it("removes a group and its ingredients", () => {
		const next = Ops.removeGroup(base, "g1");
		expect(next.body.ingredientGroups.map((g) => g.id)).toEqual(["g2"]);
	});
});

describe("steps and instructions", () => {
	it("removes a step with its instructions and leaves other steps unchanged", () => {
		const next = Ops.removeStep(base, "s1");
		expect(next.body.steps.map((s) => s.id)).toEqual(["s2"]);
		expect(next.body.steps[0]).toBe(base.body.steps[1]);
	});

	it("adds an instruction to a step", () => {
		const next = Ops.addInstruction(base, "s2", "n3");
		expect(next.body.steps[1]?.instructions.map((i) => i.id)).toEqual(["n2", "n3"]);
	});

	it("updates and removes instructions", () => {
		const updated = Ops.updateInstruction(base, "n1", { text: "Dice." });
		expect(updated.body.steps[0]?.instructions[0]?.text).toBe("Dice.");
		const removed = Ops.removeInstruction(base, "n2");
		expect(removed.body.steps[1]?.instructions).toEqual([]);
	});
});

describe("unknown ids and immutability", () => {
	it("returns the same draft for unknown ids", () => {
		expect(Ops.updateIngredient(base, "nope", { name: "x" })).toBe(base);
		expect(Ops.removeIngredient(base, "nope")).toBe(base);
		expect(Ops.addIngredient(base, "nope")).toBe(base);
		expect(Ops.updateGroup(base, "nope", { name: "x" })).toBe(base);
		expect(Ops.removeGroup(base, "nope")).toBe(base);
		expect(Ops.updateStep(base, "nope", { name: "x" })).toBe(base);
		expect(Ops.removeStep(base, "nope")).toBe(base);
		expect(Ops.addInstruction(base, "nope")).toBe(base);
		expect(Ops.removeInstruction(base, "nope")).toBe(base);
	});

	it("does not mutate the input draft", () => {
		const snapshot = structuredClone(base);
		Ops.addGroup(base);
		Ops.addIngredient(base, "g1");
		Ops.updateIngredient(base, "i1", { name: "x" });
		Ops.removeStep(base, "s1");
		Ops.addInstruction(base, "s1");
		Ops.setField(base, "name", "Stew");
		expect(base).toEqual(snapshot);
	});

	it("setField returns the same draft when the value is unchanged", () => {
		expect(Ops.setField(base, "name", "Soup")).toBe(base);
		expect(Ops.setField(base, "name", "Stew").name).toBe("Stew");
	});
});

describe("fieldSaver", () => {
	it("rejects an invalid amount and leaves the draft unchanged", () => {
		let draft = base;
		const update = (fn: (d: Draft) => Draft) => {
			draft = fn(draft);
		};
		const options = { onError: mock(), onSuccess: mock() };
		const save = Ops.fieldSaver(RecipeBody.Ingredient.shape.amount, update, (d, v) =>
			Ops.updateIngredient(d, "i1", { amount: v }),
		);

		save("lots", options);
		expect(options.onError).toHaveBeenCalledTimes(1);
		expect(options.onSuccess).not.toHaveBeenCalled();
		expect(draft).toBe(base);

		save("1/2", options);
		expect(options.onSuccess).toHaveBeenCalledTimes(1);
		expect(draft.body.ingredientGroups[0]?.ingredients[0]?.amount).toBe("1/2");
	});
});
