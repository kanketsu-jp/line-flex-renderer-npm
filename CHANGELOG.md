# Changelog

## 1.7.0

### 追加

- **WYSIWYG エディタ `FlexWysiwygEditor`**（別入口 `line-flex-message-renderer/wysiwyg`）
  - LINE Flex Message をプレビュー上で直接編集できる新エディタ
  - モバイル（ボトムシート）と PC（右パネル）をコンテナ幅で自動切替（コンテナクエリ方式）
  - Divider の「＋」から部品選択シートで挿入、部品選択で「編集」「削除」バー
  - 画像はアップロード式（`onImageUpload` でホスト側のアップローダに差し替え可、未指定は data URL）
  - 差し込み保護 `lockedUris`（該当 action の削除・URI 変更を拒否）
  - undo / redo（100 ステップ）
  - `preview` props で表示専用モード
  - 戻る/次へなどのナビは `children` として呼び出し側が自由に配置
- 同梱 CSS `line-flex-message-renderer/wysiwyg.css`（`.lfw-root` 配下にスコープ。
  ホストページのスタイルに影響しない。Tailwind v4 ベース、oklch / @layer を使用するため
  Safari 16.4+ / Chrome 111+ 相当）
- `@radix-ui/react-dialog` が任意の peer 依存として追加（renderer だけ使う場合は不要）。
  WYSIWYG エディタを使う場合は `npm i @radix-ui/react-dialog` が必要

### 互換性

- 既存 API に破壊的変更はありません。renderer（`FlexMessagePreview` 等）は
  引き続き zero-dependency・CSS-in-JS です
- WYSIWYG エディタの `value` は初期値として扱われます（制御コンポーネントではありません。
  テンプレート差し替えは `key` での再マウントで行ってください）

## 1.6.0

- `lockedUris` で差し込み位置の URI を編集・削除から保護

## 1.5.1

- 色を指定していない Flex の text に既定色を当てる

## 1.5.0

- エディタのレイアウト改善と JSON パネル

## 1.4.0

- 初期リリース
