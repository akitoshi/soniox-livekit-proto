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

## 次にやること

- wave 1: owt-1(Vitest 基盤)+ owt-7(docs/design 設計ドキュメント一式)を並列実行(wave-dispatch)

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
