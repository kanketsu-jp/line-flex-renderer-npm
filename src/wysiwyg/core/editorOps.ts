import { createNode, getNode, patchNode } from "../../editor/path";
import type { FlexNodePath, InsertableKind } from "../../editor/types";
import type { FlexBubble } from "../../types";

/**
 * parentPath の contents[index] の位置に kind を挿入（Divider の＋位置）。
 * index が末尾を超える場合は末尾に追加。非破壊。
 */
export function insertNodeAt(
	bubble: FlexBubble,
	parentPath: FlexNodePath,
	kind: InsertableKind,
	index: number,
): FlexBubble {
	const parent = getNode(bubble, parentPath);
	if (!parent || parent.type !== "box") return bubble;
	const contents = [...parent.contents];
	contents.splice(
		Math.min(Math.max(index, 0), contents.length),
		0,
		createNode(kind),
	);
	return patchNode(bubble, parentPath, { contents });
}
