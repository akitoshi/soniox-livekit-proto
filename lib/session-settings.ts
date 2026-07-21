import {
  isSonioxLanguageCode,
  type SonioxLanguageCode,
} from "@/lib/languages";

export const SESSION_SETTINGS_ATTRIBUTE_KEY = "consult.settings";
export const MAX_EXTRA_TERMS = 50;
export const MAX_EXTRA_TERM_LENGTH = 64;
export const MAX_SESSION_SETTINGS_JSON_LENGTH = 8_192;

const FORBIDDEN_TERM_CHARACTERS =
  /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u;

export type SessionSettings = {
  patientLanguage: SonioxLanguageCode;
  extraTerms: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeTerm(term: string): boolean {
  return (
    term.length > 0 &&
    Array.from(term).length <= MAX_EXTRA_TERM_LENGTH &&
    !FORBIDDEN_TERM_CHARACTERS.test(term)
  );
}

export function sanitizeExtraTerms(terms: readonly string[]): string[] {
  const sanitized: string[] = [];
  const seen = new Set<string>();

  for (const value of terms) {
    const term = value.trim();
    if (!isSafeTerm(term) || seen.has(term)) continue;

    seen.add(term);
    sanitized.push(term);
    if (sanitized.length === MAX_EXTRA_TERMS) break;
  }

  return sanitized;
}

export function serializeSessionSettings(settings: SessionSettings): string {
  return JSON.stringify({
    patientLanguage: settings.patientLanguage,
    extraTerms: sanitizeExtraTerms(settings.extraTerms),
  });
}

export function parseSessionSettingsAttributes(
  attributes: Readonly<Record<string, string>>,
  currentSettings: SessionSettings,
): SessionSettings {
  const serialized = attributes[SESSION_SETTINGS_ATTRIBUTE_KEY];
  if (!serialized || serialized.length > MAX_SESSION_SETTINGS_JSON_LENGTH) {
    return currentSettings;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    return currentSettings;
  }

  if (!isRecord(parsed)) return currentSettings;

  const patientLanguage =
    typeof parsed.patientLanguage === "string" &&
    isSonioxLanguageCode(parsed.patientLanguage)
      ? parsed.patientLanguage
      : currentSettings.patientLanguage;

  const extraTerms =
    Array.isArray(parsed.extraTerms) &&
    parsed.extraTerms.every((term) => typeof term === "string")
      ? sanitizeExtraTerms(parsed.extraTerms)
      : currentSettings.extraTerms;

  if (
    patientLanguage === currentSettings.patientLanguage &&
    extraTerms.length === currentSettings.extraTerms.length &&
    extraTerms.every((term, index) => term === currentSettings.extraTerms[index])
  ) {
    return currentSettings;
  }

  return { patientLanguage, extraTerms };
}
