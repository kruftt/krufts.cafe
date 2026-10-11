import { Container, Header, Panel } from "@components/app";
import { InputEditor, TextareaEditor } from "@components/controls";
import { Button, buttonVariants } from "@components/ui/button";
import { useRecipeDraft } from "@hooks/recipe-draft";
import { CheckSquareIcon, LinkIcon, PlusIcon, SquareIcon } from "lucide-react";
import { Link } from "react-router";
import { IngredientGroupEditor } from "./ingredient-group-editor";
import { SaveStatus } from "./save-status";
import { StepEditor } from "./step-editor";
import { TagsEditor } from "./tags-editor";

export function RecipeEditor() {
	const { recipe, draft, saveRecipeField, setPublished, addGroup, addStep } = useRecipeDraft();

	function createIngredientGroup() {
		addGroup();
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				const groups = document.querySelectorAll<HTMLInputElement>(
					".ingredient_group input",
				);
				const last = groups.item(groups.length - 1);
				if (last) last.focus();
			}),
		);
	}

	function createStep() {
		addStep();
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				const stepTitles = document.querySelectorAll<HTMLInputElement>(
					".panel__title input",
				);
				const last = stepTitles.item(stepTitles.length - 1);
				if (last) last.focus();
			}),
		);
	}

	return (
		<Container>
			<Header.Section>
				<Header.Item>
					<div className="flex gap-1 justify-center">
						<Button
							aria-label="Toggle published"
							size="sm"
							variant="outline"
							onClick={() => setPublished(!draft.published)}
						>
							{draft.published ? (
								<>
									<CheckSquareIcon />
									Published
								</>
							) : (
								<>
									<SquareIcon />
									Unpublished
								</>
							)}
						</Button>
						<Link
							tabIndex={0}
							to={`/recipes/${recipe.user.handle}/${recipe.slug}`}
							className={`${buttonVariants({ variant: "outline", size: "sm" })}`}
						>
							<LinkIcon />
							Live
						</Link>
					</div>
				</Header.Item>

				<Header.Item>
					<SaveStatus />
				</Header.Item>

				<Header.Title>
					<InputEditor
						value={draft.name}
						className="recipe__title"
						inputStyle="rounded-2xl"
						onSave={saveRecipeField("name")}
					/>
					<div className="recipe__author">By {recipe.user.name}</div>
				</Header.Title>

				<TagsEditor />

				<Header.Item className="recipe__duration">
					<div>
						<div className="recipe__duration_title">Prep</div>
						<div className="recipe__duration_entry">
							<InputEditor
								onSave={saveRecipeField("prepTime")}
								value={draft.prepTime}
								resize
							/>
							<span>min</span>
						</div>
					</div>
					<div className="border-l" />
					<div>
						<div className="recipe__duration_title">Cook</div>
						<div className="recipe__duration_entry">
							<InputEditor
								onSave={saveRecipeField("cookTime")}
								value={draft.cookTime}
								resize
							/>
							<span>min</span>
						</div>
					</div>
					<div className="border-l" />
					<div>
						<div className="recipe__duration_title">Total</div>
						<div className="recipe__duration_entry">
							{`${draft.prepTime + draft.cookTime} min`}
						</div>
					</div>
				</Header.Item>

				<Header.Item className="recipe__serves">
					Serves
					<InputEditor
						className="font-bold ml-1"
						onSave={saveRecipeField("serves")}
						value={draft.serves}
						resize
					/>
				</Header.Item>
			</Header.Section>

			<Panel.Section>
				<Panel.Item>
					<TextareaEditor
						className="recipe__intro"
						onSave={saveRecipeField("intro")}
						placeholder="Recipe Introduction (optional)..."
						value={draft.intro}
					/>
				</Panel.Item>
			</Panel.Section>

			<Panel.Section>
				<Panel.Title className="text-2xl justify-center">
					Ingredients
				</Panel.Title>

				<Panel.Item className="ingredient_groups">
					{draft.body.ingredientGroups.map((group) => (
						<IngredientGroupEditor key={group.id} group={group} />
					))}
				</Panel.Item>

				<Panel.Item className="text-center">
					<Button onClick={createIngredientGroup}>
						<PlusIcon />
						Add Ingredient Group
					</Button>
				</Panel.Item>
			</Panel.Section>

			{draft.body.steps.map((step, i) => (
				<StepEditor key={step.id} index={i + 1} step={step} />
			))}

			<div className="w-1/1 mt-6 text-center">
				<Button onClick={createStep}>
					<PlusIcon />
					Add Step
				</Button>
			</div>
			<div className="h-screen" />
		</Container>
	);
}
