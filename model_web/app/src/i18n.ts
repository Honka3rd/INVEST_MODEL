// shared/i18n/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../../shared/i18n/en.json";
import ja from "../../shared/i18n/jp.json";
import tw from "../../shared/i18n/tw.json";
import { LanguageE } from "../../shared/LanguageE";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      [LanguageE.ENGLISH.code()]: { translation: en },
      [LanguageE.JAPANESE.code()]: { translation: ja },
      [LanguageE.CHINESE_TRADITIONAL.code()]: { translation: tw },
    },
    lng: LanguageE.ENGLISH.code(),
    fallbackLng: LanguageE.ENGLISH.code(),
    interpolation: {
      escapeValue: false, // React already handles XSS safety
    },
  });

export default i18n;