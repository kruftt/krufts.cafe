import { describe, expect, it } from "bun:test";
import { recipeUrl, toSlug } from "./recipe-url";

describe("toSlug", () => {
	it("strips accents and punctuation", () => {
		expect(toSlug("Crème Brûlée!")).toBe("creme-brulee");
	});
});

describe("recipeUrl", () => {
	it("puts the slug after the id", () => {
		expect(recipeUrl({ id: 4, name: "7 Layer Dip" })).toBe("/recipes/4/7-layer-dip");
	});

	it("omits the slug for an unsluggable name", () => {
		expect(recipeUrl({ id: 7, name: "" })).toBe("/recipes/7");
		expect(recipeUrl({ id: 7, name: "!!!" })).toBe("/recipes/7");
	});
});
