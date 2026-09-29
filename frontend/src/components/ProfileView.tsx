import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Briefcase, Building2, Lock, Check, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import type { AuthUser } from '../types';

interface ProfileViewProps {
  onShowToast: (msg: string) => void;
  onUserUpdate?: (user: AuthUser) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onShowToast, onUserUpdate }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    companyName: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const me = await authService.fetchMe();
        if (me) {
          setUser(me);
          setForm({
            name: me.name || '',
            email: me.email || '',
            phone: me.phone || '',
            designation: me.designation || '',
            companyName: me.companyName || '',
          });
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        name: form.name,
        designation: form.designation,
        companyName: form.companyName,
      };
      // Only send unlocked fields
      if (user.lockedField !== 'email') payload.email = form.email;
      if (user.lockedField !== 'phone') payload.phone = form.phone;

      const updated = await authService.updateProfile(payload);
      if (updated) {
        setUser(updated);
        onUserUpdate?.(updated);
        onShowToast('Profile updated successfully!');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update profile';
      setError(msg);
      onShowToast(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-[#42326E] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-sm text-[#6F687A]">
        Unable to load profile. Please try logging in again.
      </div>
    );
  }

  const isEmailLocked = user.lockedField === 'email';
  const isPhoneLocked = user.lockedField === 'phone';

  const loginMethodLabel =
    user.loginMethod === 'google'
      ? 'Google Sign-In'
      : user.loginMethod === 'phone_otp'
      ? 'Phone Number OTP'
      : 'Email OTP';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
          My Profile
        </h1>
        <p className="text-sm text-[#6F687A] mt-1">
          Manage your personal recruiter information. Signed in via{' '}
          <span className="font-bold text-[#42326E]">{loginMethodLabel}</span>.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Avatar + Meta */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E3EF] shadow-xs flex items-center gap-4">
        {user.avatar?.url ? (
          <img
            src={user.avatar.url}
            alt={user.name || 'Profile'}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#E8E3EF]"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#2C1B57] text-white font-bold text-xl flex items-center justify-center">
            {(user.name || 'R').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-lg font-extrabold text-[#2C1B57] truncate">
            {user.name || 'Add your name'}
          </div>
          <div className="text-xs text-[#6F687A] truncate">
            {user.email || user.phone || '—'}
          </div>
          {user.isVerified && (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check className="w-3 h-3" />
              Verified Recruiter
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E3EF] shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-[#2C1B57]">Personal Information</h2>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-[#2C1B57] mb-1.5 flex items-center gap-1.5">
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
          <label className="block text-xs font-bold text-[#2C1B57] mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Email Address
            {isEmailLocked && (
              <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => !isEmailLocked && handleChange('email', e.target.value)}
            readOnly={isEmailLocked}
            placeholder={isEmailLocked ? '' : 'you@company.com'}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
              isEmailLocked
                ? 'bg-[#F5F2FA] border-[#E8E3EF] text-[#6F687A] cursor-not-allowed'
                : 'border-[#E8E3EF] text-[#2C1B57] focus:outline-none focus:border-[#42326E]'
            }`}
          />
          {isEmailLocked && (
            <p className="text-[11px] text-[#6F687A] mt-1">
              Email is locked because you signed in with {loginMethodLabel}.
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-[#2C1B57] mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Phone Number
            {isPhoneLocked && (
              <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => !isPhoneLocked && handleChange('phone', e.target.value)}
            readOnly={isPhoneLocked}
            placeholder={isPhoneLocked ? '' : '+91XXXXXXXXXX'}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
              isPhoneLocked
                ? 'bg-[#F5F2FA] border-[#E8E3EF] text-[#6F687A] cursor-not-allowed'
                : 'border-[#E8E3EF] text-[#2C1B57] focus:outline-none focus:border-[#42326E]'
            }`}
          />
          {isPhoneLocked && (
            <p className="text-[11px] text-[#6F687A] mt-1">
              Phone number is locked because you signed in with {loginMethodLabel}.
            </p>
          )}
        </div>

        {/* Designation */}
        <div>
          <label className="block text-xs font-bold text-[#2C1B57] mb-1.5 flex items-center gap-1.5">
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
          <label className="block text-xs font-bold text-[#2C1B57] mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Company Name
          </label>
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="Your company name"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E8E3EF] text-sm text-[#2C1B57] focus:outline-none focus:border-[#42326E] transition-colors"
          />
          <p className="text-[11px] text-[#6F687A] mt-1">
            To edit the full company profile, go to <b>Company Profile</b>.
          </p>
        </div>

        <div className="pt-4 border-t border-[#E8E3EF] flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#42326E] hover:bg-[#322554] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};