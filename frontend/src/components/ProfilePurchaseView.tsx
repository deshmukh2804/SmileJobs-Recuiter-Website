import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Mail,
  Phone,
  FileText,
  Download,
  Copy,
  Check,
  UserCheck,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import {
  profilePurchaseService,
  ProfilePricing,
  RecruiterCredits,
  ProfilePurchase,
  UnlockedProfile,
} from '../services/profilePurchaseService';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const ProfilePurchaseView: React.FC = () => {
  const [pricing, setPricing] = useState<ProfilePricing | null>(null);
  const [credits, setCredits] = useState<RecruiterCredits | null>(null);
  const [purchases, setPurchases] = useState<ProfilePurchase[]>([]);
  const [unlockedProfiles, setUnlockedProfiles] = useState<UnlockedProfile[]>([]);
  const [quantity, setQuantity] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [refreshingProfiles, setRefreshingProfiles] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [pricingData, purchasesData, unlockedData] = await Promise.all([
        profilePurchaseService.getPricing().catch(() => ({
          price: 2,
          priceInPaise: 200,
          currency: 'INR',
          minQuantity: 1,
          maxQuantity: 100,
          enabled: true,
          description: 'Candidate Profile Direct Unlock',
        })),
        profilePurchaseService.getPurchases().catch(() => []),
        profilePurchaseService
          .getUnlockedProfiles()
          .catch(() => ({ profiles: [], totalUnlocked: 0, credits: null })),
      ]);

      if (pricingData) {
        setPricing(pricingData);
        if (pricingData.minQuantity && quantity < pricingData.minQuantity) {
          setQuantity(pricingData.minQuantity);
        }
      }

      if (unlockedData?.credits) {
        setCredits(unlockedData.credits);
      }

      if (Array.isArray(purchasesData)) {
        setPurchases(purchasesData);
      }

      if (unlockedData && Array.isArray(unlockedData.profiles)) {
        setUnlockedProfiles(unlockedData.profiles);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize profile purchase engine');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleRefreshProfiles = async () => {
    try {
      setRefreshingProfiles(true);
      setError(null);
      const res = await profilePurchaseService.getUnlockedProfiles();
      setUnlockedProfiles(res.profiles || []);
      if (res.credits) setCredits(res.credits);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh candidate profiles');
    } finally {
      setRefreshingProfiles(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadResume = (profile: UnlockedProfile) => {
    if (profile.resumeUrl) {
      window.open(profile.resumeUrl, '_blank', 'noopener,noreferrer');
    } else {
      profilePurchaseService.openResumeInNewTab(profile.candidateId);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async () => {
    try {
      setProcessing(true);
      setError(null);
      setSuccessMsg(null);

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const orderData = await profilePurchaseService.createOrder(quantity);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Smile Jobs / VeriHire',
        description: `Purchase ${orderData.quantity} Candidate Profile Unlock Credits`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            setProcessing(true);
            const verifyRes = await profilePurchaseService.verifyPayment({
              purchaseId: orderData.purchaseId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.credits) {
              setCredits(verifyRes.credits);
            }

            setSuccessMsg(
              `Successfully purchased ${orderData.quantity} credits! Revealing candidates...`
            );

            const refreshed = await profilePurchaseService.getUnlockedProfiles();
            setUnlockedProfiles(refreshed.profiles || []);
            if (refreshed.credits) setCredits(refreshed.credits);

            const updatedPurchases = await profilePurchaseService.getPurchases();
            setPurchases(updatedPurchases);
          } catch (verifyErr: any) {
            setError(verifyErr.message || 'Payment verification failed');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate checkout');
      setProcessing(false);
    }
  };

  const unitPrice = Number(pricing?.price ?? 2);
  const totalCost = quantity * unitPrice;

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm animate-pulse">
          Connecting to Candidate Unlock Pool...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Direct Candidate Pool
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Unlock Candidate Profiles
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Purchase credits to automatically reveal candidate contact information (verified email,
            direct phone number) and download resumes directly from our verified candidate database.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Remaining Balance
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Unlock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">{credits?.balance ?? 0}</span>
            <span className="text-sm font-semibold text-slate-500">credits</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Auto-reveals candidates instantly when available
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Purchased
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">
              {credits?.totalPurchased ?? 0}
            </span>
            <span className="text-sm font-semibold text-slate-500">credits</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">All-time purchased unlocks</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Profiles Revealed
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">{unlockedProfiles.length}</span>
            <span className="text-sm font-semibold text-slate-500">candidates</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Profiles successfully unlocked with contact info
          </p>
        </div>
      </div>

      {/* Main Grid: Purchase Form & Feature Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Purchase Configuration Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Choose Credit Quantity</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select how many candidate profiles you want to unlock from the pool.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Number of Profiles
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={pricing?.minQuantity || 1}
                max={pricing?.maxQuantity || 100}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="w-32 px-4 py-3 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      quantity === preset
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Minimum: {pricing?.minQuantity || 1} credit, Maximum:{' '}
              {pricing?.maxQuantity || 100} credits per transaction
            </p>
          </div>

          {/* Pricing Breakdown */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Cost
              </span>
              <div className="text-3xl font-black text-slate-900">
                ₹{Number(totalCost || 0).toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Unit Cost
              </span>
              <div className="text-base font-bold text-blue-600">
                ₹{Number(unitPrice || 0).toFixed(2)} / profile
              </div>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={processing || (pricing ? !pricing.enabled : false)}
            className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-base shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>
                  Proceed to Secure Checkout (₹{Number(totalCost || 0).toFixed(2)})
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Value Proposition Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-8 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Why Purchase Profile Credits?</h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Direct Contact Access</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Reveal verified candidate emails and phone numbers instantly.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Secure Resume Downloads</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Stream and download candidate resumes directly with one click.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Credits Never Expire</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Buy credits now and use them whenever you need to hire.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Subscription Independent</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Works independently without requiring active monthly subscriptions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <span className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              Secured via Razorpay Checkout • SSL Certified
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION: YOUR UNLOCKED CANDIDATE PROFILES                */}
      {/* ========================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Your Unlocked Candidate Profiles
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Candidate contact details revealed using your purchased credits from our candidate
              pool.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              {unlockedProfiles.length} revealed
            </span>
            <button
              onClick={handleRefreshProfiles}
              disabled={refreshingProfiles}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshingProfiles ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {unlockedProfiles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No Candidate Profiles Unlocked Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
              Purchase credits above to automatically unlock real candidate profiles from our
              verified candidate database.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlockedProfiles.map((profile, idx) => (
              <div
                key={profile.candidateId || profile._id || idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4">
                    {profile.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt={profile.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 truncate">
                          {profile.name || 'Verified Candidate'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider">
                          Unlocked
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {profile.headline || 'Candidate'}
                      </p>
                      {profile.location && profile.location !== 'Location not specified' && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{profile.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills badges */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {profile.skills.slice(0, 4).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {profile.skills.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">
                          +{profile.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Unlocked Contact Details Box */}
                <div className="p-6 pt-0 space-y-3">
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70 space-y-2.5">
                    {/* Email */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate select-all">
                          {profile.email || 'Email not provided'}
                        </span>
                      </div>
                      {profile.email && (
                        <button
                          onClick={() => handleCopy(profile.email, `email-${idx}`)}
                          className="p-1 text-slate-400 hover:text-emerald-700 transition-colors"
                          title="Copy Email"
                        >
                          {copiedId === `email-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate select-all">
                          {profile.phone || 'Phone not provided'}
                        </span>
                      </div>
                      {profile.phone && (
                        <button
                          onClick={() => handleCopy(profile.phone, `phone-${idx}`)}
                          className="p-1 text-slate-400 hover:text-emerald-700 transition-colors"
                          title="Copy Phone"
                        >
                          {copiedId === `phone-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Resume Download Action */}
                  {profile.hasResume || profile.resumeUrl ? (
                    <button
                      onClick={() => handleDownloadResume(profile)}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Resume PDF</span>
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs text-center flex items-center justify-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>No Resume Uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Purchase Transaction History</h3>
            <p className="text-xs text-slate-500 mt-0.5">Records of all credit acquisitions</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            {purchases.length} purchases
          </span>
        </div>

        {purchases.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No transaction records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transaction Date</th>
                  <th className="py-3 px-4">Order Reference</th>
                  <th className="py-3 px-4">Purchased Credits</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((p, idx) => {
                  const rawAmount =
                    p.totalAmount ??
                    (p as any).amountInRupees ??
                    ((p as any).amount ? (p as any).amount / 100 : 0);
                  const safeAmount =
                    typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 0;
                  const safeQty = p.quantity ?? (p as any).creditsPurchased ?? 1;
                  const safeDate = p.purchasedAt || p.createdAt || new Date().toISOString();

                  return (
                    <tr key={p._id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {new Date(safeDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {p.razorpayOrderId || p._id || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600">+{safeQty}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{safeAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.paymentStatus === 'completed' ||
                            (p as any).status === 'completed' ||
                            (p as any).status === 'captured'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.paymentStatus === 'pending' ||
                                (p as any).status === 'created'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.paymentStatus || (p as any).status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePurchaseView;