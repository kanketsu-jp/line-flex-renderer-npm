import type { Meta, StoryObj } from "@storybook/react-vite";
import { FlexEditor } from "../editor/FlexEditor";
import type { FlexBubble } from "../types";
import ReceiptJson from "./templates/Receipt.json";

const meta: Meta<typeof FlexEditor> = {
	title: "FlexEditor",
	component: FlexEditor,
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof FlexEditor>;

export const Default: Story = {
	args: {},
};

export const Mobile: Story = {
	args: {
		forceLayout: "mobile",
	},
};

export const FromExistingJson: Story = {
	args: {
		value: ReceiptJson as FlexBubble,
	},
};
