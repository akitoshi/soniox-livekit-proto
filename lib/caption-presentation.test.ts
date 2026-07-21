import { describe, expect, it } from "vitest";

import type { CaptionPayload } from "@/hooks/use-caption-channel";
import {
  CAPTION_SIZES,
  getCaptionPresentation,
  getCaptionOverlayItems,
  getCaptionRoleClass,
  getCaptionSizeClass,
  getCaptionStateClass,
} from "@/lib/caption-presentation";

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

  it("adds one ellipsis to an interim main line", () => {
    expect(getCaptionPresentation({ ...caption, isFinal: false }, false).mainText).toBe(
      "こんにちは…",
    );
    expect(
      getCaptionPresentation(
        { ...caption, isFinal: false, translation: "こんにちは…" },
        false,
      ).mainText,
    ).toBe("こんにちは…");
  });
});

describe("caption presentation classes", () => {
  it("maps every supported size to a shared utility class", () => {
    expect(CAPTION_SIZES).toEqual(["S", "M", "L"]);
    expect(CAPTION_SIZES.map(getCaptionSizeClass)).toEqual([
      "caption-size-s",
      "caption-size-m",
      "caption-size-l",
    ]);
  });

  it("maps doctor and patient roles to distinct low-saturation accents", () => {
    expect(getCaptionRoleClass("doctor")).toBe("caption-role-doctor");
    expect(getCaptionRoleClass("patient")).toBe("caption-role-patient");
  });

  it("maps interim and final captions to explicit state classes", () => {
    expect(getCaptionStateClass(false)).toBe("caption-interim");
    expect(getCaptionStateClass(true)).toBe("caption-final");
  });
});

describe("getCaptionOverlayItems", () => {
  it("keeps only the latest two visible utterances in timestamp order", () => {
    const now = caption.timestamp + 10_000;
    const items = getCaptionOverlayItems(
      [
        { ...caption, participantIdentity: "expired", timestamp: now - 12_000 },
        { ...caption, participantIdentity: "first", timestamp: now - 3_000 },
        { ...caption, participantIdentity: "second", timestamp: now - 2_000 },
      ],
      [
        {
          ...caption,
          participantIdentity: "latest",
          timestamp: now - 1_000,
          isFinal: false,
        },
      ],
      now,
    );

    expect(items.map((item) => item.participantIdentity)).toEqual([
      "second",
      "latest",
    ]);
  });
});
