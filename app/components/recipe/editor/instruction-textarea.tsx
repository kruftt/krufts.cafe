import { useFieldValue, useIngredientGroups, useRecipeDraft } from "@hooks/recipe-draft";
import { parseAmount } from "@lib/amount";
import { formatIngredient, hasTokens, ingredientMap, token } from "@lib/ingredient-ref";
import type { DraftField } from "@lib/recipe-draft";
import { cn } from "@lib/utils";
import { useMemo, useRef, useState } from "react";
import { InstructionText } from "../view/instruction-text";
import { DraftTextarea } from "./draft-field";

// An "@" at the start or after whitespace opens the ingredient picker; the text after it filters by name.
const MENTION = /(?:^|\s)@([^@{}\n]{0,40})$/;
const MAX_MATCHES = 8;

interface Props {
	field: DraftField;
	placeholder?: string;
}

export function InstructionTextarea({ field, placeholder }: Props) {
	const ref = useRef<HTMLTextAreaElement>(null);
	const { setField } = useRecipeDraft();
	const value = useFieldValue(field);
	const groups = useIngredientGroups();
	const ingredients = useMemo(() => ingredientMap(groups), [groups]);

	// Caret position while focused; null hides the picker.
	const [caret, setCaret] = useState<number | null>(null);
	// Position of the "@" the user closed the picker for with Escape.
	const [dismissed, setDismissed] = useState<number | null>(null);
	const [highlight, setHighlight] = useState({ query: "", index: 0 });

	const mention = caret === null ? null : MENTION.exec(value.slice(0, caret));
	const query = mention?.[1] ?? "";
	const start = caret === null ? -1 : caret - query.length - 1;
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	const matches =
		mention && start !== dismissed
			? groups
					.flatMap((g) => g.ingredients.map((ingredient) => ({ ingredient, group: g.name })))
					.filter(({ ingredient }) => {
						const name = ingredient.name.toLowerCase();
						return name !== "" && words.every((w) => name.includes(w));
					})
					.slice(0, MAX_MATCHES)
			: [];
	const open = matches.length > 0;
	const active = highlight.query === query ? Math.min(highlight.index, matches.length - 1) : 0;
	const showGroups = groups.length > 1;

	function insert(id: string) {
		if (caret === null) return;
		const inserted = token(id);
		const pos = start + inserted.length;
		setField(field, value.slice(0, start) + inserted + value.slice(caret));
		requestAnimationFrame(() => ref.current?.setSelectionRange(pos, pos));
	}

	function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (!open) return;
		const move = (by: number) => setHighlight({ query, index: (active + by + matches.length) % matches.length });
		if (e.key === "ArrowDown") move(1);
		else if (e.key === "ArrowUp") move(-1);
		else if (e.key === "Enter" || e.key === "Tab") {
			const match = matches[active];
			if (match) insert(match.ingredient.id);
		} else if (e.key === "Escape") setDismissed(start);
		else return;
		e.preventDefault();
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: catches the textarea's blur; DraftTextarea owns its onBlur
		<div className="relative grow" onBlur={() => setCaret(null)}>
			<DraftTextarea
				ref={ref}
				field={field}
				placeholder={placeholder}
				onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
				onKeyDown={onKeyDown}
				aria-autocomplete="list"
				aria-expanded={open}
			/>

			{open && (
				<div
					role="listbox"
					className="absolute top-full left-0 z-50 mt-1 w-72 rounded-md bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10"
					// Keep focus (and the caret) in the textarea while clicking an option.
					onMouseDown={(e) => e.preventDefault()}
				>
					{matches.map(({ ingredient, group }, i) => (
						// biome-ignore lint/a11y/useKeyWithClickEvents: the textarea handles keyboard selection
						<div
							key={ingredient.id}
							role="option"
							aria-selected={i === active}
							tabIndex={-1}
							className={cn("cursor-pointer rounded px-2 py-1", i === active && "bg-accent text-accent-foreground")}
							onMouseEnter={() => setHighlight({ query, index: i })}
							onClick={() => insert(ingredient.id)}
						>
							{formatIngredient(ingredient, parseAmount(ingredient.amount), 1)}
							{showGroups && group && <span className="ml-2 text-muted-foreground">{group}</span>}
						</div>
					))}
					<div className="px-2 pt-1 text-xs text-muted-foreground">
						Write {"{{id|1/2}}"} to use only part of the amount.
					</div>
				</div>
			)}

			{hasTokens(value) && (
				<div className="text-sm text-muted-foreground whitespace-pre-wrap">
					<InstructionText text={value} ingredients={ingredients} scale={1} />
				</div>
			)}
		</div>
	);
}
