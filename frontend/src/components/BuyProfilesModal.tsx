// frontend/src/components/BuyProfilesModal.tsx
// Modal to purchase unlocks for a selected set of candidates.
// Opens Razorpay checkout, verifies on success, calls onSuccess with unlocked IDs.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  CreditCard,
  Sparkles,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { profilePurchaseService } from '../services/profilePurchaseService';
import { ProfilePricing, AuthUser } from '../types';

interface SelectedCandidate {
  _id: string;
  name?: string;
  avatarUrl?: string;
  jobTitle?: string;
}

interface BuyProfilesModalProps {
  open: boolean;
  onClose: () => void;
  selectedCandidates: SelectedCandidate[];
  authUser?: AuthUser | null;
  onSuccess: (unlockedCandidateIds: string[]) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const getCurrencySymbol = (c: string) =>
  CURRENCY_SYMBOLS[(c || '').toUpperCase().trim()] || c || '';

export const BuyProfilesModal: React.FC<BuyProfilesModalProps> = ({
  open,
  onClose,
  selectedCandidates,
  authUser,
  onSuccess,
}) => {
  const [pricing, setPricing] = useState<ProfilePricing | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadPricing = useCallback(async () => {
    try {
      setLoadingPricing(true);
      setError(null);
      const data = await profilePurchaseService.getPricing();
      setPricing(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Failed to load pricing. Please try again.'
      );
    } finally {
      setLoadingPricing(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadPricing();
      setError(null);
      setSuccess(null);
      setProcessing(false);
    }
  }, [open, retryCount, loadPricing]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;

  const quantity = selectedCandidates.length;
  const unitPriceInPaise = pricing?.priceInPaise || 0;
  const totalPaise = unitPriceInPaise * quantity;
  const totalRupees = totalPaise / 100;
  const currency = pricing?.currency || 'INR';
  const currencySymbol = getCurrencySymbol(currency);

  const canPurchase =
    pricing?.enabled &&
    quantity > 0 &&
    quantity >= (pricing?.minQuantity || 1) &&
    quantity <= (pricing?.maxQuantity || 100) &&
    !processing &&
    !success;

  const handleCheckout = async () => {
    if (!canPurchase) return;
    if (processing) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // STEP 1 — Create order on backend (server-validated price)
      const order = await profilePurchaseService.createOrder(
        selectedCandidates.map((c) => c._id)
      );

      // STEP 2 — Open Razorpay checkout
      if (!(window as any).Razorpay) {
        setError(
          'Payment gateway not loaded. Please refresh the page and try again.'
        );
        setProcessing(false);
        return;
      }

      const razorpayKeyId =
        (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
        order.razorpayKeyId;

      if (!razorpayKeyId) {
        setError('Payment configuration error. Please contact support.');
        setProcessing(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: order.amount, // paise (backend already returns paise)
        currency: order.currency || 'INR',
        name: 'Smile Jobs',
        description: `Unlock ${order.quantity} Candidate Profile${
          order.quantity > 1 ? 's' : ''
        }`,
        order_id: order.razorpayOrderId,
        handler: async (response: any) => {
          try {
            setProcessing(true);
            setError(null);

            const verifyResult = await profilePurchaseService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setSuccess(
              `🎉 ${verifyResult.unlockedCandidateIds.length} profile${
                verifyResult.unlockedCandidateIds.length > 1 ? 's' : ''
              } unlocked successfully!`
            );

            // Notify parent, then close
            setTimeout(() => {
              onSuccess(verifyResult.unlockedCandidateIds);
              onClose();
            }, 1500);
          } catch (err: any) {
            console.error('[ProfilePurchase] Verification failed:', err);
            setError(
              err?.response?.data?.message ||
                'Payment verification failed. If money was deducted, it will be credited back or unlocks will activate shortly via webhook. Please contact support if issue persists.'
            );
            setProcessing(false);
          }
        },
        prefill: {
          name: authUser?.name || '',
          email: authUser?.email || '',
          contact: (authUser as any)?.phone || '',
        },
        notes: {
          purchaseType: 'profile_purchase',
          purchaseId: order.purchaseId,
        },
        theme: {
          color: '#42326E',
        },
        modal: {
          ondismiss: () => {
            console.log('[ProfilePurchase] Payment modal dismissed by user');
            setProcessing(false);
            setError(null);
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
        console.error('[ProfilePurchase] Payment failed:', response.error);
        const errorDesc =
          response.error?.description || 'Payment failed. Please try again.';
        const errorCode = response.error?.code || '';
        const errorReason = response.error?.reason || '';

        let userMessage = errorDesc;
        if (
          errorCode === 'BAD_REQUEST_ERROR' &&
          errorReason === 'payment_cancelled'
        ) {
          userMessage = 'Payment was cancelled. You can try again anytime.';
        }

        setError(userMessage);
        setProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('[ProfilePurchase] Checkout error:', err);
      // Backend may return 409 if all selected are already owned
      if (err?.response?.status === 409) {
        setError(
          err?.response?.data?.message ||
            'You already own unlocks for all selected candidates.'
        );
      } else {
        setError(
          err?.response?.data?.message ||
            'Failed to initiate purchase. Please try again.'
        );
      }
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !processing) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ─── Header ─── */}
        <div className="px-6 py-5 border-b border-[#E8E3EF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EDE6FA] flex items-center justify-center">
              <Unlock className="w-5 h-5 text-[#42326E]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#2C1B57]">
                Unlock Candidate Profiles
              </h2>
              <p className="text-xs text-[#6F687A] mt-0.5">
                Pay per profile · Instant unlock · Never expires
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !processing && onClose()}
            disabled={processing}
            className="p-2 rounded-xl hover:bg-[#F8F5FF] text-[#6F687A] hover:text-[#2C1B57] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Body (scrollable) ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Loading */}
          {loadingPricing && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#42326E]" />
              <p className="text-xs text-[#6F687A] font-semibold">
                Loading pricing...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-red-700 font-semibold">{error}</p>
                {!processing && (
                  <button
                    onClick={() => {
                      setError(null);
                      setRetryCount((c) => c + 1);
                    }}
                    className="mt-2 text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-700 font-semibold flex-1">
                {success}
              </span>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            </div>
          )}

          {!loadingPricing && pricing && !pricing.enabled && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-800">
                  Profile purchases are currently disabled
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  The administrator has temporarily disabled this feature. Please
                  try again later.
                </p>
              </div>
            </div>
          )}

          {/* Selected Candidates */}
          {!loadingPricing && pricing && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#42326E]" />
                    <span className="text-xs font-bold text-[#2C1B57] uppercase tracking-wider">
                      Selected Profiles ({quantity})
                    </span>
                  </div>
                </div>

                {quantity === 0 ? (
                  <div className="p-4 bg-[#FCFCF7] border border-[#E8E3EF] rounded-2xl text-center">
                    <Lock className="w-6 h-6 text-[#B29CFE] mx-auto mb-2" />
                    <p className="text-xs text-[#6F687A] font-semibold">
                      No candidates selected. Close this modal and select
                      candidates to unlock.
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#E8E3EF] rounded-2xl divide-y divide-[#F0ECF5] max-h-56 overflow-y-auto">
                    {selectedCandidates.map((c) => (
                      <div
                        key={c._id}
                        className="px-4 py-2.5 flex items-center gap-3 bg-white"
                      >
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt={c.name || 'Candidate'}
                            className="w-8 h-8 rounded-full object-cover border border-[#E8E3EF]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#EDE6FA] flex items-center justify-center text-[11px] font-bold text-[#42326E]">
                            {(c.name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#2C1B57] truncate">
                            {c.name || 'Candidate'}
                          </p>
                          {c.jobTitle && (
                            <p className="text-[10px] text-[#6F687A] truncate">
                              {c.jobTitle}
                            </p>
                          )}
                        </div>
                        <Lock className="w-3.5 h-3.5 text-[#B29CFE] shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-[#FCFCF7] border border-[#E8E3EF] rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-[#42326E]" />
                  <span className="text-xs font-bold text-[#2C1B57] uppercase tracking-wider">
                    Order Summary
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6F687A] font-semibold">
                    Price per profile
                  </span>
                  <span className="font-bold text-[#2C1B57]">
                    {currencySymbol}
                    {(unitPriceInPaise / 100).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6F687A] font-semibold">Quantity</span>
                  <span className="font-bold text-[#2C1B57]">× {quantity}</span>
                </div>

                <div className="h-px bg-[#E8E3EF]" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#2C1B57]">
                    Total
                  </span>
                  <span className="text-2xl font-extrabold text-[#42326E]">
                    {currencySymbol}
                    {totalRupees.toLocaleString('en-IN')}
                  </span>
                </div>

                {pricing.minQuantity > 1 && quantity < pricing.minQuantity && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    Minimum purchase: {pricing.minQuantity} profiles
                  </p>
                )}
                {quantity > pricing.maxQuantity && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    Maximum purchase: {pricing.maxQuantity} profiles per order
                  </p>
                )}
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                {[
                  'Instant access to full candidate details',
                  'Download and view resumes securely',
                  'View contact details (phone & email)',
                  'Unlock never expires — yours forever',
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check
                        className="w-2.5 h-2.5 text-emerald-700"
                        strokeWidth={3}
                      />
                    </div>
                    <span className="text-xs text-[#49454F] font-semibold">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="px-6 py-4 border-t border-[#E8E3EF] bg-[#FCFCF7] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] text-[#6F687A] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Secured by Razorpay
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => !processing && onClose()}
              disabled={processing}
              className="px-4 py-2.5 text-xs font-bold text-[#6F687A] hover:text-[#2C1B57] hover:bg-white rounded-xl border border-[#E8E3EF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!canPurchase}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#42326E] hover:bg-[#322554] rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Pay {currencySymbol}
                  {totalRupees.toLocaleString('en-IN')} & Unlock
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyProfilesModal;