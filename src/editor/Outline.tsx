import type React from "react";
import { Fragment } from "react";
import type { FlexBubble } from "../types";
import { isSamePath, listNodes } from "./path";
import { editorColors, ghostButtonStyle, iconButtonStyle } from "./theme";
import type { FlexNodePath, InsertableKind } from "./types";

export interface OutlineProps {
	bubble: FlexBubble;
	selected: FlexNodePath | null;
	onSelect: (path: FlexNodePath) => void;
	onMove: (path: FlexNodePath, delta: number) => void;
	onRemove: (path: FlexNodePath) => void;
	onInsert: (parentPath: FlexNodePath, kind: InsertableKind) => void;
}

const INSERT_BUTTONS: ReadonlyArray<{
	kind: InsertableKind;
	label: string;
}> = [
	{ kind: "text", label: "＋ テキスト" },
	{ kind: "image", label: "＋ 画像" },
	{ kind: "button", label: "＋ ボタン" },
	{ kind: "separator", label: "＋ 区切り線" },
	{ kind: "box", label: "＋ グループ" },
];

export function Outline({
	bubble,
	selected,
	onSelect,
	onMove,
	onRemove,
	onInsert,
}: OutlineProps): React.ReactElement {
	const entries = listNodes(bubble);

	return (
		<ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
			{entries.map((entry) => {
				const pathKey = `${entry.path.section}-${entry.path.indices.join("-")}`;
				const isSelected = isSamePath(selected, entry.path);
				const labelStyle: React.CSSProperties = {
					...ghostButtonStyle,
					flex: 1,
					textAlign: "left",
					...(isSelected
						? {
								border: `1px solid ${editorColors.accent}`,
								color: editorColors.accent,
								fontWeight: 700,
							}
						: {}),
				};

				return (
					<Fragment key={pathKey}>
						<li
							style={{
								display: "flex",
								alignItems: "center",
								gap: 4,
								paddingLeft: entry.depth * 12,
							}}
						>
							<button
								type="button"
								onClick={() => onSelect(entry.path)}
								style={labelStyle}
							>
								{entry.label}
							</button>
							{entry.depth > 0 && (
								<>
									<button
										type="button"
										aria-label="上へ移動"
										style={iconButtonStyle}
										onClick={() => onMove(entry.path, -1)}
									>
										↑
									</button>
									<button
										type="button"
										aria-label="下へ移動"
										style={iconButtonStyle}
										onClick={() => onMove(entry.path, 1)}
									>
										↓
									</button>
								</>
							)}
							<button
								type="button"
								aria-label="削除"
								style={iconButtonStyle}
								onClick={() => onRemove(entry.path)}
							>
								✕
							</button>
						</li>
						{entry.node.type === "box" && (
							<li
								key={`${pathKey}-insert`}
								style={{
									paddingLeft: (entry.depth + 1) * 12,
									display: "flex",
									flexWrap: "wrap",
									gap: 4,
									marginBottom: 4,
								}}
							>
								{INSERT_BUTTONS.map((item) => (
									<button
										key={item.kind}
										type="button"
										style={ghostButtonStyle}
										onClick={() => onInsert(entry.path, item.kind)}
									>
										{item.label}
									</button>
								))}
							</li>
						)}
					</Fragment>
				);
			})}
		</ul>
	);
}
