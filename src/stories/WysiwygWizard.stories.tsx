import type { Meta, StoryObj } from "@storybook/react-vite";
import { WizardDemo } from "./wysiwyg/editor/WizardDemo";

/**
 * ウィザード デモ（呼び出し側込み）— テンプレ選択 → エディタ → 仕上げ（プレビュー＋JSON）。
 *
 * PC は 2 カラムレイアウト、SP は縦積み（コンテナ幅で自動切替）。
 * ツールバーの viewport で SP/PC を切替可能。
 */

const meta: Meta<typeof WizardDemo> = {
	title: "WysiwygEditor/ウィザード デモ（呼び出し側込み）",
	component: WizardDemo,
	parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof WizardDemo>;

export const Default: Story = {};
