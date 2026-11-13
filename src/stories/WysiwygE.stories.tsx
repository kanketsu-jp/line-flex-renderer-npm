import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../../types";
import ReceiptJson from "./templates/Receipt.json";
import { ConceptHybrid } from "../wysiwyg/ConceptE";

const initial = ReceiptJson as FlexBubble;

const meta: Meta<typeof ConceptHybrid> = {
	title: "WysiwygConcepts/案E 漸進進化型 (現行踏襲)",
	component: ConceptHybrid,
	parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ConceptHybrid>;

export const Default: Story = {
	args: { initial },
};
