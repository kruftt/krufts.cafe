import { RecipeEditor } from "@components/recipe/editor";
import { RecipeIdContext, recipeQueryKey } from "@hooks/recipe-cache";
import { requireAuth } from "@lib/auth-loader";
import { useTRPCClient } from "@lib/trpc";
import { findRecipe, type RecipeData } from "@services/recipe";
import { useQuery } from "@tanstack/react-query";
import { redirect } from "react-router";
import type { Route } from "./+types/edit.$id";

export async function loader({ request, params }: Route.LoaderArgs) {
	const session = await requireAuth(request);
	const id = parseInt(params.id, 10);
	if (Number.isNaN(id)) throw redirect("/my-recipes");

	const initialData = await findRecipe({ id });
	if (!initialData) throw redirect("/my-recipes");
	if (initialData.userId !== session.user.id) throw redirect("/my-recipes");

	return { initialData };
}

export function shouldRevalidate() {
	return false;
}

export default function EditPage({ loaderData }: Route.ComponentProps) {
	const { initialData } = loaderData;
	const trpcClient = useTRPCClient();

	const { data: recipe } = useQuery<RecipeData>({
		queryKey: recipeQueryKey(initialData.id),
		queryFn: () => trpcClient.recipe.find.query({ id: initialData.id }),
		initialData,
	});

	return (
		<RecipeIdContext.Provider value={recipe.id}>
			<RecipeEditor recipe={recipe} />
		</RecipeIdContext.Provider>
	);
}
