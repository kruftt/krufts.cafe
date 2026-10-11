import { Button } from "@components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@components/ui/dialog";
import { useState } from "react";

export function DeletionDialog({
	children,
	title,
	message,
  item,
  onConfirm,
}: React.PropsWithChildren & {
  children: React.ReactElement
	title: string;
	message: string;
  item: string;
  onConfirm: () => void
}) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
			<DialogTrigger
				render={ children }
			/>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{ title }</DialogTitle>
					<DialogDescription>{ message }</DialogDescription>
				</DialogHeader>
				<div className="text-center">{item}</div>
				<div className="flex gap-3 justify-around">
					<DialogClose render={<Button />}>Cancel</DialogClose>
					<Button variant="destructive" onClick={() => { onConfirm(); setOpen(false); }}>
						Delete
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
