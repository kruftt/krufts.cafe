import { formatAmount, parseAmount } from "@lib/amount";
import { recipeUrl } from "@lib/recipe-url";
import { groupPlannedRecipes } from "@lib/shopping-list";
import { MealPlan } from "@schema";
import type { MealPlanEntryData } from "@services/meal-plan";
import { useMemo } from "react";
import { Link } from "react-router";

// Every planned recipe's ingredients in one place, scaled by how many times it's planned.
export function ShoppingList({ entries }: { entries: MealPlanEntryData[] }) {
	const planned = useMemo(() => groupPlannedRecipes(entries), [entries]);

	if (!planned.length) {
		return (
			<p className="text-muted-foreground text-sm text-center">
				Add recipes to the week to build a shopping list.
			</p>
		);
	}

	return (
		<div className="columns-xs gap-8">
			{planned.map(({ recipe, days, count }) => {
				const groups = recipe.body.ingredientGroups.filter((g) => g.ingredients.length);
				return (
					<div key={recipe.id} className="break-inside-avoid mb-8">
						<h3 className="ingredient_group__name flex items-baseline gap-2">
							<Link className="hover:underline" to={recipeUrl(recipe)}>
								{recipe.name}
							</Link>
							{count > 1 && <span className="font-normal">×{count}</span>}
							<span className="ml-auto text-xs font-normal text-muted-foreground">
								{days.map((d) => MealPlan.DAYS[d]?.slice(0, 3)).join(", ")}
							</span>
						</h3>
						{!groups.length && (
							<p className="text-muted-foreground text-sm">No ingredients listed.</p>
						)}
						{groups.map((group) => (
							<div key={group.id} className="mb-3">
								{groups.length > 1 && group.name && (
									<h4 className="text-sm font-semibold text-muted-foreground mt-2">
										{group.name}
									</h4>
								)}
								{group.ingredients.map((ingredient) => {
									const parsed = parseAmount(ingredient.amount);
									return (
										<div key={ingredient.id} className="py-1">
											<span className="font-medium mr-1">
												{parsed ? formatAmount(parsed, count) : ""}
											</span>
											{ingredient.units} {ingredient.name}
											{ingredient.preparation && (
												<span className="font-light italic">, {ingredient.preparation}</span>
											)}
										</div>
									);
								})}
							</div>
						))}
					</div>
				);
			})}
		</div>
	);
}
