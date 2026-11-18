import { api } from '@/lib/api';

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: string | null;
  features: string[];
  limits: { maxBookmarks: number; maxMembers: number; maxCategories: number };
}

export interface SubscriptionInfo {
  currentPlan: PricingPlan;
  usage: {
    bookmarks: { used: number; limit: number; percentage: number };
    members: { used: number; limit: number; percentage: number };
  };
  canUpgrade: boolean;
  canDowngrade: boolean;
}

export const billingService = {
  getPlans: () => api.get<PricingPlan[]>('/billing/plans'),
  getSubscription: () => api.get<SubscriptionInfo>('/billing/subscription'),
  createCheckout: (planId: string) => api.post<{ checkoutUrl: string; sessionId: string }>('/billing/checkout', { planId }),
  createPortal: () => api.post<{ portalUrl: string }>('/billing/portal'),
};
