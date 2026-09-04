import type React from "react";
import type { FlexBubble, FlexContainer } from "../types";
import { NodeInspector } from "./inspectors";
import { JsonPanel } from "./JsonPanel";
import { Outline } from "./Outline";
import { getNode } from "./path";
import {
	ghostButtonStyle,
	hintStyle,
	panelStyle,
	sectionTitleStyle,
} from "./theme";
import type { EditorTemplate, FlexNodePath, InsertableKind } from "./types";
import { validateFlex } from "./validate";

export interface EditorPanelProps {
	container: FlexContainer;
	bubble: FlexBubble;
	selected: FlexNodePath | null;
	templates: EditorTemplate[];
	onSelect: (path: FlexNodePath) => void;
	onPatch: (path: FlexNodePath, patch: Record<string, unknown>) => void;
	onMove: (path: FlexNodePath, delta: number) => void;
	onRemove: (path: FlexNodePath) => void;
	onInsert: (parentPath: FlexNodePath, kind: InsertableKind) => void;
	onApplyTemplate: (template: EditorTemplate) => void;
	onImportJson: (container: FlexContainer) => void;
}

export function EditorPanel({
	container,
	bubble,
	selected,
	templates,
	onSelect,
	onPatch,
	onMove,
	onRemove,
	onInsert,
	onApplyTemplate,
	onImportJson,
}: EditorPanelProps): React.ReactElement {
	const selectedNode = selected ? getNode(bubble, selected) : undefined;

	return (
		<div>
			<div style={panelStyle}>
				<h3 style={sectionTitleStyle}>テンプレートから始める</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
					{templates.map((t) => (
						<button
							type="button"
							key={t.id}
							style={ghostButtonStyle}
							onClick={() => onApplyTemplate(t)}
							title={t.description}
						>
							{t.name}
						</button>
					))}
				</div>
			</div>

			<div style={panelStyle}>
				<h3 style={sectionTitleStyle}>組み立て</h3>
				<Outline
					bubble={bubble}
					selected={selected}
					onSelect={onSelect}
					onMove={onMove}
					onRemove={onRemove}
					onInsert={onInsert}
				/>
			</div>

			<div style={panelStyle}>
				<h3 style={sectionTitleStyle}>選んだ部品の設定</h3>
				{selected && selectedNode ? (
					<NodeInspector
						node={selectedNode}
						onPatch={(patch) => onPatch(selected, patch)}
					/>
				) : (
					<p style={hintStyle}>左の一覧から編集したい部品を選んでください</p>
				)}
			</div>

			<div style={panelStyle}>
				<h3 style={sectionTitleStyle}>JSON</h3>
				<JsonPanel
					container={container}
					onImport={onImportJson}
					issues={validateFlex(container)}
				/>
			</div>
		</div>
	);
}
