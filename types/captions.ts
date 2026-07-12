export const CAPTION_TOPIC = "captions";

export type CaptionPayload = {
  participantIdentity: string;
  participantName: string;
  text: string;
  translation: string | null;
  isFinal: boolean;
  lang: string | null;
  translationLang: string | null;
  timestamp: number;
};

export function isCaptionPayload(value: unknown): value is CaptionPayload {
  if (!value || typeof value !== "object") return false;

  const caption = value as Record<string, unknown>;
  return (
    typeof caption.participantIdentity === "string" &&
    typeof caption.participantName === "string" &&
    typeof caption.text === "string" &&
    (typeof caption.translation === "string" || caption.translation === null) &&
    typeof caption.isFinal === "boolean" &&
    (typeof caption.lang === "string" || caption.lang === null) &&
    (typeof caption.translationLang === "string" || caption.translationLang === null) &&
    typeof caption.timestamp === "number" &&
    Number.isFinite(caption.timestamp)
  );
}
