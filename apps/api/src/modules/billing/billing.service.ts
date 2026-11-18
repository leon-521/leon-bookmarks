import { Injectable, BadRequestException, NotFoundException, Logger, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Plan } from '@prisma/client';
import { Request } from 'express';

const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    features: [
      '500 bookmarks',
      '5 team members',
      '20 categories',
      'Basic search',
      'Public portal',
    ],
    limits: { maxBookmarks: 500, maxMembers: 5, maxCategories: 20 },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    features: [
      '5,000 bookmarks',
      '50 team members',
      '200 categories',
      'Full-text search',
      'Custom themes',
      'Import/Export',
      'Priority support',
    ],
    limits: { maxBookmarks: 5000, maxMembers: 50, maxCategories: 200 },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    interval: 'month',
    features: [
      'Unlimited bookmarks',
      'Unlimited team members',
      'Unlimited categories',
      'Custom domain',
      'SSO / SAML',
      'API access',
      'Audit logs',
      'Dedicated support',
    ],
    limits: { maxBookmarks: -1, maxMembers: -1, maxCategories: -1 },
  },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initStripe();
  }

  private async initStripe() {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      try {
        const StripeModule = await import('stripe').catch(() => null);
        if (StripeModule) {
          const Stripe = StripeModule.default || StripeModule;
          this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' as any });
          this.logger.log('Stripe initialized successfully');
        }
      } catch {
        this.logger.warn('Stripe SDK not available. Billing features disabled.');
      }
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Billing runs in mock mode.');
    }
  }

  private getStripePriceId(planKey: 'PRO' | 'ENTERPRISE'): string {
    if (planKey === 'PRO') {
      return this.configService.get<string>('STRIPE_PRO_PRICE_ID', 'price_pro_placeholder');
    }
    return this.configService.get<string>('STRIPE_ENTERPRISE_PRICE_ID', 'price_enterprise_placeholder');
  }

  getPlans() {
    return Object.values(PLANS).map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      interval: plan.interval,
      features: plan.features,
      limits: plan.limits,
    }));
  }

  async getSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, plan: true, maxBookmarks: true, maxMembers: true, createdAt: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const plan = PLANS[tenant.plan] || PLANS.FREE;
    const [bookmarkCount, memberCount] = await Promise.all([
      this.prisma.bookmark.count({ where: { tenantId } }),
      this.prisma.user.count({ where: { tenantId } }),
    ]);

    return {
      currentPlan: plan,
      usage: {
        bookmarks: {
          used: bookmarkCount,
          limit: tenant.maxBookmarks,
          percentage: tenant.maxBookmarks > 0 ? Math.round((bookmarkCount / tenant.maxBookmarks) * 100) : 0,
        },
        members: {
          used: memberCount,
          limit: tenant.maxMembers,
          percentage: tenant.maxMembers > 0 ? Math.round((memberCount / tenant.maxMembers) * 100) : 0,
        },
      },
      canUpgrade: tenant.plan !== 'ENTERPRISE',
      canDowngrade: tenant.plan !== 'FREE',
    };
  }

  async createCheckoutSession(tenantId: string, userId: string, planId: string) {
    const planKey = (planId || '').toUpperCase() as keyof typeof PLANS;
    if (planKey !== 'PRO' && planKey !== 'ENTERPRISE') {
      throw new BadRequestException(`Invalid upgrade plan: ${planId}`);
    }

    if (!this.stripe) {
      // Mock mode — directly upgrade in database without redirecting to undefined
      return this.upgradePlan(tenantId, planKey as Plan);
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0].trim();
    const stripePriceId = this.getStripePriceId(planKey);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      ...(tenant.stripeCustomerId
        ? { customer: tenant.stripeCustomerId }
        : { customer_email: user?.email }),
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${frontendUrl}/settings/billing?billing=success&plan=${planId.toLowerCase()}`,
      cancel_url: `${frontendUrl}/settings/billing?billing=cancelled`,
      metadata: {
        tenantId,
        userId,
        planId: planKey,
      },
      subscription_data: {
        metadata: {
          tenantId,
          planId: planKey,
        },
      },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async createPortalSession(tenantId: string) {
    if (!this.stripe) {
      return { portalUrl: '/settings/billing', message: 'Stripe not configured. Manage plan directly in billing settings.' };
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (!tenant.stripeCustomerId) {
      throw new BadRequestException('No active Stripe customer found for this workspace');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',')[0].trim();

    const session = await this.stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${frontendUrl}/settings/billing`,
    });

    return { portalUrl: session.url };
  }

  async handleWebhook(req: RawBodyRequest<Request>, signature: string) {
    if (!this.stripe) {
      return { received: true, mode: 'mock' };
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret || !req.rawBody) {
      throw new BadRequestException('Missing Stripe webhook secret or raw request body');
    }

    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { tenantId, planId } = session.metadata || {};
        if (tenantId && planId) {
          await this.upgradePlan(
            tenantId,
            planId as Plan,
            typeof session.customer === 'string' ? session.customer : undefined,
            typeof session.subscription === 'string' ? session.subscription : undefined,
          );
          this.logger.log(`Tenant ${tenantId} upgraded to ${planId}`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        let tenantId = subscription.metadata?.tenantId;
        if (!tenantId && subscription.id) {
          const matched = await this.prisma.tenant.findFirst({
            where: { stripeSubscriptionId: subscription.id },
            select: { id: true },
          });
          tenantId = matched?.id;
        }
        if (tenantId) {
          await this.upgradePlan(tenantId, Plan.FREE, undefined, null);
          this.logger.log(`Tenant ${tenantId} downgraded to FREE (subscription cancelled)`);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        this.logger.warn(`Payment failed for invoice: ${invoice.id}`);
        break;
      }
    }

    return { received: true };
  }

  private async upgradePlan(
    tenantId: string,
    plan: Plan,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string | null,
  ) {
    const planConfig = PLANS[plan] || PLANS.FREE;
    const limits = planConfig.limits;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan,
        maxBookmarks: limits.maxBookmarks,
        maxMembers: limits.maxMembers,
        ...(stripeCustomerId !== undefined && { stripeCustomerId }),
        ...(stripeSubscriptionId !== undefined && { stripeSubscriptionId }),
      },
    });

    return { success: true, mode: this.stripe ? 'stripe' : 'mock', plan, limits };
  }
}
