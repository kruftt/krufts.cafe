import { Button } from "@components/ui/button";
import { useRecipeDraft } from "@hooks/recipe-draft";
import { Field } from "@lib/recipe-draft";
import { XIcon } from "lucide-react";
import { memo } from "react";
import { DraftInput, DraftTextarea } from "./draft-field";

export const IngredientEditor = memo(function IngredientEditor({ ingredientId }: { ingredientId: string }) {
	const { removeIngredient } = useRecipeDraft();

	return (
		<div className="flex items-start justify-start">
			<Button
				variant="ghost"
				className="h-8 w-8 mr-1"
				onClick={() => removeIngredient(ingredientId)}
			>
				<XIcon className="h-4 w-4" color="red" />
			</Button>
			<div className="ingredient flex flex-wrap items-baseline gap-x-1 gap-y-0">
				<DraftInput
					className="ingredient__amount"
					field={Field.ingredient(ingredientId, "amount")}
					placeholder="#"
					resize
				/>
				<DraftInput
					field={Field.ingredient(ingredientId, "units")}
					placeholder="units"
					resize
				/>
				<DraftTextarea
					field={Field.ingredient(ingredientId, "name")}
					placeholder="name"
					resize
				/>
				<DraftTextarea
					className="ingredient__preparation grow"
					styles="grow"
					field={Field.ingredient(ingredientId, "preparation")}
					placeholder="preparation"
					resize
				/>
			</div>
		</div>
	);
});
