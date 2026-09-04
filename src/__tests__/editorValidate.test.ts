import { describe, expect, it } from "vitest";
import { toFlexMessage, validateFlex } from "../editor/validate";
import type {
	FlexBubble,
	FlexCarousel,
	FlexComponentType,
	FlexContainer,
} from "../types";

describe("editor/validate", () => {
	const createValidBubble = (): FlexBubble => ({
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
	});

	// 1. 正常な bubble を渡すと issues が空配列
	it("正常な bubble を渡すと issues が空配列（false positive が出ない）", () => {
		const bubble = createValidBubble();
		const issues = validateFlex(bubble);
		expect(issues).toEqual([]);
	});

	// 2. ルール 1: bubble に header / hero / body / footer が 1 つも無い
	it("ルール 1: 中身が全くない bubble で severity: 'error' の issue が 1 件出る", () => {
		const emptyBubble: FlexBubble = {
			type: "bubble",
		};
		const issues = validateFlex(emptyBubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe(
			"表示する中身がありません。本文などを追加してください",
		);
		expect(issues[0].path).toBeNull();
	});

	// 3. ルール 2: image.url が空
	it("ルール 2: image.url が空のとき severity: 'error' の issue が 1 件出る", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			hero: {
				type: "image",
				url: "",
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe("画像のURLが未入力です");
		expect(issues[0].path).toEqual({ section: "hero", indices: [] });
	});

	// 4. ルール 3: image.url が https:// で始まらない（http:// の場合）
	it("ルール 3: image.url が https:// で始まらないとき severity: 'error' の issue が 1 件出る", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			hero: {
				type: "image",
				url: "http://example.com/test.png",
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe("画像URLは https:// で始まる必要があります");
		expect(issues[0].path).toEqual({ section: "hero", indices: [] });
	});

	// 4 の対照: image.url が https:// で始まる正常ケースでは issue が出ない
	it("ルール 3 の対照: image.url が https:// で始まる正常ケースでは issue が出ない", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			hero: {
				type: "image",
				url: "https://example.com/test.png",
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toEqual([]);
	});

	// 5. ルール 4: image.url が 2000 文字超
	it("ルール 4: image.url が 2000 文字超のとき severity: 'error' の issue が 1 件出る", () => {
		const longUrl = `https://example.com/${"a".repeat(2000)}`;
		const bubble: FlexBubble = {
			type: "bubble",
			hero: {
				type: "image",
				url: longUrl,
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe("画像URLが長すぎます（2000文字まで）");
	});

	it("ルール 4 の対照: image.url が 2000 文字以下のときは issue が出ない", () => {
		const exact2000 = `https://example.com/${"a".repeat(2000 - "https://example.com/".length)}`;
		expect(exact2000.length).toBe(2000);
		const bubble: FlexBubble = {
			type: "bubble",
			hero: {
				type: "image",
				url: exact2000,
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toEqual([]);
	});

	// 6. ルール 5: button.action が無い
	it("ルール 5: button.action が未設定のとき severity: 'error' の issue が 1 件出る", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
					} as unknown as FlexComponentType,
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe("ボタンの動作が設定されていません");
		expect(issues[0].path).toEqual({ section: "body", indices: [0] });
	});

	// 7. ルール 6: action.type が 'uri' で uri が空
	it("ルール 6: uri アクションで uri が空のとき severity: 'error' の issue が 1 件出る", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						action: {
							type: "uri",
							label: "押してね",
							uri: "",
						},
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe("ボタンのリンクURLが未入力です");
	});

	// 8. ルール 7: action.type が 'uri' で スキームが不正
	it("ルール 7: uri アクションでスキームが ftp のとき severity: 'error' の issue が 1 件出る", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						action: {
							type: "uri",
							label: "押してね",
							uri: "ftp://example.com/file",
						},
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe(
			"リンクURLは http / https / line / tel で始めてください",
		);
	});

	// 5 の対照: uri が tel:0312345678 のときは issue が出ないこと（ルール 7 の対照。公式が http/https/line/tel を許可）
	it("ルール 7 の対照: tel / http / https / line スキームのときは issue が出ない", () => {
		const schemes = [
			"tel:0312345678",
			"http://example.com",
			"https://example.com",
			"line://ti/p/@bot",
		];
		for (const uri of schemes) {
			const bubble: FlexBubble = {
				type: "bubble",
				body: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "button",
							action: {
								type: "uri",
								label: "アクション",
								uri,
							},
						},
					],
				},
			};
			const issues = validateFlex(bubble);
			expect(issues).toEqual([]);
		}
	});

	// 9. ルール 8: action.type が 'uri' で uri が 1000 文字超
	it("ルール 8: uri が 1000 文字超のとき severity: 'error' の issue が 1 件出る", () => {
		const longUri = `https://example.com/${"b".repeat(1000)}`;
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						action: {
							type: "uri",
							label: "リンク",
							uri: longUri,
						},
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe("リンクURLが長すぎます（1000文字まで）");
	});

	it("ルール 8 の対照: uri が 1000 文字以下のときは issue が出ない", () => {
		const exact1000 = `https://example.com/${"b".repeat(1000 - "https://example.com/".length)}`;
		expect(exact1000.length).toBe(1000);
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						action: {
							type: "uri",
							label: "リンク",
							uri: exact1000,
						},
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toEqual([]);
	});

	// 10. ルール 9: action.type が 'message' で text が空
	it("ルール 9: message アクションで text が空のとき severity: 'error' の issue が 1 件出る", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						action: {
							type: "message",
							label: "送信",
							text: "",
						},
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe("送信メッセージが未入力です");
	});

	// 11. ルール 10: action.type が 'message' で text が 300 文字超
	it("ルール 10: message アクションで text が 300 文字超のとき severity: 'error' の issue が 1 件出る", () => {
		const longText = "あ".repeat(301);
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						action: {
							type: "message",
							label: "送信",
							text: longText,
						},
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe("送信メッセージが長すぎます（300文字まで）");
	});

	it("ルール 10 の対照: message アクションで text が 300 文字以下のときは issue が出ない", () => {
		const exact300 = "あ".repeat(300);
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						action: {
							type: "message",
							label: "送信",
							text: exact300,
						},
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toEqual([]);
	});

	// 12. ルール 11: text コンポーネントで text も contents も空
	it("ルール 11: text も contents も空のとき severity: 'error' の issue が 1 件出る", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						text: "",
						contents: [],
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe("テキストが空です");
	});

	it("ルール 11 の対照: contents に span がある場合は text が空でも issue が出ない", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						contents: [{ type: "span", text: "スパン文字" }],
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toEqual([]);
	});

	// 13. ルール 12: carousel の contents が 0 個
	it("ルール 12: carousel の contents が 0 個のとき severity: 'error' の issue が 1 件出る", () => {
		const carousel: FlexCarousel = {
			type: "carousel",
			contents: [],
		};
		const issues = validateFlex(carousel);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe("カルーセルに bubble がありません");
		expect(issues[0].path).toBeNull();
	});

	// 14. ルール 13: carousel の contents が 12 個超（6. carousel: bubble 12 個は OK、13 個で error）
	it("ルール 13 & 境界: carousel の bubble 12 個は OK、13 個で severity: 'error' の issue が 1 件出る", () => {
		const bubbles12: FlexBubble[] = Array.from({ length: 12 }, () =>
			createValidBubble(),
		);
		const carousel12: FlexCarousel = {
			type: "carousel",
			contents: bubbles12,
		};
		expect(validateFlex(carousel12)).toEqual([]);

		const bubbles13: FlexBubble[] = Array.from({ length: 13 }, () =>
			createValidBubble(),
		);
		const carousel13: FlexCarousel = {
			type: "carousel",
			contents: bubbles13,
		};
		const issues13 = validateFlex(carousel13);
		expect(issues13).toHaveLength(1);
		expect(issues13[0].severity).toBe("error");
		expect(issues13[0].message).toBe("カルーセルの bubble は 12 個までです");
		expect(issues13[0].path).toBeNull();
	});

	// 15. ルール 14: carousel の bubble の size が揃っていない
	it("ルール 14: carousel 内の bubble の size が異なる場合 severity: 'error' の issue が 1 件出る", () => {
		const b1: FlexBubble = { ...createValidBubble(), size: "mega" };
		const b2: FlexBubble = { ...createValidBubble(), size: "nano" };
		const carousel: FlexCarousel = {
			type: "carousel",
			contents: [b1, b2],
		};
		const issues = validateFlex(carousel);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe(
			"カルーセル内の bubble はすべて同じサイズにしてください",
		);
		expect(issues[0].path).toBeNull();
	});

	it("ルール 14 の対照: carousel 内の bubble の size が一致している場合は issue が出ない", () => {
		const b1: FlexBubble = { ...createValidBubble(), size: "kilo" };
		const b2: FlexBubble = { ...createValidBubble(), size: "kilo" };
		const carousel: FlexCarousel = {
			type: "carousel",
			contents: [b1, b2],
		};
		expect(validateFlex(carousel)).toEqual([]);
	});

	// 16. ルール 15: layout: "baseline" の box の contents に icon / text / filler 以外がある
	it("ルール 15: baseline box に button が含まれるとき severity: 'error' の issue が 1 件出る", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "baseline",
				contents: [
					{
						type: "text",
						text: "ラベル",
					},
					{
						type: "button",
						action: {
							type: "uri",
							label: "押す",
							uri: "https://example.com",
						},
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toBe(
			"横一列のグループには アイコン・テキスト しか置けません",
		);
		expect(issues[0].path).toEqual({ section: "body", indices: [1] });
	});

	it("ルール 15 の対照: baseline box に icon / text / filler のみが含まれるときは issue が出ない", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "baseline",
				contents: [
					{
						type: "icon",
						url: "https://example.com/icon.png",
					},
					{
						type: "text",
						text: "ラベル",
					},
					{
						type: "filler",
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toEqual([]);
	});

	// 17. ルール 16: box の contents が空（severity: 'warning'）
	it("ルール 16: box の contents が空のとき severity: 'warning' の issue が出る（error は 0 件）", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("warning");
		expect(issues[0].message).toBe(
			"中身が空のグループがあります（プレビューに何も出ません）",
		);
		// 🚨 特に「空の box は error ではなく warning」を明示的に assert
		expect(issues.some((issue) => issue.severity === "error")).toBe(false);
	});

	// 18. ルール 17: 色の形式判定（severity: 'warning'）
	it("ルール 17: 色が #RRGGBB / #RRGGBBAA 以外のとき severity: 'warning' の issue が出る", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						text: "本文",
						color: "red", // 不正な色名
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("warning");
		expect(issues[0].message).toBe(
			"色は #RRGGBB か #RRGGBBAA の形式を推奨します",
		);
	});

	it("ルール 17 の対照: 色が #RRGGBB または #RRGGBBAA のときは issue が出ない", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				backgroundColor: "#F7F8FA",
				borderColor: "#E3E6EAFF",
				contents: [
					{
						type: "text",
						text: "本文",
						color: "#1F2328",
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		expect(issues).toEqual([]);
	});

	// 19. carousel 内の個別の指摘の path が null になること
	it("carousel の bubble 内の指摘は契約通り path: null になる", () => {
		const carousel: FlexCarousel = {
			type: "carousel",
			contents: [
				{
					type: "bubble",
					hero: {
						type: "image",
						url: "",
					},
				},
			],
		};
		const issues = validateFlex(carousel);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].path).toBeNull();
	});

	// 20. 単体 bubble の個別の指摘の path が正しく設定されること（深いネスト）
	it("単体 bubble 内の深いネストの指摘の path が正確に計算される", () => {
		const bubble: FlexBubble = {
			type: "bubble",
			body: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "box",
						layout: "vertical",
						contents: [
							{
								type: "image",
								url: "",
							},
						],
					},
				],
			},
		};
		const issues = validateFlex(bubble);
		const imageIssue = issues.find((i) => i.severity === "error");
		expect(imageIssue).toBeDefined();
		expect(imageIssue?.path).toEqual({
			section: "body",
			indices: [0, 0],
		});
	});

	// 21. toFlexMessage が { type: 'flex', altText, contents } を返す
	it("toFlexMessage: 指定された altText と contents を持つ FlexMessage オブジェクトを返す", () => {
		const container: FlexContainer = createValidBubble();
		const altText = "代替テキストです";
		const message = toFlexMessage(container, altText);

		expect(message).toEqual({
			type: "flex",
			altText: "代替テキストです",
			contents: container,
		});
	});
});
