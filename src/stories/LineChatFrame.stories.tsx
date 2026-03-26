import type { Meta, StoryObj } from "@storybook/react-vite";
import { FlexMessagePreview } from "../components/FlexMessagePreview";
import { LineChatFrame } from "../components/LineChatFrame";
import { LineTextBubble } from "../components/LineTextBubble";
import type { FlexBubble } from "../types";

import TicketJson from "./templates/Ticket.json";

const meta: Meta<typeof LineChatFrame> = {
	title: "LineChatFrame",
	component: LineChatFrame,
};

export default meta;
type Story = StoryObj<typeof LineChatFrame>;

export const Default: Story = {
	render: () => (
		<LineChatFrame>
			<FlexMessagePreview json={TicketJson as FlexBubble} />
		</LineChatFrame>
	),
};

export const CustomAccount: Story = {
	render: () => (
		<LineChatFrame accountName="My Shop Bot">
			<FlexMessagePreview json={TicketJson as FlexBubble} />
		</LineChatFrame>
	),
};

export const WithTextBubble: Story = {
	render: () => (
		<LineChatFrame>
			<LineTextBubble text="こんにちは！ご予約ありがとうございます。" />
		</LineChatFrame>
	),
};

export const MultipleMessages: Story = {
	render: () => (
		<LineChatFrame accountName="LINE Bot">
			<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
				<LineTextBubble text="ご予約が確定しました！" />
				<FlexMessagePreview json={TicketJson as FlexBubble} />
			</div>
		</LineChatFrame>
	),
};
