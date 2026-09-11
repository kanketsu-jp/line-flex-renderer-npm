import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LineTextBubble } from "../components/LineTextBubble";
import { DEFAULT_TEXT_COLOR } from "../constants";

describe("LineTextBubble", () => {
	it("renders text", () => {
		render(<LineTextBubble text="Hello!" />);
		expect(screen.getByText("Hello!")).toBeInTheDocument();
	});

	it("preserves newlines with pre-wrap", () => {
		const { container } = render(<LineTextBubble text={"Line 1\nLine 2"} />);
		const el = container.firstElementChild as HTMLElement;
		expect(el.style.whiteSpace).toBe("pre-wrap");
		expect(el.textContent).toContain("Line 1\nLine 2");
	});

	/**
	 * 🚨 文字色と背景色は**セットで**見る。片方だけ変えると読めなくなるため
	 *    （Flex の text が既定色を持たず白地に白になった 2026-09-12 の不具合と同じ形）。
	 * 🚨 jsdom は hex を `rgb(...)` に正規化するので、その書き方を手で書かず
	 *    同じ色を当てた要素と突き合わせる。
	 */
	it("背景と文字色が違う（既定色は DEFAULT_TEXT_COLOR）", () => {
		const { container } = render(<LineTextBubble text="Hello!" />);
		const el = container.firstElementChild as HTMLElement;

		// 🟢 対照: 同じ色を当てた要素。正規化を経た値どうしで比べる
		const probe = document.createElement("div");
		probe.style.color = DEFAULT_TEXT_COLOR;

		expect(el.style.color).toBe(probe.style.color);
		expect(el.style.backgroundColor).not.toBe("");
		expect(el.style.color).not.toBe(el.style.backgroundColor);
	});
});
