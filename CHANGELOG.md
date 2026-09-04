# Changelog

## [1.3.2] - 2026-09-05

### Fixed

- **StrictMode（Next.js の dev 既定）でマウントしただけで `onChange` が 1 回呼ばれていた問題を修正**
- **親から渡される値との同期を「前回やりとりした中身」との比較に統一し、`isFirst` フラグを廃止**
- **選択状態のリセットを `setContainer` の updater の外へ移動し、updater を純粋にした**

## [1.3.1] - 2026-09-05

### Fixed

- **FlexEditor が無限ループする問題を修正** — 親が毎レンダーで新しいオブジェクトを `value` に渡すと "Maximum update depth exceeded" で落ちていた。内部 state と中身が同じときは更新しないようにした

## [1.3.0] - 2026-09-04

### Added

- **FlexEditor（みたまま編集 UI）を追加** — LINE Flex Message を非技術者が「みたまま」編集できるコンポーネントを追加
  - **レスポンシブな 2 カラム UI**: PC は左プレビュー・右編集パネルの 2 カラム、モバイル幅（既定 768px 未満）では「プレビュー / 編集」タブに自動で切り替わります
  - **直感的なフォーム編集**: テキスト・色・ボタンのラベルと URL・画像 URL・並び順をフォームで編集でき、JSON を直接触らせない設計
  - **テンプレート 5 種を内蔵**: お知らせ・クーポン・商品紹介・イベント案内・店舗紹介の 5 種類から編集を始められます
  - **JSON の読み込み・書き出し**: 既存の Flex Message JSON を貼り付けて読み込み・書き出しできます
  - **LINE 公式仕様準拠の検証 (`validateFlex`)**: LINE Messaging API 仕様に沿ったバリデーションで不正な設定を事前に検知します
  - **ゼロ依存を維持**: 新規依存パッケージを追加せず、CSS-in-JS のみで実装されています

## [1.2.2] - 2026-04-01

### Fixed

- **body/footer の固定 padding を FlexBox の paddingAll で上書き可能に** — header / body / footer の wrapper `<div>` に直接指定していた固定 padding を廃止し、FlexBox 側の `paddingAll` / `paddingTop` 等が指定されていればそちらを優先するように変更。padding 系プロパティが一切未指定の場合のみ従来のデフォルト値を適用する

## [1.2.1] - 2026-03-30

### Fixed

- **FlexText `align: "end"` が horizontal box 内で右揃えにならない問題を修正** — `<p>` に `width: 100%` を追加し、wrapper div の全幅を確保するようにした

## [1.2.0] - 2026-03-29

### Changed

- FlexSeparator のスタイルを修正（`border: none` + `margin: 0` で上下の余白を除去）

## [1.1.0] - 2026-03-28

### Changed

- **FlexBox レイアウトエンジンを全面リライト** — CSS `gap` による一律スペーシングから、LINE 仕様準拠の per-child wrapper 方式に変更
  - 親の `spacing` をデフォルトギャップとして使用し、子の `margin` で個別上書き可能に
  - 先頭の子要素にはギャップを付与しない（LINE 仕様通り）
  - horizontal/baseline レイアウトで `flex` 未指定の子要素はデフォルト `flex: 1`（LINE 仕様通り）
- **Filler / Spacer を FlexBox 内で直接レンダリング**するように変更
- FlexButton の `border-radius` を `9999px` → `8px` に変更（LINE 実機に合わせた）
- 各コンポーネント（FlexText, FlexImage, FlexButton）から自前の `margin` / `flex` 管理を削除し、親 FlexBox の wrapper に一元化

## [1.0.0] - 2026-03-20

### Added

- Initial stable release
- FlexBox, FlexText, FlexImage, FlexButton, FlexSeparator, FlexSpacer, FlexFiller, FlexIcon, FlexSpan
- FlexMessagePreview (bubble / carousel)
- LineChatFrame, LineTextBubble
- Bubble size support (nano / micro / kilo / mega / giga)
- Carousel with horizontal scroll & snap
