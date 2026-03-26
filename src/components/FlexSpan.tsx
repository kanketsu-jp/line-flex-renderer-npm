import type React from "react";
import { TEXT_SIZE } from "../constants";
import type { FlexSpan } from "../types";
import { resolveSize } from "../utils";

export function FlexSpanComponent({ span }: { span: FlexSpan }) {
	const style: React.CSSProperties = {
		fontSize: resolveSize(span.size, TEXT_SIZE, "inherit"),
		color: span.color,
		fontWeight: span.weight === "bold" ? 700 : undefined,
		textDecoration: span.decoration !== "none" ? span.decoration : undefined,
		fontStyle: span.style,
	};
	return <span style={style}>{span.text}</span>;
}
