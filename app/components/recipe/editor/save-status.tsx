import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { useRecipeDraft, useSaveStatus } from "@hooks/recipe-draft";
import { AlertTriangleIcon, CheckIcon, CircleDotIcon } from "lucide-react";

export function SaveStatus() {
	const { flush } = useRecipeDraft();
	const { status, message } = useSaveStatus();

	if (status === "error") {
		return (
			<div role="alert" className="flex items-center justify-center gap-2 text-sm text-destructive">
				<AlertTriangleIcon className="size-4" />
				<span>{message || "Save failed."}</span>
				<Button size="sm" variant="outline" onClick={() => void flush()}>
					Retry
				</Button>
			</div>
		);
	}

	if (status === "conflict" || status === "invalid") {
		return (
			<div role="status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
				<AlertTriangleIcon className="size-4" />
				<span>{message}</span>
			</div>
		);
	}

	return (
		<div role="status" className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
			{status === "saved" && <CheckIcon className="size-4" />}
			{status === "dirty" && <CircleDotIcon className="size-4" />}
			{status === "saving" && <Spinner className="size-4" />}
			<span>{{ saved: "Saved", dirty: "Unsaved changes", saving: "Saving..." }[status]}</span>
		</div>
	);
}
