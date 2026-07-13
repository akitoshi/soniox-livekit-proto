> **このリポでは実装しない。本実装リポ(本命プラットフォーム)が参照する設計文書。**

# Clerk 認証と Supabase RLS 連携メモ

## ロール境界

- 医師は Clerk で認証する。Clerk user ID を担当医の安定した識別子として扱う。
- 患者は共有リンクから入るゲストであり、Clerk 認証や Supabase の書き込み・閲覧資格を持たない。
- `doctor` / `patient` という画面上の role だけを認可根拠にしない。

## JWT 連携方針

Clerk を Supabase の third-party auth provider として設定する現行のネイティブ連携を使う。非対称鍵で署名された Clerk session token を Supabase client の `accessToken` として渡し、Supabase は token を検証する。RLS は `auth.jwt()->>'sub'` と `consultations.doctor_user_id` の一致を基準にする。Supabase 用の旧 Clerk JWT template や Supabase JWT secret の Clerk との共有は採用しない。

ブラウザまたは API Route の user-scoped DB 操作は、publishable key と現在の Clerk token を使い、service-role key で RLS を迂回しない。session token が持つ `role=authenticated` を DB ロールに使い、`sub` を担当医識別に使う。組織・施設単位の認可が必要になった場合は、検証済み claim と DB 上の所属を別途照合する。

参考:

- [Clerk: Integrate Supabase with Clerk](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase: Use Clerk with your Supabase project](https://supabase.com/docs/guides/auth/third-party/clerk)

## このリポとの差分

このリポには Clerk、Supabase、本人確認、権限管理がない。ロビーで `doctor` / `patient` を自己申告し、ルーム名を知る者が参加できる検証用構成である。本実装では、この自己申告を医師の認証・認可へ流用しない。

## 未決事項

- 本実装リポの既存 Clerk application / Supabase project へ third-party provider を設定する責任者と環境分離。
- 医師と Clerk user ID のプロビジョニング、無効化、施設所属のデータモデル。
- 患者リンクの失効時間、再利用可否、本人確認方法。患者ゲストへ transcript 権限を与えない方針は確定。

