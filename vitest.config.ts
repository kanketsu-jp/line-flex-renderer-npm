import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		setupFiles: ["./src/__tests__/setup.ts"],
		exclude: [...configDefaults.exclude, ".temp/**"],
	},
});
