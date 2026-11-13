import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../../types";
import ReceiptJson from "./templates/Receipt.json";
import { ConceptWizard } from "../wysiwyg/ConceptD";

const initial = ReceiptJson as FlexBubble;

const meta: Meta<typeof ConceptWizard> = {
	title: "WysiwygConcepts/案D ウィザード型 (初心者向け)",
	component: ConceptWizard,
	parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ConceptWizard>;

export const Default: Story = {
	args: { initial },
};
