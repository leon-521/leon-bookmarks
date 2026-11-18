'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Building2, Link2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useLocale } from '@/providers/locale-provider';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const { t } = useLocale();
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
    tenantSlug: '',
  });
  const [error, setError] = React.useState('');

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'tenantName') {
        const slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        if (slug) {
          next.tenantSlug = slug;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await registerUser(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
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
          <h1 className="text-2xl font-display font-bold text-text-primary">{t('createAccount')}</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {t('setupWorkspace')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          <Input
            label={t('fullName')}
            placeholder="John Doe"
            iconLeft={<User className="h-4 w-4" />}
            value={formData.name}
            onChange={handleChange('name')}
            required
          />

          <Input
            label={t('email')}
            type="email"
            placeholder="you@example.com"
            iconLeft={<Mail className="h-4 w-4" />}
            value={formData.email}
            onChange={handleChange('email')}
            required
          />

          <Input
            label={t('password')}
            type="password"
            placeholder="••••••••"
            iconLeft={<Lock className="h-4 w-4" />}
            helperText="At least 8 characters with a number and symbol"
            value={formData.password}
            onChange={handleChange('password')}
            required
          />

          <div className="pt-2 pb-1">
            <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              {t('teamWorkspace')}
            </div>
          </div>

          <Input
            label={t('teamName')}
            placeholder="Acme Dev Team"
            iconLeft={<Building2 className="h-4 w-4" />}
            value={formData.tenantName}
            onChange={handleChange('tenantName')}
            required
          />

          <Input
            label={t('workspaceSlug')}
            placeholder="acme-dev"
            iconLeft={<Link2 className="h-4 w-4" />}
            helperText={formData.tenantSlug ? `Your portal: leon.app/portal/${formData.tenantSlug}` : 'URL-friendly name for your workspace'}
            value={formData.tenantSlug}
            onChange={handleChange('tenantSlug')}
            required
          />

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            {t('createAccountButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {t('alreadyAccount')}{' '}
          <Link
            href="/login"
            className="font-medium text-accent hover:text-accent-hover transition-colors"
          >
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
