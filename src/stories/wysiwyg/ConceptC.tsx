import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	ensureSection,
	isSamePath,
	listNodes,
	nodeLabel,
} from "../../editor/path";
import type { FlexNodePath, InsertableKind } from "../../editor/types";
import type { FlexBubble } from "../../types";
import {
	findDropTargetFromPoint,
	InteractiveTree,
} from "./core/InteractiveTree";
import { font, iconBtn, kindIcon, w } from "./core/theme";
import { useFlexDoc } from "./core/useFlexDoc";
import { WysiwygInspector } from "./core/WysiwygInspector";

/**
 * 案 C: 3 ペイン ビルダー（Webflow / GrapesJS アプローチ）
 *
 * - 左: 部品パレット（ドラッグ供給源 + タップで追加先選択）/ 構造ツリー
 * - 中央: キャンバス（ドロップ先ハイライト）
 * - 右: インスペクタ（画像はアップロード式）
 *
 * DnD は Pointer Events ベース（マウス・タッチ共通）。HTML5 DnD は
 * モバイルで動作しないため使わない。ドラッグできない場合に備えて
 * 「タップ → 追加先を選ぶ」代替フローを常設（スキル原則 4）。
 */

const PALETTE: Array<{ kind: InsertableKind; label: string; desc: string }> = [
	{ kind: "text", label: "テキスト", desc: "見出しや本文" },
	{ kind: "image", label: "画像", desc: "写真・イラスト（アップロード）" },
	{ kind: "button", label: "ボタン", desc: "リンク・アクション" },
	{ kind: "box", label: "ボックス", desc: "部品をまとめる箱" },
	{ kind: "separator", label: "区切り線", desc: "横罫線" },
];

const DRAG_THRESHOLD = 3;

interface DragState {
	kind: InsertableKind;
	label: string;
	x: number;
	y: number;
	startX: number;
	startY: number;
}

export function ConceptBuilder({ initial }: { initial: FlexBubble }) {
	const doc = useFlexDoc(initial);
	const [dropTargetPath, setDropTargetPath] = useState<FlexNodePath | null>(
		null,
	);
	const [drag, setDrag] = useState<DragState | null>(null);
	const dragRef = useRef<DragState | null>(null);
	dragRef.current = drag;
	const [insertPicker, setInsertPicker] = useState<InsertableKind | null>(null);
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" ? window.innerWidth <= 768 : false,
	);

	useEffect(() => {
		const mq = window.matchMedia("(max-width: 768px)");
		const onChange = () => setIsMobile(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	// ---- ポインターベース DnD（パレット → キャンバス） ----
	const beginPointerDrag = (
		e: React.PointerEvent,
		kind: InsertableKind,
		label: string,
	) => {
		e.preventDefault();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		setDrag({
			kind,
			label,
			x: e.clientX,
			y: e.clientY,
			startX: e.clientX,
			startY: e.clientY,
		});
	};

	const movePointerDrag = (e: React.PointerEvent) => {
		const d = dragRef.current;
		if (!d) return;
		e.preventDefault();
		const moved =
			Math.abs(e.clientX - d.startX) > DRAG_THRESHOLD ||
			Math.abs(e.clientY - d.startY) > DRAG_THRESHOLD;
		if (!moved) return;
		const hit = findDropTargetFromPoint(e.clientX, e.clientY);
		const boxHit =
			hit && hit.nodeType === "box"
				? { section: hit.path.section, indices: hit.path.indices }
				: null;
		setDropTargetPath(boxHit);
		setDrag({ ...d, x: e.clientX, y: e.clientY });
	};

	const endPointerDrag = (e: React.PointerEvent) => {
		const d = dragRef.current;
		if (!d) return;
		const hit = findDropTargetFromPoint(e.clientX, e.clientY);
		if (hit && hit.nodeType === "box") {
			let bubble = doc.bubble;
			if (!bubble[hit.path.section]) {
				bubble = ensureSection(bubble, hit.path.section);
				doc.replace(bubble);
			}
			doc.insert(hit.path, d.kind);
		}
		setDrag(null);
		setDropTargetPath(null);
	};

	// box（セクション含む）の一覧 = 挿入先候補
	const insertTargets = listNodes(doc.bubble).filter(
		(entry) => entry.node.type === "box",
	);

	const insertAt = (path: FlexNodePath) => {
		if (!insertPicker) return;
		let bubble = doc.bubble;
		if (!bubble[path.section]) {
			bubble = ensureSection(bubble, path.section);
			doc.replace(bubble);
		}
		doc.insert(path, insertPicker);
		setInsertPicker(null);
	};

	// ---- パレット項目 ----
	const paletteItem = (item: (typeof PALETTE)[number]) => (
		// biome-ignore lint/a11y/useSemanticElements: ドラッグ供給源を兼ねるため pointer イベントを持つ div+role（button 要素は pointer capture と DnD の組合せで不自然な挙動になる）
		<div
			key={item.kind}
			role="button"
			tabIndex={0}
			aria-label={`${item.label}を追加`}
			onPointerDown={(e) => beginPointerDrag(e, item.kind, item.label)}
			onPointerMove={movePointerDrag}
			onPointerUp={endPointerDrag}
			onPointerCancel={() => {
				setDrag(null);
				setDropTargetPath(null);
			}}
			onClick={() => setInsertPicker(item.kind)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") setInsertPicker(item.kind);
			}}
			style={{
				display: "flex",
				alignItems: "center",
				gap: 10,
				padding: isMobile ? "8px 10px" : "8px 10px",
				border: `1px solid ${w.border}`,
				borderRadius: 8,
				backgroundColor: w.white,
				cursor: "grab",
				marginBottom: isMobile ? 0 : 6,
				userSelect: "none",
				touchAction: "none",
				flexShrink: 0,
				...(isMobile ? { width: 116 } : {}),
			}}
			title={`${item.label} — ${item.desc}`}
		>
			<span
				style={{
					width: 30,
					height: 30,
					borderRadius: 6,
					backgroundColor: w.greenSoft,
					color: w.green,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: 14,
					flexShrink: 0,
				}}
			>
				{kindIcon[item.kind]}
			</span>
			<div>
				<div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
				{!isMobile && (
					<div style={{ fontSize: 10, color: w.subText }}>{item.desc}</div>
				)}
			</div>
		</div>
	);

	// ---- 追加先ピッカー（タップ代替フロー / モバイル主経路） ----
	const insertPickerNode = insertPicker ? (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="追加先を選ぶ"
			onClick={() => setInsertPicker(null)}
			onKeyDown={(e) => {
				if (e.key === "Escape") setInsertPicker(null);
			}}
			style={{
				position: "fixed",
				inset: 0,
				backgroundColor: "rgba(0,0,0,0.35)",
				zIndex: 60,
				display: "flex",
				alignItems: isMobile ? "flex-end" : "center",
				justifyContent: "center",
			}}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: コンテンツ領域のクリック伝播停止のみ */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: クリック伝播停止のみ（キー操作は内部ボタンが担う） */}
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					backgroundColor: w.white,
					borderRadius: isMobile ? "16px 16px 0 0" : 12,
					width: isMobile ? "100%" : 380,
					maxHeight: "70vh",
					display: "flex",
					flexDirection: "column",
					fontFamily: font,
					boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
				}}
			>
				<div
					style={{
						padding: "12px 16px 8px",
						fontSize: 13,
						fontWeight: 700,
						color: w.text,
					}}
				>
					{kindIcon[insertPicker]}{" "}
					{insertPicker === "text"
						? "テキスト"
						: insertPicker === "image"
							? "画像"
							: insertPicker === "button"
								? "ボタン"
								: insertPicker === "separator"
									? "区切り線"
									: "ボックス"}
					をどこに追加しますか？
				</div>
				<div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
					{insertTargets.length === 0 && (
						<p style={{ fontSize: 12, color: w.subText, padding: "0 8px" }}>
							まずセクション（本文など）を作ってください
						</p>
					)}
					{insertTargets.map((entry) => (
						<button
							key={`${entry.path.section}-${entry.path.indices.join("-")}`}
							type="button"
							onClick={() => insertAt(entry.path)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 8,
								width: "100%",
								padding: "10px 10px",
								marginLeft: entry.depth * 10,
								fontSize: 12,
								textAlign: "left",
								backgroundColor: "transparent",
								border: "1px solid transparent",
								borderRadius: 8,
								cursor: "pointer",
								color: w.text,
								fontFamily: font,
							}}
						>
							<span style={{ color: w.green }}>{kindIcon.box}</span>
							<span
								style={{
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{entry.label}
							</span>
						</button>
					))}
				</div>
				<div
					style={{ padding: 8, display: "flex", justifyContent: "flex-end" }}
				>
					<button
						type="button"
						onClick={() => setInsertPicker(null)}
						style={{
							...iconBtn,
							width: "auto",
							padding: "8px 14px",
							fontSize: 12,
						}}
					>
						キャンセル
					</button>
				</div>
			</div>
		</div>
	) : null;

	// ---- ドラッグ ゴースト ----
	const ghost =
		drag &&
		Math.abs(drag.x - drag.startX) + Math.abs(drag.y - drag.startY) >
			DRAG_THRESHOLD ? (
			<div
				aria-hidden
				style={{
					position: "fixed",
					left: drag.x - 20,
					top: drag.y - 20,
					pointerEvents: "none",
					zIndex: 100,
					backgroundColor: w.green,
					color: w.white,
					fontSize: 12,
					fontWeight: 700,
					padding: "8px 14px",
					borderRadius: 8,
					boxShadow: "0 8px 24px rgba(6,199,85,0.4)",
					opacity: 0.92,
					fontFamily: font,
				}}
			>
				{kindIcon[drag.kind]} {drag.label}
			</div>
		) : null;

	// ---- レイヤー ----
	const layerTree = (
		<div
			style={{
				flex: 1,
				overflowY: "auto",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{listNodes(doc.bubble).map((entry) => {
				const selected = isSamePath(doc.selected, entry.path);
				return (
					<button
						key={`${entry.path.section}-${entry.path.indices.join("-")}`}
						type="button"
						onClick={() => doc.select(entry.path)}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							padding: "5px 6px",
							marginLeft: entry.depth * 12,
							fontSize: 11,
							borderRadius: 4,
							cursor: "pointer",
							backgroundColor: selected ? w.greenSoft : "transparent",
							border: `1px solid ${selected ? w.green : "transparent"}`,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
							fontFamily: font,
							color: w.text,
							textAlign: "left",
						}}
					>
						<span
							style={{
								color: entry.node.type === "box" ? w.green : w.subText,
								fontSize: 9,
							}}
						>
							{entry.node.type === "box" ? "▤" : "·"}
						</span>
						{entry.label}
					</button>
				);
			})}
		</div>
	);

	const canvas = (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				padding: isMobile ? 8 : 24,
			}}
		>
			<InteractiveTree
				doc={doc}
				width={
					isMobile
						? Math.min(
								320,
								(typeof window !== "undefined" ? window.innerWidth : 320) - 24,
							)
						: 280
				}
				activeDropPath={dropTargetPath}
				onAddSection={(s) => doc.replace(ensureSection(doc.bubble, s))}
			/>
		</div>
	);

	const inspector = (
		<div style={{ overflowY: "auto", padding: 12, fontFamily: font }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 6,
					marginBottom: 10,
				}}
			>
				<strong style={{ fontSize: 13 }}>
					{doc.selectedNode ? nodeLabel(doc.selectedNode) : "部品を選択"}
				</strong>
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
			</div>
			{doc.lastError && (
				<p
					role="alert"
					style={{ color: w.danger, fontSize: 12, margin: "0 0 8px" }}
				>
					{doc.lastError}
				</p>
			)}
			{doc.selectedNode && doc.selected ? (
				<WysiwygInspector
					node={doc.selectedNode}
					onPatch={(p) => doc.selected && doc.patch(doc.selected, p)}
				/>
			) : (
				<p style={{ fontSize: 12, color: w.subText }}>
					パレットをドラッグ（またはタップ）して部品を追加できます。
				</p>
			)}
		</div>
	);

	if (isMobile) {
		return (
			<div
				style={{
					fontFamily: font,
					height: "100vh",
					display: "flex",
					flexDirection: "column",
					backgroundColor: w.canvasBg,
					color: w.text,
					overflow: "hidden",
				}}
			>
				{/* パレット（横スクロール） */}
				<div
					style={{
						flexShrink: 0,
						backgroundColor: w.white,
						borderBottom: `1px solid ${w.border}`,
						padding: "8px 10px",
					}}
				>
					<div
						style={{
							fontSize: 11,
							fontWeight: 700,
							color: w.subText,
							marginBottom: 6,
						}}
					>
						部品パレット（タップ or ドラッグ）
					</div>
					<div
						style={{
							display: "flex",
							gap: 6,
							overflowX: "auto",
							WebkitOverflowScrolling: "touch",
							paddingBottom: 2,
						}}
					>
						{PALETTE.map(paletteItem)}
					</div>
				</div>

				{/* キャンバス */}
				<div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>{canvas}</div>

				{/* インスペクタ（下部シート） */}
				<div
					style={{
						flexShrink: 0,
						maxHeight: "42vh",
						backgroundColor: w.white,
						borderTop: `1px solid ${w.border}`,
						display: "flex",
						flexDirection: "column",
					}}
				>
					{inspector}
				</div>

				{/* レイヤーはアコーディオンとしてインスペクタ上に折り畳み */}
				{insertPickerNode}
				{ghost}
			</div>
		);
	}

	return (
		<div
			style={{
				fontFamily: font,
				height: "100vh",
				display: "flex",
				backgroundColor: w.canvasBg,
				color: w.text,
			}}
		>
			{/* 左ペイン */}
			<aside
				style={{
					width: 224,
					flexShrink: 0,
					backgroundColor: w.white,
					borderRight: `1px solid ${w.border}`,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					style={{
						padding: "10px 12px 6px",
						fontSize: 11,
						fontWeight: 700,
						color: w.subText,
					}}
				>
					部品パレット（ドラッグ or タップ）
				</div>
				<div style={{ padding: "0 10px" }}>{PALETTE.map(paletteItem)}</div>
				<div
					style={{
						padding: "10px 12px 4px",
						fontSize: 11,
						fontWeight: 700,
						color: w.subText,
						borderTop: `1px solid ${w.border}`,
						marginTop: 8,
					}}
				>
					構造（レイヤー）
				</div>
				{layerTree}
			</aside>

			{/* 中央キャンバス */}
			<main style={{ flex: 1, overflowY: "auto" }}>{canvas}</main>

			{/* 右ペイン */}
			<aside
				style={{
					width: 288,
					flexShrink: 0,
					backgroundColor: w.white,
					borderLeft: `1px solid ${w.border}`,
					display: "flex",
					flexDirection: "column",
				}}
			>
				{inspector}
			</aside>

			{insertPickerNode}
			{ghost}
		</div>
	);
}
