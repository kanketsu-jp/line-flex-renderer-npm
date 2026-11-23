import {
	ArrowDown,
	ArrowUp,
	Check,
	Copy,
	Pencil,
	Redo2,
	Trash2,
	Undo2,
	Wand2,
} from "lucide-react";
import { useState } from "react";
import { getNode, nodeLabel } from "../../../editor/path";
import type { InsertableKind } from "../../../editor/types";
import type { FlexBubble } from "../../../types";
import { useFlexDoc } from "../core/useFlexDoc";
import { WysiwygInspector } from "../core/WysiwygInspector";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "../ui/sheet";
import { cn } from "../ui/utils";
import {
	MobilePreview,
	MobileShell,
	TapToPlaceLayer,
	useContainerLayout,
} from "./MobileShared";

/**
 * 案 M6: プレビュー first → 編集モーダル型（shadcn/ui 刷新版）
 *
 * - 常態はプレビューだけ（実機の見た目のまま、100% / bubble 実幅で最大）
 * - 「編集」でフルスクリーン編集レイヤー。shadcn の質感で統一
 * - 部品は lucide アイコン + ToggleGroup パレット → ＋ガイドをタップして配置
 * - 設定は shadcn Sheet（Esc / 背景 / ✕ で閉じる）
 */

const KINDS: Array<{ kind: InsertableKind; label: string }> = [
	{ kind: "text", label: "テキスト" },
	{ kind: "image", label: "画像" },
	{ kind: "button", label: "ボタン" },
	{ kind: "box", label: "ボックス" },
	{ kind: "separator", label: "区切り" },
];

export function MobilePreviewFirst({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const { compact } = useContainerLayout();
	const [editing, setEditing] = useState(false);
	const [insertKind, setInsertKind] = useState<InsertableKind | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const selectedNode = doc.selected
		? getNode(doc.bubble, doc.selected)
		: undefined;

	return (
		<MobileShell title={editing ? "編集" : "プレビュー"} doc={doc}>
			{/* 常態: プレビュー */}
			<div className="flex flex-1 justify-center overflow-y-auto bg-[#EEF1F4] p-3">
				<MobilePreview doc={doc} width="100%" />
			</div>

			{/* 常態フッター */}
			{!editing && (
				<div className="flex shrink-0 items-center gap-2 border-t bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
					<Button
						size="lg"
						className="h-12 flex-1 text-base font-bold"
						onClick={() => setEditing(true)}
					>
						<Pencil data-slot="icon" />
						このメッセージを編集
					</Button>
					<Button
						size="lg"
						variant="outline"
						className="h-12 w-12 px-0"
						aria-label="JSON をコピー"
						onClick={() => {
							navigator.clipboard
								?.writeText(JSON.stringify(doc.bubble, null, 2))
								.then(() => {
									setCopied(true);
									window.setTimeout(() => setCopied(false), 1600);
								})
								.catch(() => undefined);
						}}
					>
						{copied ? <Check className="text-primary" /> : <Copy />}
					</Button>
				</div>
			)}

			{/* 編集フルスクリーンレイヤー */}
			{editing && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="編集画面"
					className="absolute inset-0 z-30 flex flex-col bg-[#EEF1F4]"
				>
					{/* 編集ヘッダー */}
					<div className="flex shrink-0 items-center gap-1 border-b bg-background px-2 py-1.5">
						<Button
							variant="ghost"
							size="icon"
							aria-label="元に戻す"
							disabled={!doc.canUndo}
							onClick={doc.undo}
						>
							<Undo2 />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							aria-label="やり直す"
							disabled={!doc.canRedo}
							onClick={doc.redo}
						>
							<Redo2 />
						</Button>
						<Badge variant="secondary" className="mx-1 h-6">
							<Wand2 className="size-3" />
							編集中
						</Badge>
						<div className="flex-1" />
						<Button
							size="sm"
							className="h-9 px-5 font-bold"
							onClick={() => {
								doc.select(null);
								setInsertKind(null);
								setEditing(false);
							}}
						>
							完了
						</Button>
					</div>

					{/* プレビュー */}
					<div className="flex flex-1 justify-center overflow-y-auto p-3 pb-4">
						<MobilePreview doc={doc} width="100%" />
					</div>

					{/* 選択中の部品バー */}
					{selectedNode && doc.selected && !insertKind && (
						<div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-t bg-background px-2 py-1.5">
							<Badge
								variant="outline"
								className="h-7 max-w-36 truncate text-[11px]"
							>
								{nodeLabel(selectedNode)}
							</Badge>
							<Separator orientation="vertical" className="mx-0.5 h-6" />
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="設定"
								onClick={() => setSheetOpen(true)}
							>
								⚙
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="上へ"
								onClick={() => doc.selected && doc.move(doc.selected, -1)}
							>
								<ArrowUp />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="下へ"
								onClick={() => doc.selected && doc.move(doc.selected, 1)}
							>
								<ArrowDown />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="複製"
								onClick={() => doc.selected && doc.duplicate(doc.selected)}
							>
								⧉
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="削除"
								className="text-destructive hover:text-destructive"
								onClick={() => doc.selected && doc.remove(doc.selected)}
							>
								<Trash2 />
							</Button>
						</div>
					)}

					{/* パレット（ToggleGroup 風の横スクロール） */}
					<div className="flex shrink-0 gap-1.5 overflow-x-auto border-t bg-background p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
						{KINDS.map((k) => (
							<button
								key={k.kind}
								type="button"
								aria-pressed={insertKind === k.kind}
								onClick={() =>
									setInsertKind(insertKind === k.kind ? null : k.kind)
								}
								className={cn(
									"flex h-14 min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer active:scale-95",
									insertKind === k.kind
										? "border-primary bg-primary/10 text-primary shadow-xs"
										: "bg-background text-foreground hover:bg-muted",
								)}
							>
								<span className="text-base leading-none">
									{k.kind === "text"
										? "Ｔ"
										: k.kind === "image"
											? "🖼"
											: k.kind === "button"
												? "▭"
												: k.kind === "box"
													? "▤"
													: "―"}
								</span>
								{k.label}
							</button>
						))}
					</div>

					{/* タップ・トゥ・プレイス */}
					{insertKind && (
						<TapToPlaceLayer
							doc={doc}
							kind={insertKind}
							onDone={() => setInsertKind(null)}
							label={`${KINDS.find((k) => k.kind === insertKind)?.label ?? ""}を置く場所をタップ`}
						/>
					)}
				</div>
			)}

			{/* 設定シート（shadcn Sheet） */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent
					side="bottom"
					className="max-h-[78dvh] overflow-y-auto rounded-t-2xl"
				>
					<SheetHeader>
						<SheetTitle>
							{selectedNode ? nodeLabel(selectedNode) : "部品の設定"}
						</SheetTitle>
						<SheetDescription>
							値を変更すると即座にプレビューへ反映されます
						</SheetDescription>
					</SheetHeader>
					<div className="px-4 pb-6">
						{selectedNode && doc.selected && (
							<WysiwygInspector
								node={selectedNode}
								onPatch={(p) => doc.selected && doc.patch(doc.selected, p)}
							/>
						)}
					</div>
				</SheetContent>
			</Sheet>

			{/* compact 幅のヒント */}
			{editing && compact && (
				<p className="pointer-events-none absolute top-14 right-3 z-40 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-md">
					狭い画面レイアウト
				</p>
			)}
		</MobileShell>
	);
}
