import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlexMessagePreview } from "../components/FlexMessagePreview";
import { DEFAULT_TEXT_COLOR } from "../constants";
import type { FlexBubble } from "../types";

/**
 * 色を指定していない text の既定色。
 *
 * 🚨 由来: `color` を渡さないと inline style の color が空になり、
 *    **ホストページの文字色を継承**していた。吹き出しの背景は `#ffffff` 固定なので、
 *    ダークモードのページに置くと白地に白で読めなくなる（2026-09-12 に実機で発覚）。
 *
 * 🚨 jsdom は hex を `rgb(...)` に正規化する（実測: `#06C755` → `rgb(6, 199, 85)`）。
 *    その書き方を手で書かず、**同じ色を明示した対照**と突き合わせる。
 */
function renderTexts(contents: FlexBubble["body"]) {
	const bubble: FlexBubble = { type: "bubble", body: contents };
	const { container } = render(<FlexMessagePreview json={bubble} />);
	return container;
}

/** その要素から上へ辿って、最初に inline の背景色を持つ祖先を返す */
function nearestBackground(el: HTMLElement): string {
	let cur: HTMLElement | null = el.parentElement;
	while (cur) {
		if (cur.style.backgroundColor !== "") return cur.style.backgroundColor;
		cur = cur.parentElement;
	}
	return "";
}

describe("FlexText の色", () => {
	it("色を指定していない text に既定色が当たる（ホストの色を継承しない）", () => {
		const container = renderTexts({
			type: "box",
			layout: "vertical",
			contents: [
				{ type: "text", text: "未指定" },
				// 🟢 対照: 既定と同じ色を明示したもの。jsdom の正規化を経た値どうしで比べる
				{ type: "text", text: "対照", color: DEFAULT_TEXT_COLOR },
			],
		});
		const [plain, control] = [...container.querySelectorAll("p")];
		expect(plain).toBeDefined();
		expect(control).toBeDefined();

		// 🚨 これが空だと、ページの文字色を継承する（＝ 元のバグ）
		expect((plain as HTMLElement).style.color).not.toBe("");
		expect((plain as HTMLElement).style.color).toBe(
			(control as HTMLElement).style.color,
		);
	});

	it("既定色は吹き出しの背景色と違う（白地に白にならない）", () => {
		const container = renderTexts({
			type: "box",
			layout: "vertical",
			contents: [{ type: "text", text: "未指定" }],
		});
		const p = container.querySelector("p") as HTMLElement;
		const bg = nearestBackground(p);

		// 🟢 対照: 吹き出しの背景色が実際に取れていること（取れないと比較が無意味になる）
		expect(bg).not.toBe("");
		expect(p.style.color).not.toBe("");
		expect(p.style.color).not.toBe(bg);
	});

	it("色を指定した text は、その色のまま（既定で上書きしない）", () => {
		const container = renderTexts({
			type: "box",
			layout: "vertical",
			contents: [
				{ type: "text", text: "緑", color: "#06C755" },
				// 🟢 対照: 既定色のものと**違う値**になること（既定で塗り潰していない証拠）
				{ type: "text", text: "未指定" },
			],
		});
		const [green, plain] = [...container.querySelectorAll("p")];
		expect((green as HTMLElement).style.color).not.toBe("");
		expect((green as HTMLElement).style.color).not.toBe(
			(plain as HTMLElement).style.color,
		);
	});

	it("span は色未指定なら inline color を持たない（親の text から継承する）", () => {
		const container = renderTexts({
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					color: "#06C755",
					contents: [
						{ type: "span", text: "継承" },
						// 🟢 対照: 色を指定した span は inline color を持つ
						{ type: "span", text: "明示", color: "#FF0000" },
					],
				},
			],
		});
		const [inherit, explicit] = [...container.querySelectorAll("span")];
		expect((inherit as HTMLElement).style.color).toBe("");
		expect((explicit as HTMLElement).style.color).not.toBe("");

		// 親の <p> は色を持っているので、継承した span も読める
		const p = container.querySelector("p") as HTMLElement;
		expect(p.style.color).not.toBe("");
	});
});
