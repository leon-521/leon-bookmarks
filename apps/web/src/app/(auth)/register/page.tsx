'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Building2, Link2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
    tenantSlug: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    if (field === 'tenantName') {
      const slug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, tenantSlug: slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerUser(formData);
    router.push('/dashboard');
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
          <h1 className="text-2xl font-display font-bold text-text-primary">Create your account</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Set up your team workspace in just a few steps
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            iconLeft={<User className="h-4 w-4" />}
            value={formData.name}
            onChange={handleChange('name')}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            iconLeft={<Mail className="h-4 w-4" />}
            value={formData.email}
            onChange={handleChange('email')}
            required
          />

          <Input
            label="Password"
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
              Team Workspace
            </div>
          </div>

          <Input
            label="Team Name"
            placeholder="Acme Dev Team"
            iconLeft={<Building2 className="h-4 w-4" />}
            value={formData.tenantName}
            onChange={handleChange('tenantName')}
            required
          />

          <Input
            label="Workspace Slug"
            placeholder="acme-dev"
            iconLeft={<Link2 className="h-4 w-4" />}
            helperText={formData.tenantSlug ? `Your portal: leon.app/portal/${formData.tenantSlug}` : 'URL-friendly name for your workspace'}
            value={formData.tenantSlug}
            onChange={handleChange('tenantSlug')}
            required
          />

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
