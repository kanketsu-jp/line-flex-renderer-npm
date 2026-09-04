import type React from "react";
import { ICON_SIZE, IMAGE_SIZE, SPACING, TEXT_SIZE } from "../constants";
import type {
	FlexBox,
	FlexButton,
	FlexComponentType,
	FlexIcon,
	FlexImage,
	FlexSeparator,
	FlexSpacer,
	FlexText,
} from "../types";
import { ColorField, SelectField, TextField, ToggleField } from "./fields";
import { editorColors } from "./theme";

export interface InspectorProps {
	node: FlexComponentType;
	onPatch: (patch: Record<string, unknown>) => void;
}

const sizeOptions = (map: Record<string, string>) =>
	Object.keys(map).map((k) => ({ value: k, label: k }));

const textSizeOptions = sizeOptions(TEXT_SIZE);
const spacingOptions = sizeOptions(SPACING);
const imageSizeOptions = sizeOptions(IMAGE_SIZE);
const iconSizeOptions = sizeOptions(ICON_SIZE);

const textWeightOptions = [
	{ value: "regular", label: "ふつう" },
	{ value: "bold", label: "太字" },
];

const alignOptions = [
	{ value: "start", label: "左" },
	{ value: "center", label: "中央" },
	{ value: "end", label: "右" },
];

const aspectModeOptions = [
	{ value: "cover", label: "切り抜き" },
	{ value: "fit", label: "全体を表示" },
];

const buttonActionTypeOptions = [
	{ value: "uri", label: "リンクを開く" },
	{ value: "message", label: "メッセージを送る" },
];

const buttonStyleOptions = [
	{ value: "primary", label: "塗り" },
	{ value: "secondary", label: "薄い" },
	{ value: "link", label: "文字だけ" },
];

const buttonHeightOptions = [
	{ value: "sm", label: "低い" },
	{ value: "md", label: "ふつう" },
];

const boxLayoutOptions = [
	{ value: "vertical", label: "縦" },
	{ value: "horizontal", label: "横" },
	{ value: "baseline", label: "横一列" },
];

export function TextInspector(props: {
	node: FlexText;
	onPatch: (p: Record<string, unknown>) => void;
}): React.ReactElement {
	const { node, onPatch } = props;
	return (
		<div>
			<TextField
				label="本文"
				multiline
				value={node.text ?? ""}
				onChange={(v) => onPatch({ text: v })}
			/>
			<SelectField
				label="文字サイズ"
				emptyLabel="既定"
				options={textSizeOptions}
				value={node.size}
				onChange={(v) => onPatch({ size: v })}
			/>
			<SelectField
				label="太さ"
				emptyLabel="既定"
				options={textWeightOptions}
				value={node.weight}
				onChange={(v) => onPatch({ weight: v })}
			/>
			<ColorField
				label="文字色"
				value={node.color}
				onChange={(v) => onPatch({ color: v })}
			/>
			<SelectField
				label="位置"
				emptyLabel="既定"
				options={alignOptions}
				value={node.align}
				onChange={(v) => onPatch({ align: v })}
			/>
			<ToggleField
				label="折り返す"
				value={node.wrap ?? false}
				onChange={(v) => onPatch({ wrap: v })}
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

export function ImageInspector(props: {
	node: FlexImage;
	onPatch: (p: Record<string, unknown>) => void;
}): React.ReactElement {
	const { node, onPatch } = props;
	return (
		<div>
			<TextField
				label="画像URL"
				value={node.url ?? ""}
				onChange={(v) => onPatch({ url: v })}
			/>
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

export function ButtonInspector(props: {
	node: FlexButton;
	onPatch: (p: Record<string, unknown>) => void;
}): React.ReactElement {
	const { node, onPatch } = props;
	const isMessage = node.action?.type === "message";

	const handleActionTypeChange = (v: string | undefined) => {
		const currentLabel = node.action?.label ?? "";
		if (v === "message") {
			onPatch({
				action: {
					type: "message",
					label: currentLabel,
					text: node.action?.text ?? "",
				},
			});
		} else {
			onPatch({
				action: {
					type: "uri",
					label: currentLabel,
					uri: node.action?.uri ?? "",
				},
			});
		}
	};

	return (
		<div>
			<TextField
				label="ボタンの文字"
				value={node.action?.label ?? ""}
				onChange={(v) =>
					onPatch({
						action: {
							...(node.action ?? { type: "uri", uri: "" }),
							label: v,
						},
					})
				}
			/>
			<SelectField
				label="動作"
				options={buttonActionTypeOptions}
				value={isMessage ? "message" : "uri"}
				onChange={handleActionTypeChange}
			/>
			{!isMessage ? (
				<TextField
					label="リンクURL"
					hint="http / https / line / tel で始めてください"
					value={node.action?.uri ?? ""}
					onChange={(v) =>
						onPatch({
							action: {
								...(node.action ?? { type: "uri", label: "" }),
								uri: v,
							},
						})
					}
				/>
			) : (
				<TextField
					label="送信メッセージ"
					value={node.action?.text ?? ""}
					onChange={(v) =>
						onPatch({
							action: {
								...(node.action ?? { type: "message", label: "" }),
								text: v,
							},
						})
					}
				/>
			)}
			<SelectField
				label="見た目"
				emptyLabel="既定"
				options={buttonStyleOptions}
				value={node.style}
				onChange={(v) => onPatch({ style: v })}
			/>
			<ColorField
				label="ボタン色"
				value={node.color}
				onChange={(v) => onPatch({ color: v })}
			/>
			<SelectField
				label="高さ"
				emptyLabel="既定"
				options={buttonHeightOptions}
				value={node.height}
				onChange={(v) => onPatch({ height: v })}
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

export function BoxInspector(props: {
	node: FlexBox;
	onPatch: (p: Record<string, unknown>) => void;
}): React.ReactElement {
	const { node, onPatch } = props;
	return (
		<div>
			<SelectField
				label="並べ方"
				options={boxLayoutOptions}
				value={node.layout ?? "vertical"}
				onChange={(v) => {
					if (v) onPatch({ layout: v });
				}}
			/>
			<SelectField
				label="部品の間隔"
				emptyLabel="なし"
				options={spacingOptions}
				value={node.spacing}
				onChange={(v) => onPatch({ spacing: v })}
			/>
			<SelectField
				label="内側の余白"
				emptyLabel="なし"
				options={spacingOptions}
				value={node.paddingAll}
				onChange={(v) => onPatch({ paddingAll: v })}
			/>
			<ColorField
				label="背景色"
				value={node.backgroundColor}
				onChange={(v) => onPatch({ backgroundColor: v })}
			/>
			<SelectField
				label="角丸"
				emptyLabel="なし"
				options={spacingOptions}
				value={node.cornerRadius}
				onChange={(v) => onPatch({ cornerRadius: v })}
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

export function IconInspector(props: {
	node: FlexIcon;
	onPatch: (p: Record<string, unknown>) => void;
}): React.ReactElement {
	const { node, onPatch } = props;
	return (
		<div>
			<TextField
				label="画像URL"
				value={node.url ?? ""}
				onChange={(v) => onPatch({ url: v })}
			/>
			<SelectField
				label="サイズ"
				emptyLabel="既定"
				options={iconSizeOptions}
				value={node.size}
				onChange={(v) => onPatch({ size: v })}
			/>
		</div>
	);
}

export function SeparatorInspector(props: {
	node: FlexSeparator;
	onPatch: (p: Record<string, unknown>) => void;
}): React.ReactElement {
	const { node, onPatch } = props;
	return (
		<div>
			<ColorField
				label="線の色"
				value={node.color}
				onChange={(v) => onPatch({ color: v })}
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

export function SpacerInspector(props: {
	node: FlexSpacer;
	onPatch: (p: Record<string, unknown>) => void;
}): React.ReactElement {
	const { node, onPatch } = props;
	return (
		<div>
			<SelectField
				label="サイズ"
				emptyLabel="なし"
				options={spacingOptions}
				value={node.size}
				onChange={(v) => onPatch({ size: v })}
			/>
		</div>
	);
}

export function NodeInspector(props: InspectorProps): React.ReactElement {
	const { node, onPatch } = props;
	switch (node.type) {
		case "text":
			return <TextInspector node={node} onPatch={onPatch} />;
		case "image":
			return <ImageInspector node={node} onPatch={onPatch} />;
		case "button":
			return <ButtonInspector node={node} onPatch={onPatch} />;
		case "box":
			return <BoxInspector node={node} onPatch={onPatch} />;
		case "icon":
			return <IconInspector node={node} onPatch={onPatch} />;
		case "separator":
			return <SeparatorInspector node={node} onPatch={onPatch} />;
		case "spacer":
			return <SpacerInspector node={node} onPatch={onPatch} />;
		case "filler":
			return (
				<p style={{ color: editorColors.subText, fontSize: 13, margin: 0 }}>
					この部品に設定はありません
				</p>
			);
		default: {
			const _exhaustive: never = node;
			return (
				<p style={{ color: editorColors.subText, fontSize: 13, margin: 0 }}>
					この部品に設定はありません
				</p>
			);
		}
	}
}
