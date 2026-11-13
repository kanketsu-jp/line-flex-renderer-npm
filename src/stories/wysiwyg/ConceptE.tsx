import type React from "react";
import { useState } from "react";
import { NodeInspector } from "../../editor/inspectors";
import { JsonPanel } from "../../editor/JsonPanel";
import {
	ensureSection,
	isSamePath,
	listNodes,
	nodeLabel,
} from "../../editor/path";
import { defaultTemplates } from "../../editor/templates";
import { validateFlex } from "../../editor/validate";
import type { FlexBubble, FlexContainer } from "../../types";
import { InteractiveTree } from "./core/InteractiveTree";
import { chipStyle, font, iconBtn, w } from "./core/theme";
import { flexSizeKb, useFlexDoc } from "./core/useFlexDoc";

/**
 * 案 E: 現行 FlexEditor の漸進進化型（学習コスト最小アプローチ）
 *
 * - 現行の 2 ペイン（左プレビュー / 右パネル）構造はそのまま維持
 * - プレビューが選択可能（クリック＝選択、ダブルクリック＝テキスト編集）
 * - Outline とプレビューの選択が双方向でハイライト連動
 * - 挿入スロット（＋）がプレビュー上に直接現れる
 * - 既存ユーザーは「そのまま使える。でも速くなった」体験
 */

export function ConceptHybrid({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [accordion, setAccordion] = useState<{
		template: boolean;
		outline: boolean;
		inspect: boolean;
		json: boolean;
	}>({ template: false, outline: true, inspect: true, json: false });

	const entries = listNodes(doc.bubble);
	const issues = validateFlex(doc.bubble);
	const sizeKb = flexSizeKb(doc.bubble as FlexContainer);

	return (
		<div
			style={{
				fontFamily: font,
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				backgroundColor: w.canvasBg,
				color: w.text,
			}}
		>
			{/* 旧来と同じ構成のヘッダー（+ undo/redo とサイズ） */}
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
				<strong style={{ fontSize: 14 }}>Flex エディタ</strong>
				<span style={{ fontSize: 11, color: w.subText }}>案E · 漸進進化型</span>
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
				<span style={chipStyle}>{sizeKb.toFixed(1)} / 30 KB</span>
			</header>

			<div style={{ flex: 1, display: "flex", minHeight: 0 }}>
				{/* 左: そのままプレビュー（今は選択できる） */}
				<div
					style={{
						width: 360,
						flexShrink: 0,
						padding: 16,
						overflowY: "auto",
						display: "flex",
						flexDirection: "column",
						gap: 10,
					}}
				>
					<InteractiveTree
						doc={doc}
						width={300}
						onAddSection={(s) => doc.replace(ensureSection(doc.bubble, s))}
					/>
					<div style={{ fontSize: 11, color: w.subText }}>
						💡 部品をクリックで選択 / テキストはダブルクリックで編集 /
						隙間の「＋」で挿入
					</div>
				</div>

				{/* 右: 旧来のアコーディオン群（構造は踏襲） */}
				<div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
					{doc.lastError && (
						<p
							role="alert"
							style={{ color: w.danger, fontSize: 12, margin: 0 }}
						>
							{doc.lastError}
						</p>
					)}
					<Accordion
						title="テンプレートから始める"
						open={accordion.template}
						onToggle={() =>
							setAccordion((a) => ({ ...a, template: !a.template }))
						}
					>
						<div
							style={{
								display: "flex",
								flexWrap: "wrap",
								gap: 6,
								marginTop: 8,
							}}
						>
							{defaultTemplates.map((t) => (
								<button
									key={t.id}
									type="button"
									onClick={() => doc.replace(t.bubble)}
									title={t.description}
									style={{ ...chipStyle, cursor: "pointer" }}
								>
									{t.name}
								</button>
							))}
						</div>
					</Accordion>

					<Accordion
						title="組み立て"
						open={accordion.outline}
						onToggle={() =>
							setAccordion((a) => ({ ...a, outline: !a.outline }))
						}
					>
						{/* 双方向ハイライト付きアウトライン */}
						<div style={{ marginTop: 6 }}>
							{entries.map((entry) => {
								const selected = isSamePath(doc.selected, entry.path);
								return (
									// biome-ignore lint/a11y/useSemanticElements: 行全体を1つの選択ボタン、内部に個別アクションボタンを含むため div+role
									<div
										role="button"
										tabIndex={0}
										key={`${entry.path.section}-${entry.path.indices.join("-")}`}
										onClick={() => doc.select(entry.path)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ")
												doc.select(entry.path);
										}}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 4,
											width: "100%",
											marginLeft: entry.depth * 12,
											padding: "4px 8px",
											fontSize: 12,
											textAlign: "left",
											backgroundColor: selected ? w.greenSoft : "transparent",
											border: selected
												? `1px solid ${w.green}`
												: `1px solid transparent`,
											borderRadius: 6,
											cursor: "pointer",
											color: w.text,
											fontFamily: font,
										}}
									>
										{entry.label}
										<div style={{ flex: 1 }} />
										{entry.path.indices.length > 0 && (
											<>
												<button
													type="button"
													aria-label="上へ"
													style={{ color: w.subText, padding: "0 3px" }}
													onClick={(e) => {
														e.stopPropagation();
														doc.move(entry.path, -1);
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.stopPropagation();
															doc.move(entry.path, -1);
														}
													}}
												>
													↑
												</button>
												<button
													type="button"
													aria-label="下へ"
													style={{ color: w.subText, padding: "0 3px" }}
													onClick={(e) => {
														e.stopPropagation();
														doc.move(entry.path, 1);
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.stopPropagation();
															doc.move(entry.path, 1);
														}
													}}
												>
													↓
												</button>
												<button
													type="button"
													aria-label="複製"
													style={{ color: w.subText, padding: "0 3px" }}
													onClick={(e) => {
														e.stopPropagation();
														doc.duplicate(entry.path);
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.stopPropagation();
															doc.duplicate(entry.path);
														}
													}}
												>
													⧉
												</button>
												<button
													type="button"
													aria-label="削除"
													style={{ color: w.danger, padding: "0 3px" }}
													onClick={(e) => {
														e.stopPropagation();
														doc.remove(entry.path);
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.stopPropagation();
															doc.remove(entry.path);
														}
													}}
												>
													✕
												</button>
											</>
										)}
									</div>
								);
							})}
						</div>
					</Accordion>

					<Accordion
						title="選んだ部品の設定"
						open={accordion.inspect}
						onToggle={() =>
							setAccordion((a) => ({ ...a, inspect: !a.inspect }))
						}
					>
						<div style={{ marginTop: 8 }}>
							{doc.selectedNode && doc.selected ? (
								<>
									<div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
										<span style={chipStyle}>{nodeLabel(doc.selectedNode)}</span>
									</div>
									<NodeInspector
										node={doc.selectedNode}
										onPatch={(p) => doc.selected && doc.patch(doc.selected, p)}
									/>
								</>
							) : (
								<p style={{ fontSize: 12, color: w.subText }}>
									左のプレビューか上の一覧から部品を選ぶと設定が表示されます
								</p>
							)}
						</div>
					</Accordion>

					<Accordion
						title="JSON"
						open={accordion.json}
						onToggle={() => setAccordion((a) => ({ ...a, json: !a.json }))}
					>
						<div style={{ marginTop: 8 }}>
							<JsonPanel
								container={doc.bubble}
								onImport={(c) => c.type === "bubble" && doc.replace(c)}
								issues={issues}
							/>
						</div>
					</Accordion>
				</div>
			</div>
		</div>
	);
}

function Accordion({
	title,
	open,
	onToggle,
	children,
}: {
	title: string;
	open: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}) {
	return (
		<div
			style={{
				backgroundColor: w.white,
				border: `1px solid ${w.border}`,
				borderRadius: 10,
				marginBottom: 10,
			}}
		>
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={open}
				style={{
					width: "100%",
					textAlign: "left",
					padding: "10px 12px",
					fontSize: 13,
					fontWeight: 700,
					background: "transparent",
					border: "none",
					cursor: "pointer",
					color: w.text,
					fontFamily: font,
				}}
			>
				{open ? "▾" : "▸"} {title}
			</button>
			{open && <div style={{ padding: "0 12px 12px" }}>{children}</div>}
		</div>
	);
}
