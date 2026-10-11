import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { cn } from "@lib/utils";

interface Props extends React.ComponentProps<"button"> {
	form?: string;
	inProgress: boolean;
	error: string;
	success?: boolean;
}

export function SubmitButton({ children, className, form, inProgress, error, success }: Props) {
	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<Button
				type="submit"
				form={form}
				className="w-1/1"
				disabled={inProgress}
				variant="outline"
			>
				<div className="flex items-center gap-2">
					{inProgress && <Spinner />}
					{children}
				</div>
			</Button>
			{error && (
				<div
					role="alert"
					className="text-base text-center font-normal text-destructive"
				>
					{error}
				</div>
			)}
			{success && (
				<div
					role="status"
					className="text-base text-center font-normal text-green-600"
				>
					Saved
				</div>
			)}
		</div>
	);
}
