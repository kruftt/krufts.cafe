import { bookmarksAtom, pinsAtom } from "@atoms/user";
import { ListPagination } from "@components/recipe/list";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { useUser } from "@hooks/session";
import { createRecipeFilter } from "@lib/recipe-filter";
import { MealPlan } from "@schema";
import type { RecipeRows } from "@services/recipe";
import { useAtomValue } from "jotai";
import { CheckIcon } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { PlanRecipeCard } from "./plan-recipe-card";

const SOURCES = [
	{ value: "all", label: "All" },
	{ value: "pins", label: "Pins" },
	{ value: "bookmarks", label: "Bookmarks" },
	{ value: "mine", label: "My Recipes" },
] as const;

type Source = (typeof SOURCES)[number]["value"];

const perPage = 24;

interface Props {
	recipes: RecipeRows;
	targetDay: MealPlan.Day | null;
	onTargetDayChange: (day: MealPlan.Day) => void;
	onAdd: (day: MealPlan.Day, recipeIds: number[]) => void;
	pending: boolean;
	inputRef?: React.Ref<HTMLInputElement>;
}

export function RecipePicker({
	recipes,
	targetDay,
	onTargetDayChange,
	onAdd,
	pending,
	inputRef,
}: Props) {
	const user = useUser();
	const pins = useAtomValue(pinsAtom);
	const bookmarks = useAtomValue(bookmarksAtom);
	const [source, setSource] = useState<Source>("all");
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<number[]>([]);

	const sourced = useMemo(() => {
		switch (source) {
			case "pins":
				return recipes.filter((r) => pins.has(r.id));
			case "bookmarks":
				return recipes.filter((r) => bookmarks.has(r.id));
			case "mine":
				return recipes.filter((r) => r.userId === user?.id);
			default:
				return recipes;
		}
	}, [recipes, source, pins, bookmarks, user?.id]);

	const filter = useMemo(() => createRecipeFilter(sourced), [sourced]);
	const results = useMemo(() => filter(deferredQuery), [filter, deferredQuery]);
	const sliced = results.slice((page - 1) * perPage, page * perPage);

	function toggle(id: number) {
		setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	}

	function confirm() {
		if (targetDay === null || !selected.length) return;
		onAdd(targetDay, selected);
		setSelected([]);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap justify-center gap-1">
				{SOURCES.map((s) => (
					<Button
						key={s.value}
						size="sm"
						variant={source === s.value ? "default" : "outline"}
						aria-pressed={source === s.value}
						onClick={() => {
							setSource(s.value);
							setPage(1);
						}}
					>
						{s.label}
					</Button>
				))}
			</div>

			<Input
				ref={inputRef}
				className="max-w-120 self-center shadow-inner-lg!"
				value={query}
				onChange={(e) => {
					setQuery(e.target.value);
					setPage(1);
				}}
				placeholder="Filter by name, tags, or ingredients.."
			/>

			{sliced.length === 0 ? (
				<p className="text-muted-foreground text-sm text-center">
					{query ? "No recipes match your search." : "No recipes here yet."}
				</p>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-2">
					{sliced.map((recipe) => {
						const isSelected = selected.includes(recipe.id);
						return (
							<PlanRecipeCard
								key={recipe.id}
								recipe={recipe}
								selected={isSelected}
								render={<button type="button" aria-pressed={isSelected} />}
								className="cursor-pointer hover:bg-muted"
								onClick={() => toggle(recipe.id)}
								actions={isSelected && <CheckIcon className="size-4" />}
							/>
						);
					})}
				</div>
			)}

			{results.length > perPage && (
				<ListPagination
					className="self-center"
					selected={page}
					select={setPage}
					total={results.length}
					perPage={perPage}
				/>
			)}

			<div className="sticky bottom-2 flex flex-wrap items-center justify-center gap-2 rounded-xl border bg-card p-2 shadow-lg">
				<span className="text-sm text-muted-foreground">Add to</span>
				{MealPlan.DAYS.map((name, day) => (
					<Button
						key={name}
						size="xs"
						variant={targetDay === day ? "default" : "outline"}
						aria-pressed={targetDay === day}
						onClick={() => onTargetDayChange(day)}
					>
						{name.slice(0, 3)}
					</Button>
				))}
				<Button
					size="sm"
					disabled={targetDay === null || !selected.length || pending}
					onClick={confirm}
				>
					{selected.length
						? `Add ${selected.length} to ${targetDay === null ? "…" : MealPlan.DAYS[targetDay]}`
						: "Select recipes"}
				</Button>
				{selected.length > 0 && (
					<Button size="sm" variant="ghost" onClick={() => setSelected([])}>
						Clear
					</Button>
				)}
			</div>
		</div>
	);
}
