import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JsonPanel } from "../editor/JsonPanel";
import type { FlexBubble } from "../types";

/**
 * 🚨 堀池さんの原文（2026-09-07 11:1x）に 1 対 1 で対応させる:
 *   「JSONは…コードブロックを表示。編集はできない。その下に「コピー」と「編集」ボタンがあり、
 *    「編集」を押下すると編集できるようになる。編集モードでは「編集」が「保存」＋「キャンセル」
 *    ボタンになり、「保存」は差分（変更）がないとDisable。入力時、保存時はJSONの型効いて、
 *    ちゃんとFLEX MSGの型になるようにする。保存を押下してもバリデーション。
 *    なので JSONを読み込む 自体がいらない。」
 */

const sample: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [{ type: "text", text: "こんにちは", wrap: true }],
	},
};

const box = () => screen.getByLabelText("Flex メッセージの JSON");

describe("JsonPanel", () => {
	it("コードブロックは 1 つだけで、最初は編集できない", () => {
		render(<JsonPanel container={sample} onImport={vi.fn()} />);
		expect(box()).toHaveAttribute("readonly");
		expect(screen.getAllByLabelText("Flex メッセージの JSON")).toHaveLength(1);
	});

	it("最初は「コピー」と「編集」が出て、「保存」「キャンセル」は出ない", () => {
		render(<JsonPanel container={sample} onImport={vi.fn()} />);
		expect(screen.getByRole("button", { name: "コピー" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "保存" })).toBeNull();
		expect(screen.queryByRole("button", { name: "キャンセル" })).toBeNull();
	});

	it("「編集」を押すと編集できるようになり、ボタンが「保存」「キャンセル」に変わる", () => {
		render(<JsonPanel container={sample} onImport={vi.fn()} />);
		fireEvent.click(screen.getByRole("button", { name: "編集" }));
		expect(box()).not.toHaveAttribute("readonly");
		expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "キャンセル" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "編集" })).toBeNull();
	});

	it("🚨 差分が無ければ「保存」は押せない", () => {
		render(<JsonPanel container={sample} onImport={vi.fn()} />);
		fireEvent.click(screen.getByRole("button", { name: "編集" }));
		expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
		expect(screen.getByText("変更はありません")).toBeInTheDocument();
	});

	it("正しい JSON に変えると「保存」が押せる", () => {
		render(<JsonPanel container={sample} onImport={vi.fn()} />);
		fireEvent.click(screen.getByRole("button", { name: "編集" }));
		const next = { ...sample, size: "mega" };
		fireEvent.change(box(), {
			target: { value: JSON.stringify(next, null, 2) },
		});
		expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
	});

	it("🚨 入力時に型を見る: Flex の形でなければ、打った時点で理由が出る", () => {
		render(<JsonPanel container={sample} onImport={vi.fn()} />);
		fireEvent.click(screen.getByRole("button", { name: "編集" }));
		fireEvent.change(box(), {
			target: { value: JSON.stringify({ type: "box" }, null, 2) },
		});
		expect(screen.getByRole("alert")).toBeInTheDocument();
	});

	it("🚨 壊れた JSON でも落ちず、打った時点で理由が出る", () => {
		render(<JsonPanel container={sample} onImport={vi.fn()} />);
		fireEvent.click(screen.getByRole("button", { name: "編集" }));
		fireEvent.change(box(), { target: { value: "{ broken" } });
		expect(screen.getByRole("alert").textContent).toContain("JSON");
	});

	it("「保存」で onImport が 1 回だけ呼ばれ、読み取り専用に戻る", () => {
		const onImport = vi.fn();
		render(<JsonPanel container={sample} onImport={onImport} />);
		fireEvent.click(screen.getByRole("button", { name: "編集" }));
		const next = { ...sample, size: "mega" };
		fireEvent.change(box(), {
			target: { value: JSON.stringify(next, null, 2) },
		});
		fireEvent.click(screen.getByRole("button", { name: "保存" }));
		expect(onImport).toHaveBeenCalledTimes(1);
		expect(onImport.mock.calls[0]?.[0]).toMatchObject({ size: "mega" });
		expect(box()).toHaveAttribute("readonly");
	});

	it("「キャンセル」で編集前に戻り、onImport は呼ばれない", () => {
		const onImport = vi.fn();
		render(<JsonPanel container={sample} onImport={onImport} />);
		fireEvent.click(screen.getByRole("button", { name: "編集" }));
		fireEvent.change(box(), { target: { value: '{"type":"bubble"}' } });
		fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
		expect(onImport).not.toHaveBeenCalled();
		expect(box()).toHaveAttribute("readonly");
		expect((box() as HTMLTextAreaElement).value).toContain("こんにちは");
	});

	it("🚨 貼り付け専用の別欄は無い（読み込みは「保存」1 つ）", () => {
		render(<JsonPanel container={sample} onImport={vi.fn()} />);
		expect(screen.queryByRole("button", { name: "読み込む" })).toBeNull();
		expect(screen.getAllByRole("textbox")).toHaveLength(1);
	});
});

describe("JsonPanel の保存押下時のバリデーション", () => {
	/**
	 * 🚨 原文「保存を押下してもバリデーション」。
	 *    disabled の条件は差分だけなので、**壊れた JSON でも押せる**。
	 *    押されたところで弾くのがこの守り。
	 */
	it("🚨 壊れた JSON では「保存」を押しても onImport を呼ばない", () => {
		const onImport = vi.fn();
		render(<JsonPanel container={sample} onImport={onImport} />);
		fireEvent.click(screen.getByRole("button", { name: "編集" }));
		fireEvent.change(box(), { target: { value: "{ broken" } });
		const save = screen.getByRole("button", { name: "保存" });
		expect(save).toBeEnabled();
		fireEvent.click(save);
		expect(onImport).not.toHaveBeenCalled();
		expect(box()).not.toHaveAttribute("readonly");
	});

	it("🚨 Flex の型でなければ「保存」を押しても onImport を呼ばない", () => {
		const onImport = vi.fn();
		render(<JsonPanel container={sample} onImport={onImport} />);
		fireEvent.click(screen.getByRole("button", { name: "編集" }));
		fireEvent.change(box(), {
			target: { value: JSON.stringify({ type: "box" }, null, 2) },
		});
		fireEvent.click(screen.getByRole("button", { name: "保存" }));
		expect(onImport).not.toHaveBeenCalled();
	});
});
