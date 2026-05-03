import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { Locale, I18nContextType } from './types';
import { zhTW, en } from './locales';

/** 所有 UI 翻譯 bundle，lazy-friendly 結構 */
const uiTranslations: Record<string, Record<string, string>> = {
  'zh-TW': zhTW as unknown as Record<string, string>,
  'en': en,
};

/** 目前有完整 UI 翻譯的語言 */
const SUPPORTED_LOCALES: Locale[] = ['zh-TW', 'en'];

/** 預設語言 */
const DEFAULT_LOCALE: Locale = 'zh-TW';

/** localStorage key */
const LOCALE_STORAGE_KEY = 'lmc-locale';

/** 遊戲字串快取 (per locale) */
const gameStringCache: Record<string, Record<string, string>> = {};

async function fetchGameStrings(locale: Locale): Promise<Record<string, string> | null> {
  const res = await fetch(`${import.meta.env.BASE_URL}strings/${locale}.json`);
  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<Record<string, string>>;
}

// ─── Context ────────────────────────────────────────────

const I18nContext = createContext<I18nContextType | null>(null);

// ─── Provider ───────────────────────────────────────────

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 初始化語言：localStorage > 瀏覽器偏好 > 預設
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;

    // 嘗試從瀏覽器語言偵測
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
      return browserLang.includes('CN') ? 'zh-CN' : 'zh-TW';
    }
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('ko')) return 'ko';

    return DEFAULT_LOCALE;
  });

  const [gameStrings, setGameStrings] = useState<Record<string, string>>({});

  // 切換語言
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  // 載入遊戲字串表 (從後端 API)
  useEffect(() => {
    let cancelled = false;

    const loadGameStrings = async () => {
      // 若快取已有，直接用
      if (gameStringCache[locale]) {
        if (!cancelled) {
          setGameStrings(gameStringCache[locale]);
        }
        return;
      }

      try {
        const localeData = await fetchGameStrings(locale);
        if (localeData) {
          gameStringCache[locale] = localeData;
          if (!cancelled) {
            setGameStrings(localeData);
          }
          return;
        }

        if (locale !== DEFAULT_LOCALE) {
          const fallbackData = gameStringCache[DEFAULT_LOCALE] ?? await fetchGameStrings(DEFAULT_LOCALE);
          if (fallbackData) {
            gameStringCache[DEFAULT_LOCALE] = fallbackData;
            if (!cancelled) {
              setGameStrings(fallbackData);
            }
          }
        }
      } catch {
        console.warn(`[i18n] Failed to load game strings for locale: ${locale}`);
      }
    };

    loadGameStrings();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  // UI 翻譯函數
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // 先查當前語言，沒有就 fallback 到 zh-TW
    const bundle = uiTranslations[locale] || uiTranslations[DEFAULT_LOCALE];
    const fallback = uiTranslations[DEFAULT_LOCALE];

    let text = bundle[key] ?? fallback[key] ?? key;

    // 替換參數 {paramName}
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }

    return text;
  }, [locale]);

  // 遊戲字串查詢
  const gameString = useCallback((id: number): string => {
    return gameStrings[String(id)] ?? `[#${id}]`;
  }, [gameStrings]);

  const value = useMemo<I18nContextType>(() => ({
    locale,
    setLocale,
    t,
    gameString,
    gameStrings,
    supportedLocales: SUPPORTED_LOCALES,
  }), [locale, setLocale, t, gameString, gameStrings]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// ─── Hook ───────────────────────────────────────────────

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

// ─── 小型語言切換元件 ────────────────────────────────────

import { LocaleDisplayNames } from './types';

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, supportedLocales, t } = useI18n();

  return (
    <div className="language-switcher">
      <span className="language-switcher__label">{t('lang.label')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="language-switcher__select"
      >
        {supportedLocales.map((loc) => (
          <option key={loc} value={loc}>
            {LocaleDisplayNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
};
