import { DeletionDialog } from "@components/controls";
import { Button } from "@components/ui/button";
import { useFieldValue, useIngredientIds, useRecipeDraft } from "@hooks/recipe-draft";
import { Field } from "@lib/recipe-draft";
import { PlusIcon, XIcon } from "lucide-react";
import { memo, useRef } from "react";
import { DraftInput } from "./draft-field";
import { IngredientEditor } from "./ingredient-editor";

export const IngredientGroupEditor = memo(function IngredientGroupEditor({ groupId }: { groupId: string }) {
	const groupRef = useRef<HTMLDivElement>(null);
	const { removeGroup, addIngredient } = useRecipeDraft();
	const nameField = Field.group(groupId, "name");
	const name = useFieldValue(nameField);
	const ingredientIds = useIngredientIds(groupId);

	function createIngredient() {
		addIngredient(groupId);
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
				<DraftInput
					placeholder="Group Name (optional)"
					className="ingredient_group__name"
					field={nameField}
				/>
				<DeletionDialog
					title="Delete Ingredient Section"
					message="Are you sure you wish to delete this ingredient group?"
					item={name}
					onConfirm={() => removeGroup(groupId)}
				>
					<Button variant="ghost">
						<XIcon color="red" className="size-6" />
					</Button>
				</DeletionDialog>
			</div>

			{ingredientIds.map((id) => (
				<IngredientEditor key={id} ingredientId={id} />
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
});
