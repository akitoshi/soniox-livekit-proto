> **このリポでは実装しない。本実装リポ(本命プラットフォーム)が参照する設計文書。**

# 文字起こし永続化設計

## 目的と境界

診療中の原文と翻訳文を確定セグメント単位で Supabase に逐次保存し、診療後のカルテ転記に使えるようにする。音声は保存せず、LiveKit Agents も導入しない。このリポでは会話ログをブラウザメモリだけに保持し、外部送信、Supabase、`localStorage` を含む永続化は行わない。

## DDL

`consultations` 相当の既存テーブルが本実装リポにない場合の最小案を含む。既存テーブルがある場合は、その主キーと担当医列へ読み替える。

```sql
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  doctor_user_id text not null, -- Clerk session token の sub
  created_at timestamptz not null default now()
);

create table public.consultation_transcripts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.consultations(id),
  speaker text not null,          -- 'doctor' | 'patient'
  language text,                  -- 検出言語 (ja/de/en/...)
  original_text text not null,
  translated_text text,
  seq int not null,               -- クライアント採番の連番
  spoken_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (session_id, speaker, seq)
);

alter table public.consultations enable row level security;
alter table public.consultation_transcripts enable row level security;

revoke all privileges on table public.consultations
from anon, authenticated;
revoke all privileges on table public.consultation_transcripts
from anon, authenticated;

grant select, insert on table public.consultations to authenticated;
grant select, insert, update on table public.consultation_transcripts
to authenticated;

create policy "doctor can select assigned consultations"
on public.consultations
for select
to authenticated
using ((select auth.jwt()->>'sub') = doctor_user_id);

create policy "doctor can insert own consultations"
on public.consultations
for insert
to authenticated
with check ((select auth.jwt()->>'sub') = doctor_user_id);

create policy "doctor can select assigned transcripts"
on public.consultation_transcripts
for select
to authenticated
using (
  exists (
    select 1
    from public.consultations c
    where c.id = consultation_transcripts.session_id
      and c.doctor_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "doctor can insert assigned transcripts"
on public.consultation_transcripts
for insert
to authenticated
with check (
  speaker in ('doctor', 'patient')
  and exists (
    select 1
    from public.consultations c
    where c.id = consultation_transcripts.session_id
      and c.doctor_user_id = (select auth.jwt()->>'sub')
  )
);

-- ON CONFLICT DO UPDATE を使う upsert に必要な最小の UPDATE policy。
-- 一般の編集 UI や DELETE 権限は設けない。
create policy "doctor can update assigned transcripts for retry upsert"
on public.consultation_transcripts
for update
to authenticated
using (
  exists (
    select 1
    from public.consultations c
    where c.id = consultation_transcripts.session_id
      and c.doctor_user_id = (select auth.jwt()->>'sub')
  )
)
with check (
  speaker in ('doctor', 'patient')
  and exists (
    select 1
    from public.consultations c
    where c.id = consultation_transcripts.session_id
      and c.doctor_user_id = (select auth.jwt()->>'sub')
  )
);
```

本実装ではテーブル権限も `authenticated` の必要最小限で付与し、`anon` には付与しない。患者はゲスト参加であるため拒否される。別の Clerk 認証ユーザーも `doctor_user_id` が一致しなければ拒否される。service-role key でこの経路の RLS を迂回しない。

## 書き込み責務

書き込み役は Clerk 認証済みの医師クライアントだけとする。医師側には、自分の Soniox セッションから得る医師発話と、LiveKit 経由で受け取る患者発話の両方が揃う。患者ゲストへ DB 書き込み資格を渡さずに済み、単一 writer によって順序と再送制御も単純になる。

Soniox の `<end>` 検出、または 2〜5 秒のデバウンスで発話を確定し、確定セグメントごとに upsert する。`seq` は speaker ごとに医師クライアントが単調増加で採番する。同じセグメントの再試行では同じ `(session_id, speaker, seq)` を必ず再利用し、unique 制約と upsert で瞬断後の重複を吸収する。セッション終了時だけの一括保存は禁止する。

## 終了時フラッシュ

通常送信とは別に、`pagehide` で未送信バッファを `navigator.sendBeacon` に渡す。`sendBeacon` は任意の `Authorization` や `apikey` ヘッダーを設定できないため、Supabase REST へ直接送らない。同一オリジンの自前 Next.js API Route に送信し、Route 側で Clerk セッションを検証して、その Clerk token を付けた Supabase client から RLS 適用下で upsert する。

API Route は許可したフィールドだけを再構成し、`session_id`、`speaker`、`seq`、文字列長、配列件数を検証する。cookie 認証を使うため Origin/CSRF 対策も必要である。beacon はベストエフォートであり、送信保証とは扱わない。通常時から未送信バッファを小さく保つ。

## Goodhart 対象の RLS 漏洩テスト

本実装リポでは RLS 漏洩テストを strict / Goodhart 対象とし、削除、skip、期待値緩和で green にしない。最低限、担当医の insert/select/upsert 成功、別医師による同じ `session_id` の insert/select/upsert 拒否、患者ゲスト(`anon`)の拒否、推測した `session_id` による越境取得拒否、API Route 経由でも同じ拒否が成立することを検証する。

## 未決事項

- 既存 `consultations` スキーマへの列名・型・外部キーの合わせ込み。
- ページ再読込や複数タブ後も衝突しない `seq` の再開方法。単一タブ中の再送は同じ番号を再利用する。
- upsert 衝突時に既存本文を更新するか、重複を無視するか。上記 DDL は前者を仮置きしており、後者なら UPDATE grant/policy を削除する。
- セグメント確定を Soniox endpoint と 2〜5 秒デバウンスのどちらへ寄せるか、および最大バッファ件数。
