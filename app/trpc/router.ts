import { bookmarkRouter } from "./routers/bookmark";
import { ingredientRouter } from "./routers/ingredient";
import { ingredientGroupRouter } from "./routers/ingredientGroup";
import { instructionRouter } from "./routers/instruction";
import { pinRouter } from "./routers/pin";
import { recipeRouter } from "./routers/recipe";
import { stepRouter } from "./routers/step";
import { router } from "./server";

export const TRPCRouter = router({
	recipe: recipeRouter,
	step: stepRouter,
	instruction: instructionRouter,
	ingredientGroup: ingredientGroupRouter,
	ingredient: ingredientRouter,
	pin: pinRouter,
	bookmark: bookmarkRouter,
});

export type TRPCRouter = typeof TRPCRouter;
