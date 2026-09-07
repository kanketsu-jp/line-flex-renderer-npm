import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorPanel } from "../editor/EditorPanel";
import { defaultTemplates } from "../editor/templates";
import type { FlexBubble } from "../types";

/**
 * 🚨 堀池さんの原文（2026-09-07 11:1x）に 1 対 1 で対応させる:
 *   「左にプレビュー右にアコーディオンで、閉じた状態の「テンプレートから始める」と
 *    開いた状態で「組み立て」と「選んだ部品の設定」と 閉じた状態の「JSON」があるようにする。」
 */

const bubble: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [{ type: "text", text: "こんにちは", wrap: true }],
	},
};

function renderPanel() {
	const { container } = render(
		<EditorPanel
			container={bubble}
			bubble={bubble}
			selected={null}
			templates={defaultTemplates}
			onSelect={vi.fn()}
			onPatch={vi.fn()}
			onMove={vi.fn()}
			onRemove={vi.fn()}
			onInsert={vi.fn()}
			onApplyTemplate={vi.fn()}
			onImportJson={vi.fn()}
		/>,
	);
	return container;
}

/** 見出しの文字から、その節の <details> を引く */
function section(name: string): HTMLDetailsElement {
	const summary = screen.getByText(name);
	const details = summary.closest("details");
	if (!details) throw new Error(`「${name}」が <details> の中にありません`);
	return details as HTMLDetailsElement;
}

describe("EditorPanel のアコーディオン", () => {
	it("節は 4 つとも <details> で出る", () => {
		const container = renderPanel();
		expect(container.querySelectorAll("details")).toHaveLength(4);
	});

	it("🚨 既定の開閉が原文どおり（テンプレ閉・組み立て開・設定開・JSON 閉）", () => {
		renderPanel();
		expect(section("テンプレートから始める").open).toBe(false);
		expect(section("組み立て").open).toBe(true);
		expect(section("選んだ部品の設定").open).toBe(true);
		expect(section("JSON").open).toBe(false);
	});

	it("見出しは <summary>（押して開閉できる）", () => {
		renderPanel();
		for (const name of [
			"テンプレートから始める",
			"組み立て",
			"選んだ部品の設定",
			"JSON",
		]) {
			expect(screen.getByText(name).tagName.toLowerCase()).toBe("summary");
		}
	});
});
