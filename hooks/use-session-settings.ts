"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  RoomEvent,
  type Participant,
  type Room,
} from "livekit-client";

import type { SonioxLanguageCode } from "@/lib/languages";
import type { ParticipantRole } from "@/lib/soniox-tokens";
import {
  SESSION_SETTINGS_ATTRIBUTE_KEY,
  parseSessionSettingsAttributes,
  sanitizeExtraTerms,
  serializeSessionSettings,
  type SessionSettings,
} from "@/lib/session-settings";

type UseSessionSettingsOptions = {
  room: Room;
  role: ParticipantRole;
  initialPatientLanguage: SonioxLanguageCode;
};

function settingsAreEqual(left: SessionSettings, right: SessionSettings): boolean {
  return (
    left.patientLanguage === right.patientLanguage &&
    left.extraTerms.length === right.extraTerms.length &&
    left.extraTerms.every((term, index) => term === right.extraTerms[index])
  );
}

export function useSessionSettings({
  room,
  role,
  initialPatientLanguage,
}: UseSessionSettingsOptions) {
  const [settings, setSettings] = useState<SessionSettings>(() => ({
    patientLanguage: initialPatientLanguage,
    extraTerms: [],
  }));
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [languageAnnouncement, setLanguageAnnouncement] =
    useState<SonioxLanguageCode | null>(null);
  const settingsRef = useRef(settings);

  const commitSettings = useCallback((nextSettings: SessionSettings) => {
    if (settingsAreEqual(settingsRef.current, nextSettings)) return;
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
  }, []);

  const updateSettings = useCallback(
    (nextSettings: SessionSettings) => {
      if (role !== "doctor") return;
      commitSettings({
        patientLanguage: nextSettings.patientLanguage,
        extraTerms: sanitizeExtraTerms(nextSettings.extraTerms),
      });
    },
    [commitSettings, role],
  );

  useEffect(() => {
    if (role !== "doctor") return;

    let active = true;
    const publishSettings = () => {
      void room.localParticipant
        .setAttributes({
          [SESSION_SETTINGS_ATTRIBUTE_KEY]: serializeSessionSettings(settings),
        })
        .then(() => {
          if (active) setSettingsError(null);
        })
        .catch(() => {
          if (active) {
            setSettingsError("通話設定を相手に送信できませんでした。");
          }
        });
    };

    if (room.state === ConnectionState.Connected) {
      publishSettings();
    } else {
      room.on(RoomEvent.Connected, publishSettings);
    }

    return () => {
      active = false;
      room.off(RoomEvent.Connected, publishSettings);
    };
  }, [role, room, settings]);

  useEffect(() => {
    if (role !== "patient") return;

    const applyParticipantSettings = (participant: Participant) => {
      if (
        participant.isLocal ||
        !(SESSION_SETTINGS_ATTRIBUTE_KEY in participant.attributes)
      ) {
        return;
      }

      const currentSettings = settingsRef.current;
      const nextSettings = parseSessionSettingsAttributes(
        participant.attributes,
        currentSettings,
      );
      if (nextSettings === currentSettings) return;

      if (nextSettings.patientLanguage !== currentSettings.patientLanguage) {
        setLanguageAnnouncement(nextSettings.patientLanguage);
      }
      commitSettings(nextSettings);
    };

    for (const participant of room.remoteParticipants.values()) {
      applyParticipantSettings(participant);
    }

    const handleAttributesChanged = (
      changedAttributes: Record<string, string>,
      participant: Participant,
    ) => {
      if (SESSION_SETTINGS_ATTRIBUTE_KEY in changedAttributes) {
        applyParticipantSettings(participant);
      }
    };
    const handleParticipantConnected = (participant: Participant) => {
      applyParticipantSettings(participant);
    };

    room.on(RoomEvent.ParticipantAttributesChanged, handleAttributesChanged);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    return () => {
      room.off(RoomEvent.ParticipantAttributesChanged, handleAttributesChanged);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
    };
  }, [commitSettings, role, room]);

  useEffect(() => {
    if (languageAnnouncement === null) return;

    const timeout = window.setTimeout(() => {
      setLanguageAnnouncement(null);
    }, 5_000);
    return () => window.clearTimeout(timeout);
  }, [languageAnnouncement]);

  return {
    settings,
    updateSettings,
    settingsError,
    languageAnnouncement,
  };
}
