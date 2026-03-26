import type React from "react";
import { SPACING, TEXT_SIZE } from "../constants";
import type { FlexText } from "../types";
import { resolveSize } from "../utils";
import { FlexSpanComponent } from "./FlexSpan";

const alignMap: Record<string, string> = {
	start: "left",
	center: "center",
	end: "right",
};

const gravityMap: Record<string, string> = {
	top: "flex-start",
	center: "center",
	bottom: "flex-end",
};

export function FlexTextComponent({ component }: { component: FlexText }) {
	const hasSpans = component.contents && component.contents.length > 0;
	const fontSize = resolveSize(component.size, TEXT_SIZE, TEXT_SIZE.md);

	const style: React.CSSProperties = {
		fontSize,
		color: component.color,
		fontWeight: component.weight === "bold" ? 700 : 400,
		textAlign: (alignMap[component.align ?? "start"] ??
			"left") as React.CSSProperties["textAlign"],
		marginTop: resolveSize(component.margin, SPACING, undefined),
		flex: component.flex !== undefined ? `${component.flex} 0 0%` : undefined,
		alignSelf: component.gravity ? gravityMap[component.gravity] : undefined,
		textDecoration:
			component.decoration !== "none" ? component.decoration : undefined,
		fontStyle: component.style,
		lineHeight: component.lineSpacing ?? 1.4,
		...(!component.wrap
			? {
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}
			: {
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
				}),
		...(component.maxLines && component.wrap
			? {
					display: "-webkit-box",
					WebkitLineClamp: component.maxLines,
					WebkitBoxOrient: "vertical" as const,
					overflow: "hidden",
				}
			: {}),
	};

	if (hasSpans) {
		return (
			<p style={style}>
				{component.contents?.map((span, i) => (
					<FlexSpanComponent key={i} span={span} />
				))}
			</p>
		);
	}

	return <p style={style}>{component.text}</p>;
}
