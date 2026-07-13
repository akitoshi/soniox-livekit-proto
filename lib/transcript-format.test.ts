import { describe, expect, it } from "vitest";

import {
  formatTranscript,
  formatTranscriptEntry,
  type TranscriptEntry,
} from "@/lib/transcript-format";

const patientGerman: TranscriptEntry = {
  role: "patient",
  text: "Guten Tag",
  translation: "こんにちは",
  lang: "de",
  translationLang: "ja",
};

const doctorJapanese: TranscriptEntry = {
  role: "doctor",
  text: "診察を始めます",
  translation: "Wir beginnen mit der Untersuchung.",
  lang: "ja",
  translationLang: "de",
};

describe("formatTranscriptEntry", () => {
  it("makes the translated patient speech primary for a Japanese viewer", () => {
    expect(formatTranscriptEntry(patientGerman, "ja")).toBe(
      "[患者 de→ja] こんにちは (原文: Guten Tag)",
    );
  });

  it("makes the original doctor speech primary for a Japanese viewer", () => {
    expect(formatTranscriptEntry(doctorJapanese, "ja")).toBe(
      "[医師 ja] 診察を始めます",
    );
  });

  it("reverses the hierarchy for a German viewer", () => {
    expect(formatTranscriptEntry(doctorJapanese, "de")).toBe(
      "[医師 ja→de] Wir beginnen mit der Untersuchung. (原文: 診察を始めます)",
    );
    expect(formatTranscriptEntry(patientGerman, "de")).toBe(
      "[患者 de] Guten Tag",
    );
  });

  it("keeps original-only captions valid when no translation is produced", () => {
    expect(
      formatTranscriptEntry(
        {
          role: "patient",
          text: "同じ言語です",
          translation: null,
          lang: "ja",
          translationLang: null,
        },
        "ja",
      ),
    ).toBe("[患者 ja] 同じ言語です");
  });

  it("falls back to the available translated text and omits empty entries", () => {
    expect(
      formatTranscriptEntry(
        {
          role: "patient",
          text: "",
          translation: "こんにちは",
          lang: "de",
          translationLang: "ja",
        },
        "ja",
      ),
    ).toBe("[患者 de→ja] こんにちは");
    expect(
      formatTranscriptEntry(
        {
          role: "doctor",
          text: "  ",
          translation: null,
          lang: null,
          translationLang: null,
        },
        "ja",
      ),
    ).toBeNull();
  });
});

describe("formatTranscript", () => {
  it("joins every non-empty finalized entry as plain-text lines", () => {
    expect(formatTranscript([doctorJapanese, patientGerman], "ja")).toBe(
      [
        "[医師 ja] 診察を始めます",
        "[患者 de→ja] こんにちは (原文: Guten Tag)",
      ].join("\n"),
    );
  });
});
