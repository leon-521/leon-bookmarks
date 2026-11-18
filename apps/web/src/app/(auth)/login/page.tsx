'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useLocale } from '@/providers/locale-provider';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Mobile logo */}
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-md">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="font-display text-xl font-bold">Leon Bookmarks</span>
      </div>

      <div className="rounded-2xl border border-border bg-bg-primary p-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-text-primary">{t('welcomeBack')}</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {t('signInContinue')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Input
            label={t('email')}
            type="email"
            placeholder="you@example.com"
            iconLeft={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label={t('password')}
            type="password"
            placeholder="••••••••"
            iconLeft={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            {t('signIn')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {t('noAccount')}{' '}
          <Link
            href="/register"
            className="font-medium text-accent hover:text-accent-hover transition-colors"
          >
            {t('signUpFree')}
          </Link>
        </p>
      </div>
    </div>
  );
}
