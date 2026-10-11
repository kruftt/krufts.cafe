import { Recipe } from "@components/recipe/view";
import { auth } from "@lib/auth-server";
import { findRecipe } from "@services/recipe";
import { getUser } from "@services/user";
import { redirect } from "react-router";
import type { Route } from "./+types/recipes.$handle.$slug";

export async function loader({ request, params }: Route.LoaderArgs) {
	const user = await getUser(params.handle);
	if (!user) throw redirect("/");

	const recipe = await findRecipe({
		userId_slug: { userId: user.id, slug: params.slug },
	});

	if (!recipe) throw redirect("/");

	if (!recipe.published) {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session || session.user.id !== recipe.userId) throw redirect("/");
		// TODO: Recipe not found page
	}

	return { recipe };
}

export default function RecipePage({ loaderData }: Route.ComponentProps) {
	const { recipe } = loaderData;

	return <Recipe recipe={recipe} />;
}
