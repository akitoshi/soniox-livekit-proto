"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoomEvent, type Room } from "livekit-client";

import {
  useSonioxCaptions,
  type SonioxCaptionChunk,
} from "@/hooks/use-soniox-captions";
import {
  CAPTION_TOPIC,
  isCaptionPayload as isBaseCaptionPayload,
  type CaptionPayload as BaseCaptionPayload,
} from "@/types/captions";
import type { SonioxLanguageCode } from "@/lib/languages";
import type { ParticipantRole } from "@/lib/soniox-tokens";

export type CaptionPayload = BaseCaptionPayload & {
  role: ParticipantRole;
};

export const MAX_CAPTION_TEXT_LENGTH = 8192;

export function isCaptionPayload(value: unknown): value is CaptionPayload {
  if (!isBaseCaptionPayload(value)) return false;

  const caption = value as Record<string, unknown>;
  return (
    (caption.role === "doctor" || caption.role === "patient") &&
    value.text.length <= MAX_CAPTION_TEXT_LENGTH &&
    (value.translation === null ||
      value.translation.length <= MAX_CAPTION_TEXT_LENGTH)
  );
}

type UseCaptionChannelOptions = {
  room: Room;
  enabled: boolean;
  microphoneEnabled: boolean;
  stream?: MediaStream;
  participantIdentity: string;
  participantName: string;
  role: ParticipantRole;
  patientLanguage: SonioxLanguageCode;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function useCaptionChannel({
  room,
  enabled,
  microphoneEnabled,
  stream,
  participantIdentity,
  participantName,
  role,
  patientLanguage,
}: UseCaptionChannelOptions) {
  const [finalCaptions, setFinalCaptions] = useState<CaptionPayload[]>([]);
  const [transcriptCaptions, setTranscriptCaptions] = useState<CaptionPayload[]>([]);
  const [interimCaptions, setInterimCaptions] = useState<Record<string, CaptionPayload>>({});

  const applyCaption = useCallback((caption: CaptionPayload) => {
    if (caption.isFinal) {
      setFinalCaptions((current) => [...current, caption].slice(-300));
      setTranscriptCaptions((current) => [...current, caption]);
      setInterimCaptions((current) => {
        const next = { ...current };
        delete next[caption.participantIdentity];
        return next;
      });
      return;
    }

    setInterimCaptions((current) => {
      const next = { ...current };
      if (caption.text.trim()) {
        next[caption.participantIdentity] = caption;
      } else {
        delete next[caption.participantIdentity];
      }
      return next;
    });
  }, []);

  const publishCaption = useCallback(
    (chunk: SonioxCaptionChunk) => {
      const caption: CaptionPayload = {
        participantIdentity,
        participantName,
        role,
        ...chunk,
      };

      applyCaption(caption);

      void room.localParticipant
        .publishData(encoder.encode(JSON.stringify(caption)), {
          reliable: caption.isFinal,
          topic: CAPTION_TOPIC,
        })
        .catch(() => {
          // The local caption remains visible if the room is reconnecting.
        });
    },
    [applyCaption, participantIdentity, participantName, role, room],
  );

  const soniox = useSonioxCaptions({
    enabled: enabled && microphoneEnabled,
    stream,
    role,
    patientLanguage,
    onCaption: publishCaption,
  });

  useEffect(() => {
    const handleData = (payload: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
      if (topic !== CAPTION_TOPIC) return;

      try {
        const parsed: unknown = JSON.parse(decoder.decode(payload));
        if (!isCaptionPayload(parsed) || parsed.participantIdentity === participantIdentity) return;
        applyCaption(parsed);
      } catch {
        // Ignore malformed data packets from other clients.
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [applyCaption, participantIdentity, room]);

  const interimList = useMemo(
    () => Object.values(interimCaptions).sort((a, b) => a.timestamp - b.timestamp),
    [interimCaptions],
  );

  return {
    finalCaptions,
    transcriptCaptions,
    interimCaptions: interimList,
    sonioxStatus: soniox.status,
    sonioxError: soniox.error,
  };
}
