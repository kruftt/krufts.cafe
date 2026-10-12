import { Button } from "@components/ui/button";
import { useRecipeDraft } from "@hooks/recipe-draft";
import { Field } from "@lib/recipe-draft";
import { XIcon } from "lucide-react";
import { memo } from "react";
import { InstructionTextarea } from "./instruction-textarea";

interface Props {
	index: number;
	instructionId: string;
}

export const InstructionEditor = memo(function InstructionEditor({ index, instructionId }: Props) {
	const { removeInstruction } = useRecipeDraft();

	return (
		<div className="flex items-start justify-start gap-1">
			<Button
				variant="ghost"
				className="w-8 h-8 relative -top-0.5"
				onClick={() => removeInstruction(instructionId)}
			>
				<XIcon className="h-4 w-4" color="red" />
			</Button>
			<div className="instruction">
				<span className="">{index}.</span>
				<InstructionTextarea
					field={Field.instruction(instructionId, "text")}
					placeholder="Insert instruction here (@ adds an ingredient)"
				/>
			</div>
		</div>
	);
});
