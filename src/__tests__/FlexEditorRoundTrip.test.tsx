import { fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
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

const makeDefault = (): FlexContainer => ({
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [{ type: "text", text: "こんにちは", wrap: true }],
	},
});

describe("FlexEditor value / onChange round trip", () => {
	it("StrictMode でマウントしただけでは onChange が呼ばれない", () => {
		let calls = 0;
		render(
			<StrictMode>
				<FlexEditor
					value={sample}
					onChange={() => {
						calls += 1;
					}}
					forceLayout="desktop"
				/>
			</StrictMode>,
		);
		expect(calls).toBe(0);
	});

	it("StrictMode でなくてもマウントだけでは onChange が呼ばれない", () => {
		let calls = 0;
		render(
			<FlexEditor
				value={makeDefault()}
				onChange={() => {
					calls += 1;
				}}
				forceLayout="desktop"
			/>,
		);
		expect(calls).toBe(0);
	});

	it("StrictMode で編集してもループしない", () => {
		let calls = 0;
		let overflowed = false;
		function Parent() {
			const [json, setJson] = useState<FlexContainer>(makeDefault());
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
		render(
			<StrictMode>
				<Parent />
			</StrictMode>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "テキスト: こんにちは" }),
		);
		fireEvent.change(screen.getByLabelText("本文"), {
			target: { value: "変更後です1234567890" },
		});
		expect(overflowed).toBe(false);
		expect(calls).toBeLessThan(10);
	});

	it("親が value を毎レンダー作り直しても止まる", () => {
		let calls = 0;
		let overflowed = false;
		function Parent() {
			const [, setTouched] = useState(0);
			return (
				<FlexEditor
					value={makeDefault()}
					onChange={() => {
						calls += 1;
						if (calls > 50) {
							overflowed = true;
							return;
						}
						setTouched((n) => n + 1);
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
			target: { value: "変更後です1234567890" },
		});
		expect(overflowed).toBe(false);
		expect(calls).toBeLessThan(10);
		expect(calls).toBe(1);
	});

	it("親がキー順を変えて返しても止まる", () => {
		let calls = 0;
		let overflowed = false;
		const reorder = (v: unknown): unknown => {
			if (Array.isArray(v)) return v.map(reorder);
			if (v && typeof v === "object") {
				const o = v as Record<string, unknown>;
				return Object.fromEntries(
					Object.keys(o)
						.sort()
						.reverse()
						.map((k) => [k, reorder(o[k])]),
				);
			}
			return v;
		};
		function Parent() {
			const [json, setJson] = useState<FlexContainer>(makeDefault());
			return (
				<FlexEditor
					value={json}
					onChange={(v) => {
						calls += 1;
						if (calls > 50) {
							overflowed = true;
							return;
						}
						setJson(reorder(v) as FlexContainer);
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
			target: { value: "変更後です1234567890" },
		});
		expect(overflowed).toBe(false);
		expect(calls).toBeLessThan(10);
		expect(calls).toBe(1);
	});

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
