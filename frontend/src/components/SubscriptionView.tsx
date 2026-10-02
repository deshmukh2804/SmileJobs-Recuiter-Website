import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Check,
  Sparkles,
  Zap,
  Shield,
  AlertCircle,
  ArrowLeft,
  Crown,
  TrendingUp,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionPlan, SubscriptionUsage, AuthUser } from '../types';

interface SubscriptionViewProps {
  onSuccess: () => void;
  onBack?: () => void;
  message?: string;
  authUser?: AuthUser | null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SGD: 'S$', AUD: 'A$', CAD: 'C$',
};

const getCurrencySymbol = (c: string) =>
  CURRENCY_SYMBOLS[c?.toUpperCase()?.trim()] || c || '';

const getPlanIcon = (tier: string) => {
  const lower = (tier || '').toLowerCase();
  if (lower.includes('enterprise') || lower.includes('premium'))
    return <Crown className="w-5 h-5 text-amber-600" />;
  if (lower.includes('standard') || lower.includes('pro'))
    return <Zap className="w-5 h-5 text-[#42326E]" />;
  if (lower.includes('basic') || lower.includes('starter'))
    return <Shield className="w-5 h-5 text-[#6E5B9A]" />;
  return <Sparkles className="w-5 h-5 text-[#42326E]" />;
};

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  onSuccess,
  onBack,
  message,
  authUser,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansData, usageData] = await Promise.all([
        subscriptionService.listPlans(),
        subscriptionService.getUsage().catch(() => null),
      ]);
      setPlans(plansData);
      setUsage(usageData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Failed to load subscription plans. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, retryCount]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    // Prevent double-clicks
    if (processingPlanId) return;

    setProcessingPlanId(plan._id);
    setError(null);
    setSuccess(null);

    try {
      const checkout = await subscriptionService.subscribe(plan._id);

      // ═══ FREE PLAN — activate directly ═══
      if (checkout.isFreePlan) {
        setSuccess(`🎉 ${plan.name} plan activated successfully!`);
        setTimeout(() => onSuccess(), 1500);
        return;
      }

      // ═══ PAID PLAN — open Razorpay checkout ═══
      if (!(window as any).Razorpay) {
        setError(
          'Payment gateway not loaded. Please refresh the page and try again.'
        );
        setProcessingPlanId(null);
        return;
      }

      // Get Razorpay Key from env (NEVER from backend response for security)
      const razorpayKeyId =
        import.meta.env.VITE_RAZORPAY_KEY_ID || checkout.razorpayKeyId;

      if (!razorpayKeyId) {
        setError('Payment configuration error. Please contact support.');
        setProcessingPlanId(null);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: (checkout.amount || 0) * 100, // Convert to paise
        currency: checkout.currency || 'INR',
        name: 'Smile Jobs',
        description: `${plan.name} Subscription`,
        order_id: checkout.orderId,
        handler: async (response: any) => {
          // Payment success callback
          try {
            setProcessingPlanId(plan._id);
            setError(null);

            await subscriptionService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internalSubId: checkout.internalSubId!,
            });

            setSuccess(`🎉 ${plan.name} plan activated! Redirecting...`);
            setTimeout(() => onSuccess(), 1500);
          } catch (err: any) {
            console.error('[Subscription] Verification failed:', err);
            setError(
              err?.response?.data?.message ||
                'Payment verification failed. If money was deducted, it will be refunded. Please contact support.'
            );
            setProcessingPlanId(null);
          }
        },
        prefill: {
          name: authUser?.name || '',
          email: authUser?.email || '',
          contact: authUser?.phone || '',
        },
        theme: {
          color: '#42326E',
        },
        modal: {
          ondismiss: () => {
            // User closed the payment window without completing
            console.log('[Subscription] Payment modal dismissed by user');
            setProcessingPlanId(null);
            setError(null);
            // No error shown — user intentionally closed
          },
          escape: true,
          backdropclose: false,
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        console.error('[Subscription] Payment failed:', response.error);
        const errorDesc =
          response.error?.description || 'Payment failed. Please try again.';
        const errorCode = response.error?.code || '';
        const errorReason = response.error?.reason || '';

        let userMessage = errorDesc;
        if (errorCode === 'BAD_REQUEST_ERROR' && errorReason === 'payment_cancelled') {
          userMessage = 'Payment was cancelled. You can try again anytime.';
        }

        setError(userMessage);
        setProcessingPlanId(null);
      });

      rzp.open();
    } catch (err: any) {
      console.error('[Subscription] Subscribe error:', err);
      setError(
        err?.response?.data?.message ||
          'Failed to initiate subscription. Please try again.'
      );
      setProcessingPlanId(null);
    }
  };

  const currentTier = usage?.subscription?.tier;

  // ═══ LOADING STATE ═══
  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#42326E]" />
        <p className="text-sm text-[#6F687A] font-medium">
          Loading subscription plans...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ═══ Header ═══ */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#6F687A] hover:text-[#2C1B57] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
            Choose Your Recruitment Plan
          </h1>
          <p className="text-sm text-[#6F687A] mt-1">
            {message ||
              'Select the perfect plan to power your recruitment workflow.'}
          </p>
        </div>

        {/* Current Usage Widget */}
        {usage && usage.subscriptionActive && (
          <div className="px-4 py-3 bg-white border border-[#E8E3EF] rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold text-[#6F687A] uppercase tracking-wider">
                Current Usage
              </span>
            </div>
            <div className="text-xs font-bold text-[#2C1B57]">
              {usage.jobsUsed} / {usage.jobLimit} jobs used
            </div>
            <div className="text-[10px] text-[#6F687A] mt-0.5">
              {usage.subscription?.name} · {usage.remainingJobs} remaining
            </div>
          </div>
        )}
      </div>

      {/* ═══ Error Alert ═══ */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-red-700 font-semibold">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setRetryCount((c) => c + 1);
              }}
              className="mt-2 text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* ═══ Success Alert ═══ */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs text-emerald-700 font-semibold flex-1">
            {success}
          </span>
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
        </div>
      )}

      {/* ═══ Empty State ═══ */}
      {plans.length === 0 && !error && (
        <div className="text-center py-16 bg-white border border-[#E8E3EF] rounded-3xl">
          <Sparkles className="w-12 h-12 text-[#B29CFE] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#2C1B57]">
            No subscription plans available
          </p>
          <p className="text-xs text-[#6F687A] mt-1">
            Plans are configured by the administrator. Please check back later.
          </p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="mt-4 px-4 py-2 text-xs font-bold text-[#42326E] border border-[#E8E3EF] rounded-xl hover:bg-[#F8F5FF] transition-all flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      )}

      {/* ═══ Plans Grid ═══ */}
      {plans.length > 0 && (
        <div
          className={`grid gap-5 ${
            plans.length === 1
              ? 'grid-cols-1 max-w-md mx-auto'
              : plans.length === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto'
                : plans.length >= 4
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                  : 'grid-cols-1 md:grid-cols-3'
          }`}
        >
          {plans.map((plan) => {
            const isPopular = plan.isPopular;
            const isCurrentPlan = currentTier === plan.tier;
            const isProcessing = processingPlanId === plan._id;
            const isAnyProcessing = processingPlanId !== null;
            const currency = getCurrencySymbol(plan.currency);
            const hasDiscount =
              plan.discountPercent && plan.discountPercent > 0;
            const effectivePrice = hasDiscount
              ? Math.round(
                  (plan.price -
                    (plan.price * (plan.discountPercent || 0)) / 100) *
                    100
                ) / 100
              : plan.price;

            return (
              <div
                key={plan._id}
                className={`relative bg-white rounded-3xl p-6 border transition-all flex flex-col ${
                  isPopular
                    ? 'border-2 border-[#42326E] shadow-lg'
                    : 'border-[#E8E3EF] hover:border-[#B29CFE] shadow-xs'
                } ${isAnyProcessing && !isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 right-6 -translate-y-1/2 bg-[#42326E] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" /> Popular
                  </div>
                )}

                {/* Active Badge */}
                {isCurrentPlan && (
                  <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3 h-3" strokeWidth={3} /> Current
                  </div>
                )}

                <div className="flex-1 space-y-4">
                  {/* Plan Name + Icon */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isPopular ? 'bg-[#EDE6FA]' : 'bg-[#FCFCF7]'
                      }`}
                    >
                      {getPlanIcon(plan.tier)}
                    </div>
                    <span className="text-base font-extrabold text-[#2C1B57] capitalize">
                      {plan.name}
                    </span>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      {effectivePrice === 0 ? (
                        <span className="text-4xl font-extrabold text-[#2C1B57]">
                          Free
                        </span>
                      ) : (
                        <>
                          <span className="text-4xl font-extrabold text-[#2C1B57]">
                            {currency}
                            {effectivePrice.toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-[#6F687A] line-through font-medium">
                              {currency}
                              {plan.price.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="text-xs text-[#6F687A] font-semibold">
                            / {plan.billingCycle}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Discount Badge */}
                    {hasDiscount && effectivePrice > 0 && (
                      <span className="mt-1.5 inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                        Save {plan.discountPercent}%
                      </span>
                    )}

                    {/* Trial Badge */}
                    {plan.trialDays && plan.trialDays > 0 && (
                      <span className="mt-1.5 ml-1.5 inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                        {plan.trialDays}-day free trial
                      </span>
                    )}

                    {plan.description && (
                      <p className="text-xs text-[#6F687A] mt-2">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-[#E8E3EF]" />

                  {/* Features List */}
                  <div className="space-y-2.5">
                    {/* Job Limit */}
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check
                          className="w-2.5 h-2.5 text-emerald-700"
                          strokeWidth={3}
                        />
                      </div>
                      <span className="text-xs text-[#49454F] font-semibold">
                        Up to <b>{plan.jobPostLimit}</b> active job listings
                      </span>
                    </div>

                    {/* Resume Limit */}
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check
                          className="w-2.5 h-2.5 text-emerald-700"
                          strokeWidth={3}
                        />
                      </div>
                      <span className="text-xs text-[#49454F] font-semibold">
                        Access{' '}
                        <b>
                          {plan.resumeViewLimit >= 9999
                            ? 'unlimited'
                            : plan.resumeViewLimit}
                        </b>{' '}
                        candidate profiles
                      </span>
                    </div>

                    {/* Dynamic Features from Admin */}
                    {plan.features?.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check
                            className="w-2.5 h-2.5 text-emerald-700"
                            strokeWidth={3}
                          />
                        </div>
                        <span className="text-xs text-[#49454F] font-medium">
                          {feat}
                        </span>
                      </div>
                    ))}

                    {/* Advantages (if any from admin) */}
                    {plan.advantages?.map((adv, idx) => (
                      <div key={`adv-${idx}`} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-[#EDE6FA] flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-[#42326E]" />
                        </div>
                        <span className="text-xs text-[#49454F] font-medium">
                          {adv}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscribe Button */}
                <div className="mt-6 pt-4">
                  <button
                    type="button"
                    disabled={isAnyProcessing || isCurrentPlan || !!success}
                    onClick={() => handleSubscribe(plan)}
                    className={`w-full py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border ${
                      isCurrentPlan
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed'
                        : isPopular
                          ? 'bg-[#42326E] hover:bg-[#322554] text-white border-[#42326E] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                          : 'bg-[#FCFCF7] text-[#2C1B57] border-[#E8E3EF] hover:border-[#42326E] hover:bg-[#F8F5FF] disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing payment...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <Check className="w-4 h-4" />
                        Current Plan
                      </>
                    ) : effectivePrice === 0 ? (
                      'Activate Free Plan'
                    ) : (
                      `Subscribe — ${currency}${effectivePrice.toLocaleString('en-IN')}/${plan.billingCycle}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Footer ═══ */}
      <div className="pt-4 text-center space-y-2">
        <p className="text-[11px] text-[#6F687A]">
          🔒 Secure payments powered by Razorpay · Cancel anytime · All prices
          in INR
        </p>
        {usage?.subscription?.cancelAtPeriodEnd && (
          <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-block">
            ⚠️ Your subscription will end on{' '}
            {new Date(
              usage.subscription.currentPeriodEnd
            ).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
};
