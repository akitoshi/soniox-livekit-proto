"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import {
  CameraRotate,
  ChatText,
  Microphone,
  MicrophoneSlash,
  PhoneDisconnect,
  SpinnerGap,
  Stethoscope,
  Subtitles,
  VideoCamera,
  VideoCameraSlash,
  WarningCircle,
} from "@phosphor-icons/react";
import { ConnectionState, Track } from "livekit-client";

import { CaptionHistory } from "@/components/room/caption-history";
import { CaptionOverlay } from "@/components/room/caption-overlay";
import { PipVideo } from "@/components/room/pip-video";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useCaptionChannel } from "@/hooks/use-caption-channel";
import { useCameraFacing } from "@/hooks/use-camera-facing";
import type { SonioxLanguageCode } from "@/lib/languages";
import type { ParticipantRole } from "@/lib/soniox-tokens";
import { cn } from "@/lib/utils";

type ConsultationRoomProps = {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  role: ParticipantRole;
  patientLanguage: SonioxLanguageCode;
};

export function ConsultationRoom({
  roomName,
  participantIdentity,
  participantName,
  role,
  patientLanguage,
}: ConsultationRoomProps) {
  const router = useRouter();
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const participants = useParticipants();
  // Avoid replacing a synthetic placeholder with the real publication during
  // initial camera publish. GridLayout's stable-order cache can briefly retain
  // the placeholder id and report "Element not part of the array".
  const tracks = useTracks([Track.Source.Camera]);
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    microphoneTrack,
  } = useLocalParticipant({ room });
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [controlError, setControlError] = useState<string | null>(null);
  const remoteParticipant = participants.find((participant) => !participant.isLocal);
  const {
    canSwitchCamera,
    isSwitchingCamera,
    cameraSwitchError,
    switchCamera,
    clearCameraSwitchError,
  } = useCameraFacing(room);

  const mediaStreamTrack = microphoneTrack?.track?.mediaStreamTrack;
  const microphoneStream = useMemo(
    () => (mediaStreamTrack ? new MediaStream([mediaStreamTrack]) : undefined),
    [mediaStreamTrack],
  );

  const {
    finalCaptions,
    transcriptCaptions,
    interimCaptions,
    sonioxStatus,
    sonioxError,
  } = useCaptionChannel({
    room,
    enabled: captionsEnabled,
    microphoneEnabled: isMicrophoneEnabled,
    stream: microphoneStream,
    participantIdentity,
    participantName,
    role,
    patientLanguage,
  });

  const isConnected = connectionState === ConnectionState.Connected;
  const isReconnecting = connectionState === ConnectionState.Reconnecting;
  const subtitleStatus =
    sonioxStatus === "listening"
      ? "字幕配信中"
      : sonioxStatus === "starting"
        ? "字幕準備中"
        : captionsEnabled && isMicrophoneEnabled
          ? "字幕待機中"
          : "字幕停止中";

  async function toggleMicrophone() {
    setControlError(null);
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled, {
        echoCancellation: true,
        noiseSuppression: true,
      });
    } catch {
      setControlError("マイクを切り替えられませんでした。");
    }
  }

  async function toggleCamera() {
    setControlError(null);
    clearCameraSwitchError();
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch {
      setControlError("カメラを切り替えられませんでした。");
    }
  }

  async function switchFacingCamera() {
    setControlError(null);
    await switchCamera();
  }

  async function leaveRoom() {
    await room.disconnect();
    router.push("/");
  }

  return (
    <Sheet>
      <div className="consultation-room relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-950 text-slate-50">
        <header className="consultation-header-safe flex min-h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-slate-950/95 px-4 backdrop-blur md:px-6">
          <span className="flex size-9 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Stethoscope size={20} weight="bold" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{roomName}</h1>
            <p className="truncate text-xs text-slate-400">{participants.length}人が参加中</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "hidden border-white/15 bg-white/5 text-slate-300 sm:inline-flex",
                isConnected && "border-teal-300/20 bg-teal-300/10 text-teal-200",
              )}
            >
              {isConnected ? "接続済み" : "接続中"}
            </Badge>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-slate-200 hover:bg-white/10 hover:text-white"
                aria-label="字幕履歴を開く"
              >
                <ChatText size={20} weight="bold" />
              </Button>
            </SheetTrigger>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 md:p-4">
          <PipVideo
            key={remoteParticipant?.identity ?? "waiting"}
            tracks={tracks}
            localParticipant={localParticipant}
            remoteParticipant={remoteParticipant}
            isLocalCameraSwitching={isSwitchingCamera}
          />

          <CaptionOverlay
            enabled={captionsEnabled}
            finalCaptions={finalCaptions}
            interimCaptions={interimCaptions}
            localParticipantIdentity={participantIdentity}
          />

          {isReconnecting ? (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-x-4 top-3 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-xl border border-teal-200/20 bg-slate-900/92 px-3.5 py-2 text-xs font-semibold text-teal-100 shadow-lg backdrop-blur"
            >
              <SpinnerGap className="animate-spin" size={16} weight="bold" />
              再接続中…
            </div>
          ) : null}

          {sonioxError || controlError || cameraSwitchError ? (
            <div
              role="alert"
              className={cn(
                "absolute inset-x-4 z-30 mx-auto flex max-w-xl items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-950/90 p-3 text-xs text-rose-100 shadow-lg backdrop-blur",
                isReconnecting ? "top-16" : "top-4",
              )}
            >
              <WarningCircle className="shrink-0" size={17} weight="fill" />
              <span>{controlError ?? cameraSwitchError ?? sonioxError}</span>
            </div>
          ) : null}
        </main>

        <div className="consultation-controls-safe absolute inset-x-0 bottom-0 z-30">
          <div className="mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-900/92 p-2 shadow-2xl backdrop-blur-xl md:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "text-slate-100 hover:bg-white/10 hover:text-white",
                !isMicrophoneEnabled && "bg-rose-500/18 text-rose-200 hover:bg-rose-500/24",
              )}
              onClick={toggleMicrophone}
              aria-label={isMicrophoneEnabled ? "マイクをオフ" : "マイクをオン"}
              aria-pressed={isMicrophoneEnabled}
            >
              {isMicrophoneEnabled ? (
                <Microphone size={21} weight="bold" />
              ) : (
                <MicrophoneSlash size={21} weight="bold" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "text-slate-100 hover:bg-white/10 hover:text-white",
                !isCameraEnabled && "bg-rose-500/18 text-rose-200 hover:bg-rose-500/24",
              )}
              onClick={toggleCamera}
              aria-label={isCameraEnabled ? "カメラをオフ" : "カメラをオン"}
              aria-pressed={isCameraEnabled}
            >
              {isCameraEnabled ? (
                <VideoCamera size={21} weight="bold" />
              ) : (
                <VideoCameraSlash size={21} weight="bold" />
              )}
            </Button>

            {canSwitchCamera ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-100 hover:bg-white/10 hover:text-white"
                onClick={switchFacingCamera}
                disabled={!isCameraEnabled || isSwitchingCamera}
                aria-label={
                  isSwitchingCamera
                    ? "カメラを切り替えています"
                    : "前面と背面のカメラを切り替える"
                }
                aria-busy={isSwitchingCamera}
              >
                <CameraRotate
                  className={cn(isSwitchingCamera && "animate-spin")}
                  size={21}
                  weight="bold"
                />
              </Button>
            ) : null}

            <div className="mx-1 h-8 w-px bg-white/10" />

            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/5 md:px-3">
              <Subtitles size={20} weight="bold" />
              <span className="hidden sm:inline">{subtitleStatus}</span>
              <Switch
                checked={captionsEnabled}
                onCheckedChange={setCaptionsEnabled}
                aria-label="字幕の配信と表示を切り替える"
                className="data-[state=unchecked]:bg-slate-700"
              />
            </label>

            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={leaveRoom}
              aria-label="通話から退出"
            >
              <PhoneDisconnect size={21} weight="bold" />
            </Button>
          </div>
        </div>

        <RoomAudioRenderer />
      </div>

      <CaptionHistory
        finalCaptions={finalCaptions}
        transcriptCaptions={transcriptCaptions}
        interimCaptions={interimCaptions}
        localParticipantIdentity={participantIdentity}
        viewerLanguage={role === "doctor" ? "ja" : patientLanguage}
      />
    </Sheet>
  );
}
