import { Injectable, BadRequestException, NotFoundException, Logger, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Plan } from '@prisma/client';
import { Request } from 'express';

// Plan definitions with Stripe price IDs
const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    stripePriceId: null,
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
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
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
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
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
        // Dynamic import to avoid issues when Stripe is not installed
        const StripeModule = await import('stripe').catch(() => null);
        if (StripeModule) {
          const Stripe = StripeModule.default || StripeModule;
          this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
          this.logger.log('Stripe initialized successfully');
        }
      } catch (error) {
        this.logger.warn('Stripe SDK not available. Billing features disabled.');
      }
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Billing runs in mock mode.');
    }
  }

  getPlans() {
    return Object.values(PLANS).map(plan => ({
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
    const bookmarkCount = await this.prisma.bookmark.count({ where: { tenantId } });
    const memberCount = await this.prisma.user.count({ where: { tenantId } });

    return {
      currentPlan: {
        ...plan,
        stripePriceId: undefined, // Don't expose
      },
      usage: {
        bookmarks: { used: bookmarkCount, limit: tenant.maxBookmarks, percentage: tenant.maxBookmarks > 0 ? Math.round((bookmarkCount / tenant.maxBookmarks) * 100) : 0 },
        members: { used: memberCount, limit: tenant.maxMembers, percentage: tenant.maxMembers > 0 ? Math.round((memberCount / tenant.maxMembers) * 100) : 0 },
      },
      canUpgrade: tenant.plan !== 'ENTERPRISE',
      canDowngrade: tenant.plan !== 'FREE',
    };
  }

  async createCheckoutSession(tenantId: string, userId: string, planId: string) {
    const planKey = planId.toUpperCase() as keyof typeof PLANS;
    const plan = PLANS[planKey];
    if (!plan || !plan.stripePriceId) {
      throw new BadRequestException(`Invalid plan: ${planId}`);
    }

    if (!this.stripe) {
      // Mock mode — directly upgrade
      return this.upgradePlan(tenantId, planKey as Plan);
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user?.email,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${frontendUrl}/settings?billing=success&plan=${planId}`,
      cancel_url: `${frontendUrl}/settings?billing=cancelled`,
      metadata: {
        tenantId,
        userId,
        planId: planKey,
      },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async createPortalSession(tenantId: string) {
    if (!this.stripe) {
      return { portalUrl: '/settings', message: 'Stripe not configured. Manage plan in settings.' };
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    // Note: In production, store Stripe customer ID on tenant
    const session = await this.stripe.billingPortal.sessions.create({
      customer: `cus_${tenantId.substring(0, 14)}`, // Placeholder
      return_url: `${frontendUrl}/settings`,
    });

    return { portalUrl: session.url };
  }

  async handleWebhook(req: RawBodyRequest<Request>, signature: string) {
    if (!this.stripe) {
      return { received: true, mode: 'mock' };
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: any;

    try {
      const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
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
          await this.upgradePlan(tenantId, planId as Plan);
          this.logger.log(`Tenant ${tenantId} upgraded to ${planId}`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        this.logger.log(`Subscription updated: ${subscription.id}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const tenantId = subscription.metadata?.tenantId;
        if (tenantId) {
          await this.upgradePlan(tenantId, 'FREE' as Plan);
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

  private async upgradePlan(tenantId: string, plan: Plan) {
    const planConfig = PLANS[plan] || PLANS.FREE;
    const limits = planConfig.limits;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan,
        maxBookmarks: limits.maxBookmarks === -1 ? 999999 : limits.maxBookmarks,
        maxMembers: limits.maxMembers === -1 ? 999999 : limits.maxMembers,
      },
    });

    return { success: true, plan, limits };
  }
}
