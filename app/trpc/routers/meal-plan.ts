import { MealPlan, Model } from "@schema";
import {
	addMealPlanEntries,
	clearMealPlan,
	removeMealPlanEntry,
	setMealPlanNote,
} from "@services/meal-plan";
import { authedProcedure, router } from "../server";

export const mealPlanRouter = router({
	add: authedProcedure.input(MealPlan.Add).mutation(async ({ input, ctx }) => {
		return addMealPlanEntries(ctx.session.user.id, input);
	}),

	remove: authedProcedure.input(Model.Id).mutation(async ({ input, ctx }) => {
		return removeMealPlanEntry(ctx.session.user.id, input.id);
	}),

	setNote: authedProcedure.input(MealPlan.SetNote).mutation(async ({ input, ctx }) => {
		await setMealPlanNote(ctx.session.user.id, input);
	}),

	clear: authedProcedure.mutation(async ({ ctx }) => {
		await clearMealPlan(ctx.session.user.id);
	}),
});
