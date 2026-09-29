import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Lock,
  Check,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { authService } from '../services/authService';
import type { AuthUser } from '../types';

interface SettingsViewProps {
  onResetData: () => void;
  onShowToast: (msg: string) => void;
  onUserUpdate?: (user: AuthUser) => void;
}

// ✅ Helper: detect legacy fake phone-generated email pattern
const isFakePhoneEmail = (email?: string): boolean => {
  if (!email) return false;
  return String(email).includes('@phone.verihire.local');
};

// ✅ CRITICAL: Derive locked field from loginMethod
// This is the SINGLE source of truth — never trust just `lockedField`
// because old cached data may not have it.
//
// RULES:
//   phone_otp  → phone LOCKED, email editable
//   google     → email LOCKED, phone editable
//   email_otp  → email LOCKED, phone editable
const deriveLockedField = (user?: AuthUser | null): 'phone' | 'email' | null => {
  if (!user) return null;

  // Prefer backend value if it's valid
  if (user.lockedField === 'phone' || user.lockedField === 'email') {
    return user.lockedField;
  }

  // Fallback: derive from loginMethod
  switch (user.loginMethod) {
    case 'phone_otp':
      return 'phone';
    case 'google':
    case 'email_otp':
      return 'email';
    default:
      return null;
  }
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  onResetData,
  onShowToast,
  onUserUpdate,
}) => {
  // ═══ Personal Profile State ═══
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    companyName: '',
  });

  // ✅ On mount: ALWAYS fetch fresh data from server
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setProfileError(null);
        const me = await authService.fetchMe();
        if (me) {
          setUser(me);
          setForm({
            name: me.name || '',
            email: isFakePhoneEmail(me.email) ? '' : (me.email || ''),
            phone: me.phone || '',
            designation: me.designation || '',
            companyName: me.companyName || '',
          });
        }
      } catch (err: any) {
        setProfileError(
          err?.response?.data?.message || 'Failed to load profile'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileError(null);
    setSaving(true);

    const lockedField = deriveLockedField(user);

    try {
      const payload: Record<string, string> = {
        name: form.name.trim(),
        designation: form.designation.trim(),
        companyName: form.companyName.trim(),
      };

      // ✅ Only send unlocked fields to backend
      if (lockedField !== 'email') {
        payload.email = form.email.trim();
      }
      if (lockedField !== 'phone') {
        payload.phone = form.phone.trim();
      }

      const updated = await authService.updateProfile(payload);

      if (updated) {
        setUser(updated);
        setForm({
          name: updated.name || '',
          email: isFakePhoneEmail(updated.email) ? '' : (updated.email || ''),
          phone: updated.phone || '',
          designation: updated.designation || '',
          companyName: updated.companyName || '',
        });
        onUserUpdate?.(updated);
        onShowToast('Profile updated successfully!');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update profile';
      setProfileError(msg);
      onShowToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name || name.trim() === '') return 'R';
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // ═══ Derived values ═══
  const lockedField = deriveLockedField(user);
  const isEmailLocked = lockedField === 'email';
  const isPhoneLocked = lockedField === 'phone';

  const loginMethodLabel = user
    ? user.loginMethod === 'google'
      ? 'Google Sign-In'
      : user.loginMethod === 'phone_otp'
      ? 'Phone Number OTP'
      : 'Email OTP'
    : '';

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-[#42326E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* ═══ Header ═══ */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-[#6F687A] mt-1">
          Manage your personal profile and account preferences.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CARD 1: PERSONAL PROFILE (Name / Email / Phone)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E3EF] shadow-xs space-y-5">
        <div className="flex items-center gap-3">
  {user?.avatar?.url ? (
    <img
      src={user.avatar.url}
      alt={user.name || 'Profile'}
      className="w-12 h-12 rounded-full object-cover border-2 border-[#E8E3EF]"
    />
  ) : (
    <div className="w-12 h-12 rounded-full bg-[#2C1B57] text-white font-bold text-sm flex items-center justify-center">
      {getInitials(user?.name)}
    </div>
  )}
  <div className="min-w-0 flex-1">
    <h2 className="text-sm font-bold text-[#2C1B57] flex items-center gap-2">
      <User className="w-4 h-4 text-[#42326E]" />
      My Profile
    </h2>
    <p className="text-[11px] text-[#6F687A] mt-0.5 flex items-center gap-2 flex-wrap">
      <span>
        Signed in via <b className="text-[#42326E]">{loginMethodLabel}</b>
      </span>
      {user?.isVerified && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
          <Check className="w-2.5 h-2.5" />
          Verified
        </span>
      )}
      {/* ✅ SUBSCRIPTION BADGE */}
      {user?.subscription?.tier && (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            user.subscription.tier === 'enterprise'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : user.subscription.tier === 'standard'
                ? 'bg-[#EDE6FA] text-[#42326E] border-[#D7C8ED]'
                : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          {user.subscription.tier === 'enterprise' && '👑'}
          {user.subscription.tier === 'standard' && '⚡'}
          {user.subscription.tier === 'basic' && '🛡️'}
          {user.subscription.name || user.subscription.tier}
        </span>
      )}
    </p>
  </div>
</div>

        {profileError && (
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-xs font-bold text-[#2C1B57] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E3EF] text-sm text-[#2C1B57] focus:outline-none focus:border-[#42326E] transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-bold text-[#2C1B57] mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email Address
              {isEmailLocked && (
                <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              )}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                if (!isEmailLocked) handleChange('email', e.target.value);
              }}
              readOnly={isEmailLocked}
              disabled={isEmailLocked}
              placeholder={isEmailLocked ? '' : 'you@company.com'}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                isEmailLocked
                  ? 'bg-[#F5F2FA] border-[#E8E3EF] text-[#6F687A] cursor-not-allowed'
                  : 'border-[#E8E3EF] text-[#2C1B57] focus:outline-none focus:border-[#42326E]'
              }`}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-bold text-[#2C1B57] mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone Number
              {isPhoneLocked && (
                <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              )}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => {
                if (!isPhoneLocked) handleChange('phone', e.target.value);
              }}
              readOnly={isPhoneLocked}
              disabled={isPhoneLocked}
              placeholder={isPhoneLocked ? '' : '+91XXXXXXXXXX'}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                isPhoneLocked
                  ? 'bg-[#F5F2FA] border-[#E8E3EF] text-[#6F687A] cursor-not-allowed'
                  : 'border-[#E8E3EF] text-[#2C1B57] focus:outline-none focus:border-[#42326E]'
              }`}
            />
          </div>

          {/* Designation */}
          <div>
            <label className="text-xs font-bold text-[#2C1B57] mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Designation
            </label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              placeholder="e.g., Talent Acquisition Lead"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E3EF] text-sm text-[#2C1B57] focus:outline-none focus:border-[#42326E] transition-colors"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="text-xs font-bold text-[#2C1B57] mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Company Name
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Your company name"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E3EF] text-sm text-[#2C1B57] focus:outline-none focus:border-[#42326E] transition-colors"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#E8E3EF] flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-2.5 bg-[#42326E] hover:bg-[#322554] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>



{/* ═══════════════════════════════════════════════════════
    CARD: SUBSCRIPTION STATUS
    ═══════════════════════════════════════════════════════ */}
{user?.subscription && (
  <div className={`p-6 sm:p-8 rounded-3xl border shadow-xs space-y-4 ${
    user.subscription.tier === 'enterprise'
      ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
      : user.subscription.tier === 'standard'
        ? 'bg-gradient-to-br from-[#F8F5FF] to-[#EDE6FA] border-[#D7C8ED]'
        : 'bg-white border-[#E8E3EF]'
  }`}>
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-bold text-[#2C1B57] flex items-center gap-2">
        {user.subscription.tier === 'enterprise' ? '👑' : user.subscription.tier === 'standard' ? '⚡' : '🛡️'}
        Subscription Plan
      </h2>
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
        user.subscription.status === 'active'
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          : 'bg-red-100 text-red-700 border border-red-200'
      }`}>
        {user.subscription.status === 'active' ? '✓ Active' : user.subscription.status}
      </span>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white/80 p-3 rounded-xl border border-white">
        <p className="text-[10px] font-bold text-[#6F687A] uppercase">Plan</p>
        <p className="text-sm font-extrabold text-[#2C1B57] mt-0.5 capitalize">{user.subscription.name}</p>
      </div>
      <div className="bg-white/80 p-3 rounded-xl border border-white">
        <p className="text-[10px] font-bold text-[#6F687A] uppercase">Jobs Used</p>
        <p className="text-sm font-extrabold text-[#2C1B57] mt-0.5">
          {user.usage?.jobsUsed || 0} / {user.usage?.jobLimit || 0}
        </p>
      </div>
      <div className="bg-white/80 p-3 rounded-xl border border-white">
        <p className="text-[10px] font-bold text-[#6F687A] uppercase">Remaining</p>
        <p className={`text-sm font-extrabold mt-0.5 ${
          (user.usage?.remainingJobs || 0) <= 2 ? 'text-red-600' : 'text-emerald-700'
        }`}>
          {user.usage?.remainingJobs || 0}
        </p>
      </div>
      <div className="bg-white/80 p-3 rounded-xl border border-white">
        <p className="text-[10px] font-bold text-[#6F687A] uppercase">Expires</p>
        <p className="text-sm font-extrabold text-[#2C1B57] mt-0.5">
          {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>

    {/* Usage Progress Bar */}
    {user.usage && user.usage.jobLimit > 0 && (
      <div>
        <div className="flex justify-between text-[10px] font-bold text-[#6F687A] mb-1">
          <span>Job Posting Usage</span>
          <span>{Math.round((user.usage.jobsUsed / user.usage.jobLimit) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden border border-white">
          <div
            className={`h-full rounded-full transition-all ${
              user.usage.jobsUsed / user.usage.jobLimit > 0.8
                ? 'bg-red-500'
                : user.usage.jobsUsed / user.usage.jobLimit > 0.5
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, (user.usage.jobsUsed / user.usage.jobLimit) * 100)}%` }}
          />
        </div>
      </div>
    )}
  </div>
)}


      {/* ═══════════════════════════════════════════════════════
          CARD 2: WORKSPACE MEMBERS (dynamic — real user)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E3EF] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#2C1B57] flex items-center gap-2">
          <Users className="w-4 h-4 text-[#42326E]" />
          Active Hiring Team (Workspace Access)
        </h2>

        <div className="space-y-3 text-xs">
          {user ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FCFCF7] border border-[#E8E3EF]">
              <div className="flex items-center gap-3 min-w-0">
                {user.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.name || 'Profile'}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#2C1B57] text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-[#2C1B57] truncate">
                    {user.name && user.name.trim()
                      ? `${user.name} (You)`
                      : 'You'}
                  </div>
                  <div className="text-[11px] text-[#6F687A] truncate">
                    {!isFakePhoneEmail(user.email) && user.email
                      ? user.email
                      : user.phone || ''}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 ml-2">
                Workspace Admin
              </span>
            </div>
          ) : (
            <div className="text-[#6F687A] text-center py-3">
              No workspace members yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};