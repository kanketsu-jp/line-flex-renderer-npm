import type {
	FlexBox,
	FlexBubble,
	FlexComponentType,
	FlexImage,
} from "../types";
import type {
	FlexNodeEntry,
	FlexNodePath,
	FlexSection,
	InsertableKind,
} from "./types";
import { SECTION_LABELS } from "./types";

/**
 * bubble 内の指定したパスにあるノードを取得する。
 * indices が空の場合はそのセクション自身（header/body/footer なら FlexBox、hero なら FlexImage）を返す。
 * 見つからない場合は undefined を返す。
 */
export function getNode(
	bubble: FlexBubble,
	path: FlexNodePath,
): FlexComponentType | undefined {
	const root = bubble[path.section];
	if (!root) {
		return undefined;
	}

	if (path.indices.length === 0) {
		return root;
	}

	if (root.type !== "box") {
		return undefined;
	}

	let current: FlexComponentType = root;
	for (const index of path.indices) {
		if (current.type !== "box") {
			return undefined;
		}
		const next: FlexComponentType | undefined = current.contents[index];
		if (!next) {
			return undefined;
		}
		current = next;
	}
	return current;
}

/**
 * ノードに patch を適用して新オブジェクトを生成する。
 * patch のキーの値が undefined の場合はそのキーを削除したオブジェクトを組み立てる。
 */
function applyPatch<T extends object>(
	node: T,
	patch: Record<string, unknown>,
): T {
	const result: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(node)) {
		if (!(k in patch)) {
			result[k] = v;
		}
	}
	for (const [k, v] of Object.entries(patch)) {
		if (v !== undefined) {
			result[k] = v;
		}
	}
	return result as unknown as T;
}

/**
 * FlexBox 内の子孫ノードを再帰的に更新する純関数ヘルパー。
 * updater が undefined を返した場合はそのノードを親の contents から削除する。
 * 見つからなければ null を返す。
 */
function updateNodeInBox(
	box: FlexBox,
	indices: number[],
	updater: (target: FlexComponentType) => FlexComponentType | undefined,
): FlexBox | null {
	if (indices.length === 0) {
		const updated = updater(box);
		if (!updated || updated.type !== "box") {
			return null;
		}
		return updated;
	}

	const [currentIndex, ...restIndices] = indices;
	if (currentIndex < 0 || currentIndex >= box.contents.length) {
		return null;
	}

	const targetChild = box.contents[currentIndex];

	if (restIndices.length === 0) {
		const updatedChild = updater(targetChild);
		const newContents = [...box.contents];
		if (updatedChild === undefined) {
			newContents.splice(currentIndex, 1);
		} else {
			newContents[currentIndex] = updatedChild;
		}
		return { ...box, contents: newContents };
	}

	if (targetChild.type !== "box") {
		return null;
	}

	const updatedChildBox = updateNodeInBox(targetChild, restIndices, updater);
	if (!updatedChildBox) {
		return null;
	}

	const newContents = [...box.contents];
	newContents[currentIndex] = updatedChildBox;
	return { ...box, contents: newContents };
}

/**
 * patch のキーを差分マージ。値が undefined のキーはノードから削除する。
 * 見つからなければ元の bubble をそのまま返す。非破壊。
 */
export function patchNode(
	bubble: FlexBubble,
	path: FlexNodePath,
	patch: Record<string, unknown>,
): FlexBubble {
	const root = bubble[path.section];
	if (!root) {
		return bubble;
	}

	if (path.indices.length === 0) {
		if (path.section === "hero") {
			return {
				...bubble,
				hero: applyPatch(root, patch) as FlexImage,
			};
		}
		return {
			...bubble,
			[path.section]: applyPatch(root, patch) as FlexBox,
		};
	}

	if (root.type !== "box") {
		return bubble;
	}

	const updatedRoot = updateNodeInBox(root, path.indices, (target) =>
		applyPatch(target, patch),
	);

	if (!updatedRoot) {
		return bubble;
	}

	return {
		...bubble,
		[path.section]: updatedRoot,
	};
}

/**
 * indices が空 = そのセクションごと削除（bubble[section] を undefined に）。
 * 見つからなければ元の bubble をそのまま返す。非破壊。
 */
export function removeNode(bubble: FlexBubble, path: FlexNodePath): FlexBubble {
	const root = bubble[path.section];
	if (!root) {
		return bubble;
	}

	if (path.indices.length === 0) {
		const next = { ...bubble };
		delete next[path.section];
		return next;
	}

	if (root.type !== "box") {
		return bubble;
	}

	const updatedRoot = updateNodeInBox(root, path.indices, () => undefined);
	if (!updatedRoot) {
		return bubble;
	}

	return {
		...bubble,
		[path.section]: updatedRoot,
	};
}

/**
 * 同じ親の中で delta（-1 上 / +1 下）動かす。
 * 端・indices が空なら元の bubble をそのまま返す。非破壊。
 */
export function moveNode(
	bubble: FlexBubble,
	path: FlexNodePath,
	delta: number,
): FlexBubble {
	if (path.indices.length === 0 || delta === 0) {
		return bubble;
	}

	const parentIndices = path.indices.slice(0, -1);
	const childIndex = path.indices[path.indices.length - 1];

	const parentNode = getNode(bubble, {
		section: path.section,
		indices: parentIndices,
	});

	if (!parentNode || parentNode.type !== "box") {
		return bubble;
	}

	const targetIndex = childIndex + delta;
	if (
		childIndex < 0 ||
		childIndex >= parentNode.contents.length ||
		targetIndex < 0 ||
		targetIndex >= parentNode.contents.length
	) {
		return bubble;
	}

	const newContents = [...parentNode.contents];
	const [item] = newContents.splice(childIndex, 1);
	newContents.splice(targetIndex, 0, item);
	const updatedParentBox: FlexBox = { ...parentNode, contents: newContents };

	if (parentIndices.length === 0) {
		return {
			...bubble,
			[path.section]: updatedParentBox,
		};
	}

	const root = bubble[path.section];
	if (!root || root.type !== "box") {
		return bubble;
	}

	const updatedRoot = updateNodeInBox(
		root,
		parentIndices,
		() => updatedParentBox,
	);

	if (!updatedRoot) {
		return bubble;
	}

	return {
		...bubble,
		[path.section]: updatedRoot,
	};
}

/**
 * parentPath が指す FlexBox の contents 末尾に createNode(kind) を足す。
 * FlexBox でなければ元の bubble をそのまま返す。非破壊。
 */
export function insertNode(
	bubble: FlexBubble,
	parentPath: FlexNodePath,
	kind: InsertableKind,
): FlexBubble {
	const parentNode = getNode(bubble, parentPath);
	if (!parentNode || parentNode.type !== "box") {
		return bubble;
	}

	const newNode = createNode(kind);
	const updatedParentBox: FlexBox = {
		...parentNode,
		contents: [...parentNode.contents, newNode],
	};

	if (parentPath.indices.length === 0) {
		return {
			...bubble,
			[parentPath.section]: updatedParentBox,
		};
	}

	const root = bubble[parentPath.section];
	if (!root || root.type !== "box") {
		return bubble;
	}

	const updatedRoot = updateNodeInBox(
		root,
		parentPath.indices,
		() => updatedParentBox,
	);

	if (!updatedRoot) {
		return bubble;
	}

	return {
		...bubble,
		[parentPath.section]: updatedRoot,
	};
}

/**
 * 指定した種類の既定コンポーネントを新規作成して返す。
 */
export function createNode(kind: InsertableKind): FlexComponentType {
	switch (kind) {
		case "text":
			return {
				type: "text",
				text: "テキストを入力",
				wrap: true,
				size: "md",
				color: "#333333",
			};
		case "image":
			return {
				type: "image",
				url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png",
				size: "full",
				aspectRatio: "20:13",
				aspectMode: "cover",
			};
		case "button":
			return {
				type: "button",
				style: "primary",
				color: "#06C755",
				height: "md",
				action: {
					type: "uri",
					label: "詳しく見る",
					uri: "https://example.com",
				},
			};
		case "separator":
			return {
				type: "separator",
				margin: "md",
			};
		case "box":
			return {
				type: "box",
				layout: "vertical",
				spacing: "md",
				contents: [],
			};
	}
}

/**
 * header→hero→body→footer の順、存在するものだけ。
 * 各セクションは depth 0 の自分自身 → 子孫を深さ優先でリストアップする。
 */
export function listNodes(bubble: FlexBubble): FlexNodeEntry[] {
	const entries: FlexNodeEntry[] = [];
	const sections: FlexSection[] = ["header", "hero", "body", "footer"];

	for (const section of sections) {
		const root = bubble[section];
		if (!root) {
			continue;
		}

		entries.push({
			path: { section, indices: [] },
			node: root,
			depth: 0,
			label: SECTION_LABELS[section],
		});

		if (root.type === "box") {
			const walk = (box: FlexBox, indices: number[], depth: number) => {
				for (let i = 0; i < box.contents.length; i++) {
					const child = box.contents[i];
					const childIndices = [...indices, i];
					entries.push({
						path: { section, indices: childIndices },
						node: child,
						depth,
						label: nodeLabel(child),
					});
					if (child.type === "box") {
						walk(child, childIndices, depth + 1);
					}
				}
			};
			walk(root, [], 1);
		}
	}

	return entries;
}

/**
 * 2 つのノードパスが同じ位置を指しているかどうかを判定する。
 */
export function isSamePath(
	a: FlexNodePath | null | undefined,
	b: FlexNodePath | null | undefined,
): boolean {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.section !== b.section) {
		return false;
	}
	if (a.indices.length !== b.indices.length) {
		return false;
	}
	return a.indices.every((val, idx) => val === b.indices[idx]);
}

/**
 * ノードの日本語ラベル（listNodes の depth>0 で使う）を返す。
 */
export function nodeLabel(node: FlexComponentType): string {
	switch (node.type) {
		case "text": {
			let textContent = node.text;
			if (
				(textContent === undefined || textContent === "") &&
				node.contents &&
				node.contents.length > 0
			) {
				textContent = node.contents.map((span) => span.text ?? "").join("");
			}
			if (!textContent) {
				return "テキスト";
			}
			const preview = textContent.slice(0, 20);
			return `テキスト: ${preview}`;
		}
		case "image":
			return "画像";
		case "button": {
			const label = node.action?.label;
			if (label) {
				return `ボタン: ${label}`;
			}
			return "ボタン";
		}
		case "box": {
			if (node.layout === "vertical") {
				return "グループ（縦）";
			}
			if (node.layout === "horizontal") {
				return "グループ（横）";
			}
			if (node.layout === "baseline") {
				return "グループ（横一列）";
			}
			return "グループ";
		}
		case "separator":
			return "区切り線";
		case "spacer":
			return "余白";
		case "filler":
			return "すき間";
		case "icon":
			return "アイコン";
	}
}

/**
 * section が無ければ空の器を作って返す（header/body/footer: 空の縦 box、hero: createNode("image")）。
 */
export function ensureSection(
	bubble: FlexBubble,
	section: FlexSection,
): FlexBubble {
	if (bubble[section]) {
		return bubble;
	}

	if (section === "hero") {
		return {
			...bubble,
			hero: createNode("image") as FlexImage,
		};
	}

	return {
		...bubble,
		[section]: {
			type: "box",
			layout: "vertical",
			contents: [],
		},
	};
}
