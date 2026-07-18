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

const TRANSCRIPT_LINE_BREAK_PATTERN = /[\r\n\u2028\u2029]+/gu;
const TRANSCRIPT_CONTROL_PATTERN = /[\u0000-\u001f\u007f-\u009f]/gu;
const BIDI_CONTROL_PATTERN = /[\u202a-\u202e\u2066-\u2069]/gu;

function sanitizeTranscriptText(text: string) {
  return text
    .replace(TRANSCRIPT_LINE_BREAK_PATTERN, " ")
    .replace(TRANSCRIPT_CONTROL_PATTERN, "")
    .replace(BIDI_CONTROL_PATTERN, "")
    .replace(/ {2,}/g, " ")
    .trim();
}

export function formatTranscriptEntry(
  entry: TranscriptEntry,
  viewerLanguage: SonioxLanguageCode,
) {
  const original = sanitizeTranscriptText(entry.text);
  const translation = entry.translation
    ? sanitizeTranscriptText(entry.translation) || null
    : null;
  if (!original && !translation) return null;

  const translationIsMain = Boolean(
    translation && entry.translationLang === viewerLanguage,
  );
  const mainText = translationIsMain ? translation : original || translation;
  const secondaryText = translationIsMain ? original || null : null;
  const rawLanguages = translationIsMain && entry.lang && entry.translationLang
    ? `${entry.lang}→${entry.translationLang}`
    : original
      ? entry.lang
      : entry.translationLang;
  const languages = rawLanguages
    ? sanitizeTranscriptText(rawLanguages) || null
    : null;
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
