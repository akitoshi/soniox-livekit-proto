"use client";

import { useEffect, useRef, useState } from "react";
import type {
  SonioxClient as SonioxClientInstance,
  SpeechToTextAPIResponse,
} from "@soniox/speech-to-text-web";

import type { SonioxLanguageCode } from "@/lib/languages";
import {
  getSonioxLanguageHints,
  getSonioxTranslationTarget,
  splitSonioxTokens,
  type ParticipantRole,
} from "@/lib/soniox-tokens";

export type SonioxCaptionChunk = {
  text: string;
  translation: string | null;
  isFinal: boolean;
  lang: string | null;
  translationLang: string | null;
  timestamp: number;
};

type UseSonioxCaptionsOptions = {
  enabled: boolean;
  stream?: MediaStream;
  role: ParticipantRole;
  patientLanguage: SonioxLanguageCode;
  onCaption: (caption: SonioxCaptionChunk) => void;
};

type SonioxStatus = "idle" | "starting" | "listening" | "error";

type TemporaryKeyResponse = {
  apiKey?: string;
  message?: string;
};

const FINALIZE_FALLBACK_MS = 2_500;

export function useSonioxCaptions({
  enabled,
  stream,
  role,
  patientLanguage,
  onCaption,
}: UseSonioxCaptionsOptions) {
  const [status, setStatus] = useState<SonioxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const onCaptionRef = useRef(onCaption);

  useEffect(() => {
    onCaptionRef.current = onCaption;
  }, [onCaption]);

  useEffect(() => {
    if (!enabled || !stream) {
      return;
    }

    let active = true;
    let client: SonioxClientInstance | null = null;
    let committedOriginal = "";
    let committedTranslation = "";
    let sourceLanguage: string | null = null;
    let targetLanguage: string | null = null;
    let finalizeTimer: ReturnType<typeof setTimeout> | null = null;

    const clearFinalizeTimer = () => {
      if (finalizeTimer) {
        clearTimeout(finalizeTimer);
        finalizeTimer = null;
      }
    };

    const emitFinal = () => {
      clearFinalizeTimer();
      const text = committedOriginal.trim();
      const translation = committedTranslation.trim();
      if (!text) return;

      onCaptionRef.current({
        text,
        translation: translation || null,
        isFinal: true,
        lang: sourceLanguage,
        translationLang: targetLanguage,
        timestamp: Date.now(),
      });
      committedOriginal = "";
      committedTranslation = "";
      onCaptionRef.current({
        text: "",
        translation: null,
        isFinal: false,
        lang: sourceLanguage,
        translationLang: targetLanguage,
        timestamp: Date.now(),
      });
    };

    const scheduleFinal = () => {
      clearFinalizeTimer();
      finalizeTimer = setTimeout(emitFinal, FINALIZE_FALLBACK_MS);
    };

    const handleResult = (result: SpeechToTextAPIResponse) => {
      if (!active || !result.tokens?.length) return;

      const tokenBatch = splitSonioxTokens(result.tokens);

      committedOriginal += tokenBatch.finalOriginal;
      committedTranslation += tokenBatch.finalTranslation;
      sourceLanguage = tokenBatch.sourceLanguage ?? sourceLanguage;
      targetLanguage = tokenBatch.targetLanguage ?? targetLanguage;

      const originalPreview = `${committedOriginal}${tokenBatch.interimOriginal}`.trim();
      const translationPreview =
        `${committedTranslation}${tokenBatch.interimTranslation}`.trim();

      if (originalPreview || translationPreview) {
        onCaptionRef.current({
          text: originalPreview,
          translation: translationPreview || null,
          isFinal: false,
          lang: sourceLanguage,
          translationLang: targetLanguage,
          timestamp: Date.now(),
        });
      }

      if (tokenBatch.hasEndpoint) {
        emitFinal();
      } else {
        scheduleFinal();
      }
    };

    void import("@soniox/speech-to-text-web")
      .then(async ({ SonioxClient }) => {
        if (!active) return;
        if (!SonioxClient.isSupported) {
          setIsUnsupported(true);
          return;
        }

        client = new SonioxClient({
          apiKey: async () => {
            const response = await fetch("/api/soniox-token", { method: "POST" });
            const data = (await response.json()) as TemporaryKeyResponse;
            if (!response.ok || !data.apiKey) {
              throw new Error(data.message ?? "Sonioxの一時キーを取得できませんでした。");
            }
            return data.apiKey;
          },
          keepAlive: true,
          keepAliveInterval: 15_000,
        });

        await client.start({
          model: "stt-rt-v5",
          stream,
          languageHints: getSonioxLanguageHints(patientLanguage),
          enableLanguageIdentification: true,
          enableEndpointDetection: true,
          context: {
            general: [
              { key: "domain", value: "Healthcare" },
              { key: "topic", value: "Online medical consultation" },
            ],
            terms: ["オンライン診療", "既往歴", "処方薬", "アレルギー", "バイタルサイン"],
          },
          translation: {
            type: "one_way",
            target_language: getSonioxTranslationTarget(role, patientLanguage),
          },
          onStarted: () => {
            if (active) {
              setError(null);
              setStatus("listening");
            }
          },
          onPartialResult: handleResult,
          onFinished: () => {
            if (!active) return;
            emitFinal();
            setStatus("idle");
          },
          onError: (_errorStatus, message) => {
            if (!active) return;
            setStatus("error");
            setError(message || "リアルタイム字幕でエラーが発生しました。");
          },
        });
      })
      .catch((caughtError: unknown) => {
        if (!active) return;
        setStatus("error");
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "リアルタイム字幕を開始できませんでした。",
        );
      });

    return () => {
      active = false;
      clearFinalizeTimer();
      client?.cancel();
    };
  }, [enabled, patientLanguage, role, stream]);

  const unsupported = enabled && Boolean(stream) && isUnsupported;
  const effectiveStatus: SonioxStatus = unsupported
    ? "error"
    : !enabled || !stream
      ? "idle"
      : status === "idle"
        ? "starting"
        : status;

  return {
    status: effectiveStatus,
    error: unsupported
      ? "このブラウザはSonioxのリアルタイム字幕に対応していません。"
      : error,
  };
}
