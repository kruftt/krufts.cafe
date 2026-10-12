interface PlannedEntry<R extends { id: number }> {
	day: number;
	recipe: R;
}

export interface PlannedRecipe<R> {
	recipe: R;
	days: number[];
	count: number;
}

// One item per distinct recipe, in order of first appearance, counting how often it's planned.
export function groupPlannedRecipes<R extends { id: number }>(
	entries: PlannedEntry<R>[],
): PlannedRecipe<R>[] {
	const byId = new Map<number, PlannedRecipe<R>>();
	for (const { day, recipe } of entries) {
		const item = byId.get(recipe.id);
		if (!item) {
			byId.set(recipe.id, { recipe, days: [day], count: 1 });
			continue;
		}
		item.count++;
		if (!item.days.includes(day)) item.days.push(day);
	}
	for (const item of byId.values()) item.days.sort((a, b) => a - b);
	return [...byId.values()];
}
