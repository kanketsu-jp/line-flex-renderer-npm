export interface FlexAction {
	type: "uri" | "message" | "postback";
	label: string;
	uri?: string;
	text?: string;
	data?: string;
}

export interface FlexSpan {
	type: "span";
	text?: string;
	size?: string;
	color?: string;
	weight?: "bold" | "regular";
	decoration?: "underline" | "line-through" | "none";
	style?: "normal" | "italic";
}

export interface FlexText {
	type: "text";
	text?: string;
	size?: string;
	color?: string;
	weight?: "bold" | "regular";
	align?: "start" | "center" | "end";
	gravity?: "top" | "center" | "bottom";
	wrap?: boolean;
	maxLines?: number;
	margin?: string;
	flex?: number;
	decoration?: "underline" | "line-through" | "none";
	style?: "normal" | "italic";
	lineSpacing?: string;
	contents?: FlexSpan[];
}

export interface FlexImage {
	type: "image";
	url: string;
	size?: string;
	aspectRatio?: string;
	aspectMode?: "cover" | "fit";
	margin?: string;
	flex?: number;
	align?: "start" | "center" | "end";
	gravity?: "top" | "center" | "bottom";
	backgroundColor?: string;
}

export interface FlexButton {
	type: "button";
	action: FlexAction;
	style?: "primary" | "secondary" | "link";
	color?: string;
	height?: "sm" | "md";
	margin?: string;
	flex?: number;
}

export interface FlexSeparator {
	type: "separator";
	margin?: string;
	color?: string;
}

export interface FlexSpacer {
	type: "spacer";
	size?: string;
}

export interface FlexFiller {
	type: "filler";
	flex?: number;
}

export interface FlexIcon {
	type: "icon";
	url: string;
	size?: string;
}

export interface FlexBox {
	type: "box";
	layout: "vertical" | "horizontal" | "baseline";
	contents: FlexComponentType[];
	spacing?: string;
	margin?: string;
	paddingAll?: string;
	paddingTop?: string;
	paddingBottom?: string;
	paddingStart?: string;
	paddingEnd?: string;
	backgroundColor?: string;
	cornerRadius?: string;
	borderColor?: string;
	borderWidth?: string;
	flex?: number;
	justifyContent?:
		| "flex-start"
		| "center"
		| "flex-end"
		| "space-between"
		| "space-around"
		| "space-evenly";
	alignItems?: "flex-start" | "center" | "flex-end";
}

export type FlexComponentType =
	| FlexBox
	| FlexText
	| FlexImage
	| FlexButton
	| FlexSeparator
	| FlexSpacer
	| FlexFiller
	| FlexIcon;

export interface FlexBlockStyle {
	backgroundColor?: string;
	separator?: boolean;
}

export interface FlexBubble {
	type: "bubble";
	size?: "nano" | "micro" | "kilo" | "mega" | "giga";
	header?: FlexBox;
	hero?: FlexImage;
	body?: FlexBox;
	footer?: FlexBox;
	styles?: {
		header?: FlexBlockStyle;
		hero?: FlexBlockStyle;
		body?: FlexBlockStyle;
		footer?: FlexBlockStyle;
	};
}

/** Carousel: 複数 bubble を横スクロール */
export interface FlexCarousel {
	type: "carousel";
	contents: FlexBubble[];
}

/** Flex Message の最上位型（bubble または carousel） */
export type FlexContainer = FlexBubble | FlexCarousel;

/** LINE Messaging API の flexMessage 型 */
export interface FlexMessage {
	type: "flex";
	altText: string;
	contents: FlexContainer;
}
