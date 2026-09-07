import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlexPreview } from "../components/FlexPreview";
import type { FlexBubble } from "../types";

/**
 * 🚨 堀池さんの原文（2026-09-07 11:2x）:
 *   「お礼メッセージのプレビュー は …/edit の左に表示するプレビューをつかう。
 *    ライブラリ自体にプレビューだけ出せるようにする。」
 * ⇒ エディタの左に出る塊を、そのまま単体で使えるようにしたもの。
 */

const bubble: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [
			{ type: "text", text: "ご回答ありがとうございました", wrap: true },
		],
	},
};

describe("FlexPreview", () => {
	it("中身を描く", () => {
		render(<FlexPreview json={bubble} />);
		expect(
			screen.getByText("ご回答ありがとうございました"),
		).toBeInTheDocument();
	});

	it("既定ではトーク画面の枠で包む", () => {
		render(<FlexPreview json={bubble} accountName="髪にドラマを。" />);
		expect(screen.getByText("髪にドラマを。")).toBeInTheDocument();
	});

	it("🚨 showChatFrame=false なら枠を出さない（枠だけを切れる）", () => {
		render(
			<FlexPreview
				json={bubble}
				accountName="髪にドラマを。"
				showChatFrame={false}
			/>,
		);
		expect(screen.queryByText("髪にドラマを。")).toBeNull();
		expect(
			screen.getByText("ご回答ありがとうございました"),
		).toBeInTheDocument();
	});
});
