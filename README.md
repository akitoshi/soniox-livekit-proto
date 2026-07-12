# LiveKit × Soniox オンライン診療プロトタイプ

複数デバイス間のビデオ通話と、参加者ごとのリアルタイム字幕を検証するための最小プロトタイプです。

- LiveKit Cloudで映像、音声、字幕データを配信
- Soniox Web SDKで各ブラウザのマイク音声を文字起こし
- 認証、DB、録画、予約、決済、カルテは実装しない
- 音声と字幕はアプリケーション側で永続保存しない

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
2. PCでロビーを開き、表示されているルーム名を控えます。
3. PC側の表示名を入力し、「参加」を押します。
4. カメラとマイクを許可します。
5. スマートフォンで同じURLを開き、PCと同じルーム名を入力します。
6. スマートフォン側に別の表示名を入力し、「参加」を押します。
7. PCとスマートフォンの双方で、相手の映像と音声を確認します。
8. PC側で日本語または英語を話し、双方の画面にPC側の表示名付き字幕が出ることを確認します。
9. スマートフォン側でも話し、双方の画面にスマートフォン側の表示名付き字幕が出ることを確認します。
10. 字幕履歴を開き、確定字幕、話者、時刻、言語コードを確認します。
11. マイク、カメラ、字幕スイッチ、退出ボタンを順番に確認します。

## Architecture

```text
Browser A microphone -> Soniox Web SDK -> caption JSON --+
                                                        +-> LiveKit data channel -> all browsers
Browser B microphone -> Soniox Web SDK -> caption JSON --+

Browser A camera/audio <---------- LiveKit Room ----------> Browser B camera/audio
```

サーバー側の音声処理エージェントはありません。各ブラウザはLiveKitで公開済みのローカルマイクトラックを `MediaStream` としてSoniox Web SDKへ渡します。

### Caption protocol

LiveKit data topic: `captions`

```ts
type CaptionPayload = {
  participantIdentity: string;
  participantName: string;
  text: string;
  translation: string | null;
  isFinal: boolean;
  lang: string | null;
  translationLang: string | null;
  timestamp: number;
};
```

- interim字幕は低遅延を優先してlossy配信
- final字幕は欠落を避けるためreliable配信
- interimは参加者IDごとに同じ表示行を更新
- finalは履歴へ追加し、該当参加者のinterimを消去
- 字幕履歴は最大300件をブラウザメモリ内に保持
- 日本語と英語の双方向翻訳を原文と同じpayloadで配信

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

この処理により、単語や空白単位のfinalトークンが字幕履歴へ大量に分割されることを避け、日英の原文と翻訳を同じ発話として表示します。

### UI direction

- 医療用途を想定し、低彩度のslateとtealを使用
- 装飾的なモーションは使わず、状態変化だけを短いトランジションで表示
- 操作ボタンはアイコンに `aria-label` を付与
- スマートフォンでは下部コントロールをコンパクト化し、カメラ切り替えを表示
- `prefers-reduced-motion` とシステムのダークモードを尊重

### LiveKit camera tracks

`GridLayout` には実際のcamera track referenceだけを渡します。`useTracks` の `withPlaceholder` は参加直後にplaceholderから実トラックへIDが変わり、LiveKit 2.9.23の安定化キャッシュが古いIDを参照する場合があるため使用していません。カメラのミュート中は既存publicationのミュート状態を `ParticipantTile` が表示します。

## Known limitations

- 本人確認、認証、権限管理はありません。ルーム名を知っている人は参加できます。
- 字幕履歴はページ再読み込みで消えます。
- 字幕の順序は各端末の時計を利用するため、端末時刻が大きくずれている場合は前後することがあります。
- interim字幕はlossy配信なので、ネットワーク状況によって途中表示が欠落する場合があります。final字幕はreliableで再送されます。
- 字幕スイッチを切ると、その端末からの文字起こし配信と画面上の字幕表示が停止します。
- Soniox Web SDKが利用する `MediaRecorder` の対応形式はブラウザに依存します。
- モバイルブラウザではバックグラウンド移行時にカメラ、マイク、WebSocketが停止する場合があります。
- 翻訳は日本語と英語の双方向に固定されています。
- このプロトタイプは録画、画面共有、チャットを実装していません。
