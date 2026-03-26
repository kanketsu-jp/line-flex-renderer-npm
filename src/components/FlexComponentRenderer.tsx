import { SPACING } from "../constants";
import type { FlexComponentType, FlexFiller, FlexSpacer } from "../types";
import { resolveSize } from "../utils";
import { FlexBoxComponent } from "./FlexBox";
import { FlexButtonComponent } from "./FlexButton";
import { FlexIconComponent } from "./FlexIcon";
import { FlexImageComponent } from "./FlexImage";
import { FlexSeparatorComponent } from "./FlexSeparator";
import { FlexTextComponent } from "./FlexText";

export function FlexComponentRenderer({
	component,
}: {
	component: FlexComponentType;
}) {
	switch (component.type) {
		case "box":
			return <FlexBoxComponent component={component} />;
		case "text":
			return <FlexTextComponent component={component} />;
		case "image":
			return <FlexImageComponent component={component} />;
		case "button":
			return <FlexButtonComponent component={component} />;
		case "separator":
			return <FlexSeparatorComponent component={component} />;
		case "spacer":
			return (
				<div
					style={{
						flexGrow: 1,
						height: resolveSize((component as FlexSpacer).size, SPACING, "0px"),
					}}
				/>
			);
		case "filler":
			return <div style={{ flexGrow: (component as FlexFiller).flex ?? 1 }} />;
		case "icon":
			return <FlexIconComponent component={component} />;
		default:
			return null;
	}
}
