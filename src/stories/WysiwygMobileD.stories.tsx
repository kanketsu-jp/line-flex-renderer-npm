import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../types";
import ReceiptJson from "./templates/Receipt.json";
import { MobileDocList } from "./wysiwyg/mobile/M4DocList";

const initial = ReceiptJson as FlexBubble;

const meta: Meta<typeof MobileDocList> = {
	title: "WysiwygMobile/案M4 リスト型 (Notion風)",
	component: MobileDocList,
	parameters: {
		layout: "fullscreen",
		viewport: { defaultViewport: "mobile1" },
	},
};

export default meta;
type Story = StoryObj<typeof MobileDocList>;

export const Default: Story = { args: { initial } };
