import { bookmarkRouter } from "./routers/bookmark";
import { mealPlanRouter } from "./routers/meal-plan";
import { pinRouter } from "./routers/pin";
import { recipeRouter } from "./routers/recipe";
import { router } from "./server";

export const TRPCRouter = router({
	recipe: recipeRouter,
	pin: pinRouter,
	bookmark: bookmarkRouter,
	mealPlan: mealPlanRouter,
});

export type TRPCRouter = typeof TRPCRouter;
