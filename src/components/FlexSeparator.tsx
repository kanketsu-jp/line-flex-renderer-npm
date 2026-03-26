import type React from "react";
import { SPACING } from "../constants";
import type { FlexSeparator } from "../types";
import { resolveSize } from "../utils";

export function FlexSeparatorComponent({
	component,
}: {
	component: FlexSeparator;
}) {
	const style: React.CSSProperties = {
		borderTop: `1px solid ${component.color ?? "#E5E5E5"}`,
		marginTop: resolveSize(component.margin, SPACING, undefined),
		width: "100%",
	};
	return <hr style={style} />;
}
