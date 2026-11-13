import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../types";
import ReceiptJson from "./templates/Receipt.json";
import { MobileSplit } from "./wysiwyg/mobile/M5Split";

const initial = ReceiptJson as FlexBubble;

const meta: Meta<typeof MobileSplit> = {
	title: "WysiwygMobile/案M5 分割プレビュー型",
	component: MobileSplit,
	parameters: {
		layout: "fullscreen",
		viewport: { defaultViewport: "mobile1" },
	},
};

export default meta;
type Story = StoryObj<typeof MobileSplit>;

export const Default: Story = { args: { initial } };
