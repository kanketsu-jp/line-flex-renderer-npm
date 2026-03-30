import type React from "react";
import type { FlexSeparator } from "../types";

export function FlexSeparatorComponent({
	component,
}: {
	component: FlexSeparator;
}) {
	const style: React.CSSProperties = {
		border: "none",
		borderTop: `1px solid ${component.color ?? "#E5E5E5"}`,
		margin: 0,
		padding: 0,
		width: "100%",
	};
	return <hr style={style} />;
}
