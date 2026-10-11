import { RecipeEditor } from "@components/recipe/editor";
import { RecipeDraftProvider } from "@hooks/recipe-draft";
import { requireAuth } from "@lib/auth-loader";
import { findRecipe } from "@services/recipe";
import { redirect } from "react-router";
import type { Route } from "./+types/edit.$id";

export async function loader({ request, params }: Route.LoaderArgs) {
	const session = await requireAuth(request);
	const id = parseInt(params.id, 10);
	if (Number.isNaN(id)) throw redirect("/my-recipes");

	const recipe = await findRecipe({ id });
	if (!recipe) throw redirect("/my-recipes");
	if (recipe.userId !== session.user.id) throw redirect("/my-recipes");

	return { recipe };
}

export function shouldRevalidate() {
	return false;
}

export default function EditPage({ loaderData }: Route.ComponentProps) {
	const { recipe } = loaderData;

	return (
		<RecipeDraftProvider key={recipe.id} recipe={recipe}>
			<RecipeEditor />
		</RecipeDraftProvider>
	);
}
