import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
	parameters: {
		layout: "centered",
		backgrounds: {
			default: "LINE",
			values: [
				{ name: "LINE", value: "#7B9EB0" },
				{ name: "White", value: "#ffffff" },
				{ name: "Dark", value: "#1a1a2e" },
			],
		},
	},
};

export default preview;
