import { describe, expect, it } from "bun:test";
import * as Ops from "./recipe-draft";
import type { Draft } from "./recipe-draft";

const base: Draft = {
	name: "Soup",
	tags: [],
	published: false,
	prepTime: "5",
	cookTime: "20",
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

describe("Field", () => {
	it("reads and writes each kind of field", () => {
		const fields = [
			Ops.Field.recipe("name"),
			Ops.Field.recipe("prepTime"),
			Ops.Field.group("g1", "name"),
			Ops.Field.ingredient("i2", "preparation"),
			Ops.Field.step("s2", "intro"),
			Ops.Field.instruction("n1", "text"),
		];
		for (const field of fields) {
			const next = field.set(base, "7");
			expect(field.get(next)).toBe("7");
			expect(field.get(base)).not.toBe("7");
		}
	});

	it("returns an empty string for a missing item and leaves the draft unchanged on set", () => {
		const field = Ops.Field.ingredient("nope", "name");
		expect(field.get(base)).toBe("");
		expect(field.set(base, "x")).toBe(base);
	});

	it("validates with the field's schema", () => {
		expect(Ops.Field.ingredient("i1", "amount").schema.safeParse("lots").success).toBe(false);
		expect(Ops.Field.ingredient("i1", "amount").schema.safeParse("1/2").success).toBe(true);
		expect(Ops.Field.recipe("cookTime").schema.safeParse("").success).toBe(false);
	});

	it("has keys that differ per item and field", () => {
		expect(Ops.Field.ingredient("i1", "name").key).not.toBe(Ops.Field.ingredient("i2", "name").key);
		expect(Ops.Field.ingredient("i1", "name").key).not.toBe(Ops.Field.ingredient("i1", "units").key);
	});
});

describe("parseDraft", () => {
	it("converts times to numbers", () => {
		const result = Ops.parseDraft(base);
		expect(result).toMatchObject({ ok: true, value: { prepTime: 5, cookTime: 20 } });
	});

	it("rejects an empty name", () => {
		expect(Ops.parseDraft({ ...base, name: "" }).ok).toBe(false);
	});

	it("rejects empty or non-numeric times instead of coercing them", () => {
		expect(Ops.parseDraft({ ...base, prepTime: "" }).ok).toBe(false);
		expect(Ops.parseDraft({ ...base, prepTime: "1a" }).ok).toBe(false);
	});

	it("rejects an invalid body value", () => {
		expect(Ops.parseDraft(Ops.updateIngredient(base, "i1", { amount: "lots" })).ok).toBe(false);
	});
});

describe("ids", () => {
	it("lists ids in order", () => {
		expect(Ops.groupIds(base)).toEqual(["g1", "g2"]);
		expect(Ops.ingredientIds(base, "g1")).toEqual(["i1", "i2"]);
		expect(Ops.ingredientIds(base, "nope")).toEqual([]);
		expect(Ops.stepIds(base)).toEqual(["s1", "s2"]);
		expect(Ops.instructionIds(base, "s2")).toEqual(["n2"]);
	});

	it("compares id lists by value", () => {
		expect(Ops.sameIds(["a", "b"], ["a", "b"])).toBe(true);
		expect(Ops.sameIds(["a", "b"], ["b", "a"])).toBe(false);
		expect(Ops.sameIds(["a"], ["a", "b"])).toBe(false);
	});
});
