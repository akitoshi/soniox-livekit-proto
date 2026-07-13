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

- wave 3 完了(2026-07-13): owt-4(bd580a3)・owt-5(525925f)・owt-6(28802a0)を1 worktree 束ね委譲 → merge・push 済み(main 28802a0)。gh#5/#6/#7 close 済み
  - 検証: tsc / lint / test(4 files, 23 passed)/ build green。languages.ts/test 無変更、isCaptionPayload は基底ガード(types/captions.ts)無変更+role 拡張ガード(hooks/use-caption-channel.ts)方式で弱体化なし(diff 全行精査済み)
  - dev 実打 smoke(PORT=3001): lobby 200 / livekit-token 200・400 / soniox-token 200 / room 200。さらに orca 内蔵ブラウザ2タブ+実マイクで room 実打: 医師(de)・患者の2participant 接続、ja 発話→de 翻訳生成、患者視点で相手=翻訳メイン+原文小、自分=原文のみ(翻訳なしケース破綻なし)、全文コピーで [医師 ja→de] 訳文 (原文: ...) / [患者 ja] 原文 形式をクリップボード実測。console エラー0
  - 残確認(owt-9 の人間 UI 確認1点に委ねる): 患者が非日本語で話す→医師側で ja 翻訳メイン表示になるケース
  - 自動承認ライブラリ: なし(依存追加なし、lockfile 無変更)

- ゲート1 通過(2026-07-13): 対象 bd580a3..28802a0。**CRITICAL 0 / HIGH 0 / MEDIUM 2 / LOW 3 → PASS**(Fable 履歴なし headless、tsc/lint/test 独立再実行 green、Goodhart 弱体化ゼロ確認)
  - MEDIUM 流し込み: owt-0hi(M-1 transcript 行偽造 / M-2 無上限バッファ — **受容 or 対応は人間専管、判断待ち**)
  - LOW 流し込み: owt-h3z(L-1 identity 自己申告 / L-2 表示階層ロジック重複 / L-3 空白トークン脱落 — P3 任意タイミング)

- wave 4 完了(2026-07-13): owt-8(commit d8f6d83、README のみ)→ merge・push 済み(main d8f6d83)。gh#8 close 済み
  - 検証: tsc / lint / test(23 passed)/ build green。docs/design 全7リンク解決確認。README 記述は wave 3 実測事実と commander が突合済み。wave3/wave4 worktree は削除済み

## 次にやること(すべて人間専管)

- **owt-9(受入)**: dev 実画面での UI 人間確認1点(契約)。手順は README の「2デバイス手動テスト」節が新フロー対応済み。pass なら commander が owt-9 close でフェーズ完了
- **owt-0hi**: ゲート1 MEDIUM 2件(M-1 transcript 行偽造 / M-2 無上限バッファ)の受容 or 対応判断。「対応」なら owt-h3z(LOW 3件)と束ねて修正 wave を1本編成すると効率的(同一ファイル群)
- フェーズ完了時: STATE.md の「運用上の学び」を ai-dev-kit 還元プロトコルで棚卸し(wave-dispatch スキル参照)

## 運用手順のメモ(次セッション向け)

- 委譲: `orca worktree create --repo id:83d1e568-175d-4df6-937d-26421be8a652 --name <名前> --no-parent --agent codex --prompt "$(cat <goal file>)"` → codex 起動直後に hooks 信頼ダイアログが出る場合は `orca terminal send --text "3"` → enter(wave 3 ではダイアログ不要・自動で SessionStart hook 完走)
- 完了検知: tui-idle は codex スピナーで早発する。terminal read で「Worked for」or「Goal achieved」を2回連続確認する方式が確実(wave 3 は60秒間隔ポーリングのスクリプトを background Bash で回して検知)
- /goal テンプレは docs/goal-prompt.md。ミラー起票: gh issue create --label inner-loop → bd note に gh#N
- smoke 時のポート3000占有が**別プロジェクトのサーバ**のことがある(wave 3 実測: sorafes-ops)。殺さず `lsof -p <pid>` で cwd を確認し、PORT=3001 で立てるのが安全
- room 実打は orca 内蔵ブラウザで可能: 2タブで医師/患者を開くと実マイク音声で字幕・翻訳まで動く(.env.local を worktree にコピーしてから dev 起動)。クリップボード検証は `orca eval --expression "navigator.clipboard.readText()"`

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
