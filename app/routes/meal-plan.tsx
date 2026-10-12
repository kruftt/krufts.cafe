import { Container, Header, Panel } from "@components/app";
import { DeletionDialog } from "@components/controls";
import { PlanDay, RecipePicker, ShoppingList } from "@components/meal-plan";
import { Button } from "@components/ui/button";
import { requireAuth } from "@lib/auth-loader";
import { useTRPC } from "@lib/trpc";
import { MealPlan } from "@schema";
import { findMealPlan, findPlannableRecipes } from "@services/meal-plan";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useRevalidator } from "react-router";
import type { Route } from "./+types/meal-plan";

export async function loader({ request }: Route.LoaderArgs) {
	const session = await requireAuth(request);
	const [plan, recipes] = await Promise.all([
		findMealPlan(session.user.id),
		findPlannableRecipes(session.user.id),
	]);
	return { plan, recipes };
}

export default function MealPlanPage({ loaderData }: Route.ComponentProps) {
	const { plan, recipes } = loaderData;
	const trpc = useTRPC();
	const revalidator = useRevalidator();
	const [targetDay, setTargetDay] = useState<MealPlan.Day | null>(null);
	const pickerRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	const revalidate = { onSuccess: () => revalidator.revalidate() };
	const addMutation = useMutation(trpc.mealPlan.add.mutationOptions(revalidate));
	const removeMutation = useMutation(trpc.mealPlan.remove.mutationOptions(revalidate));
	const noteMutation = useMutation(trpc.mealPlan.setNote.mutationOptions(revalidate));
	const clearMutation = useMutation(trpc.mealPlan.clear.mutationOptions(revalidate));

	function startAdding(day: MealPlan.Day) {
		setTargetDay(day);
		pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		searchRef.current?.focus({ preventScroll: true });
	}

	return (
		<Container>
			<Header.Section className="userpage__header">
				<Header.Title>
					<h2 className="mb-6">Meal Plan</h2>
				</Header.Title>
			</Header.Section>

			<Panel.Section>
				<div className="flex items-center justify-between">
					<Panel.Title>This Week</Panel.Title>
					<DeletionDialog
						title="Clear Meal Plan"
						message="All recipes and notes will be removed from:"
						item="This week's plan"
						onConfirm={() => clearMutation.mutate()}
					>
						<Button variant="ghost" size="sm" disabled={!plan.entries.length && !Object.keys(plan.notes).length}>
							Clear week
						</Button>
					</DeletionDialog>
				</div>
				<div className="flex flex-col gap-3">
					{MealPlan.DAYS.map((name, day) => (
						<PlanDay
							key={name}
							day={day}
							entries={plan.entries.filter((e) => e.day === day)}
							note={plan.notes[day] ?? ""}
							targeted={targetDay === day}
							onAdd={startAdding}
							onRemove={(id) => removeMutation.mutate({ id })}
							onNoteChange={(day, text) => noteMutation.mutate({ day, text })}
						/>
					))}
				</div>
			</Panel.Section>

			<Panel.Section ref={pickerRef} className="scroll-mt-4">
				<Panel.Title>Recipes</Panel.Title>
				<RecipePicker
					recipes={recipes}
					targetDay={targetDay}
					onTargetDayChange={setTargetDay}
					onAdd={(day, recipeIds) => addMutation.mutate({ day, recipeIds })}
					pending={addMutation.isPending}
					inputRef={searchRef}
				/>
			</Panel.Section>

			<Panel.Section>
				<Panel.Title>Shopping List</Panel.Title>
				<ShoppingList entries={plan.entries} />
			</Panel.Section>
		</Container>
	);
}
