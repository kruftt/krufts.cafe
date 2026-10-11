import Fuse, { type IFuseOptions } from "fuse.js";

export interface FilterableRecipe {
	name: string;
	tags: string[];
	ingredientNames: string[];
}

export const recipeFuseOptions: IFuseOptions<FilterableRecipe> = {
	keys: [
		{ name: "name", weight: 3 },
		{ name: "tags", weight: 2 },
		{ name: "ingredientNames", weight: 1 },
	],
	// Match anywhere in a field; without this, matches past ~100 characters are dropped.
	ignoreLocation: true,
	threshold: 0.3,
	shouldSort: true,
};

export function createRecipeFilter<T extends FilterableRecipe>(recipes: T[]) {
	const fuse = new Fuse(recipes, recipeFuseOptions as IFuseOptions<T>);
	return (query: string): T[] => {
		const q = query.trim();
		return q ? fuse.search(q).map((r) => r.item) : recipes;
	};
}
