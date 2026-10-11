import { bookmarkRouter } from "./routers/bookmark";
import { pinRouter } from "./routers/pin";
import { recipeRouter } from "./routers/recipe";
import { router } from "./server";

export const TRPCRouter = router({
	recipe: recipeRouter,
	pin: pinRouter,
	bookmark: bookmarkRouter,
});

export type TRPCRouter = typeof TRPCRouter;
