import { InputEditor, TextareaEditor } from "@components/controls";
import { useFieldValue, useRecipeDraft } from "@hooks/recipe-draft";
import type { DraftField } from "@lib/recipe-draft";
import { useState } from "react";

// Binds an input to one draft field. Keystrokes go straight to the draft; errors show on blur
// (or Enter) and clear as soon as the value is valid again, so typing never adds a new error.
function useDraftField(field: DraftField) {
	const { setField } = useRecipeDraft();
	const value = useFieldValue(field);
	const [error, setError] = useState("");

	function validate(v: string) {
		const result = field.schema.safeParse(v);
		setError(result.success ? "" : (result.error.issues[0]?.message ?? "Invalid value"));
	}

	return {
		value,
		error,
		onChange(v: string) {
			setField(field, v);
			if (error) validate(v);
		},
		onBlur() {
			validate(value);
		},
	};
}

type InputProps = { field: DraftField } & Omit<
	React.ComponentProps<typeof InputEditor>,
	"value" | "onChange" | "error"
>;

export function DraftInput({ field, ...rest }: InputProps) {
	const { value, error, onChange, onBlur } = useDraftField(field);
	return (
		<InputEditor
			{...rest}
			value={value}
			error={error}
			onChange={onChange}
			onBlur={onBlur}
			onKeyDown={(e) => {
				if (e.key === "Enter") onBlur();
			}}
		/>
	);
}

type TextareaProps = { field: DraftField } & Omit<
	React.ComponentProps<typeof TextareaEditor>,
	"value" | "onChange" | "error"
>;

export function DraftTextarea({ field, ...rest }: TextareaProps) {
	const { value, error, onChange, onBlur } = useDraftField(field);
	return <TextareaEditor {...rest} value={value} error={error} onChange={onChange} onBlur={onBlur} />;
}
