import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppRoute } from '../types';
import { jobService } from '../services/jobService';
import {
  Briefcase, CheckCircle2, FileEdit, PauseCircle, XCircle, Search,
  X, RotateCcw, Plus, ShieldCheck, MapPin, Star, Eye, Edit3, Trash2,
  MessageCircle, Phone, PlayCircle, Loader2, AlertTriangle, Users,
  Clock, ShieldAlert, Info
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

// ✅ Supported displayed statuses in the Recruiter Frontend
type JobStatus = 'Live' | 'Draft' | 'Paused' | 'Closed' | 'Pending Approval' | 'Rejected' | 'Expired';

interface BackendJob {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: string | { url?: string; publicId?: string };
  location?: { address?: string; city?: string; state?: string; country?: string };
  salary?: { min?: number; max?: number; currency?: string; period?: string };
  experience?: { min?: number; max?: number; text?: string };
  jobType?: string;
  workMode?: string;
  department?: string;
  role?: string;
  status: JobStatus;
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

  // ✅ Approval tracking fields mapped from database
  approvalStatus?: 'pending_review' | 'approved' | 'rejected' | 'suspended';
  submittedForReviewAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  reviewNotes?: string;
  lastEditedAfterApproval?: boolean;
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

const getStatusBadge = (status: JobStatus) => {
  switch (status) {
    case 'Live':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500 animate-pulse', icon: CheckCircle2 };
    case 'Pending Approval':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500 animate-pulse', icon: Clock };
    case 'Rejected':
      return { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500', icon: ShieldAlert };
    case 'Draft':
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400', icon: FileEdit };
    case 'Paused':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', icon: PauseCircle };
    case 'Expired':
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400', icon: XCircle };
    case 'Closed':
    default:
      return { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500', icon: XCircle };
  }
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

  // Active status category tab
  const [activeTab, setActiveTab] = useState<'All' | JobStatus>('All');

  const [searchQuery, setSearchQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Rejection Reason overlay modal
  const [rejectionModal, setRejectionModal] = useState<{ title: string; reason: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ FETCH & NORMALIZE JOB STATUSES REAL-TIME
  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const res = await jobService.listMyJobs();
      const list = res.data?.jobs || res.data || [];
      
      const normalized = (Array.isArray(list) ? list : []).map((job: any): BackendJob => {
        let realStatus: JobStatus = job.status || 'Draft';

        // Core business logic state normalization:
        if (job.approvalStatus === 'pending_review') {
          realStatus = 'Pending Approval';
        } else if (job.approvalStatus === 'rejected') {
          realStatus = 'Rejected';
        } else if (job.approvalStatus === 'suspended') {
          realStatus = 'Paused';
        } else if (realStatus === 'Pending' || (realStatus as string) === 'Pending Approval') {
          realStatus = 'Pending Approval';
        } else if (realStatus === 'Live' && job.approvalStatus !== 'approved') {
          // A live status is only valid once the administrative approval has been granted
          realStatus = 'Pending Approval';
        }

        return {
          ...job,
          status: realStatus,
        };
      });

      setJobs(normalized);
    } catch (err: any) {
      setApiError(err.response?.data?.message || err.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
    pendingApproval: jobs.filter(j => j.status === 'Pending Approval').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length,
    draft: jobs.filter(j => j.status === 'Draft').length,
    paused: jobs.filter(j => j.status === 'Paused').length,
    closed: jobs.filter(j => j.status === 'Closed').length,
    featured: jobs.filter(j => j.featured).length,
    totalApplicants: jobs.reduce((s, j) => s + (j.applicantsCount || 0), 0),
  }), [jobs]);

  const handleStatusChange = async (jobId: string, newStatus: 'Draft' | 'Paused' | 'Closed') => {
    setActionLoading(jobId);
    try {
      await jobService.updateStatus(jobId, newStatus);
      setJobs(prev => prev.map(j => {
        if (j._id === jobId) {
          // When taking administrative offline steps, status update resets approval mapping states locally
          return { ...j, status: newStatus, approvalStatus: newStatus === 'Draft' ? undefined : j.approvalStatus, isActive: false };
        }
        return j;
      }));
      const msgs: Record<string, string> = {
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
    if (job.status === 'Live') {
      await handleStatusChange(job._id, 'Paused');
    } else if (job.status === 'Paused') {
      setActionLoading(job._id);
      try {
        await jobService.updateStatus(job._id, 'Draft');
        setJobs(prev => prev.map(j => j._id === job._id ? { ...j, status: 'Draft', approvalStatus: undefined, isActive: false } : j));
        showToast('Job moved to draft. Edit and submit for approval to make it live.', 'success');
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to update status', 'error');
      } finally {
        setActionLoading(null);
      }
    }
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
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 bg-[#FAFAFA] min-h-screen">
      {/* ─── Toast Alerts ─── */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2 text-sm font-semibold animate-in slide-in-from-right duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ─── Rejection Reason Modal ─── */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setRejectionModal(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2C1B57]">Job Rejected</h3>
                <p className="text-xs text-gray-500 truncate max-w-[280px]">{rejectionModal.title}</p>
              </div>
            </div>
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg mb-4">
              <p className="text-xs text-rose-700 font-bold mb-1">Admin's Reason:</p>
              <p className="text-sm text-rose-900 leading-relaxed">{rejectionModal.reason || 'No specific reason provided.'}</p>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Please edit your job posting to address the issues above and it will be automatically resubmitted for review.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectionModal(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2C1B57]">Delete Job Listing?</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 my-4 leading-relaxed">
              Are you sure you want to permanently delete this job listing? Shared company logos used by other jobs will be <strong>preserved automatically</strong>.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJob(confirmDeleteId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 flex items-center gap-1.5 disabled:opacity-70 transition-colors"
              >
                {isDeleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Yes, Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Error Notification Banner ─── */}
      {apiError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="flex-1 font-medium">Backend issue: {apiError}</span>
          <button onClick={() => fetchJobs()} className="text-amber-700 hover:underline font-bold px-3 py-1 rounded-lg hover:bg-amber-100">
            Retry
          </button>
        </div>
      )}

      {/* ─── Header Section ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] bg-[#EDE6FA] text-[#42326E] font-bold">
              Recruiter Console
            </span>
            {(loading || refreshing) && (
              <Loader2 className="w-3.5 h-3.5 text-[#42326E] animate-spin" />
            )}
          </div>
          <h1 className="text-2xl text-[#2C1B57] font-extrabold mt-1 tracking-tight">My Job Listings</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Review, edit, feature, and manage your posted career opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchJobs(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 shadow-sm transition-colors text-sm disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('post-job')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#42326E] text-white font-bold shadow-md hover:bg-[#322554] transition-all text-sm active:scale-95"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* ─── Approval Workflow Explainer ─── */}
      {counts.pendingApproval > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-900">Admin Review in Progress</h3>
            <p className="text-xs text-blue-700 mt-0.5">
              You have <strong>{counts.pendingApproval} job{counts.pendingApproval !== 1 ? 's' : ''}</strong> awaiting admin approval. Jobs usually get reviewed within 24-48 hours. Once approved, they will be visible to candidates automatically.
            </p>
          </div>
        </div>
      )}

      {/* ─── KPI Metrics Grid ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total', value: counts.total, icon: Briefcase, filter: 'All' as const, color: 'text-gray-500' },
          { label: 'Live', value: counts.live, icon: CheckCircle2, filter: 'Live' as const, color: 'text-emerald-600' },
          { label: 'Pending', value: counts.pendingApproval, icon: Clock, filter: 'Pending Approval' as const, color: 'text-amber-600' },
          { label: 'Rejected', value: counts.rejected, icon: ShieldAlert, filter: 'Rejected' as const, color: 'text-rose-600' },
          { label: 'Draft', value: counts.draft, icon: FileEdit, filter: 'Draft' as const, color: 'text-slate-600' },
          { label: 'Paused', value: counts.paused, icon: PauseCircle, filter: 'Paused' as const, color: 'text-amber-600' },
          { label: 'Closed', value: counts.closed, icon: XCircle, filter: 'Closed' as const, color: 'text-rose-600' },
        ].map(kpi => (
          <div
            key={kpi.label}
            onClick={() => setActiveTab(kpi.filter)}
            className={`bg-white p-3 rounded-2xl border transition-all ${
              activeTab === kpi.filter
                ? 'border-[#42326E] shadow-md ring-2 ring-[#42326E]/10'
                : 'border-gray-200 shadow-sm cursor-pointer hover:border-[#42326E] hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold ${activeTab === kpi.filter ? 'text-[#42326E]' : 'text-gray-500'}`}>
                {kpi.label}
              </span>
              <span className={`p-1 rounded-lg ${activeTab === kpi.filter ? 'bg-[#42326E] text-white' : `bg-gray-50 ${kpi.color}`}`}>
                <kpi.icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="text-xl text-[#2C1B57] font-extrabold tracking-tight mt-2">
              {kpi.value.toLocaleString()}
            </h3>
          </div>
        ))}
      </div>

      {/* ─── Tabs Navigation Row ─── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        {[
          { key: 'All' as const, label: 'All Jobs', count: counts.total },
          { key: 'Live' as const, label: 'Live', count: counts.live },
          { key: 'Pending Approval' as const, label: 'Pending Approval', count: counts.pendingApproval, highlight: true },
          { key: 'Rejected' as const, label: 'Rejected', count: counts.rejected },
          { key: 'Draft' as const, label: 'Draft', count: counts.draft },
          { key: 'Paused' as const, label: 'Paused', count: counts.paused },
          { key: 'Closed' as const, label: 'Closed', count: counts.closed },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#42326E] text-white shadow-md'
                : tab.highlight && tab.count > 0
                ? 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key
                  ? 'bg-white/20'
                  : tab.highlight && tab.count > 0
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {tab.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Search and Filters Toolbar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Job title, Company, ID..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:border-[#42326E] focus:ring-2 focus:ring-[#42326E]/10 text-xs font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={jobTypeFilter}
              onChange={e => setJobTypeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:border-[#42326E] font-medium cursor-pointer"
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
              className="px-3 py-2.5 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:border-[#42326E] font-medium cursor-pointer"
            >
              <option value="All">Mode: All</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
            <button
              onClick={clearAllFilters}
              className="px-3 py-2.5 rounded-xl text-gray-500 hover:text-[#42326E] hover:bg-gray-50 font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Jobs Render Area ─── */}
      {loading && filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-[#42326E] animate-spin mb-4" />
          <p className="font-bold text-gray-500">Loading your jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-[#F8F5FF] rounded-full flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-[#42326E]" />
          </div>
          <p className="font-extrabold text-lg text-[#2C1B57] mb-1">No job listings found</p>
          <p className="text-xs text-gray-500 mb-6 max-w-sm text-center">
            {jobs.length === 0 ? 'Create your first job listing to start attracting top talent to your company.' : 'No jobs match your current search and filter criteria.'}
          </p>
          <button
            onClick={() => onNavigate('post-job')}
            className="px-6 py-3 rounded-xl bg-[#42326E] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#322554] shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* List Header (Desktop View) */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-gray-50/80 border-b border-gray-200 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
            <div className="col-span-4">Job Details</div>
            <div className="col-span-2">Location & Mode</div>
            <div className="col-span-2">Salary</div>
            <div className="col-span-1 text-center">Applicants</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-gray-100">
            {filteredJobs.map(job => {
              const statusBadge = getStatusBadge(job.status);
              const StatusIcon = statusBadge.icon;
              const isPending = job.status === 'Pending Approval';
              const isRejected = job.status === 'Rejected';
              const isLiveOrPaused = job.status === 'Live' || job.status === 'Paused';

              return (
                <div
                  key={job._id}
                  className={`group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-[#F8F5FF]/30 transition-colors ${
                    job.featured ? 'bg-amber-50/20' : ''
                  } ${isRejected ? 'bg-rose-50/30' : ''} ${isPending ? 'bg-amber-50/20' : ''}`}
                >
                  {/* Col 1: Job Info Details & Branding */}
                  <div className="col-span-1 md:col-span-4 flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] flex items-center justify-center font-bold text-sm shadow-sm shrink-0 overflow-hidden">
                      {typeof job.companyLogo === 'string' && job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={job.companyName}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const p = (e.target as HTMLImageElement).parentElement;
                            if (p) p.textContent = getInitials(job.companyName);
                          }}
                        />
                      ) : typeof job.companyLogo === 'object' && job.companyLogo?.url ? (
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
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3
                          onClick={() => handleViewJob(job._id)}
                          className="font-extrabold text-[#2C1B57] text-[15px] cursor-pointer hover:text-[#42326E] hover:underline truncate"
                          title={job.title}
                        >
                          {job.title}
                        </h3>
                        {job.featured && (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-gray-600 font-semibold truncate">{job.companyName}</span>
                        {job.isCompanyVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {job.isNew && !isPending && !isRejected && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#EDE6FA] text-[#42326E] font-bold text-[9px]">
                            NEW
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-semibold">{job.jobType || 'Full-Time'}</span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="font-mono text-[9px] text-gray-400">#{job._id.slice(-6)}</span>
                      </div>

                      {/* Pending status tag */}
                      {isPending && (
                        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-amber-100 border border-amber-200 rounded-lg max-w-max">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span className="text-[10px] text-amber-800 font-bold">
                            {job.lastEditedAfterApproval ? 'Edited — Awaiting re-approval' : 'Awaiting admin approval'}
                          </span>
                        </div>
                      )}

                      {/* Rejection reasons action */}
                      {isRejected && (
                        <button
                          onClick={() => setRejectionModal({ title: job.title, reason: job.rejectionReason || '' })}
                          className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-rose-100 hover:bg-rose-200 border border-rose-200 rounded-lg transition-colors"
                        >
                          <ShieldAlert className="w-3 h-3 text-rose-700" />
                          <span className="text-[10px] text-rose-800 font-bold">View rejection reason</span>
                        </button>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${
                            job.contactVisibility?.whatsapp
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}
                        >
                          <MessageCircle className="w-2.5 h-2.5" /> WA
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${
                            job.contactVisibility?.mobile
                              ? 'bg-[#EDE6FA] text-[#42326E] border border-[#D7C8ED]'
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}
                        >
                          <Phone className="w-2.5 h-2.5" /> Mobile
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Geographical Info & Work Arrangements */}
                  <div className="col-span-1 md:col-span-2 text-xs text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate font-bold">{job.location?.city || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-gray-500 font-medium">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      <span>{job.workMode || 'On-site'}</span>
                    </div>
                  </div>

                  {/* Col 3: Salary Structures & Timestamps */}
                  <div className="col-span-1 md:col-span-2">
                    <div className="text-sm font-extrabold text-[#2C1B57] font-mono tracking-tight">
                      {formatSalary(job.salary?.min, job.salary?.max, job.salary?.currency, job.salary?.period)}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium mt-1">
                      {formatDate(job.postedAt || job.createdAt)}
                    </div>
                  </div>

                  {/* Col 4: Applicant Metrics */}
                  <div className="col-span-1 md:col-span-1 text-center">
                    <button
                      onClick={() => onViewApplicants?.(job._id, job.title)}
                      disabled={!job.applicantsCount}
                      className="text-[15px] font-extrabold text-[#42326E] hover:text-[#2C1B57] hover:underline disabled:text-gray-400 disabled:no-underline font-mono"
                    >
                      {job.applicantsCount || 0}
                      <span className="text-gray-400 font-medium text-[10px]">/{job.applicantsCap || 100}</span>
                    </button>
                    <div className="w-full bg-[#F8F5FF] border border-[#E8E3EF] h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-[#42326E] h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.round(((job.applicantsCount || 0) / (job.applicantsCap || 100)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Col 5: Verified Status Badge */}
                  <div className="col-span-1 md:col-span-1 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-extrabold whitespace-nowrap border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                    >
                      <StatusIcon className="w-2.5 h-2.5" />
                      {job.status}
                    </span>
                  </div>

                  {/* Col 6: Dynamic Interactive Controls */}
                  <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleViewJob(job._id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="View Listing"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditJob(job._id)}
                      className="px-3 py-2 rounded-lg bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] text-xs font-bold flex items-center gap-1.5 hover:bg-[#42326E] hover:text-white transition-all shadow-sm"
                      title={isRejected ? 'Edit & Resubmit' : 'Edit Job'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">{isRejected ? 'Fix & Resubmit' : 'Edit'}</span>
                    </button>

                    {/* Feature button restricted to live active listings only */}
                    {job.status === 'Live' && (
                      <button
                        onClick={() => handleToggleFeature(job)}
                        disabled={actionLoading === job._id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                          job.featured ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                        title={job.featured ? 'Remove Feature' : 'Feature Job'}
                      >
                        <Star className={`w-4 h-4 ${job.featured ? 'fill-amber-400' : ''}`} />
                      </button>
                    )}

                    {/* Operational controls for Live or Paused entries */}
                    {isLiveOrPaused && (
                      <button
                        onClick={() => handleToggleStatus(job)}
                        disabled={actionLoading === job._id}
                        className="p-2 rounded-lg text-gray-500 hover:text-[#42326E] hover:bg-[#F8F5FF] transition-colors disabled:opacity-30"
                        title={job.status === 'Live' ? 'Pause Job' : 'Move to Draft'}
                      >
                        {actionLoading === job._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#42326E]" />
                        ) : job.status === 'Live' ? (
                          <PauseCircle className="w-4 h-4" />
                        ) : (
                          <PlayCircle className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setConfirmDeleteId(job._id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Footer Controls & Metadata Counts ─── */}
      {filteredJobs.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 shadow-sm">
          <div>
            Showing <strong className="text-[#2C1B57]">{filteredJobs.length}</strong> of{' '}
            <strong className="text-[#2C1B57]">{counts.total}</strong> jobs
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <strong className="text-[#2C1B57]">{counts.live}</strong> Live
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <strong className="text-[#2C1B57]">{counts.pendingApproval}</strong> Pending
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <strong className="text-[#2C1B57]">{counts.featured}</strong> Featured
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#42326E]" />
              <strong className="text-[#2C1B57] font-mono">{counts.totalApplicants}</strong> Applicants
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyJobsView;