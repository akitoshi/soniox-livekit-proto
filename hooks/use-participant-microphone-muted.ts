"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ParticipantEvent, Track, type Participant } from "livekit-client";

export function useParticipantMicrophoneMuted(participant?: Participant) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!participant) return () => undefined;

      participant
        .on(ParticipantEvent.TrackMuted, onStoreChange)
        .on(ParticipantEvent.TrackUnmuted, onStoreChange)
        .on(ParticipantEvent.TrackPublished, onStoreChange)
        .on(ParticipantEvent.TrackUnpublished, onStoreChange);

      return () => {
        participant
          .off(ParticipantEvent.TrackMuted, onStoreChange)
          .off(ParticipantEvent.TrackUnmuted, onStoreChange)
          .off(ParticipantEvent.TrackPublished, onStoreChange)
          .off(ParticipantEvent.TrackUnpublished, onStoreChange);
      };
    },
    [participant],
  );

  const getSnapshot = useCallback(() => {
    if (!participant) return false;
    return participant.getTrackPublication(Track.Source.Microphone)?.isMuted ?? true;
  }, [participant]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
