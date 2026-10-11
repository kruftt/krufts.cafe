import { parsedAmountsAtom } from "@atoms/amount";
import { formatAmount } from "@lib/amount";
import { cn } from "@lib/utils";
import type { IngredientGroupData } from "@services/recipe";
import { useAtomValue } from "jotai";

interface Props extends React.ComponentProps<"div"> {
	group: IngredientGroupData;
	scale: number;
	single: boolean;
}

export function IngredientGroup({ group, scale, single }: Props) {
	const parsedAmounts = useAtomValue(parsedAmountsAtom);

	return (
		<div className={cn("ingredient_group", !single && "break-inside-avoid")}>
			{!single && <h3 className="ingredient_group__name">{group.name}</h3>}
			{group.ingredients.map((ingredient) => {
				const parsed = ingredient.id !== undefined ? parsedAmounts[ingredient.id] : null;
				return (
					<div key={ingredient.id} className="ingredient">
						<span className="ingredient__amount mr-1">
							{parsed ? formatAmount(parsed, scale) : ""}
						</span>
						<span className="">
							{ingredient.units} {ingredient.name}
							{ingredient.preparation !== "" ? "," : ""}
						</span>
						<span className="ingredient__preparation ml-1">
							{ingredient.preparation}
						</span>
					</div>
				);
			})}
		</div>
	);
}