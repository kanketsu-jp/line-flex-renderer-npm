import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { defaultTemplates } from "../../../editor/templates";
import type { FlexBubble } from "../../../types";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { FlexWysiwygEditor } from "./FlexWysiwygEditor";

/**
 * 呼び出し側デモ — エディタ本体の外側（Step1 テンプレ選択 / Step3 完了）と
 * 「戻る / 次へ」を children で差し込む使い方の見本。
 * エディタ本体（FlexWysiwygEditor）はテンプレ選択もナビも持たない。
 */

export function WizardDemo() {
	const [step, setStep] = useState(0);
	const [tab, setTab] = useState<"recent" | "basic">("basic");
	const [bubble, setBubble] = useState<FlexBubble | null>(null);
	const [copied, setCopied] = useState(false);

	// ---------- Step 1: テンプレート選択（呼び出し側の責務） ----------
	if (step === 0) {
		return (
			<div className="flex h-full flex-col overflow-y-auto bg-[#EEF1F4]">
				<header className="shrink-0 border-b bg-background px-4 py-3">
					<h1 className="text-base font-bold">お知らせを作る</h1>
					<p className="text-xs text-muted-foreground">見本を選んで始めます</p>
				</header>
				<div className="flex flex-1 flex-col gap-2 p-4 pb-10">
					<div role="tablist" className="mb-1 flex gap-2">
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
									"min-h-11 flex-1 rounded-xl border text-sm font-bold cursor-pointer transition-colors",
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

					{(tab === "basic" ? defaultTemplates.slice(0, 6) : []).map((t) => (
						<button
							key={t.id}
							type="button"
							onClick={() => {
								setBubble(structuredClone(t.bubble));
								setStep(1);
							}}
							className="min-h-16 rounded-2xl border bg-card px-4 py-3 text-left shadow-sm cursor-pointer transition-colors hover:bg-accent"
						>
							<div className="text-sm font-bold">{t.name}</div>
							<div className="mt-0.5 text-xs text-muted-foreground">
								{t.description}
							</div>
						</button>
					))}
					{tab === "recent" && (
						<p className="py-10 text-center text-xs text-muted-foreground">
							（本実装では最近使ったテンプレートがここに表示されます）
						</p>
					)}
				</div>
			</div>
		);
	}

	// ---------- Step 2: エディタ本体（戻る/次へを children で差し込む） ----------
	if (step === 1) {
		return (
			<FlexWysiwygEditor value={bubble ?? undefined} onChange={setBubble}>
				<nav className="flex gap-2" aria-label="ステップ操作">
					<Button
						variant="outline"
						className="flex-1 font-semibold"
						onClick={() => setStep(0)}
					>
						← 戻る
					</Button>
					<Button className="flex-1 font-bold" onClick={() => setStep(2)}>
						次へ →
					</Button>
				</nav>
			</FlexWysiwygEditor>
		);
	}

	// ---------- Step 3: 仕上げ（呼び出し側の責務） ----------
	return (
		<div className="flex h-full flex-col overflow-y-auto bg-[#EEF1F4]">
			<header className="shrink-0 border-b bg-background px-4 py-3">
				<h1 className="text-base font-bold">仕上げる</h1>
				<p className="text-xs text-muted-foreground">
					内容を確認して、JSON をコピーして完了です
				</p>
			</header>
			<div className="flex flex-1 justify-center p-4">
				{bubble && (
					<pre className="max-h-full w-full max-w-xl overflow-auto rounded-2xl border bg-card p-4 text-xs leading-relaxed shadow-sm">
						{JSON.stringify(bubble, null, 2)}
					</pre>
				)}
			</div>
			<footer className="flex shrink-0 gap-2 border-t bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
				<Button
					variant="outline"
					className="flex-1 font-semibold"
					onClick={() => setStep(1)}
				>
					← 戻る
				</Button>
				<Button
					className="flex-1 gap-1.5 font-bold"
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
					{copied ? "コピーしました" : "JSON をコピー"}
				</Button>
			</footer>
		</div>
	);
}
