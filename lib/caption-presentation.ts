import type { CaptionPayload } from "@/hooks/use-caption-channel";

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
    mainText,
    mainLanguage: showTranslationAsMain ? caption.translationLang : caption.lang,
    secondaryText,
    secondaryLanguage: showTranslationAsMain ? caption.lang : caption.translationLang,
    secondaryLabel: showTranslationAsMain ? "原文" : "翻訳",
  };
}
