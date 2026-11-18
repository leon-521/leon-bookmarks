'use client';

import * as React from 'react';
import Link from 'next/link';
import { CreditCard, ArrowUpRight, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { billingService } from '@/lib/services';
import type { SubscriptionInfo } from '@/lib/services';
import { cn } from '@/lib/utils';

function UsageBar({ label, used, limit, percentage }: { label: string; used: number; limit: number; percentage: number }) {
  const isUnlimited = limit < 0 || limit >= 999999;
  const pct = isUnlimited ? 0 : Math.min(percentage, 100);
  const isHigh = pct >= 80;
  const isCritical = pct >= 95;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-sm text-text-secondary tabular-nums">
          {used.toLocaleString()} / {isUnlimited ? '∞' : limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-bg-tertiary overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isCritical ? 'bg-danger' : isHigh ? 'bg-warning' : 'bg-accent'
          )}
          style={{ width: isUnlimited ? '0%' : `${pct}%` }}
        />
      </div>
      {isHigh && !isUnlimited && (
        <p className={cn('text-xs mt-1.5', isCritical ? 'text-danger' : 'text-warning')}>
          {isCritical ? 'Almost at limit — upgrade to continue adding.' : 'Approaching limit — consider upgrading.'}
        </p>
      )}
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-bg-primary p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-bg-primary p-6 shadow-xs">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

const planBadgeVariant = (planName: string): 'default' | 'secondary' | 'success' | 'warning' => {
  switch (planName?.toLowerCase()) {
    case 'enterprise': return 'warning';
    case 'pro': return 'default';
    default: return 'secondary';
  }
};

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = React.useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [checkoutLoading, setCheckoutLoading] = React.useState<string | null>(null);
  const [portalLoading, setPortalLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await billingService.getSubscription();
        if (!cancelled) {
          setSubscription(result);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load billing info');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleUpgrade = async (planId: string) => {
    setCheckoutLoading(planId);
    setError(null);
    try {
      const res: any = await billingService.createCheckout(planId);
      if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        setError(res?.message || 'Stripe is not configured. Running in mock mode.');
        const updated = await billingService.getSubscription().catch(() => null);
        if (updated) setSubscription(updated);
      }
    } catch (err: any) {
      if (err.message?.includes('Stripe') || err.message?.includes('mock') || err.status === 503) {
        setError('Stripe is not configured. Running in mock mode — billing features are simulated.');
      } else {
        setError(err.message || 'Failed to start checkout');
      }
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const res: any = await billingService.createPortal();
      if (res?.portalUrl) {
        window.location.href = res.portalUrl;
      } else {
        setError(res?.message || 'Stripe is not configured. Running in mock mode.');
      }
    } catch (err: any) {
      if (err.message?.includes('Stripe') || err.message?.includes('mock') || err.status === 503) {
        setError('Stripe is not configured. Running in mock mode — billing features are simulated.');
      } else {
        setError(err.message || 'Failed to open billing portal');
      }
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) return <BillingSkeleton />;

  if (error && !subscription) {
    return (
      <div className="rounded-xl border border-warning/20 bg-warning-light p-8 text-center">
        <AlertCircle className="h-10 w-10 text-warning mx-auto mb-3" />
        <p className="text-sm font-medium text-text-primary mb-1">Billing Unavailable</p>
        <p className="text-sm text-text-secondary">{error}</p>
      </div>
    );
  }

  const plan = subscription?.currentPlan;
  const isFree = plan?.price === 0;
  const isPro = plan?.id === 'pro' || plan?.name?.toLowerCase() === 'pro';

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning-light px-4 py-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="rounded-xl border border-border bg-bg-primary p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted">
              <CreditCard className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-text-primary">{plan?.name || 'Free'} Plan</h3>
                <Badge variant={planBadgeVariant(plan?.name || 'free')}>
                  {plan?.name || 'Free'}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary">
                {isFree
                  ? 'You\'re on the free plan'
                  : `$${plan?.price}/${plan?.interval || 'month'}`}
              </p>
            </div>
          </div>
          {!isFree && (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              loading={portalLoading}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Manage Subscription
            </Button>
          )}
        </div>

        {/* Usage Bars */}
        {subscription?.usage && (
          <div className="space-y-5">
            <UsageBar
              label="Bookmarks"
              used={subscription.usage.bookmarks.used}
              limit={subscription.usage.bookmarks.limit}
              percentage={subscription.usage.bookmarks.percentage}
            />
            <UsageBar
              label="Team Members"
              used={subscription.usage.members.used}
              limit={subscription.usage.members.limit}
              percentage={subscription.usage.members.percentage}
            />
          </div>
        )}
      </div>

      {/* Upgrade/Downgrade Options */}
      {subscription?.canUpgrade && (
        <div className="rounded-xl border border-border bg-bg-primary p-6 shadow-xs">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Upgrade your plan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isPro && (
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={checkoutLoading === 'pro'}
                className={cn(
                  'relative flex flex-col items-start rounded-xl border-2 p-5 transition-all duration-200 text-left',
                  'border-accent/30 bg-accent-muted/30 hover:border-accent hover:shadow-md',
                  checkoutLoading === 'pro' && 'opacity-50 pointer-events-none'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-text-primary">Pro</span>
                  <span className="text-xs text-text-tertiary">$9.99/mo</span>
                </div>
                <p className="text-xs text-text-secondary">5,000 bookmarks, 50 members, custom domain</p>
                <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-accent" />
              </button>
            )}
            {subscription.canUpgrade && (
              <button
                onClick={() => handleUpgrade('enterprise')}
                disabled={checkoutLoading === 'enterprise'}
                className={cn(
                  'relative flex flex-col items-start rounded-xl border-2 p-5 transition-all duration-200 text-left',
                  'border-warning/30 bg-warning-light/30 hover:border-warning hover:shadow-md',
                  checkoutLoading === 'enterprise' && 'opacity-50 pointer-events-none'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-warning" />
                  <span className="text-sm font-semibold text-text-primary">Enterprise</span>
                  <span className="text-xs text-text-tertiary">$29.99/mo</span>
                </div>
                <p className="text-xs text-text-secondary">Unlimited everything, SSO, SLA, dedicated support</p>
                <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-warning" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pricing link */}
      <div className="text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          View all plan details
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
