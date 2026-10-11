import { useState } from "react";

export interface ProcedureOptions {
	onError: (error: { message: string }) => void;
	onSuccess: () => void;
}

export interface EditorOptions {
	clear?: boolean;
	ctrl?: boolean;
	reset?: boolean;
	type?: string;
}

export function useEditor (
		initialValue: string,
		onSave: ((v: string, options: ProcedureOptions) => void),
		options: EditorOptions = {},
	) {
		const [value, setValue] = useState(initialValue);
		const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
		const [dirty, setDirty] = useState(false);
		const [busy, setBusy] = useState(false);
		const [error, setError] = useState("");

		if (prevInitialValue !== initialValue && !dirty && !busy) {
			setPrevInitialValue(initialValue);
			setValue(initialValue);
		}
		const { clear, ctrl, reset, type } = options;

		function submit() {
			if (!dirty) return;
			setDirty(false);

			if (type === "number") {
				const v = parseFloat(value);
				if (Number.isNaN(v)) {
					setValue(initialValue);
				} else {
					setValue(v.toString());
				}
			}

			setBusy(true);

			onSave(value, {
				onError(err) {
					setError(err.message);
					setBusy(false);
					if (reset) setValue(initialValue);
					if (clear) setValue("");
				},
				onSuccess() {
					setBusy(false);
					if (clear) setValue("");
				},
			});
		}

		function onChange(
			e:
				| React.ChangeEvent<HTMLTextAreaElement>
				| React.ChangeEvent<HTMLInputElement>,
		) {
			setValue(e.currentTarget.value);
			setDirty(true);
			if (error) setError("");
		}

		function onKeyDown(
			e:
				| React.KeyboardEvent<HTMLTextAreaElement>
				| React.KeyboardEvent<HTMLInputElement>,
		) {
			if (ctrl && !e.ctrlKey) return;
			if (e.key === "Enter") {
				submit();
			}
		}

		function onBlur() {
			if (dirty) submit();
			else setError("");
		}

		return { value, busy, error, onKeyDown, onChange, onBlur, submit };
	}
