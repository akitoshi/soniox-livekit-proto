# 実装計画: 診療 UX 改善フェーズ(フェーズ2)

PRD: docs/prds/consultation-ux.md。bd prefix は引き続き owt(タイトルに「フェーズ2」を含める)。

## タスク DAG

```
ux-1 PiP レイアウト+タップ入替+セーフエリア (REQ-15)   ─┐
ux-2 ミュート/話者表示+再接続バナー (REQ-16,17)          ├─ wave 7(視覚系束ね・1 worktree)
ux-3 カメラ前面/背面切替 (REQ-18)                        ─┘
ux-4 attributes 基盤+通話中の患者言語変更 (REQ-19) 🔒    ─┐
ux-5 医療語彙+カスタム語彙伝搬 (REQ-20)  [dep: ux-4]     ─┴─ wave 8(設定伝搬束ね)
ux-6 コピー医師限定+字幕 UI 改善 (REQ-21,22)             ── wave 9(ux-4/5 の後)
ux-7 README・docs 更新  [dep: ux-1..6]                   ── wave 9 に同乗
ux-8 統合受入 — 実機 UI 人間確認+ブスコパン fixture  [dep: 全部・owt-9 併合]
```

## ゲート位置

- **ゲート2(🔒)**: wave 8 完了後。attributes という新しい外部入力面(言語コード・語彙リストの受信)を跨ぐため。観点: attributes 検証ガードの網羅・語彙リストのサイズ上限・インジェクション(語彙文字列がそのまま Soniox context へ渡る際の扱い)・既存ガードの弱体化ゼロ
- wave 7(視覚系)はゲート対象外(外部入力・秘匿情報に触れない)

## 設計判断(planner 記録)

- 設定伝搬は data channel の新 topic ではなく **LiveKit participant attributes** を採用: イベントでなく状態のため再接続・途中入室で最新値が取れる。医師→自分の attributes に {patientLanguage, extraTerms} を設定し、患者側は ParticipantAttributesChanged + 入室時読み取りで追随
- 言語・語彙の変更は Soniox セッション再起動で反映(既存の useEffect deps 機構を流用)。一時キーは開始毎に再発行される既存フローのまま
- 医療語彙は lib/medical-terms.ts に静的 curated リスト(薬剤名・症状・検査名・診療語)。カスタム語彙はメモリ内のみ
