import type { Meta, StoryObj } from "@storybook/react-vite";
import { FlexWysiwygEditor } from "./wysiwyg/editor/FlexWysiwygEditor";
import { WizardDemo } from "./wysiwyg/editor/WizardDemo";

/**
 * 採用案 — モバイル(M2 洗練版) と PC(案A 洗練版) を 1 コンポーネントに統合した WYSIWYG エディタ。
 *
 * - Divider の「＋」→ 部品選択シート（SP: 下 / PC: 右パネル）
 * - 部品選択 →「編集」「削除」バー → 編集でフィールドUIシート
 * - テンプレ選択と「戻る/次へ」は呼び出し側（WizardDemo を参照）
 * - レイアウトはコンテナ幅で自動切替（ビューポート切替で SP/PC を確認可）
 */

const meta: Meta<typeof FlexWysiwygEditor> = {
	title: "WysiwygEditor/エディタ本体",
	component: FlexWysiwygEditor,
	parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof FlexWysiwygEditor>;

/** ウィザード全体（テンプレ選択 → エディタ → 仕上げ）。ツールバーの viewport で SP/PC を切替 */
const wizardMeta: Meta<typeof WizardDemo> = {
	title: "WysiwygEditor/ウィザード デモ（呼び出し側込み）",
	component: WizardDemo,
	parameters: { layout: "fullscreen" },
};

export { wizardMeta };

export const Editor: Story = {
	render: () => (
		<FlexWysiwygEditor
			value={{
				type: "bubble",
				body: {
					type: "box",
					layout: "vertical",
					spacing: "md",
					contents: [],
				},
			}}
		/>
	),
};

export const Wizard = {
	render: () => <WizardDemo />,
};
