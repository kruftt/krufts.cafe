import { cn } from "@lib/utils";

interface Props extends Omit<React.ComponentProps<"textarea">, "value" | "onChange"> {
	value: string;
	onChange: (value: string) => void;
	error?: string;
	resize?: boolean;
	styles?: string;
}

export function TextareaEditor({ className, value, onChange, error, resize, styles, ...rest }: Props) {
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
				onChange={(e) => onChange(e.currentTarget.value)}
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
