import React, { useState, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { AppRoute, AuthUser } from '../types';
import { authService } from '../services/authService';
import {
  ShieldCheck,
  Smartphone,
  Mail,
  ArrowRight,
  CheckCircle2,
  Lock,
  RefreshCw,
  Building2,
  ArrowLeft,
  Sparkles,
  Check,
  AlertCircle,
  Inbox,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  onNavigate: (route: AppRoute) => void;
  onShowToast: (msg: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onNavigate,
  onShowToast,
}) => {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('98260 12345');
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let interval: any = null;
    if ((isPhoneOtpSent || isEmailOtpSent) && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => interval && clearInterval(interval);
  }, [isPhoneOtpSent, isEmailOtpSent, resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMessage(null);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) newDigits[i] = pasted[i] || '';
      setOtpDigits(newDigits);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (cleanPhone.length < 8) {
      setErrorMessage('Please enter a valid mobile number');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const fullPhone = `${countryCode}${cleanPhone}`;
      await authService.sendOtp({ phone: fullPhone });
      setIsPhoneOtpSent(true);
      setResendTimer(45);
      setOtpDigits(['', '', '', '', '', '']);
      onShowToast(`Demo OTP sent to ${countryCode} ${phoneNumber} — Use: 482910`);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress || !emailAddress.includes('@') || !emailAddress.includes('.')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await authService.sendOtp({ email: emailAddress });
      setIsEmailOtpSent(true);
      setResendTimer(45);
      setOtpDigits(['', '', '', '', '', '']);
      // ✅ Real email OTP — different toast message
      setSuccessMessage(`✓ Verification code sent to ${emailAddress}. Check your inbox (and spam folder).`);
      onShowToast(`📧 Verification email sent to ${emailAddress}`);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to send verification email. Please try again.';
      setErrorMessage(errMsg);
      onShowToast(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setResendTimer(45);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const payload =
        authMethod === 'phone'
          ? { phone: `${countryCode}${phoneNumber.replace(/\s+/g, '')}` }
          : { email: emailAddress };
      await authService.sendOtp(payload);

      if (authMethod === 'email') {
        setSuccessMessage(`✓ New code sent to ${emailAddress}`);
        onShowToast('📧 New verification code sent to your email!');
      } else {
        onShowToast('New 6-digit demo OTP sent — Use: 482910');
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to resend OTP';
      setErrorMessage(errMsg);
      onShowToast(errMsg);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const isPhone = authMethod === 'phone';
      const payload = isPhone
        ? {
            phone: `${countryCode}${phoneNumber.replace(/\s+/g, '')}`,
            otp: code,
          }
        : {
            email: emailAddress,
            otp: code,
          };

      const res = await authService.verifyOtp(payload);
      const backendUser = res.data.user;

      const authUser: AuthUser = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        phone: backendUser.phone,
        avatar: backendUser.avatar,
        role: 'recruiter',
        loginMethod: backendUser.loginMethod,
        companyName: backendUser.companyName,
        isVerified: backendUser.isVerified,
        verificationStatus: backendUser.verificationStatus,
        verificationSubmittedAt: backendUser.verificationSubmittedAt,
        verificationReviewedAt: backendUser.verificationReviewedAt,
        rejectionReason: backendUser.rejectionReason,
      };

      onShowToast(`🎉 Welcome ${backendUser.name || 'Recruiter'}! Login successful.`);
      onLoginSuccess(authUser);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Verification failed. Please try again.';
      setErrorMessage(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        const res = await authService.googleLogin(tokenResponse.access_token);
        const backendUser = res.data.user;

        const authUser: AuthUser = {
          id: backendUser.id,
          name: backendUser.name,
          email: backendUser.email,
          phone: backendUser.phone,
          avatar: backendUser.avatar,
          role: 'recruiter',
          loginMethod: 'google',
          companyName: backendUser.companyName,
          isVerified: backendUser.isVerified,
          verificationStatus: backendUser.verificationStatus,
          verificationSubmittedAt: backendUser.verificationSubmittedAt,
          verificationReviewedAt: backendUser.verificationReviewedAt,
          rejectionReason: backendUser.rejectionReason,
        };

        onShowToast(`🎉 Welcome ${backendUser.name}! Google login successful.`);
        onLoginSuccess(authUser);
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || 'Google authentication failed.');
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => {
      setErrorMessage('Google authentication was cancelled or failed');
    },
  });

  const handleFillDemo = () => {
    setPhoneNumber('98260 12345');
    setOtpDigits(['4', '8', '2', '9', '1', '0']);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#FCFCF7] text-[#29233A] flex flex-col justify-between selection:bg-[#EDE6FA] selection:text-[#322554] relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#EDE6FA]/50 via-[#F7F4FA]/20 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#B29CFE]/10 blur-[140px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="px-6 sm:px-10 lg:px-16 py-5 flex items-center justify-between z-10">
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 font-extrabold text-xl text-[#2C1B57] cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2C1B57] via-[#42326E] to-[#B29CFE] relative flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
            <div className="w-3.5 h-3.5 border-2 border-white border-t-0 rounded-b-xs" />
            <div className="absolute top-2 w-3.5 h-0.5 bg-white rounded-full" />
          </div>
          <span className="tracking-tight text-xl font-extrabold text-[#2C1B57]">
            Verihire
          </span>
        </div>

        <button
          onClick={() => onNavigate('landing')}
          className="text-xs font-bold text-[#49454F] hover:text-[#2C1B57] flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 z-10 max-w-[1360px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 w-full bg-white rounded-3xl sm:rounded-[36px] border border-[#E8E3EF] shadow-[0_24px_64px_-16px_rgba(44,27,87,0.12)] overflow-hidden">
          {/* Left Showcase Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#2C1B57] via-[#352269] to-[#42326E] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-radial from-[#B29CFE]/30 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-radial from-[#7CE0B0]/20 to-transparent blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/90 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#7CE0B0]" />
                <span>Encrypted 2FA & Multi-Factor Access</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                  Welcome to the future of verified recruiting.
                </h2>
                <p className="text-sm text-white/70 mt-3 leading-relaxed">
                  Sign in as a recruiter using your Google account, email, or mobile OTP to access your live pipeline and verified candidate pool.
                </p>
              </div>

              {/* Feature Bullets */}
              <div className="space-y-3.5 pt-2">
                {[
                  {
                    title: 'Passwordless Security',
                    desc: 'One-Time Passcodes via SMS or encrypted email',
                  },
                  {
                    title: 'UIDAI & EPFO Verified Pool',
                    desc: 'Every candidate identity-checked before scheduling',
                  },
                  {
                    title: 'Real-Time Google OAuth Sync',
                    desc: 'Seamless interview syncing with Google Meet & Calendar',
                  },
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{feat.title}</div>
                      <div className="text-[11px] text-white/60">{feat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
              <p className="text-xs text-white/80 italic leading-relaxed">
                "Verihire cut our screening time from 3 weeks down to 48 hours. Zero fake profiles guaranteed."
              </p>
              <div className="text-xs font-bold text-white mt-2">
                Head of Talent Acquisition • Aurelia Health
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div className="max-w-md mx-auto w-full space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-[#6F687A] uppercase tracking-wider">
                    Recruiter Portal Access
                  </span>

                  {/* Recruiter Badge */}
                  <div className="flex items-center gap-1.5 bg-[#2C1B57] text-white px-3 py-1 rounded-lg shadow-xs">
                    <Building2 className="w-3 h-3" />
                    <span className="text-xs font-bold">Recruiter</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
                  Recruiter & Employer Login
                </h1>
                <p className="text-xs sm:text-sm text-[#6F687A] mt-1">
                  Access candidate pipelines, interviews, and verified listings.
                </p>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-white border border-[#E8E3EF] hover:border-[#B29CFE] hover:bg-[#FCFCF7] text-xs sm:text-sm font-bold text-[#2C1B57] rounded-2xl shadow-xs transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>
                  {isSubmitting ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[#E8E3EF]" />
                <span className="bg-white px-3 text-[11px] font-bold text-[#6F687A] uppercase tracking-wider absolute">
                  or sign in with OTP
                </span>
              </div>

              {/* Method Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F4FA] rounded-2xl border border-[#E8E3EF]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('phone');
                    setIsPhoneOtpSent(false);
                    setIsEmailOtpSent(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setOtpDigits(['', '', '', '', '', '']);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    authMethod === 'phone'
                      ? 'bg-[#2C1B57] text-white shadow-xs'
                      : 'text-[#49454F] hover:text-[#2C1B57]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile Number
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('email');
                    setIsPhoneOtpSent(false);
                    setIsEmailOtpSent(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setOtpDigits(['', '', '', '', '', '']);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    authMethod === 'email'
                      ? 'bg-[#2C1B57] text-white shadow-xs'
                      : 'text-[#49454F] hover:text-[#2C1B57]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Work Email
                </button>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Alert (for email OTP sent confirmation) */}
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 animate-in fade-in duration-150">
                  <Inbox className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* PHONE FLOW */}
              {authMethod === 'phone' && (
                <div>
                  {!isPhoneOtpSent ? (
                    <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#49454F] mb-1.5">
                          Mobile Phone Number *
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="bg-[#FCFCF7] border border-[#E8E3EF] rounded-xl px-2.5 py-2.5 text-xs font-bold text-[#2C1B57] focus:outline-hidden focus:border-[#42326E]"
                          >
                            <option value="+91">🇮🇳 +91 (IN)</option>
                            <option value="+1">🇺🇸 +1 (US)</option>
                            <option value="+44">🇬🇧 +44 (UK)</option>
                            <option value="+971">🇦🇪 +971 (UAE)</option>
                            <option value="+65">🇸🇬 +65 (SG)</option>
                          </select>

                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Enter 10-digit mobile number"
                            className="flex-1 py-2.5 px-3.5 text-xs sm:text-sm bg-[#FCFCF7] border border-[#E8E3EF] rounded-xl font-medium focus:outline-hidden focus:border-[#42326E]"
                            autoFocus
                          />
                        </div>
                        <p className="text-[11px] text-[#6F687A] mt-1.5 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          Demo mode: use OTP <strong className="text-emerald-700">482910</strong>
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-[#42326E] hover:bg-[#322554] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Requesting OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Get Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form
                      onSubmit={handleVerifyOtp}
                      className="space-y-4 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#E8E3EF]">
                        <div>
                          <div className="text-xs font-bold text-[#2C1B57]">
                            Enter 6-Digit SMS Code
                          </div>
                          <div className="text-[11px] text-[#6F687A]">
                            Sent to {countryCode} {phoneNumber}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPhoneOtpSent(false);
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className="text-xs text-[#42326E] font-bold hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      <div>
                        <div
                          className="flex items-center justify-between gap-2"
                          onPaste={handleOtpPaste}
                        >
                          {otpDigits.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => {
                                otpRefs.current[i] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              className="w-11 h-13 sm:w-13 sm:h-14 text-center text-lg sm:text-xl font-mono font-extrabold text-[#2C1B57] bg-[#FCFCF7] border border-[#E8E3EF] rounded-xl focus:border-[#42326E] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EDE6FA] transition-all"
                            />
                          ))}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-semibold">
                            Demo OTP: 482910
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setOtpDigits(['4', '8', '2', '9', '1', '0'])
                            }
                            className="text-[#42326E] font-bold hover:underline"
                          >
                            Auto-fill OTP
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#6F687A] pt-1">
                        <span>Didn't receive the SMS?</span>
                        {resendTimer > 0 ? (
                          <span className="font-semibold text-[#49454F]">
                            Resend code in {resendTimer}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-[#42326E] font-bold hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Resend OTP
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || otpDigits.join('').length < 6}
                        className="w-full py-3 bg-[#42326E] hover:bg-[#322554] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify & Sign in</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* EMAIL FLOW */}
              {authMethod === 'email' && (
                <div>
                  {!isEmailOtpSent ? (
                    <form onSubmit={handleSendEmailOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#49454F] mb-1.5">
                          Work Email Address *
                        </label>
                        <input
                          type="email"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="e.g. name@company.com"
                          className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-[#FCFCF7] border border-[#E8E3EF] rounded-xl font-medium focus:outline-hidden focus:border-[#42326E]"
                          autoFocus
                          autoComplete="email"
                        />
                        {/* ✅ Real email OTP notice (not demo) */}
                        <p className="text-[11px] text-[#6F687A] mt-1.5 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-blue-600" />
                          We'll send a <strong className="text-blue-700">6-digit code</strong> to your email
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-[#42326E] hover:bg-[#322554] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sending code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Email</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form
                      onSubmit={handleVerifyOtp}
                      className="space-y-4 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#E8E3EF]">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#2C1B57]">
                            Enter Email Verification Code
                          </div>
                          <div className="text-[11px] text-[#6F687A] truncate max-w-[220px]">
                            Sent to {emailAddress}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEmailOtpSent(false);
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className="text-xs text-[#42326E] font-bold hover:underline ml-2 shrink-0"
                        >
                          Change
                        </button>
                      </div>

                      <div>
                        <div
                          className="flex items-center justify-between gap-2"
                          onPaste={handleOtpPaste}
                        >
                          {otpDigits.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => {
                                otpRefs.current[i] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              className="w-11 h-13 sm:w-13 sm:h-14 text-center text-lg sm:text-xl font-mono font-extrabold text-[#2C1B57] bg-[#FCFCF7] border border-[#E8E3EF] rounded-xl focus:border-[#42326E] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EDE6FA] transition-all"
                              autoFocus={i === 0}
                            />
                          ))}
                        </div>

                        {/* ✅ Real email OTP - no demo hint */}
                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#6F687A]">
                          <Inbox className="w-3 h-3 text-blue-600" />
                          <span>
                            Check your inbox — the code expires in <strong>5 minutes</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#6F687A] pt-1">
                        <span>Didn't receive email? Check spam</span>
                        {resendTimer > 0 ? (
                          <span className="font-semibold text-[#49454F]">
                            Resend in {resendTimer}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-[#42326E] font-bold hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Resend Code
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || otpDigits.join('').length < 6}
                        className="w-full py-3 bg-[#42326E] hover:bg-[#322554] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify & Sign in</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Quick Demo Fill (only for phone) */}
              {authMethod === 'phone' && (
                <div className="pt-2 border-t border-[#E8E3EF]">
                  <div className="flex items-center justify-between text-[11px] text-[#6F687A] mb-1.5">
                    <span className="font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#B29CFE]" /> Quick Demo Account:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="w-full py-1.5 px-2 bg-[#FCFCF7] hover:bg-[#EDE6FA] text-[11px] font-bold text-[#2C1B57] rounded-lg border border-[#E8E3EF] transition-colors"
                  >
                    ⚡ Auto-Fill Recruiter Demo Phone
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Footer Note */}
            <div className="pt-6 border-t border-[#E8E3EF] text-center text-xs text-[#6F687A]">
              By continuing, you agree to Verihire's{' '}
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="text-[#2C1B57] font-semibold underline"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="text-[#2C1B57] font-semibold underline"
              >
                Privacy Notice
              </button>
              .
            </div>
          </div>
        </div>
      </main>

      {/* Footer Legal Strip */}
      <footer className="py-4 text-center text-[11px] text-[#6F687A] z-10">
        © 2026 Verihire Talent Technologies Inc. • 256-Bit SSL Cryptographic Encryption
      </footer>
    </div>
  );
};