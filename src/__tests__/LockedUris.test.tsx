import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FlexEditor } from "../editor/FlexEditor";
import { JsonPanel } from "../editor/JsonPanel";
import { containsLockedUri, countLockedUris } from "../index";
import type { FlexBubble, FlexContainer } from "../types";

const L = "https://winning-url.invalid/";
const sample: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [
			{ type: "text", text: "当選のお知らせ" },
			{
				type: "button",
				action: { type: "uri", uri: L, label: "受け取る" },
			},
			{
				type: "button",
				action: { type: "uri", uri: "https://example.com", label: "詳しく" },
			},
		],
	},
};
const replacement: FlexBubble = {
	type: "bubble",
	body: {
		type: "box",
		layout: "vertical",
		contents: [{ type: "text", text: "置き換え後" }],
	},
};

function setup(lockedUris: string[] | undefined = [L]) {
	const onChange = vi.fn<(value: FlexContainer) => void>();
	render(
		<FlexEditor
			value={sample}
			lockedUris={lockedUris}
			onChange={onChange}
			forceLayout="desktop"
			templates={[
				{
					id: "replace",
					name: "置換テンプレート",
					description: "置換",
					bubble: replacement,
				},
			]}
		/>,
	);
	return onChange;
}

function selectLockedButton() {
	fireEvent.click(screen.getByRole("button", { name: "ボタン: 受け取る" }));
}

function row(name: string) {
	const element = screen
		.getByRole("button", { name, exact: true })
		.closest("li");
	if (!element) throw new Error(`行がありません: ${name}`);
	return within(element);
}

function editJson(value: string) {
	fireEvent.click(screen.getByRole("button", { name: "編集" }));
	fireEvent.change(screen.getByLabelText("Flex メッセージの JSON"), {
		target: { value },
	});
	fireEvent.click(screen.getByRole("button", { name: "保存" }));
}

function openJson() {
	fireEvent.click(screen.getByText("JSON", { selector: "summary" }));
}

describe("lockedUris", () => {
	it("L1: locked ボタンのリンクURLと動作を無効化して理由を表示する", () => {
		setup();
		selectLockedButton();
		expect(screen.getByLabelText("リンクURL")).toBeDisabled();
		expect(screen.getByLabelText("動作")).toBeDisabled();
		expect(screen.getByText("このリンクは変更できません")).toBeVisible();
	});

	it("L2: ボタンの文字を変更しても URI を保持して通知する", () => {
		const onChange = setup();
		selectLockedButton();
		fireEvent.change(screen.getByLabelText("ボタンの文字"), {
			target: { value: "賞品を受け取る" },
		});
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
			body: {
				contents: [{}, { action: { label: "賞品を受け取る", uri: L } }, {}],
			},
		});
		expect(screen.getByLabelText("見た目")).toBeEnabled();
		fireEvent.change(screen.getByLabelText("見た目"), {
			target: { value: "primary" },
		});
		expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
			body: {
				contents: [
					{},
					{ style: "primary", action: { label: "賞品を受け取る", uri: L } },
					{},
				],
			},
		});
	});

	it("L3: 対照となる詳しくボタンのリンクURLは編集できる", () => {
		setup();
		fireEvent.click(screen.getByRole("button", { name: "ボタン: 詳しく" }));
		expect(screen.getByLabelText("リンクURL")).toBeEnabled();
		expect(screen.getByLabelText("動作")).toBeEnabled();
	});

	it("L4: locked ボタンと親の削除だけを無効化する", () => {
		setup();
		for (const name of ["ボタン: 受け取る", "本文"]) {
			const remove = row(name).getByRole("button", { name: "削除" });
			expect(remove).toBeDisabled();
			expect(remove).toHaveAttribute("title", "このリンクは変更できません");
		}
		for (const name of ["テキスト: 当選のお知らせ", "ボタン: 詳しく"]) {
			expect(row(name).getByRole("button", { name: "削除" })).toBeEnabled();
		}
		expect(
			row("ボタン: 受け取る").getByRole("button", { name: "上へ移動" }),
		).toBeEnabled();
		expect(
			row("ボタン: 受け取る").getByRole("button", { name: "下へ移動" }),
		).toBeEnabled();
	});

	it("L5: lockedUris 未指定なら入力と削除を従来どおり有効にする", () => {
		render(<FlexEditor value={sample} forceLayout="desktop" />);
		selectLockedButton();
		expect(screen.getByLabelText("リンクURL")).toBeEnabled();
		expect(screen.getByLabelText("動作")).toBeEnabled();
		for (const remove of screen.getAllByRole("button", { name: "削除" })) {
			expect(remove).toBeEnabled();
		}
		expect(screen.queryByText("このリンクは変更できません")).toBeNull();
	});

	it("L6: JSON の URI 書き換えを拒否して通知済みの値に L を残す", () => {
		const onChange = setup();
		fireEvent.click(
			screen.getByRole("button", { name: "テキスト: 当選のお知らせ" }),
		);
		fireEvent.change(screen.getByLabelText("本文"), {
			target: { value: "通知済み" },
		});
		expect(onChange).toHaveBeenCalledTimes(1);
		const last = onChange.mock.calls.at(-1)?.[0];
		openJson();
		const draft = JSON.stringify(last).replace(
			L,
			"https://changed.example.com/",
		);
		editJson(draft);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"このリンクは変更できません",
		);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(countLockedUris(onChange.mock.calls.at(-1)?.[0], [L])).toBe(1);
		expect(screen.getByLabelText("Flex メッセージの JSON")).not.toHaveAttribute(
			"readonly",
		);
		expect(screen.getByLabelText("Flex メッセージの JSON")).toHaveValue(draft);
	});

	it("L7: テンプレートによる URI の消失を拒否して onChange を呼ばない", () => {
		const onChange = setup();
		fireEvent.click(
			screen.getByText("テンプレートから始める", { selector: "summary" }),
		);
		const template = screen.getByRole("button", { name: "置換テンプレート" });
		expect(template).toBeEnabled();
		fireEvent.click(template);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"このリンクは変更できません",
		);
		expect(onChange).not.toHaveBeenCalled();
		expect(
			countLockedUris(onChange.mock.calls.at(-1)?.[0] ?? sample, [L]),
		).toBe(1);
		selectLockedButton();
		expect(screen.getByLabelText("リンクURL")).toHaveValue(L);
		fireEvent.change(screen.getByLabelText("ボタンの文字"), {
			target: { value: "受取" },
		});
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("L8: JSON で label だけの変更を受け付けて URI を保持する", () => {
		const onChange = setup();
		openJson();
		editJson(JSON.stringify(sample).replace("受け取る", "賞品を受け取る"));
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
			body: {
				contents: [{}, { action: { label: "賞品を受け取る", uri: L } }, {}],
			},
		});
		expect(screen.getByLabelText("Flex メッセージの JSON")).toHaveAttribute(
			"readonly",
		);
	});

	it("L9: JsonPanel 単体でも URI を消した JSON を拒否する", () => {
		const onImport = vi.fn();
		render(
			<JsonPanel container={sample} lockedUris={[L]} onImport={onImport} />,
		);
		editJson(JSON.stringify(replacement));
		expect(onImport).not.toHaveBeenCalled();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"このリンクは変更できません",
		);
		expect(screen.getByLabelText("Flex メッセージの JSON")).not.toHaveAttribute(
			"readonly",
		);
		expect(screen.getByLabelText("Flex メッセージの JSON")).toHaveValue(
			JSON.stringify(replacement),
		);
	});

	it("L10: 入れ子と重複した URI を数え、非文字列と空の指定を数えない", () => {
		const carousel = { type: "carousel", contents: [sample, sample] };
		expect(countLockedUris(carousel, [L])).toBe(2);
		expect(countLockedUris([{ uri: L }, { uri: L }], [L, L])).toBe(2);
		expect(
			countLockedUris([{ uri: 1 }, { uri: null }, { uri: [L] }, null, L], [L]),
		).toBe(0);
		expect(countLockedUris(sample, [])).toBe(0);
		expect(countLockedUris(sample, undefined)).toBe(0);
		expect(containsLockedUri(carousel, [L])).toBe(true);
		expect(containsLockedUri(sample, [])).toBe(false);
		expect(containsLockedUri(sample, undefined)).toBe(false);
		const actions = {
			type: "box",
			action: { type: "uri", uri: L },
			contents: [{ type: "image", action: { type: "uri", uri: L } }],
		};
		expect(countLockedUris(actions, [L])).toBe(2);
	});

	it("外からの value 同期では URI の減少を許可して onChange を呼ばない", () => {
		const onChange = vi.fn();
		const { rerender } = render(
			<FlexEditor
				value={sample}
				lockedUris={[L]}
				onChange={onChange}
				forceLayout="desktop"
			/>,
		);
		rerender(
			<FlexEditor
				value={replacement}
				lockedUris={[L]}
				onChange={onChange}
				forceLayout="desktop"
			/>,
		);
		expect(screen.getByText("置き換え後")).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "ボタン: 受け取る" }),
		).toBeNull();
		expect(onChange).not.toHaveBeenCalled();
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("carousel で移動・追加・非保護部品の削除を受け付けて全体の URI を保持する", () => {
		const onChange = vi.fn<(value: FlexContainer) => void>();
		render(
			<FlexEditor
				value={{ type: "carousel", contents: [sample, sample] }}
				lockedUris={[L]}
				onChange={onChange}
				forceLayout="desktop"
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "bubble 2" }));
		fireEvent.click(
			row("ボタン: 受け取る").getByRole("button", { name: "上へ移動" }),
		);
		expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
			contents: [
				sample,
				{ body: { contents: [{ action: { uri: L } }, { type: "text" }, {}] } },
			],
		});
		fireEvent.click(screen.getByRole("button", { name: "＋ テキスト" }));
		fireEvent.click(
			row("ボタン: 詳しく").getByRole("button", { name: "削除" }),
		);
		expect(onChange).toHaveBeenCalledTimes(3);
		expect(countLockedUris(onChange.mock.calls.at(-1)?.[0], [L])).toBe(2);
	});
});
