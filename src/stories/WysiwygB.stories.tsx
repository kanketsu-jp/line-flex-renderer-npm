import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../types";
import ReceiptJson from "./templates/Receipt.json";
import { ConceptBlocks } from "./wysiwyg/ConceptB";

const initial = ReceiptJson as FlexBubble;

const meta: Meta<typeof ConceptBlocks> = {
	title: "WysiwygConcepts/案B ドキュメント型 (Notion)",
	component: ConceptBlocks,
	parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ConceptBlocks>;

export const Default: Story = {
	args: { initial },
};
