import { Container, Header, Panel } from "@components/app";
import { RecipeList } from "@components/recipe/list";
import { findRecipes } from "@services/recipe";
import type { Route } from "./+types/_index";

export async function loader({ request }: Route.LoaderArgs) {
	const recipes = await findRecipes({ published: true	});
	const url = new URL(request.url);
	const urlQuery = url.searchParams.get("q") ?? "";
	return { recipes, urlQuery };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const { recipes, urlQuery } = loaderData;

	return (
		<Container>
			<Header.Section>
				<Header.Title className="userpage__header">
					All Recipes
				</Header.Title>
			</Header.Section>
			<Panel.Section className="recipe__list">
				<RecipeList recipes={recipes} urlQuery={urlQuery} />
			</Panel.Section>
		</Container>
	);
}
