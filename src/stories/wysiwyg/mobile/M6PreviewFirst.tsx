import { useState } from "react";
import { getNode, nodeLabel } from "../../../editor/path";
import type { InsertableKind } from "../../../editor/types";
import type { FlexBubble } from "../../../types";
import { font, kindLabel, w } from "../core/theme";
import { useFlexDoc } from "../core/useFlexDoc";
import { WysiwygInspector } from "../core/WysiwygInspector";
import {
	BottomSheet,
	MobilePreview,
	MobileShell,
	PaletteBar,
	TapToPlaceLayer,
} from "./MobileShared";

/**
 * 案 M6: プレビュー first → 編集モーダル型（2 段階）
 *
 * - 常態はプレビューだけ。実機の見た目をそのまま大きく表示（100%/実幅で最大）
 * - 「編集」をタップするとフルスクリーンの編集レイヤーが開く
 *   （呼び出し側のモーダル/Sheet 想定に合わせた面構え）
 * - 編集レイヤー内: パレット → ＋ガイドをタップして配置、部品タップで設定
 * - 「完了」でプレビューへ戻る。undo/redo は編集レイヤー内に常設
 */

export function MobilePreviewFirst({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [editing, setEditing] = useState(false);
	const [insertKind, setInsertKind] = useState<InsertableKind | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const selectedNode = doc.selected
		? getNode(doc.bubble, doc.selected)
		: undefined;

	return (
		<MobileShell
			title={editing ? "編集中" : "プレビュー"}
			doc={doc}
			onClose={editing ? () => setEditing(false) : undefined}
		>
			{/* 常態: プレビューだけをそのまま */}
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "14px 12px 24px",
					display: "flex",
					justifyContent: "center",
					alignItems: "flex-start",
					backgroundColor: w.canvasBg,
				}}
			>
				<MobilePreview doc={doc} width="100%" />
			</div>

			{/* 編集ボタン */}
			<div
				style={{
					flexShrink: 0,
					padding: "10px 12px calc(12px + env(safe-area-inset-bottom))",
					backgroundColor: w.white,
					borderTop: `1px solid ${w.border}`,
				}}
			>
				<button
					type="button"
					onClick={() => setEditing(true)}
					style={{
						width: "100%",
						minHeight: 48,
						backgroundColor: w.green,
						color: w.white,
						border: "none",
						borderRadius: 10,
						fontSize: 15,
						fontWeight: 700,
						cursor: "pointer",
						fontFamily: font,
					}}
				>
					✎ このメッセージを編集
				</button>
			</div>

			{/* 編集フルスクリーンレイヤー（モーダル相当） */}
			{editing && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="編集画面"
					style={{
						position: "absolute",
						inset: 0,
						zIndex: 30,
						backgroundColor: w.canvasBg,
						display: "flex",
						flexDirection: "column",
						fontFamily: font,
					}}
				>
					{/* 編集ヘッダー */}
					<div
						style={{
							flexShrink: 0,
							display: "flex",
							alignItems: "center",
							gap: 6,
							padding: "8px 10px",
							backgroundColor: w.white,
							borderBottom: `1px solid ${w.border}`,
						}}
					>
						<strong style={{ fontSize: 14, flex: 1 }}>編集</strong>
						<button
							type="button"
							aria-label="元に戻す"
							disabled={!doc.canUndo}
							onClick={doc.undo}
							style={headerBtn}
						>
							↩
						</button>
						<button
							type="button"
							aria-label="やり直す"
							disabled={!doc.canRedo}
							onClick={doc.redo}
							style={headerBtn}
						>
							↪
						</button>
						<button
							type="button"
							onClick={() => {
								doc.select(null);
								setInsertKind(null);
								setEditing(false);
							}}
							style={{
								...headerBtn,
								backgroundColor: w.green,
								color: w.white,
								border: "none",
								padding: "0 16px",
								width: "auto",
								fontWeight: 700,
							}}
						>
							完了
						</button>
					</div>

					{/* プレビュー */}
					<div
						style={{
							flex: 1,
							overflowY: "auto",
							padding: "10px 10px 16px",
							display: "flex",
							justifyContent: "center",
							alignItems: "flex-start",
						}}
					>
						<MobilePreview doc={doc} width="100%" />
					</div>

					{/* 選択中の部品バー */}
					{selectedNode && doc.selected && !insertKind && (
						<div
							style={{
								flexShrink: 0,
								display: "flex",
								gap: 4,
								padding: "6px 8px",
								backgroundColor: w.white,
								borderTop: `1px solid ${w.border}`,
								alignItems: "center",
							}}
						>
							<span
								style={{
									flex: 1,
									fontSize: 12,
									fontWeight: 700,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{nodeLabel(selectedNode)}
							</span>
							<BarBtn label="設定" onClick={() => setSheetOpen(true)}>
								⚙
							</BarBtn>
							<BarBtn
								label="上へ"
								onClick={() => doc.selected && doc.move(doc.selected, -1)}
							>
								↑
							</BarBtn>
							<BarBtn
								label="下へ"
								onClick={() => doc.selected && doc.move(doc.selected, 1)}
							>
								↓
							</BarBtn>
							<BarBtn
								label="複製"
								onClick={() => doc.selected && doc.duplicate(doc.selected)}
							>
								⧉
							</BarBtn>
							<BarBtn
								label="削除"
								danger
								onClick={() => doc.selected && doc.remove(doc.selected)}
							>
								🗑
							</BarBtn>
						</div>
					)}

					{/* パレット */}
					<div
						style={{
							flexShrink: 0,
							backgroundColor: w.white,
							borderTop: `1px solid ${w.border}`,
						}}
					>
						<PaletteBar
							onPick={(k) => setInsertKind(insertKind === k ? null : k)}
							activeKind={insertKind}
						/>
					</div>

					{/* タップ・トゥ・プレイス */}
					{insertKind && (
						<TapToPlaceLayer
							doc={doc}
							kind={insertKind}
							onDone={() => setInsertKind(null)}
							label={`${kindLabel[insertKind]}を置く場所をタップ`}
						/>
					)}

					{/* 設定シート */}
					{sheetOpen && selectedNode && doc.selected && (
						<BottomSheet
							title={nodeLabel(selectedNode)}
							onClose={() => setSheetOpen(false)}
						>
							<WysiwygInspector
								node={selectedNode}
								onPatch={(p) => doc.selected && doc.patch(doc.selected, p)}
							/>
						</BottomSheet>
					)}
				</div>
			)}
		</MobileShell>
	);
}

const headerBtn: React.CSSProperties = {
	width: 44,
	height: 44,
	border: `1px solid ${w.border}`,
	borderRadius: 8,
	backgroundColor: w.white,
	fontSize: 15,
	cursor: "pointer",
	color: w.text,
	fontFamily: font,
	flexShrink: 0,
};

function BarBtn({
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
				cursor: "pointer",
				fontSize: 14,
				color: danger ? w.danger : w.text,
				flexShrink: 0,
				fontFamily: font,
			}}
		>
			{children}
		</button>
	);
}
