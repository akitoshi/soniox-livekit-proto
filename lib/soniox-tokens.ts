import type { Token } from "@soniox/speech-to-text-web";

import type { SonioxLanguageCode } from "@/lib/languages";

export type ParticipantRole = "doctor" | "patient";

export type SonioxTokenBatch = {
  hasEndpoint: boolean;
  finalOriginal: string;
  interimOriginal: string;
  finalTranslation: string;
  interimTranslation: string;
  sourceLanguage: string | null;
  targetLanguage: string | null;
};

const END_TOKEN = "<end>";

function withoutEndToken(text: string) {
  return text.replaceAll(END_TOKEN, "");
}

function tokensToText(tokens: readonly Token[]) {
  return tokens.map((token) => withoutEndToken(token.text)).join("");
}

function lastLanguage(tokens: readonly Token[]) {
  return [...tokens].reverse().find((token) => token.language)?.language ?? null;
}

export function splitSonioxTokens(tokens: readonly Token[]): SonioxTokenBatch {
  const hasEndpoint = tokens.some((token) => token.text.includes(END_TOKEN));
  const contentTokens = tokens.filter((token) => withoutEndToken(token.text).trim());
  const originalTokens = contentTokens.filter(
    (token) => token.translation_status !== "translation",
  );
  const translationTokens = contentTokens.filter(
    (token) => token.translation_status === "translation",
  );

  return {
    hasEndpoint,
    finalOriginal: tokensToText(originalTokens.filter((token) => token.is_final)),
    interimOriginal: tokensToText(originalTokens.filter((token) => !token.is_final)),
    finalTranslation: tokensToText(translationTokens.filter((token) => token.is_final)),
    interimTranslation: tokensToText(
      translationTokens.filter((token) => !token.is_final),
    ),
    sourceLanguage:
      lastLanguage(originalTokens) ??
      [...translationTokens].reverse().find((token) => token.source_language)
        ?.source_language ??
      null,
    targetLanguage: lastLanguage(translationTokens),
  };
}

export function getSonioxLanguageHints(patientLanguage: SonioxLanguageCode) {
  return [...new Set<SonioxLanguageCode>(["ja", "en", patientLanguage])];
}

export function getSonioxTranslationTarget(
  role: ParticipantRole,
  patientLanguage: SonioxLanguageCode,
) {
  return role === "doctor" ? patientLanguage : "ja";
}
