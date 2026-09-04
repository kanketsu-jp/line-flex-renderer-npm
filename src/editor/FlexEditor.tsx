import type React from "react";
import { useEffect, useRef, useState } from "react";
import { FlexMessagePreview } from "../components/FlexMessagePreview";
import { LineChatFrame } from "../components/LineChatFrame";
import type { FlexBubble, FlexContainer } from "../types";
import { EditorPanel } from "./EditorPanel";
import { insertNode, moveNode, patchNode, removeNode } from "./path";
import { defaultTemplates } from "./templates";
import {
	buttonStyle,
	editorColors,
	editorFont,
	ghostButtonStyle,
} from "./theme";
import type {
	EditorTemplate,
	FlexEditorProps,
	FlexNodePath,
	InsertableKind,
} from "./types";
import { useIsNarrow } from "./useIsNarrow";

export function FlexEditor(props: FlexEditorProps): React.ReactElement {
	const templates = props.templates ?? defaultTemplates;
	const [container, setContainer] = useState<FlexContainer>(
		() => props.value ?? templates[0].bubble,
	);
	const [selected, setSelected] = useState<FlexNodePath | null>(null);
	const [activeBubbleIndex, setActiveBubbleIndex] = useState(0);
	const [tab, setTab] = useState<"preview" | "edit">("preview");
	const containerRef = useRef<HTMLDivElement>(null);
	const containerJson = JSON.stringify(container);
	const containerJsonRef = useRef(containerJson);
	containerJsonRef.current = containerJson;
	const lastSyncedJsonRef = useRef(containerJson);
	const emittedJsonRef = useRef<Set<string>>(new Set());
	const emittedJsonOrderRef = useRef<string[]>([]);

	useEffect(() => {
		if (!props.value) return;
		const nextValue = props.value;
		const nextJson = JSON.stringify(nextValue);
		if (emittedJsonRef.current.has(nextJson)) return;
		if (nextJson === containerJsonRef.current) return;
		lastSyncedJsonRef.current = nextJson;
		setSelected(null);
		setActiveBubbleIndex(0);
		setContainer(nextValue);
	}, [props.value]);

	const onChangeRef = useRef(props.onChange);
	onChangeRef.current = props.onChange;

	useEffect(() => {
		if (containerJson === lastSyncedJsonRef.current) return;
		lastSyncedJsonRef.current = containerJson;
		if (!emittedJsonRef.current.has(containerJson)) {
			emittedJsonRef.current.add(containerJson);
			emittedJsonOrderRef.current.push(containerJson);
			if (emittedJsonOrderRef.current.length > 200) {
				const oldestJson = emittedJsonOrderRef.current.shift();
				if (oldestJson !== undefined) {
					emittedJsonRef.current.delete(oldestJson);
				}
			}
		}
		onChangeRef.current?.(container);
	}, [container, containerJson]);

	const bubble: FlexBubble =
		container.type === "bubble"
			? container
			: (container.contents[activeBubbleIndex] ??
				container.contents[0] ??
				templates[0].bubble);

	const applyBubble = (next: FlexBubble) => {
		setContainer((prev) =>
			prev.type === "bubble"
				? next
				: {
						...prev,
						contents: prev.contents.map((b, i) =>
							i === activeBubbleIndex ? next : b,
						),
					},
		);
	};

	const onSelect = (path: FlexNodePath) => setSelected(path);
	const onPatch = (path: FlexNodePath, patch: Record<string, unknown>) =>
		applyBubble(patchNode(bubble, path, patch));
	const onMove = (path: FlexNodePath, delta: number) =>
		applyBubble(moveNode(bubble, path, delta));
	const onRemove = (path: FlexNodePath) => {
		applyBubble(removeNode(bubble, path));
		setSelected(null);
	};
	const onInsert = (parentPath: FlexNodePath, kind: InsertableKind) =>
		applyBubble(insertNode(bubble, parentPath, kind));
	const onApplyTemplate = (t: EditorTemplate) => {
		setContainer(t.bubble);
		setSelected(null);
		setActiveBubbleIndex(0);
	};
	const onImportJson = (c: FlexContainer) => {
		setContainer(c);
		setSelected(null);
		setActiveBubbleIndex(0);
	};

	const autoNarrow = useIsNarrow(containerRef, props.mobileBreakpoint ?? 768);
	const narrow = props.forceLayout
		? props.forceLayout === "mobile"
		: autoNarrow;

	const previewNode = (
		<div
			style={{
				backgroundColor: editorColors.previewBg,
				padding: 16,
				borderRadius: 12,
				display: "flex",
				justifyContent: "center",
			}}
		>
			{props.showChatFrame === false ? (
				<FlexMessagePreview json={container} />
			) : (
				<LineChatFrame accountName={props.accountName}>
					<FlexMessagePreview json={container} />
				</LineChatFrame>
			)}
		</div>
	);

	const carouselTabs =
		container.type === "carousel" ? (
			// biome-ignore lint/a11y/useSemanticElements: CONTRACT規定のrole="group"
			<div
				role="group"
				aria-label="編集するbubble"
				style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}
			>
				{container.contents.map((_, i) => (
					<button
						type="button"
						// biome-ignore lint/suspicious/noArrayIndexKey: bubbleの並び順インデックスをkeyに使用
						key={`bubble-${i}`}
						aria-label={`bubble ${i + 1}`}
						style={i === activeBubbleIndex ? buttonStyle : ghostButtonStyle}
						onClick={() => {
							setActiveBubbleIndex(i);
							setSelected(null);
						}}
					>
						{i + 1}
					</button>
				))}
			</div>
		) : null;

	const editorPanel = (
		<EditorPanel
			container={container}
			bubble={bubble}
			selected={selected}
			templates={templates}
			onSelect={onSelect}
			onPatch={onPatch}
			onMove={onMove}
			onRemove={onRemove}
			onInsert={onInsert}
			onApplyTemplate={onApplyTemplate}
			onImportJson={onImportJson}
		/>
	);

	if (!narrow) {
		return (
			<div
				ref={containerRef}
				className={props.className}
				style={{
					fontFamily: editorFont,
					display: "flex",
					flexDirection: "row",
					gap: 16,
					alignItems: "flex-start",
					...props.style,
				}}
			>
				<div style={{ flex: "0 0 auto", position: "sticky", top: 0 }}>
					{carouselTabs}
					{previewNode}
				</div>
				<div style={{ flex: "1 1 auto", minWidth: 0 }}>{editorPanel}</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={props.className}
			style={{
				fontFamily: editorFont,
				display: "flex",
				flexDirection: "column",
				gap: 16,
				...props.style,
			}}
		>
			<div role="tablist" style={{ display: "flex", gap: 4, marginBottom: 12 }}>
				<button
					type="button"
					role="tab"
					aria-selected={tab === "preview"}
					onClick={() => setTab("preview")}
					style={{
						...(tab === "preview" ? buttonStyle : ghostButtonStyle),
						flex: 1,
					}}
				>
					プレビュー
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={tab === "edit"}
					onClick={() => setTab("edit")}
					style={{
						...(tab === "edit" ? buttonStyle : ghostButtonStyle),
						flex: 1,
					}}
				>
					編集
				</button>
			</div>
			{tab === "preview" ? (
				<div>
					{carouselTabs}
					{previewNode}
				</div>
			) : (
				editorPanel
			)}
		</div>
	);
}
