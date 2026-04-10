# Issue-Driven Collaboration Workflow

<!-- cspell:words coderabbit -->

このドキュメントは、Claude/Cursor/Gemini を含む複数の AI ツールで共通利用するための運用フローです。

## Overview

1. Issue を作成する
2. Issue を元に実装提案を作る
3. 計画コメントを Issue に残してから実装を進める
4. 実装完了後に PR/Issue へ完了コメントを投稿し、必要なメンション通知を送る

## Step 1: Issue 作成テンプレ

Issue には次の要素を必ず含める。

- タイトルは簡潔な英語で記載する（日本語で作成した場合は、AIツールが実装開始前に英語タイトルへ更新すること。GitHub Issue のタイトルも `gh issue edit` で更新する）
- 目的（何を改善したいか）
- 現象（現在の不具合や課題）
- 期待結果（完了時の状態）
- 受け入れ条件（検証方法、対象画面/機能）

最小テンプレート:

```md
## 背景

<なぜ必要か>

## 現象

<現在の問題>

## 期待結果

<どうなれば完了か>

## 受け入れ条件

- [ ] 条件1
- [ ] 条件2
```

## Step 2: 提案依頼（AI 共通）

Issue URL を渡して、次の観点で提案を依頼する。

- 要件の分解
- 実装候補（複数案がある場合は比較）
- 影響ファイル
- テスト方針（unit/e2e）
- リスクと回避策

最小プロンプト:

```md
Issue: <issue-url>

以下を提案してください:

1. 要件分解
2. 実装方針（必要なら複数案）
3. 変更予定ファイル
4. テスト戦略（unit/e2e）
5. リスクと対策
```

## Step 3: 計画コメントを記録して実行

1. 提案を人間が判断する
2. 採用した計画を Issue コメントに記録する
3. 実装を開始する
4. 実装後は `AGENTS.md` の検証ゲートを実行する

`pnpm git` の基本実行:

```bash
pnpm git "<issue-title> #<issue-number>"
```

> **Note**: Issue タイトルが日本語の場合、`pnpm git` を実行する前に英語タイトルへ変換すること。
> `gh issue edit <number> --title "<english-title>"` で GitHub Issue タイトルも合わせて更新する。

## Step 4: PR結果確認 + 完了通知（別スクリプト）

`pnpm git` の後に、別スクリプト `pnpm git:followup` を実行する。

`pnpm git:followup` の主な動作:

- Cloudflare / CodeRabbit / SonarQube / その他 CI の結果確認
- CodeRabbit 指摘の未対応検出（必要なら理由コメント投稿）
- PR/Issue への完了コメント投稿 + メンション通知

主なオプション:

- `--notify-target`: `pr` | `issue` | `both`（未指定時は `issue`）
- `--notify-message`: 完了コメント本文。定型文ではなく実装内容のサマリーを英語で記載する（例: `"Implemented X:\n- Added ...\n- Changed ..."`）
- `--notify-mentions`: カンマ区切りメンション（`user` または `org/team`）
- `--coderabbit-ignore-reason`: 未対応を残す場合の理由コメント
- `--issue-number`: Issue 番号（または位置引数に `"<title> #<number>"`）

例1: PR コメントで通知

```bash
pnpm git:followup "<issue-title> #<issue-number>" \
  --notify-target pr \
  --notify-message "Implemented <title>:
- Added ...
- Changed ..." \
  --notify-mentions "reviewer1,org/team-name"
```

例2: Issue コメント + PR コメントの両方 + CodeRabbit 未対応理由

```bash
pnpm git:followup "<issue-title> #<issue-number>" \
  --notify-target both \
  --notify-message "Implemented <title>:
- Added ...
- Fixed ..." \
  --notify-mentions "owner" \
  --coderabbit-ignore-reason "仕様上この指摘は該当しないため"
```

## 運用ルール

- 通知は CI チェック成功後に投稿する
- 通知投稿に失敗しても、実装完了の事実はログで確認できるようにする
- 通知先・文面は Issue の重要度に応じて調整する
- 自動投稿される PR / Issue コメント文面は英語で記載する
