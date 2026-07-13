"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LiveKitRoom } from "@livekit/components-react";
import { ArrowLeft, Gear, SpinnerGap, WarningCircle } from "@phosphor-icons/react";

import { ConsultationRoom } from "@/components/room/consultation-room";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SonioxLanguageCode } from "@/lib/languages";
import type { ParticipantRole } from "@/lib/soniox-tokens";
import { cn } from "@/lib/utils";

type RoomClientProps = {
  roomName: string;
  displayName: string;
  role: ParticipantRole;
  patientLanguage: SonioxLanguageCode;
};

type TokenResponse = {
  token?: string;
  serverUrl?: string;
  identity?: string;
  message?: string;
  missing?: string[];
};

type ConnectionConfig = {
  token: string;
  serverUrl: string;
  identity: string;
};

export function RoomClient({
  roomName,
  displayName,
  role,
  patientLanguage,
}: RoomClientProps) {
  const [config, setConfig] = useState<ConnectionConfig | null>(null);
  const [error, setError] = useState<TokenResponse | null>(null);
  useEffect(() => {
    if (!displayName) return;

    const controller = new AbortController();

    void fetch("/api/livekit-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, displayName }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as TokenResponse;
        if (!response.ok || !data.token || !data.serverUrl || !data.identity) {
          throw data;
        }
        setConfig({ token: data.token, serverUrl: data.serverUrl, identity: data.identity });
      })
      .catch((caughtError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          typeof caughtError === "object" && caughtError
            ? (caughtError as TokenResponse)
            : { message: "LiveKitの接続情報を取得できませんでした。" },
        );
      });

    return () => controller.abort();
  }, [displayName, roomName]);

  if (!displayName) {
    return (
      <RoomError
        title="表示名がありません"
        message="ロビーから表示名を入力して参加してください。"
      />
    );
  }

  if (error) {
    return (
      <RoomError
        title={error.missing?.length ? "セットアップが必要です" : "接続を開始できません"}
        message={error.message ?? "LiveKitの接続情報を取得できませんでした。"}
        missing={error.missing}
      />
    );
  }

  if (!config) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background p-6">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <SpinnerGap className="animate-spin text-primary" size={22} weight="bold" />
          診療ルームを準備しています
        </div>
      </main>
    );
  }

  return (
    <LiveKitRoom
      token={config.token}
      serverUrl={config.serverUrl}
      connect
      audio={{ echoCancellation: true, noiseSuppression: true }}
      video={{ facingMode: "user" }}
      options={{ adaptiveStream: true, dynacast: true }}
      data-lk-theme="default"
      onError={(liveKitError) => setError({ message: liveKitError.message })}
    >
      <ConsultationRoom
        roomName={roomName}
        participantIdentity={config.identity}
        participantName={displayName}
        role={role}
        patientLanguage={patientLanguage}
      />
    </LiveKitRoom>
  );
}

function RoomError({
  title,
  message,
  missing,
}: {
  title: string;
  message: string;
  missing?: string[];
}) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background p-5">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            {missing?.length ? <Gear size={23} weight="bold" /> : <WarningCircle size={23} weight="fill" />}
          </span>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {missing?.length ? (
            <div className="rounded-xl border bg-muted/55 p-4">
              <p className="text-xs font-semibold text-foreground">.env.local に設定してください</p>
              <pre className="mt-2 overflow-x-auto font-mono text-xs leading-6 text-muted-foreground">
                {missing.map((name) => `${name}=`).join("\n")}
              </pre>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                詳しい取得手順はREADMEを確認してください。
              </p>
            </div>
          ) : null}
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            <ArrowLeft size={17} weight="bold" />
            ロビーに戻る
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
