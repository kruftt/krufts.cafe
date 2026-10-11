import { DeletionDialog } from "@components/controls";
import { Button } from "@components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@components/ui/item";
import { useBookmarks } from "@hooks/bookmark";
import { usePins } from "@hooks/pins";
import { useUser } from "@hooks/session";
import { recipeUrl } from "@lib/recipe-url";
import { useTRPC } from "@lib/trpc";
import { formatDuration } from "@lib/utils";
import type { RecipeRowData } from "@services/recipe";
import { useMutation } from "@tanstack/react-query";
import {
	BookmarkIcon,
	ClockIcon,
	EditIcon,
	MenuIcon,
	PinIcon,
	Trash2Icon,
} from "lucide-react";
import { Link, useNavigate, useRevalidator } from "react-router";

export function RecipeRow({ recipe }: { recipe: RecipeRowData }) {
	const navigate = useNavigate();
	const revalidator = useRevalidator();
	const trpc = useTRPC();
	const { isPinned, togglePin } = usePins();
	const { isBookmarked, toggleBookmark } = useBookmarks();
	const user = useUser();
	const isLoggedIn = user !== null;
	const edit = user?.id === recipe.userId;
	const pinned = isPinned(recipe.id);
	const bookmarked = isBookmarked(recipe.id);

	const deleteMutation = useMutation(trpc.recipe.delete.mutationOptions());

	function deleteRecipe(recipe: RecipeRowData) {
		deleteMutation.mutate(
			{ id: recipe.id },
			{ onSuccess: revalidator.revalidate },
		);
	}

	return (
		<div className="flex justify-center items-start gap-2">
			<div className="flex not-sm:hidden">
				<Button variant="ghost" onClick={() => togglePin(recipe)}>
					<PinIcon fill={pinned ? "currentColor" : "none"} />
				</Button>
				{isLoggedIn && (
					<Button variant="ghost" onClick={() => toggleBookmark(recipe.id)}>
						<BookmarkIcon fill={bookmarked ? "currentColor" : "none"} />
					</Button>
				)}
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger
					className="sm:hidden"
					render={<Button variant="ghost" />}
				>
					<MenuIcon />
				</DropdownMenuTrigger>
				<DropdownMenuContent className="sm:hidden">
					<DropdownMenuItem onClick={() => togglePin(recipe)}>
						<PinIcon fill={pinned ? "currentColor" : "none"} />
						{pinned ? "Unpin" : "Pin"}
					</DropdownMenuItem>
					{isLoggedIn && (
						<DropdownMenuItem onClick={() => toggleBookmark(recipe.id)}>
							<BookmarkIcon fill={bookmarked ? "currentColor" : "none"} />
							{bookmarked ? "Remove Bookmark" : "Bookmark"}
						</DropdownMenuItem>
					)}
					{edit && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => navigate(`/edit/${recipe.id}`)}>
								<EditIcon />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem variant="destructive">
								<Trash2Icon />
								Delete
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			<Item
				className="py-1.5"
				variant="default"
				render={
					<Link
						to={recipeUrl(recipe)}
						tabIndex={0}
					>
						<ItemContent>
							<ItemTitle>{recipe.name}</ItemTitle>
							<ItemDescription>By {recipe.user.name}</ItemDescription>
						</ItemContent>
						<ItemMedia variant="icon">
							<ClockIcon />
							{formatDuration(recipe.prepTime + recipe.cookTime)}
						</ItemMedia>
					</Link>
				}
				size="xs"
			/>
			{edit && (
				<div className="flex not-sm:hidden">
					<Button
						variant="ghost"
						onClick={() => navigate(`/edit/${recipe.id}`)}
					>
						<EditIcon />
					</Button>
					<DeletionDialog
						title="Delete Recipe"
						message="The following recipe will be deleted:"
						item={recipe.name}
						onConfirm={() => deleteRecipe(recipe)}
					>
						<Button variant="ghost">
							<Trash2Icon color="red" />
						</Button>
					</DeletionDialog>
				</div>
			)}
		</div>
	);
}
