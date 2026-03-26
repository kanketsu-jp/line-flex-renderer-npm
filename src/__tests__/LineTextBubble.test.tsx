import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LineTextBubble } from "../components/LineTextBubble";

describe("LineTextBubble", () => {
	it("renders text", () => {
		render(<LineTextBubble text="Hello!" />);
		expect(screen.getByText("Hello!")).toBeInTheDocument();
	});

	it("preserves newlines with pre-wrap", () => {
		const { container } = render(<LineTextBubble text={"Line 1\nLine 2"} />);
		const el = container.firstElementChild as HTMLElement;
		expect(el.style.whiteSpace).toBe("pre-wrap");
		expect(el.textContent).toContain("Line 1\nLine 2");
	});
});
