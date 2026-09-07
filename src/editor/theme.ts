import type React from "react";

export const editorColors: {
	bg: string;
	panelBg: string;
	border: string;
	text: string;
	subText: string;
	accent: string;
	accentText: string;
	danger: string;
	previewBg: string;
} = {
	bg: "#ffffff",
	panelBg: "#F7F8FA",
	border: "#E3E6EA",
	text: "#1F2328",
	subText: "#6B7280",
	accent: "#06C755",
	accentText: "#ffffff",
	danger: "#E5484D",
	previewBg: "#7B9EB0",
};

export const editorFont =
	'-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif';

export const panelStyle: React.CSSProperties = {
	backgroundColor: editorColors.panelBg,
	border: `1px solid ${editorColors.border}`,
	borderRadius: 10,
	padding: 12,
	marginBottom: 12,
};

export const sectionTitleStyle: React.CSSProperties = {
	fontSize: 13,
	fontWeight: 700,
	color: editorColors.text,
	margin: "0 0 8px",
};

export const fieldWrapStyle: React.CSSProperties = {
	marginBottom: 12,
};

export const labelStyle: React.CSSProperties = {
	display: "block",
	fontSize: 12,
	fontWeight: 600,
	color: editorColors.text,
	marginBottom: 4,
};

export const hintStyle: React.CSSProperties = {
	fontSize: 11,
	color: editorColors.subText,
	marginTop: 4,
};

export const inputStyle: React.CSSProperties = {
	width: "100%",
	boxSizing: "border-box",
	padding: 8,
	border: `1px solid ${editorColors.border}`,
	borderRadius: 6,
	fontSize: 14,
	fontFamily: editorFont,
	backgroundColor: editorColors.bg,
	color: editorColors.text,
};

export const buttonStyle: React.CSSProperties = {
	backgroundColor: editorColors.accent,
	color: editorColors.accentText,
	border: "none",
	borderRadius: 6,
	padding: "8px 14px",
	fontSize: 13,
	fontWeight: 600,
	cursor: "pointer",
	fontFamily: editorFont,
};

export const ghostButtonStyle: React.CSSProperties = {
	backgroundColor: editorColors.bg,
	color: editorColors.text,
	border: `1px solid ${editorColors.border}`,
	borderRadius: 6,
	padding: "6px 10px",
	fontSize: 12,
	cursor: "pointer",
	fontFamily: editorFont,
};

export const iconButtonStyle: React.CSSProperties = {
	backgroundColor: "transparent",
	border: `1px solid ${editorColors.border}`,
	borderRadius: 4,
	width: 26,
	height: 26,
	lineHeight: "1",
	fontSize: 12,
	cursor: "pointer",
	padding: 0,
	color: editorColors.subText,
};

/**
 * アコーディオンの見出し。
 * 🚨 `<summary>` は既定で marker（▶）が付く。文字の位置がずれないよう
 *    list-style は残し、押せることが分かるように cursor だけ変える。
 */
export const summaryStyle: React.CSSProperties = {
	...sectionTitleStyle,
	cursor: "pointer",
	userSelect: "none",
	marginBottom: 0,
};
