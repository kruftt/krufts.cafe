import { DeletionDialog, InputEditor } from "@components/controls";
import { Button } from "@components/ui/button";
import { useRecipeDraft } from "@hooks/recipe-draft";
import type { RecipeBody } from "@schema";
import { PlusIcon, XIcon } from "lucide-react";
import { useRef } from "react";
import { IngredientEditor } from "./ingredient-editor";

interface Props {
	group: RecipeBody.IngredientGroup;
}

export function IngredientGroupEditor({ group }: Props) {
	const groupRef = useRef<HTMLDivElement>(null);
	const { saveGroupField, removeGroup, addIngredient } = useRecipeDraft();

	function createIngredient() {
		addIngredient(group.id);
		requestAnimationFrame(() => requestAnimationFrame(() => {
			const el = groupRef.current;
			if (!el) return;
			const amounts = el.querySelectorAll<HTMLInputElement>(":scope .ingredient__amount > input");
			const last = amounts.item(amounts.length - 1);
			if (last) last.select();
		}));
	}

	return (
		<div ref={groupRef} className="ingredient_group break-inside-avoid">
			<div className="flex">
				<InputEditor
					placeholder="Group Name (optional)"
					className="ingredient_group__name"
					value={group.name}
					onSave={saveGroupField(group.id, "name")}
				/>
				<DeletionDialog
					title="Delete Ingredient Section"
					message="Are you sure you wish to delete this ingredient group?"
					item={group.name}
					onConfirm={() => removeGroup(group.id)}
				>
					<Button variant="ghost">
						<XIcon color="red" className="size-6" />
					</Button>
				</DeletionDialog>
			</div>

			{group.ingredients.map((ingredient) => (
				<IngredientEditor key={ingredient.id} ingredient={ingredient} />
			))}

			<Button
				className="w-1/1 -ml-1 justify-start"
				variant="ghost"
				onClick={createIngredient}
			>
				<PlusIcon />
				<span className="text-muted-foreground ml-2 text-sm font-light">
					Add Ingredient
				</span>
			</Button>
		</div>
	);
}
