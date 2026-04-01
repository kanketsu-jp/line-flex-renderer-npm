import type React from "react";
import { SPACING } from "../constants";
import type { FlexBox } from "../types";
import { resolveSize } from "../utils";
import { FlexComponentRenderer } from "./FlexComponentRenderer";

/**
 * LINE Flex Message Box renderer.
 *
 * Spacing/margin behaviour mirrors the LINE spec:
 *  - Parent `spacing` sets the default gap between children.
 *  - A child's own `margin` overrides `spacing` for that child.
 *  - First child never receives a leading gap.
 *  - In horizontal/baseline layout, children without explicit `flex`
 *    default to `flex: 1` (equal distribution) — matching LINE behaviour.
 */
export function FlexBoxComponent({ component }: { component: FlexBox }) {
	const isVertical = component.layout === "vertical";
	const isBaseline = component.layout === "baseline";
	const resolvedSpacing = resolveSize(component.spacing, SPACING, undefined);

	const style: React.CSSProperties = {
		display: "flex",
		flexDirection: isVertical ? "column" : "row",
		alignItems: isBaseline
			? "baseline"
			: (component.alignItems ?? (isVertical ? "stretch" : "center")),
		justifyContent: component.justifyContent,
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
	};

	return (
		<div style={style}>
			{component.contents.map((child, i) => {
				// Filler — just a flex‑grow div
				if (child.type === "filler") {
					const fillerFlex =
						"flex" in child && child.flex != null ? child.flex : 1;
					return <div key={i} style={{ flex: `${fillerFlex} 0 0%` }} />;
				}

				// Spacer — fixed‑size gap (deprecated in LINE, but still supported)
				if (child.type === "spacer") {
					const spacerSize =
						"size" in child
							? resolveSize(child.size as string, SPACING, "0px")
							: "0px";
					return (
						<div
							key={i}
							style={{
								flexGrow: 1,
								[isVertical ? "height" : "width"]: spacerSize,
							}}
						/>
					);
				}

				// ---- Margin: child's own margin overrides parent spacing ----
				const childMargin =
					"margin" in child && child.margin
						? resolveSize(child.margin as string, SPACING, undefined)
						: undefined;
				const gapValue = i > 0 ? (childMargin ?? resolvedSpacing) : undefined;
				const marginProp = isVertical ? "marginTop" : "marginLeft";

				// ---- Flex: LINE horizontal default is 1 ----
				const childFlex =
					"flex" in child && child.flex !== undefined
						? (child.flex as number)
						: undefined;

				let flexValue: string | undefined;
				if (childFlex !== undefined) {
					flexValue = `${childFlex} 0 ${childFlex === 0 ? "auto" : "0%"}`;
				} else if (!isVertical) {
					flexValue = "1 0 0%";
				}

				const wrapperStyle: React.CSSProperties = {
					...(gapValue ? { [marginProp]: gapValue } : {}),
					...(flexValue ? { flex: flexValue } : {}),
					...(!isVertical ? { minWidth: 0 } : {}),
				};

				return (
					<div key={i} style={wrapperStyle}>
						<FlexComponentRenderer component={child} />
					</div>
				);
			})}
		</div>
	);
}
