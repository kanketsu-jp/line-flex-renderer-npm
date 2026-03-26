import type { Meta, StoryObj } from "@storybook/react-vite";
import { LineTextBubble } from "../components/LineTextBubble";

const meta: Meta<typeof LineTextBubble> = {
	title: "LineTextBubble",
	component: LineTextBubble,
};

export default meta;
type Story = StoryObj<typeof LineTextBubble>;

export const Short: Story = {
	args: { text: "Hello!" },
};

export const Long: Story = {
	args: {
		text: "This is a very long text message that should wrap to multiple lines when displayed in the bubble. It demonstrates how the component handles lengthy content gracefully without breaking the layout.",
	},
};

export const WithEmoji: Story = {
	args: { text: "こんにちは！🎉 予約が確定しました ✅" },
};

export const Multiline: Story = {
	args: { text: "1行目のテキスト\n2行目のテキスト\n3行目のテキスト" },
};
