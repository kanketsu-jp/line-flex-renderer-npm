import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { FlexContainer } from "../types";
import {
	buttonStyle,
	editorColors,
	ghostButtonStyle,
	hintStyle,
	inputStyle,
	panelStyle,
	sectionTitleStyle,
} from "./theme";
import type { FlexValidationIssue } from "./types";
import { formatFlexJson, parseFlexContainer } from "./validateMessage";

export interface JsonPanelProps {
	container: FlexContainer;
	/** 「保存」を押して検証が通ったときだけ呼ばれる */
	onImport: (container: FlexContainer) => void;
	issues?: FlexValidationIssue[];
}

const codeStyle: React.CSSProperties = {
	...inputStyle,
	fontFamily:
		'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
	fontSize: 12,
	lineHeight: 1.6,
	width: "100%",
	boxSizing: "border-box",
	whiteSpace: "pre",
	overflowX: "auto",
};

/**
 * JSON の節。
 *
 * 読み取り専用のコードブロック 1 つを出し、その下に「コピー」「編集」。
 * 「編集」を押すと同じ場所が編集できるようになり、ボタンが「保存」「キャンセル」に変わる。
 *
 * 🚨 「保存」は **差分が無ければ押せない**（disabled）。
 * 🚨 検証は**入力のたび**と**保存を押したとき**の両方で行う（保存で最後にもう一度見る）。
 * 🚨 以前あった貼り付け用の別欄は廃止した（その見出しをここに書くと、
 *    「もう無いこと」を数える検査に引っかかる）。読み込みは「保存」1 つに集約する。
 */
export function JsonPanel({
	container,
	onImport,
	issues,
}: JsonPanelProps): React.ReactElement {
	const formatted = formatFlexJson(container);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(formatted);
	const [copied, setCopied] = useState(false);
	const baselineRef = useRef(formatted);

	// 🚨 編集していない間は、外から入った変更をそのまま映す。
	//    編集中に上書きすると、打っている途中の文字が消える。
	useEffect(() => {
		if (editing) return;
		setDraft(formatted);
		baselineRef.current = formatted;
	}, [formatted, editing]);

	const result = editing ? parseFlexContainer(draft) : null;
	const changed = draft !== baselineRef.current;
	// 🚨 原文どおり「差分が無いとき」だけ押せなくする。型のエラーは押せなくする理由にしない
	//    （入力中に理由を出し、押されたらそこで弾く）。ここに検証を混ぜると、
	//    押下時の検証が到達不能になり、守りが 1 枚しか無いのに 2 枚あるように見える。
	const canSave = editing && changed;

	const handleCopy = () => {
		if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
			void navigator.clipboard.writeText(formatted);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		}
	};

	const handleSave = () => {
		// 🚨 押された時点でもう一度検証する（入力時の結果を信じない）
		const checked = parseFlexContainer(draft);
		if (!checked.ok) return;
		onImport(checked.value);
		baselineRef.current = draft;
		setEditing(false);
	};

	const handleCancel = () => {
		setDraft(baselineRef.current);
		setEditing(false);
	};

	return (
		<div style={panelStyle}>
			<textarea
				aria-label="Flex メッセージの JSON"
				readOnly={!editing}
				value={editing ? draft : formatted}
				onChange={(e) => setDraft(e.target.value)}
				rows={14}
				spellCheck={false}
				style={{
					...codeStyle,
					backgroundColor: editing ? undefined : editorColors.previewBg,
					marginBottom: 8,
				}}
			/>

			<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
				{editing ? (
					<>
						<button
							type="button"
							style={{
								...buttonStyle,
								opacity: canSave ? 1 : 0.5,
								cursor: canSave ? "pointer" : "not-allowed",
							}}
							disabled={!canSave}
							onClick={handleSave}
						>
							保存
						</button>
						<button
							type="button"
							style={ghostButtonStyle}
							onClick={handleCancel}
						>
							キャンセル
						</button>
					</>
				) : (
					<>
						<button type="button" style={buttonStyle} onClick={handleCopy}>
							{copied ? "コピーしました" : "コピー"}
						</button>
						<button
							type="button"
							style={ghostButtonStyle}
							onClick={() => setEditing(true)}
						>
							編集
						</button>
					</>
				)}
			</div>

			{editing && !changed && <p style={hintStyle}>変更はありません</p>}
			{editing && result && !result.ok && (
				<ul
					role="alert"
					style={{
						margin: "8px 0 0",
						paddingLeft: 20,
						fontSize: 12,
						color: editorColors.danger,
					}}
				>
					{result.errors.map((e) => (
						<li key={`${e.path}-${e.message}`} style={{ marginBottom: 4 }}>
							{e.path ? `${e.path}: ` : ""}
							{e.message}
						</li>
					))}
				</ul>
			)}

			{issues !== undefined && (
				<div>
					<h4 style={{ ...sectionTitleStyle, marginTop: 16 }}>チェック結果</h4>
					{issues.length === 0 ? (
						<p style={hintStyle}>問題は見つかりませんでした</p>
					) : (
						<ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 12 }}>
							{issues.map((issue) => (
								<li
									key={`${issue.severity}-${issue.path?.section ?? "root"}-${issue.path?.indices.join(".") ?? ""}-${issue.message}`}
									style={{
										color:
											issue.severity === "error"
												? editorColors.danger
												: editorColors.subText,
										marginBottom: 4,
									}}
								>
									{issue.severity === "error" ? "⚠️ " : "ℹ️ "}
									{issue.message}
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
