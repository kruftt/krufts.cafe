export function toSlug(name: string) {
	return name
		.normalize("NFD") // decompose "é" into "e" + combining accent
		.replace(/\p{M}/gu, "") // strip combining marks (the accents)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric runs with hyphens
		.replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

// "/recipes/42/sourdough-loaf", or just "/recipes/42" when the name has no sluggable characters.
// Only the id identifies the recipe; the slug is for whoever reads the link.
export function recipeUrl(recipe: { id: number; name: string }) {
	const slug = toSlug(recipe.name);
	return slug ? `/recipes/${recipe.id}/${slug}` : `/recipes/${recipe.id}`;
}
