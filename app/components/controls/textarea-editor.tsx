import { type ProcedureOptions, useEditor } from "@hooks";
import { cn } from "@lib/utils";

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	onSave: (v: string, options: ProcedureOptions) => void;
	resize?: boolean;
	styles?: string;
}

export function TextareaEditor ({
	className,
	onSave,
	resize,
	styles,
	value: initialValue,
	...rest
}: Props) {
	const { value, busy, error, onKeyDown, onChange, onBlur } = useEditor(
		initialValue?.toString() || "",
		onSave,
		{ ctrl: true },
	);

	return (
		<div
			className={cn(
				"relative flex items-center",
				resize ? "" : "grow",
				className,
			)}
		>
			<textarea
				className={cn(
					"textarea",
					resize ? "field-sizing-content" : "w-1/1",
					styles,
				)}
				value={value}
				disabled={busy}
				onBlur={onBlur}
				onChange={onChange}
				onKeyDown={onKeyDown}
				aria-invalid={!!error}
				{...rest}
			/>
			{error && (
				<span className="input__error">
					{error}
				</span>
			)}
		</div>
	);
}
