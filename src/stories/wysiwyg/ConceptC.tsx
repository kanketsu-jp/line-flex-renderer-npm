import type React from "react";
import { useState } from "react";
import { NodeInspector } from "../../editor/inspectors";
import {
	ensureSection,
	isSamePath,
	listNodes,
	nodeLabel,
} from "../../editor/path";
import type {
	FlexNodePath,
	FlexSection,
	InsertableKind,
} from "../../editor/types";
import type { FlexBubble, FlexComponentType } from "../../types";
import { InteractiveTree } from "./core/InteractiveTree";
import { font, iconBtn, kindIcon, w } from "./core/theme";
import { useFlexDoc } from "./core/useFlexDoc";

/**
 * 案 C: 3 ペイン ビルダー（Webflow / GrapesJS アプローチ）
 *
 * - 左ペイン: コンポーネント パレット（ドラッグ元）+ 構造ツリー（レイヤー）
 * - 中央: キャンバス（ドロップ先。ドロップターゲットがハイライト）
 * - 右ペイン: インスペクタ
 * - HTML5 ドラッグ&ドロップで「パレット → キャンバス」挿入
 */

const PALETTE: Array<{ kind: InsertableKind; label: string; desc: string }> = [
	{ kind: "text", label: "テキスト", desc: "見出しや本文" },
	{ kind: "image", label: "画像", desc: "写真・イラスト" },
	{ kind: "button", label: "ボタン", desc: "リンク・アクション" },
	{ kind: "box", label: "ボックス", desc: "部品をまとめる箱" },
	{ kind: "separator", label: "区切り線", desc: "横罫線" },
];

function PaletteItem({ item }: { item: (typeof PALETTE)[number] }) {
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: ドラッグ供給源（パレット）。代替操作としてレイヤーツリーからの挿入も提供
		<div
			draggable
			onDragStart={(e) => {
				e.dataTransfer.setData("application/x-flex-kind", item.kind);
				e.dataTransfer.effectAllowed = "copy";
			}}
			style={{
				display: "flex",
				alignItems: "center",
				gap: 10,
				padding: "8px 10px",
				border: `1px solid ${w.border}`,
				borderRadius: 8,
				backgroundColor: w.white,
				cursor: "grab",
				marginBottom: 6,
				userSelect: "none",
			}}
			title={`${item.label} — ${item.desc}`}
		>
			<span
				style={{
					width: 30,
					height: 30,
					borderRadius: 6,
					backgroundColor: w.greenSoft,
					color: w.green,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: 14,
					flexShrink: 0,
				}}
			>
				{kindIcon[item.kind]}
			</span>
			<div>
				<div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
				<div style={{ fontSize: 10, color: w.subText }}>{item.desc}</div>
			</div>
		</div>
	);
}

function LayerTree({
	doc,
	onDragOverTree,
	dropTargetPath,
	setDropTargetPath,
}: {
	doc: ReturnType<typeof useFlexDoc>;
	onDragOverTree: boolean;
	dropTargetPath: FlexNodePath | null;
	setDropTargetPath: (p: FlexNodePath | null) => void;
}) {
	const entries = listNodes(doc.bubble);
	return (
		<div style={{ flex: 1, overflowY: "auto" }}>
			{entries.map((entry) => {
				const isBox = entry.node.type === "box";
				const isDropTarget =
					isBox &&
					onDragOverTree &&
					dropTargetPath &&
					isSamePath(dropTargetPath, entry.path);
				const isSelected = isSamePath(doc.selected, entry.path);
				return (
					// biome-ignore lint/a11y/noStaticElementInteractions: レイヤー行。ドラッグでの並べ替えとクリック選択を兼ねる
					<div
						key={`${entry.path.section}-${entry.path.indices.join("-")}`}
						draggable={entry.path.indices.length > 0}
						onDragStart={(e) => {
							e.dataTransfer.setData(
								"application/x-flex-move",
								JSON.stringify(entry.path),
							);
						}}
						onDragOver={(e) => {
							if (!isBox) return;
							e.preventDefault();
							e.stopPropagation();
							setDropTargetPath(entry.path);
						}}
						onDrop={(e) => {
							e.preventDefault();
							e.stopPropagation();
							const kind = e.dataTransfer.getData("application/x-flex-kind");
							if (kind) {
								doc.insert(entry.path, kind as InsertableKind);
							}
							setDropTargetPath(null);
						}}
						onClick={() => doc.select(entry.path)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") doc.select(entry.path);
						}}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							padding: "3px 6px",
							marginLeft: entry.depth * 12,
							fontSize: 11,
							borderRadius: 4,
							cursor: "pointer",
							backgroundColor: isDropTarget
								? w.greenSoft
								: isSelected
									? "rgba(6,199,85,0.14)"
									: undefined,
							border: isDropTarget
								? `1.5px dashed ${w.green}`
								: "1px solid transparent",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						<span style={{ color: isBox ? w.green : w.subText, fontSize: 9 }}>
							{isBox ? "▤" : "·"}
						</span>
						<span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
							{entry.label}
						</span>
					</div>
				);
			})}
		</div>
	);
}

export function ConceptBuilder({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [dropTargetPath, setDropTargetPath] = useState<FlexNodePath | null>(
		null,
	);
	const [dragging, setDragging] = useState(false);
	const [hoverSection, setHoverSection] = useState<FlexSection | null>(null);

	const handleDropOnCanvas = (e: React.DragEvent, section: FlexSection) => {
		e.preventDefault();
		const kind = e.dataTransfer.getData("application/x-flex-kind");
		const movePathJson = e.dataTransfer.getData("application/x-flex-move");
		let bubble = doc.bubble;
		if (!bubble[section]) {
			bubble = ensureSection(bubble, section);
		}
		const sectionPath: FlexNodePath = { section, indices: [] };
		if (movePathJson) {
			try {
				const from = JSON.parse(movePathJson) as FlexNodePath;
				if (section === from.section) {
					doc.move(from, 1);
				} else {
					// セクション跨ぎはプロトタイプでは未対応（テストで検証予定の本実装課題）
					doc.remove(from);
					doc.insert(sectionPath, "text");
				}
			} catch {
				/* noop */
			}
		} else if (kind) {
			doc.replace(bubble);
			doc.insert(sectionPath, kind as InsertableKind);
		}
		setDragging(false);
		setHoverSection(null);
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: ドラッグ終了検知用ルート（操作は子要素が担う）
		<div
			style={{
				fontFamily: font,
				height: "100vh",
				display: "flex",
				backgroundColor: w.canvasBg,
				color: w.text,
			}}
			onDragEnd={() => {
				setDragging(false);
				setDropTargetPath(null);
			}}
		>
			{/* 左ペイン */}
			<aside
				style={{
					width: 224,
					flexShrink: 0,
					backgroundColor: w.white,
					borderRight: `1px solid ${w.border}`,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					style={{
						padding: "10px 12px 6px",
						fontSize: 11,
						fontWeight: 700,
						color: w.subText,
					}}
				>
					部品パレット
				</div>
				{/* ドラッグ開始の検知（実操作は PaletteItem が担う） */}
				{/* biome-ignore lint/a11y/noStaticElementInteractions: ドラッグ開始フラグの検知のみ */}
				<div
					style={{ padding: "0 10px" }}
					onDragStart={() => setDragging(true)}
				>
					{PALETTE.map((item) => (
						<PaletteItem key={item.kind} item={item} />
					))}
				</div>
				<div
					style={{
						padding: "10px 12px 4px",
						fontSize: 11,
						fontWeight: 700,
						color: w.subText,
						borderTop: `1px solid ${w.border}`,
						marginTop: 8,
					}}
				>
					構造（レイヤー）
				</div>
				<LayerTree
					doc={doc}
					onDragOverTree={dragging}
					dropTargetPath={dropTargetPath}
					setDropTargetPath={setDropTargetPath}
				/>
			</aside>

			{/* 中央キャンバス */}
			<main
				style={{
					flex: 1,
					display: "flex",
					justifyContent: "center",
					padding: 24,
					overflow: "auto",
				}}
			>
				<div style={{ width: 320 }}>
					{(["header", "hero", "body", "footer"] as FlexSection[]).map(
						(section) => {
							const node = doc.bubble[section] as FlexComponentType | undefined;
							return (
								// biome-ignore lint/a11y/noStaticElementInteractions: DnD ドロップ専用ゾーン
								<div
									key={section}
									onDragOver={(e) => {
										e.preventDefault();
										setHoverSection(section);
									}}
									onDragLeave={() => setHoverSection(null)}
									onDrop={(e) => handleDropOnCanvas(e, section)}
									style={{
										position: "relative",
										borderRadius: 10,
										outline:
											hoverSection === section
												? `2px dashed ${w.green}`
												: undefined,
										outlineOffset: 4,
										marginBottom: 8,
										minHeight: node ? undefined : 44,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										backgroundColor:
											hoverSection === section ? w.greenSoft : undefined,
									}}
								>
									{!node && (
										<span style={{ fontSize: 11, color: w.subText }}>
											{section} にドロップ
										</span>
									)}
									{hoverSection === section && node && (
										<span
											style={{
												position: "absolute",
												top: -8,
												left: 8,
												backgroundColor: w.green,
												color: w.white,
												fontSize: 9,
												fontWeight: 700,
												padding: "1px 6px",
												borderRadius: 4,
												zIndex: 5,
											}}
										>
											ここに追加
										</span>
									)}
								</div>
							);
						},
					)}
					{/* 実プレビュー（下に固定的に置く：キャンバス＝ドロップガイド＋実寸プレビューの同居） */}
					<div style={{ position: "absolute", visibility: "hidden" }}>
						<InteractiveTree doc={doc} width={280} interactive />
					</div>
				</div>
				<div style={{ position: "sticky", top: 0 }}>
					<InteractiveTree
						doc={doc}
						width={280}
						onAddSection={(s) => doc.replace(ensureSection(doc.bubble, s))}
					/>
				</div>
			</main>

			{/* 右ペイン */}
			<aside
				style={{
					width: 288,
					flexShrink: 0,
					backgroundColor: w.white,
					borderLeft: `1px solid ${w.border}`,
					overflowY: "auto",
					padding: 12,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						marginBottom: 10,
					}}
				>
					<strong style={{ fontSize: 13 }}>
						{doc.selectedNode ? nodeLabel(doc.selectedNode) : "部品を選択"}
					</strong>
					<div style={{ flex: 1 }} />
					<button
						type="button"
						style={iconBtn}
						onClick={doc.undo}
						disabled={!doc.canUndo}
						aria-label="元に戻す"
					>
						↩
					</button>
					<button
						type="button"
						style={iconBtn}
						onClick={doc.redo}
						disabled={!doc.canRedo}
						aria-label="やり直す"
					>
						↪
					</button>
				</div>
				{doc.lastError && (
					<p role="alert" style={{ color: w.danger, fontSize: 12 }}>
						{doc.lastError}
					</p>
				)}
				{doc.selectedNode && doc.selected ? (
					<NodeInspector
						node={doc.selectedNode}
						onPatch={(p) => doc.selected && doc.patch(doc.selected, p)}
					/>
				) : (
					<p style={{ fontSize: 12, color: w.subText }}>
						左のパレットから中央へドラッグして部品を追加できます。
					</p>
				)}
			</aside>
		</div>
	);
}
