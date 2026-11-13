import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../types";
import ReceiptJson from "./templates/Receipt.json";
import { MobileCanvas } from "./wysiwyg/mobile/M1Canvas";

const initial = ReceiptJson as FlexBubble;

const meta: Meta<typeof MobileCanvas> = {
	title: "WysiwygMobile/案M1 フルキャンバス型 (Canva風)",
	component: MobileCanvas,
	parameters: {
		layout: "fullscreen",
		viewport: { defaultViewport: "mobile1" },
	},
};

export default meta;
type Story = StoryObj<typeof MobileCanvas>;

export const Default: Story = { args: { initial } };
