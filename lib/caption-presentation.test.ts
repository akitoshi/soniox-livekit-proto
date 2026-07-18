import { describe, expect, it } from "vitest";

import type { CaptionPayload } from "@/hooks/use-caption-channel";
import { getCaptionPresentation } from "@/lib/caption-presentation";

const caption: CaptionPayload = {
  participantIdentity: "patient-1",
  participantName: "患者",
  role: "patient",
  text: "Guten Tag",
  translation: "こんにちは",
  isFinal: true,
  lang: "de",
  translationLang: "ja",
  timestamp: 1_700_000_000_000,
};

describe("getCaptionPresentation", () => {
  it("shows a remote participant's translation as the main text", () => {
    expect(getCaptionPresentation(caption, false)).toEqual({
      mainText: "こんにちは",
      mainLanguage: "ja",
      secondaryText: "Guten Tag",
      secondaryLanguage: "de",
      secondaryLabel: "原文",
    });
  });

  it("falls back to original text when a remote translation is absent", () => {
    expect(
      getCaptionPresentation(
        { ...caption, translation: null, translationLang: null },
        false,
      ),
    ).toEqual({
      mainText: "Guten Tag",
      mainLanguage: "de",
      secondaryText: null,
      secondaryLanguage: null,
      secondaryLabel: "翻訳",
    });
  });

  it("shows a local participant's original as the main text", () => {
    expect(getCaptionPresentation(caption, true)).toEqual({
      mainText: "Guten Tag",
      mainLanguage: "de",
      secondaryText: "こんにちは",
      secondaryLanguage: "ja",
      secondaryLabel: "翻訳",
    });
  });
});
