import type React from "react";
import { editorColors } from "../editor/theme";
import type { FlexContainer } from "../types";
import { FlexMessagePreview } from "./FlexMessagePreview";
import { LineChatFrame } from "./LineChatFrame";

export interface FlexPreviewProps {
	/** 描く Flex の contents（bubble / carousel） */
	json: FlexContainer;
	/** LINE のトーク画面の枠で包むか。既定 true */
	showChatFrame?: boolean;
	/** トーク画面の枠に出すアカウント名 */
	accountName?: string;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * Flex のプレビュー 1 枚。
 *
 * 🚨 エディタの左に出るものと**同じ部品**。エディタ以外の画面
 *    （例: アンケートの詳細ページ）も、写しを作らずにこれを使う。
 *    見え方を直すときは、ここ 1 か所を直せば両方に効く。
 */
export function FlexPreview({
	json,
	showChatFrame = true,
	accountName,
	className,
	style,
}: FlexPreviewProps): React.ReactElement {
	return (
		<div
			className={className}
			style={{
				backgroundColor: editorColors.previewBg,
				padding: 16,
				borderRadius: 12,
				display: "flex",
				justifyContent: "center",
				...style,
			}}
		>
			{showChatFrame === false ? (
				<FlexMessagePreview json={json} />
			) : (
				<LineChatFrame accountName={accountName}>
					<FlexMessagePreview json={json} />
				</LineChatFrame>
			)}
		</div>
	);
}
