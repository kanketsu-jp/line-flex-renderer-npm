import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FlexEditor } from "../editor/FlexEditor";
import type { FlexBubble } from "../types";

type ROCallback = (entries: Array<{ contentRect: { width: number } }>) => void;

let callbacks: ROCallback[] = [];
const original = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;

class StubResizeObserver {
	constructor(cb: ROCallback) {
		callbacks.push(cb);
	}
	observe() {}
	unobserve() {}
	disconnect() {}
}

/** 観測中の全コールバックへ幅を通知する */
function emitWidth(width: number) {
	act(() => {
		for (const cb of callbacks) {
			cb([{ contentRect: { width } }]);
		}
	});
}

beforeEach(() => {
	callbacks = [];
	(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
		StubResizeObserver;
});

afterEach(() => {
	(globalThis as { ResizeObserver?: unknown }).ResizeObserver = original;
});

const sample: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [{ type: "text", text: "こんにちは", wrap: true }],
	},
};

describe("useIsNarrow / FlexEditor 自動レイアウト判定", () => {
	it("狭い幅を通知するとタブが出る（自動判定の本体）", () => {
		render(<FlexEditor value={sample} />);
		expect(screen.queryAllByRole("tab")).toHaveLength(0);

		emitWidth(400);

		const tabs = screen.getAllByRole("tab");
		expect(tabs).toHaveLength(2);
		expect(screen.getByRole("tab", { name: "プレビュー" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "編集" })).toBeInTheDocument();
	});

	it("広い幅に戻すとタブが消える", () => {
		render(<FlexEditor value={sample} />);
		expect(screen.queryAllByRole("tab")).toHaveLength(0);

		emitWidth(400);
		expect(screen.getAllByRole("tab")).toHaveLength(2);

		emitWidth(1200);
		expect(screen.queryAllByRole("tab")).toHaveLength(0);
		expect(screen.getByText("こんにちは")).toBeInTheDocument();
		expect(screen.getByText("組み立て")).toBeInTheDocument();
	});

	it("境界の両側を測る", () => {
		render(<FlexEditor value={sample} />);
		emitWidth(767);
		expect(screen.getAllByRole("tab")).toHaveLength(2);

		emitWidth(768);
		expect(screen.queryAllByRole("tab")).toHaveLength(0);
	});

	it("mobileBreakpoint を変えると閾値が動く", () => {
		render(<FlexEditor value={sample} mobileBreakpoint={500} />);
		emitWidth(600);
		expect(screen.queryAllByRole("tab")).toHaveLength(0);

		emitWidth(400);
		expect(screen.getAllByRole("tab")).toHaveLength(2);
	});

	it("forceLayout は自動判定より優先される", () => {
		const { unmount } = render(
			<FlexEditor value={sample} forceLayout="desktop" />,
		);
		emitWidth(300);
		expect(screen.queryAllByRole("tab")).toHaveLength(0);
		unmount();

		render(<FlexEditor value={sample} forceLayout="mobile" />);
		emitWidth(2000);
		expect(screen.getAllByRole("tab")).toHaveLength(2);
	});
});
