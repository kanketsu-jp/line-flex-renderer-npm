import type React from "react";
import { useState } from "react";
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

export interface JsonPanelProps {
	container: FlexContainer;
	onImport: (container: FlexContainer) => void;
	issues?: FlexValidationIssue[];
}

export function JsonPanel({
	container,
	onImport,
	issues,
}: JsonPanelProps): React.ReactElement {
	const [draft, setDraft] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleCopy = () => {
		if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
			void navigator.clipboard.writeText(JSON.stringify(container, null, 2));
		}
	};

	const handleImport = () => {
		try {
			const parsed = JSON.parse(draft) as { type?: string };
			if (parsed?.type === "bubble" || parsed?.type === "carousel") {
				setError(null);
				onImport(parsed as unknown as FlexContainer);
				return;
			}
		} catch {
			// 下でエラー表示
		}
		setError(
			"JSONを読み取れませんでした。bubble か carousel の JSON を貼り付けてください",
		);
	};

	return (
		<div style={panelStyle}>
			<h4 style={sectionTitleStyle}>書き出すJSON</h4>
			<textarea
				aria-label="書き出すJSON"
				readOnly
				value={JSON.stringify(container, null, 2)}
				rows={10}
				style={{
					...inputStyle,
					fontFamily: "monospace",
					fontSize: 12,
					marginBottom: 8,
				}}
			/>
			<button type="button" style={buttonStyle} onClick={handleCopy}>
				コピー
			</button>

			<h4 style={{ ...sectionTitleStyle, marginTop: 16 }}>JSONを読み込む</h4>
			<textarea
				aria-label="読み込むJSON"
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				rows={6}
				placeholder="ここに Flex Message の JSON を貼り付けてください"
				style={{
					...inputStyle,
					fontFamily: "monospace",
					fontSize: 12,
					marginBottom: 8,
				}}
			/>
			<button type="button" style={ghostButtonStyle} onClick={handleImport}>
				読み込む
			</button>
			{error && (
				<p role="alert" style={{ ...hintStyle, color: editorColors.danger }}>
					{error}
				</p>
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
