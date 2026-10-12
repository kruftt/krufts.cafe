import { describe, expect, it } from "bun:test";
import type { RecipeBody } from "@schema";
import { formatIngredient, ingredientMap, parseInstruction, summarizeStep } from "./ingredient-ref";

const sugar = { id: "sugar", amount: "200", units: "g", name: "sugar", preparation: "" };
const eggs = { id: "eggs", amount: "2 - 3", units: "", name: "eggs", preparation: "beaten" };
const salt = { id: "salt", amount: "", units: "", name: "salt", preparation: "" };
const ingredients = ingredientMap([{ id: "g", name: "", ingredients: [sugar, eggs, salt] }]);

function step(...texts: string[]): RecipeBody.Step {
	return { id: "s", name: "", intro: "", instructions: texts.map((text, i) => ({ id: `i${i}`, text })) };
}

describe("parseInstruction", () => {
	it("returns plain text untouched", () =>
		expect(parseInstruction("Mix well.", ingredients)).toEqual([{ type: "text", text: "Mix well." }]));

	it("resolves a whole-amount token", () =>
		expect(parseInstruction("Add {{sugar}} now", ingredients)).toEqual([
			{ type: "text", text: "Add " },
			{ type: "ingredient", ingredient: sugar, amount: { value: 200, fraction: true }, partial: false },
			{ type: "text", text: " now" },
		]));

	it("resolves a partial-amount token", () =>
		expect(parseInstruction("{{sugar|1/2}}", ingredients)).toEqual([
			{ type: "ingredient", ingredient: sugar, amount: { value: 0.5, fraction: true }, partial: true },
		]));

	it("treats an empty override as the whole amount", () =>
		expect(parseInstruction("{{sugar|}}", ingredients)[0]).toMatchObject({ partial: false }));

	it("marks unknown ingredients missing", () =>
		expect(parseInstruction("{{gone}}", ingredients)).toEqual([
			{ type: "missing", reason: "ingredient", raw: "{{gone}}" },
		]));

	it("marks unparseable overrides missing", () =>
		expect(parseInstruction("{{sugar|lots}}", ingredients)).toEqual([
			{ type: "missing", reason: "amount", raw: "{{sugar|lots}}" },
		]));

	it("allows ingredients without an amount", () =>
		expect(parseInstruction("{{salt}}", ingredients)[0]).toMatchObject({ type: "ingredient", amount: null }));

	it("leaves malformed braces as text", () =>
		expect(parseInstruction("{{sugar", ingredients)).toEqual([{ type: "text", text: "{{sugar" }]));
});

describe("summarizeStep", () => {
	it("lists ingredients in order of first mention", () =>
		expect(summarizeStep(step("{{eggs}} then {{sugar}}", "{{eggs}}"), ingredients).map((u) => u.ingredient.id)).toEqual([
			"eggs",
			"sugar",
		]));

	it("sums partial amounts across instructions", () =>
		expect(summarizeStep(step("{{sugar|50}}", "{{sugar|1/2}}"), ingredients)[0]?.amount).toEqual({
			value: 50.5,
			fraction: true,
		}));

	it("uses the whole amount when any mention is whole", () =>
		expect(summarizeStep(step("{{sugar|50}}", "{{sugar}}"), ingredients)[0]?.amount).toEqual({
			value: 200,
			fraction: true,
		}));

	it("sums ranges with the low value standing in for plain amounts", () =>
		expect(summarizeStep(step("{{eggs|1 - 2}}", "{{eggs|1}}"), ingredients)[0]?.amount).toEqual({
			value: 2,
			high: 3,
			fraction: true,
		}));

	it("marks decimal sums as decimals", () =>
		expect(summarizeStep(step("{{sugar|1/2}}", "{{sugar|0.5}}"), ingredients)[0]?.amount).toEqual({
			value: 1,
			fraction: false,
		}));

	it("skips missing and invalid tokens", () =>
		expect(summarizeStep(step("{{gone}} {{sugar|lots}}"), ingredients)).toEqual([]));

	it("ignores the intro", () =>
		expect(summarizeStep({ ...step(), intro: "{{sugar}}" }, ingredients)).toEqual([]));
});

describe("formatIngredient", () => {
	it("scales the amount", () => expect(formatIngredient(sugar, { value: 100, fraction: true }, 2)).toBe("200 g sugar"));
	it("omits a missing amount and units", () => expect(formatIngredient(salt, null, 2)).toBe("salt"));
	it("formats ranges", () => expect(formatIngredient(eggs, { value: 2, high: 3, fraction: true }, 1)).toBe("2 - 3 eggs"));
});
