import { Button } from "@components/ui/button";
import { useTRPC } from "@lib/trpc";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";

export function CreateRecipeButton() {
	const trpc = useTRPC();
	const createRecipe = useMutation(trpc.recipe.create.mutationOptions());
	const navigate = useNavigate();

	function submit() {
		createRecipe.mutate(undefined, {
			onSuccess: (data) => {
				navigate(`/edit/${data.id}`);
			},
		});
	}

	return (
		<Button className="mx-auto mb-6" variant="outline" onClick={submit}>
			Create New Recipe
		</Button>
	);
}
