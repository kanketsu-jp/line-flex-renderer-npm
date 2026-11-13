import type React from "react";
import { useState } from "react";
import { NodeInspector } from "../../editor/inspectors";
import { containsLockedUri } from "../../editor/lockedUris";
import {
	ensureSection,
	getNode,
	listNodes,
	nodeLabel,
} from "../../editor/path";
import type {
	FlexNodePath,
	FlexSection,
	InsertableKind,
} from "../../editor/types";
import type { FlexBubble, FlexComponentType } from "../../types";
import { chipStyle, font, iconBtn, kindIcon, w } from "./core/theme";
import { useFlexDoc } from "./core/useFlexDoc";

/**
 * 案 B: ブロックハンドル型（Notion / BlockNote アプローチ）
 *
 * - メッセージを「ブロックのリスト」として捉え、1 要素 = 1 行
 * - 行に hover すると左に ⠿（ドラッグ）と ＋（下に挿入）ハンドル
 * - テキストは行を直接クリックしてインライン編集
 * - ⚙ でその場にポップオーバー・インスペクタ
 * - 構造（階層）はインデントで表現。Notion 的「文档即数据」
 */

interface RowProps {
	node: FlexComponentType;
	path: FlexNodePath;
	depth: number;
	doc: ReturnType<typeof useFlexDoc>;
	onOpenSettings: (path: FlexNodePath) => void;
	isDragOver: boolean;
	onDragOverRow: (path: FlexNodePath | null) => void;
	draggingPath: FlexNodePath | null;
	setDraggingPath: (p: FlexNodePath | null) => void;
}

function BlockRow(props: RowProps) {
	const {
		node,
		path,
		depth,
		doc,
		onOpenSettings,
		isDragOver,
		draggingPath,
		setDraggingPath,
		onDragOverRow,
	} = props;
	const [editing, setEditing] = useState(false);
	const isText = node.type === "text";
	const isSelected =
		doc.selected &&
		doc.selected.section === path.section &&
		doc.selected.indices.join() === path.indices.join();
	const isLocked = containsLockedUri(node, undefined);
	const parentIndices = path.indices.slice(0, -1);
	const parentNode = getNode(doc.bubble, {
		section: path.section,
		indices: parentIndices,
	});
	const isVertical =
		!parentNode ||
		parentNode.type !== "box" ||
		parentNode.layout !== "horizontal";

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: DnD 並べ替えターゲット＋ブロック選択（実操作は内部ボタンが担う）
		// biome-ignore lint/a11y/useKeyWithClickEvents: 行単位のキー操作は内部の設定ボタン経由で提供
		<div
			style={{
				display: "flex",
				alignItems: isVertical ? "stretch" : "center",
				gap: 2,
				marginLeft: depth * 18,
				borderRadius: 6,
				backgroundColor: isSelected
					? w.greenSoft
					: isDragOver
						? "rgba(6,199,85,0.18)"
						: undefined,
				outline: isSelected ? `1.5px solid ${w.green}` : undefined,
				opacity:
					draggingPath && draggingPath.indices.join() === path.indices.join()
						? 0.4
						: 1,
			}}
			onClick={() => doc.select(path)}
			onDragOver={(e) => {
				if (draggingPath) {
					e.preventDefault();
					onDragOverRow(path);
				}
			}}
			onDragLeave={() => onDragOverRow(null)}
			onDrop={(e) => {
				e.preventDefault();
				if (!draggingPath) return;
				// 同じ親内での並べ替えのみ（プロトタイプ）
				const from = draggingPath.indices[draggingPath.indices.length - 1];
				const to = path.indices[path.indices.length - 1];
				if (from !== to) {
					doc.move(draggingPath, to > from ? to - from : to - from);
				}
				setDraggingPath(null);
				onDragOverRow(null);
			}}
		>
			{/* ハンドル列 */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flexShrink: 0,
					width: 40,
				}}
			>
				<div style={{ display: "flex", gap: 0 }}>
					<button
						type="button"
						aria-label="ドラッグして並べ替え"
						title="ドラッグして並べ替え"
						draggable
						onDragStart={() => setDraggingPath(path)}
						onDragEnd={() => {
							setDraggingPath(null);
							onDragOverRow(null);
						}}
						style={{
							...iconBtn,
							border: "none",
							boxShadow: "none",
							width: 20,
							height: 20,
							cursor: "grab",
							fontSize: 11,
							color: w.subText,
							background: "transparent",
						}}
					>
						⠿
					</button>
					<InsertMenu doc={doc} path={path} />
				</div>
			</div>
			{/* ブロック本体（選択クリックは親の BlockRow が処理） */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: ダブルクリック編集の起点。キー操作は BlockRow の role で担保 */}
			<div
				style={{
					flex: 1,
					minWidth: 0,
					padding: "1px 2px",
					cursor: isText ? "text" : "pointer",
				}}
				onDoubleClick={(e) => {
					if (isText) {
						e.stopPropagation();
						setEditing(true);
					}
				}}
			>
				{editing && isText ? (
					<input
						// biome-ignore lint/a11y/noAutofocus: プロトタイプ簡略化
						autoFocus
						defaultValue={node.text ?? ""}
						style={{
							width: "100%",
							border: "none",
							outline: `1.5px solid ${w.green}`,
							fontSize: 13,
							padding: "2px 4px",
							backgroundColor: w.white,
							fontFamily: "inherit",
						}}
						onBlur={(e) => {
							setEditing(false);
							doc.patch(path, { text: e.target.value });
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") e.currentTarget.blur();
							if (e.key === "Escape") {
								e.currentTarget.defaultValue = node.text ?? "";
								setEditing(false);
							}
						}}
					/>
				) : (
					<BlockPreview node={node} />
				)}
			</div>
			{/* 行アクション */}
			<div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
				<button
					type="button"
					aria-label="設定"
					title="設定"
					onClick={() => onOpenSettings(path)}
					style={{
						...iconBtn,
						border: "none",
						boxShadow: "none",
						width: 22,
						height: 22,
						fontSize: 11,
					}}
				>
					⚙
				</button>
				{path.indices.length > 0 && (
					<button
						type="button"
						aria-label="削除"
						title={isLocked ? "保護された部品" : "削除"}
						onClick={() => doc.remove(path)}
						style={{
							...iconBtn,
							border: "none",
							boxShadow: "none",
							width: 22,
							height: 22,
							fontSize: 11,
							color: w.danger,
						}}
					>
						✕
					</button>
				)}
			</div>
		</div>
	);
}

function BlockPreview({ node }: { node: FlexComponentType }) {
	const common: React.CSSProperties = {
		fontSize: 13,
		lineHeight: 1.6,
		padding: "2px 0",
		minHeight: 22,
	};
	switch (node.type) {
		case "text":
			return (
				<div
					style={{ ...common, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
				>
					{node.text ??
						(node.contents?.map((s) => s.text ?? "").join("") || "テキスト")}
				</div>
			);
		case "image":
			return (
				<div
					style={{
						...common,
						display: "flex",
						alignItems: "center",
						gap: 6,
						color: w.subText,
					}}
				>
					🖼{" "}
					<span
						style={{
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{node.url}
					</span>
				</div>
			);
		case "button":
			return (
				<div style={{ padding: "4px 0" }}>
					<span
						style={{
							display: "inline-block",
							backgroundColor:
								node.style === "link" ? "transparent" : (node.color ?? w.green),
							color: node.style === "link" ? w.green : "#fff",
							borderRadius: 6,
							padding: "5px 14px",
							fontSize: 12,
							fontWeight: 600,
						}}
					>
						{node.action?.label || "ボタン"}
					</span>
				</div>
			);
		case "separator":
			return (
				<hr
					style={{
						border: "none",
						borderTop: "1px solid #E5E5E5",
						margin: "6px 0",
					}}
				/>
			);
		case "box":
			return (
				<div
					style={{ ...common, fontWeight: 600, fontSize: 11, color: w.subText }}
				>
					▤{" "}
					{node.layout === "vertical"
						? "縦"
						: node.layout === "horizontal"
							? "横"
							: "ベースライン"}
					ボックス
				</div>
			);
		default:
			return <div style={common}>{nodeLabel(node)}</div>;
	}
}

function InsertMenu({
	doc,
	path,
}: {
	doc: ReturnType<typeof useFlexDoc>;
	path: FlexNodePath;
}) {
	const [open, setOpen] = useState(false);
	const parentNode = getNode(doc.bubble, path);
	const isBox = parentNode?.type === "box";
	const kinds: InsertableKind[] = [
		"text",
		"image",
		"button",
		"separator",
		"box",
	];
	// baseline ボックス内は挿入不可種別があるが、プロトタイプでは簡略化
	const parentIndices = path.indices;
	const insertPath: FlexNodePath = {
		section: path.section,
		indices: parentIndices,
	};

	if (!isBox) return <span style={{ width: 20 }} />;

	return (
		<div style={{ position: "relative" }}>
			<button
				type="button"
				aria-label="下に挿入"
				title="下に挿入"
				onClick={(e) => {
					e.stopPropagation();
					setOpen((v) => !v);
				}}
				style={{
					...iconBtn,
					border: "none",
					boxShadow: "none",
					width: 20,
					height: 20,
					fontSize: 11,
					color: w.green,
					background: "transparent",
				}}
			>
				＋
			</button>
			{open && (
				<div
					role="menu"
					style={{
						position: "absolute",
						top: 22,
						left: 0,
						zIndex: 10,
						backgroundColor: w.white,
						border: `1px solid ${w.border}`,
						borderRadius: 8,
						boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
						padding: 4,
						display: "flex",
						flexDirection: "column",
						minWidth: 120,
					}}
				>
					{kinds.map((k) => (
						<button
							key={k}
							type="button"
							role="menuitem"
							style={{
								border: "none",
								background: "transparent",
								textAlign: "left",
								padding: "6px 10px",
								fontSize: 12,
								cursor: "pointer",
								borderRadius: 6,
								fontFamily: font,
							}}
							onClick={(e) => {
								e.stopPropagation();
								doc.insert(insertPath, k);
								setOpen(false);
							}}
						>
							{kindIcon[k]}{" "}
							{k === "text"
								? "テキスト"
								: k === "image"
									? "画像"
									: k === "button"
										? "ボタン"
										: k === "separator"
											? "区切り線"
											: "ボックス"}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function SettingsPopover({
	doc,
	onClose,
}: {
	doc: ReturnType<typeof useFlexDoc>;
	onClose: () => void;
}) {
	const node = doc.selectedNode;
	if (!node || !doc.selected) return null;
	return (
		<div
			style={{
				position: "fixed",
				right: 16,
				top: 64,
				bottom: 16,
				width: 300,
				backgroundColor: w.white,
				border: `1px solid ${w.border}`,
				borderRadius: 12,
				boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
				padding: 14,
				overflowY: "auto",
				zIndex: 20,
				fontFamily: font,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 8,
				}}
			>
				<strong style={{ fontSize: 13 }}>{nodeLabel(node)}</strong>
				<button
					type="button"
					onClick={onClose}
					style={{ ...iconBtn, border: "none", boxShadow: "none" }}
					aria-label="閉じる"
				>
					✕
				</button>
			</div>
			<NodeInspector
				node={node}
				onPatch={(p) => doc.selected && doc.patch(doc.selected, p)}
			/>
		</div>
	);
}

function SectionHeader({
	section,
	doc,
	exists,
}: {
	section: FlexSection;
	doc: ReturnType<typeof useFlexDoc>;
	exists: boolean;
}) {
	const labels: Record<FlexSection, string> = {
		header: "ヘッダー",
		hero: "メイン画像",
		body: "本文",
		footer: "フッター",
	};
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 8,
				margin: "14px 0 6px",
				paddingTop: 10,
				borderTop: `1px solid ${w.border}`,
			}}
		>
			<span
				style={{
					fontSize: 11,
					fontWeight: 700,
					color: w.subText,
					letterSpacing: 1,
				}}
			>
				{labels[section].toUpperCase()}
			</span>
			{!exists && (
				<button
					type="button"
					onClick={() => doc.replace(ensureSection(doc.bubble, section))}
					style={{
						...chipStyle,
						cursor: "pointer",
						color: w.green,
						borderColor: w.green,
					}}
				>
					＋ セクション追加
				</button>
			)}
		</div>
	);
}

export function ConceptBlocks({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [dragOverPath, setDragOverPath] = useState<FlexNodePath | null>(null);
	const [draggingPath, setDraggingPath] = useState<FlexNodePath | null>(null);
	const entries = listNodes(doc.bubble);
	const sections: FlexSection[] = ["header", "hero", "body", "footer"];

	return (
		<div
			style={{
				fontFamily: font,
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				backgroundColor: w.white,
				color: w.text,
			}}
		>
			<header
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					padding: "8px 14px",
					borderBottom: `1px solid ${w.border}`,
				}}
			>
				<strong style={{ fontSize: 14 }}>Flex Blocks</strong>
				<span style={{ fontSize: 11, color: w.subText }}>
					案B · ドキュメント型
				</span>
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
			</header>

			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "8px 20px 40px",
					maxWidth: 640,
					width: "100%",
					margin: "0 auto",
				}}
			>
				{doc.lastError && (
					<p role="alert" style={{ color: w.danger, fontSize: 12 }}>
						{doc.lastError}
					</p>
				)}
				{sections.map((section) => {
					const sectionEntries = entries.filter(
						(e) => e.path.section === section,
					);
					const exists = sectionEntries.length > 0;
					return (
						<div key={section}>
							<SectionHeader section={section} doc={doc} exists={exists} />
							{sectionEntries.map((entry) => (
								<BlockRow
									key={`${entry.path.section}-${entry.path.indices.join("-")}`}
									node={entry.node}
									path={entry.path}
									depth={entry.depth}
									doc={doc}
									onOpenSettings={(p) => {
										doc.select(p);
										setSettingsOpen(true);
									}}
									isDragOver={
										dragOverPath?.indices.join() ===
											entry.path.indices.join() &&
										dragOverPath.section === entry.path.section
									}
									onDragOverRow={setDragOverPath}
									draggingPath={draggingPath}
									setDraggingPath={setDraggingPath}
								/>
							))}
						</div>
					);
				})}
			</div>

			{settingsOpen && (
				<SettingsPopover doc={doc} onClose={() => setSettingsOpen(false)} />
			)}
		</div>
	);
}
