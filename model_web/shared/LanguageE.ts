export class LanguageE {
  private static readonly Langs = Object.freeze({
    ENGLISH: "en",
    JAPANESE: "ja",
    CHINESE_TRADITIONAL: "zh-TW",
    UNKNOWN: "unknown",
  });

  static readonly ENGLISH = new LanguageE(LanguageE.Langs.ENGLISH);

  static readonly JAPANESE = new LanguageE(LanguageE.Langs.JAPANESE);

  static readonly CHINESE_TRADITIONAL = new LanguageE(
    LanguageE.Langs.CHINESE_TRADITIONAL
  );

  static readonly UNKNOWN = new LanguageE(LanguageE.Langs.UNKNOWN);

  private constructor(private readonly _code: string) {}

  static values() {
    return [
      LanguageE.ENGLISH,
      LanguageE.JAPANESE,
      LanguageE.CHINESE_TRADITIONAL,
    ];
  }

  static fromCode(code: string) {
    switch (code) {
      case LanguageE.Langs.ENGLISH:
        return LanguageE.ENGLISH;
      case LanguageE.Langs.JAPANESE:
        return LanguageE.JAPANESE;
      case LanguageE.Langs.CHINESE_TRADITIONAL:
        return LanguageE.CHINESE_TRADITIONAL;
      default:
        return LanguageE.UNKNOWN;
    }
  }

  static fromName(name: string) {
    switch (name.toUpperCase()) {
      case "ENGLISH":
        return LanguageE.ENGLISH;
      case "JAPANESE":
        return LanguageE.JAPANESE;
      case "CHINESE_TRADITIONAL":
        return LanguageE.CHINESE_TRADITIONAL;
      default:
        return LanguageE.UNKNOWN;
    }
  }

  static parse(text?: string) {
    if (!text) {
      return LanguageE.UNKNOWN;
    }
    let lang = this.fromCode(text.trim());
    if (lang.isInvalid()) {
      lang = this.fromName(text.trim());
    }
    return lang;
  }

  name() {
    switch (this._code) {
      case LanguageE.Langs.ENGLISH:
        return "ENGLISH";
      case LanguageE.Langs.JAPANESE:
        return "JAPANESE";
      case LanguageE.Langs.CHINESE_TRADITIONAL:
        return "CHINESE_TRADITIONAL";
      default:
        return "UNKNOWN";
    }
  }

  code() {
    switch (this._code) {
      case LanguageE.Langs.ENGLISH:
        return LanguageE.Langs.ENGLISH;
      case LanguageE.Langs.JAPANESE:
        return LanguageE.Langs.JAPANESE;
      case LanguageE.Langs.CHINESE_TRADITIONAL:
        return LanguageE.Langs.CHINESE_TRADITIONAL;
      default:
        return LanguageE.Langs.UNKNOWN;
    }
  }

  isValid() {
    return this._code !== LanguageE.Langs.UNKNOWN;
  }

  isInvalid() {
    return !this.isValid();
  }
}
