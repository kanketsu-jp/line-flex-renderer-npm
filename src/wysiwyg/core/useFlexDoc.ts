import { useCallback, useMemo, useRef, useState } from "react";
import { countLockedUris } from "../../editor/lockedUris";
import {
	getNode,
	insertNode,
	moveNode,
	patchNode,
	removeNode,
} from "../../editor/path";
import type { FlexNodePath, InsertableKind } from "../../editor/types";
import type { FlexBubble, FlexComponentType, FlexContainer } from "../../types";
import { insertNodeAt as insertNodeAtPosition } from "./editorOps";

/**
 * WYSIWYG プロトタイプ共通のドキュメント状態フック。
 *
 * - bubble と undo/redo 履歴を一元管理
 * - lockedUris ガード（既存 FlexEditor と同じ挙動）
 * - 既存 path.ts の純関数をそのまま利用
 */
export interface FlexDoc {
	bubble: FlexBubble;
	selected: FlexNodePath | null;
	selectedNode: FlexComponentType | undefined;
	canUndo: boolean;
	canRedo: boolean;
	lastError: string | null;
	select: (path: FlexNodePath | null) => void;
	patch: (path: FlexNodePath, patch: Record<string, unknown>) => void;
	insert: (parentPath: FlexNodePath, kind: InsertableKind) => void;
	/** 指定 index の位置に挿入（Divider の＋位置）。常に最新 bubble へ適用 */
	insertNodeAt: (
		parentPath: FlexNodePath,
		kind: InsertableKind,
		index: number,
	) => void;
	remove: (path: FlexNodePath) => void;
	move: (path: FlexNodePath, delta: number) => void;
	duplicate: (path: FlexNodePath) => void;
	replace: (bubble: FlexBubble) => void;
	undo: () => void;
	redo: () => void;
}

const HISTORY_LIMIT = 100;

/** onChange: すべての確定操作（commit/undo/redo）後に最新 bubble で呼ばれる */
export function useFlexDoc(
	initial: FlexBubble,
	lockedUris?: string[],
	onChange?: (bubble: FlexBubble) => void,
): FlexDoc {
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const [bubble, setBubble] = useState<FlexBubble>(initial);
	// 常に最新の bubble を参照する ref（非同期操作中の古いクロージャを防ぐ = M6）
	const bubbleRef = useRef(bubble);
	bubbleRef.current = bubble;
	const [selected, setSelected] = useState<FlexNodePath | null>(null);
	const [lastError, setLastError] = useState<string | null>(null);
	const [historyDepth, setHistoryDepth] = useState({ past: 0, future: 0 });
	const pastRef = useRef<FlexBubble[]>([]);
	const futureRef = useRef<FlexBubble[]>([]);

	const syncHistoryDepth = useCallback(() => {
		setHistoryDepth({
			past: pastRef.current.length,
			future: futureRef.current.length,
		});
	}, []);

	const commit = useCallback(
		(next: FlexBubble | null, opts?: { keepSelection?: boolean }) => {
			if (!next) return;
			if (
				countLockedUris(next, lockedUris) < countLockedUris(bubble, lockedUris)
			) {
				setLastError("このリンクは変更できません");
				return;
			}
			setLastError(null);
			pastRef.current = [...pastRef.current.slice(-HISTORY_LIMIT), bubble];
			futureRef.current = [];
			syncHistoryDepth();
			setBubble(next);
			onChangeRef.current?.(next);
			if (!opts?.keepSelection) {
				setSelected(null);
			}
		},
		[bubble, lockedUris, syncHistoryDepth],
	);

	const undo = useCallback(() => {
		const prev = pastRef.current.pop();
		if (!prev) return;
		futureRef.current = [...futureRef.current, bubbleRef.current];
		setBubble(prev);
		setSelected(null);
		setLastError(null);
		syncHistoryDepth();
		onChangeRef.current?.(prev);
	}, [syncHistoryDepth]);

	const redo = useCallback(() => {
		const next = futureRef.current.pop();
		if (!next) return;
		pastRef.current = [...pastRef.current, bubbleRef.current];
		setBubble(next);
		setSelected(null);
		setLastError(null);
		syncHistoryDepth();
		onChangeRef.current?.(next);
	}, [syncHistoryDepth]);

	const duplicate = useCallback(
		(path: FlexNodePath) => {
			if (path.indices.length === 0) return; // セクション自身は複製しない
			const parentPath: FlexNodePath = {
				section: path.section,
				indices: path.indices.slice(0, -1),
			};
			const parentNode = getNode(bubbleRef.current, parentPath);
			const node = getNode(bubbleRef.current, path);
			if (!parentNode || parentNode.type !== "box" || !node) return;
			const index = path.indices[path.indices.length - 1];
			const cloned = structuredClone(node);
			const newContents = [...parentNode.contents];
			newContents.splice(index + 1, 0, cloned);
			commit(
				patchNode(bubbleRef.current, parentPath, { contents: newContents }),
				{
					keepSelection: true,
				},
			);
		},
		[commit],
	);

	const insert = useCallback(
		(parentPath: FlexNodePath, kind: InsertableKind) => {
			commit(insertNode(bubbleRef.current, parentPath, kind), {
				keepSelection: true,
			});
		},
		[commit],
	);

	const selectedNode = useMemo(
		() => (selected ? getNode(bubble, selected) : undefined),
		[bubble, selected],
	);

	return {
		bubble,
		selected,
		selectedNode,
		canUndo: historyDepth.past > 0,
		canRedo: historyDepth.future > 0,
		lastError,
		select: setSelected,
		patch: (path, p) =>
			commit(patchNode(bubbleRef.current, path, p), { keepSelection: true }),
		insert,
		insertNodeAt: (parentPath, kind, index) =>
			commit(insertNodeAtPosition(bubbleRef.current, parentPath, kind, index), {
				keepSelection: true,
			}),
		remove: (path) => commit(removeNode(bubbleRef.current, path)),
		move: (path, delta) =>
			commit(moveNode(bubbleRef.current, path, delta), { keepSelection: true }),
		duplicate,
		replace: (b) => commit(b),
		undo,
		redo,
	};
}

/**
 * Flex コンテナの JSON シリアライズサイズ（KB）を計算。
 */
export function flexSizeKb(container: FlexContainer): number {
	return new Blob([JSON.stringify(container)]).size / 1024;
}
