import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { useRecipeDraft } from "@hooks/recipe-draft";
import { AlertTriangleIcon, CheckIcon } from "lucide-react";

export function SaveStatus() {
	const { status, message, retry } = useRecipeDraft();

	if (status === "error") {
		return (
			<div role="alert" className="flex items-center justify-center gap-2 text-sm text-destructive">
				<AlertTriangleIcon className="size-4" />
				<span>{message || "Save failed."}</span>
				<Button size="sm" variant="outline" onClick={retry}>
					Retry
				</Button>
			</div>
		);
	}

	if (status === "conflict") {
		return (
			<div role="status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
				<AlertTriangleIcon className="size-4" />
				<span>{message}</span>
			</div>
		);
	}

	return (
		<div role="status" className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
			{status === "saved" ? <CheckIcon className="size-4" /> : <Spinner className="size-4" />}
			<span>{status === "saved" ? "Saved" : "Saving..."}</span>
		</div>
	);
}
