import { cn } from "@lib/utils";

interface Props extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
	value: string;
	onChange: (value: string) => void;
	error?: string;
	resize?: boolean;
	inputStyle?: string;
}

export function InputEditor({ className, value, onChange, error, inputStyle, resize, ...rest }: Props) {
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
				onChange={(e) => onChange(e.currentTarget.value)}
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
