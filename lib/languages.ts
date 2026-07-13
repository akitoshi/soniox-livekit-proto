export type SonioxLanguage = {
  readonly code: string;
  readonly englishName: string;
  readonly nativeName: string;
  readonly jaName: string;
};

export const SONIOX_LANGUAGES = [
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
] as const satisfies readonly SonioxLanguage[];

export type SonioxLanguageCode = (typeof SONIOX_LANGUAGES)[number]["code"];

const LANGUAGE_BY_CODE = new Map<string, SonioxLanguage>(
  SONIOX_LANGUAGES.map((language) => [language.code, language]),
);

export function isSonioxLanguageCode(code: string): code is SonioxLanguageCode {
  return LANGUAGE_BY_CODE.has(code);
}

export function getLanguage(code: string): SonioxLanguage | undefined {
  return LANGUAGE_BY_CODE.get(code);
}
