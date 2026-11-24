import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { defaultTemplates } from "../../../editor/templates";
import type { FlexBubble } from "../../../types";
import {
	ContainerQueryShell,
	useContainerLayout,
} from "../mobile/MobileShared";
import { Button } from "../ui/button";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { cn } from "../ui/utils";
import { FlexWysiwygEditor } from "./FlexWysiwygEditor";

/**
 * 呼び出し側デモ — 2 ステップ構成（テンプレ選択 → 編集）。
 *
 * - 「仕上げ」ステップは持たない: 完了処理（保存/反映/コピー…）は
 *   編集画面の下部ナビとして呼び出し側が自由に配置する
 * - ここでは例として「完了（JSON をコピー）」を直置き
 * - プレビューはエディタ本体のヘッダー 🔄 トグル（Eye アイコン）
 *
 * PC: 2 カラム / SP: 縦積み（コンテナクエリで自動切替）
 */

const STEPS = ["テンプレート", "部品を足す"] as const;

export function WizardDemo() {
	const [step, setStep] = useState(0);
	const [tab, setTab] = useState<"recent" | "basic">("basic");
	const [bubble, setBubble] = useState<FlexBubble | null>(null);
	const [copied, setCopied] = useState(false);
	const [mode, setMode] = useState<"edit" | "preview">("edit");
	const { narrow } = useContainerLayout();

	// ── ヘッダー（ステップ表示） ──
	const header = (
		<header className="shrink-0 border-b bg-background px-4 py-3">
			<div className="mx-auto flex max-w-5xl items-center gap-3">
				<h1 className="text-base font-bold">お知らせを作る</h1>
				<div
					role="progressbar"
					aria-label={`ステップ ${step + 1} / 2`}
					aria-valuenow={step + 1}
					aria-valuemin={1}
					aria-valuemax={2}
					className="flex flex-1 items-center justify-center gap-1.5"
				>
					{STEPS.map((label, i) => (
						<span
							key={label}
							title={label}
							aria-hidden
							className="flex items-center gap-1.5"
						>
							<span
								className={cn(
									"h-2 rounded-full transition-all",
									i === step ? "w-6 bg-primary" : "w-2 bg-border",
								)}
							/>
							{narrow && i === step && (
								<span className="text-xs font-semibold text-primary">
									{label}
								</span>
							)}
						</span>
					))}
				</div>
			</div>
		</header>
	);

	// ── Step 1: テンプレート選択（呼び出し側の責務） ──
	if (step === 0) {
		return (
			<ContainerQueryShell className="flex h-full flex-col overflow-y-auto bg-[#EEF1F4]">
				{header}
				<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 p-4 pb-10 md:p-6">
					<div role="tablist" className="flex gap-2">
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
								className={cn(
									"min-h-11 flex-1 rounded-xl border text-sm font-bold cursor-pointer transition-colors md:max-w-40",
									tab === key
										? "border-primary bg-primary/10 text-primary"
										: "border-border bg-background hover:bg-muted",
								)}
							>
								{label}
							</button>
						))}
					</div>

					<button
						type="button"
						onClick={() => {
							setBubble({
								type: "bubble",
								body: {
									type: "box",
									layout: "vertical",
									spacing: "md",
									contents: [],
								},
							});
							setStep(1);
						}}
						className="min-h-14 rounded-2xl border-2 border-dashed border-primary bg-primary/5 text-sm font-bold text-primary cursor-pointer transition-colors hover:bg-primary/10"
					>
						＋ 空のメッセージから始める
					</button>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
						{(tab === "basic" ? defaultTemplates.slice(0, 9) : []).map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => {
									setBubble(structuredClone(t.bubble));
									setStep(1);
								}}
								className="flex min-h-20 flex-col justify-center rounded-2xl border bg-card px-4 py-3 text-left shadow-sm cursor-pointer transition-colors hover:bg-accent"
							>
								<span className="text-sm font-bold">{t.name}</span>
								<span className="mt-1 text-xs text-muted-foreground">
									{t.description}
								</span>
							</button>
						))}
					</div>
					{tab === "recent" && (
						<p className="py-10 text-center text-xs text-muted-foreground">
							（本実装では最近使ったテンプレートがここに表示されます）
						</p>
					)}
				</div>
			</ContainerQueryShell>
		);
	}

	// ── Step 2: エディタ本体。完了処理はナビのボタンに直結（呼び出し側の責務） ──
	return (
		<ContainerQueryShell className="flex h-full min-h-0 flex-col bg-[#EEF1F4]">
			{header}
			<FlexWysiwygEditor
				value={bubble ?? undefined}
				onChange={setBubble}
				preview={mode === "preview"}
			>
				<nav className="flex items-center gap-2" aria-label="ステップ操作">
					<Button
						variant="outline"
						className="font-semibold"
						onClick={() => setStep(0)}
					>
						← 戻る
					</Button>
					{/* 編集 / プレビュー 切替（戻るボタンの隣） */}
					<ToggleGroup
						type="single"
						value={mode}
						onValueChange={(v) => {
							if (v) setMode(v as "edit" | "preview");
						}}
						aria-label="編集とプレビューの切替"
					>
						<ToggleGroupItem value="edit">編集</ToggleGroupItem>
						<ToggleGroupItem value="preview">プレビュー</ToggleGroupItem>
					</ToggleGroup>
					<div className="flex-1" />
					{/* 完了処理は呼び出し側が自由に差し替える（保存 / API 反映 / コピー 等） */}
					<Button
						className="gap-1.5 font-bold"
						onClick={() => {
							if (!bubble) return;
							navigator.clipboard
								?.writeText(JSON.stringify(bubble, null, 2))
								.then(() => {
									setCopied(true);
									window.setTimeout(() => setCopied(false), 1600);
								})
								.catch(() => undefined);
						}}
					>
						{copied ? <Check /> : <Copy />}
						{copied ? "コピーしました" : "JSON を書き出す"}
					</Button>
				</nav>
			</FlexWysiwygEditor>
		</ContainerQueryShell>
	);
}
