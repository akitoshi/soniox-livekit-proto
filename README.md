# LiveKit × Soniox オンライン診療プロトタイプ

複数デバイス間のビデオ通話と、医師・患者それぞれの一方向翻訳によるリアルタイム字幕を検証するための最小プロトタイプです。

- LiveKit Cloudで映像、音声、字幕データを配信
- Soniox Web SDKで各ブラウザのマイク音声を文字起こしし、相手の言語へ翻訳
- ロビーで表示名、ロール(医師・患者)、患者言語をSoniox対応60言語から選択
- 字幕履歴から確定済み会話ログ全文をプレーンテキストでコピー
- 認証、DB、録画、予約、決済、カルテは実装しない
- 音声、字幕、会話ログはアプリケーション側で永続保存しない

> このリポジトリは技術検証用です。実在する患者の情報を入力しないでください。本番のオンライン診療システムとして利用するには、本人確認、同意管理、アクセス制御、監査、障害対応、法令・ガイドライン適合などの追加設計が必要です。

## Requirements

- Node.js 20.9以上
- pnpm 10以上
- LiveKit Cloudプロジェクト
- Sonioxプロジェクト
- カメラとマイクを利用できるモダンブラウザ

## Setup

### LiveKit Cloud

1. [LiveKit Cloud](https://cloud.livekit.io/)でアカウントを作成します。
2. 新しいプロジェクトを作成します。
3. Project settingsからWebSocket URL、API Key、API Secretを取得します。
4. URLは `wss://...livekit.cloud` の形式で設定します。

参考: [LiveKit React quickstart](https://docs.livekit.io/transport/sdk-platforms/react/)

### Soniox Console

1. [Soniox Console](https://console.soniox.com/)でアカウントとプロジェクトを作成します。
2. API Keysからサーバー用APIキーを発行します。
3. 発行したキーを `SONIOX_API_KEY` に設定します。

ブラウザへ長期APIキーは渡しません。`/api/soniox-token` がサーバー上で60秒有効、単一使用、最大2時間の一時キーを発行します。

参考: [Soniox temporary API key](https://soniox.com/docs/api-reference/auth/create_temporary_api_key)、[Soniox WebSocket API](https://soniox.com/docs/api-reference/stt/websocket-api)

### Environment variables

```bash
cp .env.example .env.local
```

`.env.local` を編集します。

```dotenv
LIVEKIT_URL=wss://xxxx.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
SONIOX_API_KEY=your_soniox_api_key
```

未設定の場合もアプリはクラッシュしません。診療ルームに、設定が不足している環境変数を表示します。

## Local development

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

品質確認コマンド:

```bash
pnpm lint
pnpm tsc --noEmit
pnpm build
```

## Two-device manual test

スマートフォンのカメラとマイクを利用するには、ページがHTTPSまたはlocalhostで配信される必要があります。PCとスマートフォンの組み合わせでは、VercelなどのHTTPSプレビュー、または信頼できるHTTPSトンネルを利用してください。

1. `.env.local` を設定してHTTPS環境でアプリを起動します。
2. PCでロビーを開き、表示されているルーム名を控えます。表示名を入力し、ロールは「医師」、患者の言語は例として「Deutsch (ドイツ語)」を選択して「参加」を押します。
3. カメラとマイクを許可し、診療ルームへ入室できることを確認します。
4. スマートフォンで同じURLを開き、PCと同じルーム名と別の表示名を入力します。ロールは「患者」、あなたの言語はPCと同じ「Deutsch (ドイツ語)」を選択して「参加」を押します。
5. カメラとマイクを許可し、双方で相手の映像と音声を確認します。
6. PCの医師が日本語で話します。PCでは自分の日本語原文がメイン、スマートフォンではドイツ語訳がメインかつ日本語原文が小さく表示されることを確認します。
7. スマートフォンの患者がドイツ語で話します。スマートフォンでは自分のドイツ語原文がメイン、PCでは日本語訳がメインかつドイツ語原文が小さく表示されることを確認します。
8. 発話途中のinterim字幕がグレー系で表示され、発話確定後に通常表示へ変わることを双方で確認します。
9. どちらかの発話に英語を混ぜ、英語部分も相手側の選択言語へ翻訳されることを確認します。
10. 双方で字幕履歴を開き、確定字幕、話者名、時刻、言語コードを確認します。
11. 字幕履歴の「全文をコピー」を押してテキストエディタへ貼り付けます。医師側では `[医師 ja] 原文` / `[患者 de→ja] 訳文 (原文: ...)`、患者側では `[医師 ja→de] 訳文 (原文: ...)` / `[患者 de] 原文` の形式になることを確認します。
12. ページを再読み込みし、字幕履歴とコピー対象の会話ログが消えることを確認します。
13. マイク、カメラ、字幕スイッチ、退出ボタンを順番に確認します。

## Architecture

```text
Doctor browser microphone -> Soniox WebSocket (one_way target=patient language) --+
                                                                                  +-> LiveKit data channel (topic: captions) -> both browsers
Patient browser microphone -> Soniox WebSocket (one_way target=ja) ---------------+

Doctor browser camera/audio <---------- LiveKit Room ----------> Patient browser camera/audio

Next.js Route Handlers -- LiveKit access token / Soniox temporary key only --> browsers
```

サーバー側の音声処理エージェントはありません。サーバーの役割は `/api/livekit-token` と `/api/soniox-token` でのトークン発行だけです。各ブラウザはLiveKitで公開済みのローカルマイクトラックを `MediaStream` としてSoniox Web SDKへ直接渡し、生成した字幕JSONをLiveKit data channelのtopic `captions` で配信します。

### Caption protocol

LiveKit data topic: `captions`

```ts
type CaptionPayload = {
  participantIdentity: string;
  participantName: string;
  role: "doctor" | "patient";
  text: string;
  translation: string | null;
  isFinal: boolean;
  lang: string | null;
  translationLang: string | null;
  timestamp: number;
};
```

- 受信JSONはbase payloadの全フィールドと有限な `timestamp` を検証した後、拡張ガード `isCaptionPayload` で `role` が `"doctor"` または `"patient"` であることも検証し、不正なpayloadは破棄
- interim字幕は低遅延を優先してlossy配信
- final字幕は欠落を避けるためreliable配信
- interimは参加者IDごとに同じ表示行を更新
- finalは履歴へ追加し、該当参加者のinterimを消去
- 画面表示用の確定字幕履歴は直近300件、全文コピー用バッファはセッション中の全確定字幕をブラウザメモリ内に保持

### Translation and language selection

ロビーでは表示名に加えて自己申告のロールと患者言語を選択します。患者言語の選択肢は `lib/languages.ts` を単一情報源とするSoniox対応60言語です。このプロトタイプでは患者言語を端末間で自動連携しないため、医師と患者は入室時に同じ患者言語を選択します。

各ブラウザは自分のSonioxセッションを持ち、`stt-rt-v5` を使って次の `one_way` 翻訳を行います。

| ロール | `target_language` |
|---|---|
| 医師 (`doctor`) | ロビーで選択した患者言語 |
| 患者 (`patient`) | `ja` |

`language_hints` は常に `["ja", "en", <患者言語>]` から重複を除いた値です。相手の発話は翻訳をメイン、原文を小さく併記し、自分の発話は原文をメインに表示します。interimはグレー系で表示し、finalで通常表示へ切り替えます。

### Conversation log copy

字幕履歴シートの「全文をコピー」は、コピー用バッファにある全確定字幕を話者・言語ラベル付きのプレーンテキストへ整形します。閲覧者の言語に合う翻訳があれば訳文を本文、原文を括弧内に置きます。

```text
[医師 ja→de] Wir beginnen mit der Untersuchung. (原文: 診察を始めます)
[患者 de] Guten Tag
[患者 ja] 同じ言語です
```

最後の行のように翻訳が生成されない場合も原文だけを出力します。コピー用バッファはメモリ内だけにあり、再読み込みで消えます。`localStorage`、DB、保存APIへ書き出す永続化処理はありません。

## Design Notes

### SDK versions

主要依存は検証時点の公開版に固定しています。

- Next.js `16.2.10`
- React `19.2.7`
- `@livekit/components-react` `2.9.23`
- `livekit-client` `2.20.1`
- `livekit-server-sdk` `2.17.0`
- `@soniox/speech-to-text-web` `1.4.0`
- Soniox model `stt-rt-v5`
- Tailwind CSS `4.3.2`

Sonioxの新しい統合SDKも公開されていますが、このプロトタイプでは要件に従ってブラウザ専用の `@soniox/speech-to-text-web` を使用しています。モデル名は現行WebSocket APIの安定版例に合わせて `stt-rt-v5` としました。

### Token handling

- LiveKitトークンは `/api/livekit-token` で2時間有効として生成
- identityは表示名を正規化した文字列とランダムサフィックスの組み合わせ
- `roomJoin`、`canPublish`、`canSubscribe`、`canPublishData` のみ付与
- Sonioxの長期APIキーはRoute Handler内だけで使用
- Soniox一時キーは60秒で失効し、1回だけ使用可能

### Soniox token processing

Sonioxは確定トークンを一度だけ返し、未確定トークンを更新して返します。`useSonioxCaptions` は原文と翻訳の確定トークンを別々の発話バッファへ追加し、未確定トークンを同じinterim字幕として表示します。Sonioxが返す `<end>` 制御トークンを発話終了の合図として利用し、画面には表示しません。制御トークンが届かない場合だけ、2.5秒のフォールバックタイマーで発話を確定します。

この処理により、単語や空白単位のfinalトークンが字幕履歴へ大量に分割されることを避け、原文と選択言語への翻訳を同じ発話として表示します。

### UI direction

- 医療用途を想定し、低彩度のslateとtealを使用
- 装飾的なモーションは使わず、状態変化だけを短いトランジションで表示
- 操作ボタンはアイコンに `aria-label` を付与
- スマートフォンでは下部コントロールをコンパクト化し、カメラ切り替えを表示
- `prefers-reduced-motion` とシステムのダークモードを尊重

### LiveKit camera tracks

`GridLayout` には実際のcamera track referenceだけを渡します。`useTracks` の `withPlaceholder` は参加直後にplaceholderから実トラックへIDが変わり、LiveKit 2.9.23の安定化キャッシュが古いIDを参照する場合があるため使用していません。カメラのミュート中は既存publicationのミュート状態を `ParticipantTile` が表示します。

### Related production design

本番システムで必要になる認証、永続化、入室フローなどは、このプロトタイプでは実装せず、[docs/design/](docs/design/) に設計だけを記録しています。

- [Clerk認証とSupabase RLS](docs/design/auth-clerk.md)
- [Soniox同時実行数と429対応のバックログ](docs/design/backlog.md)
- [コンプライアンス注意事項](docs/design/compliance-notes.md)
- [本実装の診療入室フロー](docs/design/production-entry-flow.md)
- [文字起こし永続化設計](docs/design/transcript-persistence.md)
- [診療後トランスクリプト表示・コピー設計](docs/design/transcript-view.md)
- [ADR 0001: 字幕処理にサーバーエージェントを使わない](docs/design/adr/0001-no-server-agents.md)

## Known limitations

- 本人確認、認証、権限管理はありません。ルーム名を知っている人は参加できます。
- 字幕履歴はページ再読み込みで消えます。
- 字幕の順序は各端末の時計を利用するため、端末時刻が大きくずれている場合は前後することがあります。
- interim字幕はlossy配信なので、ネットワーク状況によって途中表示が欠落する場合があります。final字幕はreliableで再送されます。
- 字幕スイッチを切ると、その端末からの文字起こし配信と画面上の字幕表示が停止します。
- Soniox Web SDKが利用する `MediaRecorder` の対応形式はブラウザに依存します。
- モバイルブラウザではバックグラウンド移行時にカメラ、マイク、WebSocketが停止する場合があります。
- 医師=日本語話者、患者=選択言語話者の1対1診療を前提とします。ロールは自己申告で、患者言語は端末間で自動同期されません。
- このプロトタイプは録画、画面共有、チャットを実装していません。
