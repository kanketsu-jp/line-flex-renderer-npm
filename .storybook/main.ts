import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(ts|tsx)"],
	addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	viteFinal: async (config) => {
		// Tailwind v4（shadcn 向け）
		config.plugins = [...(config.plugins ?? []), tailwindcss()];
		// ngrok / cloudflared 等の外部トンネル経由でプレビューできるようにする
		if (config.server) {
			config.server.allowedHosts = true;
		}
		return config;
	},
};

export default config;
