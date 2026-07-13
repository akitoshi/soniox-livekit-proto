# 実装計画: 翻訳設計変更(one_way ×2)+会話ログコピー

日付: 2026-07-13 / 対応 PRD: docs/prds/one-way-translation.md

## タスク DAG

<!-- 🔒 = セキュリティ境界(このタスク群の完了後、次の wave の前に security-gate 必須)
     bd issue ID = 表の ID と同一(prefix owt) -->

| ID | 内容 | 依存 | 見積 | 🔒 |
|---|---|---|---|---|
| owt-1 | Vitest テスト基盤導入 | - | 30m | |
| owt-2 | 言語定数モジュール lib/languages.ts+テーブルテスト | owt-1 | 45m | |
| owt-3 | ロビー拡張 — ロール+患者言語選択 | owt-2 | 60m | |
| owt-4 | Soniox one_way×2 化+ペイロード拡張 | owt-3 | 60m | 🔒 |
| owt-5 | 字幕 UI 階層変更 — 相手=翻訳メイン | owt-4 | 45m | 🔒 |
| owt-6 | 会話ログコピー(メモリ内簡易版) | owt-4 | 45m | 🔒 |
| owt-7 | 本実装向け設計ドキュメント一式(docs/design) | - | 60m | |
| owt-8 | README・ドキュメント更新 | owt-5, owt-6, owt-7 | 30m | |
| owt-9 | 受入 — 手動2デバイス smoke+UI 人間確認 | owt-8 | 30m(人間) | |

## wave 編成の目安

- wave 1: owt-1 + owt-7(独立・並列。owt-7 はコード非接触の docs 専任)
- wave 2: owt-2 + owt-3(順次依存だが同一 UI 系統のため1つの /goal に束ねる)
- wave 3: owt-4 → owt-5(hooks+room コンポーネントの同一ファイル群、1 /goal 順次)+ owt-6(並列)
- **ゲート1(🔒)**: wave 3 完了後、wave 4 の前に security-gate 実施
- wave 4: owt-8 → owt-9(**UI 人間確認1点** — 承認契約。dev 実画面 or スクショで確認)

## ゲート配置

| ゲート | 対象タスク | 観点 |
|---|---|---|
| ゲート1 | owt-4, owt-5, owt-6 | 一時キー非露出(恒久キーのクライアント混入・ログ出力なし)/ data channel ペイロードのスキーマ検証(不正 role・欠落棄却)/ 永続化ゼロの確認(storage・外部送信なし)/ 言語ハードコード分岐なし / Goodhart 監査(ペイロード検証・言語定数テストの弱体化なし) |

## 受入の正

完了判定は本計画の受入条件と PRD の EARS 要件のみを基準にする(テストランナーの緑さで判定しない)。owt-9 の人間 UI 承認をもってフェーズ完了。
