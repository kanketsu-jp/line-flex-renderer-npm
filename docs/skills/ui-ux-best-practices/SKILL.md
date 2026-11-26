---
name: ui-ux-best-practices
description: line-flex-message-renderer のエディタ UI（WYSIWYG 含む）を実装・変更・レビューするときに適用する UI/UX の品質基準。キーボード操作・フォーカス管理・選択・DnD・ポップアップ・ARIA のベストプラクティスを、Vercel UI SDK のビヘイビア設計を規範とし、shadcn/ui で実装する。FlexEditor / FlexWysiwygEditor / InteractiveTree / Outline / inspectors / fields など src/editor と src/wysiwyg 配下の UI を触るときは必ずこのスキルを参照する。
---

# UI/UX ベストプラクティス（このライブラリの品質基準）

## 位置づけ

- **規範（正しい振る舞いの定義）**: [Vercel UI SDK](https://ui-sdk.dev/docs)（vercel-labs/ui）のビヘイビア設計。
  キーボード操作・フォーカス・選択・ポップアップ・DnD・ARIA を正しく実装したヘッドレス部品集。
  **エージェント機能（createAgent / agentTools）は本ライブラリでは対象外。**
- **実装技術（実際に使うもの）**: [shadcn/ui](https://ui.shadcn.com)。
  UI SDK のビヘイビアが担保する操作感を、shadcn コンポーネントで実現する。
- UI SDK はベータ。API が変わる可能性があるため、**ライブラリ名ではなく「振る舞いの定義」だけを取り込む**。
  本ライブラリの依存には追加しない。

## 8 つの原則とチェックリスト

### 1. Roving Focus（巡回フォーカス）

- 部品のリスト（アウトライン、挿入メニュー、ツールバー）は **Tab stop を 1 つだけ**持つ
- 矢印キー（↑↓ または ←→）で項目間を移動。`Home` / `End` で先頭・末尾
- 横方向の ←→ はページの書字方向（LTR/RTL）に従う
- shadcn: `Toolbar` / `ToggleGroup` / `RadioGroup` は roving focus を内蔵。自作するときは `role="toolbar"` + `aria-orientation` + tabIndex 制御（現在フォーカス項目のみ `tabIndex={0}`）

### 2. Focus Recovery（フォーカス復元）

- フォーカスされた部品が**削除・移動されたら、フォーカスを失わない**。隣の部品（なければ親）へ移す
- 編集パネルを閉じたら、開いたトリガーへ戻す
- 実装: 削除系操作（remove/move/duplicate）のあとのフォーカス先を必ず決める。`document.activeElement` を消す前に次のフォーカス先要素へ `focus()` する

### 3. Selection（選択）

- 選択は 1 つ（single selection）。選択状態は視覚（枠 + ラベル）と ARIA（`aria-selected` / `aria-current`）の両方で表現
- キャンバスの背景クリック / `Escape` で選択解除
- `Delete` / `Backspace` で削除（`lockedUris` 保護部品は拒否し、理由を知らせる）
- 選択変更はスクリーンリーダーに告知（`announce` 相当: `aria-live="polite"` 領域へメッセージ）

### 4. Drag & Drop（ドラッグ アンド ドロップ）

- ポインタ操作と**キーボード操作の両方**で同じ結果を得られる（↑↓ ボタンやメニューを必ず併設）
- ドラッグ中の値は **draft（ドラフト）** として保持し、**drop したときだけ commit**（状態を確定）
- ドロップ先は 2px 以上の明確なインジケータで示す。垂直 box は横線、水平 box は縦線
- `baseline` box へのドロップ不可要素（box/image/button）はドロップ先として表示しない（Line 仕様の配置制約を UI で防ぐ）
- 並べ替えの結果をスクリーンリーダーに告知（「"テキスト: 件名" を 2 番目に移動しました」）
- 自動スクロール: 長いコンテンツでは端に近づいたらスクロール

### 5. Popup（ポップオーバー / メニュー / ダイアログ）

- **dismissal（閉じ方）は必ず複数**: `Escape`、外側クリック、閉じるボタン
- 配置はトリガーの隣（flip / collision 対応）。トリガーとポップオーバーの関係を `aria-haspopup` + `aria-expanded` で明示
- アクセシブル名: `popupTitle`（`aria-labelledby`）と説明 `popupDescription`（`aria-describedby`）を必ず渡す
- **未保存の編集があるポップアップは `dismissible: false` 相当にする**（Escape / 外側クリックを抑止し、閉じる前に確認）
- shadcn: `Popover` / `DropdownMenu` / `Dialog` は dismissal・placement・focus を内蔵。**自作の absolute メニューは作らない**

### 6. Inline Edit（インライン編集）

- テキスト部品はダブルクリック（または `Enter`）でその場編集
- **Enter で commit、`Shift+Enter` で改行、`Escape` でキャンセル**（元の値へ戻す）
- フォーカスを外したら（blur）commit。編集中は元の値を表示し続け、確定時にだけ状態を更新（draft/commit 分離）
- IME 変換中（isComposing）は Enter を commit と扱わない

### 7. Tree（アウトライン / レイヤー）

- ツリー行の ARIA: `role="treeitem"`、`aria-level`（1 始まり）、`aria-posinset`（兄弟内の位置）、`aria-setsize`（兄弟の数）、`aria-expanded`（展開状態）
- キーボード: ↑↓ で行間移動、→ で展開、← で閉じる（末尾では親へ）、`Home` / `End`
- 入力でジャンプ（typeahead）: 行のラベルを打つと一致する行へ移動
- ノード削除時は descendants まとめて扱うことを表示で明示

### 8. Undo / Redo（取り消し）

- **すべての破壊的操作は取り消し可能**（insert / remove / move / patch / template 適用 / JSON import）
- スナップショット方式（Flex JSON のディープクローン履歴）。上限は 100 ステップ
- ショートカット: `Ctrl/Cmd+Z`（undo）、`Ctrl/Cmd+Shift+Z` / `Ctrl+Y`（redo）
- undo できない操作はないこと。lockedUris ガードで拒否された操作は履歴に載せない

## WYSIWYG 要素 ↔ UI SDK ビヘイビア ↔ shadcn の対応表

| WYSIWYG の要素 | UI SDK ビヘイビア（規範） | shadcn コンポーネント（実装） |
|---|---|---|
| キャンバス上の部品選択 | createSelection, bindLayer | — （カスタム。NodeWrap） |
| アウトライン / レイヤー | createTreeCollection, visibleTreeRows, createTypeahead | Tree（shadcn: Tree / Collapsible で組む） |
| 部品の並べ替え | createReorder, createTreeReorder, settleDraft | — （HTML5 DnD + ↑↓ ボタン併設） |
| 挿入メニュー（＋） | createPopup（menu preset）, bindLayer | DropdownMenu |
| プロパティのポップオーバー | createPopup（popover preset） | Popover |
| JSON パネル / 設定ダイアログ | createPopup（dialog preset）, bindBackdrop | Dialog / Sheet |
| 色 | （Colors utilities） | ColorPicker（shadcn: Color Picker） |
| サイズ / スペーシング選択 | createListbox | Select / Combobox |
| layout 縦/横/ベースライン | （ToggleGroup） | ToggleGroup / SegmentedControl |
| flex 比 / ピクセル | createCommit（ドラフト確定） | Slider / Number Input |
| トグル（wrap, scaling） | checkedAttrs | Switch / Checkbox |
| ツールバー（undo/redo/削除） | createRovingFocus | Toolbar + Tooltip |
| コマンドパレット（将来） | createTypeahead, fuzzyScore | Command |
| トースト（保存・エラー通知） | announce | Sonner / Toast |
| テキスト インライン編集 | createInlineEdit, isComposing | Input（カスタム commit） |
| Undo/Redo | createUndoStack | — （useFlexDoc の history） |
| キーボードショートカット | matchesShortcut, formatShortcut, ariaKeyshortcuts | — （useHotkey 相当を自作） |

## レビュー チェックリスト（PR 時）

- [ ] Tab キーで部品リストやツールバーが 1 ストップで巡回できるか
- [ ] 矢印 / Home / End が機能するか（リスト・メニュー・ツリー）
- [ ] Escape で「選択解除 / メニューを閉じる / 編集キャンセル」のいずれかが必ず起きるか
- [ ] 削除・移動後にフォーカスが失われないか
- [ ] ポップオーバー・ダイアログにアクセシブル名（タイトル）があるか
- [ ] DnD と同等のキーボード操作手段があるか
- [ ] DnD のドラフトは drop 時のみ確定するか
- [ ] IME 確定 Enter で誤 commit しないか
- [ ] undo/redo がすべての操作で機能するか
- [ ] lockedUris 保護部品の操作拒否が理由付きで通知されるか
- [ ] 操作結果が `aria-live` で告知されるか（並べ替え・削除・undo）
- [ ] LINE 仕様の配置制約（baseline 内の icon/text/filler 等）を UI が防いでいるか

## 参照

- UI SDK ドキュメント: https://ui-sdk.dev/docs
  - ビヘイビア一覧: https://ui-sdk.dev/docs/behaviors
  - Focus: https://ui-sdk.dev/docs/core/behaviors/focus
  - DnD: https://ui-sdk.dev/docs/core/behaviors/drag-and-drop
  - Popups: https://ui-sdk.dev/docs/core/behaviors/popups
  - Trees: https://ui-sdk.dev/docs/core/behaviors/trees
  - リポジトリ: https://github.com/vercel-labs/ui
- shadcn/ui: https://ui.shadcn.com/docs
- WAI-ARIA APG（Tree / Menu / Toolbar の公式パターン）: https://www.w3.org/WAI/ARIA/apg/patterns/
