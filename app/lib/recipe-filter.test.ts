import { describe, expect, it } from "bun:test";
import { createRecipeFilter } from "./recipe-filter";

const pantry = [
	"butter", "garlic", "onion", "celery", "carrot", "thyme", "bay leaf", "chicken stock", "cream",
	"parsley", "black pepper", "salt", "flour", "milk", "egg", "sugar", "lemon", "olive oil",
	"rosemary", "paprika", "cumin", "coriander", "ginger", "shallot", "leek",
];

const recipes = [
	{ id: 1, name: "Chicken Pot Pie", tags: ["dinner", "comfort"], ingredientNames: [...pantry, "chicken thighs", "saffron"] },
	{ id: 2, name: "Tomato Soup", tags: ["soup", "vegetarian"], ingredientNames: ["tomatoes", "onion", "basil", "cream"] },
	{ id: 3, name: "Lemon Bars", tags: ["dessert"], ingredientNames: ["flour", "sugar", "lemon", "egg", "butter"] },
	{ id: 4, name: "Basil Pesto", tags: ["sauce"], ingredientNames: ["basil", "pine nuts", "parmesan", "garlic", "olive oil"] },
	{ id: 5, name: "Weeknight Curry", tags: ["dinner", "spicy"], ingredientNames: ["chickpeas", "coconut milk", "curry paste", "spinach"] },
];

const filter = createRecipeFilter(recipes);
const ids = (q: string) => filter(q).map((r) => r.id);

describe("recipe filter", () => {
	it("returns everything for an empty or blank query", () => {
		expect(ids("")).toEqual([1, 2, 3, 4, 5]);
		expect(ids("   ")).toEqual([1, 2, 3, 4, 5]);
	});

	it("matches by name", () => {
		expect(ids("pot pie")[0]).toBe(1);
		expect(ids("curry")[0]).toBe(5);
	});

	it("tolerates typos in names", () => {
		expect(ids("tomatoe soup")[0]).toBe(2);
		expect(ids("pesot")).toContain(4);
	});

	it("matches by tag", () => {
		expect(ids("dessert")).toEqual([3]);
		expect(ids("vegetarian")).toEqual([2]);
	});

	it("matches an ingredient late in a long list", () => {
		expect(ids("saffron")).toEqual([1]);
		expect(ids("safron")).toEqual([1]);
	});

	it("matches ingredients with typos", () => {
		expect(ids("chikpeas")).toContain(5);
		expect(ids("parmesean")).toContain(4);
	});

	it("ranks a name match above an ingredient-only match", () => {
		const result = ids("basil");
		expect(result[0]).toBe(4);
		expect(result).toContain(2);
	});

	it("keeps short queries precise", () => {
		expect(ids("egg").sort()).toEqual([1, 3]);
		expect(ids("rice")).toEqual([]);
	});

	it("returns nothing for unrelated text", () => {
		expect(ids("zzzqqq")).toEqual([]);
	});

	it("is not capped at a fixed result count", () => {
		const many = Array.from({ length: 60 }, (_, i) => ({ id: i, name: `Soup ${i}`, tags: [], ingredientNames: [] }));
		expect(createRecipeFilter(many)("soup")).toHaveLength(60);
	});
});
