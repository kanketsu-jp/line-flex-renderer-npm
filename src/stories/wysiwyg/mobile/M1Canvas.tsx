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
 * 案 M1: フルスクリーン キャンバス型（Canva モバイル風）
 *
 * - キャンバスが主役。スクロールして全体を見る
 * - 下部パレットで部品を選ぶと「挿入モード」:
 *   キャンバス内の box が「＋」ガイドに変わり、タップでその位置に追加
 *   （モバイル DnD の代替 = タップ・トゥ・プレイス）
 * - 部品をタップすると下部にコンテキストバー（設定/複製/削除）
 * - 設定はボトムシート
 */

export function MobileCanvas({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [insertKind, setInsertKind] = useState<InsertableKind | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const selectedNode = doc.selected
		? getNode(doc.bubble, doc.selected)
		: undefined;

	const onPick = (kind: InsertableKind) => {
		setInsertKind(insertKind === kind ? null : kind); // 再タップで解除
	};

	return (
		<MobileShell title="デザイン編集" doc={doc}>
			{/* キャンバス */}
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "12px 10px 20px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<MobilePreview doc={doc} width={300} />
			</div>

			{/* 選択中部品のコンテキストバー */}
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
				<PaletteBar onPick={onPick} activeKind={insertKind} />
			</div>

			{/* 挿入モード: box をタップして配置 */}
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
		</MobileShell>
	);
}

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
