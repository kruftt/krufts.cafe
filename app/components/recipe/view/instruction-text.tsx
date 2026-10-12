import { formatIngredient, type IngredientMap, parseInstruction } from "@lib/ingredient-ref";

interface Props {
	text: string;
	ingredients: IngredientMap;
	scale: number;
}

export function InstructionText({ text, ingredients, scale }: Props) {
	return parseInstruction(text, ingredients).map((seg, i) => {
		const key = `${i}`;
		if (seg.type === "text") return seg.text;
		if (seg.type === "missing") {
			return (
				<span key={key} className="instruction__ref instruction__ref--missing" title={seg.raw}>
					{seg.reason === "ingredient" ? "missing ingredient" : "invalid amount"}
				</span>
			);
		}
		return (
			<span key={key} className="instruction__ref">
				{formatIngredient(seg.ingredient, seg.amount, scale)}
			</span>
		);
	});
}
