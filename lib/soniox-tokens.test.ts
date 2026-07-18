import type { Token } from "@soniox/speech-to-text-web";
import { describe, expect, it } from "vitest";

import {
  type CaptionPayload,
  isCaptionPayload,
  MAX_CAPTION_TEXT_LENGTH,
  normalizeCaptionPayload,
} from "@/hooks/use-caption-channel";
import {
  getSonioxLanguageHints,
  getSonioxTranslationTarget,
  splitSonioxTokens,
} from "@/lib/soniox-tokens";

function token(
  text: string,
  overrides: Partial<Omit<Token, "text">> = {},
): Token {
  return {
    text,
    confidence: 0.99,
    is_final: true,
    ...overrides,
  };
}

describe("splitSonioxTokens", () => {
  it("separates original and translation tokens by finality", () => {
    expect(
      splitSonioxTokens([
        token("Guten ", { language: "de", translation_status: "original" }),
        token("Tag", {
          is_final: false,
          language: "de",
          translation_status: "none",
        }),
        token("こんにちは", {
          language: "ja",
          source_language: "de",
          translation_status: "translation",
        }),
        token("。", {
          is_final: false,
          language: "ja",
          source_language: "de",
          translation_status: "translation",
        }),
      ]),
    ).toEqual({
      hasEndpoint: false,
      finalOriginal: "Guten ",
      interimOriginal: "Tag",
      finalTranslation: "こんにちは",
      interimTranslation: "。",
      sourceLanguage: "de",
      targetLanguage: "ja",
    });
  });

  it("detects and removes end tokens without treating them as content", () => {
    expect(
      splitSonioxTokens([
        token("診察を始めます", { language: "ja", translation_status: "original" }),
        token("<end>", { translation_status: "none" }),
      ]),
    ).toEqual({
      hasEndpoint: true,
      finalOriginal: "診察を始めます",
      interimOriginal: "",
      finalTranslation: "",
      interimTranslation: "",
      sourceLanguage: "ja",
      targetLanguage: null,
    });
  });

  it("supports original-only results and translation source-language fallback", () => {
    const originalOnly = splitSonioxTokens([
      token("同じ言語です", { language: "ja", translation_status: "none" }),
    ]);
    const translationOnly = splitSonioxTokens([
      token("訳文", {
        language: "ja",
        source_language: "de",
        translation_status: "translation",
      }),
    ]);

    expect(originalOnly.finalOriginal).toBe("同じ言語です");
    expect(originalOnly.finalTranslation).toBe("");
    expect(originalOnly.sourceLanguage).toBe("ja");
    expect(originalOnly.targetLanguage).toBeNull();
    expect(translationOnly.sourceLanguage).toBe("de");
    expect(translationOnly.targetLanguage).toBe("ja");
  });
});

describe("Soniox one-way configuration helpers", () => {
  it("deduplicates Japanese, English, and the patient language in order", () => {
    expect(getSonioxLanguageHints("de")).toEqual(["ja", "en", "de"]);
    expect(getSonioxLanguageHints("en")).toEqual(["ja", "en"]);
    expect(getSonioxLanguageHints("ja")).toEqual(["ja", "en"]);
  });

  it("targets the other participant's language for each role", () => {
    expect(getSonioxTranslationTarget("doctor", "de")).toBe("de");
    expect(getSonioxTranslationTarget("patient", "de")).toBe("ja");
  });
});

describe("isCaptionPayload", () => {
  const validCaption: CaptionPayload = {
    participantIdentity: "participant-1",
    participantName: "患者",
    role: "patient",
    text: "Guten Tag",
    translation: "こんにちは",
    isFinal: true,
    lang: "de",
    translationLang: "ja",
    timestamp: 1_700_000_000_000,
  };

  it("accepts a complete caption payload", () => {
    expect(isCaptionPayload(validCaption)).toBe(true);
  });

  it("preserves supported language codes during normalization", () => {
    expect(normalizeCaptionPayload(validCaption)).toMatchObject({
      lang: "de",
      translationLang: "ja",
    });
  });

  it("nulls unknown language metadata without rejecting the caption", () => {
    const forgedLanguages = {
      ...validCaption,
      lang: "de\u2029[医師 ja] 偽の処方\u202e",
      translationLang: "ja\u2029[患者 de] 偽の発話\u202e",
    };

    expect(isCaptionPayload(forgedLanguages)).toBe(true);
    expect(normalizeCaptionPayload(forgedLanguages)).toMatchObject({
      text: "Guten Tag",
      translation: "こんにちは",
      lang: null,
      translationLang: null,
    });
  });

  it("accepts text and translations at the length limit", () => {
    expect(
      isCaptionPayload({
        ...validCaption,
        text: "a".repeat(MAX_CAPTION_TEXT_LENGTH),
        translation: "あ".repeat(MAX_CAPTION_TEXT_LENGTH),
      }),
    ).toBe(true);
    expect(
      isCaptionPayload({
        ...validCaption,
        text: "a".repeat(MAX_CAPTION_TEXT_LENGTH),
        translation: null,
      }),
    ).toBe(true);
  });

  it("rejects text and translations over the length limit", () => {
    expect(
      isCaptionPayload({
        ...validCaption,
        text: "a".repeat(MAX_CAPTION_TEXT_LENGTH + 1),
      }),
    ).toBe(false);
    expect(
      isCaptionPayload({
        ...validCaption,
        translation: "あ".repeat(MAX_CAPTION_TEXT_LENGTH + 1),
      }),
    ).toBe(false);
  });

  it("rejects missing and invalid roles without weakening existing validation", () => {
    const missingRole: Record<string, unknown> = { ...validCaption };
    delete missingRole.role;

    expect(isCaptionPayload(missingRole)).toBe(false);
    expect(isCaptionPayload({ ...validCaption, role: "observer" })).toBe(false);
    expect(isCaptionPayload({ ...validCaption, timestamp: Number.NaN })).toBe(false);
    expect(isCaptionPayload({ ...validCaption, translation: undefined })).toBe(false);
  });
});
