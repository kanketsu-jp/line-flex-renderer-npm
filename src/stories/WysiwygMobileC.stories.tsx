import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../types";
import ReceiptJson from "./templates/Receipt.json";
import { MobileQuickSheet } from "./wysiwyg/mobile/M3QuickSheet";

const initial = ReceiptJson as FlexBubble;

const meta: Meta<typeof MobileQuickSheet> = {
	title: "WysiwygMobile/案M3 クイックシート型 (Figma風)",
	component: MobileQuickSheet,
	parameters: {
		layout: "fullscreen",
		viewport: { defaultViewport: "mobile1" },
	},
};

export default meta;
type Story = StoryObj<typeof MobileQuickSheet>;

export const Default: Story = { args: { initial } };
