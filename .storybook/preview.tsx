import type { Preview } from "@storybook/react-vite";
import "../src/wysiwyg/ui/styles.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
