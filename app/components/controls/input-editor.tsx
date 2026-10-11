import { type ProcedureOptions, useEditor } from "@hooks";
import { cn } from "@lib/utils";

interface Props extends React.ComponentProps<"input"> {
	onSave: ((v: string, options: ProcedureOptions) => void)
	clear?: boolean;
	reset?: boolean;
	resize?: boolean;
	inputStyle?: string;
}

export function InputEditor ({
	className,
	clear,
	onSave,
	value: initialValue,
	inputStyle,
	reset,
	resize,
	type,
	...rest
}: Props) {
	const { value, busy, error, onKeyDown, onChange, onBlur } = useEditor(
		initialValue?.toString() || "",
		onSave,
		{ clear, reset, type },
	);

	const errorId = rest.id ? `${rest.id}-error` : undefined;

	return (
		<div
			className={cn(
				"relative flex items-center",
				resize ? "" : "grow",
				className,
			)}
		>
			<input
				className={cn(
					"input",
					resize ? "field-sizing-content" : "w-1/1",
					inputStyle,
				)}
				aria-invalid={!!error}
				aria-describedby={error ? errorId : undefined}
				value={value}
				disabled={busy}
				aria-disabled={busy}
				onChange={onChange}
				onBlur={onBlur}
				onKeyDown={onKeyDown}
				{...rest}
			/>
			{error && (
				<span id={errorId} className="input__error">
					{error}
				</span>
			)}
		</div>
	);
}
