import { createNode, getNode, patchNode } from "../../editor/path";
import type {
	FlexNodePath,
	FlexSection,
	InsertableKind,
} from "../../editor/types";
import type { FlexBubble, FlexComponentType } from "../../types";

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

/**
 * bubble ツリーから node と同一（Object.is）のノードを探し、その path を返す。
 * hero も対象。見つからなければ null。
 */
export function findNodePath(
	bubble: FlexBubble,
	node: FlexComponentType,
): FlexNodePath | null {
	const sections: FlexSection[] = ["header", "hero", "body", "footer"];
	for (const section of sections) {
		const root = bubble[section] as FlexComponentType | undefined;
		if (!root) continue;
		if (Object.is(root, node)) return { section, indices: [] };
		if (root.type !== "box") continue;
		const walk = (
			box: FlexComponentType,
			indices: number[],
		): FlexNodePath | null => {
			if (box.type !== "box") return null;
			for (let i = 0; i < box.contents.length; i++) {
				const child = box.contents[i];
				if (Object.is(child, node)) {
					return { section, indices: [...indices, i] };
				}
				if (child.type === "box") {
					const found = walk(child, [...indices, i]);
					if (found) return found;
				}
			}
			return null;
		};
		const found = walk(root, []);
		if (found) return found;
	}
	return null;
}
