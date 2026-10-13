import React, { useState, useEffect, useRef } from 'react';
import { AppRoute, Candidate, AuthUser, SubscriptionPlan } from '../types';
import { INITIAL_CANDIDATES } from '../mockData';
import { subscriptionService } from '../services/subscriptionService';
import {
  POLICIES,
  BIZ,
  fullAddress,
  PolicyType,
} from './landing/PolicyData';
import {
  ShieldCheck,
  Search,
  Zap,
  Briefcase,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  Check,
  X,
  Calendar,
  Menu,
  Mail,
  Phone,
  MapPinned,
  ChevronDown,
  ChevronUp,
  CreditCard,
  AlertCircle,
  Coins,
  Unlock,
  Download,
  Loader2,
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (route: AppRoute) => void;
  featuredCandidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onOpenInfo: (type: 'privacy' | 'terms' | 'contact' | 'refund' | 'shipping') => void;
  authUser: AuthUser | null;
}

// ═══════════════════════════════════════════════
// POLICY MODAL COMPONENT
// ═══════════════════════════════════════════════
const PolicyModal: React.FC<{
  type: Exclude<PolicyType, null>;
  onClose: () => void;
  onSwitchPolicy: (type: Exclude<PolicyType, null>) => void;
}> = ({ type, onClose, onSwitchPolicy }) => {
  const policy = POLICIES[type];
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAllExpanded(true);
    setExpandedSections(new Set(policy.sections.map((_, i) => i)));
    contentRef.current?.scrollTo({ top: 0 });
  }, [type, policy.sections]);

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(policy.sections.map((_, i) => i)));
    }
    setAllExpanded(!allExpanded);
  };

  const policyTabs: { key: Exclude<PolicyType, null>; label: string }[] = [
    { key: 'privacy', label: 'Privacy' },
    { key: 'terms', label: 'Terms' },
    { key: 'refund', label: 'Refunds' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'contact', label: 'Contact' },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={policy.title}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#2C1B57] to-[#42326E] text-white px-4 sm:px-8 py-5 sm:py-6 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                {policy.icon}
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-extrabold">{policy.title}</h2>
                {policy.effectiveDate && (
                  <p className="text-xs text-white/70 mt-0.5">
                    Effective: {policy.effectiveDate} · Updated: {policy.lastUpdated}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
            {policyTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSwitchPolicy(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  type === tab.key
                    ? 'bg-white text-[#2C1B57] shadow-sm'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={contentRef} className="overflow-y-auto flex-1 px-4 sm:px-8 py-5 sm:py-6">
          <div className="bg-[#F7F4FA] border border-[#E8E3EF] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#42326E] shrink-0" />
            <div className="text-xs text-[#49454F] leading-relaxed">
              <strong className="text-[#2C1B57]">{BIZ.brandName}</strong> is operated by{' '}
              <strong className="text-[#2C1B57]">{BIZ.legalName}</strong> ({BIZ.type}) from{' '}
              {BIZ.address.city}, {BIZ.address.state}, India. All payments are securely processed by Razorpay.
            </div>
          </div>

          <p className="text-sm text-[#49454F] leading-relaxed mb-6">{policy.intro}</p>

          <div className="flex items-center justify-end mb-3">
            <button
              type="button"
              onClick={toggleAll}
              className="text-[11px] font-bold text-[#42326E] flex items-center gap-1 hover:underline"
            >
              {allExpanded ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Collapse All</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Expand All</>
              )}
            </button>
          </div>

          <div className="space-y-2">
            {policy.sections.map((section, idx) => {
              const isOpen = expandedSections.has(idx);
              return (
                <div key={idx} className="border border-[#E8E3EF] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection(idx)}
                    className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-[#FCFCF7] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-bold text-[#2C1B57]">{section.heading}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#6F687A] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6F687A] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 pt-1">
                      <p className="text-sm text-[#49454F] leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-[#2C1B57] rounded-2xl p-5 sm:p-6 text-white">
            <h3 className="text-sm font-extrabold mb-4">Need Help? Contact Us Directly</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-[#B29CFE] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-white/90">Email</p>
                  <a href={`mailto:${BIZ.email}`} className="text-[#B29CFE] hover:text-white break-all">
                    {BIZ.email}
                  </a>
                  <br />
                  <a href={`mailto:${BIZ.supportEmail}`} className="text-[#B29CFE] hover:text-white">
                    {BIZ.supportEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-[#B29CFE] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-white/90">Phone</p>
                  <a href={`tel:${BIZ.phone.replace(/\s/g, '')}`} className="text-[#B29CFE] hover:text-white">
                    {BIZ.phone}
                  </a>
                  <p className="text-white/60 mt-1">{BIZ.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPinned className="w-4 h-4 text-[#B29CFE] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-white/90">Address</p>
                  <p className="text-white/70">{BIZ.address.line1}</p>
                  <p className="text-white/70">{BIZ.address.line2}</p>
                  <p className="text-white/70">
                    {BIZ.address.city} – {BIZ.address.pincode}
                  </p>
                </div>
              </div>
            </div>

            {type === 'contact' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/15">
                <a
                  href={`mailto:${BIZ.email}`}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#2C1B57] rounded-xl font-bold text-sm hover:bg-[#FCFCF7] transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email Us Now
                </a>
                <a
                  href={`tel:${BIZ.phone.replace(/\s/g, '')}`}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call Us Now
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-8 py-4 border-t border-[#E8E3EF] bg-[#FCFCF7] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-[#6F687A] text-center sm:text-left">
            © {new Date().getFullYear()} {BIZ.brandName} · {BIZ.legalName} · {BIZ.address.city}, {BIZ.address.state}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 text-[11px] font-bold text-[#42326E] hover:bg-[#EDE6FA] rounded-lg transition-colors"
            >
              Back to Top
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#42326E] text-white rounded-lg text-xs font-bold hover:bg-[#322554] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
// APP LOGO COMPONENT
// ═══════════════════════════════════════════════
const AppLogo = ({ className = 'w-8 h-8' }: { className?: string }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  if (logoFailed) {
    return (
      <div className={`${className} rounded-xl bg-gradient-to-br from-[#42326E] to-[#2C1B57] flex items-center justify-center text-white font-extrabold shadow-md shrink-0`}>
        <span style={{ fontSize: '0.4em' }}>SJ</span>
      </div>
    );
  }
  return (
    <img
      src="/logo.png"
      alt="Smile Jobs"
      className={`object-contain shrink-0 ${className}`}
      style={{ display: 'inline-block', minWidth: '1rem', minHeight: '1rem' }}
      onError={() => setLogoFailed(true)}
    />
  );
};

// ═══════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════
const getInitials = (name: string): string =>
  name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// ═══════════════════════════════════════════════
// MAIN LANDING VIEW COMPONENT
// ═══════════════════════════════════════════════
export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  featuredCandidates,
  onSelectCandidate,
  onOpenInfo,
  authUser,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activePreviewTab, setActivePreviewTab] = useState<'pipeline' | 'audit' | 'velocity'>('pipeline');
  const [talentRoleFilter, setTalentRoleFilter] = useState<'all' | 'Design' | 'Engineering' | 'Analytics' | 'Product'>('all');
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<number>(0);
  const [activePolicyModal, setActivePolicyModal] = useState<PolicyType>(null);

  // ✅ LIVE SUBSCRIPTION PLANS from backend
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Fetch live subscription plans from backend
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlansLoading(true);
        setPlansError(null);
        const livePlans = await subscriptionService.listPlans();
        setPlans(livePlans || []);
      } catch (err: any) {
        console.warn('Could not fetch subscription plans', err);
        setPlansError('Live pricing temporarily unavailable');
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };
    loadPlans();
  }, []);

  useEffect(() => {
    if (activePolicyModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activePolicyModal]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 1024) return;
    const rect = heroRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: px * 2, y: -py * 2 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const openPolicy = (type: Exclude<PolicyType, null>) => {
    setActivePolicyModal(type);
  };

  const displayTalent = (authUser ? featuredCandidates : INITIAL_CANDIDATES).filter((c) => {
    if (talentRoleFilter === 'all') return true;
    if (talentRoleFilter === 'Design') return c.department === 'Design';
    if (talentRoleFilter === 'Engineering') return c.department === 'Engineering' || c.department === 'Infrastructure';
    if (talentRoleFilter === 'Analytics') return c.role.toLowerCase().includes('data') || c.role.toLowerCase().includes('analyst');
    if (talentRoleFilter === 'Product') return c.department === 'Product' || c.role.toLowerCase().includes('growth');
    return true;
  });

  const showcaseItems = [
    {
      title: 'Cryptographic Credential Audit',
      subtitle: 'Zero false resumes. Ever.',
      description: 'Every applicant is pre-verified against government ID records, corporate domain email confirmation, verified salary tax slips, and educational registrar databases before landing in your pipeline.',
      badge: '94.6% Trust Rating',
      icon: ShieldCheck,
      color: '#5F8A72',
      metrics: [
        { label: 'Government ID', value: '100% Cleared' },
        { label: 'Tenure Audits', value: 'Tax-matched' },
        { label: 'Degree Records', value: 'Registrar Verified' },
      ],
    },
    {
      title: 'Real-Time Pipeline Velocity',
      subtitle: '48 hours from post to shortlist',
      description: 'Move candidates dynamically between 6 automated stages. Trigger automated candidate alerts, panel calendar invites, and candidate feedback notes without leaving the board.',
      badge: '3.2x Faster Hiring',
      icon: Zap,
      color: '#42326E',
      metrics: [
        { label: 'Median Shortlist', value: '48 Hours' },
        { label: 'Time-to-Offer', value: '18 Days' },
        { label: 'Offer Acceptance', value: '88.2%' },
      ],
    },
    {
      title: 'Algorithmic Precision Match',
      subtitle: 'Skill-verified compatibility scoring',
      description: 'Our proprietary scoring engine analyzes authentic code repositories, verified design portfolios, and proven tenure to generate a transparent compatibility score for every opening.',
      badge: '96% Accuracy',
      icon: Sparkles,
      color: '#B29CFE',
      metrics: [
        { label: 'Role Alignment', value: 'Multi-factor' },
        { label: 'Availability', value: 'Real-time sync' },
        { label: 'Compensation Fit', value: 'Pre-aligned' },
      ],
    },
    {
      title: 'Frictionless Interview Sync',
      subtitle: 'Meet and Zoom in one click',
      description: "Say goodbye to 10-email scheduling chains. Candidates pick live panel slots directly synced with your hiring manager's Google Calendar and Microsoft Teams.",
      badge: 'Zero Scheduling Lag',
      icon: Calendar,
      color: '#C58A3A',
      metrics: [
        { label: 'Calendar Sync', value: 'Google / Zoom' },
        { label: 'Candidate Reschedule', value: 'Self-serve' },
        { label: 'Feedback Prompts', value: 'Instant' },
      ],
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="landing-page min-h-screen bg-[#FCFCF7] text-[#29233A] flex flex-col selection:bg-[#EDE6FA] selection:text-[#322554] overflow-x-hidden">
      <div className="landing-ambient pointer-events-none absolute inset-x-0 top-0 h-[820px]" aria-hidden="true" />

      {activePolicyModal && (
        <PolicyModal
          type={activePolicyModal}
          onClose={() => setActivePolicyModal(null)}
          onSwitchPolicy={(p) => setActivePolicyModal(p)}
        />
      )}

      {/* NAV */}
      <nav
        aria-label="Main navigation"
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FCFCF7]/90 backdrop-blur-xl border-b border-[#2C1B57]/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 xl:px-20 h-[74px] flex items-center justify-between gap-5">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 font-extrabold text-xl text-[#2C1B57] cursor-pointer group shrink-0"
            aria-label="Smile Jobs, go to home"
          >
            <AppLogo className="w-10 h-10 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300" />
            <span className="tracking-tight text-xl font-extrabold text-[#2C1B57]">Smile Jobs</span>
          </button>

          <div className="hidden lg:flex items-center gap-9 text-xs uppercase tracking-wider font-bold text-[#49454F]">
            {[
              { label: 'Platform', href: '#platform' },
              { label: 'Showcase', href: '#showcase' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Comparison', href: '#comparison' },
            ].map((link) => (
              <a key={link.href} href={link.href} className="hover:text-[#2C1B57] transition-colors relative py-1 group">
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
              </a>
            ))}
            <button onClick={() => onNavigate('candidates')} className="hover:text-[#2C1B57] transition-colors text-left relative py-1 group">
              Talent Directory
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
            </button>
            <button onClick={() => onNavigate('dashboard')} className="hover:text-[#2C1B57] transition-colors text-left relative py-1 group">
              Console
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {authUser ? (
              <button
                onClick={() => onNavigate('profile')}
                className="landing-profile-link flex items-center gap-2 rounded-full border border-[#DAD1E8] bg-white/85 py-1.5 pl-1.5 pr-3 text-xs font-bold text-[#2C1B57] shadow-sm transition-all hover:border-[#B29CFE] hover:shadow-md"
              >
                {authUser.avatar?.url ? (
                  <img src={authUser.avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2C1B57] text-white">
                    {(authUser.name || 'R').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:block max-w-28 truncate">{authUser.name || 'My profile'}</span>
              </button>
            ) : (
              <button onClick={() => onNavigate('login')} className="px-3 sm:px-4 py-2 text-xs md:text-sm font-bold text-[#2C1B57] hover:bg-white/80 rounded-xl transition-all">
                Sign in
              </button>
            )}
            <button
              onClick={() => onNavigate('post-job')}
              className="hidden sm:flex px-5 py-2.5 text-xs md:text-sm font-bold text-white bg-[#42326E] hover:bg-[#322554] rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 items-center gap-1.5"
            >
              <span>Post a Job Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen((o) => !o)}
              className="lg:hidden p-2 rounded-xl text-[#2C1B57] hover:bg-white"
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="lg:hidden border-t border-[#E8E3EF] bg-[#FCFCF7]/95 px-5 py-4 shadow-xl flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
            {[
              ['Platform', '#platform'],
              ['Showcase', '#showcase'],
              ['Pricing', '#pricing'],
              ['Comparison', '#comparison'],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMobileNavOpen(false)} className="px-3 py-3 rounded-xl text-sm font-semibold text-[#2C1B57] hover:bg-[#EDE6FA]">
                {label}
              </a>
            ))}
            <button onClick={() => { setMobileNavOpen(false); onNavigate('candidates'); }} className="px-3 py-3 rounded-xl text-left text-sm font-semibold text-[#2C1B57] hover:bg-[#EDE6FA]">
              Talent directory
            </button>
            <button onClick={() => { setMobileNavOpen(false); onNavigate('dashboard'); }} className="px-3 py-3 rounded-xl text-left text-sm font-semibold text-[#2C1B57] hover:bg-[#EDE6FA]">
              Recruiter console
            </button>
            <button onClick={() => { setMobileNavOpen(false); onNavigate('profile-purchase'); }} className="px-3 py-3 rounded-xl text-left text-sm font-semibold text-amber-700 hover:bg-amber-50">
              <Coins className="w-4 h-4 inline mr-2" /> Buy Profile Credits
            </button>
            <hr className="border-[#E8E3EF] my-1" />
            <button onClick={() => { setMobileNavOpen(false); openPolicy('privacy'); }} className="px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#6F687A] hover:bg-[#EDE6FA]">Privacy Policy</button>
            <button onClick={() => { setMobileNavOpen(false); openPolicy('terms'); }} className="px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#6F687A] hover:bg-[#EDE6FA]">Terms & Conditions</button>
            <button onClick={() => { setMobileNavOpen(false); openPolicy('refund'); }} className="px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#6F687A] hover:bg-[#EDE6FA]">Refund Policy</button>
            <button onClick={() => { setMobileNavOpen(false); openPolicy('shipping'); }} className="px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#6F687A] hover:bg-[#EDE6FA]">Shipping Policy</button>
            <button onClick={() => { setMobileNavOpen(false); openPolicy('contact'); }} className="px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#6F687A] hover:bg-[#EDE6FA]">Contact Us</button>
            <button onClick={() => { setMobileNavOpen(false); onNavigate('post-job'); }} className="mt-2 px-3 py-3 rounded-xl text-left text-sm font-semibold text-white bg-[#42326E]">
              Post a Job Free
            </button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative pt-14 sm:pt-20 lg:pt-24 pb-28 sm:pb-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center"
      >
        <div className="lg:col-span-6 space-y-7 sm:space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#DAD1E8] bg-white/75 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#42326E] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 landing-status-dot" />
            <span>Verified talent infrastructure</span>
          </div>

          <h1 className="text-[clamp(2.4rem,5.1vw,4.75rem)] font-extrabold tracking-[-0.045em] text-[#2C1B57] leading-[1.04] max-w-[12ch]">
            Great hires start with <span className="text-[#7359B4]">certainty.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#49454F] leading-relaxed max-w-[52ch] font-normal">
            Meet verified talent, see the evidence behind every profile, and move from first look to interview in one calm workspace.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button onClick={() => onNavigate('post-job')} className="px-7 py-4 text-sm font-bold text-white bg-[#42326E] hover:bg-[#322554] rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
              <span>Post a Job Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('candidates')} className="px-7 py-4 text-sm font-bold text-[#2C1B57] bg-white border border-[#E8E3EF] hover:border-[#B29CFE] hover:bg-white rounded-2xl shadow-xs transition-all flex items-center gap-2">
              <Search className="w-4 h-4 text-[#42326E]" />
              <span>Explore Verified Talent</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#49454F]">
            {['Verified profiles', 'Secure payments via Razorpay', 'Interview-ready talent'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#5F8A72]" />
                {item}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-7 border-t border-[#DAD1E8] max-w-xl">
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight tabular-nums">48 hrs</div>
              <div className="text-xs text-[#6F687A] font-medium mt-0.5">Median time to shortlist</div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight tabular-nums">94.6%</div>
              <div className="text-xs text-[#6F687A] font-medium mt-0.5">Audit pass fidelity</div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight tabular-nums">6,200+</div>
              <div className="text-xs text-[#6F687A] font-medium mt-0.5">Companies hiring</div>
            </div>
          </div>
        </div>

        {/* Hero device mockup — unchanged */}
        <div className="lg:col-span-6 relative landing-device-wrap">
          <span className="absolute -top-8 right-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#76698D]">Illustrative product preview</span>
          <div
            className="w-full bg-[#2C1B57] text-white rounded-3xl p-6 sm:p-7 shadow-[0_32px_80px_-20px_rgba(44,27,87,0.35)] relative overflow-hidden transition-transform duration-300 ease-out border border-white/15 ring-1 ring-black/10"
            style={{ transform: `perspective(1100px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#B29CFE]/30 via-[#6E5B9A]/15 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#7CE0B0]/15 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                <span className="ml-2 text-xs text-white/50 font-semibold tracking-wide flex items-center gap-1.5">
                  <AppLogo className="w-4 h-4 rounded" />
                  Smile Jobs Recruiter OS
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                {(['pipeline', 'audit', 'velocity'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivePreviewTab(tab)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all capitalize ${
                      activePreviewTab === tab ? 'bg-white text-[#2C1B57] shadow-xs' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {tab === 'audit' ? 'Audit Scan' : tab}
                  </button>
                ))}
              </div>
            </div>

            {activePreviewTab === 'pipeline' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { val: '124', label: 'Verified Talent' },
                    { val: '37', label: 'Shortlisted' },
                    { val: '9', label: 'Interviews' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                      <div className="text-2xl font-extrabold text-white">{s.val}</div>
                      <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[repeat(3,minmax(165px,1fr))] sm:grid-cols-3 gap-2.5 text-xs overflow-x-auto pb-2">
                  {[
                    { title: 'APPLIED (18)', cards: [{ name: 'Maya Chen', role: 'Senior Product Designer', status: 'ID Verified', score: '94%' }, { name: 'Arjun Rao', role: 'Staff Distributed Eng.', status: 'Cleared', score: '91%' }] },
                    { title: 'SCREENING (7)', cards: [{ name: 'Leo Fischer', role: 'Growth Lead (SaaS)', status: 'Cleared', score: '89%', ring: true }] },
                    { title: 'INTERVIEW (9)', cards: [{ name: 'Priya Nair', role: 'Senior Data Analyst', status: 'Thu 2:30 PM', score: '96%', isTime: true }] },
                  ].map((col) => (
                    <div key={col.title} className="bg-white/5 border border-white/10 rounded-2xl p-2.5 space-y-2">
                      <div className="text-[10px] font-extrabold text-white/40 tracking-wider">{col.title}</div>
                      {col.cards.map((card) => (
                        <div key={card.name} className={`bg-white text-[#2C1B57] p-2.5 rounded-xl shadow-xs ${card.ring ? 'ring-2 ring-[#B29CFE]' : ''}`}>
                          <div className="font-extrabold text-[11px]">{card.name}</div>
                          <div className="text-[9px] text-[#6F687A]">{card.role}</div>
                          <div className="mt-1.5 flex items-center justify-between text-[9px] pt-1 border-t border-[#E8E3EF]">
                            <span className={`font-bold flex items-center gap-0.5 ${card.isTime ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {card.isTime ? <Clock className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />} {card.status}
                            </span>
                            <span className="font-extrabold text-[#42326E]">{card.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePreviewTab === 'audit' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
                    <div>
                      <div className="font-extrabold text-sm text-white">Priya Nair - Credential Dossier</div>
                      <div className="text-xs text-white/70">Authenticated via Indian UIDAI and EPFO Registries</div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">100% Passed</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { title: 'Government ID', desc: 'Aadhaar verified via OTP' },
                    { title: 'Phone Authentication', desc: 'Carrier active 5+ years' },
                    { title: 'Work History & Tenure', desc: 'EPFO payroll validated' },
                    { title: 'Degree Accreditation', desc: 'B.Tech IIT Bombay (2020)' },
                  ].map((item) => (
                    <div key={item.title} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white">{item.title}</div>
                        <div className="text-[10px] text-white/60">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePreviewTab === 'velocity' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="text-xs text-white/60 uppercase font-semibold">Median Time-to-Offer</div>
                    <div className="text-3xl font-extrabold text-white mt-1">18 Days</div>
                    <div className="text-[11px] text-emerald-400 mt-2 font-bold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> 4.2 days faster</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="text-xs text-white/60 uppercase font-semibold">Offer Close Rate</div>
                    <div className="text-3xl font-extrabold text-white mt-1">88.2%</div>
                    <div className="text-[11px] text-emerald-400 mt-2 font-bold">18 offers signed</div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Verification Accuracy</span>
                    <span className="font-extrabold text-emerald-300">94.6%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-400 to-[#7CE0B0] h-full rounded-full" style={{ width: '94.6%' }} />
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => onNavigate('dashboard')} className="mt-5 w-full py-3 bg-gradient-to-r from-[#42326E] via-[#5A4590] to-[#795EB5] border border-white/20 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 hover:opacity-95 shadow-md transition-all">
              <span>Launch Recruiter Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="absolute -top-4 -left-6 apple-glass rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-float-slow hidden sm:flex border border-white/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
            <div>
              <div className="text-xs font-bold text-[#2C1B57]">Identity Verified</div>
              <div className="text-[10px] text-[#6F687A]">UIDAI & Employment Registry</div>
            </div>
          </div>
          <div className="absolute -bottom-5 -right-6 apple-glass rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-float-delayed hidden sm:flex border border-white/80">
            <div className="w-10 h-10 rounded-xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <div className="text-xs font-bold text-[#2C1B57]">+18.4% Applicants</div>
              <div className="text-[10px] text-[#6F687A]">Verified candidate cohort</div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-y border-[#E8E3EF] bg-white/85 py-8">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 xl:px-20 flex flex-col md:flex-row md:items-center gap-5 md:gap-12">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F687A] shrink-0">Made for teams building what comes next</p>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-[#5B526E]">
            <span>Startups</span><span>Talent teams</span><span>Engineering leaders</span><span>Growing enterprises</span>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="landing-story py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-center">
          <div className="max-w-lg">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.04em] leading-[1.1] text-[#2C1B57]">Hiring should not begin with doubt.</h2>
            <p className="mt-6 text-base sm:text-lg text-[#49454F] leading-relaxed">When each candidate comes with clear signals, your team can spend less time checking claims and more time meeting people.</p>
            <button onClick={() => onNavigate('candidates')} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#42326E] hover:gap-3 transition-all">
              See the talent directory <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="landing-story-board rounded-[2rem] border border-[#DCD4E8] bg-white p-5 sm:p-8 shadow-[0_28px_70px_-42px_rgba(44,27,87,.4)]">
            <div className="flex items-center justify-between border-b border-[#E8E3EF] pb-5 mb-5">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F687A]">From uncertainty to clarity</span>
              <ShieldCheck className="h-5 w-5 text-[#5F8A72]" />
            </div>
            {[
              ['Unverified resumes', 'Credential evidence', 'Identity, work history and education in view'],
              ['Slow screening', 'Qualified shortlists', 'Relevant skills and fit at a glance'],
              ['Endless scheduling', 'Interview momentum', 'One pipeline from shortlist to meeting'],
            ].map(([before, after, detail]) => (
              <div key={before} className="grid grid-cols-[1fr_auto_1.2fr] items-center gap-3 sm:gap-5 py-4 border-b last:border-b-0 border-[#EFEAF6]">
                <span className="text-xs sm:text-sm text-[#8B8394] line-through decoration-[#C9BCCF]">{before}</span>
                <ArrowRight className="h-4 w-4 text-[#B29CFE]" />
                <span>
                  <strong className="block text-xs sm:text-sm text-[#2C1B57]">{after}</strong>
                  <span className="mt-0.5 hidden sm:block text-xs text-[#6F687A]">{detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section id="showcase" className="landing-showcase py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 w-full bg-[#281A4F] text-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl mb-12 space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-[-0.04em] leading-[1.1]">The whole hiring picture, in focus.</h2>
            <p className="text-base sm:text-lg text-[#D9D0EC] leading-relaxed">Explore the signals and tools that bring better decisions into one workspace.</p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-5 landing-tabs" role="tablist">
            {showcaseItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveShowcaseTab(idx)}
                  role="tab"
                  aria-selected={activeShowcaseTab === idx}
                  className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap border ${
                    activeShowcaseTab === idx ? 'bg-white text-[#2C1B57] border-white shadow-md' : 'bg-white/5 text-[#E0D4FC] border-white/15 hover:border-[#B29CFE] hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>

          <div key={activeShowcaseTab} role="tabpanel" className="landing-feature-panel bg-[#FCFCF7] rounded-[2rem] p-6 sm:p-10 lg:p-12 border border-white/20 shadow-[0_30px_90px_-35px_rgba(0,0,0,.5)] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center text-[#29233A]">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-extrabold px-3 py-1 bg-[#EDE6FA] text-[#42326E] rounded-full inline-block">{showcaseItems[activeShowcaseTab].badge}</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57]">{showcaseItems[activeShowcaseTab].title}</h3>
              <p className="text-sm font-semibold text-[#42326E]">{showcaseItems[activeShowcaseTab].subtitle}</p>
              <p className="text-sm text-[#49454F] leading-relaxed">{showcaseItems[activeShowcaseTab].description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-[#E8E3EF]">
                {showcaseItems[activeShowcaseTab].metrics.map((m, i) => (
                  <div key={i} className="py-2 pr-2">
                    <div className="text-[10px] text-[#6F687A] font-semibold">{m.label}</div>
                    <div className="text-sm font-extrabold text-[#2C1B57] mt-0.5">{m.value}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => onNavigate('dashboard')} className="px-6 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5">
                <span>Experience in Recruiter Portal</span><ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="lg:col-span-6 bg-[#2C1B57] rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden shadow-[0_20px_40px_-20px_rgba(44,27,87,.5)] min-h-[300px]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <span className="text-xs font-bold text-white/70">{showcaseItems[activeShowcaseTab].subtitle}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="space-y-3">
                {showcaseItems[activeShowcaseTab].metrics.map((metric, index) => (
                  <div key={metric.label} className="p-4 bg-white/[.08] rounded-xl border border-white/10 flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B29CFE]/20 text-[#E0D4FC] text-xs font-bold">0{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs text-[#C9BEE3]">{metric.label}</span>
                      <strong className="block text-sm text-white">{metric.value}</strong>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-[#7CE0B0] shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM BENTO (unchanged content, mobile fixes only) */}
      <section id="platform" className="py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="max-w-3xl mb-14 space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C1B57] tracking-tight">One workspace. Every decision in view.</h2>
          <p className="text-base text-[#49454F] leading-relaxed">Smile Jobs replaces fragmented spreadsheets, unverified resumes, and disjointed calendars with one high-precision platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="md:col-span-2 lg:col-span-1 bg-[#2C1B57] text-white p-7 sm:p-8 rounded-3xl flex flex-col justify-between shadow-xl relative overflow-hidden group apple-card-hover border border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#B29CFE]/20 to-transparent blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-6"><ShieldCheck className="w-6 h-6 text-[#7CE0B0]" /></div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Verified Profiles</h3>
              <p className="text-sm text-white/70 leading-relaxed font-normal">Every candidate shows exactly what has been authenticated — government ID, corporate work email, salary tenure, and accredited degrees.</p>
            </div>
            <div className="mt-8 rounded-2xl bg-white/10 border border-white/10 p-4 space-y-3">
              {['Identity check', 'Phone verified', 'Work history', 'Degree match'].map((item) => (
                <div key={item} className="flex items-center justify-between text-xs font-semibold text-white/90">
                  <span>{item}</span><CheckCircle2 className="w-4 h-4 text-[#7CE0B0]" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center mb-6"><Search className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">Smart Candidate Search</h3>
              <p className="text-sm text-[#49454F] leading-relaxed">Filter by competency, verified experience, location, and availability.</p>
            </div>
            <div className="mt-6 rounded-2xl border border-[#E8E3EF] bg-[#FCFCF7] p-3 flex items-center gap-2 text-xs font-medium text-[#6F687A]"><Search className="w-4 h-4" /> Search skills, role or location</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {['React', '5+ years', 'Remote'].map((t) => (
                <span key={t} className="text-[11px] font-bold text-[#42326E] bg-[#EDE6FA] px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
            <button onClick={() => onNavigate('candidates')} className="mt-6 text-xs font-bold text-[#42326E] flex items-center gap-1.5 hover:gap-2 transition-all self-start">
              Browse directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6"><Zap className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">Drag & Drop Pipeline</h3>
              <p className="text-sm text-[#49454F] leading-relaxed">Move talent across 6 stages with instant notifications.</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 text-[10px] font-bold text-[#6F687A]">
              {['Applied', 'Shortlisted', 'Interview'].map((stage, i) => (
                <div key={stage} className="rounded-xl bg-[#F7F4FA] border border-[#E8E3EF] p-2">
                  <span className="block mb-2">{stage}</span>
                  <span className="block h-9 rounded-lg bg-white border border-[#E8E3EF] px-1.5 py-2 text-[#42326E] truncate">{['Maya C.', 'Leo F.', 'Priya N.'][i]}</span>
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate('dashboard')} className="mt-6 text-xs font-bold text-[#42326E] flex items-center gap-1.5 hover:gap-2 transition-all self-start">
              View pipeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-6"><Briefcase className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">Guided Job Posting</h3>
              <p className="text-sm text-[#49454F] leading-relaxed">Create transparent listings in under 5 minutes.</p>
            </div>
            <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-[#6F687A]">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <span key={step} className={`flex h-7 w-7 items-center justify-center rounded-full border ${step < 4 ? 'border-[#42326E] bg-[#42326E] text-white' : 'border-[#DAD1E8] bg-white'}`}>{step}</span>
              ))}
            </div>
            <button onClick={() => onNavigate('post-job')} className="mt-6 text-xs font-bold text-[#42326E] flex items-center gap-1.5 hover:gap-2 transition-all self-start">
              Create listing <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="md:col-span-2 bg-white p-7 sm:p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center mb-6"><BarChart3 className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">Recruitment Metrics</h3>
              <p className="text-sm text-[#49454F] leading-relaxed">Track time-to-hire, conversion rates, and benchmarks.</p>
            </div>
            <div className="mt-6 flex items-end gap-2 h-20" aria-hidden="true">
              {[35, 52, 45, 66, 54, 72, 83, 69, 91, 78, 100, 88].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#42326E] to-[#B29CFE] opacity-75" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="pt-6 grid grid-cols-3 gap-2 sm:gap-4 border-t border-[#EFEAF6] mt-4">
              {[
                { val: '18 Days', label: 'Avg. Time-to-Offer' },
                { val: '88.2%', label: 'Offer Acceptance' },
                { val: '0%', label: 'Credential Fraud' },
              ].map((m) => (
                <div key={m.label} className="bg-[#FCFCF7] p-2 sm:p-3 rounded-2xl border border-[#E8E3EF]">
                  <div className="text-xl font-extrabold text-[#2C1B57]">{m.val}</div>
                  <div className="text-xs text-[#6F687A]">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ⭐ NEW: PROFILE CREDITS FEATURE SECTION   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-5 sm:px-10 lg:px-14 xl:px-20 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-y border-amber-200">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Pay-Per-Unlock · No Subscription Required
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C1B57] tracking-tight leading-[1.1]">
              Unlock verified profiles with <span className="text-amber-600">Profile Credits</span>
            </h2>
            <p className="text-base text-[#49454F] leading-relaxed">
              Buy credits once, use them whenever you need. Each credit auto-reveals one verified candidate's full contact details and resume. No monthly commitment, no expiration date.
            </p>

            <div className="space-y-3">
              {[
                { icon: Unlock, title: 'Instant Auto-Reveal', desc: 'Qualifying profiles unlock automatically on page load based on your credit balance.' },
                { icon: Mail, title: 'Full Contact Details', desc: 'Get verified email, phone number, and resume PDF for every unlocked candidate.' },
                { icon: ShieldCheck, title: 'Quality Guaranteed', desc: 'Only profiles with 50%+ completeness AND uploaded resume are shown. No empty profiles.' },
                { icon: Download, title: 'Secure Resume Download', desc: 'Resume PDFs are proxied through our secure backend with entitlement checks.' },
                { icon: Coins, title: 'Credits Never Expire', desc: 'Purchase today, use anytime. Credits stay in your account forever.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-amber-100">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-[#2C1B57]">{title}</div>
                    <div className="text-xs text-[#49454F] mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onNavigate(authUser ? 'profile-purchase' : 'login')}
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-extrabold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
              >
                <Coins className="w-4 h-4" />
                <span>{authUser ? 'Buy Profile Credits' : 'Sign in to Buy Credits'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('candidates')}
                className="px-6 py-3.5 bg-white border border-amber-200 hover:border-amber-400 text-amber-800 text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                Preview Candidates
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Coins className="w-5 h-5" />
                  <span className="text-sm font-extrabold">Your Credit Balance</span>
                </div>
                <span className="text-2xl font-black text-white tabular-nums">25</span>
              </div>

              <div className="p-5 space-y-3">
                <div className="text-xs font-bold text-[#6F687A] uppercase tracking-wider mb-2">
                  Auto-Revealed Profiles
                </div>

                {[
                  { name: 'Priya Nair', role: 'Senior Data Analyst', email: 'priya.n@gmail.com', phone: '+91 98XXX 23456', completeness: 92 },
                  { name: 'Arjun Rao', role: 'Staff Engineer', email: 'arjun.r@outlook.com', phone: '+91 97XXX 54321', completeness: 85 },
                  { name: 'Maya Chen', role: 'Product Designer', email: 'maya.c@gmail.com', phone: '+91 99XXX 11223', completeness: 78 },
                ].map((profile) => (
                  <div key={profile.name} className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#42326E] to-[#2C1B57] flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(profile.name)}
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-[#2C1B57] flex items-center gap-1">
                            {profile.name}
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <div className="text-[10px] text-[#6F687A]">{profile.role}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full uppercase">
                        Unlocked
                      </span>
                    </div>
                    <div className="space-y-1 text-[10px] text-[#49454F] font-medium">
                      <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-emerald-600" /> {profile.email}</div>
                      <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-emerald-600" /> {profile.phone}</div>
                      <div className="flex items-center gap-1.5"><Download className="w-3 h-3 text-blue-600" /> Resume.pdf · {profile.completeness}% complete</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#FCFCF7] p-4 border-t border-amber-100 flex items-center justify-between">
                <span className="text-xs text-[#6F687A] font-semibold">Need more?</span>
                <button onClick={() => onNavigate(authUser ? 'profile-purchase' : 'login')} className="text-xs font-extrabold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                  Buy Credits <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-3 shadow-xl border border-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-extrabold text-[#2C1B57]">50%+ profiles only</span>
            </div>
          </div>
        </div>
      </section>

      {/* TALENT PREVIEW */}
      <section className="py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 bg-[#F5F1FA] border-y border-[#E8E3EF]">
        <div className="max-w-[1440px] mx-auto w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C1B57] tracking-tight">Talent worth a closer look.</h2>
              <p className="text-sm text-[#49454F] mt-1">{authUser ? 'Explore candidates in your workspace.' : 'Preview profiles. Sign in for full access.'}</p>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-white rounded-xl border border-[#E8E3EF]">
              {(['all', 'Design', 'Engineering', 'Analytics', 'Product'] as const).map((dept) => (
                <button key={dept} onClick={() => setTalentRoleFilter(dept)} className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all whitespace-nowrap ${talentRoleFilter === dept ? 'bg-[#2C1B57] text-white shadow-xs' : 'text-[#49454F] hover:bg-gray-100'}`}>
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayTalent.slice(0, 3).map((candidate) => {
              const isPremium = candidate.matchScore >= 90;
              return (
                <button key={candidate.id} onClick={() => onSelectCandidate(candidate)} className={`relative bg-white p-6 sm:p-7 rounded-3xl shadow-xs transition-all text-left flex flex-col justify-between overflow-hidden group ${isPremium ? 'border-2 border-amber-300 hover:shadow-lg' : 'border border-[#E8E3EF] hover:border-[#B29CFE]'}`}>
                  {isPremium && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-300" />}
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0" style={{ backgroundColor: candidate.avatarBg }}>
                          {getInitials(candidate.name)}
                        </div>
                        <div>
                          <div className="font-extrabold text-base text-[#2C1B57] group-hover:text-[#42326E] transition-colors flex items-center gap-1.5">
                            {candidate.name}<ShieldCheck className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="text-xs text-[#6F687A]">{candidate.role}</div>
                        </div>
                      </div>
                      {isPremium ? (
                        <div className="flex flex-col items-end shrink-0 pl-2">
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 text-[9px] font-extrabold px-2 py-0.5 rounded-lg shadow-xs whitespace-nowrap mb-1"><Sparkles className="w-3 h-3 text-amber-500" /> Top Match</span>
                          <strong className="text-2xl leading-none font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 tabular-nums">{candidate.matchScore}%</strong>
                        </div>
                      ) : (
                        <span className="text-right shrink-0 pl-2"><strong className="block text-2xl leading-none font-extrabold text-[#42326E] tabular-nums">{candidate.matchScore}%</strong><span className="text-[10px] font-bold text-[#6F687A]">match</span></span>
                      )}
                    </div>
                    <p className="text-xs text-[#49454F] line-clamp-2 mb-4 leading-relaxed">{candidate.bio}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {candidate.skills.slice(0, 3).map((s) => (
                        <span key={s} className="text-[11px] font-semibold px-2 py-0.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded-md text-[#49454F]">{s}</span>
                      ))}
                      {candidate.skills.length > 3 && <span className="text-[11px] font-semibold text-[#6F687A] px-1 py-0.5">+{candidate.skills.length - 3}</span>}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#EFEAF6] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#6F687A] flex items-center gap-1 font-medium"><MapPin className="w-3.5 h-3.5 text-[#42326E]" /> {candidate.location}</span>
                    <span className="font-extrabold text-[#C58A3A]">{candidate.salaryExpected} exp.</span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#42326E] group-hover:gap-2.5 transition-all">View profile <ArrowRight className="h-3.5 w-3.5" /></span>
                </button>
              );
            })}
          </div>

          {displayTalent.length === 0 && (
            <div className="rounded-3xl border border-[#DAD1E8] bg-white p-8 sm:p-12 text-center">
              <Search className="h-7 w-7 text-[#7359B4] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#2C1B57]">No profiles in this view yet</h3>
              <button onClick={() => setTalentRoleFilter('all')} className="mt-5 text-sm font-bold text-[#42326E] underline underline-offset-4">Show all</button>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button onClick={() => onNavigate('candidates')} className="px-6 py-3 bg-white border border-[#E8E3EF] hover:border-[#B29CFE] text-xs font-bold text-[#2C1B57] rounded-xl shadow-xs transition-all flex items-center gap-2">
              <span>Explore all candidates</span><ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section id="comparison" className="py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C1B57] tracking-tight">A clearer way to move forward.</h2>
          <p className="text-base text-[#49454F]">The old way wastes hours on unverified claims and scheduling gymnastics.</p>
        </div>
        <div className="bg-white rounded-3xl border border-[#E8E3EF] shadow-lg overflow-hidden max-w-5xl mx-auto">
          <div className="hidden sm:grid grid-cols-12 bg-[#FCFCF7] border-b border-[#E8E3EF] py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#6F687A]">
            <div className="col-span-4">Capability</div>
            <div className="col-span-4 text-gray-500">Traditional</div>
            <div className="col-span-4 font-extrabold text-[#2C1B57]">Smile Jobs</div>
          </div>
          <div className="divide-y divide-[#EFEAF6] text-xs">
            {[
              { feature: 'Candidate Verification', traditional: 'Self-reported (High fraud)', smileJobs: 'Gov ID, EPFO & Degree Audited' },
              { feature: 'Time to Shortlist', traditional: '14-21 Days', smileJobs: 'Under 48 Hours' },
              { feature: 'Credential Reliability', traditional: '12-18% falsified', smileJobs: '0% falsification tolerance' },
              { feature: 'Interview Scheduling', traditional: '5-10 email exchanges', smileJobs: '1-click Cal/Zoom booking' },
              { feature: 'Pay-per-Profile Option', traditional: 'Not available', smileJobs: 'Profile Credits — no subscription needed' },
            ].map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-0 py-5 px-5 sm:px-6 items-center hover:bg-[#FCFCF7]/70 transition-colors">
                <div className="sm:col-span-4 font-bold text-[#2C1B57] text-sm sm:text-xs">{row.feature}</div>
                <div className="sm:col-span-4 text-[#6F687A] flex items-start gap-1.5"><X className="w-3.5 h-3.5 text-rose-500 shrink-0" /><span>{row.traditional}</span></div>
                <div className="sm:col-span-4 font-bold text-emerald-800 flex items-start gap-1.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>{row.smileJobs}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HIRING STEPS */}
      <section className="bg-white border-y border-[#E8E3EF] py-24 sm:py-28 px-5 sm:px-10 lg:px-14 xl:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-12">
            <h2 className="max-w-xl text-3xl sm:text-5xl font-extrabold tracking-[-0.04em] text-[#2C1B57] leading-[1.1]">From open role to open conversation.</h2>
            <p className="max-w-sm text-sm sm:text-base text-[#49454F]">A straightforward path through the moments that matter.</p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 border-t border-[#DAD1E8]">
            {['Post a role', 'Get verified matches', 'Shortlist candidates', 'Schedule interviews', 'Hire with confidence'].map((step, index) => (
              <li key={step} className="relative border-b lg:border-b-0 border-[#E8E3EF] py-6 lg:pr-5 lg:border-r last:border-r-0 lg:pl-5 first:pl-0">
                <span className="text-xs font-bold text-[#7359B4] tabular-nums">0{index + 1}</span>
                <h3 className="mt-3 text-base font-bold text-[#2C1B57]">{step}</h3>
                {index < 4 && <ArrowRight className="hidden lg:block absolute top-6 right-4 h-4 w-4 text-[#B29CFE]" />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ⭐ LIVE PRICING FROM BACKEND API         */}
      {/* ═══════════════════════════════════════════ */}
      <section id="pricing" className="py-24 sm:py-28 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="inline-block text-xs font-extrabold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200"><CreditCard className="w-3 h-3 inline mr-1" />Secure Payments via Razorpay</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C1B57] tracking-tight">Transparent pricing. No hidden fees.</h2>
          <p className="text-base text-[#49454F]">All prices in Indian Rupees (INR), inclusive of applicable GST. Live pricing from our platform.</p>
        </div>

        {plansLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#42326E] animate-spin mb-4" />
            <p className="text-sm font-semibold text-[#6F687A]">Loading live pricing from server...</p>
          </div>
        ) : plansError || plans.length === 0 ? (
          <div className="max-w-2xl mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
            <h3 className="text-lg font-extrabold text-amber-900">Live Pricing Temporarily Unavailable</h3>
            <p className="text-sm text-amber-800">We're unable to fetch live subscription pricing right now. Please contact our team for current rates.</p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <a href={`mailto:${BIZ.email}`} className="px-5 py-2.5 bg-[#42326E] text-white text-xs font-bold rounded-xl hover:bg-[#322554] transition-colors inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Sales
              </a>
              <a href={`tel:${BIZ.phone.replace(/\s/g, '')}`} className="px-5 py-2.5 bg-white border border-amber-300 text-amber-800 text-xs font-bold rounded-xl hover:bg-amber-100 transition-colors inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Call Us
              </a>
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${plans.length === 2 ? 'md:grid-cols-2 max-w-3xl' : plans.length >= 3 ? 'md:grid-cols-3 max-w-5xl' : 'max-w-md'} gap-6 mx-auto`}>
            {plans.map((plan: any, idx: number) => {
              const isFeatured = plan.featured === true || plan.popular === true || (plans.length > 1 && idx === 1);
              const planPrice = plan.priceInRupees ?? plan.price ?? (plan.priceInPaise ? plan.priceInPaise / 100 : 0);
              const planPeriod = plan.billingCycle === 'yearly' || plan.billingCycle === 'annual' ? '/year' : '/month';
              const planFeatures: string[] = Array.isArray(plan.features) ? plan.features : [];

              return (
                <div key={plan._id || plan.id || plan.name} className={`rounded-3xl p-8 flex flex-col relative ${isFeatured ? 'bg-[#2C1B57] text-white border-2 border-[#B29CFE] shadow-xl' : 'bg-white border border-[#E8E3EF] shadow-sm'}`}>
                  {isFeatured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold px-3 py-1 bg-[#B29CFE] text-[#2C1B57] rounded-full uppercase tracking-wider whitespace-nowrap">Most Popular</span>}
                  <div className="mb-6">
                    <h3 className={`text-lg font-extrabold ${isFeatured ? '' : 'text-[#2C1B57]'}`}>{plan.name || plan.displayName || 'Plan'}</h3>
                    <p className={`text-xs mt-1 ${isFeatured ? 'text-white/70' : 'text-[#6F687A]'}`}>{plan.description || plan.tagline || 'Monthly subscription'}</p>
                  </div>
                  <div className="mb-6">
                    <span className={`text-4xl font-extrabold ${isFeatured ? '' : 'text-[#2C1B57]'}`}>
                      {planPrice > 0 ? formatINR(planPrice) : 'Custom'}
                    </span>
                    {planPrice > 0 && <span className={`text-sm ${isFeatured ? 'text-white/70' : 'text-[#6F687A]'}`}>{planPeriod}</span>}
                  </div>
                  <ul className={`space-y-3 text-sm mb-8 flex-1 ${isFeatured ? 'text-white/90' : 'text-[#49454F]'}`}>
                    {planFeatures.length > 0 ? (
                      planFeatures.map((f, i) => (
                        <li key={i} className="flex items-start gap-2"><Check className={`w-4 h-4 mt-0.5 shrink-0 ${isFeatured ? 'text-[#7CE0B0]' : 'text-emerald-600'}`} /> {f}</li>
                      ))
                    ) : (
                      <li className="flex items-start gap-2"><Check className={`w-4 h-4 mt-0.5 shrink-0 ${isFeatured ? 'text-[#7CE0B0]' : 'text-emerald-600'}`} /> Full platform access</li>
                    )}
                  </ul>
                  <button
                    onClick={() => planPrice === 0 ? openPolicy('contact') : onNavigate(authUser ? 'subscription' as AppRoute : 'login')}
                    className={`w-full py-3 text-xs font-bold rounded-xl transition-all ${isFeatured ? 'bg-white text-[#2C1B57] hover:bg-[#FCFCF7]' : 'bg-[#FCFCF7] border border-[#E8E3EF] hover:border-[#42326E] text-[#2C1B57]'}`}
                  >
                    {planPrice === 0 ? 'Contact Sales' : authUser ? 'Choose Plan' : 'Sign In to Subscribe'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Alternative: Profile Credits */}
        <div className="mt-10 max-w-5xl mx-auto">
          <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md">
              <Coins className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-extrabold text-[#2C1B57] flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                Not ready for a subscription?
                <span className="text-[10px] font-black px-2 py-0.5 bg-amber-500 text-white rounded-full uppercase tracking-wider">Alternative</span>
              </h3>
              <p className="text-sm text-[#49454F] mt-1">Try <strong className="text-amber-700">Profile Credits</strong> — pay only when you unlock a candidate. No monthly commitment. Credits never expire.</p>
            </div>
            <button onClick={() => onNavigate(authUser ? 'profile-purchase' : 'login')} className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 whitespace-nowrap">
              <Coins className="w-3.5 h-3.5" /> Buy Credits
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#6F687A]">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> SSL Secured</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Razorpay PCI-DSS</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> GST Invoicing</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[#6F687A]">
            {['Visa', 'Mastercard', 'RuPay', 'UPI', 'Net Banking', 'Wallets'].map((m) => (
              <span key={m} className="px-3 py-1.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded-lg">{m}</span>
            ))}
          </div>
          <p className="text-xs text-[#6F687A] text-center">
            View our <button onClick={() => openPolicy('refund')} className="text-[#42326E] font-bold underline underline-offset-2 hover:text-[#2C1B57]">Refund Policy</button> for cancellation and refund details.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="pb-24 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="bg-[#2C1B57] rounded-3xl p-8 sm:p-14 lg:p-16 text-white relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10 border border-white/10">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B29CFE]">Make your next move count</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">Your next great hire may already be verified.</h2>
            <p className="text-base text-white/70 leading-relaxed font-normal">Bring your roles, talent, and hiring decisions together.</p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-3.5 shrink-0">
            <button onClick={() => onNavigate('post-job')} className="px-8 py-4 bg-white text-[#2C1B57] hover:bg-[#FCFCF7] text-sm font-extrabold rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
              <span>Post a Job Free</span><ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('candidates')} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-extrabold rounded-2xl transition-all">
              Explore Talent
            </button>
          </div>
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-radial from-[#B29CFE]/30 to-transparent blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[#E8E3EF] bg-white pt-16 pb-8 px-5 sm:px-10 lg:px-14 xl:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-9 pb-14">
            <div className="col-span-2 sm:col-span-4 lg:col-span-1">
              <button onClick={() => onNavigate('landing')} className="text-xl font-extrabold tracking-tight text-[#2C1B57] flex items-center gap-2.5">
                <AppLogo className="w-7 h-7 rounded-lg" /> Smile Jobs
              </button>
              <p className="mt-3 max-w-[25ch] text-sm leading-relaxed text-[#6F687A]">Verified hiring infrastructure for modern teams across India.</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[#6F687A]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /><span>Secured by Razorpay</span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-[#2C1B57]">Platform</h3>
              <a href="#showcase" className="block text-[#6F687A] hover:text-[#42326E]">Product tour</a>
              <button onClick={() => onNavigate('dashboard')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Recruiter console</button>
              <button onClick={() => onNavigate('post-job')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Post a job</button>
              <a href="#pricing" className="block text-[#6F687A] hover:text-[#42326E]">Pricing</a>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-[#2C1B57]">Talent</h3>
              <button onClick={() => onNavigate('candidates')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Browse candidates</button>
              <button onClick={() => onNavigate(authUser ? 'profile-purchase' : 'login')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Buy Profile Credits</button>
              <a href="#comparison" className="block text-[#6F687A] hover:text-[#42326E]">Why Smile Jobs</a>
              <button onClick={() => onNavigate(authUser ? 'profile' : 'login')} className="block text-[#6F687A] hover:text-[#42326E] text-left">
                {authUser ? 'My profile' : 'Sign in'}
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-[#2C1B57]">Legal</h3>
              <button onClick={() => openPolicy('privacy')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Privacy Policy</button>
              <button onClick={() => openPolicy('terms')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Terms & Conditions</button>
              <button onClick={() => openPolicy('refund')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Refund & Cancellation</button>
              <button onClick={() => openPolicy('shipping')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Shipping & Delivery</button>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-[#2C1B57]">Support</h3>
              <button onClick={() => openPolicy('contact')} className="block text-[#6F687A] hover:text-[#42326E] text-left">Contact Us</button>
              <a href={`mailto:${BIZ.email}`} className="block text-[#6F687A] hover:text-[#42326E] break-all">{BIZ.email}</a>
              <a href={`mailto:${BIZ.supportEmail}`} className="block text-[#6F687A] hover:text-[#42326E]">{BIZ.supportEmail}</a>
              <a href={`tel:${BIZ.phone.replace(/\s/g, '')}`} className="block text-[#6F687A] hover:text-[#42326E]">{BIZ.phone}</a>
            </div>
          </div>

          <div className="border-t border-[#E8E3EF] pt-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="flex items-start gap-3">
                <MapPinned className="w-5 h-5 text-[#42326E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#2C1B57] mb-1">Registered Business</p>
                  <p className="text-[#6F687A]">{BIZ.legalName}</p>
                  <p className="text-[#6F687A]">{BIZ.address.line1}</p>
                  <p className="text-[#6F687A]">{BIZ.address.line2}</p>
                  <p className="text-[#6F687A]">{BIZ.address.city} – {BIZ.address.pincode}</p>
                  <p className="text-[#6F687A]">{BIZ.address.state}, {BIZ.address.country}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#42326E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#2C1B57] mb-1">Email</p>
                  <p className="text-[#6F687A]">General: <a href={`mailto:${BIZ.email}`} className="hover:text-[#42326E] break-all">{BIZ.email}</a></p>
                  <p className="text-[#6F687A]">Support: <a href={`mailto:${BIZ.supportEmail}`} className="hover:text-[#42326E]">{BIZ.supportEmail}</a></p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#42326E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#2C1B57] mb-1">Phone</p>
                  <p className="text-[#6F687A]"><a href={`tel:${BIZ.phone.replace(/\s/g, '')}`} className="hover:text-[#42326E]">{BIZ.phone}</a></p>
                  <p className="text-[#6F687A] mt-1 text-[11px]">{BIZ.hours}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E8E3EF] pt-6 pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#6F687A]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /><span className="font-semibold">We Accept:</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[#6F687A]">
                {['Visa', 'Mastercard', 'RuPay', 'UPI', 'Net Banking', 'Wallets'].map((m) => (
                  <span key={m} className="px-3 py-1.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded-lg">{m}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#E8E3EF] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6F687A]">
            <div className="text-center sm:text-left">
              <p>© {currentYear} Smile Jobs. All rights reserved.</p>
              <p className="mt-1">Operated by <strong className="text-[#2C1B57]">{BIZ.legalName}</strong> · {BIZ.type}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {[
                { key: 'privacy' as const, label: 'Privacy' },
                { key: 'terms' as const, label: 'Terms' },
                { key: 'refund' as const, label: 'Refunds' },
                { key: 'shipping' as const, label: 'Shipping' },
                { key: 'contact' as const, label: 'Contact' },
              ].map((link, i) => (
                <React.Fragment key={link.key}>
                  {i > 0 && <span className="text-[#DAD1E8]">·</span>}
                  <button onClick={() => openPolicy(link.key)} className="hover:text-[#42326E] font-medium">{link.label}</button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;