/**
 * 多語言系統型別定義
 * 
 * 兩層翻譯來源：
 * 1. UI 翻譯 (ui): 模擬器自己的介面文字，如「步兵」、「攻擊方」等
 * 2. 遊戲資料翻譯 (game): 從遊戲 StringTable 提取的文字，如英雄名稱、技能名稱等
 *    - 以 string ID 為 key，每個語言各一份
 */

/** 支援的語言代碼 — 與遊戲的 GameLanguage enum 對齊 */
export type Locale = 'zh-TW' | 'en' | 'zh-CN' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru' | 'pt' | 'it' | 'th' | 'vi' | 'id' | 'tr' | 'uk' | 'ms' | 'ar';

/** 語言對應遊戲的 StringAsset 名稱 */
export const LocaleToGameAsset: Record<Locale, string> = {
  'en':    'StringEng',
  'zh-TW': 'StringCht',
  'fr':    'StringFre',
  'de':    'StringGem',
  'es':    'StringSpa',
  'ru':    'StringRus',
  'zh-CN': 'StringChs',
  'id':    'StringIdn',
  'vi':    'StringVet',
  'tr':    'StringTur',
  'th':    'StringTha',
  'it':    'StringIta',
  'pt':    'StringPot',
  'ko':    'StringKor',
  'ja':    'StringJap',
  'uk':    'StringUkr',
  'ms':    'StringMys',
  'ar':    'StringArb',
};

/** 語言顯示名稱 (使用該語言本身的名稱) */
export const LocaleDisplayNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'en':    'English',
  'zh-CN': '简体中文',
  'ja':    '日本語',
  'ko':    '한국어',
  'fr':    'Français',
  'de':    'Deutsch',
  'es':    'Español',
  'ru':    'Русский',
  'pt':    'Português',
  'it':    'Italiano',
  'th':    'ไทย',
  'vi':    'Tiếng Việt',
  'id':    'Bahasa Indonesia',
  'tr':    'Türkçe',
  'uk':    'Українська',
  'ms':    'Bahasa Melayu',
  'ar':    'العربية',
};

/** UI 翻譯 key 的型別 (強型別提示) */
export type UITranslationKey = keyof typeof import('./locales/zh-TW').default;

/** i18n Context 的值 */
export interface I18nContextType {
  /** 目前語言 */
  locale: Locale;
  /** 切換語言 */
  setLocale: (locale: Locale) => void;
  /** 取得 UI 翻譯文字 */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** 取得遊戲 StringTable 文字 (透過 string ID) */
  gameString: (id: number) => string;
  /** 目前載入的遊戲字串表 */
  gameStrings: Record<string, string>;
  /** 支援的語言清單 (目前只有有 UI 翻譯的語言) */
  supportedLocales: Locale[];
}
