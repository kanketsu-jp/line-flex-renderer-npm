import type React from "react";
import type { FlexBubble, FlexComponentType, FlexContainer } from "../types";

/** bubble のブロック */
export type FlexSection = "header" | "hero" | "body" | "footer";

/** 編集対象ノードの位置。
 *  indices が空配列 = そのセクション自身（header/body/footer なら FlexBox、hero なら FlexImage）
 *  indices=[1,2] = section.contents[1].contents[2] */
export interface FlexNodePath {
	section: FlexSection;
	indices: number[];
}

/** 非技術者に見せる「追加できる部品」 */
export type InsertableKind = "text" | "image" | "button" | "separator" | "box";

/** 一覧表示用のエントリ */
export interface FlexNodeEntry {
	path: FlexNodePath;
	/** そのパスのノード。indices が空で hero のときは FlexImage、それ以外のセクション自身は FlexBox */
	node: FlexComponentType;
	/** 0 = セクション自身 */
	depth: number;
	/** 画面に出す日本語ラベル */
	label: string;
}

/** テンプレート */
export interface EditorTemplate {
	id: string;
	/** 日本語の名前（例: "お知らせ"） */
	name: string;
	/** 1 行の説明 */
	description: string;
	bubble: FlexBubble;
}

export interface FlexEditorProps {
	/** 初期の Flex JSON。未指定なら templates[0].bubble */
	value?: FlexContainer;
	/** 編集のたびに呼ばれる。LINE Messaging API の flex.contents にそのまま渡せる */
	onChange?: (json: FlexContainer) => void;
	/** テンプレ差し替え。未指定なら組み込みテンプレ */
	templates?: EditorTemplate[];
	/** 縦積み（モバイル）に切り替える幅 px。既定 768 */
	mobileBreakpoint?: number;
	/** レイアウトを強制する（テスト / Storybook 用）。未指定なら自動判定 */
	forceLayout?: "desktop" | "mobile";
	/** プレビューを LineChatFrame で包むか。既定 true */
	showChatFrame?: boolean;
	/** チャットフレームのアカウント名。既定 "トーク" */
	accountName?: string;
	className?: string;
	style?: React.CSSProperties;
}

/** バリデーション結果 */
export interface FlexValidationIssue {
	/** 問題のあるノード。全体に対する指摘なら null */
	path: FlexNodePath | null;
	/** 非技術者向けの日本語メッセージ */
	message: string;
	severity: "error" | "warning";
}

/** セクションの日本語名 */
export const SECTION_LABELS: Record<FlexSection, string> = {
	header: "ヘッダー",
	hero: "メイン画像",
	body: "本文",
	footer: "フッター",
};
