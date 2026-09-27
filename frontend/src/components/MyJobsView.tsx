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
  postedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isCompanyVerified?: boolean;
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
    try {
      await jobService.updateStatus(jobId, newStatus);
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus, isActive: newStatus !== 'Closed' } : j));
      const msgs: Record<string, string> = { Live: '✓ Job activated', Paused: '⏸ Job paused', Closed: '✕ Job closed', Draft: '✎ Moved to draft' };
      setSuccessMsg(msgs[newStatus] || 'Status updated');
      onShowToast?.(msgs[newStatus] || 'Status updated');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (job: BackendJob) => {
    setActionLoading(job._id);
    setActiveMenuJobId(null);
    try {
      await jobService.updateJob(job._id, { featured: !job.featured });
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, featured: !j.featured } : j));
      const msg = !job.featured ? '⭐ Featured' : 'Unfeatured';
      setSuccessMsg(msg);
      onShowToast?.(msg);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    setActionLoading(jobId);
    setConfirmDeleteId(null);
    try {
      await jobService.deleteJob(jobId);
      setJobs(prev => prev.filter(j => j._id !== jobId));
      setSuccessMsg('🗑 Job deleted');
      onShowToast?.('Job deleted');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (jobId: string) => {
    setActiveMenuJobId(null);
    onEditJob ? onEditJob(jobId) : onShowToast?.('Edit not available');
  };

  const handleView = (jobId: string) => {
    setActiveMenuJobId(null);
    onViewJob ? onViewJob(jobId) : window.open(`/jobs/${jobId}`, '_blank');
  };

  const getStatusBadge = (status: BackendJob['status']) => {
    const configs: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      Live: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500 animate-pulse', label: 'Active' },
      Draft: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Draft' },
      Paused: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Paused' },
      Closed: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Closed' },
    };
    const c = configs[status] || configs.Draft;
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${c.bg} ${c.text} inline-flex items-center gap-1`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  /* ═══ LOADING ═══ */
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#42326E]" />
        <p className="text-sm text-[#6F687A] font-medium">Loading your jobs...</p>
      </div>
    );
  }

  /* ═══ MAIN RENDER ═══ */
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5 animate-in fade-in duration-200">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2C1B57] tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
            My Jobs
          </h1>
          <p className="text-xs text-[#6F687A] mt-0.5">
            Manage, edit, and control your job listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchJobs(true)}
            disabled={refreshing}
            className="p-2 bg-white border border-[#E8E3EF] hover:border-[#D7C8ED] text-[#49454F] rounded-xl transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('post-job')}
            className="px-3.5 py-2 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post New Job</span>
            <span className="sm:hidden">Post</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-xs text-red-700 font-semibold flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs text-emerald-700 font-semibold flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
        <StatCard label="Total" value={stats.total} icon={Briefcase} color="purple" />
        <StatCard label="Active" value={stats.live} icon={PlayCircle} color="emerald" />
        <StatCard label="Draft" value={stats.draft} icon={Edit3} color="gray" />
        <StatCard label="Paused" value={stats.paused} icon={PauseCircle} color="amber" />
        <StatCard label="Featured" value={stats.featured} icon={Star} color="yellow" />
        <StatCard label="Applicants" value={stats.totalApplicants} icon={Users} color="blue" />
      </div>

      {/* Toolbar */}
      <div className="space-y-2.5">
        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {STATUS_FILTERS.map(f => {
            const count = f.key === 'all' ? jobs.length : jobs.filter(j => j.status === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
                  filterStatus === f.key
                    ? 'bg-[#2C1B57] text-white shadow-sm'
                    : 'bg-white text-[#49454F] border border-[#E8E3EF] hover:border-[#D7C8ED]'
                }`}
              >
                {f.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterStatus === f.key ? 'bg-white/20' : 'bg-[#F2F4F7]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#6F687A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#E8E3EF] rounded-xl outline-none focus:border-[#42326E] focus:ring-2 focus:ring-[#42326E]/10"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#49454F]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-[11px] font-semibold py-2 px-2.5 bg-white border border-[#E8E3EF] rounded-xl outline-none focus:border-[#42326E] cursor-pointer shrink-0"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="applicants">Applicants</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {jobs.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-[#E8E3EF] shadow-xs p-8 md:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F8F5FF] mx-auto flex items-center justify-center mb-4">
            <Briefcase className="w-7 h-7 text-[#42326E]" />
          </div>
          <h3 className="text-lg font-extrabold text-[#2C1B57] mb-2">No Jobs Yet</h3>
          <p className="text-sm text-[#6F687A] max-w-sm mx-auto mb-5">Create your first job listing to start attracting talent.</p>
          <button
            onClick={() => onNavigate('post-job')}
            className="px-5 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Job
          </button>
        </div>
      )}

      {/* ═══ DESKTOP TABLE ═══ */}
      {jobs.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-[#E8E3EF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E8E3EF] text-[#6F687A] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-5">Job</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Salary</th>
                    <th className="py-3 px-4">Exp.</th>
                    <th className="py-3 px-4">Posted</th>
                    <th className="py-3 px-4 text-center">Applicants</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAF6]">
                  {filteredJobs.map(job => (
                    <tr key={job._id} className="hover:bg-[#FAFAFA]/60 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {job.companyLogo?.url ? (
                            <img src={job.companyLogo.url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#E8E3EF]" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#F8F5FF] text-[#42326E] flex items-center justify-center font-bold text-xs shrink-0">
                              {job.companyName?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleView(job._id)} className="font-bold text-sm text-[#2C1B57] hover:text-[#42326E] truncate hover:underline text-left">
                                {job.title}
                              </button>
                              {job.featured && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-[#6F687A] mt-0.5 truncate">
                              {job.department || 'General'} • {job.role || 'N/A'}
                            </div>
                            {job.skills && job.skills.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {job.skills.slice(0, 3).map((s, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-[#EDE6FA] rounded text-[9px] text-[#42326E] font-semibold">{s}</span>
                                ))}
                                {job.skills.length > 3 && <span className="text-[9px] text-[#98A2B3]">+{job.skills.length - 3}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold flex items-center gap-1 text-[#49454F]">
                          <MapPin className="w-3 h-3 text-[#98A2B3]" />
                          {job.location?.city || 'N/A'}
                        </div>
                        <div className="text-[10px] text-[#98A2B3] mt-0.5">{job.workMode}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#49454F] font-semibold text-[11px]">
                        {formatSalary(job.salary?.min, job.salary?.max, job.salary?.currency, job.salary?.period)}
                      </td>
                      <td className="py-3.5 px-4 text-[#49454F] font-medium text-[11px]">
                        {formatExperience(job.experience?.min, job.experience?.max, job.experience?.text)}
                      </td>
                      <td className="py-3.5 px-4 text-[#6F687A] font-medium text-[11px]">
                        {formatDate(job.postedAt || job.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button onClick={() => onViewApplicants?.(job._id, job.title)} className="inline-flex items-center gap-1 font-extrabold text-sm text-[#2C1B57] hover:text-[#42326E] hover:underline">
                          <Users className="w-3.5 h-3.5 text-[#B29CFE]" />
                          {job.applicantsCount || 0}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(job.status)}</td>
                      <td className="py-3.5 px-5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleView(job._id)} className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEdit(job._id)} className="px-2.5 py-1.5 bg-[#EDE6FA] text-[#42326E] hover:bg-[#D7C8ED] text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1" title="Edit">
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuJobId(activeMenuJobId === job._id ? null : job._id)}
                              disabled={actionLoading === job._id}
                              className="p-1.5 text-[#6F687A] hover:text-[#2C1B57] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {actionLoading === job._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                            </button>

                            {activeMenuJobId === job._id && (
                              <div ref={menuRef} className="absolute right-0 top-9 z-30 w-48 bg-white border border-[#E8E3EF] rounded-xl shadow-xl py-1 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-150">
                                <MenuBtn icon={Eye} label="View Details" onClick={() => handleView(job._id)} color="text-blue-700" />
                                <MenuBtn icon={Edit3} label="Edit Job" onClick={() => handleEdit(job._id)} color="text-[#42326E]" />
                                <MenuBtn
                                  icon={job.featured ? StarOff : Star}
                                  label={job.featured ? 'Remove Featured' : 'Mark Featured'}
                                  onClick={() => handleToggleFeatured(job)}
                                  color="text-amber-700"
                                />
                                <div className="border-t border-[#E8E3EF] my-1" />
                                {job.status !== 'Live' && <MenuBtn icon={PlayCircle} label="Set Active" onClick={() => handleStatusChange(job._id, 'Live')} color="text-emerald-700" />}
                                {job.status === 'Live' && <MenuBtn icon={PauseCircle} label="Pause" onClick={() => handleStatusChange(job._id, 'Paused')} color="text-amber-700" />}
                                {job.status !== 'Draft' && <MenuBtn icon={Edit3} label="Move to Draft" onClick={() => handleStatusChange(job._id, 'Draft')} color="text-gray-700" />}
                                {job.status !== 'Closed' && <MenuBtn icon={XCircle} label="Close" onClick={() => handleStatusChange(job._id, 'Closed')} color="text-rose-700" />}
                                <div className="border-t border-[#E8E3EF] my-1" />
                                <MenuBtn
                                  icon={Trash2}
                                  label="Delete Job"
                                  onClick={() => { setActiveMenuJobId(null); setConfirmDeleteId(job._id); }}
                                  color="text-rose-700"
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
              <div className="p-10 text-center text-[#6F687A] space-y-2">
                <Search className="w-7 h-7 mx-auto text-[#98A2B3]" />
                <p className="font-semibold text-sm">No matching jobs</p>
                <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="mt-2 px-3.5 py-1.5 text-xs font-bold text-[#42326E] hover:bg-[#F8F5FF] rounded-lg">Clear filters</button>
              </div>
            )}
          </div>

          {/* ═══ MOBILE CARDS ═══ */}
          <div className="md:hidden space-y-3">
            {filteredJobs.length === 0 && jobs.length > 0 && (
              <div className="p-8 text-center text-[#6F687A] bg-white rounded-xl border border-[#E8E3EF]">
                <Search className="w-6 h-6 mx-auto text-[#98A2B3] mb-2" />
                <p className="font-semibold text-sm">No matching jobs</p>
                <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="mt-2 text-xs font-bold text-[#42326E]">Clear filters</button>
              </div>
            )}

            {filteredJobs.map(job => (
              <div key={job._id} className="bg-white rounded-xl border border-[#E8E3EF] shadow-xs overflow-hidden active:scale-[0.99] transition-transform">
                {/* Card Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start gap-3">
                    {job.companyLogo?.url ? (
                      <img src={job.companyLogo.url} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#E8E3EF] shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#F8F5FF] text-[#42326E] flex items-center justify-center font-bold text-xs shrink-0">
                        {job.companyName?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {getStatusBadge(job.status)}
                        {job.featured && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-bold inline-flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleView(job._id)} className="text-sm font-bold text-[#2C1B57] hover:text-[#42326E] text-left leading-snug">
                        {job.title}
                      </button>
                      <p className="text-[10px] text-[#6F687A] mt-0.5 truncate">
                        {job.department || 'General'} • {job.role || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <MobileInfoChip icon={MapPin} text={`${job.location?.city || 'N/A'} • ${job.workMode}`} />
                    <MobileInfoChip icon={Briefcase} text={formatSalary(job.salary?.min, job.salary?.max, job.salary?.currency, job.salary?.period)} />
                    <MobileInfoChip icon={Calendar} text={formatDate(job.postedAt || job.createdAt)} />
                    <MobileInfoChip icon={Users} text={`${job.applicantsCount || 0} applicants`} />
                  </div>

                  {/* Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex gap-1 mt-2.5 flex-wrap">
                      {job.skills.slice(0, 4).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#EDE6FA] rounded text-[9px] text-[#42326E] font-semibold">{s}</span>
                      ))}
                      {job.skills.length > 4 && <span className="text-[9px] text-[#98A2B3] self-center">+{job.skills.length - 4}</span>}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-4 py-2.5 bg-[#FAFAFA] border-t border-[#E8E3EF] flex items-center gap-2">
                  <button onClick={() => handleView(job._id)} className="flex-1 py-2 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg inline-flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => handleEdit(job._id)} className="flex-1 py-2 bg-[#EDE6FA] text-[#42326E] text-[11px] font-bold rounded-lg inline-flex items-center justify-center gap-1 hover:bg-[#D7C8ED] transition-colors">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuJobId(activeMenuJobId === job._id ? null : job._id)}
                      disabled={actionLoading === job._id}
                      className="p-2 text-[#6F687A] hover:text-[#2C1B57] hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === job._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                    </button>

                    {activeMenuJobId === job._id && (
                      <div ref={menuRef} className="absolute right-0 bottom-10 z-30 w-48 bg-white border border-[#E8E3EF] rounded-xl shadow-xl py-1 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <MenuBtn icon={job.featured ? StarOff : Star} label={job.featured ? 'Unfeature' : 'Feature'} onClick={() => handleToggleFeatured(job)} color="text-amber-700" />
                        <div className="border-t border-[#E8E3EF] my-1" />
                        {job.status !== 'Live' && <MenuBtn icon={PlayCircle} label="Activate" onClick={() => handleStatusChange(job._id, 'Live')} color="text-emerald-700" />}
                        {job.status === 'Live' && <MenuBtn icon={PauseCircle} label="Pause" onClick={() => handleStatusChange(job._id, 'Paused')} color="text-amber-700" />}
                        {job.status !== 'Closed' && <MenuBtn icon={XCircle} label="Close" onClick={() => handleStatusChange(job._id, 'Closed')} color="text-rose-700" />}
                        <div className="border-t border-[#E8E3EF] my-1" />
                        <MenuBtn icon={Trash2} label="Delete" onClick={() => { setActiveMenuJobId(null); setConfirmDeleteId(job._id); }} color="text-rose-700" hoverBg="hover:bg-rose-50" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-0 sm:mx-4 p-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#2C1B57]">Delete Job?</h3>
                <p className="text-xs text-[#6F687A]">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-[#49454F] mb-5">
              This will permanently delete the job posting and all associated applicant data.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-[#E8E3EF] text-xs font-bold text-[#49454F] rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   SUB COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

const MenuBtn: React.FC<{
  icon: any; label: string; onClick: () => void; color: string; hoverBg?: string;
}> = ({ icon: Icon, label, onClick, color, hoverBg = 'hover:bg-[#F7F4FA]' }) => (
  <button onClick={onClick} className={`w-full text-left px-3 py-2 ${hoverBg} ${color} flex items-center gap-2 transition-colors`}>
    <Icon className="w-3.5 h-3.5" /> {label}
  </button>
);

const MobileInfoChip: React.FC<{ icon: any; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-1.5 text-[10px] text-[#6F687A] font-medium bg-[#FAFAFA] px-2 py-1.5 rounded-lg">
    <Icon className="w-3 h-3 text-[#98A2B3] shrink-0" />
    <span className="truncate">{text}</span>
  </div>
);

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'purple' | 'emerald' | 'gray' | 'amber' | 'yellow' | 'blue';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => {
  const colors = {
    purple: { bg: 'bg-[#F8F5FF]', text: 'text-[#42326E]', border: 'border-[#E8E3EF]' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    gray: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  }[color];

  return (
    <div className={`p-2.5 md:p-3 rounded-xl border ${colors.border} ${colors.bg}`}>
      <div className="flex items-center justify-between mb-0.5">
        <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        <span className={`text-base md:text-lg font-extrabold ${colors.text}`}>{value}</span>
      </div>
      <p className="text-[9px] md:text-[10px] font-bold text-[#6F687A] uppercase tracking-wide">{label}</p>
    </div>
  );
};

export default MyJobsView;