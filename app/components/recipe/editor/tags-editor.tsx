import { Header } from "@components/app";
import { InputEditor } from "@components/controls";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import type { ProcedureOptions } from "@hooks/editor";
import { useRecipeDraft } from "@hooks/recipe-draft";
import { Recipe } from "@schema";
import { XIcon } from "lucide-react";
import { useRef } from "react";

export function TagsEditor() {
	const { draft, setTags } = useRecipeDraft();
	const tags = draft.tags;
	const inputRef = useRef<HTMLInputElement>(null);

	function createTag(tag: string, options: ProcedureOptions) {
		if (tag === "") {
			options.onError({ message: "Please enter a tag." });
			return;
		}

		if (tags.includes(tag)) {
			options.onError({ message: "Tag already exists." });
			return;
		}

		const next = Recipe.Fields.shape.tags.safeParse([...tags, tag]);
		if (!next.success) {
			options.onError({ message: tags.length >= 20 ? "Too many tags." : "Tag is too long." });
			return;
		}

		setTags(next.data);
		options.onSuccess();
		setTimeout(() => inputRef.current?.focus());
	}

	function removeTag(index: number) {
		setTags(tags.filter((_, i) => i !== index));
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
