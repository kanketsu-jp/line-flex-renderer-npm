import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		wysiwyg: "src/wysiwyg/index.ts",
	},
	format: ["esm", "cjs"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ["react", "react-dom", "@radix-ui/react-dialog"],
	jsx: "automatic",
	treeshake: true,
});
