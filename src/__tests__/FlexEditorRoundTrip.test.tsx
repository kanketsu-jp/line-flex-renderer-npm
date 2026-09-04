import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { FlexEditor } from "../editor/FlexEditor";
import type { FlexBubble, FlexContainer } from "../types";

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

describe("FlexEditor value / onChange round trip", () => {
	it("does not loop when the parent returns a new value object", () => {
		let calls = 0;
		let overflowed = false;

		function Parent() {
			const [json, setJson] = useState<FlexContainer>(sample);
			return (
				<FlexEditor
					value={json}
					onChange={(v) => {
						calls += 1;
						if (calls > 50) {
							overflowed = true;
							return;
						}
						setJson({ ...v } as FlexContainer);
					}}
					forceLayout="desktop"
				/>
			);
		}

		render(<Parent />);
		fireEvent.click(
			screen.getByRole("button", { name: "テキスト: こんにちは" }),
		);
		fireEvent.change(screen.getByLabelText("本文"), {
			target: { value: "変更後" },
		});

		expect(overflowed).toBe(false);
		expect(calls).toBeGreaterThan(0);
		expect(calls).toBeLessThan(10);

		const previewMatches = screen
			.getAllByText("変更後")
			.filter((element) => element.tagName === "P");
		expect(previewMatches).toHaveLength(1);
	});
});
