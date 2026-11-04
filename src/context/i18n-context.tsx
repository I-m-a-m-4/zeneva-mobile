import * as React from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  getLocaleDefinition,
  resolveLocale,
  type LocaleCode,
  type LocaleDir,
} from '@/lib/i18n/config';
import {
  englishMessages,
  getCachedMessages,
  loadMessages,
  type Messages,
} from '@/lib/i18n/messages';

type Vars = Record<string, string | number>;

export type TranslateFn = (key: string, vars?: Vars) => string;

interface I18nContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  adoptLocale: (raw: unknown) => void;
  t: TranslateFn;
  dir: LocaleDir;
  isReady: boolean;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

function lookup(source: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
    return undefined;
  }, source);
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

function translate(messages: Messages, key: string, vars?: Vars): string {
  const plural =
    vars && typeof vars.count === 'number'
      ? `${key}_${Math.abs(vars.count) === 1 ? 'one' : 'other'}`
      : null;

  const candidates = plural ? [plural, key] : [key];

  for (const candidate of candidates) {
    for (const source of [messages, englishMessages]) {
      const hit = lookup(source, candidate);
      if (typeof hit === 'string') return interpolate(hit, vars);
    }
  }

  return key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<LocaleCode>(DEFAULT_LOCALE);
  const [messages, setMessages] = React.useState<Messages>(englishMessages);
  const [isReady, setIsReady] = React.useState(false);

  const hasExplicitChoiceRef = React.useRef(false);
  const localeRef = React.useRef<LocaleCode>(DEFAULT_LOCALE);

  const applyLocale = React.useCallback((next: LocaleCode) => {
    localeRef.current = next;
    setLocaleState(next);

    const cached = getCachedMessages(next);
    if (cached) {
      setMessages(cached);
      setIsReady(true);
      return;
    }

    setIsReady(false);
    void loadMessages(next).then((loaded) => {
      if (localeRef.current !== next) return;
      setMessages(loaded);
      setIsReady(true);
    });
  }, []);

  React.useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const resolved = resolveLocale(stored);
          if (resolved) {
            hasExplicitChoiceRef.current = true;
            applyLocale(resolved);
            return;
          }
        }
        setIsReady(true);
      })
      .catch(() => {
        setIsReady(true);
      });
  }, [applyLocale]);

  const dir = getLocaleDefinition(locale).dir;

  React.useEffect(() => {
    const isRTL = dir === 'rtl';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }
  }, [dir]);

  const setLocale = React.useCallback(
    (next: LocaleCode) => {
      hasExplicitChoiceRef.current = true;
      AsyncStorage.setItem(LOCALE_STORAGE_KEY, next).catch(() => {});
      applyLocale(next);
    },
    [applyLocale],
  );

  const adoptLocale = React.useCallback(
    (raw: unknown) => {
      if (hasExplicitChoiceRef.current) return;
      const next = resolveLocale(raw);
      if (!next || next === localeRef.current) return;
      applyLocale(next);
    },
    [applyLocale],
  );

  const t = React.useCallback(
    (key: string, vars?: Vars) => translate(messages, key, vars),
    [messages],
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, setLocale, adoptLocale, t, dir, isReady }),
    [locale, setLocale, adoptLocale, t, dir, isReady],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (ctx) return ctx;

  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    adoptLocale: () => {},
    t: (key: string, vars?: Vars) => translate(englishMessages, key, vars),
    dir: 'ltr',
    isReady: true,
  };
}
