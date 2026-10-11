import { parsedAmountsAtom, parsedServesAtom } from "@atoms/amount";
import { activeStepIdAtom } from "@atoms/recipe";
import { Container, Header, Panel } from "@components/app";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { useBookmarks, usePins, useUser } from "@hooks";
import { ScrollNavigationContext, useScrollNavigation } from "@hooks/scroll-navigation";
import { parseAmount } from "@lib/amount";
import { formatDuration } from "@lib/utils";
import type { RecipeData } from "@services/recipe";
import { useAtom, useSetAtom } from "jotai";
import { BookmarkIcon, PinIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { IngredientGroup } from "./ingredient-group";
import { Step } from "./step";
import { StepBar } from "./step-bar";

interface Props extends React.ComponentProps<"div"> {
	recipe: RecipeData;
}

export function Recipe({ recipe }: Props) {
	const loggedIn = useUser() != null;

	const { isPinned, togglePin } = usePins();
	const pinned = isPinned(recipe.id);

	const { isBookmarked, toggleBookmark } = useBookmarks();
	const bookmarked = isBookmarked(recipe.id);

	const [activeStepId, setActiveStepId] = useAtom(activeStepIdAtom);
	const scrollNav = useScrollNavigation(recipe.steps);
	const setParsedAmounts = useSetAtom(parsedAmountsAtom);
	const [parsedServes, setParsedServes] = useAtom(parsedServesAtom);
	useEffect(() => {
		const amounts: Record<number, ReturnType<typeof parseAmount>> = {};
		for (const group of recipe.ingredientGroups) {
			for (const ingredient of group.ingredients) {
				if (ingredient.id !== undefined) {
					amounts[ingredient.id] = parseAmount(ingredient.amount);
				}
			}
		}
		setParsedAmounts(amounts);
		setParsedServes(parseAmount(recipe.serves));
		return () => { setParsedAmounts({}); setParsedServes(null); setActiveStepId(null); };
	}, [recipe.ingredientGroups, recipe.serves, setParsedAmounts, setParsedServes, setActiveStepId]);

	const [scale, setScale] = useState(1);

	return (
		<ScrollNavigationContext value={scrollNav}>
			<StepBar steps={recipe.steps} />
			<Container>
				<Header.Section>
					<Header.Title>
						<h2 className="recipe__title">{recipe.name}</h2>
						<div className="recipe__author">By {recipe.user.name}</div>
						<Button variant="ghost" onClick={() => togglePin(recipe)}>
							<PinIcon fill={pinned ? "currentColor" : "none"} />
						</Button>
						{loggedIn && (
							<Button variant="ghost" onClick={() => toggleBookmark(recipe.id)}>
								<BookmarkIcon fill={bookmarked ? "currentColor" : "none"} />
							</Button>
						)}
					</Header.Title>

					{recipe.tags.length > 0 && (
						<Header.Item>
							<div className="recipe__tags">
								{recipe.tags.map((tag) => (
									<Badge key={tag} variant="default" className="tag">
										{tag}
									</Badge>
								))}
							</div>
						</Header.Item>
					)}

					<Header.Item className="recipe__duration">
						<div>
							<div className="recipe__duration_title">Prep</div>
							<div className="recipe__duration_entry">
								{formatDuration(recipe.prepTime)}
							</div>
						</div>
						<div className="border-l" />
						<div>
							<div className="recipe__duration_title">Cook</div>
							<div className="recipe__duration_entry">
								{formatDuration(recipe.cookTime)}
							</div>
						</div>
						<div className="border-l" />
						<div>
							<div className="recipe__duration_title">Total</div>
							<div className="recipe__duration_entry">
								{formatDuration(recipe.prepTime + recipe.cookTime)}
							</div>
						</div>
					</Header.Item>

					<Header.Item className="recipe__serves">
						<div className="mb-2 flex justify-center items-baseline gap-2">
							Serves:
							<span className="font-bold">
								{parsedServes ? Math.round(parsedServes.value * scale) : recipe.serves}
								{parsedServes?.high !== undefined && ` - ${Math.round(parsedServes.high * scale)}`}
							</span>
						</div>
						<input
							className="max-w-40 px-0 accent-gray-700"
							type="range"
							aria-label="Scale"
							min={0.25}
							max={4.0}
							step={0.25}
							value={scale}
							onChange={(e) => setScale(parseFloat(e.currentTarget.value))}
						/>
					</Header.Item>
				</Header.Section>

				{recipe.intro && (
					<Panel.Section id="intro" className={activeStepId === null ? "panel__section--active" : undefined} onClick={(e) => {
						if (e.target !== e.currentTarget) return;
						if (window.getSelection()?.toString()) return;
						scrollNav.scrollTo(null);
					}}>
						<div className="recipe__intro">{recipe.intro}</div>
					</Panel.Section>
				)}

				<Panel.Section id="ingredients" className={activeStepId === "ingredients" ? "panel__section--active" : undefined} onClick={(e) => {
						if (e.target !== e.currentTarget) return;
						if (window.getSelection()?.toString()) return;
						scrollNav.scrollTo("ingredients");
					}}>
					<Panel.Title className="text-2xl justify-center">
						Ingredients
					</Panel.Title>

					<Panel.Item className="ingredient_groups">
						{(() => {
							const single = recipe.ingredientGroups.length === 1;
							return recipe.ingredientGroups.map((group) => (
								<IngredientGroup
									key={group.id}
									group={group}
									scale={scale}
									single={single}
								/>
							));
						})()}
					</Panel.Item>
				</Panel.Section>

				{(() => {
					const single = recipe.steps.length === 1;
					return recipe.steps.map((step, i) => (
						<Step key={step.id} step={step} index={i + 1} single={single} />
					));
				})()}
			</Container>
		</ScrollNavigationContext>
	);
}
