import React, { useState, useEffect, useCallback } from 'react';
import { AppRoute } from '../types';
import { jobService } from '../services/jobService';
import {
  ArrowLeft,
  Edit3,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Star,
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Award,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  User,
  GraduationCap,
  Calendar,
  Zap,
  Shield,
  TrendingUp,
  Target,
  BookOpen,
  Heart,
  Share2,
  ChevronRight,
  Eye,
  Sparkles,
  BadgeCheck,
  Timer,
  BarChart3,
  Bookmark,
  FileText,
  Languages,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   INTERFACES
   ═══════════════════════════════════════════════════════════════════════ */
interface JobDetailsViewProps {
  jobId: string;
  onNavigate: (route: AppRoute) => void;
  onEditJob?: (jobId: string) => void;
  onShowToast?: (msg: string) => void;
}

interface BackendJob {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: { url?: string; publicId?: string };
  companyWebsite?: string;
  industry?: string;
  establishedYear?: number;
  organizationSize?: string;
  companyInitials?: string;
  location?: { address?: string; city?: string; state?: string; country?: string };
  salary?: { min?: number; max?: number; currency?: string; period?: string };
  experience?: { min?: number; max?: number; text?: string };
  jobType?: string;
  workMode?: string;
  department?: string;
  role?: string;
  qualification?: string;
  applicationUrl?: string;
  status: 'Live' | 'Draft' | 'Paused' | 'Closed';
  featured?: boolean;
  applicantsCount?: number;
  applicantsCap?: number;
  skills?: string[];
  languages?: string[];
  jobDescription?: string;
  responsibilities?: string[] | string;
  requirements?: string[] | string;
  benefits?: string[] | string;
  noticePeriod?: string;
  workingDays?: string;
  jobTiming?: string;
  contactPerson?: { name?: string; designation?: string };
  recruiterEmail?: string;
  recruiterMobileNumber?: string;
  recruiterWhatsappNumber?: string;
  contactVisibility?: { whatsapp?: boolean; mobile?: boolean };
  noPaymentInvolved?: boolean;
  postedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isCompanyVerified?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */
const getCurrencySymbol = (c?: string): string => {
  const map: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SGD: 'S$' };
  return map[(c || 'INR').toUpperCase()] || c || '₹';
};

const formatSalary = (min?: number, max?: number, currency?: string, period?: string): string => {
  if (!min && !max) return 'Not disclosed';
  const sym = getCurrencySymbol(currency);
  const perMap: Record<string, string> = { year: '/year', month: '/month', hour: '/hour', day: '/day', week: '/week' };
  const per = perMap[period || ''] || '';
  const fmt = (n: number) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
    if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, '')} L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return n.toLocaleString('en-IN');
  };
  if (min && max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}${per}`;
  if (min) return `${sym}${fmt(min)}+${per}`;
  if (max) return `Up to ${sym}${fmt(max)}${per}`;
  return 'Not disclosed';
};

const formatFullSalary = (min?: number, max?: number, currency?: string, period?: string): string => {
  if (!min && !max) return 'Not disclosed';
  const sym = getCurrencySymbol(currency);
  const perMap: Record<string, string> = { year: ' per year', month: ' per month', hour: ' per hour', day: ' per day', week: ' per week' };
  const per = perMap[period || ''] || '';
  const fmt = (n: number) => n.toLocaleString('en-IN');
  if (min && max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}${per}`;
  if (min) return `From ${sym}${fmt(min)}${per}`;
  if (max) return `Up to ${sym}${fmt(max)}${per}`;
  return 'Not disclosed';
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatRelativeDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
};

const toArray = (v?: string[] | string): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return v.split('\n').map(s => s.trim()).filter(Boolean);
};

const getExperienceLabel = (job: BackendJob): string => {
  if (job.experience?.text) return job.experience.text;
  const min = job.experience?.min;
  const max = job.experience?.max;
  if (min !== undefined && max !== undefined) {
    if (min === 0 && max === 0) return 'Fresher';
    if (min === 0 && max === 1) return 'Fresher / 0-1 year';
    if (min === max) return `${min} year${min > 1 ? 's' : ''}`;
    return `${min} – ${max} years`;
  }
  if (min !== undefined) return `${min}+ years`;
  if (max !== undefined) return `Up to ${max} years`;
  return 'Any experience';
};

const getLocationLabel = (job: BackendJob): string => {
  const parts: string[] = [];
  if (job.location?.city) parts.push(job.location.city);
  if (job.location?.state) parts.push(job.location.state);
  return parts.join(', ') || 'Not specified';
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export const JobDetailsView: React.FC<JobDetailsViewProps> = ({
  jobId,
  onNavigate,
  onEditJob,
  onShowToast,
}) => {
  const [job, setJob] = useState<BackendJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'company' | 'contact'>('overview');

  const fetchJob = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await jobService.getJob(jobId);
      const data = res.data?.job || res.data || res;
      setJob(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) fetchJob();
  }, [jobId, fetchJob]);

  const handleShare = async () => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: job?.title || 'Job', text: `Check out this job: ${job?.title}`, url });
      } catch { /* user cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      onShowToast?.('🔗 Link copied to clipboard');
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-14 h-14 rounded-2xl bg-[#F8F5FF] flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#42326E]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#2C1B57]">Loading job details</p>
          <p className="text-xs text-[#6F687A] mt-1">Please wait...</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !job) {
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto">
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 mx-auto flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-extrabold text-[#2C1B57] mb-2">Unable to Load Job</h3>
          <p className="text-sm text-[#6F687A] mb-6">{error || 'The requested job could not be found.'}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={fetchJob}
              className="px-5 py-2.5 bg-white border border-[#E8E3EF] text-[#42326E] text-xs font-bold rounded-xl hover:bg-[#F8F5FF] transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => onNavigate('my-jobs')}
              className="px-5 py-2.5 bg-[#42326E] text-white text-xs font-bold rounded-xl hover:bg-[#322554] transition-all inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const responsibilities = toArray(job.responsibilities);
  const requirements = toArray(job.requirements);
  const benefits = toArray(job.benefits);

  const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    Live: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Active' },
    Draft: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400', label: 'Draft' },
    Paused: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Paused' },
    Closed: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Closed' },
  };
  const st = statusConfig[job.status] || statusConfig.Draft;

  return (
    <div className="animate-in fade-in duration-200">
      {/* ═══════════ STICKY TOP BAR ═══════════ */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E3EF]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between gap-3">
            <button
              onClick={() => onNavigate('my-jobs')}
              className="flex items-center gap-1.5 text-xs font-bold text-[#6F687A] hover:text-[#2C1B57] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">My Jobs</span>
            </button>

            <div className="flex-1 min-w-0 text-center hidden md:block">
              <p className="text-xs font-bold text-[#2C1B57] truncate">{job.title}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleShare}
                className="p-2 text-[#6F687A] hover:text-[#2C1B57] hover:bg-[#F8F5FF] rounded-lg transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEditJob?.(jobId)}
                className="px-3.5 py-2 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Job</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-5 md:py-6 space-y-5">

        {/* ═══════════ HERO SECTION ═══════════ */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-[#E8E3EF] shadow-sm overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#42326E] via-[#B29CFE] to-[#42326E]" />

          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Company Logo */}
              <div className="shrink-0">
                {job.companyLogo?.url ? (
                  <img
                    src={job.companyLogo.url}
                    alt={job.companyName}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl object-cover border border-[#E8E3EF] shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#42326E] to-[#B29CFE] text-white flex items-center justify-center font-extrabold text-lg md:text-xl shadow-xs">
                    {job.companyInitials || job.companyName?.charAt(0) || 'C'}
                  </div>
                )}
              </div>

              {/* Title & Meta */}
              <div className="flex-1 min-w-0">
                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${st.bg} ${st.text} inline-flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${job.status === 'Live' ? 'animate-pulse' : ''}`} />
                    {st.label}
                  </span>
                  {job.featured && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      Featured
                    </span>
                  )}
                  {job.noPaymentInvolved && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      Free to Apply
                    </span>
                  )}
                  {job.isCompanyVerified && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                      <BadgeCheck className="w-2.5 h-2.5" />
                      Verified
                    </span>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-extrabold text-[#2C1B57] tracking-tight leading-tight">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-[#6F687A] font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {job.companyName}
                  </span>
                  <span className="text-[#D7C8ED]">•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {getLocationLabel(job)}
                  </span>
                  <span className="text-[#D7C8ED]">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Posted {formatRelativeDate(job.postedAt || job.createdAt)}
                  </span>
                </div>

                {(job.department || job.role) && (
                  <div className="mt-1.5 text-[11px] text-[#98A2B3] font-semibold">
                    {[job.department, job.role].filter(Boolean).join(' • ')}
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 mt-5 pt-5 border-t border-[#EFEAF6]">
              <MetricCard
                icon={DollarSign}
                label="Compensation"
                value={formatSalary(job.salary?.min, job.salary?.max, job.salary?.currency, job.salary?.period)}
                subtext={job.salary?.period ? `Per ${job.salary.period}` : undefined}
                color="emerald"
              />
              <MetricCard
                icon={TrendingUp}
                label="Experience"
                value={getExperienceLabel(job)}
                color="blue"
              />
              <MetricCard
                icon={Briefcase}
                label="Type"
                value={`${job.jobType || 'N/A'}`}
                subtext={job.workMode}
                color="purple"
              />
              <MetricCard
                icon={Users}
                label="Applicants"
                value={`${job.applicantsCount || 0}`}
                subtext={job.applicantsCap ? `of ${job.applicantsCap} cap` : 'No cap'}
                color="amber"
              />
            </div>
          </div>
        </div>

        {/* ═══════════ MOBILE TABS ═══════════ */}
        <div className="flex md:hidden bg-white rounded-xl border border-[#E8E3EF] p-1 gap-1">
          {([
            { key: 'overview' as const, label: 'Overview', icon: FileText },
            { key: 'company' as const, label: 'Company', icon: Building2 },
            { key: 'contact' as const, label: 'Contact', icon: User },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-[#42326E] text-white shadow-sm'
                  : 'text-[#6F687A] hover:bg-[#F8F5FF]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════ CONTENT GRID ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ─── LEFT COLUMN (Main Content) ─── */}
          <div className={`lg:col-span-8 space-y-4 ${activeTab !== 'overview' ? 'hidden md:block' : ''}`}>

            {/* Description */}
            {job.jobDescription && (
              <ContentCard title="About This Role" icon={BookOpen} priority>
                <p className="text-[13px] md:text-sm text-[#49454F] leading-relaxed whitespace-pre-wrap">
                  {job.jobDescription}
                </p>
              </ContentCard>
            )}

            {/* Responsibilities */}
            {responsibilities.length > 0 && (
              <ContentCard title="Key Responsibilities" icon={Target}>
                <div className="space-y-2.5">
                  {responsibilities.map((r, i) => (
                    <div key={i} className="flex gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-200 transition-colors">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </div>
                      <p className="text-[13px] text-[#49454F] leading-relaxed flex-1">{r}</p>
                    </div>
                  ))}
                </div>
              </ContentCard>
            )}

            {/* Requirements */}
            {requirements.length > 0 && (
              <ContentCard title="Requirements" icon={Award}>
                <div className="space-y-2.5">
                  {requirements.map((r, i) => (
                    <div key={i} className="flex gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-[#F8F5FF] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#EDE6FA] transition-colors">
                        <ChevronRight className="w-3 h-3 text-[#42326E]" />
                      </div>
                      <p className="text-[13px] text-[#49454F] leading-relaxed flex-1">{r}</p>
                    </div>
                  ))}
                </div>
              </ContentCard>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <ContentCard title="Skills Required" icon={Zap}>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-[#F8F5FF] border border-[#E8E3EF] text-[#42326E] rounded-lg text-xs font-semibold hover:bg-[#EDE6FA] hover:border-[#D7C8ED] transition-colors cursor-default"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </ContentCard>
            )}

            {/* Benefits */}
            {benefits.length > 0 && (
              <ContentCard title="Benefits & Perks" icon={Heart}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {benefits.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-emerald-50/60 to-transparent border border-emerald-100 rounded-xl"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-xs font-semibold text-[#2C1B57]">{b}</span>
                    </div>
                  ))}
                </div>
              </ContentCard>
            )}
          </div>

          {/* ─── RIGHT COLUMN (Sidebar) ─── */}
          <div className={`lg:col-span-4 space-y-4 ${activeTab === 'overview' ? 'hidden md:block' : ''}`}>

            {/* Job Specs */}
            <div className={`${activeTab !== 'overview' && activeTab !== 'company' ? 'hidden md:block' : ''}`}>
              <SidebarCard title="Job Specifications" icon={Briefcase}>
                <div className="divide-y divide-[#EFEAF6]">
                  <SpecRow icon={Briefcase} label="Employment" value={job.jobType} />
                  <SpecRow icon={Globe} label="Work Mode" value={job.workMode} />
                  <SpecRow icon={GraduationCap} label="Qualification" value={job.qualification} />
                  <SpecRow icon={Timer} label="Notice Period" value={job.noticePeriod} />
                  <SpecRow icon={Calendar} label="Working Days" value={job.workingDays} />
                  <SpecRow icon={Clock} label="Timing" value={job.jobTiming} />
                </div>
              </SidebarCard>
            </div>

            {/* Salary Breakdown */}
            {(job.salary?.min || job.salary?.max) && (
              <div className={`${activeTab !== 'overview' ? 'hidden md:block' : ''}`}>
                <SidebarCard title="Compensation Details" icon={DollarSign}>
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-emerald-50/30 border border-emerald-200 rounded-xl mb-3">
                    <div className="text-base md:text-lg font-extrabold text-emerald-800 text-center">
                      {formatFullSalary(job.salary?.min, job.salary?.max, job.salary?.currency, job.salary?.period)}
                    </div>
                    <p className="text-[10px] text-emerald-600 font-semibold text-center mt-1 uppercase tracking-wider">
                      {job.salary?.currency} • {job.salary?.period || 'N/A'}
                    </p>
                  </div>
                </SidebarCard>
              </div>
            )}

            {/* Languages */}
            {job.languages && job.languages.length > 0 && (
              <div className={`${activeTab !== 'overview' ? 'hidden md:block' : ''}`}>
                <SidebarCard title="Languages" icon={Languages}>
                  <div className="flex flex-wrap gap-2">
                    {job.languages.map((l, i) => (
                      <span key={i} className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-bold">
                        {l}
                      </span>
                    ))}
                  </div>
                </SidebarCard>
              </div>
            )}

            {/* Company Card */}
            <div className={`${activeTab !== 'overview' && activeTab !== 'company' ? 'hidden md:block' : ''}`}>
              <SidebarCard title="About the Company" icon={Building2}>
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#EFEAF6]">
                  {job.companyLogo?.url ? (
                    <img src={job.companyLogo.url} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#E8E3EF]" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#42326E] to-[#B29CFE] text-white flex items-center justify-center font-bold text-sm">
                      {job.companyInitials || job.companyName?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#2C1B57] truncate flex items-center gap-1">
                      {job.companyName}
                      {job.isCompanyVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    </p>
                    {job.industry && (
                      <p className="text-[11px] text-[#6F687A]">{job.industry}</p>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-[#EFEAF6]">
                  <SpecRow icon={BarChart3} label="Size" value={job.organizationSize} />
                  <SpecRow icon={Calendar} label="Founded" value={job.establishedYear?.toString()} />
                </div>
                {job.companyWebsite && (
                  <a
                    href={job.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#42326E] hover:text-[#322554] hover:underline break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    Visit Website
                  </a>
                )}
              </SidebarCard>
            </div>

            {/* Location */}
            <div className={`${activeTab !== 'overview' && activeTab !== 'company' ? 'hidden md:block' : ''}`}>
              <SidebarCard title="Work Location" icon={MapPin}>
                <div className="space-y-1">
                  {job.location?.address && (
                    <p className="text-xs text-[#49454F] font-medium">{job.location.address}</p>
                  )}
                  <p className="text-xs font-bold text-[#2C1B57]">
                    {getLocationLabel(job)}
                  </p>
                  <p className="text-[11px] text-[#98A2B3] flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {job.location?.country || 'India'}
                  </p>
                </div>
              </SidebarCard>
            </div>

            {/* Recruiter Contact */}
            {(job.contactPerson?.name || job.recruiterEmail || job.recruiterMobileNumber) && (
              <div className={`${activeTab !== 'overview' && activeTab !== 'contact' ? 'hidden md:block' : ''}`}>
                <SidebarCard title="Recruiter Contact" icon={User}>
                  <div className="space-y-3">
                    {job.contactPerson?.name && (
                      <div className="flex items-center gap-3 pb-3 border-b border-[#EFEAF6]">
                        <div className="w-10 h-10 rounded-full bg-[#F8F5FF] flex items-center justify-center">
                          <User className="w-5 h-5 text-[#42326E]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#2C1B57] truncate">{job.contactPerson.name}</p>
                          {job.contactPerson.designation && (
                            <p className="text-[11px] text-[#6F687A] truncate">{job.contactPerson.designation}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {job.recruiterEmail && (
                      <a
                        href={`mailto:${job.recruiterEmail}`}
                        className="flex items-center gap-2.5 p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs font-semibold text-blue-800 hover:bg-blue-50 transition-colors break-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="truncate">{job.recruiterEmail}</span>
                      </a>
                    )}

                    {job.contactVisibility?.mobile !== false && job.recruiterMobileNumber && (
                      <a
                        href={`tel:${job.recruiterMobileNumber}`}
                        className="flex items-center gap-2.5 p-2.5 bg-[#F8F5FF] border border-[#E8E3EF] rounded-xl text-xs font-semibold text-[#42326E] hover:bg-[#EDE6FA] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#EDE6FA] flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-[#42326E]" />
                        </div>
                        <span>{job.recruiterMobileNumber}</span>
                      </a>
                    )}

                    {job.contactVisibility?.whatsapp !== false && job.recruiterWhatsappNumber && (
                      <a
                        href={`https://wa.me/${job.recruiterWhatsappNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </SidebarCard>
              </div>
            )}

            {/* Apply Button */}
            {job.applicationUrl && (
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3.5 bg-[#42326E] hover:bg-[#322554] text-white text-sm font-bold rounded-xl shadow-md text-center transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Application Page
              </a>
            )}

            {/* Timestamps */}
            <div className="p-3 bg-[#FAFAFA] border border-[#EFEAF6] rounded-xl">
              <div className="flex items-center justify-between text-[10px] text-[#98A2B3] font-medium">
                <span>Posted: {formatDate(job.postedAt || job.createdAt)}</span>
                <span>Updated: {formatDate(job.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ MOBILE BOTTOM ACTION BAR ═══════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-[#E8E3EF] px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleShare}
            className="p-2.5 bg-[#F8F5FF] border border-[#E8E3EF] text-[#42326E] rounded-xl"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => onEditJob?.(jobId)}
            className="flex-1 py-3 bg-[#42326E] hover:bg-[#322554] text-white text-sm font-bold rounded-xl shadow-md inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Edit3 className="w-4 h-4" />
            Edit This Job
          </button>
        </div>
      </div>

      {/* Bottom spacer for mobile action bar */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

const MetricCard: React.FC<{
  icon: any;
  label: string;
  value: string;
  subtext?: string;
  color: 'emerald' | 'blue' | 'purple' | 'amber';
}> = ({ icon: Icon, label, value, subtext, color }) => {
  const colors = {
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-700', value: 'text-emerald-800' },
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-700', value: 'text-blue-800' },
    purple: { bg: 'bg-[#F8F5FF]', icon: 'bg-[#EDE6FA] text-[#42326E]', value: 'text-[#2C1B57]' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-700', value: 'text-amber-800' },
  }[color];

  return (
    <div className={`${colors.bg} rounded-xl p-3 md:p-3.5 border border-transparent hover:border-[#E8E3EF] transition-colors`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-6 h-6 rounded-md ${colors.icon} flex items-center justify-center`}>
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-[10px] font-bold text-[#6F687A] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xs md:text-sm font-extrabold ${colors.value} truncate`}>{value}</p>
      {subtext && (
        <p className="text-[10px] text-[#98A2B3] font-medium mt-0.5 truncate">{subtext}</p>
      )}
    </div>
  );
};

const ContentCard: React.FC<{
  title: string;
  icon: any;
  children: React.ReactNode;
  priority?: boolean;
}> = ({ title, icon: Icon, children, priority }) => (
  <div className={`bg-white rounded-xl md:rounded-2xl border border-[#E8E3EF] shadow-xs overflow-hidden ${priority ? 'ring-1 ring-[#E8E3EF]' : ''}`}>
    <div className="px-4 md:px-5 py-3.5 border-b border-[#EFEAF6] bg-[#FAFAFA]/50">
      <h3 className="text-sm font-extrabold text-[#2C1B57] flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-[#F8F5FF] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[#42326E]" />
        </div>
        {title}
      </h3>
    </div>
    <div className="p-4 md:p-5">
      {children}
    </div>
  </div>
);

const SidebarCard: React.FC<{
  title: string;
  icon: any;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl md:rounded-2xl border border-[#E8E3EF] shadow-xs overflow-hidden">
    <div className="px-4 py-3 border-b border-[#EFEAF6] bg-[#FAFAFA]/50">
      <h3 className="text-xs font-extrabold text-[#2C1B57] flex items-center gap-2 uppercase tracking-wide">
        <Icon className="w-3.5 h-3.5 text-[#42326E]" />
        {title}
      </h3>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

const SpecRow: React.FC<{
  icon: any;
  label: string;
  value?: string;
}> = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
      <span className="text-[11px] text-[#6F687A] font-semibold flex items-center gap-1.5 shrink-0">
        <Icon className="w-3 h-3 text-[#98A2B3]" />
        {label}
      </span>
      <span className="text-[11px] font-bold text-[#2C1B57] text-right truncate">{value}</span>
    </div>
  );
};

export default JobDetailsView;