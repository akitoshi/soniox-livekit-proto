import { describe, expect, it } from "vitest";

import {
  MAX_EXTRA_TERMS,
  MAX_SESSION_SETTINGS_JSON_LENGTH,
  SESSION_SETTINGS_ATTRIBUTE_KEY,
  parseSessionSettingsAttributes,
  serializeSessionSettings,
  type SessionSettings,
} from "@/lib/session-settings";

const currentSettings: SessionSettings = {
  patientLanguage: "en",
  extraTerms: ["既存語"],
};

function attributes(value: unknown): Record<string, string> {
  return { [SESSION_SETTINGS_ATTRIBUTE_KEY]: JSON.stringify(value) };
}

describe("session settings attributes", () => {
  it("parses a valid language and sanitized extra terms", () => {
    expect(
      parseSessionSettingsAttributes(
        attributes({
          patientLanguage: "de",
          extraTerms: [" ブスコパン ", "問診", "ブスコパン"],
        }),
        currentSettings,
      ),
    ).toEqual({
      patientLanguage: "de",
      extraTerms: ["ブスコパン", "問診"],
    });
  });

  it("keeps the current language when the received code is unknown", () => {
    expect(
      parseSessionSettingsAttributes(
        attributes({ patientLanguage: "zh-CN", extraTerms: ["採血"] }),
        currentSettings,
      ),
    ).toEqual({ patientLanguage: "en", extraTerms: ["採血"] });
  });

  it("keeps each current field whose received type is invalid", () => {
    expect(
      parseSessionSettingsAttributes(
        attributes({ patientLanguage: 42, extraTerms: ["採血", 42] }),
        currentSettings,
      ),
    ).toBe(currentSettings);
    expect(
      parseSessionSettingsAttributes(
        attributes({ patientLanguage: "fr", extraTerms: "採血" }),
        currentSettings,
      ),
    ).toEqual({ patientLanguage: "fr", extraTerms: ["既存語"] });
  });

  it("drops terms containing C0, C1, newline, or bidi controls", () => {
    expect(
      parseSessionSettingsAttributes(
        attributes({
          patientLanguage: "en",
          extraTerms: [
            "安全な語",
            "改行\n注入",
            "C1\u0085注入",
            "bidi\u202e注入",
            "isolate\u2066注入",
          ],
        }),
        currentSettings,
      ),
    ).toEqual({ patientLanguage: "en", extraTerms: ["安全な語"] });
  });

  it("ignores malformed JSON and an oversized attribute as a whole", () => {
    expect(
      parseSessionSettingsAttributes(
        { [SESSION_SETTINGS_ATTRIBUTE_KEY]: "{not-json" },
        currentSettings,
      ),
    ).toBe(currentSettings);
    expect(
      parseSessionSettingsAttributes(
        { [SESSION_SETTINGS_ATTRIBUTE_KEY]: "x".repeat(MAX_SESSION_SETTINGS_JSON_LENGTH + 1) },
        currentSettings,
      ),
    ).toBe(currentSettings);
  });

  it("limits extra terms to 50 entries and each term to 64 characters", () => {
    const extraTerms = [
      "x".repeat(65),
      ...Array.from({ length: MAX_EXTRA_TERMS + 20 }, (_, index) => `term-${index}`),
    ];
    const parsed = parseSessionSettingsAttributes(
      attributes({ patientLanguage: "ja", extraTerms }),
      currentSettings,
    );

    expect(parsed.extraTerms).toHaveLength(MAX_EXTRA_TERMS);
    expect(parsed.extraTerms).not.toContain("x".repeat(65));
    expect(parsed.extraTerms.at(-1)).toBe("term-49");
  });

  it("serializes only the allowlisted and sanitized schema", () => {
    expect(
      JSON.parse(
        serializeSessionSettings({
          patientLanguage: "ja",
          extraTerms: [" 問診 ", "問診", "bad\nterm"],
        }),
      ),
    ).toEqual({ patientLanguage: "ja", extraTerms: ["問診"] });
  });
});
