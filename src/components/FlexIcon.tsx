import { ICON_SIZE } from "../constants";
import type { FlexIcon } from "../types";
import { resolveSize } from "../utils";

export function FlexIconComponent({ component }: { component: FlexIcon }) {
	const size = resolveSize(component.size, ICON_SIZE, ICON_SIZE.md);
	return (
		<img
			src={component.url}
			alt=""
			style={{ width: size, height: size, objectFit: "contain" }}
		/>
	);
}
