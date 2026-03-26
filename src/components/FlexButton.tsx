import type React from "react";
import { SPACING, TEXT_SIZE } from "../constants";
import type { FlexButton } from "../types";
import { resolveSize } from "../utils";

export function FlexButtonComponent({ component }: { component: FlexButton }) {
	const isPrimary = component.style === "primary";
	const isLink = component.style === "link";
	const height = component.height === "sm" ? "40px" : "52px";

	const style: React.CSSProperties = {
		width: "100%",
		height,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		borderRadius:
			isPrimary || component.style === "secondary" ? "9999px" : undefined,
		backgroundColor: isPrimary
			? (component.color ?? "#17C950")
			: isLink
				? "transparent"
				: "#EFEFEF",
		color: isPrimary
			? "#ffffff"
			: isLink
				? (component.color ?? "#42659A")
				: "#111111",
		fontSize: TEXT_SIZE.sm,
		fontWeight: 600,
		border: "none",
		cursor: "pointer",
		marginTop: resolveSize(component.margin, SPACING, undefined),
		flex: component.flex !== undefined ? `${component.flex} 0 0%` : undefined,
	};

	return (
		<button type="button" style={style}>
			{component.action.label}
		</button>
	);
}
