import { Header } from "@components/app";
import { InputEditor } from "@components/controls";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { useRecipeDraft, useTags } from "@hooks/recipe-draft";
import { Recipe } from "@schema";
import { XIcon } from "lucide-react";
import { useState } from "react";

export function TagsEditor() {
	const { setTags } = useRecipeDraft();
	const tags = useTags();
	// The new-tag input is an add form, not draft data, so it keeps its own text.
	const [text, setText] = useState("");
	const [error, setError] = useState("");

	function createTag() {
		const tag = text.trim();
		if (tag === "") {
			setError("Please enter a tag.");
			return;
		}

		if (tags.includes(tag)) {
			setError("Tag already exists.");
			return;
		}

		const next = Recipe.Fields.shape.tags.safeParse([...tags, tag]);
		if (!next.success) {
			setError(tags.length >= 20 ? "Too many tags." : "Tag is too long.");
			return;
		}

		setTags(next.data);
		setText("");
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
					className="text-center w-60 m-auto"
					value={text}
					error={error}
					onChange={(v) => {
						setText(v);
						setError("");
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") createTag();
					}}
					onBlur={() => {
						if (text.trim()) createTag();
						else setError("");
					}}
					placeholder="Add new tag..."
				/>
			</div>
		</Header.Item>
	);
}
