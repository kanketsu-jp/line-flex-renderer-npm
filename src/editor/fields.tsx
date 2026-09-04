import type React from "react";
import { useId } from "react";
import {
	editorColors,
	fieldWrapStyle,
	ghostButtonStyle,
	hintStyle,
	inputStyle,
	labelStyle,
} from "./theme";

export interface FieldProps {
	label: string;
	hint?: string;
}

export function TextField(
	props: FieldProps & {
		value: string;
		onChange: (v: string) => void;
		placeholder?: string;
		multiline?: boolean;
		maxLength?: number;
	},
): React.ReactElement {
	const { label, hint, value, onChange, placeholder, multiline, maxLength } =
		props;
	const id = useId();

	return (
		<div style={fieldWrapStyle}>
			<label htmlFor={id} style={labelStyle}>
				{label}
			</label>
			{multiline ? (
				<textarea
					id={id}
					rows={3}
					style={inputStyle}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					maxLength={maxLength}
				/>
			) : (
				<input
					type="text"
					id={id}
					style={inputStyle}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					maxLength={maxLength}
				/>
			)}
			{hint ? <p style={hintStyle}>{hint}</p> : null}
		</div>
	);
}

export function ColorField(
	props: FieldProps & {
		value?: string;
		onChange: (v: string | undefined) => void;
	},
): React.ReactElement {
	const { label, hint, value, onChange } = props;
	const id = useId();

	return (
		<div style={fieldWrapStyle}>
			<label htmlFor={id} style={labelStyle}>
				{label}
			</label>
			<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
				<input
					type="color"
					id={id}
					value={value ?? "#000000"}
					onChange={(e) => onChange(e.target.value)}
					style={{
						width: 40,
						height: 32,
						padding: 0,
						border: `1px solid ${editorColors.border}`,
						borderRadius: 4,
						cursor: "pointer",
						flexShrink: 0,
					}}
				/>
				<input
					type="text"
					value={value ?? ""}
					placeholder="#RRGGBB"
					onChange={(e) =>
						onChange(e.target.value === "" ? undefined : e.target.value)
					}
					aria-label={`${label}（カラーコード）`}
					style={inputStyle}
				/>
				<button
					type="button"
					style={{ ...ghostButtonStyle, flexShrink: 0 }}
					onClick={() => onChange(undefined)}
				>
					なし
				</button>
			</div>
			{hint ? <p style={hintStyle}>{hint}</p> : null}
		</div>
	);
}

export function SelectField(
	props: FieldProps & {
		value?: string;
		onChange: (v: string | undefined) => void;
		options: ReadonlyArray<{ value: string; label: string }>;
		emptyLabel?: string;
	},
): React.ReactElement {
	const { label, hint, value, onChange, options, emptyLabel } = props;
	const id = useId();

	return (
		<div style={fieldWrapStyle}>
			<label htmlFor={id} style={labelStyle}>
				{label}
			</label>
			<select
				id={id}
				style={inputStyle}
				value={value ?? ""}
				onChange={(e) =>
					onChange(e.target.value === "" ? undefined : e.target.value)
				}
			>
				{emptyLabel !== undefined ? (
					<option value="">{emptyLabel}</option>
				) : null}
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
			{hint ? <p style={hintStyle}>{hint}</p> : null}
		</div>
	);
}

export function ToggleField(
	props: FieldProps & {
		value: boolean;
		onChange: (v: boolean) => void;
	},
): React.ReactElement {
	const { label, hint, value, onChange } = props;
	const id = useId();

	return (
		<div style={fieldWrapStyle}>
			<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
				<input
					type="checkbox"
					id={id}
					checked={value}
					onChange={(e) => onChange(e.target.checked)}
					style={{ cursor: "pointer" }}
				/>
				<label
					htmlFor={id}
					style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}
				>
					{label}
				</label>
			</div>
			{hint ? <p style={hintStyle}>{hint}</p> : null}
		</div>
	);
}

export function NumberField(
	props: FieldProps & {
		value?: number;
		onChange: (v: number | undefined) => void;
		min?: number;
		max?: number;
	},
): React.ReactElement {
	const { label, hint, value, onChange, min, max } = props;
	const id = useId();

	return (
		<div style={fieldWrapStyle}>
			<label htmlFor={id} style={labelStyle}>
				{label}
			</label>
			<input
				type="number"
				id={id}
				style={inputStyle}
				value={value ?? ""}
				min={min}
				max={max}
				onChange={(e) =>
					onChange(e.target.value === "" ? undefined : Number(e.target.value))
				}
			/>
			{hint ? <p style={hintStyle}>{hint}</p> : null}
		</div>
	);
}
