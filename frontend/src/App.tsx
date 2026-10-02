// FILE: frontend/src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppRoute,
  Candidate,
  JobListing,
  Interview,
  CompanyProfile,
  PipelineStage,
  AuthUser,
} from './types';
import {
  INITIAL_CANDIDATES,
  INITIAL_JOBS,
  INITIAL_INTERVIEWS,
  INITIAL_COMPANY,
  STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
} from './mockData';
import { authService } from './services/authService';
import { candidateService } from './services/candidateService';

// Components
import { Toast } from './components/Toast';
import { CandidateDrawer } from './components/CandidateDrawer';
import { ScheduleInterviewModal } from './components/ScheduleInterviewModal';
import { InfoModals } from './components/InfoModals';

// Views
import { LandingView } from './components/LandingView';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { PostJobView } from './components/PostJobView';
import { MyJobsView } from './components/MyJobsView';
import { JobDetailsView } from './components/JobDetailsView';
import { CandidatesView } from './components/CandidatesView';
import { ShortlistedView } from './components/ShortlistedView';
import { InterviewsView } from './components/InterviewsView';
import { CompanyProfileView } from './components/CompanyProfileView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { SubscriptionView } from './components/SubscriptionView';

// Icons
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  Users,
  Star,
  Calendar,
  Building,
  Settings,
  Search,
  Menu,
  X,
  ExternalLink,
  LogOut,
  Sparkles,
  UserRound,
} from 'lucide-react';

// ✅ ONE-TIME LOCAL CACHE CLEANUP for legacy fake emails
try {
  const raw = localStorage.getItem('verihire_user');
  if (
    raw &&
    (raw.includes('@phone.verihire.local') ||
      raw.includes('"Verified Recruiter"') ||
      raw.includes('"Verihire Talent Technologies"'))
  ) {
    localStorage.removeItem('verihire_user');
    console.log('🧹 [App] Cleared legacy cached user data');
  }
} catch {}

// Protected routes that require authentication
const PROTECTED_ROUTES: AppRoute[] = [
  'dashboard',
  'post-job',
  'edit-job',
  'job-details',
  'my-jobs',
  'candidates',
  'shortlisted',
  'interviews',
  'company',
  'profile',
  'settings',
  'subscription',
];

// Routes that require verified company
const VERIFIED_ROUTES: AppRoute[] = ['post-job', 'edit-job'];

// ✅ Helper: detect fake phone-generated emails
const isFakePhoneEmail = (email?: string): boolean => {
  if (!email) return false;
  return String(email).includes('@phone.verihire.local');
};

// ✅ Helper: get clean display email (never show fake ones)
const getDisplayEmail = (user?: AuthUser | null): string => {
  if (!user?.email) return '';
  return isFakePhoneEmail(user.email) ? '' : user.email;
};

// ✅ Helper: get best contact info for display
const getContactLabel = (user?: AuthUser | null): string => {
  if (!user) return '';
  const cleanEmail = getDisplayEmail(user);
  if (cleanEmail) return cleanEmail;
  if (user.phone) return user.phone;
  return 'Complete your profile';
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('landing');

  // ═══════════════════════════════════════════════════════
  // AUTH STATE
  // ═══════════════════════════════════════════════════════
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    return authService.getCurrentUser();
  });

  // ✅ ON APP LOAD — Force-refresh user from server (clears stale cache)
  useEffect(() => {
    const hydrateUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const freshUser = await authService.fetchMe();
          if (freshUser) {
            setAuthUser(freshUser);
            console.log('✅ [App] User refreshed from server');
          }
        } catch (err) {
          console.warn('⚠️ [App] Failed to refresh user session:', err);
        }
      }
    };
    hydrateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════
  // JOB EDIT / VIEW STATE
  // ═══════════════════════════════════════════════════════
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════
  // CANDIDATES — REAL API
  // ═══════════════════════════════════════════════════════
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    if (!authUser) {
      setCandidates([]);
      return;
    }
    try {
      setCandidatesLoading(true);
      setCandidatesError(null);
      const data = await candidateService.listCandidates();
      setCandidates(data || []);
      console.log('[APP] Fetched candidates from API:', data?.length || 0);
    } catch (err: any) {
      console.error('[APP] Failed to fetch candidates:', err.message);
      setCandidatesError(
        err?.response?.data?.message || 'Failed to load candidates'
      );
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (
      authUser &&
      ['dashboard', 'candidates', 'shortlisted', 'interviews'].includes(
        currentRoute
      )
    ) {
      fetchCandidates();
    }
  }, [authUser, currentRoute, fetchCandidates]);

  // Persistent States
  const [jobs, setJobs] = useState<JobListing[]>(() =>
    loadStoredData(STORAGE_KEYS.JOBS, INITIAL_JOBS)
  );
  const [interviews, setInterviews] = useState<Interview[]>(() =>
    loadStoredData(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS)
  );
  const [company, setCompany] = useState<CompanyProfile>(() =>
    loadStoredData(STORAGE_KEYS.COMPANY, INITIAL_COMPANY)
  );

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.JOBS, jobs);
  }, [jobs]);
  useEffect(() => {
    saveStoredData(STORAGE_KEYS.INTERVIEWS, interviews);
  }, [interviews]);
  useEffect(() => {
    saveStoredData(STORAGE_KEYS.COMPANY, company);
  }, [company]);

  // Modal & Drawer State
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(
    null
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleCandidate, setScheduleCandidate] = useState<Candidate | null>(
    null
  );
  const [infoModalType, setInfoModalType] = useState<
    'privacy' | 'terms' | 'contact' | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const handleFeatureUnavailable = useCallback(() => {
    showToast('This feature has been removed.');
  }, [showToast]);

  // ═══════════════════════════════════════════════════════
  // AUTH HANDLERS
  // ═══════════════════════════════════════════════════════
  const handleLoginSuccess = useCallback(async (user: AuthUser) => {
    setAuthUser(user);
    setCurrentRoute('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ✅ Refresh from server right after login for the latest clean data
    try {
      const fresh = await authService.fetchMe();
      if (fresh) setAuthUser(fresh);
    } catch {}
  }, []);

  const handleLogout = useCallback(async () => {
    await authService.logout();
    setAuthUser(null);
    setCandidates([]);
    setCurrentRoute('landing');
    showToast('You have been signed out successfully');
    setMobileMenuOpen(false);
  }, [showToast]);

  const handleUpdateAuthUser = useCallback((updates: Partial<AuthUser>) => {
    setAuthUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      authService.updateCachedUser(updates);
      return updated;
    });
  }, []);

  // ✅ NEW: Full user replacement (used by Settings after profile save)
  const handleReplaceAuthUser = useCallback((newUser: AuthUser) => {
    setAuthUser(newUser);
  }, []);

  // ═══════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════
  const handleNavigate = useCallback(
    (route: AppRoute) => {
      if (PROTECTED_ROUTES.includes(route) && !authUser) {
        showToast('Please sign in to access the recruiter portal');
        setCurrentRoute('login');
        setMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (route !== 'edit-job') setEditingJobId(null);
      if (route !== 'job-details') setViewingJobId(null);

      setCurrentRoute(route);
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [authUser, showToast]
  );

  const handleEditJob = useCallback(
    (jobId: string) => {
      if (!authUser) {
        showToast('Please sign in first');
        setCurrentRoute('login');
        return;
      }
      setEditingJobId(jobId);
      setViewingJobId(null);
      setCurrentRoute('edit-job');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [authUser, showToast]
  );

  const handleViewJob = useCallback((jobId: string) => {
    setViewingJobId(jobId);
    setEditingJobId(null);
    setCurrentRoute('job-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ═══════════════════════════════════════════════════════
  // CANDIDATE HANDLERS — Real API
  // ═══════════════════════════════════════════════════════
  const handleMoveCandidateStage = useCallback(
    async (candidateId: string, newStage: PipelineStage) => {
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c))
      );
      const candidate = candidates.find((c) => c.id === candidateId);
      showToast(
        candidate
          ? `${candidate.name} shifted to ${newStage}`
          : `Candidate moved to ${newStage}`
      );

      try {
        await candidateService.updateStage(candidateId, newStage);
      } catch (err: any) {
        console.error('[APP] Failed to update stage:', err.message);
        showToast('Failed to update stage — refreshing data');
        fetchCandidates();
      }
    },
    [candidates, showToast, fetchCandidates]
  );

  const handleBookmarkToggle = useCallback(
    async (candidateId: string) => {
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id === candidateId) {
            const nextState = !c.bookmarked;
            showToast(
              nextState
                ? `${c.name} added to shortlisted pool`
                : `${c.name} removed from shortlisted`
            );
            return { ...c, bookmarked: nextState };
          }
          return c;
        })
      );

      try {
        await candidateService.toggleBookmark(candidateId);
      } catch (err: any) {
        console.error('[APP] Failed to toggle bookmark:', err.message);
        showToast('Failed to update bookmark — refreshing data');
        fetchCandidates();
      }
    },
    [showToast, fetchCandidates]
  );

  const handleAddCandidateNote = useCallback(
    async (candidateId: string, noteText: string) => {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, notes: [...c.notes, noteText] } : c
        )
      );
      showToast('Internal evaluation note appended');

      try {
        await candidateService.addNote(candidateId, noteText);
      } catch (err: any) {
        console.error('[APP] Failed to add note:', err.message);
        showToast('Failed to save note — refreshing data');
        fetchCandidates();
      }
    },
    [showToast, fetchCandidates]
  );

  // ═══════════════════════════════════════════════════════
  // JOB HANDLERS
  // ═══════════════════════════════════════════════════════
  const handlePublishJob = useCallback(
    (
      jobData: Omit<
        JobListing,
        'id' | 'postedDate' | 'applicantsCount' | 'shortlistedCount'
      >
    ) => {
      const newJob: JobListing = {
        ...jobData,
        id: `job-${Date.now()}`,
        postedDate: 'Just now',
        applicantsCount: 0,
        shortlistedCount: 0,
        status: 'active',
      };
      setJobs((prev) => [newJob, ...prev]);
      showToast(`Job listing "${newJob.title}" published!`);
      setCurrentRoute('my-jobs');
    },
    [showToast]
  );

  const handleSaveJobDraft = useCallback(
    (
      jobData: Omit<
        JobListing,
        'id' | 'postedDate' | 'applicantsCount' | 'shortlistedCount'
      >
    ) => {
      const draftJob: JobListing = {
        ...jobData,
        id: `job-${Date.now()}`,
        postedDate: 'Draft',
        applicantsCount: 0,
        shortlistedCount: 0,
        status: 'draft',
      };
      setJobs((prev) => [draftJob, ...prev]);
      showToast('Job listing draft saved');
      setCurrentRoute('my-jobs');
    },
    [showToast]
  );

  const handleUpdateJobStatus = useCallback(
    (jobId: string, newStatus: JobListing['status']) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      showToast(`Job status updated to ${newStatus}`);
    },
    [showToast]
  );

  const handleDeleteJob = useCallback(
    (jobId: string) => {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      showToast('Job listing removed');
    },
    [showToast]
  );

  const handleViewApplicants = useCallback(
    (jobId: string, jobTitle: string) => {
      showToast(`Viewing applicants for ${jobTitle}`);
      setCurrentRoute('candidates');
    },
    [showToast]
  );

  // ═══════════════════════════════════════════════════════
  // INTERVIEW HANDLERS
  // ═══════════════════════════════════════════════════════
  const handleOpenScheduleModal = useCallback(
    (candidate?: Candidate) => {
      setScheduleCandidate(candidate || candidates[0] || null);
      setIsScheduleModalOpen(true);
    },
    [candidates]
  );

  const handleConfirmInterview = useCallback(
    (newInt: Omit<Interview, 'id'>) => {
      const created: Interview = {
        ...newInt,
        id: `int-${Date.now()}`,
      };
      setInterviews((prev) => [created, ...prev]);
      handleMoveCandidateStage(created.candidateId, 'Interview');
      showToast(`Interview scheduled with ${created.candidateName}`);
    },
    [handleMoveCandidateStage, showToast]
  );

  const handleUpdateInterviewStatus = useCallback(
    (interviewId: string, status: Interview['status']) => {
      setInterviews((prev) =>
        prev.map((i) => (i.id === interviewId ? { ...i, status } : i))
      );
      showToast(`Interview status set to ${status}`);
    },
    [showToast]
  );

  // ═══════════════════════════════════════════════════════
  // SETTINGS HANDLERS
  // ═══════════════════════════════════════════════════════
  const handleResetData = useCallback(() => {
    setJobs(INITIAL_JOBS);
    setInterviews(INITIAL_INTERVIEWS);
    setCompany(INITIAL_COMPANY);
    fetchCandidates();
    showToast('Demonstration data restored to initial state');
  }, [fetchCandidates, showToast]);

  // ═══════════════════════════════════════════════════════
  // SUBSCRIPTION HANDLERS
  // ═══════════════════════════════════════════════════════
  const handleSubscriptionSuccess = useCallback(async () => {
    // Refresh user info to get updated subscription data
    try {
      const fresh = await authService.fetchMe();
      if (fresh) setAuthUser(fresh);
    } catch {}
    showToast('Subscription activated successfully!');
    setCurrentRoute('dashboard');
  }, [showToast]);

  // ═══════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════
  const getUserInitials = useCallback((name?: string) => {
    if (!name || !name.trim()) return 'R';
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, []);

  const sidebarDisplayName = useMemo(() => {
    if (!authUser) return 'Guest User';
    if (authUser.name && authUser.name.trim()) return authUser.name;
    return 'Complete your profile';
  }, [authUser]);

  const sidebarSubline = useMemo(() => {
    if (!authUser) return '';
    if (authUser.companyName && authUser.companyName.trim()) {
      return authUser.companyName;
    }
    return getContactLabel(authUser);
  }, [authUser]);

  const navItems = useMemo(
    () => [
      {
        id: 'dashboard' as AppRoute,
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
      { id: 'post-job' as AppRoute, label: 'Post Job', icon: PlusCircle },
      { id: 'my-jobs' as AppRoute, label: 'My Jobs', icon: Briefcase },
      { id: 'candidates' as AppRoute, label: 'Candidates', icon: Users },
      { id: 'shortlisted' as AppRoute, label: 'Shortlisted', icon: Star },
      {
        id: 'interviews' as AppRoute,
        label: 'Interviews',
        icon: Calendar,
      },
    ],
    []
  );

  const secondaryNavItems = useMemo(
    () => [
      {
        id: 'profile' as AppRoute,
        label: 'My Profile',
        icon: UserRound,
      },
      {
        id: 'company' as AppRoute,
        label: 'Company Profile',
        icon: Building,
      },
      {
        id: 'subscription' as AppRoute,
        label: 'Subscription',
        icon: Sparkles,
      },
      { id: 'settings' as AppRoute, label: 'Settings', icon: Settings },
    ],
    []
  );

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#FCFCF7] text-[#29233A] flex flex-col font-sans">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <CandidateDrawer
        candidate={activeCandidate}
        onClose={() => setActiveCandidate(null)}
        onStageChange={(id, stage) => {
          handleMoveCandidateStage(id, stage);
          setActiveCandidate((prev) => (prev ? { ...prev, stage } : null));
        }}
        onBookmarkToggle={(id) => {
          handleBookmarkToggle(id);
          setActiveCandidate((prev) =>
            prev ? { ...prev, bookmarked: !prev.bookmarked } : null
          );
        }}
        onScheduleInterview={(cand) => {
          setActiveCandidate(null);
          handleOpenScheduleModal(cand);
        }}
        onOpenMessage={handleFeatureUnavailable}
        onAddNote={(id, note) => {
          handleAddCandidateNote(id, note);
          setActiveCandidate((prev) =>
            prev ? { ...prev, notes: [...prev.notes, note] } : null
          );
        }}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        candidate={scheduleCandidate}
        onClose={() => setIsScheduleModalOpen(false)}
        onConfirm={handleConfirmInterview}
      />

      <InfoModals
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
        onSubmitContact={() =>
          showToast('Inquiry dispatched to Smile Jobs talent team')
        }
      />

      {currentRoute === 'landing' ? (
        <LandingView
          onNavigate={handleNavigate}
          featuredCandidates={candidates}
          onSelectCandidate={(cand) => setActiveCandidate(cand)}
          onOpenInfo={(t) => setInfoModalType(t)}
          authUser={authUser}
        />
      ) : currentRoute === 'login' ? (
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      ) : (
        <div className="flex h-screen overflow-hidden">
          {/* ═══ Sidebar (Desktop) ═══ */}
          <aside className="hidden lg:flex w-64 bg-[#2C1B57] text-white flex-col h-full shrink-0 border-r border-white/10 select-none">
            <div className="p-5 flex items-center justify-between border-b border-white/10">
              <div
                onClick={() => handleNavigate('dashboard')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2C1B57] to-[#B29CFE] relative flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-0 rounded-b-xs" />
                  <div className="absolute top-2 w-3.5 h-0.5 bg-white rounded-full" />
                </div>
                <span className="font-extrabold text-base tracking-tight">
                  Smile Jobs
                </span>
              </div>
              <button
                onClick={() => handleNavigate('landing')}
                className="text-[10px] font-bold text-white/50 hover:text-white flex items-center gap-1 transition-colors"
                title="View Public Site"
              >
                <span>Site</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                Workspace
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentRoute === item.id ||
                  (item.id === 'my-jobs' &&
                    (currentRoute === 'edit-job' ||
                      currentRoute === 'job-details')) ||
                  (item.id === 'post-job' && currentRoute === 'edit-job');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white/15 text-white shadow-xs'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}

              <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                Management
              </div>
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white/15 text-white shadow-xs'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all mt-2"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Footer Profile */}
            <div className="p-3 border-t border-white/10">
              <button
                onClick={() => handleNavigate('profile')}
                className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                title="Edit profile"
              >
                {authUser?.avatar?.url ? (
                  <img
                    src={authUser.avatar.url}
                    alt={authUser.name || 'Profile'}
                    className="w-9 h-9 rounded-xl object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#42326E] to-[#B29CFE] flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    {getUserInitials(authUser?.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate text-white">
                    {sidebarDisplayName}
                  </div>
                  <div className="text-[10px] text-white/50 truncate">
                    {sidebarSubline}
                  </div>
                </div>
              </button>
            </div>
          </aside>

          {/* ═══ Main Area ═══ */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Header */}
            <header className="h-16 bg-[#FCFCF7]/90 backdrop-blur-md border-b border-[#E8E3EF] px-6 flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-3 lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 text-[#2C1B57] hover:bg-gray-100 rounded-lg"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div
                  onClick={() => handleNavigate('dashboard')}
                  className="flex items-center gap-2 font-bold text-[#2C1B57] cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-[#2C1B57] flex items-center justify-center text-white text-xs font-bold">
                    SJ
                  </div>
                  <span>Smile Jobs</span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 bg-white border border-[#E8E3EF] rounded-xl px-3 py-1.5 w-72 lg:w-96 shadow-2xs">
                <Search className="w-4 h-4 text-[#6F687A]" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && globalSearch.trim()) {
                      handleNavigate('candidates');
                    }
                  }}
                  placeholder="Global search (candidates, jobs, skills)..."
                  className="w-full text-xs text-[#29233A] focus:outline-hidden placeholder:text-[#6F687A]"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* ✅ Subscription Badge in Header */}
                {authUser?.subscription?.tier && (
                  <button
                    onClick={() => handleNavigate('subscription')}
                    className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all hover:shadow-sm ${
                      authUser.subscription.tier === 'enterprise'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : authUser.subscription.tier === 'standard'
                          ? 'bg-[#EDE6FA] text-[#42326E] border-[#D7C8ED] hover:bg-[#D7C8ED]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                    title="Manage subscription"
                  >
                    {authUser.subscription.tier === 'enterprise' && '👑'}
                    {authUser.subscription.tier === 'standard' && '⚡'}
                    {authUser.subscription.tier === 'basic' && '🛡️'}
                    <span className="capitalize">{authUser.subscription.name}</span>
                  </button>
                )}

                <div className="h-6 w-px bg-[#E8E3EF] mx-1" />

                <button
                  onClick={() => handleNavigate('landing')}
                  className="px-3 py-1.5 text-xs font-bold text-[#49454F] hover:text-[#2C1B57] hover:bg-white rounded-xl transition-colors hidden sm:flex items-center gap-1.5"
                >
                  <span>Public View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors hidden sm:flex items-center gap-1.5"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </header>

            {/* ═══ Mobile Drawer ═══ */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex">
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="relative w-64 bg-[#2C1B57] text-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
                  <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <span className="font-extrabold text-base">Smile Jobs</span>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1 rounded-lg text-white/70 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-3 border-b border-white/10">
                    <div className="flex items-center gap-3 p-2">
                      {authUser?.avatar?.url ? (
                        <img
                          src={authUser.avatar.url}
                          alt={authUser.name || 'Profile'}
                          className="w-9 h-9 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#42326E] to-[#B29CFE] flex items-center justify-center text-white font-bold text-xs">
                          {getUserInitials(authUser?.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate text-white">
                          {sidebarDisplayName}
                        </div>
                        <div className="text-[10px] text-white/50 truncate">
                          {sidebarSubline}
                        </div>
                        {/* ✅ Subscription tier in mobile drawer */}
                        {authUser?.subscription?.tier && (
                          <div className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                            authUser.subscription.tier === 'enterprise'
                              ? 'bg-amber-500/20 text-amber-300'
                              : authUser.subscription.tier === 'standard'
                                ? 'bg-[#B29CFE]/30 text-[#E0D4FC]'
                                : 'bg-white/10 text-white/70'
                          }`}>
                            {authUser.subscription.tier === 'enterprise' && '👑'}
                            {authUser.subscription.tier === 'standard' && '⚡'}
                            {authUser.subscription.tier === 'basic' && '🛡️'}
                            {authUser.subscription.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentRoute === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
                            isActive
                              ? 'bg-white/15 text-white'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                        </button>
                      );
                    })}

                    <div className="pt-4 border-t border-white/10 mt-2 space-y-1">
                      {secondaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentRoute === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
                              isActive
                                ? 'bg-white/15 text-white'
                                : 'text-white/60 hover:text-white'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handleNavigate('landing')}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Back to Landing Page</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:text-red-200 hover:bg-red-500/10"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Page Content Router ═══ */}
            <main className="flex-1 overflow-y-auto bg-[#FCFCF7]">
              {currentRoute === 'dashboard' && (
                <DashboardView
                  candidates={candidates}
                  onNavigate={handleNavigate}
                  onSelectCandidate={(cand) => setActiveCandidate(cand)}
                  onMoveCandidateStage={handleMoveCandidateStage}
                  onScheduleInterview={handleOpenScheduleModal}
                  authUser={authUser}
                />
              )}

              {(currentRoute === 'post-job' ||
                (currentRoute === 'edit-job' && editingJobId)) && (
                <PostJobView
                  onPublishJob={handlePublishJob}
                  onSaveDraft={handleSaveJobDraft}
                  onNavigate={handleNavigate}
                  authUser={authUser}
                  onShowToast={showToast}
                  editJobId={
                    currentRoute === 'edit-job' ? editingJobId : null
                  }
                />
              )}

              {currentRoute === 'job-details' && viewingJobId && (
                <JobDetailsView
                  jobId={viewingJobId}
                  onNavigate={handleNavigate}
                  onEditJob={handleEditJob}
                  onShowToast={showToast}
                />
              )}

              {currentRoute === 'my-jobs' && (
                <MyJobsView
                  onNavigate={handleNavigate}
                  onEditJob={handleEditJob}
                  onViewJob={handleViewJob}
                  onViewApplicants={handleViewApplicants}
                  onShowToast={showToast}
                />
              )}

              {currentRoute === 'candidates' && (
                <>
                  {candidatesLoading && (
                    <div className="p-8 text-center text-sm text-[#6F687A]">
                      Loading verified candidates from your job applications...
                    </div>
                  )}
                  {candidatesError && !candidatesLoading && (
                    <div className="p-6 mx-6 mt-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      <strong>Error:</strong> {candidatesError}
                      <button
                        onClick={fetchCandidates}
                        className="ml-3 underline font-bold hover:text-red-800"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {!candidatesLoading && !candidatesError && (
                    <CandidatesView
                      candidates={candidates}
                      onSelectCandidate={(cand) => setActiveCandidate(cand)}
                      onBookmarkToggle={handleBookmarkToggle}
                      onShortlistCandidate={(cand) => {
                        handleMoveCandidateStage(cand.id, 'Shortlisted');
                        setCandidates((prev) =>
                          prev.map((c) =>
                            c.id === cand.id ? { ...c, bookmarked: true } : c
                          )
                        );
                      }}
                      onOpenMessage={handleFeatureUnavailable}
                    />
                  )}
                </>
              )}

              {currentRoute === 'shortlisted' && (
                <ShortlistedView
                  candidates={candidates}
                  onSelectCandidate={(cand) => setActiveCandidate(cand)}
                  onScheduleInterview={handleOpenScheduleModal}
                  onOpenMessage={handleFeatureUnavailable}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'interviews' && (
                <InterviewsView
                  interviews={interviews}
                  candidates={candidates}
                  onOpenScheduleModal={handleOpenScheduleModal}
                  onUpdateStatus={handleUpdateInterviewStatus}
                  onNavigate={handleNavigate}
                  onShowToast={showToast}
                />
              )}

              {currentRoute === 'company' && (
                <CompanyProfileView
                  company={company}
                  onUpdateCompany={(c) => setCompany(c)}
                  onShowToast={showToast}
                  authUser={authUser}
                  onUpdateAuthUser={handleUpdateAuthUser}
                />
              )}

              {currentRoute === 'profile' && (
                <ProfileView
                  onShowToast={showToast}
                  onUserUpdate={handleReplaceAuthUser}
                />
              )}

              {currentRoute === 'settings' && (
                <SettingsView
                  onResetData={handleResetData}
                  onShowToast={showToast}
                  onUserUpdate={handleReplaceAuthUser}
                />
              )}

              {/* ✅ NEW: Subscription Route */}
              {currentRoute === 'subscription' && (
                <SubscriptionView
                  authUser={authUser}
                  onSuccess={handleSubscriptionSuccess}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
