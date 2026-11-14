import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../types";
import ReceiptJson from "./templates/Receipt.json";
import { MobilePreviewFirst } from "./wysiwyg/mobile/M6PreviewFirst";

const initial = ReceiptJson as FlexBubble;

const meta: Meta<typeof MobilePreviewFirst> = {
	title: "WysiwygMobile/案M6 プレビューfirst→編集モーダル",
	component: MobilePreviewFirst,
	parameters: {
		layout: "fullscreen",
		viewport: { defaultViewport: "mobile1" },
	},
};

export default meta;
type Story = StoryObj<typeof MobilePreviewFirst>;

export const Default: Story = { args: { initial } };
