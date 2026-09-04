import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { FlexEditor } from "../editor/FlexEditor";
import type { FlexBubble, FlexContainer } from "../types";

const sample: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [{ type: "text", text: "こんにちは", wrap: true }],
	},
};

/** Radix Switch と同じ形: ref コールバックを毎レンダー作り直し、その中で setState する */
function RefChurn() {
	const [node, setNode] = useState<HTMLElement | null>(null);
	return (
		<div ref={(nextNode) => setNode(nextNode)} data-has={node ? "1" : "0"} />
	);
}

/** crm と同じ形: 親が onChange の値をそのまま value に返す */
function EchoParent({ churn }: { churn: boolean }) {
	const [value, setValue] = useState<FlexContainer>(sample);
	return (
		<div>
			{churn ? <RefChurn /> : null}
			<FlexEditor value={value} onChange={(nextValue) => setValue(nextValue)} />
		</div>
	);
}

const typedText =
	"これはブラウザで連続入力を検査するための三十三文字以上のテスト本文です。";

const playEcho = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const canvas = within(canvasElement);
	await userEvent.click(
		canvas.getByRole("button", { name: "テキスト: こんにちは" }),
	);
	const textField = canvas.getByLabelText("本文");
	await userEvent.clear(textField);
	await userEvent.type(textField, typedText, { delay: 1 });
	await expect(textField).toHaveValue(typedText);
	await expect(
		canvas.getByRole("heading", { name: "選んだ部品の設定" }),
	).toBeInTheDocument();
	await expect(canvas.getByLabelText("本文")).toBeInTheDocument();
};

const meta: Meta = { title: "FlexEditor/エコーする親" };
export default meta;
type Story = StoryObj;

export const EchoOnly: Story = {
	render: () => <EchoParent churn={false} />,
	play: playEcho,
};

export const EchoWithRefChurn: Story = {
	render: () => <EchoParent churn={true} />,
	play: playEcho,
};
