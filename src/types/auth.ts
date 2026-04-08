/**
 * Authentication and subscription types for shift-schedule monetization.
 */

// --- User & Auth ---

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  generationCount: number;
  generationMonth: string;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionEndDate: string | null;
  dayPassExpiry: string | null;
}

export type Plan = 'free' | 'daypass' | 'annual';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}

// --- Payment ---

export interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  productType: 'daypass' | 'annual';
}

export interface BillingIssueRequest {
  authKey: string;
  customerKey: string;
}

export interface PaymentConfirmResponse {
  success: boolean;
  payment: {
    paymentKey: string;
    orderId: string;
    amount: number;
    type: string;
    status: string;
  };
  user: AuthUser;
}

// --- Generation Limit ---

export interface GenerationLimitInfo {
  remaining: number;
  limit: number;
  plans: PlanOption[];
}

export interface PlanOption {
  type: 'daypass' | 'annual';
  price: number;
  currency: string;
  duration?: string;
  period?: string;
}

// --- API Error ---

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
  remaining?: number;
  limit?: number;
  plans?: PlanOption[];
}

// --- Custom Error ---

export class GenerationLimitError extends Error {
  readonly remaining: number;
  readonly limit: number;
  readonly plans: PlanOption[];

  constructor(info: GenerationLimitInfo) {
    super('Monthly generation limit reached');
    this.name = 'GenerationLimitError';
    this.remaining = info.remaining;
    this.limit = info.limit;
    this.plans = info.plans;
  }
}
