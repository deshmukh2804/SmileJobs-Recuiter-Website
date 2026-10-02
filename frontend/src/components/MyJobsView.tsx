import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppRoute } from '../types';
import { jobService } from '../services/jobService';

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
  jobDescription?: string;
  qualification?: string;
  companyInitials?: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
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
  if (!min && !max) return 'Not Disclosed';
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
  return 'Not Disclosed';
};

const getInitials = (name?: string): string => {
  if (!name) return 'CO';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Live' | 'Draft' | 'Paused' | 'Closed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const res = await jobService.listMyJobs();
      const list = res.data?.jobs || res.data || [];
      setJobs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setApiError(err.response?.data?.message || err.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const prepareJobPayload = (job: BackendJob, updates: Partial<BackendJob>) => {
    const merged = { ...job, ...updates };
    return {
      title: merged.title,
      companyName: merged.companyName,
      companyWebsite: merged.companyWebsite || '',
      industry: merged.industry || '',
      establishedYear: merged.establishedYear || null,
      organizationSize: merged.organizationSize || '',
      department: merged.department || '',
      role: merged.role || merged.title,
      qualification: merged.qualification || '',
      jobType: merged.jobType || 'Full-Time',
      workMode: merged.workMode || 'On-site',
      jobDescription: merged.jobDescription || '',
      jobTiming: merged.jobTiming || '',
      workingDays: merged.workingDays || '',
      noticePeriod: merged.noticePeriod || '',
      applicationUrl: merged.applicationUrl || '',
      noPaymentInvolved: merged.noPaymentInvolved !== false,
      featured: !!merged.featured,
      status: merged.status,
      skills: merged.skills || [],
      languages: merged.languages || [],
      benefits: merged.benefits || [],
      responsibilities: merged.responsibilities || [],
      requirements: merged.requirements || [],
      location: {
        address: merged.location?.address || '',
        city: merged.location?.city || '',
        state: merged.location?.state || '',
        country: merged.location?.country || 'India',
      },
      salary: {
        min: merged.salary?.min || 0,
        max: merged.salary?.max || 0,
        currency: merged.salary?.currency || 'INR',
        period: merged.salary?.period || 'month',
      },
      experience: {
        min: merged.experience?.min || 0,
        max: merged.experience?.max || 0,
        text: merged.experience?.text || '',
      },
      contactPerson: {
        name: merged.contactPerson?.name || '',
        designation: merged.contactPerson?.designation || '',
      },
      contactVisibility: {
        whatsapp: merged.contactVisibility?.whatsapp !== false,
        mobile: merged.contactVisibility?.mobile !== false,
      },
      recruiterEmail: merged.recruiterEmail || '',
      recruiterMobileNumber: merged.recruiterMobileNumber || '',
      recruiterWhatsappNumber: merged.recruiterWhatsappNumber || '',
    };
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (activeTab !== 'All' && job.status !== activeTab) return false;
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matches =
          job.title?.toLowerCase().includes(q) ||
          job.department?.toLowerCase().includes(q) ||
          job.location?.city?.toLowerCase().includes(q) ||
          job.role?.toLowerCase().includes(q) ||
          job.companyName?.toLowerCase().includes(q) ||
          job._id?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (workModeFilter !== 'All' && job.workMode !== workModeFilter) return false;
      if (jobTypeFilter !== 'All' && job.jobType !== jobTypeFilter) return false;
      return true;
    });
  }, [jobs, activeTab, searchQuery, workModeFilter, jobTypeFilter]);

  const counts = useMemo(() => ({
    total: jobs.length,
    live: jobs.filter(j => j.status === 'Live').length,
    draft: jobs.filter(j => j.status === 'Draft').length,
    paused: jobs.filter(j => j.status === 'Paused').length,
    closed: jobs.filter(j => j.status === 'Closed').length,
    featured: jobs.filter(j => j.featured).length,
    totalApplicants: jobs.reduce((s, j) => s + (j.applicantsCount || 0), 0),
  }), [jobs]);

  const handleStatusChange = async (jobId: string, newStatus: 'Live' | 'Draft' | 'Paused' | 'Closed') => {
    setActionLoading(jobId);
    try {
      await jobService.updateStatus(jobId, newStatus);
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus, isActive: newStatus !== 'Closed' } : j));
      const msgs: Record<string, string> = {
        Live: 'Job activated successfully',
        Paused: 'Job paused',
        Closed: 'Job closed',
        Draft: 'Moved to draft',
      };
      showToast(msgs[newStatus] || 'Status updated', 'success');
      onShowToast?.(msgs[newStatus]);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeature = async (job: BackendJob) => {
    setActionLoading(job._id);
    try {
      const safePayload = prepareJobPayload(job, { featured: !job.featured });
      await jobService.updateJob(job._id, safePayload);
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, featured: !j.featured } : j));
      showToast(!job.featured ? 'Job featured' : 'Job unfeatured', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to toggle feature', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (job: BackendJob) => {
    const newStatus = job.status === 'Live' ? 'Paused' : 'Live';
    await handleStatusChange(job._id, newStatus);
  };

  const handleDeleteJob = async (id: string) => {
    setIsDeleting(true);
    try {
      await jobService.deleteJob(id);
      setJobs(prev => prev.filter(j => j._id !== id));
      setConfirmDeleteId(null);
      showToast('Job deleted successfully!', 'success');
      onShowToast?.('Job deleted');
    } catch (err: any) {
      setConfirmDeleteId(null);
      showToast(err.response?.data?.message || 'Failed to delete job', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewJob = (jobId: string) => {
    onViewJob ? onViewJob(jobId) : window.open(`/jobs/${jobId}`, '_blank');
  };

  const handleEditJob = (jobId: string) => {
    onEditJob ? onEditJob(jobId) : showToast('Edit not configured', 'error');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setJobTypeFilter('All');
    setWorkModeFilter('All');
    setActiveTab('All');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* ─── Toast ─── */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* ─── Delete Modal ─── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-rose-600 text-[24px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2C1B57]">Delete Job Listing?</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 my-4">
              Are you sure you want to permanently delete this job listing? Shared company logos used by other jobs will be <strong>preserved automatically</strong>.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJob(confirmDeleteId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 flex items-center gap-1 disabled:opacity-70"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Error Banner ─── */}
      {apiError && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">cloud_off</span>
          <span>Backend issue: {apiError}</span>
          <button onClick={() => fetchJobs()} className="ml-auto text-amber-700 hover:underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] bg-[#EDE6FA] text-[#42326E] font-bold">
              Recruiter Console
            </span>
            {(loading || refreshing) && (
              <span className="w-3 h-3 border-2 border-[#42326E]/30 border-t-[#42326E] rounded-full animate-spin" />
            )}
          </div>
          <h1 className="text-2xl text-[#2C1B57] font-bold mt-1">My Job Listings</h1>
          <p className="text-sm text-gray-600">
            Review, edit, feature, and manage your posted career opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchJobs(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 shadow-sm transition-colors text-sm disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('post-job')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#42326E] text-white font-bold shadow-md hover:bg-[#322554] transition-all text-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Jobs', value: counts.total, icon: 'list_alt' },
          { label: 'Live', value: counts.live, icon: 'check_circle', filter: 'Live' as const },
          { label: 'Draft', value: counts.draft, icon: 'edit_note', filter: 'Draft' as const },
          { label: 'Paused', value: counts.paused, icon: 'pause_circle', filter: 'Paused' as const },
          { label: 'Closed', value: counts.closed, icon: 'cancel', filter: 'Closed' as const },
        ].map(kpi => (
          <div
            key={kpi.label}
            onClick={() => kpi.filter && setActiveTab(kpi.filter)}
            className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all ${
              kpi.filter ? 'cursor-pointer hover:border-[#42326E] hover:shadow-md' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-500 text-xs">{kpi.label}</span>
              <span className="p-1.5 rounded-lg bg-[#F8F5FF]">
                <span className="material-symbols-outlined text-[16px] text-[#42326E]">{kpi.icon}</span>
              </span>
            </div>
            <h3 className="text-2xl text-[#2C1B57] font-bold tracking-tight mt-2">
              {kpi.value.toLocaleString()}
            </h3>
          </div>
        ))}
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        {[
          { key: 'All' as const, label: 'All Jobs', count: counts.total },
          { key: 'Live' as const, label: 'Live', count: counts.live },
          { key: 'Draft' as const, label: 'Draft', count: counts.draft },
          { key: 'Paused' as const, label: 'Paused', count: counts.paused },
          { key: 'Closed' as const, label: 'Closed', count: counts.closed },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#42326E] text-white shadow-sm'
                : 'bg-[#F8F5FF] text-gray-700 hover:bg-[#EDE6FA]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-black/10'
              }`}
            >
              {tab.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Filter Toolbar ─── */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-[18px] text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Job title, Company, ID..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:border-[#42326E] text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={jobTypeFilter}
              onChange={e => setJobTypeFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:border-[#42326E] cursor-pointer"
            >
              <option value="All">Job Type: All</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
            <select
              value={workModeFilter}
              onChange={e => setWorkModeFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:border-[#42326E] cursor-pointer"
            >
              <option value="All">Mode: All</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
            <button
              onClick={clearAllFilters}
              className="px-2.5 py-2 rounded-lg text-gray-500 hover:text-[#42326E] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Job List ─── */}
      {loading && filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <span className="w-8 h-8 border-[3px] border-[#42326E]/30 border-t-[#42326E] rounded-full animate-spin inline-block mb-3" />
          <p className="font-semibold text-gray-500">Loading jobs from database...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <span className="material-symbols-outlined text-6xl text-gray-400 mb-3">work_off</span>
          <p className="font-bold text-[#2C1B57] mb-1">No job listings found</p>
          <p className="text-xs text-gray-500 mb-4">
            {jobs.length === 0 ? 'Create your first job to attract talent.' : 'Try relaxing your filters.'}
          </p>
          <button
            onClick={() => onNavigate('post-job')}
            className="px-4 py-2 rounded-lg bg-[#42326E] text-white text-xs font-bold inline-flex items-center gap-1 hover:bg-[#322554]"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Post New Job
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* List Header (Desktop) */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            <div className="col-span-4">Job Details</div>
            <div className="col-span-2">Location & Mode</div>
            <div className="col-span-2">Salary</div>
            <div className="col-span-1 text-center">Applicants</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-gray-100">
            {filteredJobs.map(job => (
              <div
                key={job._id}
                className={`group grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-4 items-center hover:bg-[#F8F5FF]/40 transition-colors ${
                  job.featured ? 'bg-amber-50/30' : ''
                }`}
              >
                {/* Col 1: Job Details */}
                <div className="col-span-1 md:col-span-4 flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] flex items-center justify-center font-bold text-sm shadow-sm shrink-0 overflow-hidden">
                    {job.companyLogo?.url ? (
                      <img
                        src={job.companyLogo.url}
                        alt={job.companyName}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const p = (e.target as HTMLImageElement).parentElement;
                          if (p) p.textContent = getInitials(job.companyName);
                        }}
                      />
                    ) : (
                      getInitials(job.companyName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3
                        onClick={() => handleViewJob(job._id)}
                        className="font-bold text-[#2C1B57] text-sm cursor-pointer hover:underline truncate"
                        title={job.title}
                      >
                        {job.title}
                      </h3>
                      {job.featured && (
                        <span className="material-symbols-outlined text-[15px] text-amber-500 shrink-0" title="Featured">
                          star
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-gray-600 truncate font-medium">{job.companyName}</span>
                      {job.isCompanyVerified && (
                        <span className="material-symbols-outlined text-[12px] text-emerald-600">verified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {job.isNew && (
                        <span className="px-1.5 py-0.5 rounded bg-[#EDE6FA] text-[#42326E] font-bold text-[9px]">
                          NEW
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-medium">{job.jobType || 'Full-Time'}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="font-mono text-[9px] text-gray-400">#{job._id.slice(-6)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          job.contactVisibility?.whatsapp
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title="WhatsApp Visibility"
                      >
                        <span className="material-symbols-outlined text-[10px]">chat</span>
                        WA
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          job.contactVisibility?.mobile
                            ? 'bg-[#EDE6FA] text-[#42326E] border border-[#D7C8ED]'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title="Mobile Visibility"
                      >
                        <span className="material-symbols-outlined text-[10px]">phone</span>
                        Mobile
                      </span>
                    </div>
                  </div>
                </div>

                {/* Col 2: Location */}
                <div className="col-span-1 md:col-span-2 text-xs text-gray-700">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-gray-400">location_on</span>
                    <span className="truncate font-semibold">{job.location?.city || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-gray-400">
                    <span className="material-symbols-outlined text-[14px]">work</span>
                    <span>{job.workMode || 'On-site'}</span>
                  </div>
                </div>

                {/* Col 3: Salary */}
                <div className="col-span-1 md:col-span-2">
                  <div className="text-sm font-bold text-[#2C1B57] font-mono">
                    {formatSalary(job.salary?.min, job.salary?.max, job.salary?.currency, job.salary?.period)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(job.postedAt || job.createdAt)}</div>
                </div>

                {/* Col 4: Applicants */}
                <div className="col-span-1 md:col-span-1 text-center">
                  <button
                    onClick={() => onViewApplicants?.(job._id, job.title)}
                    className="text-sm font-bold text-[#2C1B57] hover:text-[#42326E] hover:underline"
                  >
                    {job.applicantsCount || 0}
                    <span className="text-gray-400 font-normal text-[10px]">/{job.applicantsCap || 100}</span>
                  </button>
                  <div className="w-full bg-[#F8F5FF] h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-[#42326E] h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round(((job.applicantsCount || 0) / (job.applicantsCap || 100)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Col 5: Status */}
                <div className="col-span-1 md:col-span-1 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border ${
                      job.status === 'Live'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : job.status === 'Draft'
                        ? 'bg-slate-50 text-slate-700 border-slate-200'
                        : job.status === 'Paused'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        job.status === 'Live'
                          ? 'bg-emerald-500 animate-pulse'
                          : job.status === 'Draft'
                          ? 'bg-slate-400'
                          : job.status === 'Paused'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    {job.status}
                  </span>
                </div>

                {/* Col 6: Actions */}
                <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleViewJob(job._id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#42326E] hover:bg-[#F8F5FF] transition-colors"
                    title="View Details"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                  </button>
                  <button
                    onClick={() => handleEditJob(job._id)}
                    className="px-2 py-1.5 rounded-lg bg-[#42326E] text-white text-[11px] font-semibold flex items-center gap-1 hover:bg-[#322554] transition-colors"
                    title="Edit Job"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span className="hidden lg:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => handleToggleFeature(job)}
                    disabled={actionLoading === job._id}
                    className={`p-1.5 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50 ${
                      job.featured ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
                    }`}
                    title={job.featured ? 'Unfeature' : 'Feature Job'}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {job.featured ? 'star' : 'star_border'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleToggleStatus(job)}
                    disabled={actionLoading === job._id || job.status === 'Closed'}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#42326E] hover:bg-[#F8F5FF] transition-colors disabled:opacity-30"
                    title={job.status === 'Live' ? 'Pause' : 'Activate'}
                  >
                    {actionLoading === job._id ? (
                      <span className="w-4 h-4 border-2 border-[#42326E]/30 border-t-[#42326E] rounded-full animate-spin inline-block" />
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">
                        {job.status === 'Live' ? 'pause_circle' : 'play_circle'}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(job._id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Job"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      {filteredJobs.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Showing <strong className="text-[#2C1B57]">{filteredJobs.length}</strong> of{' '}
            <strong className="text-[#2C1B57]">{counts.total}</strong> jobs
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <strong className="text-[#2C1B57]">{counts.live}</strong> Live
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>
              <strong className="text-[#2C1B57]">{counts.featured}</strong> Featured
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#42326E]">group</span>
              <strong className="text-[#2C1B57]">{counts.totalApplicants}</strong> Applicants
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyJobsView;