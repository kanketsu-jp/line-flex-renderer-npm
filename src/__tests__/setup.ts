import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 🚨 vitest.config.ts に globals: true が無いため
//    @testing-library/react の自動 cleanup が効かない。
//    render を複数の it で使うテストのために明示的に登録する。
afterEach(() => {
	cleanup();
});
