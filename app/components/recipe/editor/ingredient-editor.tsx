import { InputEditor, TextareaEditor } from "@components/controls";
import { Button } from "@components/ui/button";
import { useRecipeDraft } from "@hooks/recipe-draft";
import type { RecipeBody } from "@schema";
import { XIcon } from "lucide-react";

export function IngredientEditor({
	ingredient,
}: {
	ingredient: RecipeBody.Ingredient;
}) {
	const { saveIngredientField, removeIngredient } = useRecipeDraft();

	return (
		<div className="flex items-start justify-start">
			<Button
				variant="ghost"
				className="h-8 w-8 mr-1"
				onClick={() => removeIngredient(ingredient.id)}
			>
				<XIcon className="h-4 w-4" color="red" />
			</Button>
			<div className="ingredient flex flex-wrap items-baseline gap-x-1 gap-y-0">
				<InputEditor
					className="ingredient__amount"
					value={ingredient.amount}
					onSave={saveIngredientField(ingredient.id, "amount")}
					placeholder="#"
					resize
				/>
				<InputEditor
					value={ingredient.units}
					onSave={saveIngredientField(ingredient.id, "units")}
					placeholder="units"
					resize
				/>
				<TextareaEditor
					value={ingredient.name}
					onSave={saveIngredientField(ingredient.id, "name")}
					placeholder="name"
					resize
				/>
				<TextareaEditor
					className="ingredient__preparation grow"
					styles="grow"
					value={ingredient.preparation}
					onSave={saveIngredientField(ingredient.id, "preparation")}
					placeholder="preparation"
					resize
				/>
			</div>
		</div>
	);
}
