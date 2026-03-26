import type React from "react";
import { IMAGE_SIZE, SPACING } from "../constants";
import type { FlexImage } from "../types";
import { resolveSize } from "../utils";

export function FlexImageComponent({ component }: { component: FlexImage }) {
	const [w, h] = (component.aspectRatio ?? "1:1").split(":").map(Number);

	const style: React.CSSProperties = {
		width:
			component.size === "full"
				? "100%"
				: resolveSize(component.size, IMAGE_SIZE, IMAGE_SIZE.md),
		marginTop: resolveSize(component.margin, SPACING, undefined),
		flex: component.flex !== undefined ? `${component.flex} 0 0%` : undefined,
		backgroundColor: component.backgroundColor,
	};

	const innerStyle: React.CSSProperties = {
		width: "100%",
		paddingTop: `${(h / w) * 100}%`,
		position: "relative",
		overflow: "hidden",
	};

	const imgStyle: React.CSSProperties = {
		position: "absolute",
		top: 0,
		left: 0,
		width: "100%",
		height: "100%",
		objectFit: component.aspectMode === "fit" ? "contain" : "cover",
	};

	return (
		<div style={style}>
			<div style={innerStyle}>
				<img src={component.url} alt="" style={imgStyle} />
			</div>
		</div>
	);
}
