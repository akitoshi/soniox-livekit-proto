"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoomEvent, type Room } from "livekit-client";

import {
  useSonioxCaptions,
  type SonioxCaptionChunk,
} from "@/hooks/use-soniox-captions";
import {
  CAPTION_TOPIC,
  isCaptionPayload,
  type CaptionPayload,
} from "@/types/captions";

type UseCaptionChannelOptions = {
  room: Room;
  enabled: boolean;
  microphoneEnabled: boolean;
  stream?: MediaStream;
  participantIdentity: string;
  participantName: string;
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
}: UseCaptionChannelOptions) {
  const [finalCaptions, setFinalCaptions] = useState<CaptionPayload[]>([]);
  const [interimCaptions, setInterimCaptions] = useState<Record<string, CaptionPayload>>({});

  const applyCaption = useCallback((caption: CaptionPayload) => {
    if (caption.isFinal) {
      setFinalCaptions((current) => [...current, caption].slice(-300));
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
    [applyCaption, participantIdentity, participantName, room],
  );

  const soniox = useSonioxCaptions({
    enabled: enabled && microphoneEnabled,
    stream,
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
    interimCaptions: interimList,
    sonioxStatus: soniox.status,
    sonioxError: soniox.error,
  };
}
