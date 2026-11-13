import { useState } from "react";
import { NodeInspector } from "../../editor/inspectors";
import { ensureSection, nodeLabel } from "../../editor/path";
import { defaultTemplates } from "../../editor/templates";
import type { FlexSection, InsertableKind } from "../../editor/types";
import type { FlexBubble } from "../../types";
import { InteractiveTree } from "./core/InteractiveTree";
import { ModernChatFrame } from "./core/ModernChatFrame";
import { chipStyle, font, kindIcon, w } from "./core/theme";
import { flexSizeKb, useFlexDoc } from "./core/useFlexDoc";

/**
 * 案 D: ステップ ウィザード型（初心者向けガイド アプローチ）
 *
 * - Step 1: テンプレートを選ぶ（カード選択）
 * - Step 2: 各ブロックに部品を足す（大きく押しやすいボタン。JSON を意識させない）
 * - Step 3: 微調整（プレビュー選択 + インスペクタ）して完成 → JSON コピー
 *
 * 「LINE のお知らせを初めて作る人」向け。上級者には案 A〜C。
 */

const STEPS = ["テンプレート", "部品を足す", "仕上げる"] as const;

const QUICK_KINDS: Array<{
	kind: InsertableKind;
	label: string;
	hint: string;
}> = [
	{ kind: "text", label: "テキスト", hint: "見出しや本文を追加" },
	{ kind: "image", label: "画像", hint: "メインの画像を追加" },
	{ kind: "button", label: "ボタン", hint: "リンクボタンを追加" },
	{ kind: "box", label: "まとまり", hint: "横並びなどのグループ" },
	{ kind: "separator", label: "区切り線", hint: "内容を分ける線" },
];

const SECTION_INFO: Record<FlexSection, { label: string; desc: string }> = {
	header: { label: "ヘッダー", desc: "一番上のタイトル部分" },
	hero: { label: "メイン画像", desc: "目を引く大きい画像" },
	body: { label: "本文", desc: "お知らせの本体" },
	footer: { label: "フッター", desc: "ボタンや補足を置く所" },
};

export function ConceptWizard({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [step, setStep] = useState(0);
	const [section, setSection] = useState<FlexSection>("body");
	const [copied, setCopied] = useState(false);

	const sections: FlexSection[] = ["header", "hero", "body", "footer"];
	const sizeKb = flexSizeKb(doc.bubble);

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
			{/* ステップインジケータ */}
			<header
				style={{
					padding: "14px 20px",
					borderBottom: `1px solid ${w.border}`,
					display: "flex",
					alignItems: "center",
					gap: 14,
				}}
			>
				<strong>お知らせを作る</strong>
				<div style={{ flex: 1, display: "flex", gap: 6, maxWidth: 420 }}>
					{STEPS.map((label, i) => (
						<div
							key={label}
							style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 6,
									padding: "4px 10px",
									borderRadius: 999,
									fontSize: 12,
									fontWeight: 600,
									backgroundColor:
										i === step ? w.green : i < step ? w.greenSoft : w.panelBg,
									color: i === step ? w.white : i < step ? w.green : w.subText,
								}}
							>
								{i < step ? "✓" : i + 1}. {label}
							</div>
							{i < STEPS.length - 1 && (
								<div
									style={{
										flex: 1,
										height: 2,
										backgroundColor: i < step ? w.green : w.border,
									}}
								/>
							)}
						</div>
					))}
				</div>
				<span style={chipStyle}>{sizeKb.toFixed(1)} / 30 KB</span>
			</header>

			<div style={{ flex: 1, display: "flex", minHeight: 0 }}>
				{/* 左: 常時プレビュー */}
				<div
					style={{
						width: 380,
						flexShrink: 0,
						backgroundColor: w.canvasBg,
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "center",
						padding: 20,
						overflowY: "auto",
					}}
				>
					<ModernChatFrame width={330} height={520}>
						<InteractiveTree
							doc={doc}
							width={262}
							interactive={step === 2}
							onAddSection={(s) => doc.replace(ensureSection(doc.bubble, s))}
						/>
					</ModernChatFrame>
				</div>

				{/* 右: ステップ本体 */}
				<div style={{ flex: 1, padding: "20px 28px", overflowY: "auto" }}>
					{step === 0 && (
						<div>
							<h2 style={{ fontSize: 18, marginTop: 0 }}>
								どれか選んで始めましょう
							</h2>
							<p style={{ fontSize: 13, color: w.subText }}>
								選んだ見本をベースに、あとで自由に変更できます
							</p>
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
									gap: 12,
									marginTop: 16,
								}}
							>
								{defaultTemplates.slice(0, 8).map((t) => (
									<button
										key={t.id}
										type="button"
										onClick={() => doc.replace(t.bubble)}
										style={{
											textAlign: "left",
											border: `1px solid ${w.border}`,
											borderRadius: 12,
											backgroundColor: w.white,
											padding: 12,
											cursor: "pointer",
											fontFamily: font,
										}}
									>
										<div style={{ fontWeight: 700, fontSize: 13 }}>
											{t.name}
										</div>
										<div
											style={{ fontSize: 11, color: w.subText, marginTop: 4 }}
										>
											{t.description}
										</div>
									</button>
								))}
							</div>
						</div>
					)}

					{step === 1 && (
						<div>
							<h2 style={{ fontSize: 18, marginTop: 0 }}>部品を足しましょう</h2>
							<p style={{ fontSize: 13, color: w.subText }}>
								足したい場所（ブロック）を選んでから、部品ボタンを押します
							</p>
							<div style={{ display: "flex", gap: 8, margin: "14px 0" }}>
								{sections.map((s) => {
									const has = Boolean(doc.bubble[s]);
									return (
										<button
											key={s}
											type="button"
											onClick={() => setSection(s)}
											style={{
												...chipStyle,
												cursor: "pointer",
												fontSize: 12,
												padding: "6px 12px",
												...(section === s
													? {
															color: w.white,
															backgroundColor: w.green,
															borderColor: w.green,
														}
													: {}),
											}}
										>
											{SECTION_INFO[s].label} {has ? "✓" : "－"}
										</button>
									);
								})}
							</div>
							<p style={{ fontSize: 12, color: w.subText }}>
								{SECTION_INFO[section].desc}
							</p>
							{!doc.bubble[section] && (
								<button
									type="button"
									onClick={() =>
										doc.replace(ensureSection(doc.bubble, section))
									}
									style={{
										border: `1.5px dashed ${w.green}`,
										backgroundColor: w.greenSoft,
										color: w.green,
										borderRadius: 10,
										padding: "12px 18px",
										fontSize: 13,
										fontWeight: 700,
										cursor: "pointer",
										marginTop: 8,
									}}
								>
									＋ {SECTION_INFO[section].label}を作る
								</button>
							)}
							{doc.bubble[section] && (
								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										gap: 10,
										marginTop: 14,
									}}
								>
									{QUICK_KINDS.map((item) => (
										<button
											key={item.kind}
											type="button"
											onClick={() =>
												doc.insert({ section, indices: [] }, item.kind)
											}
											style={{
												display: "flex",
												flexDirection: "column",
												alignItems: "flex-start",
												gap: 2,
												border: `1px solid ${w.border}`,
												borderRadius: 12,
												backgroundColor: w.white,
												padding: "12px 16px",
												cursor: "pointer",
												fontFamily: font,
												minWidth: 120,
											}}
										>
											<span style={{ fontSize: 18 }}>
												{kindIcon[item.kind]}
											</span>
											<span style={{ fontSize: 13, fontWeight: 700 }}>
												{item.label}
											</span>
											<span style={{ fontSize: 10, color: w.subText }}>
												{item.hint}
											</span>
										</button>
									))}
								</div>
							)}
							<div style={{ marginTop: 16, fontSize: 12, color: w.subText }}>
								💡 追加した部品は左のプレビューにすぐ反映されます
							</div>
						</div>
					)}

					{step === 2 && (
						<div>
							<h2 style={{ fontSize: 18, marginTop: 0 }}>仕上げましょう</h2>
							<p style={{ fontSize: 13, color: w.subText }}>
								左のプレビューの部品をクリックして、細かい設定を変更できます
							</p>
							{doc.selectedNode && doc.selected ? (
								<div style={{ marginTop: 12, maxWidth: 420 }}>
									<div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
										<span style={chipStyle}>{nodeLabel(doc.selectedNode)}</span>
										<button
											type="button"
											style={{
												...chipStyle,
												cursor: "pointer",
												color: w.danger,
												borderColor: w.danger,
											}}
											onClick={() => doc.selected && doc.remove(doc.selected)}
										>
											削除
										</button>
									</div>
									<NodeInspector
										node={doc.selectedNode}
										onPatch={(p) => doc.selected && doc.patch(doc.selected, p)}
									/>
								</div>
							) : (
								<div
									style={{
										marginTop: 16,
										border: `1.5px dashed ${w.border}`,
										borderRadius: 12,
										padding: "28px 20px",
										textAlign: "center",
										color: w.subText,
										fontSize: 13,
									}}
								>
									👇 左のプレビューの部品をクリック
								</div>
							)}
							<div style={{ marginTop: 24, display: "flex", gap: 10 }}>
								<button
									type="button"
									onClick={() => {
										navigator.clipboard
											?.writeText(JSON.stringify(doc.bubble, null, 2))
											.then(() => setCopied(true))
											.catch(() => setCopied(false));
									}}
									style={{
										backgroundColor: w.green,
										color: w.white,
										border: "none",
										borderRadius: 10,
										padding: "12px 22px",
										fontSize: 14,
										fontWeight: 700,
										cursor: "pointer",
										fontFamily: font,
									}}
								>
									{copied ? "✓ コピーしました" : "JSON をコピーして完成"}
								</button>
								<button
									type="button"
									onClick={doc.undo}
									disabled={!doc.canUndo}
									style={{
										backgroundColor: w.white,
										color: w.text,
										border: `1px solid ${w.border}`,
										borderRadius: 10,
										padding: "12px 18px",
										fontSize: 13,
										cursor: "pointer",
										fontFamily: font,
									}}
								>
									↩ 一つ戻る
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* フッタナビ */}
			<footer
				style={{
					borderTop: `1px solid ${w.border}`,
					padding: "10px 20px",
					display: "flex",
					justifyContent: "space-between",
				}}
			>
				<button
					type="button"
					onClick={() => setStep((s) => Math.max(0, s - 1))}
					disabled={step === 0}
					style={{
						border: `1px solid ${w.border}`,
						backgroundColor: w.white,
						borderRadius: 8,
						padding: "8px 18px",
						fontSize: 13,
						cursor: step === 0 ? "default" : "pointer",
						opacity: step === 0 ? 0.4 : 1,
						fontFamily: font,
					}}
				>
					← 戻る
				</button>
				<button
					type="button"
					onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
					disabled={step === STEPS.length - 1}
					style={{
						backgroundColor: w.green,
						color: w.white,
						border: "none",
						borderRadius: 8,
						padding: "8px 18px",
						fontSize: 13,
						fontWeight: 700,
						cursor: step === STEPS.length - 1 ? "default" : "pointer",
						opacity: step === STEPS.length - 1 ? 0.4 : 1,
						fontFamily: font,
					}}
				>
					次へ →
				</button>
			</footer>
		</div>
	);
}
