import type React from "react";
import { BUBBLE_WIDTH } from "../constants";
import type { FlexBox, FlexBubble, FlexContainer } from "../types";
import { FlexBoxComponent } from "./FlexBox";
import { FlexImageComponent } from "./FlexImage";

/**
 * FlexBox に padding 系プロパティが一切指定されていない場合のみ
 * デフォルト padding を適用する。指定があればそちらを優先。
 */
function applyDefaultPadding(box: FlexBox, fallback: string): FlexBox {
	const hasPadding =
		box.paddingAll !== undefined ||
		box.paddingTop !== undefined ||
		box.paddingBottom !== undefined ||
		box.paddingStart !== undefined ||
		box.paddingEnd !== undefined;
	if (hasPadding) return box;
	return { ...box, paddingAll: fallback };
}

export interface FlexMessagePreviewProps {
	/** Flex Message JSON（bubble or carousel） */
	json: FlexContainer;
	/** 追加 className */
	className?: string;
	/** 追加 inline style */
	style?: React.CSSProperties;
}

function BubbleRenderer({
	json,
	className,
	style: extraStyle,
}: {
	json: FlexBubble;
	className?: string;
	style?: React.CSSProperties;
}) {
	const width = BUBBLE_WIDTH[json.size ?? "mega"];
	const headerBg = json.styles?.header?.backgroundColor;
	const bodyBg = json.styles?.body?.backgroundColor;
	const footerBg = json.styles?.footer?.backgroundColor;
	const footerSep = json.styles?.footer?.separator;
	const bodySep = json.styles?.body?.separator;
	const heroSep = json.styles?.hero?.separator;

	return (
		<div
			className={className}
			style={{
				width,
				maxWidth: "100%",
				borderRadius: "16px",
				overflow: "hidden",
				backgroundColor: "#ffffff",
				boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif',
				...extraStyle,
			}}
		>
			{/* Header */}
			{json.header && (
				<div style={{ backgroundColor: headerBg }}>
					<FlexBoxComponent
						component={applyDefaultPadding(json.header, "16px 16px 0")}
					/>
				</div>
			)}

			{/* Hero separator */}
			{heroSep && <hr style={{ borderTop: "1px solid #E5E5E5", margin: 0 }} />}

			{/* Hero */}
			{json.hero && <FlexImageComponent component={json.hero} />}

			{/* Body separator */}
			{bodySep && <hr style={{ borderTop: "1px solid #E5E5E5", margin: 0 }} />}

			{/* Body */}
			{json.body && (
				<div style={{ backgroundColor: bodyBg }}>
					<FlexBoxComponent
						component={applyDefaultPadding(json.body, "16px")}
					/>
				</div>
			)}

			{/* Footer separator */}
			{footerSep && (
				<hr style={{ borderTop: "1px solid #E5E5E5", margin: 0 }} />
			)}

			{/* Footer */}
			{json.footer && (
				<div style={{ backgroundColor: footerBg }}>
					<FlexBoxComponent
						component={applyDefaultPadding(json.footer, "8px 16px 16px")}
					/>
				</div>
			)}
		</div>
	);
}

export function FlexMessagePreview({
	json,
	className,
	style,
}: FlexMessagePreviewProps) {
	if (json.type === "carousel") {
		return (
			<div
				className={className}
				style={{
					display: "flex",
					gap: 8,
					overflowX: "auto",
					scrollSnapType: "x mandatory",
					...style,
				}}
			>
				{json.contents.map((bubble, i) => (
					<div key={i} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
						<BubbleRenderer json={bubble} />
					</div>
				))}
			</div>
		);
	}
	return <BubbleRenderer json={json} className={className} style={style} />;
}
