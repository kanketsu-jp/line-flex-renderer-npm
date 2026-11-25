import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 🚨 vitest.config.ts に globals: true が無いため
//    @testing-library/react の自動 cleanup が効かない。
//    render を複数の it で使うテストのために明示的に登録する。
afterEach(() => {
	cleanup();
});

// ── WYSIWYG: ResizeObserver polyfill（B5/M8 のテスト用。幅を外部から制御可能） ──
type MockGlobals = {
	__roInstances: ResizeObserverMock[];
	__containerWidth: number;
	__setContainerWidth: (width: number) => void;
};

class ResizeObserverMock implements ResizeObserver {
	private callback: ResizeObserverCallback;
	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
	}
	observe(target: Element) {
		(globalThis as unknown as MockGlobals).__roInstances.push(this);
		this.notify(target);
	}
	unobserve() {}
	disconnect() {}
	notify(target: Element) {
		const width =
			(globalThis as unknown as MockGlobals).__containerWidth ?? 390;
		this.callback(
			[{ target, contentRect: { width } }] as ResizeObserverEntry[],
			this as unknown as ResizeObserver,
		);
	}
}

Object.assign(globalThis, {
	ResizeObserver: ResizeObserverMock,
	__roInstances: [],
	__containerWidth: 390,
	__setContainerWidth: (width: number) => {
		Object.assign(globalThis, { __containerWidth: width });
		for (const ro of (globalThis as unknown as MockGlobals).__roInstances) {
			ro.notify(document.body);
		}
	},
});
