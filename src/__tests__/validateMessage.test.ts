import { describe, expect, it } from "vitest";
import type {
	FlexJsonError,
	FlexMessageValidationResult,
} from "../editor/validateMessage";
import {
	formatFlexJson,
	parseFlexMessage,
	validateFlexMessage,
} from "../editor/validateMessage";
import type { FlexMessage } from "../types";

function createValidMessage(): Record<string, unknown> {
	return {
		type: "flex",
		altText: "お知らせです",
		contents: {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						text: "こんにちは",
					},
				],
			},
		},
	};
}

function createCarouselMessage(): Record<string, unknown> {
	const first = createValidMessage().contents as Record<string, unknown>;
	const second = createValidMessage().contents as Record<string, unknown>;
	return {
		type: "flex",
		altText: "カルーセルです",
		contents: {
			type: "carousel",
			contents: [first, second],
		},
	};
}

function getErrors(result: FlexMessageValidationResult): FlexJsonError[] {
	expect(result.ok).toBe(false);
	if (result.ok) {
		throw new Error("検証結果が ok でした");
	}
	return result.errors;
}

function getErrorPaths(result: FlexMessageValidationResult): string[] {
	return getErrors(result).map((error) => error.path);
}

function expectValid(result: FlexMessageValidationResult): FlexMessage {
	expect(result.ok).toBe(true);
	if (!result.ok) {
		throw new Error("検証結果がエラーでした");
	}
	return result.value;
}

function getBubble(message: Record<string, unknown>): Record<string, unknown> {
	return message.contents as Record<string, unknown>;
}

function getBody(message: Record<string, unknown>): Record<string, unknown> {
	return getBubble(message).body as Record<string, unknown>;
}

describe("validateFlexMessage / parseFlexMessage / formatFlexJson", () => {
	// 1. 正常な bubble の FlexMessage
	it("正常な bubble の FlexMessage はエラーにならない", () => {
		const result = validateFlexMessage(createValidMessage());

		expectValid(result);
	});

	// 2. 正常な carousel の FlexMessage
	it("正常な carousel の FlexMessage はエラーにならない", () => {
		const result = validateFlexMessage(createCarouselMessage());

		expectValid(result);
	});

	// 3. 未知のキーを検査せず、value からも消さない
	it("未知のキーを含む FlexMessage は通過し、未知のキーも残る", () => {
		const input = createValidMessage();
		const bubble = getBubble(input);
		const body = getBody(input);
		body.width = "50%";
		bubble.action = { type: "message", label: "保存されるキー" };

		const result = validateFlexMessage(input);
		const value = expectValid(result);
		const valueBubble = value.contents as unknown as Record<string, unknown>;
		const valueBody = valueBubble.body as Record<string, unknown>;

		expect(valueBody.width).toBe("50%");
		expect(valueBubble.action).toEqual({
			type: "message",
			label: "保存されるキー",
		});
	});

	// 4. ok: true の value は入力と同一の中身
	it("ok の value は入力オブジェクトを詰め替えずに返す", () => {
		const input = createValidMessage();
		const result = validateFlexMessage(input);

		expect(expectValid(result)).toBe(input);
	});

	// 5. ルートがオブジェクトでない
	it("文字列・数値・null・配列を渡すとルートのエラーになる", () => {
		for (const input of ["文字列", 123, null, []]) {
			const result = validateFlexMessage(input);

			expect(getErrorPaths(result)).toContain("");
		}
	});

	// 6. ルート type が flex でない
	it('ルートの type が "text" だと type のエラーになる', () => {
		const input = createValidMessage();
		input.type = "text";

		expect(getErrorPaths(validateFlexMessage(input))).toContain("type");
	});

	// 7. altText の欠落・型・長さ
	it("altText の欠落・数値・空文字・401文字を検出する", () => {
		const missing = createValidMessage();
		delete missing.altText;
		expect(getErrorPaths(validateFlexMessage(missing))).toContain("altText");

		const number = createValidMessage();
		number.altText = 123;
		expect(getErrorPaths(validateFlexMessage(number))).toContain("altText");

		const empty = createValidMessage();
		empty.altText = "";
		expect(getErrorPaths(validateFlexMessage(empty))).toContain("altText");

		const tooLong = createValidMessage();
		tooLong.altText = "あ".repeat(401);
		expect(getErrorPaths(validateFlexMessage(tooLong))).toContain("altText");
	});

	// 8. contents の欠落・container type の違反
	it("contents の欠落と不正な contents.type を検出する", () => {
		const missing = createValidMessage();
		delete missing.contents;
		expect(getErrorPaths(validateFlexMessage(missing))).toContain("contents");

		const wrongType = createValidMessage();
		getBubble(wrongType).type = "box";
		expect(getErrorPaths(validateFlexMessage(wrongType))).toContain(
			"contents.type",
		);
	});

	// 9. bubble.size の enum 違反
	it('bubble.size が "huge" だと size のエラーになる', () => {
		const input = createValidMessage();
		getBubble(input).size = "huge";

		expect(getErrorPaths(validateFlexMessage(input))).toContain(
			"contents.size",
		);
	});

	// 10. body の type 違反
	it("body が box でないと body のエラーになる", () => {
		const input = createValidMessage();
		getBubble(input).body = { type: "text", text: "本文" };

		expect(getErrorPaths(validateFlexMessage(input))).toContain(
			"contents.body",
		);
	});

	// 11. hero の type 違反
	it("hero が box だと hero のエラーに video と box の断り書きが入る", () => {
		const input = createValidMessage();
		getBubble(input).hero = { type: "box" };

		const errors = getErrors(validateFlexMessage(input));
		const heroError = errors.find((error) => error.path === "contents.hero");

		expect(heroError).toBeDefined();
		expect(heroError?.message).toContain("video");
		expect(heroError?.message).toContain("box");
	});

	// 12. box.layout の欠落・enum 違反
	it("box の layout の欠落と不正な値を検出する", () => {
		const missing = createValidMessage();
		delete getBody(missing).layout;
		expect(getErrorPaths(validateFlexMessage(missing))).toContain(
			"contents.body.layout",
		);

		const wrong = createValidMessage();
		getBody(wrong).layout = "diagonal";
		expect(getErrorPaths(validateFlexMessage(wrong))).toContain(
			"contents.body.layout",
		);
	});

	// 13. box.contents の型違反
	it("box の contents が配列でないと contents のエラーになる", () => {
		const input = createValidMessage();
		getBody(input).contents = "本文";

		expect(getErrorPaths(validateFlexMessage(input))).toContain(
			"contents.body.contents",
		);
	});

	// 14. 深いネストの path
	it("深いネストのコンポーネントまで正しい path で指摘する", () => {
		const input = createValidMessage();
		getBody(input).contents = [
			{ type: "text", text: "一" },
			{ type: "text", text: "二" },
			{
				type: "box",
				layout: "vertical",
				contents: [
					{ type: "text", text: "三" },
					{ type: "text", text: 42 },
				],
			},
		];

		expect(getErrorPaths(validateFlexMessage(input))).toContain(
			"contents.body.contents[2].contents[1].text",
		);
	});

	// 15. carousel 内の path
	it("carousel 内の不正な bubble も正しい path で指摘する", () => {
		const input = createCarouselMessage();
		const carousel = getBubble(input);
		const contents = carousel.contents as Record<string, unknown>[];
		contents[1].body = { type: "text", text: "本文" };

		expect(getErrorPaths(validateFlexMessage(input))).toContain(
			"contents.contents[1].body",
		);
	});

	// 16. 未知の type
	it("未知の type を該当ノードで検出し、type 名をメッセージに含める", () => {
		const input = createValidMessage();
		getBody(input).contents = [{ type: "video" }];

		const errors = getErrors(validateFlexMessage(input));
		const videoError = errors.find(
			(error) => error.path === "contents.body.contents[0]",
		);

		expect(videoError).toBeDefined();
		expect(videoError?.message).toContain("video");
	});

	// 17. button.action の必須キーと enum
	it("button の action・action.type・action.label のエラーを検出する", () => {
		const missingAction = createValidMessage();
		getBody(missingAction).contents = [{ type: "button" }];
		expect(getErrorPaths(validateFlexMessage(missingAction))).toContain(
			"contents.body.contents[0].action",
		);

		const wrongType = createValidMessage();
		getBody(wrongType).contents = [
			{ type: "button", action: { type: "share", label: "共有" } },
		];
		expect(getErrorPaths(validateFlexMessage(wrongType))).toContain(
			"contents.body.contents[0].action.type",
		);

		const missingLabel = createValidMessage();
		getBody(missingLabel).contents = [
			{ type: "button", action: { type: "uri" } },
		];
		expect(getErrorPaths(validateFlexMessage(missingLabel))).toContain(
			"contents.body.contents[0].action.label",
		);
	});

	// 18. image.url の必須キー
	it("image に url がないと url の path を返す", () => {
		const input = createValidMessage();
		getBody(input).contents = [{ type: "image" }];

		expect(getErrorPaths(validateFlexMessage(input))).toContain(
			"contents.body.contents[0].url",
		);
	});

	// 19. text の enum 違反
	it('text の weight が "heavy" だと該当 path のエラーになる', () => {
		const input = createValidMessage();
		getBody(input).contents = [{ type: "text", text: "本文", weight: "heavy" }];

		expect(getErrorPaths(validateFlexMessage(input))).toContain(
			"contents.body.contents[0].weight",
		);
	});

	// 20. 複数エラーをすべて返す
	it("複数のエラーがあるとき altText と layout の両方を返す", () => {
		const input = createValidMessage();
		delete input.altText;
		delete getBody(input).layout;

		const errors = getErrors(validateFlexMessage(input));
		const paths = errors.map((error) => error.path);

		expect(errors.length).toBeGreaterThanOrEqual(2);
		expect(paths).toContain("altText");
		expect(paths).toContain("contents.body.layout");
	});

	// 21. 壊れた JSON
	it("壊れた JSON の parse 結果は構文エラーになる", () => {
		const result = parseFlexMessage('{ "type": ');
		const errors = getErrors(result);

		expect(errors[0].path).toBe("");
		expect(errors[0].message).toMatch(/^JSON として読み取れません/);
	});

	// 22. 正常な JSON
	it("正常な JSON を parse すると ok になる", () => {
		const result = parseFlexMessage(JSON.stringify(createValidMessage()));

		expectValid(result);
	});

	// 23. JSON の整形
	it("formatFlexJson はインデント 2 で JSON を整形する", () => {
		const value = { type: "flex", altText: "表示" };

		expect(formatFlexJson(value)).toBe(
			'{\n  "type": "flex",\n  "altText": "表示"\n}',
		);
	});

	// 24. 空 URL は意味検証に任せる
	it("image の url が空文字でも構造検査ではエラーにしない", () => {
		const input = createValidMessage();
		getBubble(input).hero = { type: "image", url: "" };

		expectValid(validateFlexMessage(input));
	});

	// 25. span は共通部品の未知 type 検査に流用しない
	it("有効な span は通過し、type が spam の span は専用 path で検出する", () => {
		const valid = createValidMessage();
		getBody(valid).contents = [
			{ type: "text", contents: [{ type: "span", text: "あ" }] },
		];
		const validResult = validateFlexMessage(valid);

		expectValid(validResult);

		const invalid = createValidMessage();
		getBody(invalid).contents = [
			{ type: "text", contents: [{ type: "spam", text: "あ" }] },
		];
		const errors = getErrors(validateFlexMessage(invalid));

		expect(
			errors.some(
				(error) => error.path === "contents.body.contents[0].contents[0]",
			),
		).toBe(true);
	});

	// 26. hero の再帰検査
	it("hero が image なら中身まで検査して url の path を返す", () => {
		const input = createValidMessage();
		getBubble(input).hero = { type: "image" };

		expect(getErrorPaths(validateFlexMessage(input))).toContain(
			"contents.hero.url",
		);
	});
});
