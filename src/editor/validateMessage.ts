import type { FlexContainer, FlexMessage } from "../types";

/** JSON テキスト上の位置を指すエラー。ルート自身は path が "" */
export interface FlexJsonError {
	/** 例: "altText" / "contents.body.contents[0].text" / "" */
	path: string;
	/** 非技術者向けの日本語メッセージ */
	message: string;
}

export type FlexMessageValidationResult =
	| { ok: true; value: FlexMessage }
	| { ok: false; errors: FlexJsonError[] };

/** contents（bubble / carousel）だけを検査した結果 */
export type FlexContainerValidationResult =
	| { ok: true; value: FlexContainer }
	| { ok: false; errors: FlexJsonError[] };

type JsonObject = Record<string, unknown>;

const BUBBLE_SIZES = ["nano", "micro", "kilo", "mega", "giga"] as const;
const BOX_LAYOUTS = ["vertical", "horizontal", "baseline"] as const;
const JUSTIFY_CONTENTS = [
	"flex-start",
	"center",
	"flex-end",
	"space-between",
	"space-around",
	"space-evenly",
] as const;
const ALIGN_ITEMS = ["flex-start", "center", "flex-end"] as const;
const TEXT_WEIGHTS = ["bold", "regular"] as const;
const TEXT_ALIGNS = ["start", "center", "end"] as const;
const TEXT_GRAVITIES = ["top", "center", "bottom"] as const;
const TEXT_DECORATIONS = ["underline", "line-through", "none"] as const;
const TEXT_STYLES = ["normal", "italic"] as const;
const IMAGE_ASPECT_MODES = ["cover", "fit"] as const;
const BUTTON_STYLES = ["primary", "secondary", "link"] as const;
const BUTTON_HEIGHTS = ["sm", "md"] as const;
const ACTION_TYPES = ["uri", "message", "postback"] as const;
const COMPONENT_TYPES = [
	"box",
	"text",
	"image",
	"button",
	"separator",
	"spacer",
	"filler",
	"icon",
] as const;
const BUBBLE_SECTIONS = ["header", "hero", "body", "footer"] as const;

function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(object: JsonObject, key: string): boolean {
	return Object.getOwnPropertyDescriptor(object, key) !== undefined;
}

function isOneOf<T extends string>(
	value: unknown,
	values: readonly T[],
): value is T {
	return typeof value === "string" && values.includes(value as T);
}

function addError(
	errors: FlexJsonError[],
	path: string,
	message: string,
): void {
	errors.push({ path, message });
}

function propertyPath(path: string, property: string): string {
	return path ? `${path}.${property}` : property;
}

function itemPath(path: string, index: number): string {
	return `${path}[${index}]`;
}

function validateOptionalStrings(
	node: JsonObject,
	path: string,
	properties: readonly string[],
	errors: FlexJsonError[],
): void {
	for (const property of properties) {
		if (hasOwn(node, property) && typeof node[property] !== "string") {
			addError(
				errors,
				propertyPath(path, property),
				`${property} を文字列で入れてください`,
			);
		}
	}
}

function validateOptionalNumbers(
	node: JsonObject,
	path: string,
	properties: readonly string[],
	errors: FlexJsonError[],
): void {
	for (const property of properties) {
		if (hasOwn(node, property) && typeof node[property] !== "number") {
			addError(
				errors,
				propertyPath(path, property),
				`${property} を数値で入れてください`,
			);
		}
	}
}

function validateOptionalBooleans(
	node: JsonObject,
	path: string,
	properties: readonly string[],
	errors: FlexJsonError[],
): void {
	for (const property of properties) {
		if (hasOwn(node, property) && typeof node[property] !== "boolean") {
			addError(
				errors,
				propertyPath(path, property),
				`${property} は true / false にしてください`,
			);
		}
	}
}

function validateOptionalEnums(
	node: JsonObject,
	path: string,
	properties: ReadonlyArray<readonly [string, readonly string[]]>,
	errors: FlexJsonError[],
): void {
	for (const [property, values] of properties) {
		if (hasOwn(node, property) && !isOneOf(node[property], values)) {
			addError(
				errors,
				propertyPath(path, property),
				`${property} の値が正しくありません`,
			);
		}
	}
}

function validateSpan(
	node: unknown,
	path: string,
	errors: FlexJsonError[],
): void {
	if (!isJsonObject(node)) {
		addError(errors, path, "span はオブジェクトにしてください");
		return;
	}

	if (node.type !== "span") {
		addError(errors, path, 'span の type は "span" にしてください');
		return;
	}

	validateOptionalStrings(node, path, ["text", "size", "color"], errors);
	validateOptionalEnums(
		node,
		path,
		[
			["weight", TEXT_WEIGHTS],
			["decoration", TEXT_DECORATIONS],
			["style", TEXT_STYLES],
		],
		errors,
	);
}

function validateAction(
	action: unknown,
	path: string,
	errors: FlexJsonError[],
): void {
	if (!isJsonObject(action)) {
		addError(errors, path, "action はオブジェクトにしてください");
		return;
	}

	if (!hasOwn(action, "type") || !isOneOf(action.type, ACTION_TYPES)) {
		addError(
			errors,
			propertyPath(path, "type"),
			"action.type は uri / message / postback のいずれかにしてください",
		);
	}
	if (!hasOwn(action, "label") || typeof action.label !== "string") {
		addError(
			errors,
			propertyPath(path, "label"),
			"action.label を文字列で入れてください",
		);
	}
	validateOptionalStrings(action, path, ["uri", "text", "data"], errors);
}

function validateBox(
	node: JsonObject,
	path: string,
	errors: FlexJsonError[],
): void {
	if (!hasOwn(node, "layout") || !isOneOf(node.layout, BOX_LAYOUTS)) {
		addError(
			errors,
			propertyPath(path, "layout"),
			"layout は vertical / horizontal / baseline のいずれかにしてください",
		);
	}
	validateOptionalStrings(
		node,
		path,
		[
			"spacing",
			"margin",
			"paddingAll",
			"paddingTop",
			"paddingBottom",
			"paddingStart",
			"paddingEnd",
			"backgroundColor",
			"cornerRadius",
			"borderColor",
			"borderWidth",
		],
		errors,
	);
	validateOptionalNumbers(node, path, ["flex"], errors);
	validateOptionalEnums(
		node,
		path,
		[
			["justifyContent", JUSTIFY_CONTENTS],
			["alignItems", ALIGN_ITEMS],
		],
		errors,
	);

	if (!hasOwn(node, "contents") || !Array.isArray(node.contents)) {
		addError(
			errors,
			propertyPath(path, "contents"),
			"contents は配列にしてください",
		);
		return;
	}

	for (let index = 0; index < node.contents.length; index++) {
		validateComponent(
			node.contents[index],
			itemPath(propertyPath(path, "contents"), index),
			errors,
		);
	}
}

function validateText(
	node: JsonObject,
	path: string,
	errors: FlexJsonError[],
): void {
	validateOptionalStrings(
		node,
		path,
		["text", "size", "color", "margin", "lineSpacing"],
		errors,
	);
	validateOptionalNumbers(node, path, ["maxLines", "flex"], errors);
	validateOptionalBooleans(node, path, ["wrap"], errors);
	validateOptionalEnums(
		node,
		path,
		[
			["weight", TEXT_WEIGHTS],
			["align", TEXT_ALIGNS],
			["gravity", TEXT_GRAVITIES],
			["decoration", TEXT_DECORATIONS],
			["style", TEXT_STYLES],
		],
		errors,
	);

	if (!hasOwn(node, "contents")) {
		return;
	}
	if (!Array.isArray(node.contents)) {
		addError(
			errors,
			propertyPath(path, "contents"),
			"contents は配列にしてください",
		);
		return;
	}
	for (let index = 0; index < node.contents.length; index++) {
		validateSpan(
			node.contents[index],
			itemPath(propertyPath(path, "contents"), index),
			errors,
		);
	}
}

function validateImage(
	node: JsonObject,
	path: string,
	errors: FlexJsonError[],
): void {
	if (!hasOwn(node, "url") || typeof node.url !== "string") {
		addError(errors, propertyPath(path, "url"), "url を文字列で入れてください");
	}
	validateOptionalStrings(
		node,
		path,
		["size", "aspectRatio", "margin", "backgroundColor"],
		errors,
	);
	validateOptionalNumbers(node, path, ["flex"], errors);
	validateOptionalEnums(
		node,
		path,
		[
			["aspectMode", IMAGE_ASPECT_MODES],
			["align", TEXT_ALIGNS],
			["gravity", TEXT_GRAVITIES],
		],
		errors,
	);
}

function validateButton(
	node: JsonObject,
	path: string,
	errors: FlexJsonError[],
): void {
	if (!hasOwn(node, "action") || !isJsonObject(node.action)) {
		addError(
			errors,
			propertyPath(path, "action"),
			"action はオブジェクトにしてください",
		);
	} else {
		validateAction(node.action, propertyPath(path, "action"), errors);
	}
	validateOptionalStrings(node, path, ["color", "margin"], errors);
	validateOptionalNumbers(node, path, ["flex"], errors);
	validateOptionalEnums(
		node,
		path,
		[
			["style", BUTTON_STYLES],
			["height", BUTTON_HEIGHTS],
		],
		errors,
	);
}

function validateSeparator(
	node: JsonObject,
	path: string,
	errors: FlexJsonError[],
): void {
	validateOptionalStrings(node, path, ["margin", "color"], errors);
}

function validateSpacer(
	node: JsonObject,
	path: string,
	errors: FlexJsonError[],
): void {
	validateOptionalStrings(node, path, ["size"], errors);
}

function validateFiller(
	node: JsonObject,
	path: string,
	errors: FlexJsonError[],
): void {
	validateOptionalNumbers(node, path, ["flex"], errors);
}

function validateIcon(
	node: JsonObject,
	path: string,
	errors: FlexJsonError[],
): void {
	if (!hasOwn(node, "url") || typeof node.url !== "string") {
		addError(errors, propertyPath(path, "url"), "url を文字列で入れてください");
	}
	validateOptionalStrings(node, path, ["size"], errors);
}

function validateComponent(
	node: unknown,
	path: string,
	errors: FlexJsonError[],
): void {
	if (!isJsonObject(node)) {
		addError(errors, path, "部品はオブジェクトにしてください");
		return;
	}

	if (typeof node.type !== "string") {
		addError(
			errors,
			propertyPath(path, "type"),
			"type を文字列で入れてください",
		);
		return;
	}
	if (!isOneOf(node.type, COMPONENT_TYPES)) {
		addError(
			errors,
			path,
			`対応していない部品です: ${node.type}（プレビューに表示されません）`,
		);
		return;
	}

	switch (node.type) {
		case "box":
			validateBox(node, path, errors);
			break;
		case "text":
			validateText(node, path, errors);
			break;
		case "image":
			validateImage(node, path, errors);
			break;
		case "button":
			validateButton(node, path, errors);
			break;
		case "separator":
			validateSeparator(node, path, errors);
			break;
		case "spacer":
			validateSpacer(node, path, errors);
			break;
		case "filler":
			validateFiller(node, path, errors);
			break;
		case "icon":
			validateIcon(node, path, errors);
			break;
	}
}

function validateBubble(
	node: JsonObject,
	path: string,
	errors: FlexJsonError[],
): void {
	if (hasOwn(node, "size") && !isOneOf(node.size, BUBBLE_SIZES)) {
		addError(
			errors,
			propertyPath(path, "size"),
			"size は nano / micro / kilo / mega / giga のいずれかです",
		);
	}

	for (const section of BUBBLE_SECTIONS) {
		if (!hasOwn(node, section)) {
			continue;
		}
		const sectionValue = node[section];
		const sectionPath = propertyPath(path, section);
		const expectedType = section === "hero" ? "image" : "box";
		if (!isJsonObject(sectionValue) || sectionValue.type !== expectedType) {
			const message =
				section === "hero"
					? "hero（メイン画像）は image のみ対応です（LINE 仕様では box / video も使えますが、このライブラリはプレビューできません）"
					: "ここには box を入れてください";
			addError(errors, sectionPath, message);
			continue;
		}
		validateComponent(sectionValue, sectionPath, errors);
	}

	if (!hasOwn(node, "styles")) {
		return;
	}
	if (!isJsonObject(node.styles)) {
		addError(
			errors,
			propertyPath(path, "styles"),
			"styles はオブジェクトにしてください",
		);
		return;
	}

	for (const section of BUBBLE_SECTIONS) {
		if (!hasOwn(node.styles, section)) {
			continue;
		}
		const style = node.styles[section];
		const stylePath = propertyPath(propertyPath(path, "styles"), section);
		if (!isJsonObject(style)) {
			addError(errors, stylePath, "ここはオブジェクトにしてください");
			continue;
		}
		validateOptionalStrings(style, stylePath, ["backgroundColor"], errors);
		validateOptionalBooleans(style, stylePath, ["separator"], errors);
	}
}

function validateCarousel(
	node: JsonObject,
	path: string,
	errors: FlexJsonError[],
): void {
	const contentsPath = propertyPath(path, "contents");
	if (!hasOwn(node, "contents") || !Array.isArray(node.contents)) {
		addError(errors, contentsPath, "carousel の contents は配列にしてください");
		return;
	}

	for (let index = 0; index < node.contents.length; index++) {
		const bubble = node.contents[index];
		const bubblePath = itemPath(contentsPath, index);
		if (!isJsonObject(bubble) || bubble.type !== "bubble") {
			addError(errors, bubblePath, "carousel に入れられるのは bubble だけです");
			continue;
		}
		validateBubble(bubble, bubblePath, errors);
	}
}

/** 未知の値が Flex Message の形をしているか検査する */
export function validateFlexMessage(
	input: unknown,
): FlexMessageValidationResult {
	if (!isJsonObject(input)) {
		return {
			ok: false,
			errors: [
				{
					path: "",
					message: "JSON の一番外側はオブジェクトにしてください",
				},
			],
		};
	}

	const errors: FlexJsonError[] = [];
	if (!hasOwn(input, "type") || input.type !== "flex") {
		addError(errors, "type", 'type は "flex" にしてください');
	}

	if (!hasOwn(input, "altText") || typeof input.altText !== "string") {
		addError(
			errors,
			"altText",
			"altText（通知に出る文章）を文字列で入れてください",
		);
	} else {
		if (input.altText.length === 0) {
			addError(errors, "altText", "altText を 1 文字以上入れてください");
		}
		if (input.altText.length >= 401) {
			addError(errors, "altText", "altText が長すぎます（400文字まで）");
		}
	}

	if (!hasOwn(input, "contents") || !isJsonObject(input.contents)) {
		addError(
			errors,
			"contents",
			"contents に bubble か carousel を入れてください",
		);
	} else if (input.contents.type === "bubble") {
		validateBubble(input.contents, "contents", errors);
	} else if (input.contents.type === "carousel") {
		validateCarousel(input.contents, "contents", errors);
	} else {
		addError(
			errors,
			"contents.type",
			'contents.type は "bubble" か "carousel" にしてください',
		);
	}

	if (errors.length > 0) {
		return { ok: false, errors };
	}
	return { ok: true, value: input as unknown as FlexMessage };
}

/**
 * bubble / carousel（Flex Message の `contents`）だけを検査する。
 *
 * 🚨 検査そのものは `validateFlexMessage` を使い回す（500 行の規則を 2 つに割らない）。
 *    altText はここでは対象外なので、ダミーを入れて呼び、altText 由来の指摘だけ捨てる。
 *    パスの先頭に付く `contents.` も、利用者に見せる前に剥がす。
 */
export function validateFlexContainer(
	input: unknown,
): FlexContainerValidationResult {
	const result = validateFlexMessage({
		type: "flex",
		altText: "-",
		contents: input,
	});
	if (result.ok) {
		return { ok: true, value: result.value.contents };
	}
	const errors = result.errors
		.filter((e) => !e.path.startsWith("altText") && e.path !== "type")
		.map((e) => ({
			...e,
			path: e.path === "contents" ? "" : e.path.replace(/^contents\.?/, ""),
		}));
	// 🚨 altText だけが理由で落ちることは無いはずだが、空にして「問題なし」に見せない
	return { ok: false, errors: errors.length > 0 ? errors : result.errors };
}

/** JSON 文字列を parse してから contents として検査する */
export function parseFlexContainer(
	text: string,
): FlexContainerValidationResult {
	try {
		return validateFlexContainer(JSON.parse(text));
	} catch {
		return {
			ok: false,
			errors: [
				{
					path: "",
					message: "JSON として読めません（記号の対応を確かめてください）",
				},
			],
		};
	}
}

/** JSON 文字列を parse してから検査する */
export function parseFlexMessage(text: string): FlexMessageValidationResult {
	try {
		return validateFlexMessage(JSON.parse(text));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			ok: false,
			errors: [
				{
					path: "",
					message: `JSON として読み取れません: ${message}`,
				},
			],
		};
	}
}

/** 表示用に整形する（インデント 2） */
export function formatFlexJson(value: unknown): string {
	return JSON.stringify(value, null, 2);
}
