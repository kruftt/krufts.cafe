import { TextareaEditor } from "@components/controls";
import { Button } from "@components/ui/button";
import { useRecipeDraft } from "@hooks/recipe-draft";
import type { RecipeBody } from "@schema";
import { XIcon } from "lucide-react";

interface Props extends React.ComponentProps<"div"> {
	index: number;
	instruction: RecipeBody.Instruction;
}

export function InstructionEditor({ index, instruction }: Props) {
	const { saveInstructionField, removeInstruction } = useRecipeDraft();

	return (
		<div className="flex items-start justify-start gap-1">
			<Button
				variant="ghost"
				className="w-8 h-8 relative -top-0.5"
				onClick={() => removeInstruction(instruction.id)}
			>
				<XIcon className="h-4 w-4" color="red" />
			</Button>
			<div className="instruction">
				<span className="">{index}.</span>
				<TextareaEditor
					value={instruction.text}
					placeholder="Insert instruction here"
					onSave={saveInstructionField(instruction.id, "text")}
				/>
			</div>
		</div>
	);
}
