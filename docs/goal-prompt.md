# /goal 委譲テンプレート

<!-- commander は implementer への委譲を必ずこの形式で行う。自由形式プロンプト禁止。 -->

```
/goal
【目的】
{{タスクID}}: {{1〜2行で何を達成するか。bd show の受入条件を要約}}

【対象】
- worktree: {{worktree パス}}(ブランチ: {{ブランチ名}}、origin/main 基点)
- 触ってよいファイル: {{明示列挙 or パターン}}
- 参照すべきドキュメント: CONTEXT.md、docs/prds/one-way-translation.md の REQ-OWT-{{XX}}

【制約】← 必須ブロック。削らない
- bd close / bd update --status / bd update --claim を実行しない。claim は commander が委譲前に済ませている。完了報告のみに留め、close は commander に委ねる
- bd の破壊操作(`bd delete` / `bd purge` / `bd sql` / 既に `.beads/` がある場所での `bd init` 再実行)は理由の如何を問わず実行しない
- 割り当てられた {{タスクID}} 以外の bd issue に触れない。`bd ready` を自分で巡回して他タスクを拾わない
- bd note / bd comment を書く場合は、context-fresh な agent が再導出できないことだけを書く(捨てた選択肢と理由・非自明な事実・道標)。進捗報告は本テンプレの【出力】に書く
- git push しない(commit はローカルまで)
- 上記「触ってよいファイル」以外に触れない
- 新規ライブラリをインストールしない(必要なら候補と根拠を報告して停止)
- 漏れ検知系テスト(字幕ペイロード検証テスト・言語定数テーブルテスト)の削除・skip・期待値緩和は禁止
- dev サーバを起動しない(実打 smoke は commander 職掌)
- 共有ページ(app/page.tsx・app/layout.tsx 等、複数タスクが触れるファイル)への追加は、セクションコンポーネントを新設して組み込む。既存共有ファイルへの直接追記をしない(並列 worktree の衝突予防)
- 音声・字幕・会話ログの永続化(localStorage・外部送信含む)を追加しない
- translation を two_way に戻さない。stt-rt-v5 を変更しない。一時キー発行フローを変更しない
- 言語コードを推測で書かない(lib/languages.ts を単一情報源とする)
- 検証コマンド(install/test 等)が sandbox 制約で失敗する場合は、その旨を報告してファイル変更を完了させる(実行検証は commander が行う)

【完了条件】
{{bd show の受入条件をそのまま転記}}
- pnpm tsc / pnpm lint / pnpm test / pnpm build が green(sandbox で実行不可なら報告に明記 — commander が再実行する。「test green」のみの完了報告は不可)

【出力】
- 変更ファイル一覧と各変更の要約
- 追加・変更したテストの一覧
- 自分で実行できなかった検証コマンドの一覧(commander 再検証用)
- 判断に迷った点・仕様の曖昧さ(あれば)
```

## 運用ルール(commander 向け)

- 5分無応答 → 再委譲。2回連続失敗 → planner 相談(1回)→ 人間確認
- 修正委譲は同じ worktree へ(新規 worktree を切らない)
- 完了報告を受けたら、検証コマンドブロック(CLAUDE.md)を**全て** commander が再実行してから merge 判断
