import { Input } from "@components/ui/input";
import { ItemGroup } from "@components/ui/item";
import type { RecipeRows } from "@services/recipe";
import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { CreateRecipeButton } from "./create-recipe-button";
import { ListPagination } from "./list-pagination";
import { RecipeRow } from "./recipe-row";

export function RecipeList({
	edit,
	recipes,
	urlQuery,
}: {
	edit?: boolean;
	recipes: RecipeRows;
	urlQuery?: string;
}) {
	const [query, setQuery] = useState(urlQuery || "");
	const [page, setPage] = useState(1);
	const perPage = 20;

	const fuse = useMemo(
		() =>
			new Fuse(recipes, {
				keys: ["search"],
				threshold: 0.6,
				shouldSort: true,
			}),
		[recipes],
	);

	const results = query
		? fuse.search(query, { limit: 30 }).map((r) => r.item)
		: recipes;

	const total = results.length;
	const sliced = results.slice((page - 1) * perPage, page * perPage);

	return (
		<div className="flex flex-col items-center">
			{edit && <CreateRecipeButton />}
			
			<Input
				className="max-w-120 mt-2 mb-9 shadow-inner-lg!"
				value={query}
				onChange={(e) => {
					setQuery(e.target.value);
					setPage(1);
				}}
				placeholder="Filter by name, tags, or ingredients.."
			/>

			{sliced.length === 0 && (
				<p className="text-muted-foreground text-sm">
					{query ? "No recipes match your search." : "No recipes yet."}
				</p>
			)}
			<ItemGroup className="gap-1!">
				{sliced.map((recipe) => (
					<RecipeRow
						key={recipe.id}
						recipe={recipe}
					/>
				))}
			</ItemGroup>
			{total > perPage && (
				<ListPagination
					className="mt-5"
					selected={page}
					select={(n) => setPage(n)}
					total={total}
					perPage={perPage}
				/>
			)}
		</div>
	);
}
