import type { SonioxLanguageCode } from "@/lib/languages";
import type { ParticipantRole } from "@/lib/soniox-tokens";

export type TranscriptEntry = {
  role: ParticipantRole;
  text: string;
  translation: string | null;
  lang: string | null;
  translationLang: string | null;
};

const ROLE_LABELS: Record<ParticipantRole, string> = {
  doctor: "医師",
  patient: "患者",
};

export function formatTranscriptEntry(
  entry: TranscriptEntry,
  viewerLanguage: SonioxLanguageCode,
) {
  const original = entry.text.trim();
  const translation = entry.translation?.trim() || null;
  if (!original && !translation) return null;

  const translationIsMain = Boolean(
    translation && entry.translationLang === viewerLanguage,
  );
  const mainText = translationIsMain ? translation : original || translation;
  const secondaryText = translationIsMain ? original || null : null;
  const languages = translationIsMain && entry.lang && entry.translationLang
    ? `${entry.lang}→${entry.translationLang}`
    : original
      ? entry.lang
      : entry.translationLang;
  const prefix = `[${ROLE_LABELS[entry.role]}${languages ? ` ${languages}` : ""}]`;

  return `${prefix} ${mainText}${
    secondaryText ? ` (原文: ${secondaryText})` : ""
  }`;
}

export function formatTranscript(
  entries: readonly TranscriptEntry[],
  viewerLanguage: SonioxLanguageCode,
) {
  return entries
    .map((entry) => formatTranscriptEntry(entry, viewerLanguage))
    .filter((line): line is string => line !== null)
    .join("\n");
}
