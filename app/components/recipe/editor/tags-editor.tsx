import { Header } from "@components/app";
import { InputEditor } from "@components/controls";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { type ProcedureOptions, useRecipeCache, useRecipeId } from "@hooks";
import { XIcon } from "lucide-react";
import { useRef, useState } from "react";

interface Props extends React.ComponentProps<"div"> {
	tags: string[];
}

export function TagsEditor({ tags }: Props) {
	const recipeId = useRecipeId();
	const { updateRecipe } = useRecipeCache(recipeId);

	const inputRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState("");

	// onSave(value, setError)

	function createTag(tag: string, options: ProcedureOptions) {
		if (tag === "") {
			options.onError({ message: "Please enter a tag." });
			return;
		}

		if (tags.includes(tag)) {
			options.onError({ message: "Tag already exists." });
			return;
		}

		updateRecipe.mutate({
			id: recipeId,
			tags: [...tags, tag],
		}, {
			...options,
			onSettled() {
				setTimeout(() => inputRef.current?.focus());
			}
		});
	}

	function removeTag(index: number) {
		const next = tags.filter((_, i) => i !== index);

		updateRecipe.mutate(
			{
				id: recipeId,
				tags: next,
			},
			{
				onError(err) {
					setError(err.message);
				},
			},
		);
	}

	return (
		<Header.Item className="recipe__tags">
			{tags.map((tag, i) => (
				<Badge key={tag} className="tag">
					<Button
						data-icon="inline-start"
						variant="ghost"
						className="rounded-l-4xl p-0 h-7 w-7 -ml-2 hover:bg-black/15 hover:border-r hover:border-r-secondary/50"
						onClick={() => removeTag(i)}
					>
						<XIcon className="" color="red" />
					</Button>
					{tag}
				</Badge>
			))}
			<div className="basis-1/1">
				<InputEditor
					ref={inputRef}
					className="text-center w-60 m-auto"
					onSave={createTag}
					placeholder="Add new tag..."
					clear
				/>
			</div>
		</Header.Item>
	);
}
