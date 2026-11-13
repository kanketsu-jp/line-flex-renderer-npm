import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(ts|tsx)"],
	addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	viteFinal: async (config) => {
		// ngrok / cloudflared 等の外部トンネル経由でプレビューできるようにする
		if (config.server) {
			config.server.allowedHosts = true;
		}
		return config;
	},
};

export default config;
