import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FlexBubble } from "../types";
import { FlexWysiwygEditor } from "../wysiwyg/editor/FlexWysiwygEditor";

/**
 * WYSIWYG 昇格の受入テスト（REVIEW §3-D 準拠）。
 * 1. 幅によるレイアウト切替（B5 回帰）
 * 2. preview で編集不能（B6 回帰）
 * 3. Divider ＋ → 部品選択 → 挿入と onChange（1 回）
 * 4. lockedUris の拒否と alert
 * 5. undo/redo の onChange
 * 7. PC 右パネルから onImageUpload（M5）
 */

const emptyBubble: FlexBubble = {
	type: "bubble",
	body: { type: "box", layout: "vertical", spacing: "md", contents: [] },
};

const textBubble: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [{ type: "text", text: "こんにちは" }],
	},
};

const lockedBubble: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [
			{
				type: "button",
				style: "link",
				action: {
					type: "uri",
					label: "詳細",
					uri: "https://locked.example.com",
				},
			},
		],
	},
};

const imageBubble: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [{ type: "image", url: "https://example.com/a.png" }],
	},
};

type TestGlobals = {
	__setContainerWidth: (width: number) => void;
	__roInstances: unknown[];
	__containerWidth: number;
};
const g = () => globalThis as unknown as TestGlobals;

function bothContents(): FlexBubble {
	return {
		type: "bubble",
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{ type: "image", url: "https://example.com/a.png" },
				{ type: "text", text: "元のテキスト" },
			],
		},
	};
}

function setWidth(w: number) {
	act(() => {
		g().__setContainerWidth(w);
	});
}

beforeEach(() => {
	g().__roInstances = [];
	g().__containerWidth = 390;
});

describe("FlexWysiwygEditor 昇格受入", () => {
	it("1-a. 幅 1200 で PC レイアウト（aside 右パネル）が出る", () => {
		g().__containerWidth = 1200;
		render(<FlexWysiwygEditor value={textBubble} />);
		expect(document.querySelector("aside")).not.toBeNull();
	});

	it("1-b. 幅 380 では aside が出ない（SP レイアウトの確認）", () => {
		g().__containerWidth = 380;
		render(<FlexWysiwygEditor value={textBubble} />);
		expect(document.querySelector("aside")).toBeNull();
	});

	it("1-c. 幅を後から広げると PC レイアウトへ切替わる", () => {
		g().__containerWidth = 380;
		render(<FlexWysiwygEditor value={textBubble} />);
		expect(document.querySelector("aside")).toBeNull();
		setWidth(1200);
		expect(document.querySelector("aside")).not.toBeNull();
	});

	it("2. preview で編集不能: data-flex-path 無し・＋無し（B6 回帰）", () => {
		const onChange = vi.fn();
		render(
			<FlexWysiwygEditor value={textBubble} preview onChange={onChange} />,
		);
		// ＋スロット非表示（Divider の挿入UI）
		expect(
			screen.queryByRole("button", { name: "ここに部品を追加" }),
		).toBeNull();
		// preview 中は選択の受け皿（data-flex-path を持つ部品）自体が存在しない
		expect(document.querySelector("[data-flex-path]")).toBeNull();
	});

	it("7-b. アップロード中に他の部品を編集しても上書きされない（M6 回帰）", async () => {
		g().__containerWidth = 1200;
		const onChange = vi.fn();
		let resolveUpload: (url: string) => void = () => {};
		const onUpload = vi
			.fn<(file: File) => Promise<string>>()
			.mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveUpload = resolve; // アップロードを意図的に保留
					}),
			);
		const both = bothContents();
		render(
			<FlexWysiwygEditor
				value={both}
				onChange={onChange}
				onImageUpload={onUpload}
			/>,
		);

		// 画像のアップロードを開始（完了は保留）
		const imageNode = document.querySelector('[data-flex-type="image"]');
		expect(imageNode).not.toBeNull();
		fireEvent.click(imageNode);
		const aside = document.querySelector("aside");
		expect(aside).not.toBeNull();
		const fileInput = aside?.querySelector('input[type="file"]');
		expect(fileInput).not.toBeNull();
		fireEvent.change(fileInput ?? {}, {
			target: { files: [new File(["x"], "a.png", { type: "image/png" })] },
		});

		// アップロード保留中に、別の部品（テキスト）を「内容変更」で編集
		const textNode = document.querySelector('[data-flex-type="text"]');
		expect(textNode).not.toBeNull();
		fireEvent.click(textNode);
		const aside2 = document.querySelector("aside");
		const textArea = aside2?.querySelector("textarea");
		expect(textArea).not.toBeNull();
		fireEvent.change(textArea ?? {}, { target: { value: "編集後のテキスト" } });
		await waitFor(() => {
			const edited = onChange.mock.calls.at(-1)?.[0] as FlexBubble;
			expect((edited.body?.contents?.[1] as { text?: string }).text).toBe(
				"編集後のテキスト",
			);
		});

		// アップロードを完了 → テキストの編集が上書きで消えてはならない（M6 の核心）
		resolveUpload("https://cdn.example.com/up.png");
		await waitFor(() => {
			const last = onChange.mock.calls.at(-1)?.[0] as FlexBubble;
			expect((last.body?.contents?.[0] as { url?: string }).url).toBe(
				"https://cdn.example.com/up.png",
			);
			expect((last.body?.contents?.[1] as { text?: string }).text).toBe(
				"編集後のテキスト",
			);
		});
	});

	it("2-b. preview でなくあれば data-flex-path がある（対照）", () => {
		render(<FlexWysiwygEditor value={textBubble} />);
		expect(document.querySelector("[data-flex-path]")).not.toBeNull();
	});

	it("2-c. 編集モードなら Delete が部品へ届いて onChange が 1 回（2 の対照）", () => {
		g().__containerWidth = 1200;
		const onChange = vi.fn();
		render(<FlexWysiwygEditor value={textBubble} onChange={onChange} />);
		const node = document.querySelector('[data-flex-type="text"]');
		expect(node).not.toBeNull();
		fireEvent.click(node);
		fireEvent.keyDown(node, { key: "Delete" });
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it("3. Divider ＋ → 部品選択 → 挿入され onChange が 1 回だけ呼ばれる", async () => {
		g().__containerWidth = 1200;
		const onChange = vi.fn();
		render(<FlexWysiwygEditor value={emptyBubble} onChange={onChange} />);
		// Divider の＋
		const plus = screen
			.getAllByRole("button", { name: "ここに部品を追加" })
			.at(0);
		expect(plus).toBeDefined();
		fireEvent.click(plus ?? {});
		// 部品選択シート
		const item = await screen.findByRole("button", { name: /テキスト/ });
		fireEvent.click(item);
		// 挿入されて onChange が 1 回
		await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
		const next = onChange.mock.calls[0][0] as FlexBubble;
		expect(next.body?.contents).toHaveLength(1);
		expect(next.body?.contents?.[0]?.type).toBe("text");
	});

	it("4. lockedUris のボタンは Delete しても消えず、alert が出る", () => {
		g().__containerWidth = 1200;
		const onChange = vi.fn();
		render(
			<FlexWysiwygEditor
				value={lockedBubble}
				lockedUris={["https://locked.example.com"]}
				onChange={onChange}
			/>,
		);
		// ボタン部品を選択（body セクションではなく button ノード）
		const node = document.querySelector('[data-flex-type="button"]');
		expect(node).not.toBeNull();
		fireEvent.click(node);
		// Delete キーで削除試行 → ガードで拒否
		fireEvent.keyDown(node, { key: "Delete" });
		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"このリンクは変更できません",
		);
	});

	it("4-b. SP の編集シートでも lockedUris のリンク欄が disabled（M7 回帰）", async () => {
		g().__containerWidth = 380; // SP
		const onChange = vi.fn();
		render(
			<FlexWysiwygEditor
				value={lockedBubble}
				lockedUris={["https://locked.example.com"]}
				onChange={onChange}
			/>,
		);
		const node = document.querySelector('[data-flex-type="button"]');
		expect(node).not.toBeNull();
		fireEvent.click(node);
		// SP は「編集」ボタンからシートを開く
		fireEvent.click(screen.getByRole("button", { name: "編集" }));
		// シート内の URI 入力欄が disabled
		const sheet = await screen.findByRole("dialog");
		const uriInput = Array.from(sheet.querySelectorAll("input")).find((el) =>
			(el as HTMLInputElement).value.includes("locked.example.com"),
		);
		expect(uriInput).not.toBeNull();
		expect(uriInput).toBeDisabled();
	});

	it("P3. 末尾の＋で挿入すると、挿入した部品が選択される（NB1 回帰）", async () => {
		g().__containerWidth = 1200;
		const onChange = vi.fn();
		const one: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [{ type: "text", text: "A" }],
			},
		};
		render(<FlexWysiwygEditor value={one} onChange={onChange} />);
		const pluses = screen.getAllByRole("button", { name: "ここに部品を追加" });
		fireEvent.click(pluses.at(-1) ?? {});
		fireEvent.click(await screen.findByRole("button", { name: /テキスト/ }));
		await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
		const next = onChange.mock.calls[0][0] as FlexBubble;
		expect(next.body?.contents).toHaveLength(2);
		// 選択されているのは挿入した側（indices [1]）。outline 2px solid の要素で確認
		const selected = [...document.querySelectorAll("[data-flex-path]")].filter(
			(e) => (e as HTMLElement).style.outline.startsWith("2px solid"),
		);
		expect(selected).toHaveLength(1);
		expect(selected[0]?.getAttribute("data-flex-path")).toBe(
			JSON.stringify({ section: "body", indices: [1] }),
		);
	});

	it("P4. 空の box に挿入すると、挿入した部品が選択される（NB1 回帰）", async () => {
		g().__containerWidth = 1200;
		const onChange = vi.fn();
		render(<FlexWysiwygEditor value={emptyBubble} onChange={onChange} />);
		fireEvent.click(
			screen.getAllByRole("button", { name: "ここに部品を追加" })[0] ?? {},
		);
		fireEvent.click(await screen.findByRole("button", { name: /テキスト/ }));
		await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
		const selected = [...document.querySelectorAll("[data-flex-path]")].filter(
			(e) => (e as HTMLElement).style.outline.startsWith("2px solid"),
		);
		expect(selected).toHaveLength(1);
		expect(selected[0]?.getAttribute("data-flex-path")).toBe(
			JSON.stringify({ section: "body", indices: [0] }),
		);
	});

	it("P1. アップロード完了後の undo は 1 手前（テキスト編集後・画像は元）へ戻る（NM1 回帰）", async () => {
		g().__containerWidth = 1200;
		const onChange = vi.fn();
		let resolveUpload: (url: string) => void = () => {};
		const onUpload = vi
			.fn<(file: File) => Promise<string>>()
			.mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveUpload = resolve;
					}),
			);
		render(
			<FlexWysiwygEditor
				value={bothContents()}
				onChange={onChange}
				onImageUpload={onUpload}
			/>,
		);
		// 画像のアップロードを開始（保留）
		const imageNode = document.querySelector('[data-flex-type="image"]');
		fireEvent.click(imageNode);
		const fileInput = document.querySelector('aside input[type="file"]');
		fireEvent.change(fileInput ?? {}, {
			target: { files: [new File(["x"], "a.png", { type: "image/png" })] },
		});
		// 保留中にテキストを編集
		const textNode = document.querySelector('[data-flex-type="text"]');
		fireEvent.click(textNode);
		fireEvent.change(document.querySelector("aside textarea") ?? {}, {
			target: { value: "編集後のテキスト" },
		});
		await waitFor(() =>
			expect(
				(onChange.mock.calls.at(-1)?.[0] as FlexBubble).body?.contents?.[1],
			).toMatchObject({ text: "編集後のテキスト" }),
		);
		// アップロード完了 → undo は「テキスト編集後・画像は元」へ戻る
		resolveUpload("https://cdn.example.com/up.png");
		await waitFor(() =>
			expect(
				(onChange.mock.calls.at(-1)?.[0] as FlexBubble).body?.contents?.[0],
			).toMatchObject({ url: "https://cdn.example.com/up.png" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "元に戻す" }));
		const undone = onChange.mock.calls.at(-1)?.[0] as FlexBubble;
		expect(undone.body?.contents?.[0]).toMatchObject({
			url: "https://example.com/a.png",
		});
		expect(undone.body?.contents?.[1]).toMatchObject({
			text: "編集後のテキスト",
		});
	});

	it("P2. アップロード中に画像を削除すると、完了時に別の部品へ url が書かれない（NM2 回帰）", async () => {
		g().__containerWidth = 1200;
		const onChange = vi.fn();
		let resolveUpload: (url: string) => void = () => {};
		const onUpload = vi
			.fn<(file: File) => Promise<string>>()
			.mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveUpload = resolve;
					}),
			);
		render(
			<FlexWysiwygEditor
				value={bothContents()}
				onChange={onChange}
				onImageUpload={onUpload}
			/>,
		);
		const imageNode = document.querySelector('[data-flex-type="image"]');
		fireEvent.click(imageNode);
		const fileInput = document.querySelector('aside input[type="file"]');
		fireEvent.change(fileInput ?? {}, {
			target: { files: [new File(["x"], "a.png", { type: "image/png" })] },
		});
		// 保留中に画像を削除
		fireEvent.keyDown(imageNode, { key: "Delete" });
		await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
		// 完了しても text へ url が書き込まれない
		resolveUpload("https://cdn.example.com/up.png");
		await new Promise((r) => setTimeout(r, 50));
		const last = onChange.mock.calls.at(-1)?.[0] as FlexBubble;
		expect((last.body?.contents?.[0] as { url?: string }).url).toBeUndefined();
	});

	it("5-a. undo で onChange が呼ばれ、テキストが戻る", async () => {
		g().__containerWidth = 1200;
		const onChange = vi.fn();
		render(<FlexWysiwygEditor value={textBubble} onChange={onChange} />);
		// テキスト部品を選択して削除（body セクションでなく text ノード）
		const node = document.querySelector('[data-flex-type="text"]');
		expect(node).not.toBeNull();
		fireEvent.click(node);
		fireEvent.keyDown(node, { key: "Delete" });
		await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
		// undo
		fireEvent.click(screen.getByRole("button", { name: "元に戻す" }));
		await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
		const undone = onChange.mock.calls[1][0] as FlexBubble;
		expect(undone.body?.contents).toHaveLength(1);
	});

	it("7. PC 右パネルの画像は onImageUpload を呼ぶ（M5 回帰）", async () => {
		g().__containerWidth = 1200;
		const onChange = vi.fn();
		const onUpload = vi
			.fn<(file: File) => Promise<string>>()
			.mockResolvedValue("https://cdn.example.com/up.png");
		render(
			<FlexWysiwygEditor
				value={imageBubble}
				onChange={onChange}
				onImageUpload={onUpload}
			/>,
		);
		// 画像部品を選択（image ノード）
		const node = document.querySelector('[data-flex-type="image"]');
		expect(node).not.toBeNull();
		fireEvent.click(node);
		// 右パネル（aside）に file input がある
		const aside = document.querySelector("aside");
		expect(aside).not.toBeNull();
		const fileInput = aside.querySelector('input[type="file"]');
		expect(fileInput).not.toBeNull();
		// アップロードを実行
		const file = new File(["x"], "a.png", { type: "image/png" });
		fireEvent.change(fileInput ?? {}, { target: { files: [file] } });
		await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
		const next = onChange.mock.calls[0][0] as FlexBubble;
		expect((next.body?.contents?.[0] as { url?: string }).url).toBe(
			"https://cdn.example.com/up.png",
		);
	});
});
