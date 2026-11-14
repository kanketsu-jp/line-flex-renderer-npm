import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ensureSection, insertNode } from "../../../editor/path";
import type { FlexNodePath, InsertableKind } from "../../../editor/types";
import type { FlexBubble } from "../../../types";
import { InteractiveTree } from "../core/InteractiveTree";
import { font, kindIcon, kindLabel, w } from "../core/theme";
import type { useFlexDoc } from "../core/useFlexDoc";

/**
 * モバイル案 5 種の共通部品。
 *
 * - MobileShell: PC では電話フレーム（390×760）で表示、実機では全画面。
 *   Storybook の layout: fullscreen と組み合わせる想定
 * - PaletteBar: 横スクロールの部品パレット（タップ→onPick）
 * - MobileHeader: 閉じる / 手順 / undo / redo
 *
 * モバイル UX の前提（HIG / Material Design 準拠）:
 * - タッチターゲット 44px 以上
 * - 主要操作は親指が届く画面下部に置く
 * - hover 依存の UI を作らない（hover は補助のみ）
 * - ドラッグは長押し（≥300ms）で開始し、スクロールと分離
 */

export function useIsMobileViewport(): boolean {
	const [m, setM] = useState(
		typeof window !== "undefined" ? window.innerWidth <= 768 : false,
	);
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 768px)");
		const onChange = () => setM(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);
	return m;
}

export function MobileShell({
	title,
	children,
	onClose,
	doc,
}: {
	title: string;
	children: React.ReactNode;
	onClose?: () => void;
	doc: ReturnType<typeof useFlexDoc>;
}) {
	const isMobile = useIsMobileViewport();
	// コンテナクエリ: vw ではなくこのシェル自身の幅を測定（モーダル/シート/埋め込みでも同じ判定）
	const shellRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(390);
	useEffect(() => {
		const el = shellRef.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setContainerWidth(entry.contentRect.width);
			}
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const inner = (
		<div
			data-mobile-shell
			ref={shellRef}
			style={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				backgroundColor: w.canvasBg,
				color: w.text,
				fontFamily: font,
				overflow: "hidden",
				position: "relative",
			}}
		>
			<ContainerWidthContext.Provider value={containerWidth}>
				<MobileHeader title={title} onClose={onClose} doc={doc} />
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						minHeight: 0,
						minWidth: 0,
					}}
				>
					{children}
				</div>
			</ContainerWidthContext.Provider>
		</div>
	);
	if (isMobile) return <div style={{ height: "100dvh" }}>{inner}</div>;
	return (
		<div
			style={{
				height: "100dvh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#1c2024",
				padding: 16,
			}}
		>
			<div
				style={{
					width: "min(390px, 100%)",
					maxWidth: 390,
					height: "min(760px, 100%)",
					borderRadius: 28,
					overflow: "hidden",
					boxShadow: "0 16px 60px rgba(0,0,0,0.5)",
					border: "6px solid #2a2e33",
					position: "relative",
				}}
			>
				{inner}
			</div>
		</div>
	);
}

function MobileHeader({
	title,
	onClose,
	doc,
}: {
	title: string;
	onClose?: () => void;
	doc: ReturnType<typeof useFlexDoc>;
}) {
	return (
		<header
			style={{
				display: "flex",
				alignItems: "center",
				gap: 6,
				padding: "8px 10px",
				backgroundColor: w.white,
				borderBottom: `1px solid ${w.border}`,
				flexShrink: 0,
				minHeight: 52,
			}}
		>
			<button
				type="button"
				aria-label="閉じる"
				onClick={onClose}
				style={{
					...btnReset,
					width: 44,
					height: 44,
					fontSize: 16,
					color: w.subText,
				}}
			>
				✕
			</button>
			<strong style={{ fontSize: 14, flex: 1, textAlign: "center" }}>
				{title}
			</strong>
			<button
				type="button"
				aria-label="元に戻す"
				disabled={!doc.canUndo}
				onClick={doc.undo}
				style={{
					...btnReset,
					width: 44,
					height: 44,
					fontSize: 16,
					color: w.text,
				}}
			>
				↩
			</button>
			<button
				type="button"
				aria-label="やり直す"
				disabled={!doc.canRedo}
				onClick={doc.redo}
				style={{
					...btnReset,
					width: 44,
					height: 44,
					fontSize: 16,
					color: w.text,
				}}
			>
				↪
			</button>
		</header>
	);
}

const btnReset: React.CSSProperties = {
	border: "none",
	background: "transparent",
	cursor: "pointer",
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	fontFamily: font,
};

/** コンテナ幅（ResizeObserver で測定。ブレークポイントではなくコンテナクエリ的な判定に使う） */
const ContainerWidthContext = createContext<number>(390);

export function useContainerWidth(): number {
	return useContext(ContainerWidthContext);
}

/** コンテナ幅に応じたレイアウト判定（vw ではなくコンテナサイズ基準） */
export function useContainerLayout(): {
	width: number;
	compact: boolean; // < 360
	narrow: boolean; // < 480
} {
	const width = useContainerWidth();
	return { width, compact: width < 360, narrow: width < 480 };
}

/** 横スクロール部品パレット（44px 高のタッチターゲット） */
export function PaletteBar({
	onPick,
	activeKind,
}: {
	onPick: (kind: InsertableKind) => void;
	activeKind?: InsertableKind | null;
}) {
	const kinds: InsertableKind[] = [
		"text",
		"image",
		"button",
		"box",
		"separator",
	];
	return (
		<div
			role="toolbar"
			aria-label="部品を追加"
			style={{
				display: "flex",
				gap: 6,
				overflowX: "auto",
				WebkitOverflowScrolling: "touch",
				padding: "6px 10px",
				flexShrink: 0,
				scrollbarWidth: "none",
			}}
		>
			{kinds.map((k) => (
				<button
					key={k}
					type="button"
					onClick={() => onPick(k)}
					aria-pressed={activeKind === k}
					style={{
						...btnReset,
						flexDirection: "column",
						gap: 2,
						minWidth: 64,
						minHeight: 52,
						padding: "4px 8px",
						borderRadius: 10,
						border: `1px solid ${activeKind === k ? w.green : w.border}`,
						backgroundColor: activeKind === k ? w.greenSoft : w.white,
						color: activeKind === k ? w.green : w.text,
						flexShrink: 0,
					}}
				>
					<span style={{ fontSize: 16 }}>{kindIcon[k]}</span>
					<span style={{ fontSize: 10, fontWeight: 600 }}>{kindLabel[k]}</span>
				</button>
			))}
		</div>
	);
}

/** 空の本文から始めるヘルパー */
export function emptyBubble(): FlexBubble {
	return {
		type: "bubble",
		body: { type: "box", layout: "vertical", spacing: "md", contents: [] },
	};
}

/** セクションが無ければ作ってから本文末尾に追加 */
export function insertToBody(
	doc: ReturnType<typeof useFlexDoc>,
	kind: InsertableKind,
) {
	let bubble = doc.bubble;
	if (!bubble.body) bubble = ensureSection(bubble, "body");
	const withInsert = insertNode(bubble, { section: "body", indices: [] }, kind);
	doc.replace(withInsert);
}

/** 簡易プレビュー（インタラクション付き）。width 未指定ならコンテナいっぱい（maxWidth は bubble 実幅） */
export function MobilePreview({
	doc,
	width = "100%",
	activeDropPath,
}: {
	doc: ReturnType<typeof useFlexDoc>;
	width?: number | string;
	activeDropPath?: FlexNodePath | null;
}) {
	return (
		<InteractiveTree
			doc={doc}
			width={width}
			activeDropPath={activeDropPath}
			onAddSection={(s) => doc.replace(ensureSection(doc.bubble, s))}
		/>
	);
}

/** 共通ボトムシート（Esc/背景タップ/✕ で閉じる） */
export function BottomSheet({
	title,
	onClose,
	children,
}: {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
}) {
	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
			style={{
				position: "absolute",
				inset: 0,
				backgroundColor: "rgba(0,0,0,0.4)",
				zIndex: 50,
				display: "flex",
				alignItems: "flex-end",
			}}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: クリック伝播停止のみ */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: キー操作は内部コントロールが担う */}
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					width: "100%",
					maxHeight: "72%",
					backgroundColor: w.white,
					borderRadius: "16px 16px 0 0",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					style={{
						padding: "10px 14px 6px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						borderBottom: `1px solid ${w.border}`,
					}}
				>
					<strong style={{ fontSize: 13 }}>{title}</strong>
					<button
						type="button"
						aria-label="閉じる"
						onClick={onClose}
						style={{
							border: "none",
							background: "transparent",
							fontSize: 14,
							padding: 6,
						}}
					>
						✕
					</button>
				</div>
				<div style={{ overflowY: "auto", padding: 12 }}>{children}</div>
			</div>
		</div>
	);
}

/** 共通: タップで配置レイヤー（挿入モード。box の位置に＋ガイドを重ねる） */
export function TapToPlaceLayer({
	doc,
	kind,
	onDone,
	label,
}: {
	doc: ReturnType<typeof useFlexDoc>;
	kind: InsertableKind;
	onDone: () => void;
	label?: string;
}) {
	const targets = Array.from(
		document.querySelectorAll<HTMLElement>("[data-flex-type='box']"),
	);
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				zIndex: 40,
				pointerEvents: "none",
			}}
		>
			{label && (
				<div
					role="status"
					style={{
						position: "absolute",
						top: 8,
						left: "50%",
						transform: "translateX(-50%)",
						backgroundColor: w.green,
						color: w.white,
						fontSize: 12,
						fontWeight: 700,
						borderRadius: 999,
						padding: "6px 14px",
						whiteSpace: "nowrap",
						maxWidth: "92%",
					}}
				>
					{label}
				</div>
			)}
			{targets.map((el) => {
				const rect = el.getBoundingClientRect();
				const host = el.closest("[data-mobile-shell]")?.getBoundingClientRect();
				if (!host) return null;
				const key = el.dataset.flexPath ?? el.dataset.flexType ?? "";
				return (
					<button
						key={key}
						type="button"
						aria-label="ここに追加"
						onClick={(e) => {
							e.stopPropagation();
							const path = JSON.parse(
								el.dataset.flexPath ?? "{}",
							) as FlexNodePath;
							let bubble = doc.bubble;
							if (!bubble[path.section]) {
								bubble = {
									...bubble,
									[path.section]: {
										type: "box",
										layout: "vertical",
										contents: [],
									},
								};
							}
							doc.replace(insertNode(bubble, path, kind));
							onDone();
						}}
						style={{
							position: "absolute",
							left: rect.left - host.left,
							top: rect.top - host.top,
							width: rect.width,
							height: rect.height,
							border: `2px dashed ${w.green}`,
							borderRadius: 8,
							backgroundColor: "rgba(6,199,85,0.12)",
							pointerEvents: "auto",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 22,
							color: w.green,
							fontWeight: 700,
							fontFamily: font,
						}}
					>
						＋
					</button>
				);
			})}
		</div>
	);
}
