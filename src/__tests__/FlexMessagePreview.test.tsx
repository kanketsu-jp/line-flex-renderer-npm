import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlexMessagePreview } from "../components/FlexMessagePreview";
import type { FlexBubble, FlexCarousel } from "../types";

describe("FlexMessagePreview", () => {
	it("renders body text", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [{ type: "text", text: "Hello World" }],
			},
		};
		render(<FlexMessagePreview json={bubble} />);
		expect(screen.getByText("Hello World")).toBeInTheDocument();
	});

	it("renders hero image", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			hero: {
				type: "image",
				url: "https://example.com/test.png",
				size: "full",
				aspectRatio: "20:13",
				aspectMode: "cover",
			},
		};
		const { container } = render(<FlexMessagePreview json={bubble} />);
		const img = container.querySelector("img");
		expect(img).toHaveAttribute("src", "https://example.com/test.png");
	});

	it("renders footer buttons", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			footer: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						action: {
							type: "uri",
							label: "View Detail",
							uri: "https://example.com",
						},
						style: "primary",
					},
				],
			},
		};
		render(<FlexMessagePreview json={bubble} />);
		expect(screen.getByText("View Detail")).toBeInTheDocument();
	});

	it("renders separator as hr", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{ type: "text", text: "Above" },
					{ type: "separator" },
					{ type: "text", text: "Below" },
				],
			},
		};
		const { container } = render(<FlexMessagePreview json={bubble} />);
		const hrs = container.querySelectorAll("hr");
		expect(hrs.length).toBeGreaterThanOrEqual(1);
	});

	it("renders carousel with multiple bubbles", () => {
		const carousel: FlexCarousel = {
			type: "carousel",
			contents: [
				{
					type: "bubble",
					body: {
						type: "box",
						layout: "vertical",
						contents: [{ type: "text", text: "Bubble 1" }],
					},
				},
				{
					type: "bubble",
					body: {
						type: "box",
						layout: "vertical",
						contents: [{ type: "text", text: "Bubble 2" }],
					},
				},
			],
		};
		render(<FlexMessagePreview json={carousel} />);
		expect(screen.getByText("Bubble 1")).toBeInTheDocument();
		expect(screen.getByText("Bubble 2")).toBeInTheDocument();
	});

	it("applies correct width for different sizes", () => {
		const sizes = [
			{ size: "nano" as const, width: "120px" },
			{ size: "micro" as const, width: "150px" },
			{ size: "kilo" as const, width: "230px" },
			{ size: "mega" as const, width: "300px" },
			{ size: "giga" as const, width: "386px" },
		];

		for (const { size, width } of sizes) {
			const bubble: FlexBubble = {
				type: "bubble",
				size,
				body: {
					type: "box",
					layout: "vertical",
					contents: [{ type: "text", text: `Size ${size}` }],
				},
			};
			const { container, unmount } = render(
				<FlexMessagePreview json={bubble} />,
			);
			const root = container.firstElementChild as HTMLElement;
			expect(root.style.width).toBe(width);
			unmount();
		}
	});

	it("renders footer separator when styles.footer.separator is true", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [{ type: "text", text: "Body" }],
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
					},
				],
			},
			styles: { footer: { separator: true } },
		};
		const { container } = render(<FlexMessagePreview json={bubble} />);
		const hrs = container.querySelectorAll("hr");
		expect(hrs.length).toBeGreaterThanOrEqual(1);
	});

	it("does not crash with empty body", () => {
		const bubble: FlexBubble = {
			type: "bubble",
		};
		const { container } = render(<FlexMessagePreview json={bubble} />);
		expect(container.firstElementChild).toBeInTheDocument();
	});
});
