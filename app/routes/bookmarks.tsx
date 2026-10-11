import { Container, Header, Panel } from "@components/app";
import { RecipeList } from "@components/recipe/list";
import { requireAuth } from "@lib/auth-loader";
import { findBookmarkedRecipes } from "@services/recipe";
import { skipRevalidateOnQueryChange } from "@lib/revalidate";
import type { Route } from "./+types/bookmarks";

export const shouldRevalidate = skipRevalidateOnQueryChange;

export async function loader({ request }: Route.LoaderArgs) {
	const session = await requireAuth(request);
	const bookmarks = await findBookmarkedRecipes({ userId: session.user.id });
	return { recipes: bookmarks.map((b) => b.recipe) };
}

export default function BookmarksPage({ loaderData }: Route.ComponentProps) {
	const { recipes } = loaderData;

	return (
		<Container>
			<Header.Section className="userpage__header">
				<Header.Title>
					<h2>Bookmarks</h2>
				</Header.Title>
			</Header.Section>
			<Panel.Section className="recipe__list">
				<RecipeList recipes={recipes} />
			</Panel.Section>
		</Container>
	);
}
