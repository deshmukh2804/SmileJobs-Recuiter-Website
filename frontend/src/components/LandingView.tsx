import React, { useState, useEffect, useRef } from 'react';
import { AppRoute, Candidate, AuthUser } from '../types';
import { INITIAL_CANDIDATES } from '../mockData';
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
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (route: AppRoute) => void;
  featuredCandidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onOpenInfo: (type: 'privacy' | 'terms' | 'contact') => void;
  authUser: AuthUser | null;
}

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
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 1024) return;
    const rect = heroRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: px * 2, y: -py * 2 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Filtered talent for live preview section
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
      subtitle: 'Meet & Zoom in one click',
      description: 'Say goodbye to 10-email scheduling chains. Candidates pick live panel slots directly synced with your hiring managers’ Google Calendar and Microsoft Teams.',
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

  return (
    <div className="landing-page min-h-screen bg-[#FCFCF7] text-[#29233A] flex flex-col selection:bg-[#EDE6FA] selection:text-[#322554] overflow-x-hidden">
      <div className="landing-ambient pointer-events-none absolute inset-x-0 top-0 h-[820px]" aria-hidden="true" />

      <nav
        aria-label="Main navigation"
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FCFCF7]/90 backdrop-blur-xl border-b border-[#2C1B57]/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 xl:px-20 h-[74px] flex items-center justify-between gap-5">
          {/* Logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 font-extrabold text-xl text-[#2C1B57] cursor-pointer group shrink-0"
            aria-label="Smile Jobs, back to top"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2C1B57] via-[#42326E] to-[#B29CFE] relative flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <div className="w-4 h-4 border-2 border-white border-t-0 rounded-b-xs" />
              <div className="absolute top-2 w-4 h-0.5 bg-white rounded-full" />
            </div>
            <span className="tracking-tight text-xl font-extrabold text-[#2C1B57]">
              Smile Jobs
            </span>
          </button>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-9 text-xs uppercase tracking-wider font-bold text-[#49454F]">
            <a
              href="#platform"
              className="hover:text-[#2C1B57] transition-colors relative py-1 group"
            >
              Platform
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
            </a>
            <a
              href="#showcase"
              className="hover:text-[#2C1B57] transition-colors relative py-1 group"
            >
              Showcase
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
            </a>
            <a
              href="#comparison"
              className="hover:text-[#2C1B57] transition-colors relative py-1 group"
            >
              Comparison
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
            </a>
            <button
              onClick={() => onNavigate('candidates')}
              className="hover:text-[#2C1B57] transition-colors text-left relative py-1 group"
            >
              Talent Directory
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="hover:text-[#2C1B57] transition-colors text-left relative py-1 group"
            >
              Recruiter Console
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#42326E] transition-all group-hover:w-full" />
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {authUser ? (
              <button
                onClick={() => onNavigate('profile')}
                className="landing-profile-link flex items-center gap-2 rounded-full border border-[#DAD1E8] bg-white/85 py-1.5 pl-1.5 pr-3 text-xs font-bold text-[#2C1B57] shadow-sm transition-all hover:border-[#B29CFE] hover:shadow-md"
                aria-label={`My profile, signed in as ${authUser.name || authUser.email || 'recruiter'}`}
              >
                {authUser.avatar?.url ? (
                  <img src={authUser.avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2C1B57] text-white">
                    {(authUser.name || 'R').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:block max-w-28 truncate">{authUser.name || 'My profile'}</span>
                <span className="sm:hidden">Profile</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-3 sm:px-4 py-2 text-xs md:text-sm font-bold text-[#2C1B57] hover:bg-white/80 rounded-xl transition-all"
              >
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
            <button type="button" onClick={() => setMobileNavOpen((open) => !open)} className="lg:hidden p-2 rounded-xl text-[#2C1B57] hover:bg-white" aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileNavOpen}>
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-[#E8E3EF] bg-[#FCFCF7]/95 px-5 py-4 shadow-xl flex flex-col gap-1">
            {[['Platform', '#platform'], ['Showcase', '#showcase'], ['Comparison', '#comparison']].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMobileNavOpen(false)} className="px-3 py-3 rounded-xl text-sm font-semibold text-[#2C1B57] hover:bg-[#EDE6FA]">{label}</a>
            ))}
            <button onClick={() => { setMobileNavOpen(false); onNavigate('candidates'); }} className="px-3 py-3 rounded-xl text-left text-sm font-semibold text-[#2C1B57] hover:bg-[#EDE6FA]">Talent directory</button>
            <button onClick={() => { setMobileNavOpen(false); onNavigate('dashboard'); }} className="px-3 py-3 rounded-xl text-left text-sm font-semibold text-[#2C1B57] hover:bg-[#EDE6FA]">Recruiter console</button>
            <button onClick={() => { setMobileNavOpen(false); onNavigate('post-job'); }} className="mt-2 px-3 py-3 rounded-xl text-left text-sm font-semibold text-white bg-[#42326E]">Post a Job Free</button>
          </div>
        )}
      </nav>

      {/* Hero Section — Wide, Apple-Style Cinematic Presentation */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative pt-14 sm:pt-20 lg:pt-24 pb-28 sm:pb-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center"
      >
        {/* Left Column: Headline & Value Proposition */}
        <div className="lg:col-span-6 space-y-7 sm:space-y-8 relative z-10">
          {/* Apple-style floating status pill */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#DAD1E8] bg-white/75 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#42326E] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 landing-status-dot" />
            <span>Verified talent infrastructure</span>
          </div>

          {/* Giant Apple-Style Title */}
          <h1 className="text-[clamp(2.9rem,5.1vw,4.75rem)] font-extrabold tracking-[-0.045em] text-[#2C1B57] leading-[1.04] max-w-[12ch]">
            Great hires start with <span className="text-[#7359B4]">certainty.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#49454F] leading-relaxed max-w-[52ch] font-normal">
            Meet verified talent, see the evidence behind every profile, and move from first look to interview in one calm workspace.
          </p>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button
              onClick={() => onNavigate('post-job')}
              className="px-7 py-4 text-sm font-bold text-white bg-[#42326E] hover:bg-[#322554] rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>Post a Job Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('candidates')}
              className="px-7 py-4 text-sm font-bold text-[#2C1B57] bg-white border border-[#E8E3EF] hover:border-[#B29CFE] hover:bg-white rounded-2xl shadow-xs transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-[#42326E]" />
              <span>Explore Verified Talent</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#49454F]">
            {['Verified profiles', 'No setup fee', 'Interview-ready talent'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#5F8A72]" />{item}</span>
            ))}
          </div>

          {/* Social Proof Metric Triplets */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-7 border-t border-[#DAD1E8] max-w-xl">
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight tabular-nums">
                48 hrs
              </div>
              <div className="text-xs text-[#6F687A] font-medium mt-0.5">
                Median time to shortlist
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight tabular-nums">
                94.6%
              </div>
              <div className="text-xs text-[#6F687A] font-medium mt-0.5">
                Audit pass fidelity
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight tabular-nums">
                6,200+
              </div>
              <div className="text-xs text-[#6F687A] font-medium mt-0.5">
                Companies hiring
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Apple-Grade Interactive Hardware/Software Mockup */}
        <div className="lg:col-span-6 relative landing-device-wrap">
          <span className="absolute -top-8 right-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#76698D]">Illustrative product preview</span>
          {/* Main Device / Frame */}
          <div
            className="w-full bg-[#2C1B57] text-white rounded-3xl p-6 sm:p-7 shadow-[0_32px_80px_-20px_rgba(44,27,87,0.35)] relative overflow-hidden transition-transform duration-300 ease-out border border-white/15 ring-1 ring-black/10"
            style={{
              transform: `perspective(1100px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
            }}
          >
            {/* Ambient internal studio reflection glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#B29CFE]/30 via-[#6E5B9A]/15 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#7CE0B0]/15 blur-3xl pointer-events-none" />

            {/* Window Top Controls & Interactive Segment Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                <span className="ml-2 text-xs text-white/50 font-semibold tracking-wide">
                  Smile Jobs Recruiter OS
                </span>
              </div>

              {/* Interactive preview tabs */}
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('pipeline')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    activePreviewTab === 'pipeline'
                      ? 'bg-white text-[#2C1B57] shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Pipeline
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('audit')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    activePreviewTab === 'audit'
                      ? 'bg-white text-[#2C1B57] shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Audit Scan
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('velocity')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    activePreviewTab === 'velocity'
                      ? 'bg-white text-[#2C1B57] shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Velocity
                </button>
              </div>
            </div>

            {/* Tab 1: Live Pipeline Preview */}
            {activePreviewTab === 'pipeline' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <div className="text-2xl font-extrabold text-white">124</div>
                    <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
                      Verified Talent
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <div className="text-2xl font-extrabold text-white">37</div>
                    <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
                      Shortlisted
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <div className="text-2xl font-extrabold text-[#E0D4FC]">9</div>
                    <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
                      Interviews
                    </div>
                  </div>
                </div>

                {/* 3 Active Pipeline Columns */}
                <div className="grid grid-cols-[repeat(3,minmax(165px,1fr))] sm:grid-cols-3 gap-2.5 text-xs overflow-x-auto pb-2">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 space-y-2">
                    <div className="text-[10px] font-extrabold text-white/40 tracking-wider">
                      APPLIED (18)
                    </div>
                    <div className="bg-white text-[#2C1B57] p-2.5 rounded-xl shadow-xs">
                      <div className="font-extrabold text-[11px]">Maya Chen</div>
                      <div className="text-[9px] text-[#6F687A]">Senior Product Designer</div>
                      <div className="mt-1.5 flex items-center justify-between text-[9px] pt-1 border-t border-[#E8E3EF]">
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> ID Verified
                        </span>
                        <span className="font-extrabold text-[#42326E]">94%</span>
                      </div>
                    </div>
                    <div className="bg-white text-[#2C1B57] p-2.5 rounded-xl shadow-xs">
                      <div className="font-extrabold text-[11px]">Arjun Rao</div>
                      <div className="text-[9px] text-[#6F687A]">Staff Distributed Eng.</div>
                      <div className="mt-1.5 flex items-center justify-between text-[9px] pt-1 border-t border-[#E8E3EF]">
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Cleared
                        </span>
                        <span className="font-extrabold text-[#42326E]">91%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 space-y-2">
                    <div className="text-[10px] font-extrabold text-white/40 tracking-wider">
                      SCREENING (7)
                    </div>
                    <div className="bg-white text-[#2C1B57] p-2.5 rounded-xl shadow-xs ring-2 ring-[#B29CFE]">
                      <div className="font-extrabold text-[11px]">Leo Fischer</div>
                      <div className="text-[9px] text-[#6F687A]">Growth Lead (SaaS)</div>
                      <div className="mt-1.5 flex items-center justify-between text-[9px] pt-1 border-t border-[#E8E3EF]">
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Cleared
                        </span>
                        <span className="font-extrabold text-[#42326E]">89%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 space-y-2">
                    <div className="text-[10px] font-extrabold text-white/40 tracking-wider">
                      INTERVIEW (9)
                    </div>
                    <div className="bg-white text-[#2C1B57] p-2.5 rounded-xl shadow-xs">
                      <div className="font-extrabold text-[11px]">Priya Nair</div>
                      <div className="text-[9px] text-[#6F687A]">Senior Data Analyst</div>
                      <div className="mt-1.5 flex items-center justify-between text-[9px] pt-1 border-t border-[#E8E3EF]">
                        <span className="text-amber-700 font-bold flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> Thu 2:30 PM
                        </span>
                        <span className="font-extrabold text-[#42326E]">96%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: 4-Point Audit Preview */}
            {activePreviewTab === 'audit' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-white">Priya Nair • Credential Dossier</div>
                      <div className="text-xs text-white/70">Authenticated via Indian UIDAI & EPFO Registries</div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    100% Passed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Government ID</div>
                      <div className="text-[10px] text-white/60">Aadhaar verified via OTP</div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Phone Authentication</div>
                      <div className="text-[10px] text-white/60">Carrier active 5+ years</div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Work History & Tenure</div>
                      <div className="text-[10px] text-white/60">Razorpay payroll validated</div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Degree Accreditation</div>
                      <div className="text-[10px] text-white/60">B.Tech IIT Bombay (2020)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Velocity Telemetry */}
            {activePreviewTab === 'velocity' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="text-xs text-white/60 uppercase font-semibold">Median Time-to-Offer</div>
                    <div className="text-3xl font-extrabold text-white mt-1">18 Days</div>
                    <div className="text-[11px] text-emerald-400 mt-2 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> 4.2 days faster than avg.
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="text-xs text-white/60 uppercase font-semibold">Offer Close Rate</div>
                    <div className="text-3xl font-extrabold text-white mt-1">88.2%</div>
                    <div className="text-[11px] text-emerald-400 mt-2 font-bold">
                      18 offers signed this quarter
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Verification Funnel Accuracy</span>
                    <span className="font-extrabold text-emerald-300">94.6%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-400 to-[#7CE0B0] h-full rounded-full" style={{ width: '94.6%' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Launch Button at Bottom */}
            <button
              onClick={() => onNavigate('dashboard')}
              className="mt-5 w-full py-3 bg-gradient-to-r from-[#42326E] via-[#5A4590] to-[#795EB5] border border-white/20 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 hover:opacity-95 shadow-md transition-all"
            >
              <span>Launch Recruiter Workspace & Kanban</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Floating badge 1: Identity Verified */}
          <div className="absolute -top-4 -left-6 apple-glass rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-float-slow hidden sm:flex border border-white/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#2C1B57]">Identity Verified</div>
              <div className="text-[10px] text-[#6F687A]">UIDAI & Employment Registry</div>
            </div>
          </div>

          {/* Floating badge 2: Momentum */}
          <div className="absolute -bottom-5 -right-6 apple-glass rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-float-delayed hidden sm:flex border border-white/80">
            <div className="w-10 h-10 rounded-xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#2C1B57]">+18.4% Applicants</div>
              <div className="text-[10px] text-[#6F687A]">Verified candidate cohort</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#E8E3EF] bg-white/85 py-8" aria-label="Teams Smile Jobs is designed for">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 xl:px-20 flex flex-col md:flex-row md:items-center gap-5 md:gap-12">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F687A] shrink-0">Made for teams building what comes next</p>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-[#5B526E]">
            <span>Startups</span><span>Talent teams</span><span>Engineering leaders</span><span>Growing enterprises</span>
          </div>
        </div>
      </section>

      <section className="landing-story py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-center">
          <div className="max-w-lg">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] leading-[1.1] text-[#2C1B57]">Hiring shouldn’t begin with doubt.</h2>
            <p className="mt-6 text-base sm:text-lg text-[#49454F] leading-relaxed">When each candidate comes with clear signals, your team can spend less time checking claims and more time meeting people.</p>
            <button onClick={() => onNavigate('candidates')} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#42326E] hover:gap-3 transition-all">See the talent directory <ArrowRight className="h-4 w-4" /></button>
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
                <span><strong className="block text-xs sm:text-sm text-[#2C1B57]">{after}</strong><span className="mt-0.5 hidden sm:block text-xs text-[#6F687A]">{detail}</span></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="showcase" className="landing-showcase py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 w-full bg-[#281A4F] text-white">
        <div className="max-w-[1440px] mx-auto">
        <div className="max-w-3xl mb-12 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-[-0.04em] leading-[1.1]">
            The whole hiring picture, in focus.
          </h2>
          <p className="text-base sm:text-lg text-[#D9D0EC] leading-relaxed">
            Explore the signals and tools that bring better decisions into one workspace.
          </p>
        </div>

        {/* Interactive 4-Way Segment Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-5 landing-tabs" role="tablist" aria-label="Platform capabilities">
          {showcaseItems.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeShowcaseTab === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveShowcaseTab(idx)}
                role="tab"
                aria-selected={isSelected}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-white text-[#2C1B57] border-white shadow-md'
                    : 'bg-white/5 text-[#E0D4FC] border-white/15 hover:border-[#B29CFE] hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Showcase Feature Card */}
        <div key={activeShowcaseTab} role="tabpanel" className="landing-feature-panel bg-[#FCFCF7] rounded-[2rem] p-6 sm:p-10 lg:p-12 border border-white/20 shadow-[0_30px_90px_-35px_rgba(0,0,0,.5)] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center text-[#29233A]">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-extrabold px-3 py-1 bg-[#EDE6FA] text-[#42326E] rounded-full inline-block">
              {showcaseItems[activeShowcaseTab].badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57]">
              {showcaseItems[activeShowcaseTab].title}
            </h3>
            <p className="text-sm font-semibold text-[#42326E]">
              {showcaseItems[activeShowcaseTab].subtitle}
            </p>
            <p className="text-sm text-[#49454F] leading-relaxed">
              {showcaseItems[activeShowcaseTab].description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-[#E8E3EF]">
              {showcaseItems[activeShowcaseTab].metrics.map((m, i) => (
                <div key={i} className="py-2 pr-2">
                  <div className="text-[10px] text-[#6F687A] font-semibold">{m.label}</div>
                  <div className="text-sm font-extrabold text-[#2C1B57] mt-0.5">{m.value}</div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Experience this in Recruiter Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
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
                  <div className="min-w-0 flex-1"><span className="block text-xs text-[#C9BEE3]">{metric.label}</span><strong className="block text-sm text-white">{metric.value}</strong></div>
                  <CheckCircle2 className="h-4 w-4 text-[#7CE0B0] shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </section>

      <section id="platform" className="py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="max-w-3xl mb-14 space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C1B57] tracking-tight">
            One workspace. Every decision in view.
          </h2>
          <p className="text-base text-[#49454F] leading-relaxed">
            Smile Jobs replaces fragmented spreadsheets, unverified resumes, and disjointed
            calendars with one high-precision platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: 100% Verified Profiles (Luxury Dark Bento) */}
          <div className="md:col-span-2 lg:col-span-1 bg-[#2C1B57] text-white p-7 sm:p-8 rounded-3xl flex flex-col justify-between shadow-xl relative overflow-hidden group apple-card-hover border border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#B29CFE]/20 to-transparent blur-2xl pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-[#7CE0B0]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Verified Profiles</h3>
              <p className="text-sm text-white/70 leading-relaxed font-normal">
                Every candidate shows exactly what has been authenticated — government ID, corporate work email, salary tenure, and accredited degrees — before you schedule a single call.
              </p>
            </div>
            <div className="mt-8 rounded-2xl bg-white/10 border border-white/10 p-4 space-y-3">
              {['Identity check', 'Phone verified', 'Work history', 'Degree match'].map((item) => (
                <div key={item} className="flex items-center justify-between text-xs font-semibold text-white/90"><span>{item}</span><CheckCircle2 className="w-4 h-4 text-[#7CE0B0]" /></div>
              ))}
            </div>
          </div>

          {/* Card 2: Smart Candidate Search */}
          <div className="bg-white p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">
                Smart Candidate Search
              </h3>
              <p className="text-sm text-[#49454F] leading-relaxed">
                Filter by technical competency, verified years of experience, current location,
                and immediate joining availability to find candidates who truly fit.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-[#E8E3EF] bg-[#FCFCF7] p-3 flex items-center gap-2 text-xs font-medium text-[#6F687A]"><Search className="w-4 h-4" /> Search skills, role or location</div>
            <div className="flex flex-wrap gap-2 mt-3"><span className="text-[11px] font-bold text-[#42326E] bg-[#EDE6FA] px-2.5 py-1 rounded-full">React</span><span className="text-[11px] font-bold text-[#42326E] bg-[#EDE6FA] px-2.5 py-1 rounded-full">5+ years</span><span className="text-[11px] font-bold text-[#42326E] bg-[#EDE6FA] px-2.5 py-1 rounded-full">Remote</span></div>
            <button
              onClick={() => onNavigate('candidates')}
              className="mt-6 text-xs font-bold text-[#42326E] flex items-center gap-1.5 hover:gap-2 transition-all self-start"
            >
              Browse candidate directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Drag & Drop Kanban */}
          <div className="bg-white p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">
                Drag & Drop Pipeline
              </h3>
              <p className="text-sm text-[#49454F] leading-relaxed">
                Move talent seamlessly across 6 stages: Applied, Screening, Shortlisted,
                Interview, Selected, and Hired with instant stage notifications.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 text-[10px] font-bold text-[#6F687A]">
              {['Applied', 'Shortlisted', 'Interview'].map((stage, index) => <div key={stage} className="rounded-xl bg-[#F7F4FA] border border-[#E8E3EF] p-2"><span className="block mb-2">{stage}</span><span className="block h-9 rounded-lg bg-white border border-[#E8E3EF] px-1.5 py-2 text-[#42326E] truncate">{['Maya C.', 'Leo F.', 'Priya N.'][index]}</span></div>)}
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="mt-6 text-xs font-bold text-[#42326E] flex items-center gap-1.5 hover:gap-2 transition-all self-start"
            >
              View Kanban pipeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Guided 6-Step Job Posting */}
          <div className="bg-white p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">
                Guided 6-Step Job Posting
              </h3>
              <p className="text-sm text-[#49454F] leading-relaxed">
                Create transparent listings with clear compensation, perks, work mode, and
                must-have requirements in under 5 minutes with live preview.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-[#6F687A]">
              {[1, 2, 3, 4, 5, 6].map((step) => <span key={step} className={`flex h-7 w-7 items-center justify-center rounded-full border ${step < 4 ? 'border-[#42326E] bg-[#42326E] text-white' : 'border-[#DAD1E8] bg-white'}`}>{step}</span>)}
            </div>
            <button
              onClick={() => onNavigate('post-job')}
              className="mt-6 text-xs font-bold text-[#42326E] flex items-center gap-1.5 hover:gap-2 transition-all self-start"
            >
              Create new job listing <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 5: Velocity & Conversion Metrics */}
          <div className="md:col-span-2 bg-white p-7 sm:p-8 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#2C1B57] mb-2 tracking-tight">
                Recruitment Velocity & Conversion Metrics
              </h3>
              <p className="text-sm text-[#49454F] leading-relaxed">
                Track time-to-hire across departments, conversion rates through each stage,
                and interview completion benchmarks to optimize your hiring spend.
              </p>
            </div>
            <div className="mt-6 flex items-end gap-2 h-20" aria-hidden="true">{[35, 52, 45, 66, 54, 72, 83, 69, 91, 78, 100, 88].map((height, index) => <div key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-[#42326E] to-[#B29CFE] opacity-75" style={{ height: `${height}%` }} />)}</div>
            <div className="pt-6 grid grid-cols-3 gap-2 sm:gap-4 border-t border-[#EFEAF6] mt-4">
              <div className="bg-[#FCFCF7] p-2 sm:p-3 rounded-2xl border border-[#E8E3EF]">
                <div className="text-xl font-extrabold text-[#2C1B57]">18 Days</div>
                <div className="text-xs text-[#6F687A]">Avg. Time-to-Offer</div>
              </div>
              <div className="bg-[#FCFCF7] p-2 sm:p-3 rounded-2xl border border-[#E8E3EF]">
                <div className="text-xl font-extrabold text-[#2C1B57]">88.2%</div>
                <div className="text-xs text-[#6F687A]">Offer Acceptance</div>
              </div>
              <div className="bg-[#FCFCF7] p-2 sm:p-3 rounded-2xl border border-[#E8E3EF]">
                <div className="text-xl font-extrabold text-[#2C1B57]">0%</div>
                <div className="text-xs text-[#6F687A]">Credential Fraud</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 bg-[#F5F1FA] border-y border-[#E8E3EF]">
        <div className="max-w-[1440px] mx-auto w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C1B57] tracking-tight">
                Talent worth a closer look.
              </h2>
              <p className="text-sm text-[#49454F] mt-1">
                {authUser ? 'Explore candidates in your recruiter workspace.' : 'Preview candidate profiles. Sign in to access your talent directory.'}
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-white rounded-xl border border-[#E8E3EF]">
              {(['all', 'Design', 'Engineering', 'Analytics', 'Product'] as const).map((dept) => (
                <button
                  key={dept}
                  onClick={() => setTalentRoleFilter(dept)}
                  aria-pressed={talentRoleFilter === dept}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                    talentRoleFilter === dept
                      ? 'bg-[#2C1B57] text-white shadow-xs'
                      : 'text-[#49454F] hover:bg-gray-100'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayTalent.slice(0, 3).map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => onSelectCandidate(candidate)}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E3EF] shadow-xs apple-card-hover cursor-pointer group flex flex-col justify-between text-left min-w-0"
                aria-label={`View ${candidate.name}'s profile`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-13 h-13 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0"
                        style={{ backgroundColor: candidate.avatarBg }}
                      >
                        {candidate.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="font-extrabold text-base text-[#2C1B57] group-hover:text-[#42326E] transition-colors flex items-center gap-1.5">
                          {candidate.name}
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-xs text-[#6F687A]">{candidate.role}</div>
                      </div>
                    </div>
                    <span className="text-right shrink-0 pl-2">
                      <strong className="block text-2xl leading-none font-extrabold text-[#42326E] tabular-nums">{candidate.matchScore}%</strong>
                      <span className="text-[10px] font-bold text-[#6F687A]">match</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#49454F] line-clamp-2 mb-4 leading-relaxed font-normal">
                    {candidate.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {candidate.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-semibold px-2 py-0.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded-md text-[#49454F]"
                      >
                        {s}
                      </span>
                    ))}
                    {candidate.skills.length > 3 && (
                      <span className="text-[11px] font-semibold text-[#6F687A] px-1 py-0.5">
                        +{candidate.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFEAF6] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[#6F687A] flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#42326E]" />
                    {candidate.location}
                  </span>
                  <span className="font-extrabold text-[#C58A3A]">
                    {candidate.salaryExpected} exp.
                  </span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#42326E] group-hover:gap-2.5 transition-all">View profile <ArrowRight className="h-3.5 w-3.5" /></span>
              </button>
            ))}
          </div>
          {displayTalent.length === 0 && (
            <div className="rounded-3xl border border-[#DAD1E8] bg-white p-8 sm:p-12 text-center">
              <Search className="h-7 w-7 text-[#7359B4] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#2C1B57]">No profiles in this view yet</h3>
              <p className="mt-2 text-sm text-[#6F687A]">Try another specialty or browse the full directory.</p>
              <button onClick={() => setTalentRoleFilter('all')} className="mt-5 text-sm font-bold text-[#42326E] underline underline-offset-4">Show all specialties</button>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              onClick={() => onNavigate('candidates')}
              className="px-6 py-3 bg-white border border-[#E8E3EF] hover:border-[#B29CFE] text-xs font-bold text-[#2C1B57] rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <span>Explore all pre-vetted candidates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      <section id="comparison" className="py-24 sm:py-32 px-5 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C1B57] tracking-tight">
            A clearer way to move forward.
          </h2>
          <p className="text-base text-[#49454F]">
            The old way of recruiting wastes hundreds of hours on unverified claims and scheduling gymnastics.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E8E3EF] shadow-lg overflow-hidden max-w-5xl mx-auto">
          <div className="hidden sm:grid grid-cols-12 bg-[#FCFCF7] border-b border-[#E8E3EF] py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#6F687A]">
            <div className="col-span-5 sm:col-span-4">Capability</div>
            <div className="col-span-3 sm:col-span-4 text-center sm:text-left text-gray-500">Traditional Agency / Job Boards</div>
            <div className="col-span-4 text-right sm:text-left font-extrabold text-[#2C1B57]">Smile Jobs Platform</div>
          </div>

          <div className="divide-y divide-[#EFEAF6] text-xs">
            {[
              {
                feature: 'Candidate Verification',
                traditional: 'Self-reported resume claims (High fraud)',
                smileJobs: 'Government ID, EPFO Tax & Degree Audited',
              },
              {
                feature: 'Average Time to Shortlist',
                traditional: '14 – 21 Days across spreadsheets',
                smileJobs: 'Under 48 Hours with instant pipeline',
              },
              {
                feature: 'Credential Reliability',
                traditional: '12% – 18% falsified experience',
                smileJobs: '0% Falsehood tolerance with cryptographic seal',
              },
              {
                feature: 'Interview Scheduling',
                traditional: '5 to 10 email exchanges per candidate',
                smileJobs: '1-click Cal/Meet/Zoom panel booking',
              },
              {
                feature: 'Cost per Verified Hire',
                traditional: '₹45,000 – ₹90,000 (Agency markup 15%)',
                smileJobs: '₹12,400 flat unified subscription',
              },
            ].map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-0 py-5 px-5 sm:px-6 items-center hover:bg-[#FCFCF7]/70 transition-colors"
              >
                <div className="sm:col-span-4 font-bold text-[#2C1B57] text-sm sm:text-xs">
                  {row.feature}
                </div>
                <div className="sm:col-span-4 text-[#6F687A] flex items-start gap-1.5">
                  <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span><span className="sm:hidden font-bold">Traditional: </span>{row.traditional}</span>
                </div>
                <div className="sm:col-span-4 font-bold text-emerald-800 flex items-start gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><span className="sm:hidden">Smile Jobs: </span>{row.smileJobs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-[#E8E3EF] py-24 sm:py-28 px-5 sm:px-10 lg:px-14 xl:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-12">
            <h2 className="max-w-xl text-3xl sm:text-5xl font-extrabold tracking-[-0.04em] text-[#2C1B57] leading-[1.1]">From open role to open conversation.</h2>
            <p className="max-w-sm text-sm sm:text-base text-[#49454F]">A straightforward path through the moments that matter in hiring.</p>
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

      {/* Final Call to Action Band with Full-Width Presence */}
      <section className="pb-24 px-6 sm:px-10 lg:px-14 xl:px-20 max-w-[1440px] mx-auto w-full">
        <div className="bg-[#2C1B57] rounded-3xl p-10 sm:p-14 lg:p-16 text-white relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10 border border-white/10">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B29CFE]">
              Make your next move count
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
              Your next great hire may already be verified.
            </h2>
            <p className="text-base text-white/70 leading-relaxed font-normal">
              Bring your roles, talent, and hiring decisions together. Start with your first job listing.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3.5 shrink-0">
            <button
              onClick={() => onNavigate('post-job')}
              className="px-8 py-4 bg-white text-[#2C1B57] hover:bg-[#FCFCF7] text-sm font-extrabold rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>Post a Job Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('candidates')}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-extrabold rounded-2xl transition-all"
            >
              Explore Verified Talent
            </button>
          </div>

          {/* Decorative ambient backdrop */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-radial from-[#B29CFE]/30 to-transparent blur-3xl pointer-events-none" />
        </div>
      </section>

      <footer className="mt-auto border-t border-[#E8E3EF] bg-white pt-16 pb-8 px-5 sm:px-10 lg:px-14 xl:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-[2fr_repeat(4,1fr)] gap-9 pb-14">
            <div className="col-span-2 sm:col-span-4 lg:col-span-1">
              <span className="text-xl font-extrabold tracking-tight text-[#2C1B57]">Smile Jobs</span>
              <p className="mt-3 max-w-[25ch] text-sm leading-relaxed text-[#6F687A]">Verified hiring infrastructure for modern teams.</p>
            </div>
            <div className="space-y-3 text-sm"><h3 className="font-bold text-[#2C1B57]">Platform</h3><a href="#showcase" className="block text-[#6F687A] hover:text-[#42326E]">Product tour</a><button onClick={() => onNavigate('dashboard')} className="block text-[#6F687A] hover:text-[#42326E]">Recruiter console</button><button onClick={() => onNavigate('post-job')} className="block text-[#6F687A] hover:text-[#42326E]">Post a job</button></div>
            <div className="space-y-3 text-sm"><h3 className="font-bold text-[#2C1B57]">Talent</h3><button onClick={() => onNavigate('candidates')} className="block text-[#6F687A] hover:text-[#42326E]">Browse candidates</button><a href="#comparison" className="block text-[#6F687A] hover:text-[#42326E]">Why Smile Jobs</a></div>
            <div className="space-y-3 text-sm"><h3 className="font-bold text-[#2C1B57]">Account</h3><button onClick={() => onNavigate(authUser ? 'profile' : 'login')} className="block text-[#6F687A] hover:text-[#42326E]">{authUser ? 'My profile' : 'Sign in'}</button><button onClick={() => onOpenInfo('contact')} className="block text-[#6F687A] hover:text-[#42326E]">Contact support</button></div>
            <div className="space-y-3 text-sm"><h3 className="font-bold text-[#2C1B57]">Legal</h3><button onClick={() => onOpenInfo('privacy')} className="block text-[#6F687A] hover:text-[#42326E]">Privacy & security</button><button onClick={() => onOpenInfo('terms')} className="block text-[#6F687A] hover:text-[#42326E]">Terms of service</button></div>
          </div>
          <div className="border-t border-[#E8E3EF] pt-6 text-xs text-[#6F687A]">© 2026 Smile Jobs. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
