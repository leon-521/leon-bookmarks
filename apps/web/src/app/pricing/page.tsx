'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { billingService } from '@/lib/services';
import type { PricingPlan } from '@/lib/services';
import { useLocale } from '@/providers/locale-provider';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { cn } from '@/lib/utils';

import { useAuth } from '@/hooks/use-auth';

const fallbackPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    features: ['Up to 500 bookmarks', 'Unlimited categories', '5 team members', 'Public portal', 'AI smart organize'],
    limits: { maxBookmarks: 500, maxMembers: 5, maxCategories: -1 },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    features: ['Up to 5,000 bookmarks', 'Unlimited categories', '50 team members', 'Custom domain', 'Advanced analytics', 'Priority support', 'Custom branding', 'API access'],
    limits: { maxBookmarks: 5000, maxMembers: 50, maxCategories: -1 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    interval: 'month',
    features: ['Unlimited bookmarks', 'Unlimited categories', 'Unlimited members', 'Custom domain', 'White-label branding', 'SSO / SAML', 'Dedicated support', 'SLA guarantee', 'Custom integrations', 'Audit logs'],
    limits: { maxBookmarks: -1, maxMembers: -1, maxCategories: -1 },
  },
];

const faqs = [
  {
    q: 'Can I change plans at any time?',
    a: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately, and we\'ll prorate any billing differences.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe integration.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Yes, all paid plans come with a 14-day free trial. No credit card required to start.',
  },
  {
    q: 'What happens when I hit my bookmark limit?',
    a: 'You\'ll receive a notification when you\'re approaching your limit. You can upgrade at any time to increase your capacity.',
  },
  {
    q: 'Can I export my data?',
    a: 'Absolutely. You can export all your bookmarks and data at any time in multiple formats (JSON, CSV, HTML).',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes, annual billing gives you 2 months free. Contact us or switch to annual billing in your account settings.',
  },
];

function PricingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-bg-primary p-8 shadow-xs">
      <Skeleton className="h-6 w-20 mb-4" />
      <Skeleton className="h-10 w-28 mb-2" />
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <Skeleton className="h-11 w-full mt-8 rounded-lg" />
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-accent"
      >
        <span className="text-sm font-medium text-text-primary pr-4">{question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-text-tertiary" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-text-tertiary" />
        )}
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-40 pb-5' : 'max-h-0'
        )}
      >
        <p className="text-sm text-text-secondary leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = React.useState<PricingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await billingService.getPlans();
        if (!cancelled) setPlans(result);
      } catch {
        if (!cancelled) setPlans(fallbackPlans);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="fixed right-5 top-5 z-50"><LanguageToggle /></div>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-violet-50/50 to-bg-primary" />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-10 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <Bookmark className="h-5 w-5 text-accent" />
            <span className="font-display font-bold text-text-primary">Leon Bookmarks</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-muted px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">{t('transparentPricing')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary tracking-tight mb-4">
            {t('choosePlan')}
            <br />
            <span className="text-gradient">{t('forYourTeam')}</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Start for free, upgrade when you need more. All plans include a 14-day trial of premium features.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-5xl px-6 -mt-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <PricingCardSkeleton key={i} />)
            : displayPlans.map((plan) => {
                const isPro = plan.name.toLowerCase() === 'pro';
                const isFree = plan.price === 0;
                const isEnterprise = plan.name.toLowerCase() === 'enterprise';

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'relative rounded-2xl border p-8 transition-all duration-300 hover:shadow-lg',
                      isPro
                        ? 'border-accent bg-bg-primary shadow-md scale-[1.02] ring-1 ring-accent/20'
                        : 'border-border bg-bg-primary shadow-xs hover:border-border-hover'
                    )}
                  >
                    {isPro && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Badge className="bg-accent text-white border-0 px-3 py-1 shadow-sm">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-text-primary tracking-tight">
                          {isFree ? 'Free' : `$${plan.price}`}
                        </span>
                        {plan.interval && (
                          <span className="text-sm text-text-tertiary">/{plan.interval}</span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check className={cn('h-4 w-4 mt-0.5 flex-shrink-0', isPro ? 'text-accent' : 'text-success')} />
                          <span className="text-sm text-text-secondary">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isFree ? (
                      <Link href={isAuthenticated ? '/dashboard' : '/register'}>
                        <Button variant="outline" size="lg" className="w-full">
                          {isAuthenticated ? t('dashboard') : t('getStarted')}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : isEnterprise ? (
                      <Link href={isAuthenticated ? '/settings/billing' : 'mailto:sales@leon.app'}>
                        <Button variant="secondary" size="lg" className="w-full">
                          {isAuthenticated ? 'Manage Plan' : 'Contact Sales'}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={isAuthenticated ? '/settings/billing' : '/register'}>
                        <Button size="lg" className="w-full shadow-md hover:shadow-lg">
                          Upgrade to Pro
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-bg-secondary border-t border-border">
        <div className="mx-auto max-w-2xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
              {t('faq')}
            </h2>
            <p className="text-sm text-text-secondary">
              Everything you need to know about our plans and pricing.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-primary shadow-xs divide-y divide-border px-6">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-bg-primary border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-2xl font-display font-bold text-text-primary mb-3">
            Ready to get started?
          </h2>
          <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
            Join thousands of teams who organize their bookmarks with Leon.
          </p>
          <Link href="/register">
            <Button size="lg" className="shadow-md hover:shadow-lg px-8">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
