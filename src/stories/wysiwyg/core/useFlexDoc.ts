import { useCallback, useMemo, useRef, useState } from "react";
import { countLockedUris } from "../../../editor/lockedUris";
import {
	getNode,
	insertNode,
	moveNode,
	patchNode,
	removeNode,
} from "../../../editor/path";
import type { FlexNodePath, InsertableKind } from "../../../editor/types";
import type {
	FlexBubble,
	FlexComponentType,
	FlexContainer,
} from "../../../types";

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
	remove: (path: FlexNodePath) => void;
	move: (path: FlexNodePath, delta: number) => void;
	duplicate: (path: FlexNodePath) => void;
	replace: (bubble: FlexBubble) => void;
	undo: () => void;
	redo: () => void;
}

const HISTORY_LIMIT = 100;

export function useFlexDoc(
	initial: FlexBubble,
	lockedUris?: string[],
): FlexDoc {
	const [bubble, setBubble] = useState<FlexBubble>(initial);
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
			if (!opts?.keepSelection) {
				setSelected(null);
			}
		},
		[bubble, lockedUris, syncHistoryDepth],
	);

	const undo = useCallback(() => {
		const prev = pastRef.current.pop();
		if (!prev) return;
		futureRef.current = [...futureRef.current, bubble];
		setBubble(prev);
		setSelected(null);
		setLastError(null);
		syncHistoryDepth();
	}, [bubble, syncHistoryDepth]);

	const redo = useCallback(() => {
		const next = futureRef.current.pop();
		if (!next) return;
		pastRef.current = [...pastRef.current, bubble];
		setBubble(next);
		setSelected(null);
		setLastError(null);
		syncHistoryDepth();
	}, [bubble, syncHistoryDepth]);

	const duplicate = useCallback(
		(path: FlexNodePath) => {
			if (path.indices.length === 0) return; // セクション自身は複製しない
			const parentPath: FlexNodePath = {
				section: path.section,
				indices: path.indices.slice(0, -1),
			};
			const parentNode = getNode(bubble, parentPath);
			const node = getNode(bubble, path);
			if (!parentNode || parentNode.type !== "box" || !node) return;
			const index = path.indices[path.indices.length - 1];
			const cloned = structuredClone(node);
			const newContents = [...parentNode.contents];
			newContents.splice(index + 1, 0, cloned);
			commit(patchNode(bubble, parentPath, { contents: newContents }), {
				keepSelection: true,
			});
		},
		[bubble, commit],
	);

	const insert = useCallback(
		(parentPath: FlexNodePath, kind: InsertableKind) => {
			commit(insertNode(bubble, parentPath, kind), { keepSelection: true });
		},
		[bubble, commit],
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
			commit(patchNode(bubble, path, p), { keepSelection: true }),
		insert,
		remove: (path) => commit(removeNode(bubble, path)),
		move: (path, delta) =>
			commit(moveNode(bubble, path, delta), { keepSelection: true }),
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
