# AGENTS.md

## 基本ルール

- 会話は必ず日本語
- プロジェクトに関係ない一時ファイルは `.temp/{日付}/{トピック名}/` に配置
- コミットメッセージに「🤖 Generated with Claude Code」などは含めない
- **`git push` は勝手にしない** — コミットは OK だが、プッシュはユーザーの明示的な指示があるまで実行しないこと
- **`CLAUDE.local.md` がある場合は必ず参照する** — ローカル固有の設定が記載されている

## 外部サービスの仕様確認ルール

**推測・事前知識で回答しない。必ずドキュメントを先に確認すること。**

LINE Flex Message の仕様について質問された場合や、それらに関する作業を行う場合は:

1. まず LINE 公式ドキュメントを Web 検索・WebFetch で確認する
2. ドキュメントに情報がなければ、ユーザーに「該当情報がありません」と伝える
3. **「わかりません」「推測ですが」で回答してはならない**

### 参照先

| トピック | 参照先 |
|---------|-------|
| Flex Message 仕様 | [LINE Developers - Flex Message](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/) |
| Flex Message コンポーネント | [Flex Message elements](https://developers.line.biz/en/reference/messaging-api/#flex-message-elements) |
| Flex Message Simulator | [LINE Flex Message Simulator](https://developers.line.biz/flex-simulator/) |

## 技術スタック

- **Language**: TypeScript
- **UI**: React (peer dependency)
- **Build**: tsup (ESM + CJS dual output)
- **Test**: Vitest + Testing Library
- **Lint**: Biome
- **Storybook**: @storybook/react-vite
- **CI/CD**: GitHub Actions
- **Package Registry**: npm

## NPM 公開ルール

- `pnpm publish` の前に必ず以下を確認:
  - `pnpm build` 成功
  - `pnpm test` 全通過
  - `pnpm typecheck` エラーなし
  - `pnpm pack --dry-run` で dist/ のみ含まれる
- **semver を厳守** — 破壊的変更は major、機能追加は minor、バグ修正は patch
- **`exports` フィールドを正しく維持** — ESM/CJS 両方の型定義を含める

## コード品質ルール

- **型定義はすべて export する** — ライブラリの利用者が型を import できるようにする
- **CSS-in-JS のみ使用** — 外部 CSS ファイルやスタイルシートを追加しない（zero-dependency を維持）
- **`react` / `react-dom` は peerDependencies** — devDependencies にのみ含め、dependencies には入れない
- **`"use client"` は付けない** — ライブラリ側でフレームワーク固有ディレクティブを指定しない
- **Tree-shakable** — 各コンポーネントを named export し、barrel export は `src/index.ts` のみ
