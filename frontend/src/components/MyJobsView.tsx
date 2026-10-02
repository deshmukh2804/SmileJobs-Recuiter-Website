import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppRoute } from '../types';
import { jobService } from '../services/jobService';
import {
  Plus,
  Search,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  XCircle,
  Trash2,
  Edit3,
  Users,
  MapPin,
  Star,
  StarOff,
  Eye,
  Loader2,
  Briefcase,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   INTERFACES
   ═══════════════════════════════════════════════════════════════════════ */
interface MyJobsViewProps {
  onNavigate: (route: AppRoute) => void;
  onEditJob?: (jobId: string) => void;
  onViewJob?: (jobId: string) => void;
  onViewApplicants?: (jobId: string, jobTitle: string) => void;
  onShowToast?: (msg: string) => void;
}

interface BackendJob {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: { url?: string; publicId?: string };
  location?: { address?: string; city?: string; state?: string; country?: string };
  salary?: { min?: number; max?: number; currency?: string; period?: string };
  experience?: { min?: number; max?: number; text?: string };
  jobType?: string;
  workMode?: string;
  department?: string;
  role?: string;
  status: 'Live' | 'Draft' | 'Paused' | 'Closed';
  isActive?: boolean;
  featured?: boolean;
  isNew?: boolean;
  applicantsCount?: number;
  applicantsCap?: number;
  skills?: string[];
  languages?: string[];
  benefits?: string[];
  responsibilities?: string[];
  requirements?: string[];
  postedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isCompanyVerified?: boolean;
  companyWebsite?: string;
  industry?: string;
  establishedYear?: number;
  organizationSize?: string;
  jobTiming?: string;
  workingDays?: string;
  noticePeriod?: string;
  applicationUrl?: string;
  noPaymentInvolved?: boolean;
  contactPerson?: { name?: string; designation?: string };
  recruiterEmail?: string;
  recruiterMobileNumber?: string;
  recruiterWhatsappNumber?: string;
  contactVisibility?: { whatsapp?: boolean; mobile?: boolean };
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All Jobs' },
  { key: 'Live', label: 'Active' },
  { key: 'Draft', label: 'Draft' },
  { key: 'Paused', label: 'Paused' },
  { key: 'Closed', label: 'Closed' },
];

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */
const formatDate = (dateStr?: string): string => {
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
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const getCurrencySymbol = (c?: string): string => {
  const map: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  return map[(c || 'INR').toUpperCase()] || '₹';
};

const formatSalary = (min?: number, max?: number, currency?: string, period?: string): string => {
  if (!min && !max) return 'Not disclosed';
  const sym = getCurrencySymbol(currency);
  const per = period === 'year' ? '/yr' : period === 'month' ? '/mo' : period === 'hour' ? '/hr' : '';
  const fmt = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString('en-IN');
  };
  if (min && max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}${per}`;
  if (min) return `${sym}${fmt(min)}+${per}`;
  if (max) return `Up to ${sym}${fmt(max)}${per}`;
  return 'Not disclosed';
};

const formatExperience = (min?: number, max?: number, text?: string): string => {
  if (text) return text;
  if (min !== undefined && max !== undefined && (min > 0 || max > 0)) {
    if (min === max) return `${min} yr${min > 1 ? 's' : ''}`;
    return `${min}-${max} yrs`;
  }
  return 'Any';
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export const MyJobsView: React.FC<MyJobsViewProps> = ({
  onNavigate,
  onEditJob,
  onViewJob,
  onViewApplicants,
  onShowToast,
}) => {
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuJobId, setActiveMenuJobId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'applicants'>('newest');
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await jobService.listMyJobs();
      const list = res.data?.jobs || res.data || [];
      setJobs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Dropdown automatic dismiss handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuJobId(null);
      }
    };
    if (activeMenuJobId) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [activeMenuJobId]);

  // SAFE DYNAMIC PAYLOAD BUILDER: Prevents array deletion on partial updates
  const prepareJobPayload = (job: BackendJob, updates: Partial<BackendJob>) => {
    const merged = { ...job, ...updates };
    return {
      title: merged.title,
      companyName: merged.companyName,
      companyWebsite: merged.companyWebsite || "",
      industry: merged.industry || "",
      establishedYear: merged.establishedYear || null,
      organizationSize: merged.organizationSize || "",
      department: merged.department || "",
      role: merged.role || merged.title,
      qualification: merged.qualification || "",
      jobType: merged.jobType || "Full-Time",
      workMode: merged.workMode || "On-site",
      jobDescription: merged.jobDescription || "",
      jobTiming: merged.jobTiming || "",
      workingDays: merged.workingDays || "",
      noticePeriod: merged.noticePeriod || "",
      applicationUrl: merged.applicationUrl || "",
      noPaymentInvolved: merged.noPaymentInvolved !== false,
      featured: !!merged.featured,
      status: merged.status,
      // Pass safe values or arrays (splitCSV handles them safely on backend)
      skills: merged.skills || [],
      languages: merged.languages || [],
      benefits: merged.benefits || [],
      responsibilities: merged.responsibilities || [],
      requirements: merged.requirements || [],
      location: {
        address: merged.location?.address || "",
        city: merged.location?.city || "",
        state: merged.location?.state || "",
        country: merged.location?.country || "India",
      },
      salary: {
        min: merged.salary?.min || 0,
        max: merged.salary?.max || 0,
        currency: merged.salary?.currency || "INR",
        period: merged.salary?.period || "month",
      },
      experience: {
        min: merged.experience?.min || 0,
        max: merged.experience?.max || 0,
        text: merged.experience?.text || "",
      },
      contactPerson: {
        name: merged.contactPerson?.name || "",
        designation: merged.contactPerson?.designation || "",
      },
      contactVisibility: {
        whatsapp: merged.contactVisibility?.whatsapp !== false,
        mobile: merged.contactVisibility?.mobile !== false,
      },
      recruiterEmail: merged.recruiterEmail || "",
      recruiterMobileNumber: merged.recruiterMobileNumber || "",
      recruiterWhatsappNumber: merged.recruiterWhatsappNumber || "",
    };
  };

  const filteredJobs = useMemo(() => {
    let list = jobs.filter(job => {
      const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        job.title?.toLowerCase().includes(q) ||
        job.department?.toLowerCase().includes(q) ||
        job.location?.city?.toLowerCase().includes(q) ||
        job.role?.toLowerCase().includes(q) ||
        job.companyName?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
    list.sort((a, b) => {
      if (sortBy === 'applicants') return (b.applicantsCount || 0) - (a.applicantsCount || 0);
      const aDate = new Date(a.postedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.postedAt || b.createdAt || 0).getTime();
      return sortBy === 'newest' ? bDate - aDate : aDate - bDate;
    });
    return list;
  }, [jobs, filterStatus, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total: jobs.length,
    live: jobs.filter(j => j.status === 'Live').length,
    draft: jobs.filter(j => j.status === 'Draft').length,
    paused: jobs.filter(j => j.status === 'Paused').length,
    closed: jobs.filter(j => j.status === 'Closed').length,
    totalApplicants: jobs.reduce((s, j) => s + (j.applicantsCount || 0), 0),
    featured: jobs.filter(j => j.featured).length,
  }), [jobs]);

  /* ═══ ACTIONS ═══ */
  const handleStatusChange = async (jobId: string, newStatus: 'Live' | 'Draft' | 'Paused' | 'Closed') => {
    setActionLoading(jobId);
    setActiveMenuJobId(null);
    setError(null);
    try {
      await jobService.updateStatus(jobId, newStatus);
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus, isActive: newStatus !== 'Closed' } : j));
      const msgs: Record<string, string> = { Live: '✓ Job activated successfully', Paused: '⏸ Job paused', Closed: '✕ Job closed', Draft: '✎ Moved to draft' };
      setSuccessMsg(msgs[newStatus] || 'Status updated');
      onShowToast?.(msgs[newStatus] || 'Status updated');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update job status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (job: BackendJob) => {
    setActionLoading(job._id);
    setActiveMenuJobId(null);
    setError(null);
    try {
      // Safe Payload wrapped to safeguard arrays from wiping out on partial updates
      const safePayload = prepareJobPayload(job, { featured: !job.featured });
      await jobService.updateJob(job._id, safePayload);
      
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, featured: !j.featured } : j));
      const msg = !job.featured ? '⭐ Job featured on listing' : 'Job unfeatured';
      setSuccessMsg(msg);
      onShowToast?.(msg);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle featured status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    setActionLoading(jobId);
    setConfirmDeleteId(null);
    setError(null);
    try {
      await jobService.deleteJob(jobId);
      setJobs(prev => prev.filter(j => j._id !== jobId));
      setSuccessMsg('🗑 Job listing deleted successfully');
      onShowToast?.('Job deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (jobId: string) => {
    setActiveMenuJobId(null);
    onEditJob ? onEditJob(jobId) : onShowToast?.('Edit function not configured');
  };

  const handleView = (jobId: string) => {
    setActiveMenuJobId(null);
    onViewJob ? onViewJob(jobId) : window.open(`/jobs/${jobId}`, '_blank');
  };

  const getStatusBadge = (status: BackendJob['status']) => {
    const configs: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      Live: { bg: 'bg-emerald-100/70 text-emerald-800 border border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500 animate-pulse', label: 'Active' },
      Draft: { bg: 'bg-slate-100 text-slate-700 border border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Draft' },
      Paused: { bg: 'bg-amber-100/70 text-amber-800 border border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Paused' },
      Closed: { bg: 'bg-rose-100/70 text-rose-800 border border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Closed' },
    };
    const c = configs[status] || configs.Draft;
    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${c.bg} inline-flex items-center gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  /* ═══ LOADING STATE ═══ */
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[420px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#42326E]" />
        <p className="text-sm text-[#6F687A] font-semibold animate-pulse">Syncing with database...</p>
      </div>
    );
  }

  /* ═══ RENDER ═══ */
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-200">

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8E3EF] p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#F8F5FF] flex items-center justify-center shrink-0">
              <Briefcase className="w-5.5 h-5.5 text-[#42326E]" />
            </div>
            Job Console
          </h1>
          <p className="text-xs text-[#6F687A] mt-1.5 ml-0.5">
            Manage, toggle, analyze, and oversee recruiter postings in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchJobs(true)}
            disabled={refreshing}
            className="p-2.5 bg-white border border-[#E8E3EF] hover:bg-[#F8F5FF] hover:border-[#D7C8ED] text-[#49454F] rounded-xl transition-all disabled:opacity-50"
            title="Reload Jobs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('post-job')}
            className="px-5 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* Action Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-200">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-xs text-red-700 font-semibold flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs text-emerald-700 font-semibold flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-[#5F8A72] hover:text-[#24593C]"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Interactive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <StatCard label="Total Posts" value={stats.total} icon={Briefcase} color="purple" onClick={() => setFilterStatus('all')} active={filterStatus === 'all'} />
        <StatCard label="Live Jobs" value={stats.live} icon={PlayCircle} color="emerald" onClick={() => setFilterStatus('Live')} active={filterStatus === 'Live'} />
        <StatCard label="Saved Drafts" value={stats.draft} icon={Edit3} color="gray" onClick={() => setFilterStatus('Draft')} active={filterStatus === 'Draft'} />
        <StatCard label="Paused" value={stats.paused} icon={PauseCircle} color="amber" onClick={() => setFilterStatus('Paused')} active={filterStatus === 'Paused'} />
        <StatCard label="Featured" value={stats.featured} icon={Star} color="yellow" />
        <StatCard label="Total Applicants" value={stats.totalApplicants} icon={Users} color="blue" />
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-[#E8E3EF] p-4 rounded-2xl shadow-xs space-y-3.5">
        {/* Horizontal Status Filter Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {STATUS_FILTERS.map(f => {
            const count = f.key === 'all' ? jobs.length : jobs.filter(j => j.status === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-2 border ${
                  filterStatus === f.key
                    ? 'bg-[#2C1B57] text-white border-[#2C1B57] shadow-sm'
                    : 'bg-[#FCFCF7] text-[#49454F] border-[#E8E3EF] hover:border-[#D7C8ED] hover:bg-[#F8F5FF]'
                }`}
              >
                {f.label}
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  filterStatus === f.key ? 'bg-white/20 text-white' : 'bg-[#F2F4F7] text-[#6F687A]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input and Sorting Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6F687A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search title, department, city or role..."
              className="w-full pl-9.5 pr-8 py-2.5 text-xs bg-white border border-[#E8E3EF] rounded-xl outline-none focus:border-[#42326E] focus:ring-2 focus:ring-[#42326E]/10 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#49454F]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-[#6F687A] uppercase tracking-wider ml-1">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs font-semibold py-2.5 px-3 bg-white border border-[#E8E3EF] rounded-xl outline-none focus:border-[#42326E] cursor-pointer hover:border-[#D7C8ED]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="applicants">Top Applicants</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty Fallback Screen */}
      {jobs.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-[#E8E3EF] p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#F8F5FF] mx-auto flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-[#42326E]" />
          </div>
          <h3 className="text-xl font-extrabold text-[#2C1B57] mb-2">No Active Listings</h3>
          <p className="text-sm text-[#6F687A] max-w-sm mx-auto mb-6">Establish your first career opportunity listing to start collecting talent pipeline matches.</p>
          <button
            onClick={() => onNavigate('post-job')}
            className="px-6 py-3 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Post Your First Job
          </button>
        </div>
      )}

      {/* ═══ DESKTOP CONSOLE VIEW (Sleek Admin-Grade Table) ═══ */}
      {jobs.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-[#E8E3EF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E8E3EF] text-[#6F687A] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Opportunity details</th>
                    <th className="py-4 px-4">Location</th>
                    <th className="py-4 px-4">Salary bandwidth</th>
                    <th className="py-4 px-4">Exp</th>
                    <th className="py-4 px-4">Timeline</th>
                    <th className="py-4 px-4 text-center">Applicants</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Console actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAF6]">
                  {filteredJobs.map(job => (
                    <tr key={job._id} className="hover:bg-[#FAFAFA]/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {job.companyLogo?.url ? (
                            <img src={job.companyLogo.url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#E8E3EF] shadow-xs" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                              {job.companyName?.slice(0, 2) || 'CF'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button onClick={() => handleView(job._id)} className="font-extrabold text-sm text-[#2C1B57] hover:text-[#42326E] truncate hover:underline text-left leading-tight">
                                {job.title}
                              </button>
                              {job.featured && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> Featured
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#6F687A] mt-1 font-medium truncate">
                              {job.department || 'General'} • {job.role || 'N/A'}
                            </div>
                            {job.skills && job.skills.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {job.skills.slice(0, 3).map((s, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-[#EDE6FA] rounded-md text-[9px] text-[#42326E] font-semibold border border-[#D7C8ED]">{s}</span>
                                ))}
                                {job.skills.length > 3 && <span className="text-[9px] text-[#98A2B3] self-center ml-0.5 font-bold">+{job.skills.length - 3} more</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold flex items-center gap-1 text-[#49454F]">
                          <MapPin className="w-3.5 h-3.5 text-[#98A2B3]" />
                          {job.location?.city || 'N/A'}
                        </div>
                        <div className="text-[10px] text-[#98A2B3] mt-1 font-medium">{job.workMode}</div>
                      </td>
                      <td className="py-4 px-4 text-[#49454F] font-extrabold text-[11px] font-mono">
                        {formatSalary(job.salary?.min, job.salary?.max, job.salary?.currency, job.salary?.period)}
                      </td>
                      <td className="py-4 px-4 text-[#49454F] font-bold text-[11px]">
                        {formatExperience(job.experience?.min, job.experience?.max, job.experience?.text)}
                      </td>
                      <td className="py-4 px-4 text-[#6F687A] font-semibold text-[11px]">
                        {formatDate(job.postedAt || job.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button onClick={() => onViewApplicants?.(job._id, job.title)} className="inline-flex items-center gap-1.5 font-extrabold text-sm text-[#2C1B57] hover:text-[#42326E] hover:underline bg-[#F8F5FF] border border-[#D7C8ED] px-2.5 py-1 rounded-lg">
                          <Users className="w-4 h-4 text-[#B29CFE]" />
                          {job.applicantsCount || 0}
                        </button>
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(job.status)}</td>
                      <td className="py-4 px-6 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleView(job._id)} className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-all" title="View Listing Page">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(job._id)} className="px-3 py-2 bg-[#EDE6FA] text-[#42326E] hover:bg-[#D7C8ED] text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5" title="Modify Opportunity">
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveMenuJobId(activeMenuJobId === job._id ? null : job._id); }}
                              disabled={actionLoading === job._id}
                              className="p-2 text-[#6F687A] hover:text-[#2C1B57] hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                            >
                              {actionLoading === job._id ? <Loader2 className="w-4 h-4 animate-spin text-[#42326E]" /> : <MoreVertical className="w-4 h-4" />}
                            </button>

                            {activeMenuJobId === job._id && (
                              <div ref={menuRef} className="absolute right-0 top-10.5 z-40 w-48 bg-white border border-[#E8E3EF] rounded-xl shadow-xl py-1 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-150">
                                <MenuBtn icon={Eye} label="View Public Listing" onClick={() => handleView(job._id)} color="text-blue-700" />
                                <MenuBtn icon={Edit3} label="Modify Details" onClick={() => handleEdit(job._id)} color="text-[#42326E]" />
                                <MenuBtn
                                  icon={job.featured ? StarOff : Star}
                                  label={job.featured ? 'Unfeature Job' : 'Feature Listing'}
                                  onClick={() => handleToggleFeatured(job)}
                                  color="text-amber-700"
                                />
                                <div className="border-t border-[#E8E3EF] my-1" />
                                {job.status !== 'Live' && <MenuBtn icon={PlayCircle} label="Publish Live" onClick={() => handleStatusChange(job._id, 'Live')} color="text-emerald-700" />}
                                {job.status === 'Live' && <MenuBtn icon={PauseCircle} label="Pause/Hold" onClick={() => handleStatusChange(job._id, 'Paused')} color="text-amber-700" />}
                                {job.status !== 'Draft' && <MenuBtn icon={Edit3} label="Move to Draft" onClick={() => handleStatusChange(job._id, 'Draft')} color="text-gray-700" />}
                                {job.status !== 'Closed' && <MenuBtn icon={XCircle} label="Close Status" onClick={() => handleStatusChange(job._id, 'Closed')} color="text-rose-700" />}
                                <div className="border-t border-[#E8E3EF] my-1" />
                                <MenuBtn
                                  icon={Trash2}
                                  label="Delete Listing"
                                  onClick={() => { setActiveMenuJobId(null); setConfirmDeleteId(job._id); }}
                                  color="text-rose-700 font-bold"
                                  hoverBg="hover:bg-rose-50"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredJobs.length === 0 && jobs.length > 0 && (
              <div className="p-12 text-center text-[#6F687A] space-y-2 border-t border-[#E8E3EF]">
                <Search className="w-8 h-8 mx-auto text-[#98A2B3]" />
                <p className="font-extrabold text-sm text-[#2C1B57]">No search results found</p>
                <p className="text-xs text-[#98A2B3]">Try resetting filter tab settings or search query</p>
                <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="mt-3 px-4 py-2 border border-[#E8E3EF] hover:border-[#D7C8ED] text-xs font-bold text-[#42326E] rounded-xl hover:bg-[#F8F5FF] transition-all">Clear criteria</button>
              </div>
            )}
          </div>

          {/* ═══ MOBILE CARDS VIEW ═══ */}
          <div className="md:hidden space-y-4">
            {filteredJobs.length === 0 && jobs.length > 0 && (
              <div className="p-10 text-center text-[#6F687A] bg-white rounded-2xl border border-[#E8E3EF]">
                <Search className="w-7 h-7 mx-auto text-[#98A2B3] mb-2" />
                <p className="font-extrabold text-sm text-[#2C1B57]">No matches found</p>
                <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="mt-3 text-xs font-bold text-[#42326E] hover:underline">Reset search filters</button>
              </div>
            )}

            {filteredJobs.map(job => (
              <div key={job._id} className="bg-white rounded-2xl border border-[#E8E3EF] shadow-xs overflow-hidden transition-transform duration-100">
                {/* Header Information */}
                <div className="p-4 pb-3">
                  <div className="flex items-start gap-3">
                    {job.companyLogo?.url ? (
                      <img src={job.companyLogo.url} alt="" className="w-11 h-11 rounded-xl object-cover border border-[#E8E3EF] shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] flex items-center justify-center font-bold text-xs shrink-0">
                        {job.companyName?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {getStatusBadge(job.status)}
                        {job.featured && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-bold border border-amber-200 inline-flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleView(job._id)} className="text-sm font-extrabold text-[#2C1B57] hover:text-[#42326E] text-left leading-tight">
                        {job.title}
                      </button>
                      <p className="text-[10px] text-[#6F687A] mt-1 font-semibold truncate">
                        {job.department || 'General'} • {job.role || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Highlight Chips */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <MobileInfoChip icon={MapPin} text={`${job.location?.city || 'N/A'} • ${job.workMode}`} />
                    <MobileInfoChip icon={Briefcase} text={formatSalary(job.salary?.min, job.salary?.max, job.salary?.currency, job.salary?.period)} />
                    <MobileInfoChip icon={Calendar} text={formatDate(job.postedAt || job.createdAt)} />
                    <MobileInfoChip icon={Users} text={`${job.applicantsCount || 0} Applicants`} />
                  </div>

                  {/* Top Tags */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {job.skills.slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#EDE6FA] rounded-md text-[9px] text-[#42326E] font-semibold border border-[#D7C8ED]">{s}</span>
                      ))}
                      {job.skills.length > 3 && <span className="text-[9px] text-[#98A2B3] self-center ml-0.5 font-bold">+{job.skills.length - 3} more</span>}
                    </div>
                  )}
                </div>

                {/* Mobile Button Actions */}
                <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[#E8E3EF] flex items-center gap-2">
                  <button onClick={() => handleView(job._id)} className="flex-1 py-2 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg inline-flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => handleEdit(job._id)} className="flex-1 py-2 bg-[#EDE6FA] text-[#42326E] text-[11px] font-bold rounded-lg inline-flex items-center justify-center gap-1.5 hover:bg-[#D7C8ED] transition-colors">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveMenuJobId(activeMenuJobId === job._id ? null : job._id); }}
                      disabled={actionLoading === job._id}
                      className="p-2 text-[#6F687A] hover:text-[#2C1B57] hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === job._id ? <Loader2 className="w-4 h-4 animate-spin text-[#42326E]" /> : <MoreVertical className="w-4 h-4" />}
                    </button>

                    {activeMenuJobId === job._id && (
                      <div ref={menuRef} className="absolute right-0 bottom-10.5 z-40 w-48 bg-white border border-[#E8E3EF] rounded-xl shadow-xl py-1 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <MenuBtn icon={job.featured ? StarOff : Star} label={job.featured ? 'Unfeature' : 'Mark Featured'} onClick={() => handleToggleFeatured(job)} color="text-amber-700" />
                        <div className="border-t border-[#E8E3EF] my-1" />
                        {job.status !== 'Live' && <MenuBtn icon={PlayCircle} label="Publish Live" onClick={() => handleStatusChange(job._id, 'Live')} color="text-emerald-700" />}
                        {job.status === 'Live' && <MenuBtn icon={PauseCircle} label="Pause Status" onClick={() => handleStatusChange(job._id, 'Paused')} color="text-amber-700" />}
                        {job.status !== 'Closed' && <MenuBtn icon={XCircle} label="Close Posting" onClick={() => handleStatusChange(job._id, 'Closed')} color="text-rose-700" />}
                        <div className="border-t border-[#E8E3EF] my-1" />
                        <MenuBtn icon={Trash2} label="Delete Listing" onClick={() => { setActiveMenuJobId(null); setConfirmDeleteId(job._id); }} color="text-rose-700 font-bold" hoverBg="hover:bg-rose-50" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Safeguard Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#E8E3EF] animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5.5 h-5.5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#2C1B57]">Delete Job Listing?</h3>
                <p className="text-xs text-[#6F687A]">This action is irreversible</p>
              </div>
            </div>
            
            <p className="text-sm text-[#49454F] leading-relaxed">
              Are you sure you want to permanently remove this job listing? All associated applicant submissions will be wiped, but shared assets like logos will be <strong>securely preserved</strong>.
            </p>

            <div className="flex gap-2.5 pt-1.5">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-[#E8E3EF] text-xs font-bold text-[#49454F] rounded-xl hover:bg-[#FAFAFA]"
              >
                Keep Listing
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   SUB COMPONENTS (STYLING WRAPPERS)
   ═══════════════════════════════════════════════════════════════════════ */

const MenuBtn: React.FC<{
  icon: any; label: string; onClick: () => void; color: string; hoverBg?: string;
}> = ({ icon: Icon, label, onClick, color, hoverBg = 'hover:bg-[#F7F4FA]' }) => (
  <button onClick={onClick} className={`w-full text-left px-3 py-2.5 ${hoverBg} ${color} flex items-center gap-2.5 transition-colors`}>
    <Icon className="w-4 h-4" /> {label}
  </button>
);

const MobileInfoChip: React.FC<{ icon: any; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-1.5 text-[10px] text-[#6F687A] font-semibold bg-[#FAFAFA] px-2 py-2 rounded-xl border border-[#E8E3EF]">
    <Icon className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
    <span className="truncate">{text}</span>
  </div>
);

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'purple' | 'emerald' | 'gray' | 'amber' | 'yellow' | 'blue';
  onClick?: () => void;
  active?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, onClick, active }) => {
  const colors = {
    purple: { bg: 'bg-[#F8F5FF]', text: 'text-[#42326E]', border: 'border-[#E8E3EF]', activeBorder: 'border-[#42326E] ring-2 ring-[#42326E]/10' },
    emerald: { bg: 'bg-emerald-50/50', text: 'text-emerald-700', border: 'border-emerald-100', activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/10' },
    gray: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', activeBorder: 'border-slate-400 ring-2 ring-slate-400/10' },
    amber: { bg: 'bg-amber-50/50', text: 'text-amber-700', border: 'border-amber-100', activeBorder: 'border-amber-500 ring-2 ring-amber-500/10' },
    yellow: { bg: 'bg-yellow-50/50', text: 'text-yellow-700', border: 'border-yellow-100', activeBorder: 'border-yellow-400 ring-2 ring-yellow-400/10' },
    blue: { bg: 'bg-blue-50/50', text: 'text-blue-700', border: 'border-blue-100', activeBorder: 'border-blue-500 ring-2 ring-blue-500/10' },
  }[color];

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-2xl border transition-all ${onClick ? 'cursor-pointer hover:shadow-xs' : ''} ${
        active ? colors.activeBorder : `${colors.border} ${colors.bg}`
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <Icon className={`w-4 h-4 ${colors.text}`} />
        <span className={`text-lg md:text-xl font-extrabold font-mono ${colors.text}`}>{value}</span>
      </div>
      <p className="text-[10px] font-bold text-[#6F687A] uppercase tracking-wider">{label}</p>
    </div>
  );
};

export default MyJobsView;