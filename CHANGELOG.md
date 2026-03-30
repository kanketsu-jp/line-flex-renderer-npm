# Changelog

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
