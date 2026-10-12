import { prisma } from "@lib/prisma";
import { type MealPlan, RecipeBody } from "@schema";

// Recipes a user can put on their plan: anything published, plus their own drafts.
function plannableBy(userId: string) {
	return { OR: [{ published: true }, { userId }] };
}

export async function findPlannableRecipes(userId: string) {
	return prisma.recipe.findMany({
		where: plannableBy(userId),
		omit: { body: true },
		include: {
			user: {
				select: {
					handle: true,
					name: true,
				},
			},
		},
		orderBy: { name: "asc" },
	});
}

export async function findMealPlan(userId: string) {
	const [entries, notes] = await Promise.all([
		prisma.mealPlanEntry.findMany({
			where: { userId },
			orderBy: [{ day: "asc" }, { position: "asc" }, { id: "asc" }],
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
		}),
		prisma.mealPlanNote.findMany({ where: { userId } }),
	]);

	return {
		entries: entries.map((entry) => ({
			...entry,
			recipe: { ...entry.recipe, body: RecipeBody.Body.parse(entry.recipe.body) },
		})),
		notes: Object.fromEntries(notes.map((n) => [n.day, n.text])) as Record<number, string>,
	};
}

export type MealPlanData = Awaited<ReturnType<typeof findMealPlan>>;
export type MealPlanEntryData = MealPlanData["entries"][number];

export async function addMealPlanEntries(userId: string, { day, recipeIds }: MealPlan.Add) {
	return prisma.$transaction(async (tx) => {
		const allowed = await tx.recipe.findMany({
			where: { id: { in: recipeIds }, ...plannableBy(userId) },
			select: { id: true },
		});
		const allowedIds = new Set(allowed.map((r) => r.id));
		const ids = recipeIds.filter((id) => allowedIds.has(id));
		if (!ids.length) return { count: 0 };

		const last = await tx.mealPlanEntry.aggregate({
			where: { userId, day },
			_max: { position: true },
		});
		const start = (last._max.position ?? -1) + 1;

		return tx.mealPlanEntry.createMany({
			data: ids.map((recipeId, i) => ({ userId, recipeId, day, position: start + i })),
		});
	});
}

export async function removeMealPlanEntry(userId: string, id: number) {
	return prisma.mealPlanEntry.deleteMany({ where: { id, userId } });
}

export async function setMealPlanNote(userId: string, { day, text }: MealPlan.SetNote) {
	const trimmed = text.trim();
	if (!trimmed) return prisma.mealPlanNote.deleteMany({ where: { userId, day } });
	return prisma.mealPlanNote.upsert({
		where: { userId_day: { userId, day } },
		create: { userId, day, text: trimmed },
		update: { text: trimmed },
	});
}

export async function clearMealPlan(userId: string) {
	return prisma.$transaction([
		prisma.mealPlanEntry.deleteMany({ where: { userId } }),
		prisma.mealPlanNote.deleteMany({ where: { userId } }),
	]);
}

// Once a recipe is unpublished, only its owner may keep it on their plan.
export async function removeUnpublishedFromPlans(recipeId: number, ownerId: string) {
	return prisma.mealPlanEntry.deleteMany({
		where: { recipeId, userId: { not: ownerId } },
	});
}
