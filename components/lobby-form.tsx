"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  CheckCircle,
  Microphone,
  ShieldCheck,
  Stethoscope,
  WarningCircle,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LobbyForm({ initialRoomName }: { initialRoomName: string }) {
  const router = useRouter();
  const [roomName, setRoomName] = useState(initialRoomName);
  const [displayName, setDisplayName] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const safeRoomName = roomName.trim();
    const safeDisplayName = displayName.trim();

    if (!safeRoomName || !safeDisplayName) {
      setError("ルーム名と表示名を入力してください。");
      return;
    }

    if (!/^[a-zA-Z0-9_-]{3,64}$/.test(safeRoomName)) {
      setError("ルーム名は3〜64文字の英数字、ハイフン、アンダースコアで入力してください。");
      return;
    }

    setIsPreparing(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("このブラウザはカメラとマイクの利用に対応していません。");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: { facingMode: "user" },
      });
      stream.getTracks().forEach((track) => track.stop());

      sessionStorage.setItem("consultation-display-name", safeDisplayName);
      router.push(
        `/room/${encodeURIComponent(safeRoomName)}?name=${encodeURIComponent(safeDisplayName)}`,
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof DOMException && caughtError.name === "NotAllowedError"
          ? "カメラとマイクの許可が必要です。ブラウザの設定を確認してください。"
          : caughtError instanceof Error
            ? caughtError.message
            : "カメラとマイクを開始できませんでした。";
      setError(message);
      setIsPreparing(false);
    }
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_34%),linear-gradient(to_bottom_right,transparent_45%,color-mix(in_oklab,var(--accent)_44%,transparent))]" />

      <div className="relative mx-auto grid min-h-[100dvh] w-full max-w-6xl items-center gap-12 px-5 py-10 md:grid-cols-[1.08fr_0.92fr] md:px-10 md:py-16">
        <section className="max-w-xl">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Stethoscope size={24} weight="bold" />
            </span>
            <div>
              <p className="font-semibold tracking-tight">診療コネクト</p>
              <p className="text-xs text-muted-foreground">オンライン診療プロトタイプ</p>
            </div>
          </div>

          <Badge variant="outline" className="mb-5 bg-background/70 backdrop-blur-sm">
            <ShieldCheck size={15} weight="bold" />
            暗号化されたリアルタイム通話
          </Badge>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-0.04em] md:text-5xl">
            診療に集中できる、静かな通話体験。
          </h1>
          <p className="mt-5 max-w-[55ch] text-base leading-7 text-muted-foreground">
            ビデオ通話とリアルタイム字幕をひとつの画面で確認できます。認証や記録保存を行わない検証用アプリです。
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Camera size={19} weight="bold" />
              </span>
              <div>
                <p className="text-sm font-semibold">低遅延ビデオ</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">LiveKitによる複数端末間の通話</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Microphone size={19} weight="bold" />
              </span>
              <div>
                <p className="text-sm font-semibold">発話を字幕化</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Sonioxによる日本語・英語の認識</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="w-full bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-5">
            <CardTitle>診療ルームに参加</CardTitle>
            <CardDescription>
              同じルーム名を入力した参加者同士が接続されます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="room-name">
                  ルーム名
                </label>
                <Input
                  id="room-name"
                  name="roomName"
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="room-help"
                  disabled={isPreparing}
                />
                <p id="room-help" className="text-xs leading-5 text-muted-foreground">
                  離れた端末では、この値を共有してください。
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="display-name">
                  表示名
                </label>
                <Input
                  id="display-name"
                  name="displayName"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="例: 山田 医師"
                  autoComplete="name"
                  maxLength={50}
                  disabled={isPreparing}
                />
              </div>

              <div className="rounded-xl border border-border bg-muted/55 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 shrink-0 text-primary" size={20} weight="fill" />
                  <p className="text-xs leading-5 text-muted-foreground">
                    参加するとカメラ、マイク、リアルタイム文字起こしが開始されます。音声や字幕はこのプロトタイプに保存されません。
                  </p>
                </div>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/8 p-3.5 text-sm text-destructive"
                >
                  <WarningCircle className="mt-0.5 shrink-0" size={18} weight="fill" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button className="w-full" size="lg" type="submit" disabled={isPreparing || !roomName}>
                {isPreparing ? "デバイスを確認中" : "参加"}
                {!isPreparing ? <ArrowRight size={18} weight="bold" /> : null}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
