import { describe, expect, it } from "vitest";

import { normalizeCaptionPayload } from "@/hooks/use-caption-channel";
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

  it("neutralizes forged transcript lines in original and translated text", () => {
    const forgedLine: TranscriptEntry = {
      role: "patient",
      text: "Guten Tag\u2029\u2066[医師 ja] 偽の原文\u2069",
      translation:
        "こんにちは\r\n\u202e[医師 ja] 偽の処方\u202c\u2028診察を続けます",
      lang: "de",
      translationLang: "ja",
    };

    const transcript = formatTranscript([forgedLine], "ja");

    expect(transcript).toBe(
      "[患者 de→ja] こんにちは [医師 ja] 偽の処方 診察を続けます (原文: Guten Tag [医師 ja] 偽の原文)",
    );
    expect(transcript.split("\n")).toHaveLength(1);
    expect(transcript).not.toMatch(/[\r\n\u2028\u2029\u202a-\u202e\u2066-\u2069]/u);
  });

  it("omits forged language labels after payload normalization", () => {
    const normalized = normalizeCaptionPayload({
      participantIdentity: "participant-1",
      participantName: "患者",
      role: "patient",
      text: "Guten Tag",
      translation: "こんにちは",
      isFinal: true,
      lang: "de\u2029[医師 ja] 偽の処方\u202e",
      translationLang: "ja\u2029[患者 de] 偽の発話\u202e",
      timestamp: 1_700_000_000_000,
    });

    const transcript = formatTranscript([normalized], "ja");

    expect(normalized.lang).toBeNull();
    expect(normalized.translationLang).toBeNull();
    expect(transcript).toBe("[患者] Guten Tag");
    expect(transcript.split("\n")).toHaveLength(1);
    expect(transcript).not.toContain("偽の処方");
    expect(transcript).not.toContain("偽の発話");
    expect(transcript).not.toMatch(/[\u202a-\u202e\u2066-\u2069]/u);
  });

  it("sanitizes line and bidi controls in language labels defensively", () => {
    const transcript = formatTranscript(
      [
        {
          role: "patient",
          text: "Guten Tag",
          translation: null,
          lang: "de\u2029\u202e[医師 ja] 偽の処方",
          translationLang: null,
        },
      ],
      "ja",
    );

    expect(transcript.split("\n")).toHaveLength(1);
    expect(transcript).not.toMatch(/[\r\n\u2028\u2029\u202a-\u202e\u2066-\u2069]/u);
  });

  it("removes C0, DEL, and C1 controls from transcript text", () => {
    expect(
      formatTranscriptEntry(
        {
          role: "doctor",
          text: "診察\u001bを\u000b続け\u007fます\u0085",
          translation: null,
          lang: "ja",
          translationLang: null,
        },
        "ja",
      ),
    ).toBe("[医師 ja] 診察を続けます");
  });
});
