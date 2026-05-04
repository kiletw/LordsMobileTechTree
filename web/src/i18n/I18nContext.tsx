import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Locale, I18nContextType } from './types';
import { zhTW, en, zhCN, ja, ko, id, tr, uk, ar, pl } from './locales';

/** 所有 UI 翻譯 bundle，lazy-friendly 結構 */
const uiTranslations: Partial<Record<Locale, Record<string, string>>> = {
  'zh-TW': zhTW as unknown as Record<string, string>,
  'en': en,
  'zh-CN': zhCN as unknown as Record<string, string>,
  'ja': ja as unknown as Record<string, string>,
  'ko': ko as unknown as Record<string, string>,
  'id': id as unknown as Record<string, string>,
  'tr': tr as unknown as Record<string, string>,
  'uk': uk as unknown as Record<string, string>,
  'ar': ar as unknown as Record<string, string>,
  'pl': pl as unknown as Record<string, string>,
};

/** 目前有對應遊戲字串資產的語言 */
const SUPPORTED_LOCALES: Locale[] = ['zh-TW', 'en', 'zh-CN', 'ja', 'ko', 'id', 'tr', 'uk', 'ar', 'pl'];

/** 預設語言 */
const DEFAULT_LOCALE: Locale = 'en';

/** UI fallback 語言 */
const UI_FALLBACK_LOCALE: Locale = 'en';

/** localStorage key */
const LOCALE_STORAGE_KEY = 'lmc-locale';

/** 遊戲字串快取 (per locale) */
const gameStringCache: Record<string, Record<string, string>> = {};

function normalizeLocaleCandidate(candidate: string): Locale | null {
  const lower = candidate.toLowerCase();

  if (lower.startsWith('zh')) {
    return lower.includes('cn') || lower.includes('hans') ? 'zh-CN' : 'zh-TW';
  }

  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('id')) return 'id';
  if (lower.startsWith('tr')) return 'tr';
  if (lower.startsWith('uk')) return 'uk';
  if (lower.startsWith('ar')) return 'ar';
  if (lower.startsWith('pl')) return 'pl';

  return null;
}

function resolveInitialLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
  if (stored && SUPPORTED_LOCALES.includes(stored)) {
    return stored;
  }

  const candidates = navigator.languages && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];

  for (const candidate of candidates) {
    const normalizedLocale = normalizeLocaleCandidate(candidate);
    if (normalizedLocale && SUPPORTED_LOCALES.includes(normalizedLocale)) {
      return normalizedLocale;
    }
  }

  return DEFAULT_LOCALE;
}

async function fetchGameStrings(locale: Locale): Promise<Record<string, string> | null> {
  const res = await fetch(`${import.meta.env.BASE_URL}strings/${locale}.json`);
  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<Record<string, string>>;
}

async function loadGameStringsForLocale(locale: Locale): Promise<Record<string, string>> {
  const cached = gameStringCache[locale];
  if (cached) {
    return cached;
  }

  const localeData = await fetchGameStrings(locale);
  if (localeData) {
    gameStringCache[locale] = localeData;
    return localeData;
  }

  if (locale !== DEFAULT_LOCALE) {
    const fallbackData = gameStringCache[DEFAULT_LOCALE] ?? await fetchGameStrings(DEFAULT_LOCALE);
    if (fallbackData) {
      gameStringCache[DEFAULT_LOCALE] = fallbackData;
      return fallbackData;
    }
  }

  return {};
}

// ─── Context ────────────────────────────────────────────

const I18nContext = createContext<I18nContextType | null>(null);

// ─── Provider ───────────────────────────────────────────

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 初始化語言：localStorage > 瀏覽器偏好 > 英文 fallback
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialLocale());
  const [gameStrings, setGameStrings] = useState<Record<string, string>>({});
  const localeRequestIdRef = useRef(0);

  // 切換語言
  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);

    const cached = gameStringCache[newLocale];
    if (cached) {
      setGameStrings(cached);
      setLocaleState(newLocale);
      return;
    }

    const requestId = ++localeRequestIdRef.current;
    void (async () => {
      const nextGameStrings = await loadGameStringsForLocale(newLocale);
      if (localeRequestIdRef.current !== requestId) {
        return;
      }

      setGameStrings(nextGameStrings);
      setLocaleState(newLocale);
    })();
  }, []);

  // 初始載入目前語系的遊戲字串表
  useEffect(() => {
    let cancelled = false;
    const requestId = ++localeRequestIdRef.current;

    const loadGameStrings = async () => {
      try {
        const initialGameStrings = await loadGameStringsForLocale(locale);
        if (!cancelled && localeRequestIdRef.current === requestId) {
          setGameStrings(initialGameStrings);
        }
      } catch {
        console.warn(`[i18n] Failed to load game strings for locale: ${locale}`);
      }
    };

    loadGameStrings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.title = (uiTranslations[locale] ?? uiTranslations[UI_FALLBACK_LOCALE] ?? {})['app.title'] ?? 'Lords Mobile Tech Planner';
  }, [locale]);

  // UI 翻譯函數
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // 先查當前語言，沒有就 fallback 到英文 UI
    const bundle = uiTranslations[locale] || uiTranslations[UI_FALLBACK_LOCALE] || {};
    const fallback = uiTranslations[UI_FALLBACK_LOCALE] || {};

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
