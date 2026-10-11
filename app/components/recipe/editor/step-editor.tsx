import { Panel } from "@components/app";
import { DeletionDialog } from "@components/controls";
import { Button } from "@components/ui/button";
import { useFieldValue, useInstructionIds, useRecipeDraft } from "@hooks/recipe-draft";
import { Field } from "@lib/recipe-draft";
import { PlusIcon, XIcon } from "lucide-react";
import { memo, useRef } from "react";
import { DraftInput, DraftTextarea } from "./draft-field";
import { InstructionEditor } from "./instruction-editor";

interface Props {
	index: number;
	stepId: string;
}

export const StepEditor = memo(function StepEditor({ stepId, index }: Props) {
	const instructionsRef = useRef<HTMLDivElement>(null);
	const { removeStep, addInstruction } = useRecipeDraft();
	const nameField = Field.step(stepId, "name");
	const name = useFieldValue(nameField);
	const instructionIds = useInstructionIds(stepId);

	function createInstruction() {
		addInstruction(stepId);
		requestAnimationFrame(() => requestAnimationFrame(() => {
			const el = instructionsRef.current;
			if (!el) return;
			const textareas = el.querySelectorAll<HTMLTextAreaElement>(":scope textarea");
			const last = textareas.item(textareas.length - 1);
			if (last) last.focus();
		}));
	}

	return (
		<Panel.Section className="relative">
			<DeletionDialog
				title="Delete Step"
				message="Are you sure you want to delete this step?"
				item={name}
				onConfirm={() => removeStep(stepId)}
			>
				<Button variant="ghost" className="absolute z-10 top-4 right-4">
					<XIcon color="red" className="size-7" />
				</Button>
			</DeletionDialog>

			<Panel.Title>
				<span className="panel__index">{index}.</span>
				<DraftInput
					className="grow"
					placeholder="Step Name"
					field={nameField}
				/>
			</Panel.Title>

			<Panel.Item>
				<DraftTextarea
					className="step__intro"
					placeholder="Step overview (optional)..."
					field={Field.step(stepId, "intro")}
				/>
			</Panel.Item>

			<Panel.Item ref={instructionsRef}>
				{instructionIds.map((id, i) => (
					<InstructionEditor
						key={id}
						index={i + 1}
						instructionId={id}
					/>
				))}

				<div className="text-center">
					<Button
						className="justify-start mt-1 px-2"
						onClick={createInstruction}
					>
						<PlusIcon />
						Add Instruction
					</Button>
				</div>
			</Panel.Item>
		</Panel.Section>
	);
});
