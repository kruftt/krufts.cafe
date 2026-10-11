import { Panel } from "@components/app";
import {
	DeletionDialog,
	InputEditor,
	TextareaEditor,
} from "@components/controls";
import { Button } from "@components/ui/button";
import { useRecipeDraft } from "@hooks/recipe-draft";
import type { RecipeBody } from "@schema";
import { PlusIcon, XIcon } from "lucide-react";
import { useRef } from "react";
import { InstructionEditor } from "./instruction-editor";

interface Props {
	index: number;
	step: RecipeBody.Step;
}

export function StepEditor({ step, index }: Props) {
	const instructionsRef = useRef<HTMLDivElement>(null);
	const { saveStepField, removeStep, addInstruction } = useRecipeDraft();

	function createInstruction() {
		addInstruction(step.id);
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
				item={step.name}
				onConfirm={() => removeStep(step.id)}
			>
				<Button variant="ghost" className="absolute z-10 top-4 right-4">
					<XIcon color="red" className="size-7" />
				</Button>
			</DeletionDialog>

			<Panel.Title>
				<span className="panel__index">{index}.</span>
				<InputEditor
					className="grow"
					placeholder="Step Name"
					onSave={saveStepField(step.id, "name")}
					value={step.name}
				/>
			</Panel.Title>

			<Panel.Item>
				<TextareaEditor
					value={step.intro}
					className="step__intro"
					placeholder="Step overview (optional)..."
					onSave={saveStepField(step.id, "intro")}
				/>
			</Panel.Item>

			<Panel.Item ref={instructionsRef}>
				{step.instructions.map((instruction, i) => (
					<InstructionEditor
						key={instruction.id}
						index={i + 1}
						instruction={instruction}
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
}
