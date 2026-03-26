import { describe, expectTypeOf, it } from "vitest";
import type {
	FlexBubble,
	FlexCarousel,
	FlexContainer,
	FlexMessage,
} from "../types";

describe("Type definitions", () => {
	it("FlexBubble has correct shape", () => {
		expectTypeOf<FlexBubble>().toHaveProperty("type");
		expectTypeOf<FlexBubble>().toHaveProperty("body");
	});

	it("FlexCarousel contains bubbles", () => {
		expectTypeOf<FlexCarousel>().toHaveProperty("contents");
	});

	it("FlexContainer is union of bubble and carousel", () => {
		expectTypeOf<FlexBubble>().toMatchTypeOf<FlexContainer>();
		expectTypeOf<FlexCarousel>().toMatchTypeOf<FlexContainer>();
	});

	it("FlexMessage has altText and contents", () => {
		expectTypeOf<FlexMessage>().toHaveProperty("altText");
		expectTypeOf<FlexMessage>().toHaveProperty("contents");
	});
});
