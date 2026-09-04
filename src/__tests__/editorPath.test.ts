import { describe, expect, it } from "vitest";
import {
	createNode,
	ensureSection,
	getNode,
	insertNode,
	isSamePath,
	listNodes,
	moveNode,
	nodeLabel,
	patchNode,
	removeNode,
} from "../editor/path";
import type { FlexBubble, FlexText } from "../types";

describe("editor/path", () => {
	const sampleBubble: FlexBubble = {
		type: "bubble",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "ヘッダータイトル",
				},
			],
		},
		hero: {
			type: "image",
			url: "https://example.com/hero.png",
			size: "full",
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "1番目のテキスト",
					color: "#111111",
				},
				{
					type: "text",
					text: "2番目のテキスト",
					color: "#222222",
				},
				{
					type: "box",
					layout: "horizontal",
					contents: [
						{
							type: "text",
							text: "ネストされたテキスト",
						},
					],
				},
			],
		},
		footer: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "button",
					action: {
						type: "uri",
						label: "ボタンラベル",
						uri: "https://example.com",
					},
				},
			],
		},
	};

	// 1. getNode が {section:"body", indices:[0]} で body.contents[0] を返す
	it("getNode: {section: 'body', indices: [0]} で body.contents[0] を返す", () => {
		const node = getNode(sampleBubble, { section: "body", indices: [0] });
		expect(node).toEqual(sampleBubble.body?.contents[0]);
	});

	// 2. getNode が {section:"body", indices:[]} で body の FlexBox 自身を返す
	it("getNode: {section: 'body', indices: []} で body の FlexBox 自身を返す", () => {
		const node = getNode(sampleBubble, { section: "body", indices: [] });
		expect(node).toEqual(sampleBubble.body);
	});

	// 3. getNode が {section:"hero", indices:[]} で hero の FlexImage を返す
	it("getNode: {section: 'hero', indices: []} で hero の FlexImage を返す", () => {
		const node = getNode(sampleBubble, { section: "hero", indices: [] });
		expect(node).toEqual(sampleBubble.hero);
	});

	// 4. patchNode が 元の bubble を変更しない（元オブジェクトのテキストが元のままであることを assert）
	it("patchNode: 元の bubble を変更しない（非破壊であることを確認）", () => {
		const originalText = (sampleBubble.body?.contents[0] as FlexText).text;
		const next = patchNode(
			sampleBubble,
			{ section: "body", indices: [0] },
			{
				text: "更新後テキスト",
			},
		);

		expect((sampleBubble.body?.contents[0] as FlexText).text).toBe(
			originalText,
		);
		expect((next.body?.contents[0] as FlexText).text).toBe("更新後テキスト");
		expect(next).not.toBe(sampleBubble);
	});

	// 5. patchNode に undefined を渡すとそのキーが消える（"color" in node が false）
	it("patchNode: undefined を渡すとそのキーが消える ('color' in node が false)", () => {
		const next = patchNode(
			sampleBubble,
			{ section: "body", indices: [0] },
			{
				color: undefined,
			},
		);
		const node = getNode(next, { section: "body", indices: [0] });
		expect(node).toBeDefined();
		expect("color" in (node as object)).toBe(false);
	});

	// 6. moveNode(bubble, {section:"body",indices:[0]}, 1) で 0 番目と 1 番目が入れ替わる
	it("moveNode: {section: 'body', indices: [0]} を delta: 1 で動かすと 0 番目と 1 番目が入れ替わる", () => {
		const firstText = (sampleBubble.body?.contents[0] as FlexText).text;
		const secondText = (sampleBubble.body?.contents[1] as FlexText).text;

		const next = moveNode(sampleBubble, { section: "body", indices: [0] }, 1);

		expect((next.body?.contents[0] as FlexText).text).toBe(secondText);
		expect((next.body?.contents[1] as FlexText).text).toBe(firstText);
	});

	// 7. moveNode を先頭で -1 したら 同一参照が返る（toBe で assert）
	it("moveNode: 先頭で -1 したら同一参照が返る", () => {
		const next = moveNode(sampleBubble, { section: "body", indices: [0] }, -1);
		expect(next).toBe(sampleBubble);
	});

	// moveNode: 末尾で +1 した場合や indices が空の場合も同一参照が返る
	it("moveNode: 末尾で +1 した場合や indices が空なら同一参照が返る", () => {
		const lastIndex = (sampleBubble.body?.contents.length ?? 1) - 1;
		const nextEnd = moveNode(
			sampleBubble,
			{ section: "body", indices: [lastIndex] },
			1,
		);
		expect(nextEnd).toBe(sampleBubble);

		const nextEmpty = moveNode(
			sampleBubble,
			{ section: "body", indices: [] },
			1,
		);
		expect(nextEmpty).toBe(sampleBubble);
	});

	// 8. removeNode で contents から 1 個消える / indices:[] でセクションごと消える（bubble.footer が undefined）
	it("removeNode: contents から 1 個消える", () => {
		const originalLength = sampleBubble.body?.contents.length ?? 0;
		const next = removeNode(sampleBubble, { section: "body", indices: [0] });

		expect(next.body?.contents.length).toBe(originalLength - 1);
		expect((next.body?.contents[0] as FlexText).text).toBe("2番目のテキスト");
	});

	it("removeNode: indices: [] でセクションごと消える (bubble.footer が undefined)", () => {
		const next = removeNode(sampleBubble, { section: "footer", indices: [] });
		expect(next.footer).toBeUndefined();
		expect(sampleBubble.footer).toBeDefined();
	});

	// 9. insertNode(bubble, {section:"body",indices:[]}, "text") で body.contents が 1 個増え、末尾が createNode("text") と同じ内容
	it("insertNode: {section: 'body', indices: []} に 'text' を追加すると body.contents が 1 個増え、末尾が createNode('text') と同等", () => {
		const originalLength = sampleBubble.body?.contents.length ?? 0;
		const next = insertNode(
			sampleBubble,
			{ section: "body", indices: [] },
			"text",
		);

		expect(next.body?.contents.length).toBe(originalLength + 1);
		const lastItem = next.body?.contents[next.body.contents.length - 1];
		expect(lastItem).toEqual(createNode("text"));
	});

	it("insertNode: FlexBox 以外のノードに対しては元の bubble をそのまま返す", () => {
		const next = insertNode(
			sampleBubble,
			{ section: "hero", indices: [] },
			"text",
		);
		expect(next).toBe(sampleBubble);
	});

	// 10. listNodes の順序と depth（header がある bubble で header → body の順、ネストした box の子が depth 2 になる）
	it("listNodes: header → hero → body → footer の順序と depth（ネストした box の子が depth 2）", () => {
		const nodes = listNodes(sampleBubble);

		// セクション depth 0
		expect(nodes[0]).toEqual({
			path: { section: "header", indices: [] },
			node: sampleBubble.header,
			depth: 0,
			label: "ヘッダー",
		});

		// header の子: depth 1
		expect(nodes[1]).toEqual({
			path: { section: "header", indices: [0] },
			node: sampleBubble.header?.contents[0],
			depth: 1,
			label: "テキスト: ヘッダータイトル",
		});

		// hero: depth 0
		expect(nodes[2]).toEqual({
			path: { section: "hero", indices: [] },
			node: sampleBubble.hero,
			depth: 0,
			label: "メイン画像",
		});

		// body: depth 0
		expect(nodes[3]).toEqual({
			path: { section: "body", indices: [] },
			node: sampleBubble.body,
			depth: 0,
			label: "本文",
		});

		// body の子: depth 1 (ネストされた box は index 2)
		const nestedBoxEntry = nodes.find(
			(n) =>
				n.path.section === "body" &&
				n.path.indices.length === 1 &&
				n.path.indices[0] === 2,
		);
		expect(nestedBoxEntry).toBeDefined();
		expect(nestedBoxEntry?.depth).toBe(1);
		expect(nestedBoxEntry?.label).toBe("グループ（横）");

		// ネストされた box の子: depth 2
		const nestedChildEntry = nodes.find(
			(n) =>
				n.path.section === "body" &&
				n.path.indices.length === 2 &&
				n.path.indices[0] === 2 &&
				n.path.indices[1] === 0,
		);
		expect(nestedChildEntry).toBeDefined();
		expect(nestedChildEntry?.depth).toBe(2);
		expect(nestedChildEntry?.label).toBe("テキスト: ネストされたテキスト");
	});

	// 11. nodeLabel が text / button / box それぞれで契約どおりの日本語を返す
	it("nodeLabel: text / button / box で契約通りの日本語ラベルを返す", () => {
		expect(nodeLabel({ type: "text", text: "短い文" })).toBe(
			"テキスト: 短い文",
		);
		expect(
			nodeLabel({
				type: "text",
				text: "12345678901234567890EXTRA",
			}),
		).toBe("テキスト: 12345678901234567890");
		expect(
			nodeLabel({
				type: "text",
				contents: [{ type: "span", text: "スパン文字" }],
			}),
		).toBe("テキスト: スパン文字");
		expect(nodeLabel({ type: "text" })).toBe("テキスト");

		expect(
			nodeLabel({
				type: "button",
				action: { type: "uri", label: "詳細", uri: "https://example.com" },
			}),
		).toBe("ボタン: 詳細");
		expect(
			nodeLabel({
				type: "button",
				action: { type: "uri", label: "", uri: "https://example.com" },
			}),
		).toBe("ボタン");

		expect(nodeLabel({ type: "box", layout: "vertical", contents: [] })).toBe(
			"グループ（縦）",
		);
		expect(nodeLabel({ type: "box", layout: "horizontal", contents: [] })).toBe(
			"グループ（横）",
		);
		expect(nodeLabel({ type: "box", layout: "baseline", contents: [] })).toBe(
			"グループ（横一列）",
		);

		expect(nodeLabel({ type: "image", url: "https://example.com/a.png" })).toBe(
			"画像",
		);
		expect(nodeLabel({ type: "separator" })).toBe("区切り線");
		expect(nodeLabel({ type: "spacer" })).toBe("余白");
		expect(nodeLabel({ type: "filler" })).toBe("すき間");
		expect(nodeLabel({ type: "icon", url: "https://example.com/i.png" })).toBe(
			"アイコン",
		);
	});

	// 12. isSamePath が同じ内容の別オブジェクトで true、違う indices で false、片方 null で false
	it("isSamePath: 同一パス、異なるパス、null の比較判定", () => {
		expect(
			isSamePath(
				{ section: "body", indices: [0, 1] },
				{ section: "body", indices: [0, 1] },
			),
		).toBe(true);

		expect(
			isSamePath(
				{ section: "body", indices: [0, 1] },
				{ section: "body", indices: [0, 2] },
			),
		).toBe(false);

		expect(
			isSamePath(
				{ section: "body", indices: [0] },
				{ section: "header", indices: [0] },
			),
		).toBe(false);

		expect(isSamePath({ section: "body", indices: [0] }, null)).toBe(false);
		expect(isSamePath(null, { section: "body", indices: [0] })).toBe(false);
		expect(isSamePath(null, null)).toBe(true);
		expect(isSamePath(undefined, undefined)).toBe(true);
	});

	// createNode: 各種ノードの既定値生成
	it("createNode: 契約通りの既定値ノードを生成する", () => {
		const text = createNode("text");
		expect(text).toEqual({
			type: "text",
			text: "テキストを入力",
			wrap: true,
			size: "md",
			color: "#333333",
		});

		const image = createNode("image");
		expect(image).toEqual({
			type: "image",
			url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png",
			size: "full",
			aspectRatio: "20:13",
			aspectMode: "cover",
		});

		const button = createNode("button");
		expect(button).toEqual({
			type: "button",
			style: "primary",
			color: "#06C755",
			height: "md",
			action: {
				type: "uri",
				label: "詳しく見る",
				uri: "https://example.com",
			},
		});

		const separator = createNode("separator");
		expect(separator).toEqual({
			type: "separator",
			margin: "md",
		});

		const box = createNode("box");
		expect(box).toEqual({
			type: "box",
			layout: "vertical",
			spacing: "md",
			contents: [],
		});
	});

	// ensureSection: セクションの存在確認・初期化
	it("ensureSection: 存在しないセクションを追加し、存在するセクションはそのまま返す", () => {
		const bubbleWithoutHero: FlexBubble = {
			type: "bubble",
			body: { type: "box", layout: "vertical", contents: [] },
		};

		const withHero = ensureSection(bubbleWithoutHero, "hero");
		expect(withHero.hero).toEqual(createNode("image"));

		const withHeader = ensureSection(bubbleWithoutHero, "header");
		expect(withHeader.header).toEqual({
			type: "box",
			layout: "vertical",
			contents: [],
		});

		const same = ensureSection(bubbleWithoutHero, "body");
		expect(same).toBe(bubbleWithoutHero);
	});
});
