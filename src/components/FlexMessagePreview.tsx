import type React from "react";
import { BUBBLE_WIDTH } from "../constants";
import type { FlexBubble, FlexContainer } from "../types";
import { FlexBoxComponent } from "./FlexBox";
import { FlexImageComponent } from "./FlexImage";

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
				<div style={{ padding: "16px 16px 0", backgroundColor: headerBg }}>
					<FlexBoxComponent component={json.header} />
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
				<div style={{ padding: "16px", backgroundColor: bodyBg }}>
					<FlexBoxComponent component={json.body} />
				</div>
			)}

			{/* Footer separator */}
			{footerSep && (
				<hr style={{ borderTop: "1px solid #E5E5E5", margin: 0 }} />
			)}

			{/* Footer */}
			{json.footer && (
				<div style={{ padding: "8px 16px 16px", backgroundColor: footerBg }}>
					<FlexBoxComponent component={json.footer} />
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
