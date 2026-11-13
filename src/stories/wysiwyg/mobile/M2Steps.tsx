import { useState } from "react";
import { getNode, nodeLabel } from "../../../editor/path";
import { defaultTemplates } from "../../../editor/templates";
import type { InsertableKind } from "../../../editor/types";
import type { FlexBubble } from "../../../types";
import { font, kindIcon, w } from "../core/theme";
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
 * 案 M2: カード ステッパー型（ウィザードのモバイル直移植）
 *
 * - 1 画面 1 ステップ。下の「戻る / 次へ」で進む
 * - Step1: テンプレート選択（「空で始める」先頭 + タブ: 基本的な/最近使った）
 * - Step2: 部品追加（パレットをタップ → 追加先をプレビュー上でタップ）
 * - Step3: 仕上げ（部品タップ → シートでプロパティ、JSON コピー）
 * - 進捗は上部のドットで示す
 */

const STEPS = ["テンプレート", "部品を足す", "仕上げる"] as const;

export function MobileSteps({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [step, setStep] = useState(0);
	const [tab, setTab] = useState<"recent" | "basic">("basic");
	const [pickKind, setPickKind] = useState<InsertableKind | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const selectedNode = doc.selected
		? getNode(doc.bubble, doc.selected)
		: undefined;

	return (
		<MobileShell title={`ステップ ${step + 1}/3 — ${STEPS[step]}`} doc={doc}>
			{/* 進捗ドット */}
			<div
				role="progressbar"
				aria-label={`ステップ ${step + 1} / 3`}
				aria-valuenow={step + 1}
				aria-valuemin={1}
				aria-valuemax={3}
				style={{
					display: "flex",
					gap: 6,
					justifyContent: "center",
					padding: "8px 0 2px",
					flexShrink: 0,
				}}
			>
				{STEPS.map((label, i) => (
					<span
						key={label}
						aria-hidden
						style={{
							width: i === step ? 22 : 8,
							height: 8,
							borderRadius: 999,
							backgroundColor: i === step ? w.green : w.border,
							transition: "width .2s",
						}}
					/>
				))}
			</div>

			<div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
				{step === 0 && (
					<TemplateStep
						tab={tab}
						setTab={setTab}
						onPick={(b) => {
							doc.replace(b);
							setStep(1);
						}}
					/>
				)}
				{step === 1 && (
					<div style={{ padding: "10px 12px 24px" }}>
						<p style={{ fontSize: 12, color: w.subText, marginTop: 0 }}>
							① 下のパレットから部品を選び → ② 追加したい場所をタップ
						</p>
						{pickKind && (
							<div
								role="status"
								style={{
									backgroundColor: w.greenSoft,
									border: `1px solid ${w.green}`,
									color: w.green,
									borderRadius: 8,
									fontSize: 12,
									fontWeight: 700,
									padding: "8px 10px",
									marginBottom: 10,
								}}
							>
								{kindIcon[pickKind]}{" "}
								追加する場所（本文など）をタップしてください
							</div>
						)}
						<div style={{ display: "flex", justifyContent: "center" }}>
							<MobilePreview doc={doc} width={290} />
						</div>
					</div>
				)}
				{step === 2 && (
					<div style={{ padding: "10px 12px 90px" }}>
						<p style={{ fontSize: 12, color: w.subText, marginTop: 0 }}>
							部品をタップして選び、⚙ 的なフローで調整 →「JSON をコピー」で完成
						</p>
						<div style={{ display: "flex", justifyContent: "center" }}>
							<MobilePreview doc={doc} width={290} />
						</div>
					</div>
				)}
			</div>

			{/* Step2: パレット */}
			{step === 1 && (
				<div
					style={{
						flexShrink: 0,
						backgroundColor: w.white,
						borderTop: `1px solid ${w.border}`,
					}}
				>
					<PaletteBar onPick={setPickKind} activeKind={pickKind} />
				</div>
			)}

			{/* Step3: 完了ボタン */}
			{step === 2 && (
				<div
					style={{
						flexShrink: 0,
						padding: 12,
						backgroundColor: w.white,
						borderTop: `1px solid ${w.border}`,
					}}
				>
					<button
						type="button"
						onClick={() => {
							navigator.clipboard
								?.writeText(JSON.stringify(doc.bubble, null, 2))
								.catch(() => undefined);
						}}
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
						JSON をコピーして完成
					</button>
				</div>
			)}

			{/* 下部ナビ */}
			<nav
				style={{
					flexShrink: 0,
					display: "flex",
					gap: 8,
					padding: "8px 12px calc(10px + env(safe-area-inset-bottom))",
					backgroundColor: w.white,
					borderTop: `1px solid ${w.border}`,
				}}
			>
				<button
					type="button"
					onClick={() => setStep((s) => Math.max(0, s - 1))}
					disabled={step === 0}
					style={{
						flex: 1,
						minHeight: 48,
						border: `1px solid ${w.border}`,
						backgroundColor: w.white,
						borderRadius: 10,
						fontSize: 14,
						cursor: step === 0 ? "default" : "pointer",
						opacity: step === 0 ? 0.4 : 1,
						fontFamily: font,
					}}
				>
					← 戻る
				</button>
				<button
					type="button"
					onClick={() => setStep((s) => Math.min(2, s + 1))}
					disabled={step === 2}
					style={{
						flex: 1,
						minHeight: 48,
						backgroundColor: w.green,
						color: w.white,
						border: "none",
						borderRadius: 10,
						fontSize: 14,
						fontWeight: 700,
						cursor: step === 2 ? "default" : "pointer",
						opacity: step === 2 ? 0.4 : 1,
						fontFamily: font,
					}}
				>
					次へ →
				</button>
			</nav>

			{/* Step2 の追加先選択 */}
			{step === 1 && pickKind && (
				<TapToPlaceLayer
					doc={doc}
					kind={pickKind}
					onDone={() => setPickKind(null)}
					label="追加する場所をタップ"
				/>
			)}

			{/* Step3 の設定シート */}
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

function TemplateStep({
	tab,
	setTab,
	onPick,
}: {
	tab: "recent" | "basic";
	setTab: (t: "recent" | "basic") => void;
	onPick: (b: FlexBubble) => void;
}) {
	const templates = defaultTemplates.slice(0, 6);
	return (
		<div style={{ padding: "8px 12px 24px" }}>
			{/* タブ */}
			<div role="tablist" style={{ display: "flex", gap: 6, marginBottom: 10 }}>
				{(
					[
						["basic", "基本的な"],
						["recent", "最近使った"],
					] as const
				).map(([key, label]) => (
					<button
						key={key}
						type="button"
						role="tab"
						aria-selected={tab === key}
						onClick={() => setTab(key)}
						style={{
							flex: 1,
							minHeight: 44,
							borderRadius: 10,
							border: `1px solid ${tab === key ? w.green : w.border}`,
							backgroundColor: tab === key ? w.greenSoft : w.white,
							color: tab === key ? w.green : w.text,
							fontSize: 13,
							fontWeight: 700,
							cursor: "pointer",
							fontFamily: font,
						}}
					>
						{label}
					</button>
				))}
			</div>

			{/* 空で始める */}
			<button
				type="button"
				onClick={() =>
					onPick({
						type: "bubble",
						body: { type: "box", layout: "vertical", contents: [] },
					})
				}
				style={{
					width: "100%",
					minHeight: 56,
					border: `2px dashed ${w.green}`,
					borderRadius: 12,
					backgroundColor: w.greenSoft,
					color: w.green,
					fontSize: 14,
					fontWeight: 700,
					cursor: "pointer",
					marginBottom: 10,
					fontFamily: font,
				}}
			>
				✚ 空のメッセージから始める
			</button>

			{(tab === "basic" ? templates : []).map((t) => (
				<button
					key={t.id}
					type="button"
					onClick={() => onPick(t.bubble)}
					style={{
						width: "100%",
						textAlign: "left",
						minHeight: 64,
						border: `1px solid ${w.border}`,
						borderRadius: 12,
						backgroundColor: w.white,
						padding: "10px 12px",
						marginBottom: 8,
						cursor: "pointer",
						fontFamily: font,
					}}
				>
					<div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
					<div style={{ fontSize: 11, color: w.subText, marginTop: 2 }}>
						{t.description}
					</div>
				</button>
			))}
			{tab === "recent" && (
				<p
					style={{
						fontSize: 12,
						color: w.subText,
						textAlign: "center",
						padding: "20px 0",
					}}
				>
					（プロトタイプ: 本実装では最近使ったテンプレートがここに表示されます）
				</p>
			)}
		</div>
	);
}
