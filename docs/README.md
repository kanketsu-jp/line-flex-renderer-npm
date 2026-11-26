# docs

このリポジトリのドキュメントとスキル。

## skills/

エージェント（Claude Code / pi 等）がタスクに応じて参照する**プロジェクト スキル**。

| スキル | 適用場面 |
|---|---|
| [ui-ux-best-practices](./skills/ui-ux-best-practices/SKILL.md) | エディタ UI（`src/editor/`、WYSIWYG）の実装・変更・レビュー時。キーボード / フォーカス / 選択 / DnD / ポップアップ / ARIA の品質基準。規範は Vercel UI SDK のビヘイビア、実装は shadcn/ui |

### スキルの使い方

- UI に関わるコードを書く・直す・レビューするときは、該当スキルの **レビューチェックリスト** を通す
- スキルは「実装の規範」。議論が割れたらスキルの原則に従う。スキルが沈黙する場合は WAI-ARIA APG と shadcn の実装に倣う

### スキルの追加・変更

- `docs/skills/<name>/SKILL.md` の形式（YAML frontmatter に `name` / `description`、本文にガイド）
- 変更は通常の PR で。根拠（出典 URL・実測）を必ず残す
