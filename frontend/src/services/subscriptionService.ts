import api from './authService';
import { SubscriptionPlan, SubscriptionUsage, RazorpayCheckoutInit } from '../types';

export const subscriptionService = {
  listPlans: async (): Promise<SubscriptionPlan[]> => {
    const { data } = await api.get('/subscription/plans');
    return data?.data || [];
  },

  getMySubscription: async () => {
    const { data } = await api.get('/subscription/my-subscription');
    return data?.data;
  },

  getUsage: async (): Promise<SubscriptionUsage> => {
    const { data } = await api.get('/subscription/usage');
    return data?.data;
  },

  subscribe: async (planId: string): Promise<RazorpayCheckoutInit> => {
    const { data } = await api.post('/subscription/subscribe', { planId });
    return data?.data;
  },

  verifyPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    internalSubId: string;
  }) => {
    const { data } = await api.post('/subscription/verify', payload);
    return data?.data;
  },

  cancel: async () => {
    const { data } = await api.post('/subscription/cancel');
    return data?.data;
  },

  listPayments: async () => {
    const { data } = await api.get('/subscription/payments');
    return data?.data || [];
  },
};