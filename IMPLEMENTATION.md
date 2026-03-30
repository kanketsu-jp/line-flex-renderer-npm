# line-flex-message-renderer NPM パッケージ実装計画

## 概要

LINE Flex Message の JSON をブラウザ上でプレビュー表示する React コンポーネントライブラリ。
LINE アプリの実際の描画に準拠した CSS-in-JS レンダリング。

- **NPM パッケージ名**: `line-flex-message-renderer`
- **GitHub リポジトリ**: `kanketsu-jp/line-flex-renderer-npm`
- **ライセンス**: MIT

## 原型ソースコード

以下のファイルが原型。このコードをベースにライブラリ化する:

```
/Users/horiikekazuma/Develop/Projects/kmdr/enterprise/crm.kmdr.app/apps/reserve/src/stories/flex-renderer.tsx
```

このファイルを `cat` で読み、内容を理解した上で以下の手順を進めること。

---

## Step 1: プロジェクト初期化

```bash
# リポジトリが既にクローンされている前提
pnpm init
```

### package.json

```json
{
  "name": "line-flex-message-renderer",
  "version": "0.1.0",
  "description": "React component to render LINE Flex Message JSON as a visual preview — pixel-accurate to the LINE app.",
  "keywords": [
    "line",
    "flex-message",
    "line-bot",
    "messaging-api",
    "react",
    "preview",
    "renderer",
    "storybook"
  ],
  "license": "MIT",
  "author": "kanketsu-jp",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/kanketsu-jp/line-flex-renderer-npm.git"
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "biome check src/",
    "lint:fix": "biome check --write src/",
    "test": "vitest run",
    "test:watch": "vitest",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "prepublishOnly": "pnpm run build",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@storybook/addon-a11y": "^8.5.0",
    "@storybook/addon-docs": "^8.5.0",
    "@storybook/react-vite": "^8.5.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^25.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "storybook": "^8.5.0",
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

> **注意**: バージョンは `pnpm add` 時の最新を使うこと。上記は目安。
> Storybook は React 専用の `@storybook/react-vite` を使う（Next.js 不要）。

### 依存関係インストール

```bash
pnpm add -D typescript tsup vitest @testing-library/react @testing-library/jest-dom jsdom \
  @types/react @types/react-dom react react-dom \
  @biomejs/biome \
  storybook @storybook/react-vite @storybook/addon-docs @storybook/addon-a11y
```

---

## Step 2: TypeScript & ビルド設定

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.stories.tsx", "**/*.test.tsx"]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  jsx: "automatic",
  treeshake: true,
});
```

### biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noArrayIndexKey": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab"
  }
}
```

---

## Step 3: ソースコード構成

原型ファイル (`flex-renderer.tsx`) を以下のファイル構成に分割する。

```
src/
├── index.ts                    # Public exports
├── types.ts                    # 全型定義（export する）
├── constants.ts                # サイズマッピング定数
├── utils.ts                    # resolveSize ヘルパー
├── components/
│   ├── FlexMessagePreview.tsx  # メイン bubble レンダラー
│   ├── FlexComponentRenderer.tsx # switch ディスパッチャ
│   ├── FlexBox.tsx
│   ├── FlexText.tsx
│   ├── FlexSpan.tsx
│   ├── FlexImage.tsx
│   ├── FlexButton.tsx
│   ├── FlexSeparator.tsx
│   ├── FlexIcon.tsx
│   ├── LineChatFrame.tsx       # LINE トーク画面ラッパー
│   └── LineTextBubble.tsx      # プレーンテキスト吹き出し
```

### 分割時の変更点

1. **`"use client"` は削除** — ライブラリ側で指定しない（利用者側の責任）
2. **全型定義を `export` する** — `FlexBubble`, `FlexBox`, `FlexText`, `FlexImage`, `FlexButton`, `FlexSeparator`, `FlexSpacer`, `FlexFiller`, `FlexIcon`, `FlexSpan`, `FlexAction`, `FlexComponentType`, `FlexBlockStyle` をすべて named export
3. **`biome-ignore` コメントは削除** — ライブラリ側の biome 設定で `noArrayIndexKey: warn` に設定済み
4. **`img` 要素の `biome-ignore` も削除** — `noImgElement` はライブラリでは問題ない（next/image 不要）
5. **`LineChatFrame` の props を拡張** — `accountName?: string`, `avatarUrl?: string`, `width?: number` を追加
6. **`FlexMessagePreview` の props を拡張** — `className?: string`, `style?: React.CSSProperties` を追加
7. **Carousel（FlexCarousel）対応を追加** — 複数 bubble の横スクロール

### src/index.ts

```typescript
// Components
export { FlexMessagePreview } from "./components/FlexMessagePreview";
export { LineChatFrame } from "./components/LineChatFrame";
export { LineTextBubble } from "./components/LineTextBubble";

// Types
export type {
  FlexAction,
  FlexBlockStyle,
  FlexBox,
  FlexBubble,
  FlexButton,
  FlexCarousel,
  FlexComponentType,
  FlexContainer,
  FlexFiller,
  FlexIcon,
  FlexImage,
  FlexMessage,
  FlexSeparator,
  FlexSpacer,
  FlexSpan,
  FlexText,
} from "./types";
```

### src/types.ts の追加型

原型の型に加えて以下を追加:

```typescript
/** Carousel: 複数 bubble を横スクロール */
export interface FlexCarousel {
  type: "carousel";
  contents: FlexBubble[];
}

/** Flex Message の最上位型（bubble または carousel） */
export type FlexContainer = FlexBubble | FlexCarousel;

/** LINE Messaging API の flexMessage 型 */
export interface FlexMessage {
  type: "flex";
  altText: string;
  contents: FlexContainer;
}
```

### FlexMessagePreview の拡張

```typescript
export interface FlexMessagePreviewProps {
  /** Flex Message JSON（bubble or carousel） */
  json: FlexContainer;
  /** 追加 className */
  className?: string;
  /** 追加 inline style */
  style?: React.CSSProperties;
}

export function FlexMessagePreview({ json, className, style }: FlexMessagePreviewProps) {
  if (json.type === "carousel") {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          ...style,
        }}
      >
        {json.contents.map((bubble, i) => (
          <div key={i} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
            <BubbleRenderer json={bubble} />
          </div>
        ))}
      </div>
    );
  }
  return <BubbleRenderer json={json} className={className} style={style} />;
}
```

### LineChatFrame の props 拡張

```typescript
export interface LineChatFrameProps {
  children: React.ReactNode;
  /** トーク画面のヘッダー名（デフォルト: "トーク"） */
  accountName?: string;
  /** アバター画像 URL（未指定時は緑の BOT アイコン） */
  avatarUrl?: string;
  /** フレーム幅（デフォルト: 375） */
  width?: number;
}
```

---

## Step 4: テスト

### vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
  },
});
```

### src/__tests__/setup.ts

```typescript
import "@testing-library/jest-dom/vitest";
```

### テストケース一覧

以下のテストを作成する:

#### `src/__tests__/FlexMessagePreview.test.tsx`

1. **bubble レンダリング**: body テキストが表示される
2. **hero 画像**: img 要素が生成される
3. **footer ボタン**: ボタンのラベルが表示される
4. **separator**: hr 要素が生成される
5. **carousel**: 複数 bubble が横並びで表示される
6. **size variants**: nano〜giga で width が変わる
7. **styles.footer.separator**: footer 前に区切り線が表示される
8. **空 body**: body がない場合にクラッシュしない

#### `src/__tests__/LineChatFrame.test.tsx`

1. **デフォルト表示**: "トーク" ヘッダーが表示される
2. **accountName**: カスタム名が表示される
3. **children**: 子要素が描画される

#### `src/__tests__/LineTextBubble.test.tsx`

1. **テキスト表示**: 渡したテキストが表示される
2. **改行保持**: `\n` が保持される

#### `src/__tests__/types.test.ts`

1. **型チェック**: 各型がコンパイルエラーなしで使えることを verify（`expectTypeOf` 使用）

---

## Step 5: Storybook

### .storybook/main.ts

```typescript
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: "@storybook/react-vite",
};

export default config;
```

### .storybook/preview.ts

```typescript
import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "LINE",
      values: [
        { name: "LINE", value: "#7B9EB0" },
        { name: "White", value: "#ffffff" },
        { name: "Dark", value: "#1a1a2e" },
      ],
    },
  },
};

export default preview;
```

### Stories

以下の Story を作成する:

#### `src/stories/FlexMessagePreview.stories.tsx`

- **Receipt**: LINE公式 Receipt テンプレート
- **Ticket**: LINE公式 Ticket テンプレート
- **SimpleText**: テキストのみの bubble
- **WithHero**: hero 画像付き bubble
- **WithFooter**: footer ボタン付き bubble
- **Carousel**: 複数 bubble carousel
- **AllSizes**: nano〜giga を横並び表示
- **CustomStyles**: styles プロパティのデモ

LINE公式テンプレート JSON は以下から取得:
```
/Users/horiikekazuma/Develop/Projects/kmdr/enterprise/crm.kmdr.app/.temp/2026-03-26/flex-renderer/linebot-flex-message-template/official/
```

このディレクトリ内の JSON ファイルをすべて読み、Story のデータとして使用する。

#### `src/stories/LineChatFrame.stories.tsx`

- **Default**: デフォルト表示（FlexMessagePreview を内包）
- **CustomAccount**: accountName カスタム
- **WithTextBubble**: LineTextBubble を内包
- **MultipleMessages**: 複数メッセージを表示

#### `src/stories/LineTextBubble.stories.tsx`

- **Short**: 短いテキスト
- **Long**: 長文テキスト（折り返し確認）
- **WithEmoji**: 絵文字入りテキスト
- **Multiline**: 改行入りテキスト

---

## Step 6: README.md

以下の構成で README を作成する:

```markdown
# line-flex-message-renderer

React component to render LINE Flex Message JSON as a visual preview — pixel-accurate to the LINE app.

## Screenshot

<!-- Storybook のスクリーンショットを貼る -->

## Installation

npm install line-flex-message-renderer
pnpm add line-flex-message-renderer

## Quick Start

import { FlexMessagePreview, LineChatFrame } from 'line-flex-message-renderer';

## Components

### FlexMessagePreview
### LineChatFrame
### LineTextBubble

## Supported Flex Message Components
- box (vertical / horizontal / baseline)
- text (with span support)
- image
- button (primary / secondary / link)
- separator
- spacer
- filler
- icon

## Bubble Sizes
nano / micro / kilo / mega / giga

## Carousel Support

## Props Reference

## Development
pnpm install
pnpm storybook
pnpm test
pnpm build

## License
MIT
```

---

## Step 7: CI/CD

### .github/workflows/ci.yml

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

### .github/workflows/publish.yml

```yaml
name: Publish to NPM
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      - run: pnpm publish --provenance --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Step 8: NPM 公開手順

### 事前準備

1. npmjs.com アカウントでログイン
2. GitHub リポジトリの Settings → Secrets に `NPM_TOKEN` を設定
3. `npm login` でローカル認証

### 初回公開

```bash
# 1. ビルド確認
pnpm build
pnpm test

# 2. パッケージ内容確認
pnpm pack --dry-run

# 3. 公開（初回）
pnpm publish --access public

# または GitHub Release 経由で自動公開（推奨）
# GitHub で v0.1.0 タグ付き Release を作成 → publish.yml が自動実行
```

### バージョンアップ

```bash
# patch: バグ修正
pnpm version patch

# minor: 機能追加
pnpm version minor

# major: 破壊的変更
pnpm version major

# タグ push → GitHub Release 作成 → 自動公開
git push --tags
```

---

## Step 9: その他のファイル

### .gitignore

```
node_modules/
dist/
storybook-static/
*.tsbuildinfo
.temp/
```

### LICENSE

MIT License（kanketsu-jp）

### .npmrc

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

---

## チェックリスト

実装完了時に以下をすべて確認:

- [ ] `pnpm build` が成功する
- [ ] `pnpm test` が全テスト通過する
- [ ] `pnpm typecheck` がエラーなし
- [ ] `pnpm lint` がエラーなし
- [ ] `pnpm storybook` で全 Story が表示される
- [ ] `pnpm pack --dry-run` で dist/ のみ含まれる
- [ ] README にスクリーンショットがある
- [ ] LICENSE ファイルがある
- [ ] Carousel レンダリングが動作する
- [ ] 全 Flex コンポーネント型（box, text, image, button, separator, spacer, filler, icon, span）が動作する
- [ ] bubble サイズ（nano〜giga）が正しい幅で表示される
- [ ] `LineChatFrame` のカスタム props が動作する
- [ ] `LineTextBubble` で改行が保持される
- [ ] GitHub Actions CI が通る
- [ ] npm publish が成功する（`--dry-run` で事前確認）
