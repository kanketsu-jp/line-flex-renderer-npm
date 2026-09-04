import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FlexEditor } from "../editor/FlexEditor";
import { validateFlex } from "../editor/validate";
import type { FlexBubble, FlexCarousel, FlexContainer } from "../types";

const sample: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [
			{ type: "text", text: "こんにちは", wrap: true },
			{ type: "text", text: "ふたつめ", wrap: true },
			{
				type: "button",
				style: "primary",
				action: { type: "uri", label: "予約する", uri: "https://example.com" },
			},
		],
	},
};

describe("FlexEditor", () => {
	it("renders preview with initial value in desktop layout", () => {
		render(<FlexEditor value={sample} forceLayout="desktop" />);
		expect(screen.getByText("こんにちは")).toBeInTheDocument();
	});

	it("does not render tabs in desktop layout", () => {
		render(<FlexEditor value={sample} forceLayout="desktop" />);
		expect(screen.queryAllByRole("tab")).toHaveLength(0);
	});

	it("renders two tabs (preview and edit) in mobile layout with preview active initially", () => {
		render(<FlexEditor value={sample} forceLayout="mobile" />);
		const tabs = screen.getAllByRole("tab");
		expect(tabs).toHaveLength(2);
		expect(screen.getByRole("tab", { name: "プレビュー" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("tab", { name: "編集" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
	});

	it("switches tabs in mobile layout", () => {
		render(<FlexEditor value={sample} forceLayout="mobile" />);
		fireEvent.click(screen.getByRole("tab", { name: "編集" }));
		expect(screen.getByText("組み立て")).toBeInTheDocument();
		expect(screen.queryByText("こんにちは")).toBeNull();
	});

	it("immediately reflects text edit in preview", () => {
		render(<FlexEditor value={sample} forceLayout="desktop" />);
		fireEvent.click(
			screen.getByRole("button", { name: "テキスト: こんにちは" }),
		);
		fireEvent.change(screen.getByLabelText("本文"), {
			target: { value: "変更後のテキスト" },
		});
		// プレビュー（<p>）に新しいテキストが出ていること。
		// getByText は編集フォームの <textarea> にも一致するため、<p> に絞り込む。
		const previewMatches = screen
			.getAllByText("変更後のテキスト")
			.filter((el) => el.tagName === "P");
		expect(previewMatches).toHaveLength(1);

		// 元のテキストはプレビューからも Outline のラベルからも消えていること
		expect(screen.queryByText("こんにちは")).toBeNull();
	});

	it("calls onChange with updated valid JSON when edited", () => {
		const onChange = vi.fn();
		render(
			<FlexEditor value={sample} onChange={onChange} forceLayout="desktop" />,
		);
		expect(onChange).not.toHaveBeenCalled();

		fireEvent.click(
			screen.getByRole("button", { name: "テキスト: こんにちは" }),
		);
		fireEvent.change(screen.getByLabelText("本文"), {
			target: { value: "変更後のテキスト" },
		});

		expect(onChange).toHaveBeenCalled();
		const json = onChange.mock.calls.at(-1)?.[0] as FlexContainer;
		expect(json.type).toBe("bubble");
		expect(JSON.stringify(json)).toContain("変更後のテキスト");
		expect(JSON.stringify(json)).not.toContain("こんにちは");
		expect(
			validateFlex(json).filter((i) => i.severity === "error"),
		).toHaveLength(0);
	});

	it("can insert a component", () => {
		render(<FlexEditor value={sample} forceLayout="desktop" />);
		fireEvent.click(screen.getAllByRole("button", { name: "＋ テキスト" })[0]);
		expect(screen.getByText("テキストを入力")).toBeInTheDocument();
	});

	it("can remove a component", () => {
		render(<FlexEditor value={sample} forceLayout="desktop" />);
		const removeButtons = screen.getAllByRole("button", { name: "削除" });
		fireEvent.click(removeButtons[1]);
		expect(screen.queryByText("こんにちは")).toBeNull();
	});

	it("supports switching bubbles in carousel", () => {
		const second: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [{ type: "text", text: "2枚目", wrap: true }],
			},
		};
		const carousel: FlexCarousel = {
			type: "carousel",
			contents: [sample, second],
		};
		render(<FlexEditor value={carousel} forceLayout="desktop" />);
		const bubble2Button = screen.getByRole("button", { name: "bubble 2" });
		expect(bubble2Button).toBeInTheDocument();

		fireEvent.click(bubble2Button);
		expect(
			screen.getByRole("button", { name: "テキスト: 2枚目" }),
		).toBeInTheDocument();
	});

	it("shows fallback message when no node is selected", () => {
		render(<FlexEditor value={sample} forceLayout="desktop" />);
		expect(
			screen.getByText("左の一覧から編集したい部品を選んでください"),
		).toBeInTheDocument();
	});
});
