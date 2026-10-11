import { Container, Header, Panel } from "@components/app";
import { RecipeList } from "@components/recipe/list";
import { requireAuth } from "@lib/auth-loader";
import { findRecipes } from "@services/recipe";
import { skipRevalidateOnQueryChange } from "@lib/revalidate";
import type { Route } from "./+types/my-recipes";

export const shouldRevalidate = skipRevalidateOnQueryChange;

export async function loader({ request }: Route.LoaderArgs) {
	const session = await requireAuth(request);
	const recipes = await findRecipes({ userId: session.user.id });
	return { recipes };
}

export default function MyRecipes({ loaderData }: Route.ComponentProps) {
	return (
		<Container>
			<Header.Section className="userpage__header">
				<Header.Title>
					<h2 className="mb-6">My Recipes</h2>
				</Header.Title>
			</Header.Section>
			<Panel.Section className="recipe__list">
				<RecipeList edit recipes={loaderData.recipes} />
			</Panel.Section>
		</Container>
	);
}
