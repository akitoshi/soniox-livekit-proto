# STATE.md

<!-- セッションを跨ぐ引き継ぎの単一情報源。セッション終了時に必ず更新する。
     コンテキストを信用せず、このファイルを信用する。 -->

## 現在の目標

one_way×2 翻訳フェーズ(owt-1〜owt-9)完了 — PRD: docs/prds/one-way-translation.md

## 完了したこと

- リポ初期化・kickoff 完了(2026-07-13): CONTEXT.md / PRD / plan / CLAUDE.md / bd DAG(owt-1〜9)/ 承認契約
  - 決定: このリポは Task 1(one_way×2)+コピー簡易版のみ実装。Task 2/3(Supabase 永続化・診療後画面)と Clerk は docs/design/ に設計記録のみ(本実装は別リポ)
  - 決定: data channel 維持(text streams 移行せず)/ 医師が患者言語を手動選択 / Vitest 最小導入 / 現行ロビーの最小拡張
  - 検証済み事実: Soniox one_way は全言語→target 翻訳(公式 docs)。対応言語は60、zh は単一エントリ(簡体/繁体・広東語の区別なし)。翻訳トークンにタイムスタンプなし
- wave 1 完了(2026-07-13): owt-1(commit 011400b + lockfile)・owt-7(commit 0ac2d73)→ merge ea0359b 系、push 済み。gh#1/#2 close 済み
  - 検証: tsc / lint / test(3 passed)/ build green、dev smoke(/ 200・livekit-token 200/400・soniox-token 200)
  - 自動承認ライブラリ: vitest@4.1.10(週間DL 数百万・MIT・活発維持 — 契約基準内)
  - 学び: (1) 古い dev サーバ(前日起動)がポート3000を占有し smoke が偽404 — smoke 前にポート占有確認を必須化。(2) codex 起動時に hooks 信頼ダイアログが出る — worktree 委譲直後に「3(信頼せず続行)」の送信が必要。(3) codex への --prompt はシェル経由で quote> 表示になるが TUI 起動後に正しく届く

## 次にやること

- wave 2: owt-2(言語定数)+ owt-3(ロビー拡張)を1つの /goal に束ねて委譲(同一 UI 系統・順次依存)

## 詰まっている点

- (なし)

## 制約・禁止事項

<!-- 承認契約の写し+プロジェクト固有の禁止事項。CLAUDE.md と矛盾させない -->

- push: wave 境界で自動(wave 全タスクが commander 検証 green → merge 後)
- 本番リソース作成・仕様変更・ゲート MEDIUM 判断・本番デプロイは人間専管
- 漏れ検知系テスト(ペイロード検証・言語定数テーブルテスト)の削除・無効化は絶対禁止
- レビュー / security-gate は履歴なしの新セッションで実施
- UI 確認は実装後1点(owt-9、dev 実画面 or スクショ)
- このリポに認証・DB・永続化を追加しない(docs/design の設計記録のみ)
- クライアント直結・一時キー・data channel・stt-rt-v5 を変更しない
