# WYSIWYG エディタ移管ガイド（次のエージェント向け）

最終更新: 2026-11-25 夜（**本番昇格完了 + REVIEW-2 の N1〜N5・M6・M7 修正済み**。version 1.7.0）
対象 Issue: https://github.com/kanketsu-jp/line-flex-renderer-npm/issues/10
ブランチ: `feat/wysiwyg-concepts`（**未 push**）

このドキュメントは「**リポジトリを見ただけで最新状態を把握し、そのまま作業を引き継げる**」
ことを目的とする。最初にこれを読み、次に `AGENTS.md`（基本ルール）を確認すること。

---

## 1. 今どこまで完了しているか

### ✅ 本番昇格済み（2026-11-25、REVIEW §4 の修正案どおり）

- 移動先: `src/wysiwyg/`（`core/` `editor/` `ui/` `layout/`）。`src/index.ts`（root）には足さず、**別入口 `src/wysiwyg/index.ts`** から export
- `exports` に `./wysiwyg`（ESM/CJS+型）と `./wysiwyg.css` を追加。`"sideEffects": ["**/*.css"]`
- build: `tsup && tailwindcss … --minify && :root→.lfw-root 置換`（tsup の clean が CSS を消さない順序）
- CSS は `.lfw-root` スコープ（preflight 廃止・トークンも配下限定・theme 変数の :root 漏れも置換で解消）
- 依存: `@radix-ui/react-dialog` は **peerDependenciesMeta.optional**。lucide/clsx/tailwind-merge/cva はバンドル。`dependencies` は空のまま
- 受入テスト 13 件（幅切替 / preview 編集不能+対照 / Divider＋挿入 / lockedUris PC・SP / undo / onImageUpload(PC) / **M6 アップロード競合**）。**158 件全通過**
- REVIEW-2（再レビュー）の対応: N1（リセットを @layer base へ・レイヤー順序 theme<base<utilities を import 順で実現）・N2（SheetContent/SheetOverlay に lfw-root）・N3（biome css.parser.tailwindDirectives、pnpm lint 緑）・N4（後処理の件数検査 exit 1）・N5（border-color 復活）・N6（feat!→feat に amend）・N7（version 1.7.0 + CHANGELOG）・M6（useFlexDoc を bubbleRef 化、doc.insertNodeAt 追加）・M7 SP（lockedUris 伝達）
- レビュー原文: `.temp/2026-11-25/wysiwyg-promotion-review/REVIEW.md` と `REVIEW-2.md`

### ✅ 機能完了（feature）

| 完了物 | 場所 | 概要 |
|---|---|---|
| **WYSIWYG エディタ本体** | `src/stories/wysiwyg/editor/FlexWysiwygEditor.tsx` | 採用UI（SP=M2洗練版/PC=案A洗練版の統合）。Divider「＋」→部品シート→選択で「編集/削除」バー。`preview` props でプレビューモード |
| 呼び出し側デモ | `src/stories/wysiwyg/editor/WizardDemo.tsx` | 2ステップ（テンプレ選択→編集）。ナビ `[←戻る][編集\|プレビュー タブ][JSONを書き出す]`。テンプレ選択と完了処理は呼び出し側の責務（本体は持たない） |
| 編集コア | `src/stories/wysiwyg/core/` | `useFlexDoc`（undo/redo 100step・lockedUris ガード・onChange 通知）、`InteractiveTree`（選択プレビュー・Divider＋pill・tapToPlace・onSlotClick）、`WysiwygInspector`（image→アップロード式）、`ImageUploadField`、`editorOps.insertNodeAt` |
| shadcn UI 環境 | `src/stories/wysiwyg/ui/` + `styles.css` | Tailwind v4 + Button/Sheet(side right)/Badge/Separator/ToggleGroup/Card + cn。テーマは LINE Green（oklch） |
| コンテナクエリ基盤 | `src/stories/wysiwyg/mobile/MobileShared.tsx` | `ContainerQueryShell`（ResizeObserver で幅測定・<480px で SP）、`useContainerLayout`、`MobilePreview` |
| Storybook | `src/stories/WysiwygEditor.stories.tsx` / `WysiwygWizard.stories.tsx` | 「WysiwygEditor/エディタ本体」「WysiwygEditor/ウィザード デモ」。viewport 切替で SP/PC |
| 廃止済み | — | ConceptA〜E、M1〜M6、旧 stories は削除済み |
| UI/UX 品質基準 | `docs/skills/ui-ux-best-practices/SKILL.md` | 8原則＋チェックリスト（Vercel UI SDK が規範、shadcn が実装） |

### 品質ゲート（全コミットで緑）
`pnpm typecheck`（0 エラー）/ `pnpm biome check src/`（クリーン）/ `pnpm test`（146 件全通過）

## 2. 残作業（Issue #10 §7 相当・優先度順）

1. **本番昇格（最重要）** — `src/stories/wysiwyg/` は「プロトタイプ配置」。本番コードとして昇格する:
   - 移動先: `src/wysiwyg/`（`core/`・`editor/FlexWysiwygEditor.tsx`・`ui/`・`layout/`（現 mobile/MobileShared の名称変更推奨））
   - `WizardDemo` はストーリー専用なので `src/stories/` に残す
   - **Tailwind CSS の同梱**: `styles.css` を Tailwind v4 CLI（`@tailwindcss/cli`）で `dist/wysiwyg.css` にビルドし、パッケージ配布物に含める（ホストに Tailwind を要求しない）。
     `package.json` の `build` を `tailwindcss -i src/wysiwyg/ui/styles.css -o dist/wysiwyg.css && tsup` に拡張し、
     `exports` に `"./wysiwyg.css": "./dist/wysiwyg.css"` を追加
   - `src/index.ts` に `FlexWysiwygEditor` と `FlexWysiwygEditorProps` を export
   - ランタイム依存: `@radix-ui/react-dialog`（Sheet用）と `lucide-react` を dependencies に移動
     （React は引き続き peer）
   - AGENTS.md の「CSS-in-JS のみ使用」ルールは renderer に限定する文言へ修正が必要
2. **テンプレート保存（Issue の初期要件）**: 全員共有・タイトル/説明文。保存APIは `onSaveTemplate?: (template) => Promise<void>` のようなコールバックを本体に足し、永続化は呼び出し側で
3. **保存ボタン3分割**: 「保存 / テンプレとして保存 / クリア（→テンプレ選択へ）」のドロップダウン分割ボタン（shadcn DropdownMenu）
4. **部品ドラッグ移動の範囲**: PC のみ / 両方 の仕様確認待ち（ユーザーへの質問を残している）
5. **lockedUris の UI 表示**: useFlexDoc は対応済み。削除/編集ボタンに「保護」バッジと拒否理由表示を足すだけ
6. **npm 公開**: minor 1.7.0。AGENTS.md の公開前チェック（build/test/typecheck/pack --dry-run）を通してから
7. **push**: ユーザーの明示指示待ち（**勝手に push しない** — AGENTS.md ルール）

## 3. ハマりポイント（過去の実績より）

- **Tailwind v4 の自動スキャンは CSS 所在ディレクトリ配下のみ** → `styles.css` に `@source "../../../"`（移動後は併せて更新）と `@source` で `.storybook` を明示
- **`.storybook/preview.tsx` 経由の CSS import はバンドルに乗らない** → `InteractiveTree` から `import "../ui/styles.css"` が実効。移動時はこの import を `src/wysiwyg/` 内で維持すること
- **stories の相対パス**: stories は `src/stories/` 配下。`../templates` 等は壊れる（`./templates` が正）。都度 `python3` の検証スニペットで全 import を実在チェックする
- **JSX 内 suppression コメント**（`{/* biome-ignore */}`）は属性 diagnostic に届かない場合がある。位置に注意
- **Storybook 起動**: `./node_modules/.bin/storybook dev -p 6006 --host 0.0.0.0 --no-open --ci`（`--ci` 必須）
- **公開 URL**: ngrok は authtoken 未設定。`cloudflared tunnel --url http://localhost:6006`（trycloudflare は DNS 伝播に 1〜2 分）

## 4. 設計原則（変わらないもの）

- 編集状態 = FlexBubble（単一モデル）。PM/Lexical 等の変換レイヤーは持たない
- 既存 `src/editor/path.ts` の純関数（patchNode/insertNode/removeNode/moveNode）を再利用
- レガシー `FlexEditor` は互換維持（非推奨化しない）
- renderer（FlexMessagePreview 等）は CSS-in-JS・zero-dep のまま
- UI/UX の変更は `docs/skills/ui-ux-best-practices/SKILL.md` の 8 原則とチェックリストを通す

## 5. この機能の経緯資産（参考）

- Issue #10 のコメント全 6 件（要件の変遷）
- リサーチノート: `.temp/2026-11-14/wysiwyg-research/`（gitignore 対象・未コミット。プロトタイプ論拠が必要なら参照）
