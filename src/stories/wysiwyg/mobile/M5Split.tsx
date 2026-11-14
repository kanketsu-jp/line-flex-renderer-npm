import { useState } from "react";
import { getNode, nodeLabel } from "../../../editor/path";
import type { InsertableKind } from "../../../editor/types";
import type { FlexBubble } from "../../../types";
import { font, kindIcon, kindLabel, w } from "../core/theme";
import { useFlexDoc } from "../core/useFlexDoc";
import { WysiwygInspector } from "../core/WysiwygInspector";
import {
	MobilePreview,
	MobileShell,
	TapToPlaceLayer,
	useContainerLayout,
} from "./MobileShared";

/**
 * 案 M5: 分割ライブプレビュー型
 *
 * - 画面上半分: 実機プレビュー（固定・常時見える）
 * - 下半分: 編集パレット＋選択中部品のプロパティ
 * - プレビューの部品をタップ → 下のパレットが「その部品の設定」に切替
 *   （見た目と操作対象が常に一致 = 認知負荷最小）
 * - パレットの「追加」→ 追加先をプレビューでタップ（他案と同じ配置フロー）
 * - 縦分割は 45% / 55%。シートは使わない（分割がシートの役割を兼ねる）
 */

export function MobileSplit({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const { compact } = useContainerLayout(); // コンテナ幅で分割比を可変（vw 不使用）
	const [insertKind, setInsertKind] = useState<InsertableKind | null>(null);
	const selectedNode = doc.selected
		? getNode(doc.bubble, doc.selected)
		: undefined;

	return (
		<MobileShell title="プレビューで編集" doc={doc}>
			{/* 上: プレビュー（固定） */}
			<div
				style={{
					height: compact ? "38%" : "45%",
					flexShrink: 0,
					overflowY: "auto",
					backgroundColor: w.canvasBg,
					padding: "8px 8px 12px",
					display: "flex",
					justifyContent: "center",
					borderBottom: `1px solid ${w.border}`,
				}}
			>
				<MobilePreview doc={doc} width="100%" />
			</div>

			{/* 下: 編集（パレット or 選択部品の設定） */}
			<div
				style={{
					flex: 1,
					minHeight: 0,
					display: "flex",
					flexDirection: "column",
					backgroundColor: w.white,
				}}
			>
				{/* モードバー */}
				<div
					style={{
						flexShrink: 0,
						display: "flex",
						alignItems: "center",
						gap: 6,
						padding: "8px 12px",
						borderBottom: `1px solid ${w.border}`,
					}}
				>
					{insertKind ? (
						<>
							<span
								style={{
									fontSize: 12,
									fontWeight: 700,
									color: w.green,
									flex: 1,
								}}
							>
								{kindIcon[insertKind]} {kindLabel[insertKind]}
								を置く場所を上でタップ
							</span>
							<button
								type="button"
								aria-label="追加をやめる"
								onClick={() => setInsertKind(null)}
								style={{
									border: "none",
									background: "transparent",
									fontSize: 13,
									color: w.subText,
									padding: 6,
									fontFamily: font,
								}}
							>
								やめる
							</button>
						</>
					) : selectedNode && doc.selected ? (
						<>
							<span
								style={{
									fontSize: 12,
									fontWeight: 700,
									flex: 1,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{nodeLabel(selectedNode)}
							</span>
							<MiniBtn
								label="上へ"
								onClick={() => doc.selected && doc.move(doc.selected, -1)}
							>
								↑
							</MiniBtn>
							<MiniBtn
								label="下へ"
								onClick={() => doc.selected && doc.move(doc.selected, 1)}
							>
								↓
							</MiniBtn>
							<MiniBtn
								label="複製"
								onClick={() => doc.selected && doc.duplicate(doc.selected)}
							>
								⧉
							</MiniBtn>
							<MiniBtn
								label="削除"
								danger
								onClick={() => doc.selected && doc.remove(doc.selected)}
							>
								🗑
							</MiniBtn>
						</>
					) : (
						<span style={{ fontSize: 12, color: w.subText, flex: 1 }}>
							下から部品を追加、または上のプレビューの部品をタップ
						</span>
					)}
				</div>

				{/* 内容 */}
				<div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
					{!insertKind && selectedNode && doc.selected ? (
						<div style={{ padding: 12 }}>
							<WysiwygInspector
								node={selectedNode}
								onPatch={(p) => doc.selected && doc.patch(doc.selected, p)}
							/>
						</div>
					) : (
						<div style={{ padding: "10px 12px 24px" }}>
							{insertKind && (
								<div
									role="status"
									style={{
										backgroundColor: w.greenSoft,
										border: `1px solid ${w.green}`,
										color: w.green,
										borderRadius: 8,
										padding: "8px 10px",
										fontSize: 12,
										fontWeight: 700,
										marginBottom: 10,
									}}
								>
									追加先（本文やボックス）を上のプレビューでタップしてください
								</div>
							)}
							<div
								style={{
									fontSize: 12,
									fontWeight: 700,
									color: w.subText,
									marginBottom: 8,
								}}
							>
								部品を追加
							</div>
							{(
								[
									"text",
									"image",
									"button",
									"box",
									"separator",
								] as InsertableKind[]
							).map((k) => (
								<button
									key={k}
									type="button"
									aria-pressed={insertKind === k}
									onClick={() => setInsertKind(insertKind === k ? null : k)}
									style={{
										width: "100%",
										display: "flex",
										alignItems: "center",
										gap: 10,
										minHeight: 52,
										border: `1px solid ${insertKind === k ? w.green : w.border}`,
										borderRadius: 10,
										backgroundColor: insertKind === k ? w.greenSoft : w.white,
										padding: "8px 12px",
										marginBottom: 6,
										cursor: "pointer",
										fontFamily: font,
										textAlign: "left",
									}}
								>
									<span
										style={{
											width: 32,
											height: 32,
											borderRadius: 8,
											backgroundColor: w.greenSoft,
											color: w.green,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: 15,
										}}
									>
										{kindIcon[k]}
									</span>
									<span style={{ fontSize: 13, fontWeight: 600 }}>
										{kindLabel[k]}
									</span>
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{/* 挿入モード: 上のプレビューにガイド */}
			{insertKind && (
				<TapToPlaceLayer
					doc={doc}
					kind={insertKind}
					onDone={() => setInsertKind(null)}
					label="上のプレビューで置く場所をタップ"
				/>
			)}
		</MobileShell>
	);
}

function MiniBtn({
	children,
	label,
	danger,
	onClick,
}: {
	children: React.ReactNode;
	label: string;
	danger?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={onClick}
			style={{
				width: 40,
				height: 40,
				borderRadius: 8,
				border: `1px solid ${w.border}`,
				backgroundColor: w.white,
				fontSize: 14,
				cursor: "pointer",
				color: danger ? w.danger : w.text,
				flexShrink: 0,
				fontFamily: font,
			}}
		>
			{children}
		</button>
	);
}
