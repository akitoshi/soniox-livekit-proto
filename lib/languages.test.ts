import { describe, expect, it } from "vitest";

import {
  SONIOX_LANGUAGES,
  getLanguage,
  isSonioxLanguageCode,
} from "@/lib/languages";

const EXPECTED_LANGUAGES = [
  { code: "ja", englishName: "Japanese", nativeName: "日本語", jaName: "日本語" },
  { code: "en", englishName: "English", nativeName: "English", jaName: "英語" },
  { code: "af", englishName: "Afrikaans", nativeName: "Afrikaans", jaName: "アフリカーンス語" },
  { code: "sq", englishName: "Albanian", nativeName: "Shqip", jaName: "アルバニア語" },
  { code: "ar", englishName: "Arabic", nativeName: "العربية", jaName: "アラビア語" },
  { code: "az", englishName: "Azerbaijani", nativeName: "Azərbaycanca", jaName: "アゼルバイジャン語" },
  { code: "eu", englishName: "Basque", nativeName: "Euskara", jaName: "バスク語" },
  { code: "be", englishName: "Belarusian", nativeName: "Беларуская", jaName: "ベラルーシ語" },
  { code: "bn", englishName: "Bengali", nativeName: "বাংলা", jaName: "ベンガル語" },
  { code: "bs", englishName: "Bosnian", nativeName: "Bosanski", jaName: "ボスニア語" },
  { code: "bg", englishName: "Bulgarian", nativeName: "Български", jaName: "ブルガリア語" },
  { code: "ca", englishName: "Catalan", nativeName: "Català", jaName: "カタルーニャ語" },
  { code: "zh", englishName: "Chinese", nativeName: "中文", jaName: "中国語" },
  { code: "hr", englishName: "Croatian", nativeName: "Hrvatski", jaName: "クロアチア語" },
  { code: "cs", englishName: "Czech", nativeName: "Čeština", jaName: "チェコ語" },
  { code: "da", englishName: "Danish", nativeName: "Dansk", jaName: "デンマーク語" },
  { code: "nl", englishName: "Dutch", nativeName: "Nederlands", jaName: "オランダ語" },
  { code: "et", englishName: "Estonian", nativeName: "Eesti", jaName: "エストニア語" },
  { code: "fi", englishName: "Finnish", nativeName: "Suomi", jaName: "フィンランド語" },
  { code: "fr", englishName: "French", nativeName: "Français", jaName: "フランス語" },
  { code: "gl", englishName: "Galician", nativeName: "Galego", jaName: "ガリシア語" },
  { code: "de", englishName: "German", nativeName: "Deutsch", jaName: "ドイツ語" },
  { code: "el", englishName: "Greek", nativeName: "Ελληνικά", jaName: "ギリシャ語" },
  { code: "gu", englishName: "Gujarati", nativeName: "ગુજરાતી", jaName: "グジャラート語" },
  { code: "he", englishName: "Hebrew", nativeName: "עברית", jaName: "ヘブライ語" },
  { code: "hi", englishName: "Hindi", nativeName: "हिन्दी", jaName: "ヒンディー語" },
  { code: "hu", englishName: "Hungarian", nativeName: "Magyar", jaName: "ハンガリー語" },
  { code: "id", englishName: "Indonesian", nativeName: "Bahasa Indonesia", jaName: "インドネシア語" },
  { code: "it", englishName: "Italian", nativeName: "Italiano", jaName: "イタリア語" },
  { code: "kn", englishName: "Kannada", nativeName: "ಕನ್ನಡ", jaName: "カンナダ語" },
  { code: "kk", englishName: "Kazakh", nativeName: "Қазақ тілі", jaName: "カザフ語" },
  { code: "ko", englishName: "Korean", nativeName: "한국어", jaName: "韓国語" },
  { code: "lv", englishName: "Latvian", nativeName: "Latviešu", jaName: "ラトビア語" },
  { code: "lt", englishName: "Lithuanian", nativeName: "Lietuvių", jaName: "リトアニア語" },
  { code: "mk", englishName: "Macedonian", nativeName: "Македонски", jaName: "マケドニア語" },
  { code: "ms", englishName: "Malay", nativeName: "Bahasa Melayu", jaName: "マレー語" },
  { code: "ml", englishName: "Malayalam", nativeName: "മലയാളം", jaName: "マラヤーラム語" },
  { code: "mr", englishName: "Marathi", nativeName: "मराठी", jaName: "マラーティー語" },
  { code: "no", englishName: "Norwegian", nativeName: "Norsk", jaName: "ノルウェー語" },
  { code: "fa", englishName: "Persian", nativeName: "فارسی", jaName: "ペルシャ語" },
  { code: "pl", englishName: "Polish", nativeName: "Polski", jaName: "ポーランド語" },
  { code: "pt", englishName: "Portuguese", nativeName: "Português", jaName: "ポルトガル語" },
  { code: "pa", englishName: "Punjabi", nativeName: "ਪੰਜਾਬੀ", jaName: "パンジャブ語" },
  { code: "ro", englishName: "Romanian", nativeName: "Română", jaName: "ルーマニア語" },
  { code: "ru", englishName: "Russian", nativeName: "Русский", jaName: "ロシア語" },
  { code: "sr", englishName: "Serbian", nativeName: "Српски", jaName: "セルビア語" },
  { code: "sk", englishName: "Slovak", nativeName: "Slovenčina", jaName: "スロバキア語" },
  { code: "sl", englishName: "Slovenian", nativeName: "Slovenščina", jaName: "スロベニア語" },
  { code: "es", englishName: "Spanish", nativeName: "Español", jaName: "スペイン語" },
  { code: "sw", englishName: "Swahili", nativeName: "Kiswahili", jaName: "スワヒリ語" },
  { code: "sv", englishName: "Swedish", nativeName: "Svenska", jaName: "スウェーデン語" },
  { code: "tl", englishName: "Tagalog", nativeName: "Tagalog", jaName: "タガログ語" },
  { code: "ta", englishName: "Tamil", nativeName: "தமிழ்", jaName: "タミル語" },
  { code: "te", englishName: "Telugu", nativeName: "తెలుగు", jaName: "テルグ語" },
  { code: "th", englishName: "Thai", nativeName: "ไทย", jaName: "タイ語" },
  { code: "tr", englishName: "Turkish", nativeName: "Türkçe", jaName: "トルコ語" },
  { code: "uk", englishName: "Ukrainian", nativeName: "Українська", jaName: "ウクライナ語" },
  { code: "ur", englishName: "Urdu", nativeName: "اردو", jaName: "ウルドゥー語" },
  { code: "vi", englishName: "Vietnamese", nativeName: "Tiếng Việt", jaName: "ベトナム語" },
  { code: "cy", englishName: "Welsh", nativeName: "Cymraeg", jaName: "ウェールズ語" },
] as const;

const EXPECTED_CODE_TO_ENGLISH_NAME = {
  af: "Afrikaans", sq: "Albanian", ar: "Arabic", az: "Azerbaijani", eu: "Basque",
  be: "Belarusian", bn: "Bengali", bs: "Bosnian", bg: "Bulgarian", ca: "Catalan",
  zh: "Chinese", hr: "Croatian", cs: "Czech", da: "Danish", nl: "Dutch", en: "English",
  et: "Estonian", fi: "Finnish", fr: "French", gl: "Galician", de: "German", el: "Greek",
  gu: "Gujarati", he: "Hebrew", hi: "Hindi", hu: "Hungarian", id: "Indonesian",
  it: "Italian", ja: "Japanese", kn: "Kannada", kk: "Kazakh", ko: "Korean", lv: "Latvian",
  lt: "Lithuanian", mk: "Macedonian", ms: "Malay", ml: "Malayalam", mr: "Marathi",
  no: "Norwegian", fa: "Persian", pl: "Polish", pt: "Portuguese", pa: "Punjabi",
  ro: "Romanian", ru: "Russian", sr: "Serbian", sk: "Slovak", sl: "Slovenian",
  es: "Spanish", sw: "Swahili", sv: "Swedish", tl: "Tagalog", ta: "Tamil", te: "Telugu",
  th: "Thai", tr: "Turkish", uk: "Ukrainian", ur: "Urdu", vi: "Vietnamese", cy: "Welsh",
} as const;

describe("SONIOX_LANGUAGES", () => {
  it("contains the complete 60-row supported-language table", () => {
    expect(SONIOX_LANGUAGES).toHaveLength(60);
    expect(SONIOX_LANGUAGES).toEqual(EXPECTED_LANGUAGES);
  });

  it("exactly matches the required ISO code and English-name set", () => {
    const actual = Object.fromEntries(
      SONIOX_LANGUAGES.map(({ code, englishName }) => [code, englishName]),
    );

    expect(actual).toEqual(EXPECTED_CODE_TO_ENGLISH_NAME);
  });

  it("has no duplicate language codes", () => {
    const codes = SONIOX_LANGUAGES.map(({ code }) => code);

    expect(new Set(codes).size).toBe(codes.length);
  });

  it("keeps Japanese and English first, then sorts by English name", () => {
    expect(SONIOX_LANGUAGES.slice(0, 2).map(({ code }) => code)).toEqual(["ja", "en"]);

    const remainingNames = SONIOX_LANGUAGES.slice(2).map(({ englishName }) => englishName);
    expect(remainingNames).toEqual([...remainingNames].sort((left, right) => left.localeCompare(right, "en")));
  });

  it("provides non-empty native and Japanese names for every row", () => {
    for (const language of SONIOX_LANGUAGES) {
      expect(language.nativeName.trim(), `${language.code}.nativeName`).not.toBe("");
      expect(language.jaName.trim(), `${language.code}.jaName`).not.toBe("");
    }
  });
});

describe("language lookup helpers", () => {
  it("recognizes only supported language codes", () => {
    expect(isSonioxLanguageCode("ja")).toBe(true);
    expect(isSonioxLanguageCode("zh")).toBe(true);
    expect(isSonioxLanguageCode("zh-CN")).toBe(false);
    expect(isSonioxLanguageCode("unknown")).toBe(false);
  });

  it("returns the matching language and undefined for unknown codes", () => {
    expect(getLanguage("de")).toEqual({
      code: "de",
      englishName: "German",
      nativeName: "Deutsch",
      jaName: "ドイツ語",
    });
    expect(getLanguage("unknown")).toBeUndefined();
  });
});
