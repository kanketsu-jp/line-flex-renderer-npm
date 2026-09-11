import { DEFAULT_TEXT_COLOR } from "../constants";

export function LineTextBubble({ text }: { text: string }) {
	return (
		<div
			style={{
				backgroundColor: "#ffffff",
				borderRadius: "16px 16px 16px 4px",
				padding: "10px 14px",
				fontSize: 14,
				lineHeight: 1.5,
				color: DEFAULT_TEXT_COLOR,
				whiteSpace: "pre-wrap",
				wordBreak: "break-word",
				maxWidth: 260,
				boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif',
			}}
		>
			{text}
		</div>
	);
}
