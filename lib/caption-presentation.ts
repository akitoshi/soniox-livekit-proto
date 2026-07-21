import type { CaptionPayload } from "@/hooks/use-caption-channel";

export const CAPTION_SIZES = ["S", "M", "L"] as const;
const CAPTION_VISIBLE_MS = 12_000;
const CAPTION_OVERLAY_LIMIT = 2;

export type CaptionSize = (typeof CAPTION_SIZES)[number];

export function getCaptionSizeClass(size: CaptionSize) {
  switch (size) {
    case "S":
      return "caption-size-s";
    case "M":
      return "caption-size-m";
    case "L":
      return "caption-size-l";
  }
}

export function getCaptionRoleClass(role: CaptionPayload["role"]) {
  return role === "doctor" ? "caption-role-doctor" : "caption-role-patient";
}

export function getCaptionStateClass(isFinal: boolean) {
  return isFinal ? "caption-final" : "caption-interim";
}

export function getCaptionOverlayItems(
  finalCaptions: readonly CaptionPayload[],
  interimCaptions: readonly CaptionPayload[],
  now: number,
) {
  const recentFinalCaptions = finalCaptions.filter(
    (caption) => now - caption.timestamp < CAPTION_VISIBLE_MS,
  );

  return [...recentFinalCaptions, ...interimCaptions]
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(-CAPTION_OVERLAY_LIMIT);
}

function addInterimEllipsis(text: string, isFinal: boolean) {
  const trimmedText = text.trimEnd();
  if (isFinal || !trimmedText || trimmedText.endsWith("…")) return trimmedText;

  return `${trimmedText}…`;
}

export function getCaptionPresentation(
  caption: CaptionPayload,
  isLocal: boolean,
) {
  const showTranslationAsMain = !isLocal && Boolean(caption.translation);
  const mainText = showTranslationAsMain
    ? caption.translation ?? caption.text
    : caption.text || caption.translation || "";
  const secondaryText = showTranslationAsMain
    ? caption.text || null
    : caption.text && caption.translation
      ? caption.translation
      : null;

  return {
    mainText: addInterimEllipsis(mainText, caption.isFinal),
    mainLanguage: showTranslationAsMain ? caption.translationLang : caption.lang,
    secondaryText,
    secondaryLanguage: showTranslationAsMain ? caption.lang : caption.translationLang,
    secondaryLabel: showTranslationAsMain ? "原文" : "翻訳",
  };
}
