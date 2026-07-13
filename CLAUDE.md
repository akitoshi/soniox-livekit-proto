# Project Instructions for AI Agents

## 概要

LiveKit × Soniox によるオンライン診療(多言語・国際クリニック向け)の**参照実装プロトタイプ**。他プロジェクトへ組み込むための「正しい組み合わせ方」を磨き上げる+デモ用途(見た目・安定性)。ドメイン語彙は CONTEXT.md が単一情報源。

現フェーズ: 翻訳の one_way×2 化+会話ログコピー(docs/prds/one-way-translation.md)。認証・DB・永続化は**このリポでは導入しない**(設計のみ docs/design/ に記録)。

## 技術スタック

- Next.js 16(App Router)+ React 19 + TypeScript strict + Tailwind CSS 4(pnpm)
- LiveKit Cloud: 映像・音声・字幕 data channel(topic `captions`)。トークンは `/api/livekit-token`
- Soniox `stt-rt-v5`(`@soniox/speech-to-text-web`): 各ブラウザから WebSocket 直結。一時キーは `/api/soniox-token`(60秒・単一使用)
- 認証・DB: なし(意図的)。テスト: Vitest(owt-1 で導入)
- アーキテクチャ不変則: **クライアント直結(サーバーエージェントなし)・一時キー方式・data channel 配信を変更しない**

### 検証コマンドブロック(commander 再検証の正)

<!-- wave-dispatch がタスク毎に全実行する。dev 実打 smoke は省略不可 -->

```bash
pnpm install
pnpm tsc            # tsc --noEmit
pnpm lint
pnpm test           # vitest run(owt-1 導入後)
pnpm build
# dev 実打 smoke(省略不可): pnpm dev →
#   1) http://localhost:3000 ロビー表示(ロール+言語選択の描画)
#   2) POST /api/livekit-token(正常 body)→ 200 / 不正 body → 400
#   3) POST /api/soniox-token → 200(env 設定時)or 503 SETUP_REQUIRED
#   4) 字幕・room 結線に触れた変更では 2 ブラウザで room 実打(字幕の翻訳メイン表示まで)
```

## アーキテクチャ概要

Browser(マイク)→ Soniox Web SDK(one_way 翻訳)→ CaptionPayload → LiveKit data channel → 全参加者。映像・音声は LiveKit Room で配信。サーバーは token 発行のみ(`app/api/*`)。

- 要件(REQ-OWT-*): `docs/prds/one-way-translation.md`
- タスク DAG とゲート位置: `docs/specs/one-way-translation-plan.md`
- 本実装(別リポ)向け設計: `docs/design/`(owt-7 で作成)
- セッション状態: `STATE.md`

## TDD 方針

**normal** — 純ロジック(言語定数・Soniox トークン処理・コピー整形・ペイロード検証)はテストファーストを推奨、UI・通話結線は手動 smoke で受け入れる。機微データの永続化がないため strict は不採用(本実装リポでは RLS 漏洩テストを strict 対象とする — docs/design/transcript-persistence.md)。

### Goodhart 不変条件(絶対厳守)

- テストの削除・skip・閾値緩和で赤を緑にすることを禁止
- 特に **字幕ペイロード検証テスト(isCaptionPayload 系)と言語定数テーブルテスト(lib/languages.ts 全行)** は、いかなる理由でも削除・弱体化してはならない
- レビュー / security-gate は**会話履歴のない新セッション**で実施。実装セッション内の自己レビューで代替しない
- 完了判定は plan の受入条件と PRD の EARS 要件のみを基準にする

## エージェント運用(配役 — 4 model slots)

| slot キー | 役割 | 担当モデル | 職掌 |
|---|---|---|---|
| planner_model_slot | planner(設計) | Fable | kickoff の設計・初期アーキテクチャ・仕様判断の補佐 |
| commander_model_slot | commander(指揮官・wave 運行) | Sonnet 5 | wave-dispatch の実行主体。検証コマンドは全て commander が実行 |
| implementer_model_slot | implementer(実装) | Codex 5.6 Sol(xhigh) | /goal テンプレ委譲でのみ動く。ファイル変更+テスト追加+完了報告まで |
| reviewer_model_slot | reviewer(最終レビュー・ゲート) | Fable | security-gate・最終レビュー・Goodhart 監査 |

- 同一モデルの複数スロット兼務可。ただし **security-gate の「履歴なし新セッション」独立性は配役に関係なく維持**(同一モデルでも別セッション)
- モデルの価格・提供状況が変わったら、この表のスロット値だけを更新する
- **モデルの暗黙フォールバック禁止。** 指定モデルを選択できない場合は、現在のモデル/指定モデル/失敗理由/代替候補を報告して止まる
- **エスカレーションはしご**: implementer が同一タスクで2回連続赤 → commander が planner_model_slot を context-fresh で1回だけ相談(蒸留した問題記述、助言 ≤1〜2k トークン)→ 助言付きで最終再委譲 → それでも赤なら人間へ。相談は1タスク1回まで
- implementer の sandbox ではネットワーク・localhost bind・パッケージインストールが失敗する前提。**implementer の完了報告だけで受入完了としない** — 検証コマンドブロックは必ず commander が再実行する
- 委譲は必ず /goal テンプレ(`docs/goal-prompt.md`)形式。自由形式プロンプト禁止

### コンテキスト規律(commander)

- **重い read は委譲する**: 多ファイル読解・ログ全文・仕様/ライブラリ調査は探索 agent に出し、蒸留された結論だけ受け取る。例外 = 監査系は commander 専管(検証コマンドの実行・出力確認、Goodhart 対象 diff の全行精査)
- **戻りは蒸留 ≤1〜2k トークンか参照 path(file:line)のみ**。全文の貼り戻しを受け取らない
- **委譲時は期待 effort を毎回明示**する
- **verify は実装 lane と分離**する: implementer の自己申告で受入を完結させない

## 実装フロー

wave-dispatch スキルに従う: bd ready → wave 編成(束ねルール・ミラー起票)→ worktree + /goal 並列委譲 → commander 再検証 → merge → bd close → 内ループミラー close → 契約に基づき push → ゲート判定。

## 承認契約(2026-07-13 承認)

| 項目 | 契約内容 |
|---|---|
| push | wave 境界で自動 push(wave 全タスクが commander 検証 green → merge 後) |
| ライブラリ追加 | 週間DL>10k・既知CVEなし・最終更新<6ヶ月・メジャーライセンスを満たせば自動承認+完了報告に一覧記載。基準外のみ対話承認。exact pin 必須 |
| bd close / status | commander 専管(implementer は完了報告のみ) |
| UI 確認 | **実装後に1点**: wave 3 完了後(owt-9)に dev 実画面(またはスクショ)で人間確認。以降の画面内微調整は wave 内で自動 |

**人間専管(契約で緩和しない)**: 本番クラウドリソースの作成・課金 / 仕様変更(CONTEXT.md・PRD 改定)/ security-gate の MEDIUM 判断 / 本番デプロイ。
**契約にない行為は必ず停止して確認する。**

この契約(wave 境界での commit・push を含む)は、下記 Beads 管理ブロックの Conservative プロファイルより優先する明示的リポジトリ指示である。

## トレーサビリティ規約

- **外ループ(Linear)は使用しない** — 小規模フェーズにつき bd 単独へ縮退(2026-07-13 契約)
- **Beads(bd)= 内ループ**: 実装・テスト・修正・ゲート指摘の管理単位。prefix `owt`
- **内ループミラー: GH Issues あり**(github.com/akitoshi/soniox-livekit-proto)
  - bd = 正、GitHub Issues = タスク看板向けの読み取り専用投影(単方向。GH 側の編集を bd に逆流させない)
  - wave 編成時: `gh issue create --title "[owt-X] <タイトル>" --body "<受入条件>" --label inner-loop` → `bd update owt-X --append-notes "gh#<N>"`
  - wave close 時: `gh issue close <N> --comment "commit <id> / <検証結果>"`(省略禁止。同期失敗では wave を止めず STATE.md に記録)
- 要件 = bd issue キー(owt-X)。コミットメッセージは `feat(owt-X): 説明` 形式
- 「このコードはなぜ存在するか」を bd issue まで遡れること

## bd 運用規律(commander・実装兵とも厳守)

- **note の書く基準**: **context-fresh な agent が再導出できない、または再導出コストが高いことだけ**を書く — 捨てた選択肢と理由 / 非自明な実測事実 / 決定とトレードオフ / 道標(該当 file:symbol を1行)。「〜した」という進捗報告・一般知識・コードの複写は書かない
  - issue title = 検索キー。description には**WHY**(なぜ存在するか)を書く
  - close 前に、次に触る agent 向けの非自明点(残課題・ハマり・道標)を note する。自明なら書かない
- **claim 規律**: issue 本体を変更する前に claim する。claim は **`bd update <id> --claim` のみ**を使う
- **スコーピング**: 指示されたタスクのみ扱う。無関係な ready を巡回しない・勝手に claim しない
- **破壊操作禁止**: `bd delete` / `bd purge` / `bd sql`(DML/DDL)/ 既に `.beads/` がある場所での `bd init` 再実行は、理由の如何を問わず実行しない

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

## コーディング規約

- TypeScript strict。`any` 禁止。外部入力(data channel ペイロード・API 応答・URL/query)は必ずガード関数またはスキーマ検証を通してから使う
- 言語定数は `lib/languages.ts` を単一情報源とする。言語コードのハードコード分岐・推測記述を書かない(公式 Supported languages / Get models API が正)
- Soniox 設定は `stt-rt-v5` を明示。`translation` は one_way のみ(two_way へ戻さない)
- 既存の UI 構成(components/ui の shadcn 風 + components/room)・低彩度 slate/teal・`aria-label`・`prefers-reduced-motion` 尊重を踏襲
- 秘匿情報(`SONIOX_API_KEY` / `LIVEKIT_API_SECRET` 等)は `.env.local`(gitignore 済み)に保存。コードに書かない、ログ・エラーメッセージに出さない、`NEXT_PUBLIC_` に載せない
- 外に出るデータは**許可リスト方式**で組み立てる(拾う項目を明示。生データを丸ごと渡さない)

## 公開してよい / してはいけない情報

CONTEXT.md の線引きが正。要約: 表示名・ロール・言語・字幕テキストは参加者間で公開可。API キー類・一時キーはサーバー専用でログ禁止。字幕・会話ログの永続化・外部送信はこのリポでは全面禁止。実在患者情報を入力しない。

## やってほしくないこと

- any 型の使用
- ログに秘匿情報・公開禁止情報を出す
- 検証(スキーマ)をスキップした外部入力処理
- 承認なしのライブラリ追加(契約基準外の場合)
- 音声・字幕・会話ログの永続化(localStorage・外部送信含む)をこのリポに追加する
- translation を two_way へ戻す / `stt-rt-v5` 以外へ暗黙変更する
- クライアント直結・一時キー発行フローの変更(サーバーエージェント導入を含む)
- 言語コードの推測記述(公式表・Get models API と突合せずに書く)

## 関連ドキュメント

- `CONTEXT.md`: ドメイン語彙の単一情報源
- `docs/prds/one-way-translation.md`: 要件(EARS)
- `docs/specs/one-way-translation-plan.md`: タスク DAG・ゲート位置
- `docs/design/`: 本実装(別リポ)向け設計(owt-7 で作成)
- `STATE.md`: セッション状態・制約・進捗
- `docs/goal-prompt.md`: 実装兵への委譲テンプレ
