import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../../types";
import ReceiptJson from "./templates/Receipt.json";
import { ConceptBuilder } from "../wysiwyg/ConceptC";

const initial = ReceiptJson as FlexBubble;

const meta: Meta<typeof ConceptBuilder> = {
	title: "WysiwygConcepts/案C 3ペイン型 (Webflow)",
	component: ConceptBuilder,
	parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ConceptBuilder>;

export const Default: Story = {
	args: { initial },
};
