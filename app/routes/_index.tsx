import { Container, Header, Panel } from "@components/app";
import { RecipeList } from "@components/recipe/list";
import { findRecipes } from "@services/recipe";
import { skipRevalidateOnQueryChange } from "@lib/revalidate";
import type { Route } from "./+types/_index";

export const shouldRevalidate = skipRevalidateOnQueryChange;

export async function loader() {
	const recipes = await findRecipes({ published: true	});
	return { recipes };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const { recipes } = loaderData;

	return (
		<Container>
			<Header.Section>
				<Header.Title className="userpage__header">
					All Recipes
				</Header.Title>
			</Header.Section>
			<Panel.Section className="recipe__list">
				<RecipeList recipes={recipes} />
			</Panel.Section>
		</Container>
	);
}
