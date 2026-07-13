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

- wave 2 完了(2026-07-13): owt-2(commit c50d74c)・owt-3(commit 499fce0)→ merge・push 済み。gh#3/#4 close 済み
  - 検証: tsc / lint / test(10 passed)/ build green、dev smoke(ロール+言語UI描画、不正 role/lang フェイルセーフ確認)
  - 言語定数60行は公式表と commander が突合済み(完全一致)。テーブルテストは EXPECTED 完全一致方式で Goodhart 対象

## 次にやること

- **wave 3: owt-4 → owt-5 → owt-6 を1つの worktree・1つの /goal に束ねて委譲(3コミットに分割)**
  - 束ねる理由: owt-5 と owt-6 が components/room/caption-history.tsx と hooks/use-caption-channel.ts を共に触るため、並列 worktree は衝突する
  - owt-4 の要点: use-soniox-captions.ts の two_way(ja/en ハードコード)→ one_way 化(医師: target=患者言語、患者: target="ja")。language_hints=["ja","en",患者言語] 重複除去。SDK の型定義に従う(translation 内は snake_case)。CaptionPayload に role 追加+isCaptionPayload 更新。RoomClient の data-participant-role / data-patient-language 属性 → props 配線に置換。トークン処理の純関数を lib/soniox-tokens.ts に抽出してテスト
  - owt-5 の要点: 相手の発話=翻訳メイン+原文小、自分=原文メイン(overlay/history とも)。local identity の受け渡しが必要。翻訳なし(患者言語=ja 等)でも破綻しない
  - owt-6 の要点: コピー用バッファは表示用300件制限と独立(uncapped)。lib/transcript-format.ts は viewer 言語相対整形(viewer の言語の文をメインに、他方を括弧書き: [患者 de→ja] 訳文 (原文: ...) / [医師 ja] 原文)+テスト。字幕履歴シートに全文コピーボタン(navigator.clipboard)
  - **wave 3 完了後 = ゲート1(🔒)**: security-gate を履歴なし新セッションで実施(観点は plan 参照)。CRITICAL-0 まで wave 4 に進まない
- wave 4: owt-8(README 更新)→ owt-9(受入 — UI 人間確認1点、契約)

## 運用手順のメモ(次セッション向け)

- 委譲: `orca worktree create --repo id:83d1e568-175d-4df6-937d-26421be8a652 --name <名前> --no-parent --agent codex --prompt "$(cat <goal file>)"` → codex 起動直後に hooks 信頼ダイアログが出るので `orca terminal send --text "3"` → enter で「信頼せず続行」を選ぶ
- 完了検知: tui-idle は codex スピナーで早発する。terminal read で「Worked for」or「Goal achieved」を2回連続確認する方式が確実
- /goal テンプレは docs/goal-prompt.md。ミラー起票: gh issue create --label inner-loop → bd note に gh#N

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
