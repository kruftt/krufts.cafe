import { Recipe } from "@components/recipe/view";
import { auth } from "@lib/auth-server";
import { recipeUrl } from "@lib/recipe-url";
import { findRecipe } from "@services/recipe";
import { redirect } from "react-router";
import type { Route } from "./+types/recipes.$id.($slug)";

export async function loader({ request, params }: Route.LoaderArgs) {
	if (!/^\d+$/.test(params.id)) throw redirect("/");

	const recipe = await findRecipe({ id: Number.parseInt(params.id, 10) });
	if (!recipe) throw redirect("/");

	if (!recipe.published) {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session || session.user.id !== recipe.userId) throw redirect("/");
		// TODO: Recipe not found page
	}

	// Renames leave old links with a stale slug; send them to the current one.
	// Not a 301: a browser-cached permanent redirect would loop if the name is later changed back.
	const url = recipeUrl(recipe);
	if (new URL(request.url).pathname !== url) throw redirect(url);

	return { recipe };
}

export default function RecipePage({ loaderData }: Route.ComponentProps) {
	const { recipe } = loaderData;

	return <Recipe recipe={recipe} />;
}
