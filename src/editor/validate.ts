import type {
	FlexBubble,
	FlexComponentType,
	FlexContainer,
	FlexMessage,
} from "../types";
import type { FlexNodePath, FlexSection, FlexValidationIssue } from "./types";

const COLOR_REGEX = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
const SECTIONS: FlexSection[] = ["header", "hero", "body", "footer"];

function checkColorProps(
	node: FlexComponentType,
	path: FlexNodePath | null,
	issues: FlexValidationIssue[],
): void {
	const record = node as unknown as Record<string, unknown>;
	for (const prop of ["color", "backgroundColor", "borderColor"] as const) {
		const val = record[prop];
		if (typeof val === "string" && val.length > 0) {
			if (!COLOR_REGEX.test(val)) {
				issues.push({
					path,
					message: "色は #RRGGBB か #RRGGBBAA の形式を推奨します",
					severity: "warning",
				});
			}
		}
	}
}

function validateComponent(
	node: FlexComponentType,
	path: FlexNodePath | null,
	isCarousel: boolean,
	issues: FlexValidationIssue[],
): void {
	// ルール 17: 色の判定
	checkColorProps(node, path, issues);

	switch (node.type) {
		case "image": {
			// ルール 2: image.url が空
			if (!node.url || node.url === "") {
				issues.push({
					path,
					message: "画像のURLが未入力です",
					severity: "error",
				});
			} else {
				// ルール 3: image.url が https:// で始まらない
				if (!node.url.startsWith("https://")) {
					issues.push({
						path,
						message: "画像URLは https:// で始まる必要があります",
						severity: "error",
					});
				}
				// ルール 4: image.url が 2000 文字超
				if (node.url.length > 2000) {
					issues.push({
						path,
						message: "画像URLが長すぎます（2000文字まで）",
						severity: "error",
					});
				}
			}
			break;
		}
		case "button": {
			// ルール 5: button.action が無い
			if (!node.action) {
				issues.push({
					path,
					message: "ボタンの動作が設定されていません",
					severity: "error",
				});
			} else if (node.action.type === "uri") {
				// ルール 6: action.type が "uri" で uri が空
				if (!node.action.uri || node.action.uri === "") {
					issues.push({
						path,
						message: "ボタンのリンクURLが未入力です",
						severity: "error",
					});
				} else {
					// ルール 7: スキームが http: https: line: tel: のいずれでもない
					const hasValidScheme = /^(https?:|line:|tel:)/i.test(node.action.uri);
					if (!hasValidScheme) {
						issues.push({
							path,
							message: "リンクURLは http / https / line / tel で始めてください",
							severity: "error",
						});
					}
					// ルール 8: uri が 1000 文字超
					if (node.action.uri.length > 1000) {
						issues.push({
							path,
							message: "リンクURLが長すぎます（1000文字まで）",
							severity: "error",
						});
					}
				}
			} else if (node.action.type === "message") {
				// ルール 9: action.type が "message" で text が空
				if (!node.action.text || node.action.text === "") {
					issues.push({
						path,
						message: "送信メッセージが未入力です",
						severity: "error",
					});
				} else if (node.action.text.length > 300) {
					// ルール 10: text が 300 文字超
					issues.push({
						path,
						message: "送信メッセージが長すぎます（300文字まで）",
						severity: "error",
					});
				}
			}
			break;
		}
		case "text": {
			// ルール 11: text も contents も空
			const hasText = typeof node.text === "string" && node.text.length > 0;
			const hasContents =
				Array.isArray(node.contents) && node.contents.length > 0;
			if (!hasText && !hasContents) {
				issues.push({
					path,
					message: "テキストが空です",
					severity: "error",
				});
			}
			break;
		}
		case "box": {
			// ルール 16: box の contents が空（warning）
			if (!node.contents || node.contents.length === 0) {
				issues.push({
					path,
					message: "中身が空のグループがあります（プレビューに何も出ません）",
					severity: "warning",
				});
			} else {
				// ルール 15: layout: "baseline" の box の contents に icon / text / filler 以外がある
				if (node.layout === "baseline") {
					for (let i = 0; i < node.contents.length; i++) {
						const child = node.contents[i];
						if (
							child &&
							child.type !== "icon" &&
							child.type !== "text" &&
							child.type !== "filler"
						) {
							const childPath =
								isCarousel || !path
									? null
									: { section: path.section, indices: [...path.indices, i] };
							issues.push({
								path: childPath,
								message:
									"横一列のグループには アイコン・テキスト しか置けません",
								severity: "error",
							});
						}
					}
				}

				// 子ノードの再帰
				for (let i = 0; i < node.contents.length; i++) {
					const child = node.contents[i];
					if (child) {
						const childPath =
							isCarousel || !path
								? null
								: { section: path.section, indices: [...path.indices, i] };
						validateComponent(child, childPath, isCarousel, issues);
					}
				}
			}
			break;
		}
	}
}

function validateBubble(
	bubble: FlexBubble,
	isCarousel: boolean,
	issues: FlexValidationIssue[],
): void {
	// ルール 1: bubble に header / hero / body / footer が 1 つも無い
	if (!bubble.header && !bubble.hero && !bubble.body && !bubble.footer) {
		issues.push({
			path: null,
			message: "表示する中身がありません。本文などを追加してください",
			severity: "error",
		});
		return;
	}

	for (const section of SECTIONS) {
		const root = bubble[section];
		if (!root) {
			continue;
		}
		const path: FlexNodePath | null = isCarousel
			? null
			: { section, indices: [] };
		validateComponent(root, path, isCarousel, issues);
	}
}

export function validateFlex(container: FlexContainer): FlexValidationIssue[] {
	const issues: FlexValidationIssue[] = [];

	if (container.type === "carousel") {
		// ルール 12: carousel の contents が 0 個
		if (!container.contents || container.contents.length === 0) {
			issues.push({
				path: null,
				message: "カルーセルに bubble がありません",
				severity: "error",
			});
			return issues;
		}

		// ルール 13: carousel の contents が 12 個超
		if (container.contents.length > 12) {
			issues.push({
				path: null,
				message: "カルーセルの bubble は 12 個までです",
				severity: "error",
			});
		}

		// ルール 14: carousel の bubble の size が揃っていない
		if (container.contents.length > 1) {
			const firstSize = container.contents[0]?.size ?? "mega";
			const hasMismatch = container.contents.some(
				(b) => (b.size ?? "mega") !== firstSize,
			);
			if (hasMismatch) {
				issues.push({
					path: null,
					message: "カルーセル内の bubble はすべて同じサイズにしてください",
					severity: "error",
				});
			}
		}

		// 各 bubble の検査（isCarousel = true）
		for (const bubble of container.contents) {
			validateBubble(bubble, true, issues);
		}
	} else if (container.type === "bubble") {
		validateBubble(container, false, issues);
	}

	return issues;
}

export function toFlexMessage(
	container: FlexContainer,
	altText: string,
): FlexMessage {
	return {
		type: "flex",
		altText,
		contents: container,
	};
}
