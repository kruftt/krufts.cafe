import { prisma } from "@lib/prisma";

export async function newRecipeName(userId: string) {
	const base = "New Recipe";
	const existing = await prisma.recipe.findMany({
		where: { userId, name: { startsWith: base } },
		select: { name: true },
	});

	if (!existing.length) return base;

	const numbers = existing
		.map((r) => {
			if (r.name === "New Recipe") return 1;
			const match = r.name.match(/^New Recipe \((\d+)\)$/);
			const num = match?.[1];
			return num ? Number.parseInt(num, 10) : -1;
		})
		.filter((n) => n >= 0);

	return `${base} (${(numbers.length ? Math.max(...numbers) : 0) + 1})`;
}

export async function updateRecipeSearch(recipeId: number) {
	const recipe = await prisma.recipe.findUniqueOrThrow({
		where: { id: recipeId },
		select: {
			name: true,
			tags: true,
			user: {
				select: {
					name: true,
					handle: true,
				}
			},
			ingredientGroups: {
				select: {
					ingredients: { select: { name: true } },
				},
			},
		},
	});

	const ingredientNames = recipe.ingredientGroups
		.flatMap((s) => s.ingredients)
		.map((i) => i.name);

	const search = [recipe.name, recipe.user.name, recipe.user.handle, ...recipe.tags, ...ingredientNames]
		.join(" ")
		.toLowerCase();

	await prisma.recipe.update({
		where: { id: recipeId },
		data: { search },
	});
}

interface IdSlugLocator {
	userId_slug: {
		userId: string;
		slug: string;
	};
}

interface RecipeIdLocator {
	id: number;
}

export async function findRecipe(where: IdSlugLocator | RecipeIdLocator) {
	return prisma.recipe.findUnique({
		where,
		include: {
			user: {
				select: {
					name: true,
					handle: true,
				},
			},
			ingredientGroups: {
				orderBy: { index: "asc" },
				include: {
					ingredients: { orderBy: { index: "asc" } },
				},
			},
			steps: {
				orderBy: { index: "asc" },
				include: {
					instructions: { orderBy: { index: "asc" } },
				},
			},
		},
	});
}

export type RecipeData = NonNullable<Awaited<ReturnType<typeof findRecipe>>>;
export type StepData = RecipeData['steps'][number];
export type InstructionData = StepData['instructions'][number];
export type IngredientGroupData = RecipeData['ingredientGroups'][number];
export type IngredientData = IngredientGroupData['ingredients'][number];

interface UserIdLocator {
	userId: string;
}

interface PublishedLocator {
	published: boolean;
}

export async function findRecipes(where?: UserIdLocator | PublishedLocator) {
	return prisma.recipe.findMany({
		where,
		include: {
			user: {
				select: {
					handle: true,
					name: true,
				},
			},
		},
	});
}

export type RecipeRows = Awaited<ReturnType<typeof findRecipes>>;
export type RecipeRowData = RecipeRows[number];

export async function findBookmarkedRecipes(where?: UserIdLocator) {
	return await prisma.bookmark.findMany({
		where,
		include: {
			recipe: {
				include: {
					user: {
						select: {
							handle: true,
							name: true,
						},
					},
				},
			},
		},
	});
}

export type FoundBookmarkedRecipes = Awaited<ReturnType<typeof findBookmarkedRecipes>>;