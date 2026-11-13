import type React from "react";
import { useState } from "react";
import { NodeInspector } from "../../editor/inspectors";
import { JsonPanel } from "../../editor/JsonPanel";
import { ensureSection } from "../../editor/path";
import { defaultTemplates } from "../../editor/templates";
import type { FlexSection } from "../../editor/types";
import { validateFlex } from "../../editor/validate";
import type { FlexBubble, FlexContainer } from "../../types";
import { InteractiveTree } from "./core/InteractiveTree";
import { ModernChatFrame } from "./core/ModernChatFrame";
import { chipStyle, font, iconBtn, w } from "./core/theme";
import { flexSizeKb, useFlexDoc } from "./core/useFlexDoc";

/**
 * 案 A: ダイレクト操作キャンバス（Canva / Figma アプローチ）
 *
 * - 中央に実機サイズのトーク画面。クリックで選択、ダブルクリックでテキスト編集
 * - 選択するとフローティングツールバー（複製・削除・上下移動）
 * - 右パネルはコンテキストに応じて切替（インスペクタ ⇄ JSON）
 * - 顶部に Undo/Redo / テンプレート / サイズゲージ
 */

export function ConceptCanvas({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [rightTab, setRightTab] = useState<"inspect" | "json">("inspect");
	const [templateOpen, setTemplateOpen] = useState(false);
	const sizeKb = flexSizeKb(doc.bubble);
	const issues = validateFlex(doc.bubble);

	const onAddSection = (section: FlexSection) => {
		doc.replace(ensureSection(doc.bubble, section));
	};

	return (
		<div
			style={{
				fontFamily: font,
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				backgroundColor: w.canvasBg,
				color: w.text,
			}}
		>
			{/* 顶部ツールバー */}
			<header
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					padding: "8px 14px",
					backgroundColor: w.white,
					borderBottom: `1px solid ${w.border}`,
				}}
			>
				<strong style={{ fontSize: 14 }}>Flex Designer</strong>
				<span style={{ fontSize: 11, color: w.subText }}>
					案A · キャンバス型
				</span>
				<div style={{ flex: 1 }} />
				<button
					type="button"
					style={iconBtn}
					disabled={!doc.canUndo}
					onClick={doc.undo}
					title="元に戻す (Ctrl+Z)"
					aria-label="元に戻す"
				>
					↩
				</button>
				<button
					type="button"
					style={iconBtn}
					disabled={!doc.canRedo}
					onClick={doc.redo}
					title="やり直す (Ctrl+Shift+Z)"
					aria-label="やり直す"
				>
					↪
				</button>
				<span style={{ ...chipStyle, marginLeft: 8 }}>
					{sizeKb.toFixed(1)} / 30 KB
				</span>
				<span
					style={{
						...chipStyle,
						...(issues.some((i) => i.severity === "error")
							? { color: w.danger, borderColor: w.danger }
							: {}),
					}}
					title={issues.map((i) => i.message).join("\n")}
				>
					{issues.length === 0 ? "✓ エラーなし" : `⚠ ${issues.length} 件の指摘`}
				</span>
				<button
					type="button"
					style={iconBtn}
					onClick={() => setTemplateOpen((v) => !v)}
					title="テンプレート"
				>
					▤ テンプレ
				</button>
			</header>

			{templateOpen && (
				<div
					style={{
						backgroundColor: w.white,
						borderBottom: `1px solid ${w.border}`,
						padding: 10,
						display: "flex",
						gap: 8,
						flexWrap: "wrap",
					}}
				>
					{defaultTemplates.map((t) => (
						<button
							key={t.id}
							type="button"
							style={{
								...chipStyle,
								cursor: "pointer",
							}}
							onClick={() => {
								doc.replace(t.bubble);
								setTemplateOpen(false);
							}}
							title={t.description}
						>
							{t.name}
						</button>
					))}
				</div>
			)}

			{/* メイン: キャンバス + 右パネル */}
			<div style={{ flex: 1, display: "flex", minHeight: 0 }}>
				<div
					style={{
						flex: 1,
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "center",
						padding: 24,
						overflow: "auto",
					}}
				>
					<div style={{ position: "relative" }}>
						<ModernChatFrame width={340}>
							<InteractiveTree
								doc={doc}
								width={272}
								onAddSection={onAddSection}
							/>
						</ModernChatFrame>
						<SelectionToolbar doc={doc} />
					</div>
				</div>

				{/* 右パネル */}
				<aside
					style={{
						width: 300,
						flexShrink: 0,
						backgroundColor: w.white,
						borderLeft: `1px solid ${w.border}`,
						display: "flex",
						flexDirection: "column",
					}}
				>
					<div
						role="tablist"
						style={{ display: "flex", borderBottom: `1px solid ${w.border}` }}
					>
						{(["inspect", "json"] as const).map((t) => (
							<button
								key={t}
								type="button"
								role="tab"
								aria-selected={rightTab === t}
								onClick={() => setRightTab(t)}
								style={{
									flex: 1,
									padding: "10px 0",
									fontSize: 12,
									fontWeight: 600,
									border: "none",
									background: "transparent",
									cursor: "pointer",
									color: rightTab === t ? w.green : w.subText,
									borderBottom:
										rightTab === t
											? `2px solid ${w.green}`
											: "2px solid transparent",
								}}
							>
								{t === "inspect" ? "プロパティ" : "JSON"}
							</button>
						))}
					</div>
					<div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
						{doc.lastError && (
							<p
								role="alert"
								style={{ color: w.danger, fontSize: 12, margin: "0 0 8px" }}
							>
								{doc.lastError}
							</p>
						)}
						{rightTab === "inspect" ? (
							doc.selectedNode ? (
								<NodeInspector
									node={doc.selectedNode}
									onPatch={(p) => doc.selected && doc.patch(doc.selected, p)}
								/>
							) : (
								<EmptyHint />
							)
						) : (
							<JsonPanel
								container={doc.bubble as FlexContainer}
								onImport={(c) => c.type === "bubble" && doc.replace(c)}
								issues={issues}
							/>
						)}
					</div>
				</aside>
			</div>
		</div>
	);
}

function EmptyHint() {
	return (
		<div
			style={{
				color: w.subText,
				fontSize: 12,
				textAlign: "center",
				padding: "40px 12px",
				lineHeight: 1.8,
			}}
		>
			<div style={{ fontSize: 28, marginBottom: 8 }}>👆</div>
			キャンバス上の部品をクリックすると
			<br />
			プロパティがここに表示されます
		</div>
	);
}

function SelectionToolbar({ doc }: { doc: ReturnType<typeof useFlexDoc> }) {
	if (!doc.selected || doc.selected.indices.length === 0) return null;
	return (
		<div
			style={{
				position: "absolute",
				top: 56,
				right: -12,
				transform: "translateX(100%)",
				display: "flex",
				flexDirection: "column",
				gap: 4,
				backgroundColor: w.white,
				border: `1px solid ${w.border}`,
				borderRadius: 8,
				padding: 4,
				boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
			}}
		>
			<ToolbarBtn
				label="上へ (↑)"
				onClick={() => doc.selected && doc.move(doc.selected, -1)}
			>
				↑
			</ToolbarBtn>
			<ToolbarBtn
				label="下へ (↓)"
				onClick={() => doc.selected && doc.move(doc.selected, 1)}
			>
				↓
			</ToolbarBtn>
			<ToolbarBtn
				label="複製"
				onClick={() => doc.selected && doc.duplicate(doc.selected)}
			>
				⧉
			</ToolbarBtn>
			<ToolbarBtn
				label="削除"
				danger
				onClick={() => doc.selected && doc.remove(doc.selected)}
			>
				🗑
			</ToolbarBtn>
		</div>
	);
}

function ToolbarBtn({
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
			title={label}
			aria-label={label}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			style={{
				...iconBtn,
				border: "none",
				boxShadow: "none",
				width: 32,
				height: 32,
				fontSize: 14,
				...(danger ? { color: w.danger } : {}),
			}}
		>
			{children}
		</button>
	);
}
