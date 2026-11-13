import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FlexBubble } from "../types";
import ReceiptJson from "./templates/Receipt.json";
import { ConceptCanvas } from "./wysiwyg/ConceptA";

const initial = ReceiptJson as FlexBubble;

/**
 * WYSIWYG エディタ 5 案プロトタイプ（Issue #10）
 *
 * - 案A: ダイレクト操作キャンバス（Canva / Figma 型）→ 中央の実機プレビューを直接操作
 * - 案B: ブロックハンドル（Notion / BlockNote 型）→ 1部品=1行、ハンドルで挿入・並べ替え
 * - 案C: 3 ペイン ビルダー（Webflow 型）→ パレット/レイヤー/キャンバス/インスペクタ
 * - 案D: ステップ ウィザード（初心者向け）→ テンプレ選択→部品追加→仕上げの3ステップ
 * - 案E: 現行 FlexEditor 漸進進化型 → 旧UIのままプレビューが選択可能に
 */

const meta: Meta<typeof ConceptCanvas> = {
	title: "WysiwygConcepts/案A キャンバス型 (Canva/Figma)",
	component: ConceptCanvas,
	parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ConceptCanvas>;

export const Default: Story = {
	args: { initial },
};
