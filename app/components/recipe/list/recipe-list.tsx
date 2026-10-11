import { Input } from "@components/ui/input";
import { ItemGroup } from "@components/ui/item";
import { createRecipeFilter } from "@lib/recipe-filter";
import type { RecipeRows } from "@services/recipe";
import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { CreateRecipeButton } from "./create-recipe-button";
import { ListPagination } from "./list-pagination";
import { RecipeRow } from "./recipe-row";

export function RecipeList({
	edit,
	recipes,
}: {
	edit?: boolean;
	recipes: RecipeRows;
}) {
	const [searchParams, setSearchParams] = useSearchParams();
	const [query, setQuery] = useState(searchParams.get("q") ?? "");
	const deferredQuery = useDeferredValue(query);
	const [page, setPage] = useState(1);
	const perPage = 20;

	const filter = useMemo(() => createRecipeFilter(recipes), [recipes]);
	const results = useMemo(() => filter(deferredQuery), [filter, deferredQuery]);

	const total = results.length;
	const sliced = results.slice((page - 1) * perPage, page * perPage);

	function onQueryChange(value: string) {
		setQuery(value);
		setPage(1);
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				if (value.trim()) next.set("q", value);
				else next.delete("q");
				return next;
			},
			{ replace: true, preventScrollReset: true },
		);
	}

	return (
		<div className="flex flex-col items-center">
			{edit && <CreateRecipeButton />}

			<Input
				className="max-w-120 mt-2 mb-9 shadow-inner-lg!"
				value={query}
				onChange={(e) => onQueryChange(e.target.value)}
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
