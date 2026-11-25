import type React from "react";

/** WYSIWYG プロトタイプ共通のデザイントークン（LINE Green 基調） */
export const w = {
	green: "#06C755",
	greenDark: "#05A848",
	greenSoft: "rgba(6, 199, 85, 0.08)",
	text: "#1F2328",
	subText: "#6B7280",
	border: "#E3E6EA",
	panelBg: "#F7F8FA",
	canvasBg: "#EEF1F4",
	white: "#FFFFFF",
	danger: "#E5484D",
	dangerSoft: "rgba(229, 72, 77, 0.08)",
};

export const font =
	'-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif';

export const cardStyle: React.CSSProperties = {
	backgroundColor: w.white,
	border: `1px solid ${w.border}`,
	borderRadius: 12,
};

export const chipStyle: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	gap: 4,
	padding: "3px 8px",
	borderRadius: 999,
	fontSize: 11,
	fontWeight: 600,
	backgroundColor: w.panelBg,
	border: `1px solid ${w.border}`,
	color: w.subText,
	whiteSpace: "nowrap",
};

export const iconBtn: React.CSSProperties = {
	width: 28,
	height: 28,
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	borderRadius: 6,
	border: `1px solid ${w.border}`,
	backgroundColor: w.white,
	cursor: "pointer",
	fontSize: 13,
	color: w.text,
	lineHeight: 1,
};

export const primaryBtn: React.CSSProperties = {
	...iconBtn,
	backgroundColor: w.green,
	borderColor: w.green,
	color: w.white,
	fontWeight: 700,
};

/** 部品アイコン（絵文字ではなく SVG 風のテキストシンボルで統一感を出す） */
export const kindIcon: Record<string, string> = {
	text: "𝐓",
	image: "🖼",
	button: "▭",
	separator: "―",
	box: "▤",
	icon: "✦",
	spacer: "␣",
	filler: "·",
};

export const kindLabel: Record<string, string> = {
	text: "テキスト",
	image: "画像",
	button: "ボタン",
	separator: "区切り線",
	box: "ボックス",
	icon: "アイコン",
	spacer: "余白",
	filler: "すき間",
};
