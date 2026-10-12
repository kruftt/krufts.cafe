import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@components/ui/item";
import { recipeUrl } from "@lib/recipe-url";
import { cn, formatDuration } from "@lib/utils";
import { ClockIcon } from "lucide-react";
import { Link } from "react-router";

interface PlanRecipe {
	id: number;
	name: string;
	prepTime: number;
	cookTime: number;
	user: { name: string };
}

interface Props extends React.ComponentProps<typeof Item> {
	recipe: PlanRecipe;
	selected?: boolean;
	linked?: boolean;
	actions?: React.ReactNode;
}

// Compact recipe card shared by the week and the picker. Extra props pass through to the
// root so a drag-and-drop library can attach its ref and listeners later.
export function PlanRecipeCard({ recipe, selected, linked, actions, className, ...rest }: Props) {
	return (
		<Item
			variant="outline"
			size="xs"
			className={cn(
				"bg-background flex-nowrap text-left",
				selected && "border-primary bg-accent",
				className,
			)}
			{...rest}
		>
			<ItemContent className="min-w-0">
				<ItemTitle className="w-full truncate block">
					{linked ? (
						<Link className="hover:underline" to={recipeUrl(recipe)}>
							{recipe.name}
						</Link>
					) : (
						recipe.name
					)}
				</ItemTitle>
				<ItemDescription className="flex items-center gap-1 text-xs">
					<ClockIcon className="size-3 shrink-0" />
					{formatDuration(recipe.prepTime + recipe.cookTime)}
					<span className="truncate">· {recipe.user.name}</span>
				</ItemDescription>
			</ItemContent>
			{actions && <ItemActions>{actions}</ItemActions>}
		</Item>
	);
}
