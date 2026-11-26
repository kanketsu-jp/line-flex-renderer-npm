import type React from "react";
import { ICON_SIZE, IMAGE_SIZE, SPACING } from "../../constants";
import { ColorField, SelectField, TextField } from "../../editor/fields";
import { NodeInspector } from "../../editor/inspectors";
import type { FlexComponentType, FlexImage } from "../../types";
import { ImageUploadField } from "./ImageUploadField";
import { w } from "./theme";

/**
 * WYSIWYG 用インスペクタ。
 *
 * - image のときだけ「アップロード式」の画像 UI に差し替え
 *   （レガシー FlexEditor の ImageInspector は URL 直入力のまま互換維持）
 * - それ以外の部品は既存 NodeInspector をそのまま利用
 */

export interface WysiwygInspectorProps {
	lockedUris?: string[];
	node: FlexComponentType;
	onPatch: (patch: Record<string, unknown>) => void;
	/** ホスト側画像アップローダ（未指定なら data URL で即プレビュー） */
	onImageUpload?: (file: File) => Promise<string>;
}

const sizeOptions = (map: Record<string, string>) =>
	Object.keys(map).map((k) => ({ value: k, label: k }));

const imageSizeOptions = sizeOptions(IMAGE_SIZE);
const spacingOptions = sizeOptions(SPACING);

const aspectModeOptions = [
	{ value: "cover", label: "切り抜き" },
	{ value: "fit", label: "全体を表示" },
];

const alignOptions = [
	{ value: "start", label: "左" },
	{ value: "center", label: "中央" },
	{ value: "end", label: "右" },
];

function ImageUploadInspector({
	node,
	onPatch,
	onImageUpload,
}: {
	node: FlexImage;
	onPatch: (p: Record<string, unknown>) => void;
	onImageUpload?: (file: File) => Promise<string>;
}): React.ReactElement {
	return (
		<div
			style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}
		>
			<ImageUploadField
				value={node.url}
				onUrlChange={(url) => onPatch({ url })}
				onUpload={onImageUpload}
			/>
			<div style={{ height: 12 }} />
			<SelectField
				label="サイズ"
				emptyLabel="既定"
				options={imageSizeOptions}
				value={node.size}
				onChange={(v) => onPatch({ size: v })}
			/>
			<TextField
				label="縦横比"
				placeholder="20:13"
				value={node.aspectRatio ?? ""}
				onChange={(v) =>
					onPatch({ aspectRatio: v.trim() === "" ? undefined : v })
				}
			/>
			<SelectField
				label="表示方法"
				emptyLabel="既定"
				options={aspectModeOptions}
				value={node.aspectMode}
				onChange={(v) => onPatch({ aspectMode: v })}
			/>
			<SelectField
				label="位置"
				emptyLabel="既定"
				options={alignOptions}
				value={node.align}
				onChange={(v) => onPatch({ align: v })}
			/>
			<ColorField
				label="背景色"
				value={node.backgroundColor}
				onChange={(v) => onPatch({ backgroundColor: v })}
			/>
			<SelectField
				label="上の余白"
				emptyLabel="なし"
				options={spacingOptions}
				value={node.margin}
				onChange={(v) => onPatch({ margin: v })}
			/>
		</div>
	);
}

export function WysiwygInspector({
	lockedUris,
	node,
	onPatch,
	onImageUpload,
}: WysiwygInspectorProps): React.ReactElement {
	if (node.type === "image") {
		return (
			<ImageUploadInspector
				node={node}
				onPatch={onPatch}
				onImageUpload={onImageUpload}
			/>
		);
	}
	return (
		<NodeInspector lockedUris={lockedUris} node={node} onPatch={onPatch} />
	);
}

// 未使用警告回避のため再エクスポート（ICON_SIZE は将来の icon アップロード対応で使用）
void ICON_SIZE;
void w;
