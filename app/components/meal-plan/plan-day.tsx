import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { cn } from "@lib/utils";
import { MealPlan } from "@schema";
import type { MealPlanEntryData } from "@services/meal-plan";
import { PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { PlanRecipeCard } from "./plan-recipe-card";

interface Props {
	day: MealPlan.Day;
	entries: MealPlanEntryData[];
	note: string;
	targeted: boolean;
	onAdd: (day: MealPlan.Day) => void;
	onRemove: (entryId: number) => void;
	onNoteChange: (day: MealPlan.Day, text: string) => void;
}

export function PlanDay({ day, entries, note, targeted, onAdd, onRemove, onNoteChange }: Props) {
	const [text, setText] = useState(note);
	useEffect(() => setText(note), [note]);

	function saveNote() {
		if (text.trim() !== note) onNoteChange(day, text);
	}

	return (
		<section
			id={`plan-day-${day}`}
			className={cn(
				"flex flex-col gap-2 rounded-xl border p-3 transition-colors",
				targeted && "panel__section--active",
			)}
		>
			<div className="flex items-center gap-2">
				<h3 className="font-bold w-24 shrink-0">{MealPlan.DAYS[day]}</h3>
				<Input
					className="h-8 text-sm"
					value={text}
					maxLength={500}
					placeholder="Note"
					aria-label={`${MealPlan.DAYS[day]} note`}
					onChange={(e) => setText(e.target.value)}
					onBlur={saveNote}
					onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
				/>
				<Button
					variant={targeted ? "default" : "ghost"}
					size="sm"
					onClick={() => onAdd(day)}
					aria-label={`Add recipes to ${MealPlan.DAYS[day]}`}
				>
					<PlusIcon />
					Add
				</Button>
			</div>
			{entries.length > 0 && (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-2">
					{entries.map((entry) => (
						<PlanRecipeCard
							key={entry.id}
							recipe={entry.recipe}
							linked
							actions={
								<Button
									variant="ghost"
									size="icon-xs"
									aria-label={`Remove ${entry.recipe.name}`}
									onClick={() => onRemove(entry.id)}
								>
									<XIcon />
								</Button>
							}
						/>
					))}
				</div>
			)}
		</section>
	);
}
