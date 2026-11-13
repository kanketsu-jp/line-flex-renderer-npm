import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../types";
import ReceiptJson from "./templates/Receipt.json";
import { MobileSteps } from "./wysiwyg/mobile/M2Steps";

const initial = ReceiptJson as FlexBubble;

const meta: Meta<typeof MobileSteps> = {
	title: "WysiwygMobile/案M2 ステッパー型 (ウィザード移植)",
	component: MobileSteps,
	parameters: {
		layout: "fullscreen",
		viewport: { defaultViewport: "mobile1" },
	},
};

export default meta;
type Story = StoryObj<typeof MobileSteps>;

export const Default: Story = { args: { initial } };
