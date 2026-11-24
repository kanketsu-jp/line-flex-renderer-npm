import { useState } from "react";
import { getNode, nodeLabel } from "../../../editor/path";
import type { InsertableKind } from "../../../editor/types";
import type { FlexBubble } from "../../../types";
import { font, kindIcon, kindLabel, w } from "../core/theme";
import { useFlexDoc } from "../core/useFlexDoc";
import { WysiwygInspector } from "../core/WysiwygInspector";
import {
	BottomSheet,
	MobilePreview,
	MobileShell,
	makePlaceHandler,
} from "./MobileShared";

/**
 * 案 M3: クイックシート型（Figma モバイル風）
 *
 * - キャンバスを極力大きく。UI は最小限
 * - 右下の FAB（＋）→ 部品シート → 部品を選ぶと挿入モード（box をタップ）
 * - 部品をタップ → クイックシート（プロパティ）
 * - 「削除・複製」は部品選択時のフローティングメニュー
 * - 熟練者向け・最速フロー
 */

export function MobileQuickSheet({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [fabOpen, setFabOpen] = useState(false);
	const [insertKind, setInsertKind] = useState<InsertableKind | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const selectedNode = doc.selected
		? getNode(doc.bubble, doc.selected)
		: undefined;

	const pick = (kind: InsertableKind) => {
		setFabOpen(false);
		setInsertKind(kind);
	};

	return (
		<MobileShell title="クイック編集" doc={doc}>
			{/* キャンバス（できるだけ大きく） */}
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "12px 8px 90px",
					display: "flex",
					justifyContent: "center",
				}}
			>
				<MobilePreview
					doc={doc}
					width="100%"
					tapToPlace={
						insertKind
							? {
									kind: insertKind,
									label: "置く場所をタップ",
									onPlace: makePlaceHandler(doc, insertKind, () =>
										setInsertKind(null),
									),
								}
							: null
					}
				/>
			</div>

			{/* 選択中の部品 → フローティングメニュー */}
			{selectedNode && doc.selected && !insertKind && (
				<div
					style={{
						position: "absolute",
						bottom: 84,
						left: "50%",
						transform: "translateX(-50%)",
						display: "flex",
						gap: 4,
						backgroundColor: w.white,
						borderRadius: 12,
						boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
						padding: 4,
					}}
				>
					<QBtn label="設定" onClick={() => setSheetOpen(true)}>
						⚙
					</QBtn>
					<QBtn
						label="上へ"
						onClick={() => doc.selected && doc.move(doc.selected, -1)}
					>
						↑
					</QBtn>
					<QBtn
						label="下へ"
						onClick={() => doc.selected && doc.move(doc.selected, 1)}
					>
						↓
					</QBtn>
					<QBtn
						label="複製"
						onClick={() => doc.selected && doc.duplicate(doc.selected)}
					>
						⧉
					</QBtn>
					<QBtn
						label="削除"
						danger
						onClick={() => doc.selected && doc.remove(doc.selected)}
					>
						🗑
					</QBtn>
				</div>
			)}

			{/* FAB */}
			{!insertKind && (
				<button
					type="button"
					aria-label="部品を追加"
					aria-expanded={fabOpen}
					onClick={() => setFabOpen((v) => !v)}
					style={{
						position: "absolute",
						right: 16,
						bottom: 20,
						width: 56,
						height: 56,
						borderRadius: "50%",
						backgroundColor: w.green,
						color: w.white,
						border: "none",
						fontSize: 26,
						fontWeight: 700,
						cursor: "pointer",
						boxShadow: `0 6px 20px rgba(6,199,85,0.5)`,
						fontFamily: font,
					}}
				>
					{fabOpen ? "✕" : "＋"}
				</button>
			)}

			{/* FAB を開く → 部品シート */}
			{fabOpen && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="追加する部品"
					onClick={() => setFabOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Escape") setFabOpen(false);
					}}
					style={{
						position: "absolute",
						inset: 0,
						backgroundColor: "rgba(0,0,0,0.35)",
						zIndex: 50,
						display: "flex",
						alignItems: "flex-end",
					}}
				>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: クリック伝播停止のみ */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: キー操作は内部ボタンが担う */}
					<div
						onClick={(e) => e.stopPropagation()}
						style={{
							width: "100%",
							backgroundColor: w.white,
							borderRadius: "16px 16px 0 0",
							padding: "10px 12px calc(16px + env(safe-area-inset-bottom))",
						}}
					>
						<strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
							追加する部品
						</strong>
						<div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
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
									onClick={() => pick(k)}
									style={{
										minWidth: 72,
										minHeight: 64,
										borderRadius: 12,
										border: `1px solid ${w.border}`,
										backgroundColor: w.white,
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										justifyContent: "center",
										gap: 2,
										fontFamily: font,
										flexShrink: 0,
										cursor: "pointer",
									}}
								>
									<span style={{ fontSize: 18 }}>{kindIcon[k]}</span>
									<span style={{ fontSize: 11, fontWeight: 600 }}>
										{kindLabel[k]}
									</span>
								</button>
							))}
						</div>
					</div>
				</div>
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
		</MobileShell>
	);
}

function QBtn({
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
				width: 44,
				height: 44,
				borderRadius: 10,
				border: "none",
				backgroundColor: "transparent",
				fontSize: 16,
				cursor: "pointer",
				color: danger ? w.danger : w.text,
				fontFamily: font,
			}}
		>
			{children}
		</button>
	);
}
