import { Container, Header, Panel } from "@components/app";
import { Button, buttonVariants } from "@components/ui/button";
import { useFieldValue, useGroupIds, usePublished, useRecipeDraft, useStepIds } from "@hooks/recipe-draft";
import { Field } from "@lib/recipe-draft";
import { recipeUrl } from "@lib/recipe-url";
import { CheckSquareIcon, LinkIcon, PlusIcon, SquareIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { DraftInput, DraftTextarea } from "./draft-field";
import { IngredientGroupEditor } from "./ingredient-group-editor";
import { SaveStatus } from "./save-status";
import { StepEditor } from "./step-editor";
import { TagsEditor } from "./tags-editor";

// RecipeEditor subscribes only to the group and step id lists. Anything that reads other draft
// values lives in its own component below, so typing never re-renders the whole editor.
export function RecipeEditor() {
	const { recipe, addGroup, addStep } = useRecipeDraft();
	const groupIds = useGroupIds();
	const stepIds = useStepIds();

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
						<PublishToggle />
						<LiveLink />
					</div>
				</Header.Item>

				<Header.Item>
					<SaveStatus />
				</Header.Item>

				<Header.Title>
					<DraftInput
						field={Field.recipe("name")}
						className="recipe__title"
						inputStyle="rounded-2xl"
					/>
					<div className="recipe__author">By {recipe.user.name}</div>
				</Header.Title>

				<TagsEditor />

				<Header.Item className="recipe__duration">
					<div>
						<div className="recipe__duration_title">Prep</div>
						<div className="recipe__duration_entry">
							<DraftInput field={Field.recipe("prepTime")} resize />
							<span>min</span>
						</div>
					</div>
					<div className="border-l" />
					<div>
						<div className="recipe__duration_title">Cook</div>
						<div className="recipe__duration_entry">
							<DraftInput field={Field.recipe("cookTime")} resize />
							<span>min</span>
						</div>
					</div>
					<div className="border-l" />
					<div>
						<div className="recipe__duration_title">Total</div>
						<div className="recipe__duration_entry">
							<TotalTime />
						</div>
					</div>
				</Header.Item>

				<Header.Item className="recipe__serves">
					Serves
					<DraftInput
						className="font-bold ml-1"
						field={Field.recipe("serves")}
						resize
					/>
				</Header.Item>
			</Header.Section>

			<Panel.Section>
				<Panel.Item>
					<DraftTextarea
						className="recipe__intro"
						field={Field.recipe("intro")}
						placeholder="Recipe Introduction (optional)..."
					/>
				</Panel.Item>
			</Panel.Section>

			<Panel.Section>
				<Panel.Title className="text-2xl justify-center">
					Ingredients
				</Panel.Title>

				<Panel.Item className="ingredient_groups">
					{groupIds.map((id) => (
						<IngredientGroupEditor key={id} groupId={id} />
					))}
				</Panel.Item>

				<Panel.Item className="text-center">
					<Button onClick={createIngredientGroup}>
						<PlusIcon />
						Add Ingredient Group
					</Button>
				</Panel.Item>
			</Panel.Section>

			{stepIds.map((id, i) => (
				<StepEditor key={id} index={i + 1} stepId={id} />
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

function PublishToggle() {
	const { setPublished } = useRecipeDraft();
	const published = usePublished();

	return (
		<Button
			aria-label="Toggle published"
			size="sm"
			variant="outline"
			onClick={() => setPublished(!published)}
		>
			{published ? (
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
	);
}

function LiveLink() {
	const { recipe, saveNow } = useRecipeDraft();
	const navigate = useNavigate();
	const url = recipeUrl({ id: recipe.id, name: useFieldValue(Field.recipe("name")) });

	return (
		<Link
			tabIndex={0}
			to={url}
			onClick={async (e) => {
				// Save first so the view's loader doesn't read a stale recipe.
				if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
				e.preventDefault();
				if (await saveNow()) navigate(url);
			}}
			className={buttonVariants({ variant: "outline", size: "sm" })}
		>
			<LinkIcon />
			Live
		</Link>
	);
}

function TotalTime() {
	const prep = Number(useFieldValue(Field.recipe("prepTime"))) || 0;
	const cook = Number(useFieldValue(Field.recipe("cookTime"))) || 0;
	return `${prep + cook} min`;
}
