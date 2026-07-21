"use client";

import { useMemo, useState } from "react";
import { ParticipantTile, type TrackReference } from "@livekit/components-react";
import { VideoCameraSlash } from "@phosphor-icons/react";
import type { Participant } from "livekit-client";

type PipVideoProps = {
  tracks: TrackReference[];
  localParticipant: Participant;
  remoteParticipant?: Participant;
};

export function PipVideo({
  tracks,
  localParticipant,
  remoteParticipant,
}: PipVideoProps) {
  const [isLocalMain, setIsLocalMain] = useState(false);

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

  return (
    <section className="consultation-stage" aria-label="通話映像">
      <VideoSurface
        participant={mainParticipant}
        track={mainTrack}
        className="consultation-main-video"
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
}: {
  participant: Participant;
  track?: TrackReference;
  className: string;
}) {
  if (track) {
    return (
      <ParticipantTile
        trackRef={track}
        className={className}
        disableSpeakingIndicator
      />
    );
  }

  return (
    <div className={`${className} flex items-center justify-center bg-slate-900`}>
      <div className="flex flex-col items-center gap-2 px-4 text-center text-slate-400">
        <VideoCameraSlash size={26} weight="bold" />
        <span className="text-xs font-semibold">
          {participant.isLocal ? "カメラがオフです" : "相手のカメラがオフです"}
        </span>
      </div>
    </div>
  );
}
