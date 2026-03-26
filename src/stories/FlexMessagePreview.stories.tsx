import type { Meta, StoryObj } from "@storybook/react-vite";
import { FlexMessagePreview } from "../components/FlexMessagePreview";
import type { FlexBubble, FlexCarousel } from "../types";
import ApparelJson from "./templates/Apparel.json";
import ReceiptJson from "./templates/Receipt.json";
import TicketJson from "./templates/Ticket.json";

const meta: Meta<typeof FlexMessagePreview> = {
	title: "FlexMessagePreview",
	component: FlexMessagePreview,
};

export default meta;
type Story = StoryObj<typeof FlexMessagePreview>;

export const Receipt: Story = {
	args: {
		json: ReceiptJson as FlexBubble,
	},
};

export const Ticket: Story = {
	args: {
		json: TicketJson as FlexBubble,
	},
};

export const SimpleText: Story = {
	args: {
		json: {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						text: "Hello, World!",
						weight: "bold",
						size: "xl",
					},
					{
						type: "text",
						text: "This is a simple text-only bubble message.",
						wrap: true,
						margin: "md",
						size: "sm",
						color: "#666666",
					},
				],
			},
		} satisfies FlexBubble,
	},
};

export const WithHero: Story = {
	args: {
		json: {
			type: "bubble",
			hero: {
				type: "image",
				url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png",
				size: "full",
				aspectRatio: "20:13",
				aspectMode: "cover",
			},
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						text: "Brown Cafe",
						weight: "bold",
						size: "xl",
					},
					{
						type: "text",
						text: "A cozy cafe with great coffee and atmosphere.",
						wrap: true,
						margin: "md",
						size: "sm",
						color: "#666666",
					},
				],
			},
		} satisfies FlexBubble,
	},
};

export const WithFooter: Story = {
	args: {
		json: {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						text: "Reservation Confirmed",
						weight: "bold",
						size: "lg",
					},
					{
						type: "text",
						text: "Your reservation has been confirmed for 2 guests.",
						wrap: true,
						margin: "md",
						size: "sm",
						color: "#666666",
					},
				],
			},
			footer: {
				type: "box",
				layout: "vertical",
				spacing: "sm",
				contents: [
					{
						type: "button",
						action: {
							type: "uri",
							label: "View Details",
							uri: "https://example.com",
						},
						style: "primary",
					},
					{
						type: "button",
						action: {
							type: "uri",
							label: "Cancel",
							uri: "https://example.com",
						},
						style: "secondary",
					},
				],
			},
			styles: { footer: { separator: true } },
		} satisfies FlexBubble,
	},
};

export const Carousel: Story = {
	args: {
		json: ApparelJson as FlexCarousel,
	},
};

export const AllSizes: Story = {
	render: () => {
		const sizes = ["nano", "micro", "kilo", "mega", "giga"] as const;
		return (
			<div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
				{sizes.map((size) => (
					<FlexMessagePreview
						key={size}
						json={{
							type: "bubble",
							size,
							body: {
								type: "box",
								layout: "vertical",
								contents: [
									{
										type: "text",
										text: size,
										weight: "bold",
										align: "center",
									},
								],
							},
						}}
					/>
				))}
			</div>
		);
	},
};

export const CustomStyles: Story = {
	args: {
		json: {
			type: "bubble",
			header: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						text: "Custom Header",
						weight: "bold",
						color: "#ffffff",
						size: "lg",
					},
				],
			},
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						text: "Custom styled bubble with colored sections.",
						wrap: true,
					},
				],
			},
			footer: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						action: {
							type: "uri",
							label: "Action",
							uri: "https://example.com",
						},
						style: "link",
					},
				],
			},
			styles: {
				header: { backgroundColor: "#27ACB2" },
				body: { backgroundColor: "#E6F5F5" },
				footer: { backgroundColor: "#E6F5F5", separator: true },
			},
		} satisfies FlexBubble,
	},
};
