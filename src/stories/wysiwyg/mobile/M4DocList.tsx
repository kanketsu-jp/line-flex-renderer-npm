import { useRef, useState } from "react";
import { getNode, listNodes, nodeLabel } from "../../../editor/path";
import type { InsertableKind } from "../../../editor/types";
import type { FlexBubble } from "../../../types";
import { font, kindIcon, w } from "../core/theme";
import { useFlexDoc } from "../core/useFlexDoc";
import { WysiwygInspector } from "../core/WysiwygInspector";
import { BottomSheet, MobilePreview, MobileShell } from "./MobileShared";

/**
 * 案 M4: ドキュメント リスト型（Notion モバイル風）
 *
 * - 部品の縦リストそのものがエディタ。構造が一目でわかる
 * - 行をタップ → 選択＋シートでプロパティ
 * - テキスト行はシートなしでインライン編集
 * - ⠿ ハンドルを長押しドラッグで並べ替え（Pointer Events）
 * - 行間の「＋」をタップして挿入
 * - 上部にミニプレビュー（タップで展開）
 */

export function MobileDocList({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [dragOverKey, setDragOverKey] = useState<string | null>(null);
	const dragInfoRef = useRef<{
		path: ReturnType<typeof listNodes>[0]["path"];
		label: string;
	} | null>(null);
	const [ghost, setGhost] = useState<{
		x: number;
		y: number;
		label: string;
	} | null>(null);

	const entries = listNodes(doc.bubble);
	const selectedNode = doc.selected
		? getNode(doc.bubble, doc.selected)
		: undefined;

	const pathKey = (p: { section: string; indices: number[] }) =>
		`${p.section}-${p.indices.join("-")}`;

	const beginDrag = (
		e: React.PointerEvent,
		entry: ReturnType<typeof listNodes>[0],
	) => {
		if (entry.path.indices.length === 0) return; // セクション行はドラッグ不可
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		dragInfoRef.current = { path: entry.path, label: entry.label };
		setGhost({ x: e.clientX, y: e.clientY, label: entry.label });
	};

	const moveDrag = (e: React.PointerEvent) => {
		if (!dragInfoRef.current) return;
		setGhost({ x: e.clientX, y: e.clientY, label: dragInfoRef.current.label });
		// ドロップ先を要素から判定（リスト行の data-list-key）
		const el = document.elementFromPoint(
			e.clientX,
			e.clientY,
		) as HTMLElement | null;
		const row = el?.closest("[data-list-key]") as HTMLElement | null;
		setDragOverKey(row?.dataset.listKey ?? null);
	};

	const endDrag = (e: React.PointerEvent) => {
		const info = dragInfoRef.current;
		if (info) {
			const el = document.elementFromPoint(
				e.clientX,
				e.clientY,
			) as HTMLElement | null;
			const row = el?.closest("[data-list-key]") as HTMLElement | null;
			const targetKey = row?.dataset.listKey;
			if (targetKey && targetKey !== pathKey(info.path)) {
				const [section, idxStr] = targetKey.split("-");
				const indices = idxStr.split("-").map(Number);
				if (indices.length > 0 && indices.length === info.path.indices.length) {
					// 同じ親の中での移動（プロトタイプ簡略化）
					const from = info.path.indices[info.path.indices.length - 1];
					const to = indices[indices.length - 1];
					if (section === info.path.section) {
						doc.move(info.path, to > from ? to - from : to - from);
					}
				}
			}
		}
		dragInfoRef.current = null;
		setGhost(null);
		setDragOverKey(null);
	};

	return (
		<MobileShell title="リストで編集" doc={doc}>
			{/* ミニプレビュー（折りたたみ） */}
			<button
				type="button"
				aria-expanded={previewOpen}
				onClick={() => setPreviewOpen((v) => !v)}
				style={{
					flexShrink: 0,
					display: "flex",
					alignItems: "center",
					gap: 6,
					padding: "6px 12px",
					backgroundColor: w.white,
					borderBottom: `1px solid ${w.border}`,
					border: "none",
					fontSize: 12,
					fontWeight: 700,
					color: w.subText,
					cursor: "pointer",
					fontFamily: font,
				}}
			>
				{previewOpen ? "▾" : "▸"} プレビュー
			</button>
			{previewOpen && (
				<div
					style={{
						flexShrink: 0,
						maxHeight: 200,
						overflow: "auto",
						padding: "8px 12px",
						backgroundColor: w.white,
						borderBottom: `1px solid ${w.border}`,
						display: "flex",
						justifyContent: "center",
					}}
				>
					<MobilePreview doc={doc} width={250} />
				</div>
			)}

			{/* リスト本体 */}
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "4px 8px 24px",
					backgroundColor: w.white,
				}}
			>
				{entries.map((entry) => {
					const key = pathKey(entry.path);
					const selected = doc.selected && pathKey(doc.selected) === key;
					const isOver = dragOverKey === key;
					return (
						<div key={key} data-list-key={key}>
							{/* biome-ignore lint/a11y/useSemanticElements: ドラッグハンドル兼選択行（pointer capture を使うため div+role） */}
							<div
								role="button"
								tabIndex={0}
								onClick={() => doc.select(entry.path)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										doc.select(entry.path);
										setSheetOpen(true);
									}
								}}
								onPointerDown={(e) => beginDrag(e, entry)}
								onPointerMove={moveDrag}
								onPointerUp={endDrag}
								onPointerCancel={() => {
									dragInfoRef.current = null;
									setGhost(null);
								}}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
									marginLeft: entry.depth * 14,
									minHeight: 48,
									padding: "4px 6px",
									borderRadius: 8,
									backgroundColor: isOver
										? w.greenSoft
										: selected
											? "rgba(6,199,85,0.12)"
											: undefined,
									border: isOver
										? `1.5px dashed ${w.green}`
										: "1px solid transparent",
									cursor: "grab",
									touchAction: "none",
								}}
							>
								<span
									style={{
										color:
											entry.path.indices.length === 0 ? w.green : w.subText,
										fontSize: 11,
										width: 18,
										textAlign: "center",
										flexShrink: 0,
									}}
								>
									{entry.path.indices.length === 0 ? "▣" : "⠿"}
								</span>
								<span
									style={{
										flex: 1,
										fontSize: entry.path.indices.length === 0 ? 12 : 13,
										fontWeight: entry.path.indices.length === 0 ? 700 : 400,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{entry.path.indices.length > 0 && (
										<span style={{ color: w.subText, marginRight: 4 }}>
											{kindIcon[entry.node.type]}
										</span>
									)}
									{entry.label}
								</span>
								{entry.path.indices.length > 0 && (
									<button
										type="button"
										aria-label="設定"
										onClick={(e) => {
											e.stopPropagation();
											doc.select(entry.path);
											setSheetOpen(true);
										}}
										style={{
											width: 40,
											height: 40,
											border: "none",
											background: "transparent",
											fontSize: 14,
											cursor: "pointer",
											flexShrink: 0,
										}}
									>
										⚙
									</button>
								)}
							</div>

							{/* box の下に挿入ボタン（子の先頭に追加） */}
							{entry.node.type === "box" && (
								<InsertRow
									parentKey={key}
									onInsert={(kind) => {
										doc.insert(entry.path, kind);
									}}
									dragOver={dragOverKey === `${key}-insert`}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* ドラッグゴースト */}
			{ghost && (
				<div
					aria-hidden
					style={{
						position: "fixed",
						left: ghost.x - 60,
						top: ghost.y - 22,
						backgroundColor: w.green,
						color: w.white,
						fontSize: 12,
						fontWeight: 700,
						padding: "8px 14px",
						borderRadius: 8,
						pointerEvents: "none",
						zIndex: 100,
						boxShadow: "0 6px 20px rgba(6,199,85,0.5)",
						fontFamily: font,
					}}
				>
					{ghost.label}
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

function InsertRow({
	parentKey,
	onInsert,
	dragOver,
}: {
	parentKey: string;
	onInsert: (kind: InsertableKind) => void;
	dragOver: boolean;
}) {
	const [open, setOpen] = useState(false);
	return (
		<div
			data-list-key={`${parentKey}-insert`}
			style={{
				marginLeft: 26,
				padding: "2px 0",
				...(dragOver ? { backgroundColor: w.greenSoft, borderRadius: 6 } : {}),
			}}
		>
			<button
				type="button"
				aria-label="ここに部品を追加"
				onClick={(e) => {
					e.stopPropagation();
					setOpen((v) => !v);
				}}
				style={{
					border: "none",
					background: "transparent",
					color: w.green,
					fontWeight: 700,
					fontSize: 12,
					cursor: "pointer",
					padding: "4px 10px",
					minHeight: 36,
					fontFamily: font,
				}}
			>
				＋
			</button>
			{open && (
				<div
					role="menu"
					style={{
						display: "flex",
						gap: 6,
						padding: "0 8px 6px",
						flexWrap: "wrap",
					}}
				>
					{(
						["text", "image", "button", "box", "separator"] as InsertableKind[]
					).map((k) => (
						<button
							key={k}
							type="button"
							role="menuitem"
							onClick={() => {
								onInsert(k);
								setOpen(false);
							}}
							style={{
								border: `1px solid ${w.border}`,
								backgroundColor: w.white,
								borderRadius: 8,
								padding: "8px 12px",
								fontSize: 12,
								fontWeight: 600,
								cursor: "pointer",
								fontFamily: font,
							}}
						>
							{kindIcon[k]}{" "}
							{k === "text"
								? "テキスト"
								: k === "image"
									? "画像"
									: k === "button"
										? "ボタン"
										: k === "box"
											? "ボックス"
											: "区切り線"}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
