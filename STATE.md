# STATE.md

<!-- セッションを跨ぐ引き継ぎの単一情報源。セッション終了時に必ず更新する。
     コンテキストを信用せず、このファイルを信用する。 -->

## 現在の目標

フェーズ2: 診療 UX 改善(ux-1〜ux-8 = owt-0gs/ntb/tot/4ki/fuy/rcb/5zt/7wc)— PRD: docs/prds/consultation-ux.md、DAG: docs/specs/consultation-ux-plan.md
フェーズ1(one_way×2、owt-1〜8)は実装完了。owt-9 受入は 2026-07-21 実機フィードバックで保留(機能 pass・UX/医療語彙で改善要求)→ ux-8 に統合再受入

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

- 人間判断(2026-07-18): ゲート1 MEDIUM は**対応**を選択(案B)
- wave 5 完了(2026-07-18): owt-0hi(78f749c: M-1 サニタイズ+M-2 長上限 8192)・owt-h3z(3f929db: L-2 共通化+docs/design 要件追記、L-3 は記録のみ)→ merge・push 済み(main 3f929db)。gh#9/#10 close 済み
  - 検証: tsc / lint / test(5 files, 29 passed)/ build green。room 実打で字幕・コピー回帰なし(コピー全行ラベル形式を実測)。基底ガード・言語定数無変更
- 限定再ゲート(2026-07-18): 対象 19cc7ef..3f929db。**FAIL(CRITICAL 0 / HIGH 0)** — M-2 解消・M-1 部分解消。新指摘 M-3: lang/translationLang が無サニタイズでコピーラベルに到達し M-1 と同一の偽行注入が残存(lib/transcript-format.ts:43-48)。再ゲート L-1(C0/C1 制御未除去)は wave 6 に同梱、L-2(transcriptCaptions 件数無上限)は LOW・demo 脅威モデル内で受容記録

- wave 6 完了(2026-07-19): owt-2tc(commit 7ca06aa: isSonioxLanguageCode 許可リスト正規化+ラベル多重サニタイズ+C0/C1 除去)→ rebase・merge・push 済み(main 7ca06aa)。gh#11 close 済み
  - 検証: tsc / lint / test(34 passed)/ build green。room 実打でコピー18行=全行ラベル形式・制御文字ゼロ・正当言語コード通過を実測
  - 学び: (1) run_in_background の dev サーバはハーネスのタスク終了に巻き込まれて exit 0 で落ちることがある — nohup+リダイレクトで完全デタッチが安定。(2) 長時間 room を開き続けると Soniox 一時キーのセッション時間上限エラーが UI に出る(仕様どおり・秘匿情報漏れなし)。タブはリロードで復旧
- 再々ゲート PASS(2026-07-19): 対象 3f929db..7ca06aa。**CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 4 → M-3 解消**(state 3種を NormalizedCaptionPayload 型化し未正規化ペイロードを型で遮断、迂回経路なしを静的トレースで確認)
  - LOW 流し込み: owt-hcw(TAB 単語結合 / スプレッド宣言外フィールド / participantName 無サニタイズ — P3 任意)。LOW-4(identity 突合)は wave 5 の docs/design 反映で対応済み

- フェーズ2開始(2026-07-21): 実機フィードバック(Zoom 比の UX 差・ブスコパン等の医療語彙誤認識)→ PRD/plan 起草・bd DAG 起票(commit b4e4dec)。P2 候補は全採用+医療語彙+字幕UI改善(人間承認済み)
  - Tailscale serve で実機確認環境構築済み: https://mnp.minmi-opah.ts.net:8443 → localhost:3001(本番ビルド、nohup デタッチ稼働中。PID: scratchpad/owt9-server.pid)。iPhone(iphone-15)は tailnet 登録済み

- wave 7 完了(2026-07-21): owt-0gs(2eedac2+fix a8c96e4)・owt-ntb(4d7c293)・owt-tot(7fac86b)→ merge・push 済み(main a8c96e4)。gh#12/13/14 close 済み
  - 検証: tsc / lint / test(34)/ build green。実打 smoke で初回レイアウト赤(ステージ h=50px 潰れ・PiP 画面外)→ DOM rect 実測値を添えて同一セッション再委譲 → fix 後にジオメトリ実測(stage h=1206・PiP 画面内)+スクショで green
  - 学び: (1) 視覚系 wave は unit 全 green でもレイアウト崩壊があり得る — スクショ+getBoundingClientRect 実測を smoke に必須化。(2) aspect-ratio でステージ高さを決めると portrait viewport で破綻(bd note 済み)。(3) 修正再委譲は orca terminal send で同一 codex セッションに実測データ付きで送るのが速い(2分40秒で修正完了)
  - tailnet 実機サーバ(3001)は新 UI ビルドで再稼働済み
  - SDK 発見: @soniox/speech-to-text-web の Context に translation_terms({source,target} 対訳ペア)がある — ブスコパン→Buscopan の翻訳固定が可能(wave 8 で採用)

- wave 8 完了(2026-07-21): owt-4ki(e1f929b+fix 14d394e)・owt-fuy(ed2c5bd)→ merge・push 済み(main 14d394e)。gh#15/16 close 済み
  - 検証: tsc / lint / test(7 files, 46 passed)/ build green。Soniox context 上限(8,000 tokens)は公式 docs 実確認で突合。実打で言語変更 es の伝搬・患者通知(1秒・5秒で自動消滅)・ガード動作を確認
  - **実打で発見した赤**: LiveKit token grant に canUpdateOwnMetadata が無く setAttributes がサーバ拒否 → fix 14d394e(grant 1行)。/goal で app/api を変更禁止にした commander の許可リスト設計ミスが原因 — 学び: attributes/metadata 系のタスクでは token grant 面を許可リストに含めるか事前確認する
  - es 実発話での翻訳生成は未確認(smoke 時無音)— ux-8 実機受入でブスコパンと併せて確認
  - 学び: orca eval の戻りは result.result キー(value ではない)。--page 指定でバックグラウンドタブを並行操作できる(2タブ伝搬テストに有効)

- ゲート2 PASS(2026-07-21): 対象 e5e4a5c..14d394e。**CRITICAL 0 / HIGH 0 / MEDIUM 1 / LOW 3**(Fable 履歴なし、独立再実行 green、Goodhart 違反ゼロ、token grant は最小権限判定)
  - MEDIUM 流し込み: owt-138(consult.settings の送信者無検証 — 第三参加者による設定操作・再起動チャーン。**受容 or 対応は人間専管、判断待ち**。修正案: 再起動デバウンス+docs/design 要件明記)
  - LOW 流し込み: owt-l5d(語彙累積バジェット / setName 副次解放 / 不可視文字 — P3 任意)

## 次にやること

- **wave 9 進行中**: ux-6(owt-rcb コピー医師限定+字幕階層・S/M/L)+ ux-7(owt-5zt README 更新+ブスコパン fixture 手順)を worktree `wave9-captions-docs` で codex に委譲済み(gh#17/18)。完了後: commander 再検証(実打+スクショ)→ merge → push
- **人間判断待ち**: owt-138(ゲート2 MEDIUM)。対応なら wave 9 後の小修正で
- wave 9 後: ux-8(owt-7wc 統合受入 — 人間の実機確認: 新 UI 全項目+ブスコパン発話+es 翻訳、owt-9 併合 close)→ フェーズ2完了処理(学び棚卸し)
- wave 9: ux-6(owt-rcb コピー医師限定+字幕UI)+ ux-7(owt-5zt docs)→ ux-8(owt-7wc 統合受入 — 人間、owt-9 併合)
- owt-hcw(P3・任意): 再々ゲート LOW 3件。手すきの wave に同乗可
- フェーズ完了時: 学びを ai-dev-kit 還元プロトコルで棚卸し

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
