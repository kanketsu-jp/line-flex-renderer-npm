import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LineChatFrame } from "../components/LineChatFrame";

describe("LineChatFrame", () => {
	it("renders default header text", () => {
		render(
			<LineChatFrame>
				<div>content</div>
			</LineChatFrame>,
		);
		expect(screen.getByText("トーク")).toBeInTheDocument();
	});

	it("renders custom accountName", () => {
		render(
			<LineChatFrame accountName="My Bot">
				<div>content</div>
			</LineChatFrame>,
		);
		expect(screen.getByText("My Bot")).toBeInTheDocument();
	});

	it("renders children", () => {
		render(
			<LineChatFrame>
				<div>Hello from children</div>
			</LineChatFrame>,
		);
		expect(screen.getByText("Hello from children")).toBeInTheDocument();
	});
});
