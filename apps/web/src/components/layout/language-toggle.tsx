'use client';

import { Languages } from 'lucide-react';
import { useLocale } from '@/providers/locale-provider';

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  const nextLocale = locale === 'zh-CN' ? 'en' : 'zh-CN';
  const label = locale === 'zh-CN' ? 'Switch to English' : '切换到简体中文';

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      aria-label={t('language')}
      title={label}
      className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-secondary"
    >
      <Languages className="h-4 w-4" />
    </button>
  );
}