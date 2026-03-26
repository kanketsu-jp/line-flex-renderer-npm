import type React from "react";
import { SPACING } from "../constants";
import type { FlexBox } from "../types";
import { resolveSize } from "../utils";
import { FlexComponentRenderer } from "./FlexComponentRenderer";

export function FlexBoxComponent({ component }: { component: FlexBox }) {
	const isVertical = component.layout === "vertical";
	const isBaseline = component.layout === "baseline";

	const style: React.CSSProperties = {
		display: "flex",
		flexDirection: isVertical ? "column" : "row",
		alignItems: isBaseline
			? "baseline"
			: (component.alignItems ?? (isVertical ? "stretch" : "center")),
		justifyContent: component.justifyContent,
		gap: resolveSize(component.spacing, SPACING, undefined),
		marginTop: resolveSize(component.margin, SPACING, undefined),
		padding: resolveSize(component.paddingAll, SPACING, undefined),
		paddingTop: resolveSize(component.paddingTop, SPACING, undefined),
		paddingBottom: resolveSize(component.paddingBottom, SPACING, undefined),
		paddingLeft: resolveSize(component.paddingStart, SPACING, undefined),
		paddingRight: resolveSize(component.paddingEnd, SPACING, undefined),
		backgroundColor: component.backgroundColor,
		borderRadius: component.cornerRadius,
		borderColor: component.borderColor,
		borderWidth: component.borderWidth,
		borderStyle: component.borderWidth ? "solid" : undefined,
		flex: component.flex !== undefined ? `${component.flex} 0 0%` : undefined,
	};

	return (
		<div style={style}>
			{component.contents.map((child, i) => (
				<FlexComponentRenderer key={i} component={child} />
			))}
		</div>
	);
}
