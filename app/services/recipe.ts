import { prisma } from "@lib/prisma";
import { type Recipe, RecipeBody } from "@schema";

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

// Distinct, non-empty ingredient names, stored on the recipe so lists can filter without the body.
export function ingredientNamesOf(body: RecipeBody.Body) {
	const names = body.ingredientGroups
		.flatMap((g) => g.ingredients)
		.map((i) => i.name.trim())
		.filter(Boolean);
	return [...new Set(names)];
}

export type SaveResult =
	| { ok: true; version: number }
	| { ok: false; code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT"; message?: string };

export async function saveRecipe(userId: string, input: Recipe.Save): Promise<SaveResult> {
	const { id, version, ...fields } = input;

	const { count } = await prisma.recipe.updateMany({
		where: { id, userId, version },
		data: {
			...fields,
			ingredientNames: ingredientNamesOf(fields.body),
			version: { increment: 1 },
		},
	});
	if (count === 1) return { ok: true, version: version + 1 };

	const existing = await prisma.recipe.findUnique({ where: { id }, select: { userId: true } });
	if (!existing) return { ok: false, code: "NOT_FOUND" };
	if (existing.userId !== userId) return { ok: false, code: "FORBIDDEN" };
	return { ok: false, code: "CONFLICT", message: "This recipe was changed elsewhere." };
}

interface RecipeIdLocator {
	id: number;
}

export async function findRecipe(where: RecipeIdLocator) {
	const recipe = await prisma.recipe.findUnique({
		where,
		include: {
			user: {
				select: {
					name: true,
					handle: true,
				},
			},
		},
	});
	if (!recipe) return null;
	return { ...recipe, body: RecipeBody.Body.parse(recipe.body) };
}

export type RecipeData = NonNullable<Awaited<ReturnType<typeof findRecipe>>>;
export type StepData = RecipeBody.Step;
export type InstructionData = RecipeBody.Instruction;
export type IngredientGroupData = RecipeBody.IngredientGroup;
export type IngredientData = RecipeBody.Ingredient;

interface UserIdLocator {
	userId: string;
}

interface PublishedLocator {
	published: boolean;
}

export async function findRecipes(where?: UserIdLocator | PublishedLocator) {
	return prisma.recipe.findMany({
		where,
		omit: { body: true },
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
				omit: { body: true },
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
