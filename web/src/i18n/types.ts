/**
 * 多語言系統型別定義
 * 
 * 兩層翻譯來源：
 * 1. UI 翻譯 (ui): 模擬器自己的介面文字，如「步兵」、「攻擊方」等
 * 2. 遊戲資料翻譯 (game): 從遊戲 StringTable 提取的文字，如英雄名稱、技能名稱等
 *    - 以 string ID 為 key，每個語言各一份
 */

/** 支援的語言代碼 — 與目前可用的遊戲字串資產對齊 */
export type Locale = 'zh-TW' | 'en' | 'zh-CN' | 'ja' | 'ko' | 'id' | 'tr' | 'uk' | 'ar' | 'pl';

/** 語言對應遊戲的 StringAsset 名稱 */
export const LocaleToGameAsset: Record<Locale, string> = {
  'en':    'StringEng',
  'zh-TW': 'StringCht',
  'zh-CN': 'StringChs',
  'id':    'StringIdn',
  'tr':    'StringTur',
  'ko':    'StringKor',
  'ja':    'StringJap',
  'uk':    'StringUkr',
  'ar':    'StringArb',
  'pl':    'StringPol',
};

/** 語言顯示名稱 (使用該語言本身的名稱) */
export const LocaleDisplayNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'en':    'English',
  'zh-CN': '简体中文',
  'ja':    '日本語',
  'ko':    '한국어',
  'id':    'Bahasa Indonesia',
  'tr':    'Türkçe',
  'uk':    'Українська',
  'ar':    'العربية',
  'pl':    'Polski',
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
  /** 支援的語言清單 (目前有對應遊戲字串資產的語言) */
  supportedLocales: Locale[];
}
