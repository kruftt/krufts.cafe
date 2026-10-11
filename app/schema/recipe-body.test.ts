import { describe, expect, it } from "bun:test";
import { Body, emptyBody } from "./recipe-body";
import { Save } from "./recipe";

const ingredient = (id: string, amount = "1") => ({ id, amount, units: "cup", name: "flour", preparation: "" });
const instruction = (id: string) => ({ id, text: "Mix." });

const body = {
	ingredientGroups: [
		{ id: "g1", name: "Dough", ingredients: [ingredient("i1"), ingredient("i2", "1/2")] },
		{ id: "g2", name: "Sauce", ingredients: [ingredient("i3", "")] },
	],
	steps: [
		{ id: "s1", name: "Prep", intro: "", instructions: [instruction("n1")] },
		{ id: "s2", name: "Cook", intro: "Hot.", instructions: [instruction("n2"), instruction("n3")] },
		{ id: "s3", name: "Serve", intro: "", instructions: [] },
	],
};

const savePayload = {
	id: 1,
	version: 0,
	name: "Pizza",
	tags: ["dinner"],
	published: false,
	prepTime: 10,
	cookTime: 20,
	serves: "4",
	intro: "",
	body,
};

describe("Body", () => {
	it("parses a nested body and keeps order", () => {
		const parsed = Body.parse(body);
		expect(parsed.ingredientGroups.map((g) => g.id)).toEqual(["g1", "g2"]);
		expect(parsed.ingredientGroups[0]?.ingredients.map((i) => i.id)).toEqual(["i1", "i2"]);
		expect(parsed.steps.map((s) => s.id)).toEqual(["s1", "s2", "s3"]);
		expect(parsed.steps[1]?.instructions.map((i) => i.id)).toEqual(["n2", "n3"]);
	});

	it("parses an empty body", () => {
		expect(Body.parse(emptyBody)).toEqual(emptyBody);
	});

	it("accepts an empty amount", () => {
		expect(Body.safeParse(body).success).toBe(true);
	});

	it("rejects an invalid amount with the format message", () => {
		const result = Body.safeParse({
			...body,
			ingredientGroups: [{ id: "g1", name: "", ingredients: [ingredient("i1", "lots")] }],
		});
		expect(result.success).toBe(false);
		expect(result.error?.issues.map((i) => i.message)).toContain("Invalid format");
	});

	it("rejects an item without an id", () => {
		const result = Body.safeParse({ ...body, steps: [{ name: "", intro: "", instructions: [] }] });
		expect(result.success).toBe(false);
	});

	it("rejects an item with an empty id", () => {
		const result = Body.safeParse({ ...body, steps: [{ id: "", name: "", intro: "", instructions: [] }] });
		expect(result.success).toBe(false);
	});

	it("rejects arrays over the cap", () => {
		const steps = Array.from({ length: 101 }, (_, i) => ({ id: `s${i}`, name: "", intro: "", instructions: [] }));
		expect(Body.safeParse({ ...body, steps }).success).toBe(false);
	});

	it("rejects strings over the cap", () => {
		const result = Body.safeParse({
			...body,
			steps: [{ id: "s1", name: "", intro: "", instructions: [{ id: "n1", text: "x".repeat(5001) }] }],
		});
		expect(result.success).toBe(false);
	});
});

describe("Save", () => {
	it("parses a full payload", () => {
		expect(Save.safeParse(savePayload).success).toBe(true);
	});

	it("rejects an invalid name with the name message", () => {
		const result = Save.safeParse({ ...savePayload, name: "Pizza!" });
		expect(result.success).toBe(false);
		expect(result.error?.issues.map((i) => i.message)).toContain("Invalid characters.");
	});

	it("rejects an invalid serves value", () => {
		expect(Save.safeParse({ ...savePayload, serves: "a few" }).success).toBe(false);
	});
});
