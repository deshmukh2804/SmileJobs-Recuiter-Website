import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Candidate, CandidateFullDetails } from '../types';
import { candidateService } from '../services/candidateService';
import { jobService } from '../services/jobService';
import {
  Search,
  ShieldCheck,
  Bookmark,
  CheckCircle2,
  MapPin,
  Phone,
  X,
  Loader2,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Send,
  UserCheck,
  Star,
  Calendar,
  Award,
  Briefcase,
  GraduationCap,
  Copy,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertCircle,
  ChevronDown,
  Users,
  Languages,
  Package,
  Sparkles,
  MessageSquare,
  Building2,
  RotateCcw,
} from 'lucide-react';

interface CandidatesViewProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onBookmarkToggle: (candidateId: string) => void;
  onShortlistCandidate: (candidate: Candidate) => void;
  onOpenMessage: (candidate: Candidate) => void;
}

// ═══════════════════════════════════════════════════════
// WORKFLOW CONFIGURATION
// ═══════════════════════════════════════════════════════
const WORKFLOW_STAGES = [
  { key: 'Applied', short: 'Apply', icon: Send },
  { key: 'Viewed', short: 'View', icon: Eye },
  { key: 'Shortlisted', short: 'Short', icon: Star },
  { key: 'Interview', short: 'Intv', icon: Calendar },
  { key: 'Offered', short: 'Offer', icon: Award },
  { key: 'Hired', short: 'Hired', icon: UserCheck },
];

const TERMINAL_STAGES = ['Hired', 'Rejected', 'Withdrawn'];

const STATUS_COLOR_MAP: Record<string, string> = {
  Applied: 'bg-blue-50 text-blue-700 border-blue-200',
  Viewed: 'bg-[#EDE6FA] text-[#42326E] border-[#D7C8ED]',
  Shortlisted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Interview: 'bg-amber-50 text-amber-700 border-amber-200',
  Offered: 'bg-teal-50 text-teal-700 border-teal-200',
  Hired: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  Withdrawn: 'bg-gray-50 text-gray-600 border-gray-200',
};

const shortId = (id?: string) => (id ? id.slice(-8).toUpperCase() : '—');

// ═══════════════════════════════════════════════════════
// JOB TYPE (lightweight, from backend)
// ═══════════════════════════════════════════════════════
interface JobItem {
  _id: string;
  title: string;
  companyName?: string;
  companyLogo?: string | { url?: string };
  location?: { city?: string; state?: string; country?: string };
  jobType?: string;
  workMode?: string;
  status?: string;
  applicantsCount?: number;
  applicantsCap?: number;
  featured?: boolean;
  createdAt?: string;
  postedAt?: string;
}

const getInitials = (name: string) =>
  (name || 'C C')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatLocation = (loc: any): string => {
  if (!loc) return 'Remote';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    const parts = [loc.city, loc.state, loc.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Remote';
  }
  return 'Remote';
};

const getLogoUrl = (logo: any): string | null => {
  if (!logo) return null;
  if (typeof logo === 'string') return logo;
  if (typeof logo === 'object' && logo.url) return logo.url;
  return null;
};

export const CandidatesView: React.FC<CandidatesViewProps> = ({
  candidates,
  onBookmarkToggle,
}) => {
  // ═══════════════════════════════════════════════════════
  // STATE — JOBS (Column 1)
  // ═══════════════════════════════════════════════════════
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobSearch, setJobSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);

  // ═══════════════════════════════════════════════════════
  // STATE — APPLICATIONS (Column 2) — derived from candidates prop
  // ═══════════════════════════════════════════════════════
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('match');

  // ═══════════════════════════════════════════════════════
  // STATE — DETAIL PANEL (Column 3)
  // ═══════════════════════════════════════════════════════
  const [selectedApp, setSelectedApp] = useState<CandidateFullDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Mobile detail view toggle
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Avatar error tracking
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());

  // Flickering-fix ref pattern
  const selectedAppIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedAppIdRef.current = selectedApp?._id || null;
  }, [selectedApp]);

  const handleAvatarError = (id: string) => {
    setAvatarErrors((prev) => new Set(prev).add(id));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ═══════════════════════════════════════════════════════
  // FETCH JOBS (Recruiter's own jobs via jobService.listMyJobs)
  // ═══════════════════════════════════════════════════════
  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const res = await jobService.listMyJobs();
      const list = res?.data?.jobs || res?.data || [];
      const arr = Array.isArray(list) ? list : [];
      setJobs(arr);
    } catch (err: any) {
      setJobsError(err?.response?.data?.message || err?.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ═══════════════════════════════════════════════════════
  // FILTER JOBS by search
  // ═══════════════════════════════════════════════════════
  const filteredJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      (j.title || '').toLowerCase().includes(q) ||
      (j.companyName || '').toLowerCase().includes(q) ||
      (j.location?.city || '').toLowerCase().includes(q) ||
      (j._id || '').toLowerCase().includes(q)
    );
  }, [jobs, jobSearch]);

  // ═══════════════════════════════════════════════════════
  // JOB-FILTERED CANDIDATES — only candidates applied to the selected job
  // ═══════════════════════════════════════════════════════
  const jobFilteredCandidates = useMemo(() => {
    if (!selectedJob) return [];
    const jobId = selectedJob._id;
    return candidates.filter((c: any) => {
      const candJobId =
        c.jobId ||
        c.job?._id ||
        c.job_id ||
        c.jobID ||
        (typeof c.job === 'string' ? c.job : null);
      return String(candJobId || '') === String(jobId);
    });
  }, [candidates, selectedJob]);

  // ═══════════════════════════════════════════════════════
  // STATUS FILTERS (same as before, now within selected job scope)
  // ═══════════════════════════════════════════════════════
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'Applied', label: 'Applied' },
    { id: 'Viewed', label: 'Viewed' },
    { id: 'Shortlisted', label: 'Shortlisted' },
    { id: 'Interview', label: 'Interview' },
    { id: 'Offered', label: 'Offered' },
    { id: 'Hired', label: 'Hired' },
    { id: 'Rejected', label: 'Rejected' },
    { id: 'bookmarked', label: '⭐ Bookmarked' },
  ];

  const filteredCandidates = useMemo(() => {
    let result = jobFilteredCandidates.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q)) ||
        (c.email || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'bookmarked') return c.bookmarked;
      return (c as any).status === selectedFilter || c.stage === selectedFilter;
    });

    result.sort((a, b) => {
      if (sortBy === 'match') return b.matchScore - a.matchScore;
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'recent')
        return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      return 0;
    });

    return result;
  }, [jobFilteredCandidates, searchQuery, selectedFilter, sortBy]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: jobFilteredCandidates.length, bookmarked: 0 };
    jobFilteredCandidates.forEach((c) => {
      const status = (c as any).status || c.stage;
      counts[status] = (counts[status] || 0) + 1;
      if (c.bookmarked) counts.bookmarked = (counts.bookmarked || 0) + 1;
    });
    return counts;
  }, [jobFilteredCandidates]);

  // ═══════════════════════════════════════════════════════
  // HANDLERS — JOB SELECTION
  // ═══════════════════════════════════════════════════════
  const handleSelectJob = (job: JobItem) => {
    setSelectedJob(job);
    setSelectedApp(null);
    setShowMobileDetail(false);
    setSelectedIds([]);
    setSearchQuery('');
    setSelectedFilter('all');
  };

  const handleBackToJobs = () => {
    setSelectedJob(null);
    setSelectedApp(null);
    setShowMobileDetail(false);
    setSelectedIds([]);
  };

  // ═══════════════════════════════════════════════════════
  // HANDLERS — CANDIDATE DETAIL (same as original)
  // ═══════════════════════════════════════════════════════
  const handleSelectCandidate = async (candidate: Candidate) => {
    setLoadingDetails(true);
    setShowMobileDetail(true);
    try {
      const details = await candidateService.getFullDetails(candidate.id);
      setSelectedApp(details);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to load details', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const updated = await candidateService.updateStatus(id, newStatus);
      if (updated) {
        showToast(`✓ Moved to ${newStatus}`, 'success');
        setSelectedApp(updated);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
      setConfirmAction(null);
    }
  };

  const handleBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      onBookmarkToggle(id);
      await candidateService.toggleBookmark(id);
    } catch (err) {
      showToast('Failed to toggle bookmark', 'error');
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      await candidateService.bulkUpdateStatus(selectedIds, status);
      showToast(`${selectedIds.length} candidates moved to ${status}`, 'success');
      setSelectedIds([]);
      setShowBulkMenu(false);
      window.location.reload();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Bulk update failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application permanently?')) return;
    try {
      await candidateService.deleteApplication(id);
      showToast('Application deleted', 'success');
      setSelectedApp(null);
      setShowMobileDetail(false);
      window.location.reload();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) setSelectedIds([]);
    else setSelectedIds(filteredCandidates.map((c) => c.id));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} copied`, 'info'));
  };

  const forceDownloadResume = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'resume.pdf';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const matchColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-rose-500';
  };

  const currentStageIndex = useMemo(() => {
    if (!selectedApp) return -1;
    return WORKFLOW_STAGES.findIndex((s) => s.key === selectedApp.status);
  }, [selectedApp]);

  const isTerminalStatus = selectedApp && TERMINAL_STAGES.includes(selectedApp.status);

  // ═══════════════════════════════════════════════════════
  // JOB CARD counts helper (apps per job from candidates prop)
  // ═══════════════════════════════════════════════════════
  const getJobAppCount = useCallback((jobId: string) => {
    return candidates.filter((c: any) => {
      const candJobId =
        c.jobId ||
        c.job?._id ||
        c.job_id ||
        c.jobID ||
        (typeof c.job === 'string' ? c.job : null);
      return String(candJobId || '') === String(jobId);
    }).length;
  }, [candidates]);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-200">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2C1B57] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#B29CFE]" />
            Candidates
            <span className="text-xs font-normal text-[#6F687A]">
              ({selectedJob ? jobFilteredCandidates.length : candidates.length})
            </span>
          </h1>
          <p className="text-xs text-[#6F687A] mt-0.5">
            {selectedJob
              ? `Showing applications for "${selectedJob.title}"`
              : 'Select a job to view its applications and candidates'}
          </p>
        </div>

        {selectedJob && (
          <button
            onClick={handleBackToJobs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E3EF] bg-white text-xs font-bold text-[#42326E] hover:bg-[#F8F5FF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Jobs
          </button>
        )}
      </div>

      {/* ═══════ 3-COLUMN LAYOUT ═══════ */}
      <div
        className={`grid gap-4 ${
          selectedJob && (selectedApp || showMobileDetail)
            ? 'grid-cols-1 xl:grid-cols-[280px_340px_minmax(0,1fr)]'
            : selectedJob
            ? 'grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)]'
            : 'grid-cols-1'
        }`}
      >
        {/* ═════════════════════════════════════════════════════ */}
        {/* COLUMN 1: JOBS LIST                                  */}
        {/* ═════════════════════════════════════════════════════ */}
        <div
          className={`space-y-2 ${
            selectedJob && showMobileDetail ? 'hidden xl:block' : 'block'
          }`}
        >
          <div className="bg-white rounded-2xl border border-[#E8E3EF] p-3 sticky top-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-extrabold text-[#2C1B57] flex items-center gap-1.5 uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5 text-[#42326E]" />
                My Jobs ({jobs.length})
              </h2>
              <button
                onClick={fetchJobs}
                disabled={jobsLoading}
                className="p-1 rounded-lg hover:bg-[#F8F5FF] text-[#6F687A] hover:text-[#42326E] transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${jobsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Job Search */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-[#6F687A] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search jobs..."
                className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-[#E8E3EF] bg-[#FCFCF7] text-[11px] focus:outline-none focus:border-[#42326E]"
              />
            </div>

            {/* Jobs Scrollable List */}
            <div className="space-y-1.5 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#42326E]" />
                </div>
              ) : jobsError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-1" />
                  <p className="text-[10px] text-rose-600 font-bold">{jobsError}</p>
                  <button
                    onClick={fetchJobs}
                    className="mt-2 text-[10px] text-[#42326E] font-bold underline"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-8 h-8 text-[#B29CFE] mx-auto mb-1 opacity-50" />
                  <p className="text-[10px] text-[#6F687A] font-semibold">
                    {jobSearch ? 'No jobs match search' : 'No jobs posted yet'}
                  </p>
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const appCount = getJobAppCount(job._id);
                  const isSelected = selectedJob?._id === job._id;
                  const logo = getLogoUrl(job.companyLogo);
                  const statusLower = (job.status || '').toLowerCase();

                  return (
                    <button
                      key={job._id}
                      onClick={() => handleSelectJob(job)}
                      className={`w-full text-left bg-white rounded-xl border p-2.5 transition-all ${
                        isSelected
                          ? 'border-[#42326E] shadow-md ring-2 ring-[#EDE6FA]'
                          : 'border-[#E8E3EF] hover:border-[#B29CFE] hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {logo ? (
                          <img
                            src={logo}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-[#E8E3EF] shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {getInitials(job.companyName || job.title)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-[11px] font-bold text-[#2C1B57] leading-tight truncate flex items-center gap-1">
                              {job.title}
                              {job.featured && (
                                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-400 shrink-0" />
                              )}
                            </h3>
                          </div>
                          <p className="text-[10px] text-[#6F687A] truncate mt-0.5">
                            {job.companyName || '—'}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                                statusLower === 'live'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : statusLower === 'draft'
                                  ? 'bg-slate-50 text-slate-700 border-slate-200'
                                  : statusLower === 'paused'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : statusLower === 'pending approval'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : statusLower === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-gray-50 text-gray-600 border-gray-200'
                              }`}
                            >
                              {job.status || 'Draft'}
                            </span>
                            {job.location?.city && (
                              <span className="text-[9px] text-[#6F687A] flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {job.location.city}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[#F0ECF5]">
                            <span className="text-[9px] text-[#6F687A] font-mono">
                              #{job._id.slice(-6)}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold ${
                                appCount > 0 ? 'text-[#42326E]' : 'text-[#9C94A7]'
                              }`}
                            >
                              {appCount} apps
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════ */}
        {/* COLUMN 2: APPLICATIONS LIST (only when job selected)  */}
        {/* ═════════════════════════════════════════════════════ */}
        {selectedJob && (
          <div
            className={`space-y-2 ${
              selectedApp && showMobileDetail ? 'hidden xl:block' : 'block'
            }`}
          >
            {/* Selected Job Header */}
            <div className="bg-gradient-to-br from-[#F8F5FF] to-white border border-[#EDE6FA] rounded-2xl p-3">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-[#42326E] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-extrabold text-[#2C1B57] truncate">
                    {selectedJob.title}
                  </h3>
                  <p className="text-[10px] text-[#6F687A] truncate">
                    {selectedJob.companyName} • {formatLocation(selectedJob.location)}
                  </p>
                  <p className="text-[9px] text-[#9C94A7] mt-0.5 font-mono">
                    ID: {shortId(selectedJob._id)}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-1">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                    selectedFilter === f.id
                      ? 'bg-[#2C1B57] text-white border-[#2C1B57] shadow-xs'
                      : 'bg-white text-[#49454F] border-[#E8E3EF] hover:border-[#B29CFE]'
                  }`}
                >
                  {f.label}
                  <span className="opacity-70 ml-0.5">({statusCounts[f.id] || 0})</span>
                </button>
              ))}
            </div>

            {/* Search + Sort */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-[#6F687A] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidates..."
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-[#E8E3EF] bg-white text-[11px] focus:outline-none focus:border-[#42326E]"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-[#E8E3EF] rounded-lg px-2 py-1.5 text-[11px] text-[#2C1B57] font-semibold focus:outline-none focus:border-[#42326E]"
              >
                <option value="match">Match</option>
                <option value="recent">Recent</option>
                <option value="experience">Exp</option>
                <option value="name">Name</option>
              </select>
            </div>

            {/* Bulk actions bar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#EDE6FA] border border-[#B29CFE] rounded-xl px-2 py-1.5">
                <span className="text-[10px] font-bold text-[#42326E]">
                  {selectedIds.length} sel
                </span>
                <div className="relative">
                  <button
                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                    className="text-[10px] font-bold text-[#42326E] hover:underline flex items-center gap-0.5"
                  >
                    Action <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                  {showBulkMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[#E8E3EF] rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                      {['Shortlisted', 'Interview', 'Rejected', 'Withdrawn'].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleBulkStatusChange(s)}
                          className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-[#2C1B57] hover:bg-[#F8F5FF]"
                        >
                          Move to {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-[9px] text-[#6F687A] hover:text-rose-600 px-1 ml-auto"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Applications Scrollable List */}
            <div className="space-y-1.5 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-[#E8E3EF]">
                  <Users className="w-10 h-10 text-[#B29CFE] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-[#2C1B57]">No applications</p>
                  <p className="text-[10px] text-[#6F687A] mt-1">
                    {jobFilteredCandidates.length === 0
                      ? 'No one has applied to this job yet'
                      : 'Try adjusting filters'}
                  </p>
                </div>
              ) : (
                <>
                  <label className="flex items-center gap-2 px-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredCandidates.length &&
                        filteredCandidates.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-3 h-3 rounded accent-[#42326E] cursor-pointer"
                    />
                    <span className="text-[9px] text-[#6F687A] font-semibold">
                      Select all ({filteredCandidates.length})
                    </span>
                  </label>

                  {filteredCandidates.map((cand) => {
                    const status = (cand as any).status || cand.stage;
                    const isSelected = selectedApp?._id === cand.id;
                    const avatarUrl = (cand as any).avatarUrl;
                    const showAvatarImage = avatarUrl && !avatarErrors.has(cand.id);

                    return (
                      <div
                        key={cand.id}
                        onClick={() => handleSelectCandidate(cand)}
                        className={`bg-white rounded-xl border p-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#42326E] shadow-md ring-2 ring-[#EDE6FA]'
                            : 'border-[#E8E3EF] hover:border-[#B29CFE] hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(cand.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelect(cand.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-3 h-3 rounded accent-[#42326E] cursor-pointer shrink-0"
                          />

                          {showAvatarImage ? (
                            <img
                              src={avatarUrl}
                              alt={cand.name}
                              className="w-9 h-9 rounded-lg object-cover border border-[#E8E3EF] shrink-0"
                              onError={() => handleAvatarError(cand.id)}
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shadow-xs shrink-0"
                              style={{ backgroundColor: cand.avatarBg }}
                            >
                              {getInitials(cand.name)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-[11px] text-[#2C1B57] truncate leading-tight flex items-center gap-1">
                                  {cand.name}
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                </h3>
                                <p className="text-[10px] text-[#6F687A] truncate leading-tight mt-0.5">
                                  {cand.role}
                                </p>
                              </div>
                              <span
                                className={`text-xs font-extrabold shrink-0 ${matchColor(cand.matchScore)}`}
                              >
                                {cand.matchScore}%
                              </span>
                            </div>

                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <span
                                className={`text-[8px] px-1 py-0.5 rounded font-semibold border ${
                                  STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP.Applied
                                }`}
                              >
                                {status}
                              </span>
                              {cand.location && (
                                <span className="text-[8px] text-[#6F687A] flex items-center gap-0.5">
                                  <MapPin className="w-2 h-2" />
                                  {cand.location.split(',')[0]}
                                </span>
                              )}
                              {cand.bookmarked && (
                                <span className="text-[9px] text-amber-600">⭐</span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleBookmark(cand.id, e)}
                            className={`p-0.5 rounded-lg transition-colors shrink-0 ${
                              cand.bookmarked
                                ? 'text-amber-500'
                                : 'text-[#6F687A] hover:text-amber-500'
                            }`}
                          >
                            <Bookmark
                              className={`w-3 h-3 ${cand.bookmarked ? 'fill-current' : ''}`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════ */}
        {/* COLUMN 3: DETAIL PANEL (same as original)             */}
        {/* ═════════════════════════════════════════════════════ */}
        {selectedJob && (selectedApp || loadingDetails) && (
          <div
            className={`bg-white rounded-2xl border border-[#E8E3EF] overflow-hidden ${
              showMobileDetail ? 'block' : 'hidden xl:block'
            }`}
          >
            {loadingDetails ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-[#42326E]" />
              </div>
            ) : selectedApp ? (
              <>
                {/* STICKY HEADER */}
                <div className="sticky top-0 z-10 bg-white border-b border-[#E8E3EF] px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => {
                        setShowMobileDetail(false);
                        setSelectedApp(null);
                      }}
                      className="xl:hidden p-1.5 rounded-lg hover:bg-[#F8F5FF] shrink-0"
                    >
                      <ArrowRight className="w-4 h-4 text-[#42326E] rotate-180" />
                    </button>

                    {selectedApp.candidateAvatarUrl && !avatarErrors.has(selectedApp._id) ? (
                      <img
                        src={selectedApp.candidateAvatarUrl}
                        alt={selectedApp.candidateName}
                        className="w-11 h-11 rounded-xl object-cover border-2 border-[#EDE6FA] shrink-0"
                        onError={() => handleAvatarError(selectedApp._id)}
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                        style={{ backgroundColor: selectedApp.avatarBg }}
                      >
                        {getInitials(selectedApp.candidateName)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-extrabold text-sm text-[#2C1B57] truncate">
                          {selectedApp.candidateName}
                        </h2>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${STATUS_COLOR_MAP[selectedApp.status]}`}
                        >
                          {selectedApp.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6F687A] truncate">
                        {selectedApp.candidateJobTitle || 'Applicant'}
                        {selectedApp.candidateCurrentCompany
                          ? ` @ ${selectedApp.candidateCurrentCompany}`
                          : ''}
                      </p>
                      <p className="text-[9px] text-[#9C94A7] mt-0.5">
                        ID: <code>{shortId(selectedApp._id)}</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-11 h-11">
                      <svg className="w-11 h-11 -rotate-90">
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-[#EFEAF6]"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${(selectedApp.matchPercentage / 100) * 113} 113`}
                          className={matchColor(selectedApp.matchPercentage)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div
                        className={`absolute inset-0 flex items-center justify-center font-extrabold text-[10px] ${matchColor(selectedApp.matchPercentage)}`}
                      >
                        {selectedApp.matchPercentage}%
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedApp(null);
                        setShowMobileDetail(false);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-[#F8F5FF] flex items-center justify-center text-[#6F687A] hover:text-[#2C1B57] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="p-4 space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto">
                  {/* WORKFLOW PIPELINE */}
                  <section className="bg-gradient-to-br from-[#F8F5FF] to-white border border-[#EDE6FA] rounded-2xl p-3.5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-xs text-[#2C1B57] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#42326E]" />
                        Hiring Pipeline
                      </h3>
                      {isTerminalStatus && (
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-md font-semibold border ${STATUS_COLOR_MAP[selectedApp.status]}`}
                        >
                          {selectedApp.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-0 mb-3">
                      {WORKFLOW_STAGES.map((stage, idx) => {
                        const isCompleted = currentStageIndex > idx;
                        const isCurrent = currentStageIndex === idx;
                        const StepIcon = stage.icon;

                        return (
                          <React.Fragment key={stage.key}>
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-all ${
                                  isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : isCurrent
                                      ? 'bg-[#42326E] text-white ring-4 ring-[#B29CFE]/30'
                                      : 'bg-[#EFEAF6] text-[#9C94A7]'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <StepIcon className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <span
                                className={`text-[9px] mt-1 font-bold ${
                                  isCurrent
                                    ? 'text-[#42326E]'
                                    : isCompleted
                                      ? 'text-emerald-700'
                                      : 'text-[#9C94A7]'
                                }`}
                              >
                                {stage.short}
                              </span>
                            </div>
                            {idx < WORKFLOW_STAGES.length - 1 && (
                              <div
                                className={`flex-1 h-0.5 mx-0.5 mt-[-14px] ${
                                  isCompleted ? 'bg-emerald-400' : 'bg-[#EFEAF6]'
                                }`}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {!isTerminalStatus && selectedApp.workflow && (
                      <div className="pt-3 border-t border-[#EDE6FA]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-[#6F687A] font-bold mr-1">
                            Move to:
                          </span>
                          {selectedApp.workflow.allowedNextStatuses.length === 0 ? (
                            <p className="text-[10px] text-[#9C94A7] italic">
                              No further actions
                            </p>
                          ) : (
                            selectedApp.workflow.allowedNextStatuses.map((nextStatus) => {
                              const isReject =
                                nextStatus === 'Rejected' || nextStatus === 'Withdrawn';
                              return (
                                <button
                                  key={nextStatus}
                                  onClick={() =>
                                    setConfirmAction({ status: nextStatus, label: nextStatus })
                                  }
                                  disabled={updatingStatus}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs disabled:opacity-50 ${
                                    isReject
                                      ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                                      : 'bg-[#42326E] text-white hover:bg-[#322554]'
                                  }`}
                                >
                                  {isReject ? (
                                    <X className="w-2.5 h-2.5" />
                                  ) : (
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  )}
                                  {nextStatus}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* QUICK CONTACT */}
                  {selectedApp.candidatePhone && (
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${selectedApp.candidatePhone}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                      <a
                        href={`https://wa.me/${selectedApp.candidatePhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  )}

                  {/* RESUME SECTION */}
                  {selectedApp.resumeUrl ? (
                    <section className="bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-rose-200 rounded-2xl p-4">
                      <h3 className="font-bold text-xs text-[#2C1B57] flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                        <FileText className="w-4 h-4 text-rose-600" />
                        Candidate Resume
                      </h3>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                          <FileText className="w-6 h-6 text-rose-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#2C1B57] truncate">
                            {selectedApp.resumeFileName || 'Resume.pdf'}
                          </p>
                          <p className="text-[10px] text-[#6F687A]">
                            PDF Document • Click below to preview
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setShowResumeModal(true)}
                          className="py-2.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          onClick={() =>
                            forceDownloadResume(selectedApp.resumeUrl, selectedApp.resumeFileName)
                          }
                          className="py-2.5 px-2 rounded-lg bg-white border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                        <a
                          href={selectedApp.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-2 rounded-lg bg-white border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </a>
                      </div>
                    </section>
                  ) : (
                    <section className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-500">No Resume Uploaded</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Candidate hasn't attached a resume
                      </p>
                    </section>
                  )}

                  {/* CONTACT + JOB INFO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <section className="bg-[#FCFCF7] rounded-2xl p-3">
                      <h3 className="font-bold text-[10px] text-[#2C1B57] flex items-center gap-1 mb-2 uppercase tracking-wider">
                        <UserCheck className="w-3 h-3" /> Contact Info
                      </h3>
                      <div className="space-y-1.5 text-xs">
                        <MiniRow
                          icon={<Phone className="w-3 h-3" />}
                          value={selectedApp.candidatePhone}
                          href={`tel:${selectedApp.candidatePhone}`}
                          onCopy={() => copyToClipboard(selectedApp.candidatePhone, 'Phone')}
                        />
                        <MiniRow
                          icon={<MapPin className="w-3 h-3" />}
                          value={`${selectedApp.candidateCity}${selectedApp.candidateSubLocation ? ', ' + selectedApp.candidateSubLocation : ''}`}
                        />
                        <MiniRow
                          icon={<Award className="w-3 h-3" />}
                          value={`₹${selectedApp.candidateCurrentSalary || 'Not disclosed'}`}
                        />
                      </div>
                    </section>

                    <section className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3">
                      <h3 className="font-bold text-[10px] text-[#2C1B57] flex items-center gap-1 mb-2 uppercase tracking-wider">
                        <Briefcase className="w-3 h-3 text-blue-600" /> Applied Job
                      </h3>
                      <div className="flex items-start gap-2">
                        {selectedApp.jobCompanyLogo && (
                          <img
                            src={selectedApp.jobCompanyLogo}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-[#E8E3EF] shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-[#2C1B57] truncate">
                            {selectedApp.jobTitle}
                          </p>
                          <p className="text-[11px] text-[#6F687A] truncate">
                            {selectedApp.jobCompany}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] text-[#6F687A]">
                        <span className="flex items-center gap-1 truncate">
                          📍 {selectedApp.jobLocation}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          💰 {selectedApp.jobSalary}
                        </span>
                      </div>
                    </section>
                  </div>

                  {/* EXPERIENCE + EDUCATION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <section className="bg-[#FCFCF7] rounded-2xl p-3">
                      <h3 className="font-bold text-[10px] text-[#2C1B57] flex items-center gap-1 mb-2 uppercase tracking-wider">
                        <Briefcase className="w-3 h-3" /> Experience
                      </h3>
                      <div className="space-y-1 text-xs">
                        <InfoRow label="Level" value={selectedApp.candidateExperienceLevel} />
                        <InfoRow
                          label="Years"
                          value={
                            selectedApp.candidateExperience
                              ? `${selectedApp.candidateExperience} yrs`
                              : '—'
                          }
                        />
                        <InfoRow label="Current Role" value={selectedApp.candidateJobTitle} />
                        <InfoRow label="Company" value={selectedApp.candidateCurrentCompany} />
                      </div>
                    </section>

                    <section className="bg-[#FCFCF7] rounded-2xl p-3">
                      <h3 className="font-bold text-[10px] text-[#2C1B57] flex items-center gap-1 mb-2 uppercase tracking-wider">
                        <GraduationCap className="w-3 h-3" /> Education
                      </h3>
                      {selectedApp.candidateEducation?.degree ||
                      selectedApp.candidateEducation?.collegeName ? (
                        <div className="space-y-1 text-xs">
                          <InfoRow label="Degree" value={selectedApp.candidateEducation.degree} />
                          <InfoRow
                            label="Specialization"
                            value={selectedApp.candidateEducation.specialization}
                          />
                          <InfoRow
                            label="College"
                            value={selectedApp.candidateEducation.collegeName}
                          />
                          <InfoRow label="End Year" value={selectedApp.candidateEducation.endYear} />
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#9C94A7] italic">No education details</p>
                      )}
                    </section>
                  </div>

                  {/* SKILLS */}
                  {selectedApp.candidateSkills?.length > 0 && (
                    <section className="bg-[#FCFCF7] rounded-2xl p-3">
                      <h3 className="font-bold text-[10px] text-[#2C1B57] flex items-center gap-1 mb-2 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" /> Skills{' '}
                        <span className="text-[#6F687A]">
                          ({selectedApp.candidateSkills.length})
                        </span>
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedApp.candidateSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDE6FA] text-[#42326E] font-semibold border border-[#D7C8ED]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* LANGUAGES / ASSETS / CERTS */}
                  {(selectedApp.candidateLanguages?.length > 0 ||
                    selectedApp.candidateAssets?.length > 0 ||
                    selectedApp.candidateCertifications?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedApp.candidateLanguages?.length > 0 && (
                        <ChipSection
                          title="Languages"
                          icon={<Languages className="w-3 h-3" />}
                          items={selectedApp.candidateLanguages}
                          chipClass="bg-blue-50 text-blue-700 border-blue-200"
                          footer={
                            selectedApp.candidateEnglishLevel
                              ? `English: ${selectedApp.candidateEnglishLevel}`
                              : undefined
                          }
                        />
                      )}
                      {selectedApp.candidateAssets?.length > 0 && (
                        <ChipSection
                          title="Assets"
                          icon={<Package className="w-3 h-3" />}
                          items={selectedApp.candidateAssets}
                          chipClass="bg-emerald-50 text-emerald-700 border-emerald-200"
                        />
                      )}
                      {selectedApp.candidateCertifications?.length > 0 && (
                        <ChipSection
                          title="Certifications"
                          icon={<Award className="w-3 h-3" />}
                          items={selectedApp.candidateCertifications}
                          chipClass="bg-amber-50 text-amber-700 border-amber-200"
                        />
                      )}
                    </div>
                  )}

                  {/* COVER NOTE */}
                  {selectedApp.coverNote && (
                    <section className="bg-[#FCFCF7] rounded-2xl p-3">
                      <h3 className="font-bold text-[10px] text-[#2C1B57] flex items-center gap-1 mb-1.5 uppercase tracking-wider">
                        <FileText className="w-3 h-3" /> Cover Note
                      </h3>
                      <p className="text-xs text-[#49454F] italic leading-relaxed">
                        "{selectedApp.coverNote}"
                      </p>
                    </section>
                  )}

                  {/* TIMELINE */}
                  {selectedApp.milestones?.length > 0 && (
                    <section className="bg-[#FCFCF7] rounded-2xl p-3">
                      <h3 className="font-bold text-[10px] text-[#2C1B57] flex items-center gap-1 mb-2 uppercase tracking-wider">
                        <Clock className="w-3 h-3" /> Activity Timeline
                      </h3>
                      <div className="space-y-2 pl-2 border-l-2 border-[#EDE6FA] ml-1">
                        {selectedApp.milestones.map((m, i) => (
                          <div key={i} className="relative">
                            <div
                              className={`absolute -left-[9px] top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${m.completed ? 'bg-emerald-500' : 'bg-gray-300'}`}
                            />
                            <div className="pl-3">
                              <p className="text-[11px] font-semibold text-[#2C1B57] leading-tight">
                                {m.title}
                              </p>
                              {m.time && <p className="text-[9px] text-[#9C94A7]">{m.time}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* DELETE */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleDelete(selectedApp._id)}
                      className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Application
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* EMPTY STATE — When job selected but no detail */}
        {selectedJob && !selectedApp && !loadingDetails && (
          <div className="hidden xl:flex items-center justify-center bg-white rounded-2xl border border-[#E8E3EF] border-dashed">
            <div className="text-center p-8">
              <UserCheck className="w-16 h-16 text-[#B29CFE] mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold text-[#2C1B57]">Select a candidate</p>
              <p className="text-xs text-[#6F687A] mt-1">
                Choose an application from the list to view full details
              </p>
            </div>
          </div>
        )}
      </div>

      {/* EMPTY STATE — When no job selected (initial view) */}
      {!selectedJob && !jobsLoading && jobs.length > 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E8E3EF] border-dashed">
          <Briefcase className="w-16 h-16 text-[#B29CFE] mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-[#2C1B57]">Select a Job to View Applications</p>
          <p className="text-xs text-[#6F687A] mt-1 max-w-md mx-auto">
            Click any job from the left panel to see the candidates who applied to it
          </p>
        </div>
      )}

      {/* ═══════ CONFIRMATION MODAL ═══════ */}
      {confirmAction && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-sm font-extrabold text-[#2C1B57] mb-2">Confirm Status Change</h3>
            <p className="text-xs text-[#49454F] mb-4 leading-relaxed">
              Move <strong>{selectedApp.candidateName}</strong> from{' '}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${STATUS_COLOR_MAP[selectedApp.status]}`}
              >
                {selectedApp.status}
              </span>{' '}
              to{' '}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${STATUS_COLOR_MAP[confirmAction.status]}`}
              >
                {confirmAction.status}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={updatingStatus}
                className="px-3 py-1.5 rounded-lg border border-[#E8E3EF] text-xs text-[#49454F] font-bold hover:bg-[#F8F5FF]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(selectedApp._id, confirmAction.status)}
                disabled={updatingStatus}
                className="px-3 py-1.5 rounded-lg bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                {updatingStatus && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ RESUME PREVIEW MODAL ═══════ */}
      {showResumeModal && selectedApp?.resumeUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-[#E8E3EF]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-[#2C1B57] truncate">
                    {selectedApp.resumeFileName || 'Resume'}
                  </h3>
                  <p className="text-[10px] text-[#6F687A]">{selectedApp.candidateName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    forceDownloadResume(selectedApp.resumeUrl, selectedApp.resumeFileName)
                  }
                  className="px-3 py-1.5 rounded-lg border border-[#E8E3EF] text-xs font-bold hover:bg-[#F8F5FF] flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
                <a
                  href={selectedApp.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-[#E8E3EF] text-xs font-bold hover:bg-[#F8F5FF] flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </a>
                <button
                  onClick={() => setShowResumeModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-[#F8F5FF] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100">
              <iframe
                src={`${selectedApp.resumeUrl}#toolbar=1&navpanes=0`}
                title="Resume Preview"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TOAST ═══════ */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[100] px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : toast.type === 'info'
                ? 'bg-blue-600 text-white'
                : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : toast.type === 'info' ? (
            <Copy className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
const InfoRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
  <div className="flex justify-between gap-2 text-[11px]">
    <span className="text-[#6F687A] shrink-0">{label}:</span>
    <span className="text-[#2C1B57] font-semibold text-right truncate">{value || '—'}</span>
  </div>
);

const MiniRow: React.FC<{
  icon: React.ReactNode;
  value: string;
  href?: string;
  onCopy?: () => void;
}> = ({ icon, value, href, onCopy }) => (
  <div className="flex items-center gap-1.5 group">
    <span className="text-[#6F687A] shrink-0">{icon}</span>
    {href && value ? (
      <a href={href} className="text-[11px] text-[#42326E] hover:underline truncate flex-1 min-w-0">
        {value || '—'}
      </a>
    ) : (
      <span className="text-[11px] text-[#2C1B57] truncate flex-1 min-w-0">{value || '—'}</span>
    )}
    {onCopy && value && (
      <button
        onClick={onCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-[#EDE6FA] rounded shrink-0"
        title="Copy"
      >
        <Copy className="w-3 h-3 text-[#6F687A]" />
      </button>
    )}
  </div>
);

const ChipSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: string[];
  chipClass: string;
  footer?: string;
}> = ({ title, icon, items, chipClass, footer }) => (
  <div className="bg-[#FCFCF7] rounded-2xl p-3">
    <h3 className="font-bold text-[10px] text-[#2C1B57] flex items-center gap-1 mb-1.5 uppercase tracking-wider">
      {icon}
      {title}
    </h3>
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span
          key={i}
          className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${chipClass}`}
        >
          {item}
        </span>
      ))}
    </div>
    {footer && <p className="text-[9px] text-[#9C94A7] mt-1.5">{footer}</p>}
  </div>
);