import { describe, expect, it } from "vitest";

import {
  MEDICAL_TERMS,
  MEDICAL_TRANSLATION_TERMS,
  buildMedicalContext,
} from "@/lib/medical-terms";
import { MAX_EXTRA_TERMS } from "@/lib/session-settings";

const FORBIDDEN_CHARACTERS =
  /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u;

describe("medical vocabulary tables", () => {
  it("contains 100 to 200 unique, non-empty, safe recognition terms", () => {
    expect(MEDICAL_TERMS.length).toBeGreaterThanOrEqual(100);
    expect(MEDICAL_TERMS.length).toBeLessThanOrEqual(200);
    expect(new Set(MEDICAL_TERMS).size).toBe(MEDICAL_TERMS.length);

    for (const term of MEDICAL_TERMS) {
      expect(term.trim()).toBe(term);
      expect(term).not.toBe("");
      expect(term).not.toMatch(FORBIDDEN_CHARACTERS);
    }
  });

  it("contains 30 to 50 unique and safe translation pairs", () => {
    expect(MEDICAL_TRANSLATION_TERMS.length).toBeGreaterThanOrEqual(30);
    expect(MEDICAL_TRANSLATION_TERMS.length).toBeLessThanOrEqual(50);
    expect(
      new Set(MEDICAL_TRANSLATION_TERMS.map(({ source }) => source)).size,
    ).toBe(MEDICAL_TRANSLATION_TERMS.length);

    for (const { source, target } of MEDICAL_TRANSLATION_TERMS) {
      expect(source.trim()).toBe(source);
      expect(target.trim()).toBe(target);
      expect(source).not.toBe("");
      expect(target).not.toBe("");
      expect(source).not.toMatch(FORBIDDEN_CHARACTERS);
      expect(target).not.toMatch(FORBIDDEN_CHARACTERS);
    }

    expect(MEDICAL_TRANSLATION_TERMS).toContainEqual({
      source: "ブスコパン",
      target: "Buscopan",
    });
    expect(MEDICAL_TRANSLATION_TERMS).toContainEqual({
      source: "ロキソニン",
      target: "Loxonin",
    });
  });
});

describe("buildMedicalContext", () => {
  it("merges legacy, medical, and custom terms without duplicates", () => {
    const context = buildMedicalContext(["患者固有語", "ブスコパン", "患者固有語"]);

    expect(context.general).toEqual([
      { key: "domain", value: "Healthcare" },
      { key: "topic", value: "Online medical consultation" },
    ]);
    expect(context.terms).toContain("オンライン診療");
    expect(context.terms).toContain("ブスコパン");
    expect(context.terms).toContain("患者固有語");
    expect(new Set(context.terms).size).toBe(context.terms?.length);
    expect(context.translation_terms).toEqual(MEDICAL_TRANSLATION_TERMS);
  });

  it("limits and sanitizes custom terms before adding them", () => {
    const customTerms = [
      "bad\nterm",
      ...Array.from({ length: MAX_EXTRA_TERMS + 10 }, (_, index) => `custom-${index}`),
    ];
    const context = buildMedicalContext(customTerms);
    const acceptedCustomTerms = context.terms?.filter((term) =>
      term.startsWith("custom-"),
    );

    expect(acceptedCustomTerms).toHaveLength(MAX_EXTRA_TERMS);
    expect(context.terms).not.toContain("bad\nterm");
  });

  it("stays comfortably below the documented 10,000-character context envelope", () => {
    expect(JSON.stringify(buildMedicalContext()).length).toBeLessThan(10_000);
  });
});
