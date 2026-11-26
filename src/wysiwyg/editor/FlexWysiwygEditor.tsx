import { ArrowDown, ArrowUp, Pencil, Redo2, Trash2, Undo2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { getNode, nodeLabel } from "../../editor/path";
import type { FlexNodePath, InsertableKind } from "../../editor/types";
import type { FlexBubble } from "../../types";
import { InteractiveTree } from "../core/InteractiveTree";
import { useFlexDoc } from "../core/useFlexDoc";
import { WysiwygInspector } from "../core/WysiwygInspector";
import {
	ContainerQueryShell,
	useContainerLayout,
} from "../layout/MobileShared";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "../ui/sheet";
import { cn } from "../ui/utils";

/**
 * FlexWysiwygEditor — 採用案（モバイル: M2 洗練版 / PC: 案A 洗練版 を 1 コンポーネントに統合）
 *
 * 操作フロー:
 * 1. Divider の「＋」を押す → 部品選択シート（SP: 下 / PC: 右パネル）
 * 2. 部品を選ぶと ＋ を押した位置に挿入される
 * 3. 追加済みの部品を選択 → 「編集」「削除」バーが出る
 * 4. 編集 → フィールド別編集 UI シート（SP: 下 / PC: 右パネル）
 *
 * 呼び出し側の責務（エディタ本体に含まない）:
 * - テンプレート選択（Step1）
 * - 「戻る」「次へ」ナビ（children として下部に自由に配置）
 *
 * レイアウトはコンテナクエリ（ResizeObserver）で切替。vw 非依存。
 */

const KINDS: Array<{
	kind: InsertableKind;
	label: string;
	desc: string;
}> = [
	{ kind: "text", label: "テキスト", desc: "見出しや本文" },
	{ kind: "image", label: "画像", desc: "アップロードして配置" },
	{ kind: "button", label: "ボタン", desc: "リンク・アクション" },
	{ kind: "box", label: "ボックス", desc: "部品をまとめる箱" },
	{ kind: "separator", label: "区切り線", desc: "内容を分ける線" },
];

/** ホスト側の画像アップローダ（File を受けて公開 URL を返す） */
export type FlexImageUploadHandler = (file: File) => Promise<string>;

/** Shell の内側で幅を測るための render-props（Context は Provider の子孫でしか読めないため） */
function NarrowGate({
	children,
}: {
	children: (narrow: boolean) => React.ReactNode;
}) {
	const { narrow } = useContainerLayout();
	return <>{children(narrow)}</>;
}

export interface FlexWysiwygEditorProps {
	/** 編集対象の bubble（テンプレート選択後の状態を渡す） */
	value?: FlexBubble;
	/** 編集のたびに呼ばれる */
	onChange?: (bubble: FlexBubble) => void;
	/** ホスト側画像アップローダ（未指定なら data URL で即プレビュー。data URL は LINE API で送信不可） */
	onImageUpload?: FlexImageUploadHandler;
	/** 差し込み保護 URI（該当 action の削除・変更を拒否） */
	lockedUris?: string[];
	/** 下部領域（戻る/次へなど、呼び出し側が自由に配置） */
	children?: React.ReactNode;
	/** プレビューモード（呼び出し側のタブから制御。未指定なら false） */
	preview?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

export function FlexWysiwygEditor({
	value,
	onChange,
	onImageUpload,
	lockedUris,
	children,
	preview = false,
	className,
	style,
}: FlexWysiwygEditorProps) {
	const initial =
		value ??
		({
			type: "bubble",
			body: { type: "box", layout: "vertical", spacing: "md", contents: [] },
		} as FlexBubble);
	const doc = useFlexDoc(initial, lockedUris, onChange);

	// ＋を押した位置（部品選択シートを開く）
	const [slotPick, setSlotPick] = useState<{
		parentPath: FlexNodePath;
		index: number;
	} | null>(null);
	// 編集シート
	const [editOpen, setEditOpen] = useState(false);
	// プレビューモード（編集不可の表示専用。呼び出し側のタブから制御）
	const previewMode = preview;

	const selectedNode = doc.selected
		? getNode(doc.bubble, doc.selected)
		: undefined;

	const insertKind = (kind: InsertableKind) => {
		if (!slotPick) return;
		// 挿入後の bubble を受け取り、選択位置は「挿入後の状態」から計算する（NB1）
		const next = doc.insertNodeAt(slotPick.parentPath, kind, slotPick.index);
		setSlotPick(null);
		// 挿入された要素を選択状態に（編集へスムーズに誘導）
		const parent = getNode(next, slotPick.parentPath);
		if (parent && parent.type === "box") {
			doc.select({
				section: slotPick.parentPath.section,
				indices: [
					...slotPick.parentPath.indices,
					Math.min(slotPick.index, parent.contents.length - 1),
				],
			});
		}
	};

	const panel = (
		<>
			<SheetHeader>
				<SheetTitle>部品を追加</SheetTitle>
				<SheetDescription>
					選ぶと押した「＋」の位置に挿入されます
				</SheetDescription>
			</SheetHeader>
			<div className="flex flex-col gap-2 px-4 pb-6">
				{KINDS.map((k) => (
					<button
						key={k.kind}
						type="button"
						onClick={() => insertKind(k.kind)}
						className="flex items-center gap-3 rounded-xl border bg-card px-3 py-3 text-left transition-colors cursor-pointer hover:bg-accent active:scale-[0.99]"
					>
						<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-lg text-primary">
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
						<span>
							<span className="block text-sm font-semibold">{k.label}</span>
							<span className="block text-xs text-muted-foreground">
								{k.desc}
							</span>
						</span>
					</button>
				))}
			</div>
		</>
	);

	return (
		<ContainerQueryShell
			className={cn("lfw-root h-full min-h-0", className)}
			style={style}
		>
			<NarrowGate>
				{(narrow) => (
					<>
						{/* ヘッダー: undo / redo */}
						<header className="flex shrink-0 items-center gap-1 border-b bg-background px-2 py-1.5">
							<Badge variant="secondary" className="mx-1 h-6 whitespace-nowrap">
								{previewMode ? "プレビュー" : "部品を足す"}
							</Badge>
							<div className="flex-1" />
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
						</header>
						{doc.lastError && (
							<p
								role="alert"
								className="px-3 py-1.5 text-xs font-semibold text-destructive"
							>
								{doc.lastError}
							</p>
						)}

						{/* 本体: PC はキャンバス＋右パネル / SP はキャンバス全幅 */}
						<div className="flex min-h-0 flex-1">
							<div className="flex flex-1 justify-center overflow-y-auto p-3 pb-6">
								<InteractiveTree
									doc={doc}
									width="100%"
									interactive={!previewMode}
									lockedUris={lockedUris}
									onSlotClick={(parentPath, index) =>
										setSlotPick({ parentPath, index })
									}
								/>
							</div>
							{!narrow && !previewMode && (
								<aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l bg-background">
									{/* PC は選択したら即インスペクタ表示（SP のシートは従来どおり編集ボタン経由） */}
									{selectedNode && doc.selected ? (
										<div className="p-3">
											<div className="mb-2 flex items-center gap-2">
												<Badge variant="outline" className="max-w-56 truncate">
													{nodeLabel(selectedNode)}
												</Badge>
											</div>
											<WysiwygInspector
												node={selectedNode}
												lockedUris={lockedUris}
												onImageUpload={onImageUpload}
												onPatch={(p) =>
													selectedNode && doc.patchNodeRef(selectedNode, p)
												}
											/>
										</div>
									) : (
										<div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
											<span className="text-3xl">👆</span>
											<p className="text-sm font-medium">
												部品を選ぶと編集できます
											</p>
											<p className="text-xs">
												線の「＋」から新規追加 / 既存の部品をクリックで選択
											</p>
										</div>
									)}
								</aside>
							)}
						</div>

						{/* 選択中部品バー: 編集 / 削除 */}
						{selectedNode && doc.selected && !previewMode && (
							<div
								role="toolbar"
								aria-label="選択した部品の操作"
								className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-t bg-background px-2 py-1.5"
							>
								<Badge
									variant="outline"
									className="h-7 max-w-44 truncate text-[11px]"
								>
									{nodeLabel(selectedNode)}
								</Badge>
								<div className="flex-1" />
								{narrow && (
									<>
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
									</>
								)}
								<Button
									size="sm"
									className="h-8 gap-1.5"
									onClick={() => setEditOpen(true)}
								>
									<Pencil />
									編集
								</Button>
								<Button
									size="sm"
									variant="destructive"
									className="h-8 gap-1.5"
									onClick={() => {
										if (!doc.selected) return;
										doc.remove(doc.selected);
										setEditOpen(false);
									}}
								>
									<Trash2 />
									削除
								</Button>
							</div>
						)}

						{/* 呼び出し側のナビ領域（戻る/次へ 等） */}
						{children && (
							<footer className="shrink-0 border-t bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] [&>*]:min-h-11">
								{children}
							</footer>
						)}

						{/* 部品選択シート: SP=下 / PC=右 */}
						<Sheet
							open={slotPick !== null}
							onOpenChange={(o) => !o && setSlotPick(null)}
						>
							<SheetContent
								side={narrow ? "bottom" : "right"}
								className={narrow ? "rounded-t-2xl" : undefined}
							>
								{panel}
							</SheetContent>
						</Sheet>

						{/* 編集シート（SP のみ。PC は右パネル直表示） */}
						{narrow && (
							<Sheet open={editOpen} onOpenChange={setEditOpen}>
								<SheetContent
									side="bottom"
									className="max-h-[78dvh] overflow-y-auto rounded-t-2xl"
								>
									<SheetHeader>
										<SheetTitle>
											{selectedNode ? nodeLabel(selectedNode) : "部品の編集"}
										</SheetTitle>
										<SheetDescription>
											変更は即座にプレビューへ反映されます
										</SheetDescription>
									</SheetHeader>
									<div className="px-4 pb-6">
										{selectedNode && doc.selected && (
											<WysiwygInspector
												node={selectedNode}
												lockedUris={lockedUris}
												onImageUpload={onImageUpload}
												onPatch={(p) =>
													selectedNode && doc.patchNodeRef(selectedNode, p)
												}
											/>
										)}
									</div>
								</SheetContent>
							</Sheet>
						)}
					</>
				)}
			</NarrowGate>
		</ContainerQueryShell>
	);
}
