// biome-ignore-all lint/suspicious/noArrayIndexKey: Flex contents は一意 id を持たず、並び順が実質的な識別子になる

import { Plus } from "lucide-react";
// 全案（A〜E / M1〜M6）がこのツリーを経由するため、ここで shadcn テーマを読む
import "../ui/styles.css";
import type React from "react";
import { createContext, useContext, useState } from "react";
import { FlexComponentRenderer } from "../../../components/FlexComponentRenderer";
import { BUBBLE_WIDTH, SPACING } from "../../../constants";
import { containsLockedUri } from "../../../editor/lockedUris";
import { nodeLabel } from "../../../editor/path";
import type { FlexNodePath, FlexSection } from "../../../editor/types";
import type { FlexBox, FlexBubble, FlexComponentType } from "../../../types";
import { cn } from "../ui/utils";
import { kindIcon, w } from "./theme";
import type { FlexDoc } from "./useFlexDoc";

/**
 * 選択可能な bubble ビュー。
 *
 * - クリックで選択 / ダブルクリックでテキスト インライン編集
 * - ホバーで dashed ハイライト / 選択で solid ハイライト＋ラベル
 * - box の子の間に「＋」挿入スロット
 * - 見た目の再現は既存レンダラー（FlexComponentRenderer）を再利用
 */

/** ドラッグ中のドロップ先ハイライト（パレット DnD 用） */
const DropTargetContext = createContext<FlexNodePath | null>(null);

/** ポインタ操作中のドロップ先判定: elementFromPoint から data 属性で box を探す */
export function findDropTargetFromPoint(
	x: number,
	y: number,
): { path: FlexNodePath; nodeType: string } | null {
	const el = document.elementFromPoint(x, y) as HTMLElement | null;
	const holder = el?.closest("[data-flex-path]") as HTMLElement | null;
	if (!holder) return null;
	try {
		return {
			path: JSON.parse(holder.dataset.flexPath ?? "") as FlexNodePath,
			nodeType: holder.dataset.flexType ?? "",
		};
	} catch {
		return null;
	}
}

interface NodeWrapProps {
	path: FlexNodePath;
	node: FlexComponentType;
	doc: FlexDoc;
	interactive: boolean;
	children: React.ReactNode;
}

function NodeWrap({ path, node, doc, interactive, children }: NodeWrapProps) {
	const [hover, setHover] = useState(false);
	const dropTarget = useContext(DropTargetContext);
	const isDropTarget =
		dropTarget !== null &&
		dropTarget.section === path.section &&
		dropTarget.indices.join() === path.indices.join() &&
		node.type === "box";
	const isSelected =
		doc.selected &&
		doc.selected.section === path.section &&
		doc.selected.indices.length === path.indices.length &&
		doc.selected.indices.every((v, i) => v === path.indices[i]);
	const isLocked = containsLockedUri(node, undefined);
	const isSection = path.indices.length === 0;

	if (!interactive) {
		return <div style={{ position: "relative" }}>{children}</div>;
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: 選択ラッパー。内部に contentEditable やブロック要素を含むため div+role を維持
		<div
			role="button"
			tabIndex={0}
			data-flex-path={JSON.stringify(path)}
			data-flex-type={node.type}
			style={{
				position: "relative",
				outline: isDropTarget
					? `3px solid ${w.green}`
					: isSelected
						? `2px solid ${w.green}`
						: hover
							? `1px dashed ${w.green}`
							: undefined,
				outlineOffset: 2,
				borderRadius: 3,
				cursor: "pointer",
				minWidth: isSection ? undefined : 0,
			}}
			onClick={(e) => {
				e.stopPropagation();
				doc.select(path);
			}}
			onKeyDown={(e) => {
				e.stopPropagation();
				if (e.key === "Escape") doc.select(null);
				if (e.key === "Delete" || e.key === "Backspace") {
					if (path.indices.length > 0) doc.remove(path);
				}
			}}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			{children}
			{(isSelected || hover) && (
				<span
					style={{
						position: "absolute",
						top: -9,
						left: 0,
						backgroundColor: isSelected ? w.green : w.white,
						color: isSelected ? w.white : w.subText,
						border: `1px solid ${isSelected ? w.green : w.border}`,
						borderRadius: 4,
						fontSize: 9,
						fontWeight: 700,
						padding: "1px 5px",
						pointerEvents: "none",
						whiteSpace: "nowrap",
						zIndex: 3,
					}}
				>
					{kindIcon[node.type] ?? "◆"} {nodeLabel(node)}
				</span>
			)}
			{isLocked && isSelected && (
				<span
					style={{
						position: "absolute",
						top: -9,
						right: 0,
						backgroundColor: w.danger,
						color: w.white,
						borderRadius: 4,
						fontSize: 9,
						fontWeight: 700,
						padding: "1px 5px",
						pointerEvents: "none",
					}}
				>
					🔒 保護
				</span>
			)}
		</div>
	);
}

/**
 * テキスト ノードのインライン編集（ダブルクリックで開始）。
 */
function EditableText({
	node,
	path,
	doc,
}: {
	node: Extract<FlexComponentType, { type: "text" }>;
	path: FlexNodePath;
	doc: FlexDoc;
}) {
	const [editing, setEditing] = useState(false);
	const hasSpans = node.contents && node.contents.length > 0;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: ダブルクリックでインライン編集を開始する専用ゾーン（選択は親が担当）
		<div
			onDoubleClick={(e) => {
				if (hasSpans) return; // span 構成テキストはパネル編集
				e.stopPropagation();
				setEditing(true);
			}}
			title={hasSpans ? undefined : "ダブルクリックで編集"}
		>
			{editing ? (
				// biome-ignore lint/a11y/useSemanticElements: contentEditable 本体は div が正しい
				<div
					contentEditable
					suppressContentEditableWarning
					role="textbox"
					tabIndex={0}
					aria-label="テキスト編集"
					style={{
						outline: `2px solid ${w.green}`,
						outlineOffset: 2,
						borderRadius: 3,
						minWidth: 40,
						cursor: "text",
					}}
					ref={(el) => {
						if (el) {
							el.textContent = node.text ?? "";
							el.focus();
							// キャレットを末尾へ
							const range = document.createRange();
							range.selectNodeContents(el);
							range.collapse(false);
							const sel = window.getSelection();
							sel?.removeAllRanges();
							sel?.addRange(range);
						}
					}}
					onBlur={(e) => {
						setEditing(false);
						const next = e.currentTarget.textContent ?? "";
						if (next !== (node.text ?? "")) {
							doc.patch(path, { text: next });
						}
					}}
					onKeyDown={(e) => {
						e.stopPropagation();
						if (e.key === "Escape") {
							e.currentTarget.blur();
						}
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							e.currentTarget.blur();
						}
					}}
				>
					{node.text}
				</div>
			) : (
				<FlexComponentRenderer component={node} />
			)}
		</div>
	);
}

/**
 * 挿入スロット（box の子の間 / 末尾に置く「＋」ゾタン）。
 */
/**
 * 挿入スロット — Tailwind UI「Divider with button」パターン。
 * 普段は薄い罫線、ホバー/フォーカスで中央の ＋ ピルが強調される。
 */
function InsertSlot({
	doc,
	parentPath,
	direction,
}: {
	doc: FlexDoc;
	parentPath: FlexNodePath;
	insertAt: number;
	direction: "vertical" | "horizontal";
}) {
	const isVertical = direction === "vertical";
	return (
		// biome-ignore lint/a11y/useSemanticElements: 罫線+pill の複合ヒット領域（背景飾りを含む）
		<button
			type="button"
			aria-label="ここにテキストを追加"
			title="ここにテキストを追加"
			onClick={(e) => {
				e.stopPropagation();
				doc.select(parentPath);
				doc.insert(parentPath, "text");
			}}
			className={cn(
				"group relative flex cursor-pointer items-center justify-center transition-all duration-150 opacity-40 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
				isVertical ? "h-7 w-full" : "h-full min-w-7",
			)}
		>
			{/* Divider 罫線 */}
			<div
				aria-hidden
				className={cn(
					"bg-border",
					isVertical
						? "absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
						: "absolute inset-y-0 left-1/2 w-px -translate-x-1/2",
				)}
			/>
			{/* 中央の ＋ pill */}
			<span className="relative inline-flex items-center justify-center rounded-full bg-white px-2 py-1 shadow-xs inset-ring inset-ring-border transition-transform duration-150 group-hover:scale-110 group-hover:inset-ring-primary/50 group-hover:shadow-md">
				<Plus
					aria-hidden
					className="size-4 text-muted-foreground group-hover:text-primary"
				/>
			</span>
		</button>
	);
}

/**
 * box を再帰レイアウト（margin/flex の挙動は FlexBoxComponent と同一）。
 * 各子を NodeWrap で包み、挿入スロットを挟む。
 */
function InteractiveBox({
	box,
	path,
	doc,
	interactive,
}: {
	box: FlexBox;
	path: FlexNodePath;
	doc: FlexDoc;
	interactive: boolean;
}) {
	const isVertical = box.layout === "vertical";
	const isBaseline = box.layout === "baseline";
	const resolvedSpacing = box.spacing
		? (SPACING[box.spacing] ?? undefined)
		: undefined;

	const style: React.CSSProperties = {
		display: "flex",
		flexDirection: isVertical ? "column" : "row",
		alignItems: isBaseline
			? "baseline"
			: (box.alignItems ?? (isVertical ? "stretch" : "center")),
		justifyContent: box.justifyContent,
		padding: box.paddingAll ? SPACING[box.paddingAll] : undefined,
		paddingTop: box.paddingTop ? SPACING[box.paddingTop] : undefined,
		paddingBottom: box.paddingBottom ? SPACING[box.paddingBottom] : undefined,
		paddingLeft: box.paddingStart ? SPACING[box.paddingStart] : undefined,
		paddingRight: box.paddingEnd ? SPACING[box.paddingEnd] : undefined,
		backgroundColor: box.backgroundColor,
		borderRadius: box.cornerRadius,
		borderColor: box.borderColor,
		borderWidth: box.borderWidth,
		borderStyle: box.borderWidth ? "solid" : undefined,
	};

	return (
		<div style={style}>
			{box.contents.map((child, i) => {
				const childPath: FlexNodePath = {
					section: path.section,
					indices: [...path.indices, i],
				};
				const childMargin =
					"margin" in child && child.margin
						? SPACING[child.margin as string]
						: undefined;
				const gapValue = i > 0 ? (childMargin ?? resolvedSpacing) : undefined;
				const marginProp = isVertical ? "marginTop" : "marginLeft";
				const childFlex =
					"flex" in child && child.flex !== undefined
						? (child.flex as number)
						: undefined;
				let flexValue: string | undefined;
				if (childFlex !== undefined) {
					flexValue = `${childFlex} 0 ${childFlex === 0 ? "auto" : "0%"}`;
				} else if (!isVertical) {
					flexValue = "1 0 0%";
				}

				return (
					<div
						key={`${child.type}-${i}`}
						style={{
							display: "flex",
							flexDirection: isVertical ? "column" : "row",
							...(gapValue ? { [marginProp]: gapValue } : {}),
							...(flexValue ? { flex: flexValue } : {}),
							...(!isVertical ? { minWidth: 0 } : {}),
						}}
					>
						{interactive && i > 0 && (
							<InsertSlot
								doc={doc}
								parentPath={path}
								insertAt={i}
								direction={isVertical ? "vertical" : "horizontal"}
							/>
						)}
						<InteractiveNode
							node={child}
							path={childPath}
							doc={doc}
							interactive={interactive}
						/>
					</div>
				);
			})}
			{interactive && (
				<InsertSlot
					doc={doc}
					parentPath={path}
					insertAt={box.contents.length}
					direction={isVertical ? "vertical" : "horizontal"}
				/>
			)}
		</div>
	);
}

function InteractiveNode({
	node,
	path,
	doc,
	interactive,
}: {
	node: FlexComponentType;
	path: FlexNodePath;
	doc: FlexDoc;
	interactive: boolean;
}) {
	let inner: React.ReactNode;
	if (node.type === "box") {
		inner = (
			<InteractiveBox
				box={node}
				path={path}
				doc={doc}
				interactive={interactive}
			/>
		);
	} else if (node.type === "text" && interactive) {
		inner = <EditableText node={node} path={path} doc={doc} />;
	} else {
		inner = <FlexComponentRenderer component={node} />;
	}
	return (
		<NodeWrap path={path} node={node} doc={doc} interactive={interactive}>
			{inner}
		</NodeWrap>
	);
}

/**
 * セクション（header/body/footer/hero）。存在しないセクションはプレースホルダを表示。
 */
function SectionView({
	section,
	bubble,
	doc,
	interactive,
	onAddSection,
}: {
	section: FlexSection;
	bubble: FlexBubble;
	doc: FlexDoc;
	interactive: boolean;
	onAddSection?: (section: FlexSection) => void;
}) {
	const node = bubble[section];
	const path: FlexNodePath = { section, indices: [] };

	if (!node) {
		return (
			<div
				style={{
					border: `1px dashed ${w.border}`,
					borderRadius: 8,
					margin: 4,
					padding: "6px 10px",
					display: "flex",
					alignItems: "center",
					gap: 6,
					color: w.subText,
					fontSize: 11,
				}}
			>
				<span>{sectionLabel[section]}</span>
				{interactive && onAddSection && (
					<button
						type="button"
						style={{
							border: "none",
							background: "transparent",
							color: w.green,
							fontWeight: 700,
							cursor: "pointer",
							fontSize: 11,
							padding: 0,
						}}
						onClick={() => onAddSection(section)}
					>
						＋ 追加
					</button>
				)}
			</div>
		);
	}

	return (
		<InteractiveNode
			node={node}
			path={path}
			doc={doc}
			interactive={interactive}
		/>
	);
}

export const sectionLabel: Record<FlexSection, string> = {
	header: "ヘッダー",
	hero: "メイン画像",
	body: "本文",
	footer: "フッター",
};

const SECTION_ORDER: FlexSection[] = ["header", "hero", "body", "footer"];

const SECTION_PADDING: Record<FlexSection, string> = {
	header: "16px 16px 0",
	hero: "0",
	body: "16px",
	footer: "8px 16px 16px",
};

export interface InteractiveTreeProps {
	doc: FlexDoc;
	interactive?: boolean;
	/** 幅。数値(px)または CSS 文字列。既定 "100%"（コンテナに追従し、bubble の実幅で最大） */
	width?: number | string;
	/** セクション追加のハンドラ（未指定ならプレースホルダの＋を表示しない） */
	onAddSection?: (section: FlexSection) => void;
	/** ドラッグ中のドロップ先 box（その box を緑枠で強調する） */
	activeDropPath?: FlexNodePath | null;
}

export function InteractiveTree({
	doc,
	interactive = true,
	width = "100%",
	onAddSection,
	activeDropPath = null,
}: InteractiveTreeProps) {
	const bubble = doc.bubble;
	const bodyBg = bubble.styles?.body?.backgroundColor;
	const headerBg = bubble.styles?.header?.backgroundColor;
	const footerBg = bubble.styles?.footer?.backgroundColor;

	return (
		<DropTargetContext.Provider value={activeDropPath}>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: キャンバス背景クリックで選択解除（標準的なキャンバス操作） */}
			<div
				onClick={() => doc.select(null)}
				onKeyDown={(e) => {
					if (e.key === "Escape") doc.select(null);
				}}
				role="presentation"
				style={{
					width,
					// bubble の LINE 実機幅で最大（見た目はそのままに狭いコンテナへ収める）
					maxWidth: BUBBLE_WIDTH[doc.bubble.size ?? "mega"] ?? undefined,
					boxSizing: "border-box",
					borderRadius: 16,
					overflow: "hidden",
					backgroundColor: "#ffffff",
					boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
					fontFamily:
						'-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif',
				}}
			>
				{SECTION_ORDER.map((section) => {
					const node = bubble[section];
					if (!node) {
						return interactive ? (
							<SectionView
								key={section}
								section={section}
								bubble={bubble}
								doc={doc}
								interactive={interactive}
								onAddSection={onAddSection}
							/>
						) : null;
					}
					return (
						<div
							key={section}
							style={{
								backgroundColor:
									section === "header"
										? headerBg
										: section === "body"
											? bodyBg
											: section === "footer"
												? footerBg
												: undefined,
							}}
						>
							<div style={{ padding: SECTION_PADDING[section] }}>
								<SectionView
									section={section}
									bubble={bubble}
									doc={doc}
									interactive={interactive}
									onAddSection={onAddSection}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</DropTargetContext.Provider>
	);
}
