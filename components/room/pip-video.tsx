"use client";

import { useMemo, useState } from "react";
import {
  ParticipantTile,
  type TrackReference,
  useSpeakingParticipants,
} from "@livekit/components-react";
import {
  MicrophoneSlash,
  SpinnerGap,
  VideoCameraSlash,
} from "@phosphor-icons/react";
import type { Participant } from "livekit-client";

import { useParticipantMicrophoneMuted } from "@/hooks/use-participant-microphone-muted";

type PipVideoProps = {
  tracks: TrackReference[];
  localParticipant: Participant;
  remoteParticipant?: Participant;
  isLocalCameraSwitching?: boolean;
};

export function PipVideo({
  tracks,
  localParticipant,
  remoteParticipant,
  isLocalCameraSwitching = false,
}: PipVideoProps) {
  const [isLocalMain, setIsLocalMain] = useState(false);
  const activeSpeakers = useSpeakingParticipants();
  const isRemoteMuted = useParticipantMicrophoneMuted(remoteParticipant);

  const { localTrack, remoteTrack } = useMemo(
    () => ({
      localTrack: tracks.find((track) => track.participant.isLocal),
      remoteTrack: remoteParticipant
        ? tracks.find(
            (track) => track.participant.identity === remoteParticipant.identity,
          )
        : undefined,
    }),
    [remoteParticipant, tracks],
  );

  const mainParticipant =
    remoteParticipant && !isLocalMain ? remoteParticipant : localParticipant;
  const mainTrack = mainParticipant.isLocal ? localTrack : remoteTrack;
  const pipParticipant = remoteParticipant
    ? isLocalMain
      ? remoteParticipant
      : localParticipant
    : undefined;
  const pipTrack = pipParticipant?.isLocal ? localTrack : remoteTrack;
  const activeSpeakerIdentities = useMemo(
    () => new Set(activeSpeakers.map((participant) => participant.identity)),
    [activeSpeakers],
  );

  return (
    <section
      className="consultation-stage relative min-h-0 flex-1"
      aria-label="通話映像"
    >
      <VideoSurface
        participant={mainParticipant}
        track={mainTrack}
        className="consultation-main-video"
        isSpeaking={
          mainParticipant.isSpeaking ||
          activeSpeakerIdentities.has(mainParticipant.identity)
        }
        isMicrophoneMuted={!mainParticipant.isLocal && isRemoteMuted}
        isCameraSwitching={mainParticipant.isLocal && isLocalCameraSwitching}
      />

      {pipParticipant ? (
        <button
          type="button"
          className="consultation-pip group"
          onClick={() => setIsLocalMain((current) => !current)}
          aria-label={`${pipParticipant.isLocal ? "自分" : "相手"}の小窓をメイン映像と入れ替える`}
        >
          <VideoSurface
            participant={pipParticipant}
            track={pipTrack}
            className="consultation-pip-video"
            isSpeaking={
              pipParticipant.isSpeaking ||
              activeSpeakerIdentities.has(pipParticipant.identity)
            }
            isMicrophoneMuted={!pipParticipant.isLocal && isRemoteMuted}
            isCameraSwitching={pipParticipant.isLocal && isLocalCameraSwitching}
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent px-2.5 pb-2 pt-6 text-left text-[11px] font-semibold text-slate-100">
            {pipParticipant.isLocal ? "自分" : "相手"}
          </span>
        </button>
      ) : (
        <div className="pointer-events-none absolute inset-x-6 top-6 z-10 mx-auto max-w-md rounded-xl border border-white/10 bg-slate-900/80 p-3 text-center text-sm text-slate-300 shadow-lg backdrop-blur">
          同じルーム名で相手が参加するのを待っています。
        </div>
      )}
    </section>
  );
}

function VideoSurface({
  participant,
  track,
  className,
  isSpeaking,
  isMicrophoneMuted,
  isCameraSwitching,
}: {
  participant: Participant;
  track?: TrackReference;
  className: string;
  isSpeaking: boolean;
  isMicrophoneMuted: boolean;
  isCameraSwitching: boolean;
}) {
  return (
    <div className={className} data-speaking={isSpeaking}>
      {track ? (
        <ParticipantTile
          trackRef={track}
          className="consultation-video-tile"
          disableSpeakingIndicator
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="flex flex-col items-center gap-2 px-4 text-center text-slate-400">
            <VideoCameraSlash size={26} weight="bold" />
            <span className="text-xs font-semibold">
              {participant.isLocal ? "カメラがオフです" : "相手のカメラがオフです"}
            </span>
          </div>
        </div>
      )}

      {isMicrophoneMuted ? (
        <div
          role="status"
          className="consultation-muted-indicator"
          aria-label="相手のマイクはミュートされています"
        >
          <MicrophoneSlash aria-hidden="true" size={15} weight="bold" />
          <span>ミュート中</span>
        </div>
      ) : null}

      {isCameraSwitching ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-0 z-20 flex animate-[fade-in_120ms_ease-out] flex-col items-center justify-center gap-2 bg-slate-950/85 px-3 text-center text-xs font-semibold text-slate-100 backdrop-blur-sm"
        >
          <SpinnerGap className="animate-spin" size={20} weight="bold" />
          <span>カメラ切替中</span>
        </div>
      ) : null}
    </div>
  );
}
