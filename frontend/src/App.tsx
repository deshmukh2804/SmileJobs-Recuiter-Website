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

// ✅ PREMIUM LOGO COMPONENT
const AppLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`shrink-0 ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="url(#logo_grad)"/>
    <path d="M28 42 Q50 22 72 42" stroke="white" strokeWidth="9" strokeLinecap="round"/>
    <path d="M28 62 Q50 82 72 62" stroke="#7CE0B0" strokeWidth="9" strokeLinecap="round"/>
    <defs>
      <linearGradient id="logo_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2C1B57"/>
        <stop offset="1" stopColor="#5A4590"/>
      </linearGradient>
    </defs>
  </svg>
);

// ✅ ONE-TIME LOCAL CACHE CLEANUP
try {
  const raw = localStorage.getItem('verihire_user');
  if (raw && (raw.includes('@phone.verihire.local') || raw.includes('"Verified Recruiter"'))) {
    localStorage.removeItem('verihire_user');
  }
} catch {}

const PROTECTED_ROUTES: AppRoute[] = ['dashboard', 'post-job', 'edit-job', 'job-details', 'my-jobs', 'candidates', 'shortlisted', 'interviews', 'company', 'profile', 'settings', 'subscription'];

const getDisplayEmail = (user?: AuthUser | null): string => {
  if (!user?.email) return '';
  return String(user.email).includes('@phone.verihire.local') ? '' : user.email;
};

const getContactLabel = (user?: AuthUser | null): string => {
  if (!user) return '';
  const cleanEmail = getDisplayEmail(user);
  if (cleanEmail) return cleanEmail;
  if (user.phone) return user.phone;
  return 'Complete your profile';
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('landing');
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const hydrateUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const freshUser = await authService.fetchMe();
          if (freshUser) setAuthUser(freshUser);
        } catch (err) {}
      }
    };
    hydrateUser();
  }, []);

  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    if (!authUser) { setCandidates([]); return; }
    try {
      setCandidatesLoading(true); setCandidatesError(null);
      const data = await candidateService.listCandidates();
      setCandidates(data || []);
    } catch (err: any) {
      setCandidatesError(err?.response?.data?.message || 'Failed to load candidates');
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser && ['dashboard', 'candidates', 'shortlisted', 'interviews'].includes(currentRoute)) {
      fetchCandidates();
    }
  }, [authUser, currentRoute, fetchCandidates]);

  const [jobs, setJobs] = useState<JobListing[]>(() => loadStoredData(STORAGE_KEYS.JOBS, INITIAL_JOBS));
  const [interviews, setInterviews] = useState<Interview[]>(() => loadStoredData(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS));
  const [company, setCompany] = useState<CompanyProfile>(() => loadStoredData(STORAGE_KEYS.COMPANY, INITIAL_COMPANY));

  useEffect(() => { saveStoredData(STORAGE_KEYS.JOBS, jobs); }, [jobs]);
  useEffect(() => { saveStoredData(STORAGE_KEYS.INTERVIEWS, interviews); }, [interviews]);
  useEffect(() => { saveStoredData(STORAGE_KEYS.COMPANY, company); }, [company]);

  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleCandidate, setScheduleCandidate] = useState<Candidate | null>(null);
  const [infoModalType, setInfoModalType] = useState<'privacy' | 'terms' | 'contact' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const showToast = useCallback((msg: string) => { setToastMessage(msg); }, []);
  const handleFeatureUnavailable = useCallback(() => { showToast('This feature has been removed.'); }, [showToast]);

  const handleLoginSuccess = useCallback(async (user: AuthUser) => {
    setAuthUser(user); setCurrentRoute('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' });
    try { const fresh = await authService.fetchMe(); if (fresh) setAuthUser(fresh); } catch {}
  }, []);

  const handleLogout = useCallback(async () => {
    await authService.logout(); setAuthUser(null); setCandidates([]); setCurrentRoute('landing');
    showToast('You have been signed out successfully'); setMobileMenuOpen(false);
  }, [showToast]);

  const handleUpdateAuthUser = useCallback((updates: Partial<AuthUser>) => {
    setAuthUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      authService.updateCachedUser(updates);
      return updated;
    });
  }, []);

  const handleReplaceAuthUser = useCallback((newUser: AuthUser) => { setAuthUser(newUser); }, []);

  const handleNavigate = useCallback((route: AppRoute) => {
    if (PROTECTED_ROUTES.includes(route) && !authUser) {
      showToast('Please sign in to access the recruiter portal'); setCurrentRoute('login');
      setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }
    if (route !== 'edit-job') setEditingJobId(null);
    if (route !== 'job-details') setViewingJobId(null);
    setCurrentRoute(route); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [authUser, showToast]);

  const handleEditJob = useCallback((jobId: string) => {
    if (!authUser) return;
    setEditingJobId(jobId); setViewingJobId(null); setCurrentRoute('edit-job');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [authUser]);

  const handleViewJob = useCallback((jobId: string) => {
    setViewingJobId(jobId); setEditingJobId(null); setCurrentRoute('job-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleMoveCandidateStage = useCallback(async (candidateId: string, newStage: PipelineStage) => {
    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c)));
    showToast(`Candidate moved to ${newStage}`);
    try { await candidateService.updateStage(candidateId, newStage); } catch (err) { fetchCandidates(); }
  }, [showToast, fetchCandidates]);

  const handleBookmarkToggle = useCallback(async (candidateId: string) => {
    setCandidates((prev) => prev.map((c) => {
      if (c.id === candidateId) {
        showToast(!c.bookmarked ? `${c.name} added to shortlisted` : `${c.name} removed`);
        return { ...c, bookmarked: !c.bookmarked };
      }
      return c;
    }));
    try { await candidateService.toggleBookmark(candidateId); } catch (err) { fetchCandidates(); }
  }, [showToast, fetchCandidates]);

  const handleAddCandidateNote = useCallback(async (candidateId: string, noteText: string) => {
    setCandidates((prev) => prev.map((c) => c.id === candidateId ? { ...c, notes: [...c.notes, noteText] } : c));
    showToast('Internal evaluation note appended');
    try { await candidateService.addNote(candidateId, noteText); } catch (err) { fetchCandidates(); }
  }, [showToast, fetchCandidates]);

  const handlePublishJob = useCallback(() => setCurrentRoute('my-jobs'), []);
  const handleSaveJobDraft = useCallback(() => setCurrentRoute('my-jobs'), []);
  const handleViewApplicants = useCallback((jobId: string, jobTitle: string) => {
    showToast(`Viewing applicants for ${jobTitle}`); setCurrentRoute('candidates');
  }, [showToast]);

  const handleOpenScheduleModal = useCallback((candidate?: Candidate) => {
    setScheduleCandidate(candidate || candidates[0] || null); setIsScheduleModalOpen(true);
  }, [candidates]);

  const handleConfirmInterview = useCallback((newInt: Omit<Interview, 'id'>) => {
    const created = { ...newInt, id: `int-${Date.now()}` };
    setInterviews((prev) => [created, ...prev]);
    handleMoveCandidateStage(created.candidateId, 'Interview');
  }, [handleMoveCandidateStage]);

  const handleUpdateInterviewStatus = useCallback((interviewId: string, status: Interview['status']) => {
    setInterviews((prev) => prev.map((i) => (i.id === interviewId ? { ...i, status } : i)));
    showToast(`Interview status set to ${status}`);
  }, [showToast]);

  const handleResetData = useCallback(() => {
    setJobs(INITIAL_JOBS); setInterviews(INITIAL_INTERVIEWS); setCompany(INITIAL_COMPANY); fetchCandidates();
  }, [fetchCandidates]);

  const handleSubscriptionSuccess = useCallback(async () => {
    try { const fresh = await authService.fetchMe(); if (fresh) setAuthUser(fresh); } catch {}
    showToast('Subscription activated successfully!'); setCurrentRoute('dashboard');
  }, [showToast]);

  const getUserInitials = useCallback((name?: string) => {
    if (!name || !name.trim()) return 'R';
    return name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  }, []);

  const sidebarDisplayName = useMemo(() => authUser?.name?.trim() || 'Guest User', [authUser]);
  const sidebarSubline = useMemo(() => authUser?.companyName?.trim() || getContactLabel(authUser), [authUser]);

  const navItems = useMemo(() => [
    { id: 'dashboard' as AppRoute, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'post-job' as AppRoute, label: 'Post Job', icon: PlusCircle },
    { id: 'my-jobs' as AppRoute, label: 'My Jobs', icon: Briefcase },
    { id: 'candidates' as AppRoute, label: 'Candidates', icon: Users },
    { id: 'shortlisted' as AppRoute, label: 'Shortlisted', icon: Star },
    { id: 'interviews' as AppRoute, label: 'Interviews', icon: Calendar },
  ], []);

  const secondaryNavItems = useMemo(() => [
    { id: 'profile' as AppRoute, label: 'My Profile', icon: UserRound },
    { id: 'company' as AppRoute, label: 'Company Profile', icon: Building },
    { id: 'subscription' as AppRoute, label: 'Subscription', icon: Sparkles },
    { id: 'settings' as AppRoute, label: 'Settings', icon: Settings },
  ], []);

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
          setActiveCandidate((prev) => prev ? { ...prev, bookmarked: !prev.bookmarked } : null);
        }}
        onScheduleInterview={(cand) => {
          setActiveCandidate(null);
          handleOpenScheduleModal(cand);
        }}
        onOpenMessage={handleFeatureUnavailable}
        onAddNote={(id, note) => {
          handleAddCandidateNote(id, note);
          setActiveCandidate((prev) => prev ? { ...prev, notes: [...prev.notes, note] } : null);
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
        onSubmitContact={() => showToast('Inquiry dispatched to Smile Jobs talent team')}
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
              <div onClick={() => handleNavigate('dashboard')} className="flex items-center gap-3 cursor-pointer group">
                {/* ✅ BRAND LOGO */}
                <AppLogo className="w-8 h-8 shadow-lg group-hover:scale-105 transition-transform duration-300" />
                <span className="font-extrabold text-lg tracking-tight">Smile Jobs</span>
              </div>
              <button onClick={() => handleNavigate('landing')} className="text-[10px] font-bold text-white/50 hover:text-white flex items-center gap-1 transition-colors" title="View Public Site">
                <span>Site</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Workspace</div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id || (item.id === 'my-jobs' && (currentRoute === 'edit-job' || currentRoute === 'job-details')) || (item.id === 'post-job' && currentRoute === 'edit-job');
                return (
                  <button key={item.id} onClick={() => handleNavigate(item.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-white/15 text-white shadow-xs' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2.5"><Icon className="w-4 h-4 shrink-0" /><span>{item.label}</span></div>
                  </button>
                );
              })}

              <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Management</div>
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button key={item.id} onClick={() => handleNavigate(item.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-white/15 text-white shadow-xs' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                    <Icon className="w-4 h-4 shrink-0" /><span>{item.label}</span>
                  </button>
                );
              })}

              <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all mt-2">
                <LogOut className="w-4 h-4 shrink-0" /><span>Sign Out</span>
              </button>
            </div>

            {/* Footer Profile */}
            <div className="p-3 border-t border-white/10">
              <button onClick={() => handleNavigate('profile')} className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                {authUser?.avatar?.url ? (
                  <img src={authUser.avatar.url} alt={authUser.name || 'Profile'} className="w-9 h-9 rounded-xl object-cover shadow-xs" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#42326E] to-[#B29CFE] flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    {getUserInitials(authUser?.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate text-white">{sidebarDisplayName}</div>
                  <div className="text-[10px] text-white/50 truncate">{sidebarSubline}</div>
                </div>
              </button>
            </div>
          </aside>

          {/* ═══ Main Area ═══ */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Header */}
            <header className="h-16 bg-[#FCFCF7]/90 backdrop-blur-md border-b border-[#E8E3EF] px-6 flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-3 lg:hidden">
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-[#2C1B57] hover:bg-gray-100 rounded-lg">
                  <Menu className="w-5 h-5" />
                </button>
                <div onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2.5 font-extrabold text-[#2C1B57] cursor-pointer">
                  {/* ✅ BRAND LOGO (MOBILE) */}
                  <AppLogo className="w-7 h-7" />
                  <span className="text-lg">Smile Jobs</span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 bg-white border border-[#E8E3EF] rounded-xl px-3 py-1.5 w-72 lg:w-96 shadow-2xs">
                <Search className="w-4 h-4 text-[#6F687A]" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && globalSearch.trim()) handleNavigate('candidates'); }}
                  placeholder="Global search (candidates, jobs, skills)..."
                  className="w-full text-xs text-[#29233A] focus:outline-none placeholder:text-[#6F687A]"
                />
              </div>

              <div className="flex items-center gap-2">
                {authUser?.subscription?.tier && (
                  <button onClick={() => handleNavigate('subscription')} className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all hover:shadow-sm ${authUser.subscription.tier === 'enterprise' ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200' : authUser.subscription.tier === 'standard' ? 'bg-gradient-to-r from-[#F8F5FF] to-[#EDE6FA] text-[#42326E] border-[#D7C8ED]' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {authUser.subscription.tier === 'enterprise' && '👑'}
                    {authUser.subscription.tier === 'standard' && '⚡'}
                    {authUser.subscription.tier === 'basic' && '🛡️'}
                    <span className="capitalize">{authUser.subscription.name}</span>
                  </button>
                )}

                <div className="h-6 w-px bg-[#E8E3EF] mx-1" />

                <button onClick={() => handleNavigate('landing')} className="px-3 py-1.5 text-xs font-bold text-[#49454F] hover:text-[#2C1B57] hover:bg-white rounded-xl transition-colors hidden sm:flex items-center gap-1.5">
                  <span>Public View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors hidden sm:flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </header>

            {/* ═══ Mobile Drawer ═══ */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
                <div className="relative w-64 bg-[#2C1B57] text-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
                  <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <span className="font-extrabold text-base flex items-center gap-2">
                      <AppLogo className="w-6 h-6" /> Smile Jobs
                    </span>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-white/70 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-3 border-b border-white/10">
                    <div className="flex items-center gap-3 p-2">
                      {authUser?.avatar?.url ? (
                        <img src={authUser.avatar.url} alt={authUser.name || 'Profile'} className="w-9 h-9 rounded-xl object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#42326E] to-[#B29CFE] flex items-center justify-center text-white font-bold text-xs">
                          {getUserInitials(authUser?.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate text-white">{sidebarDisplayName}</div>
                        <div className="text-[10px] text-white/50 truncate">{sidebarSubline}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentRoute === item.id;
                      return (
                        <button key={item.id} onClick={() => handleNavigate(item.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'}`}>
                          <div className="flex items-center gap-2.5"><Icon className="w-4 h-4" /><span>{item.label}</span></div>
                        </button>
                      );
                    })}

                    <div className="pt-4 border-t border-white/10 mt-2 space-y-1">
                      {secondaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentRoute === item.id;
                        return (
                          <button key={item.id} onClick={() => handleNavigate(item.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'}`}>
                            <Icon className="w-4 h-4" /><span>{item.label}</span>
                          </button>
                        );
                      })}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:text-red-200 hover:bg-red-500/10">
                        <LogOut className="w-4 h-4" /><span>Sign Out</span>
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

              {(currentRoute === 'post-job' || (currentRoute === 'edit-job' && editingJobId)) && (
                <PostJobView
                  onPublishJob={handlePublishJob}
                  onSaveDraft={handleSaveJobDraft}
                  onNavigate={handleNavigate}
                  authUser={authUser}
                  onShowToast={showToast}
                  editJobId={currentRoute === 'edit-job' ? editingJobId : null}
                />
              )}

              {currentRoute === 'job-details' && viewingJobId && (
                <JobDetailsView jobId={viewingJobId} onNavigate={handleNavigate} onEditJob={handleEditJob} onShowToast={showToast} />
              )}

              {currentRoute === 'my-jobs' && (
                <MyJobsView onNavigate={handleNavigate} onEditJob={handleEditJob} onViewJob={handleViewJob} onViewApplicants={handleViewApplicants} onShowToast={showToast} />
              )}

              {currentRoute === 'candidates' && (
                <>
                  {candidatesLoading && <div className="p-8 text-center text-sm text-[#6F687A]">Loading verified candidates...</div>}
                  {candidatesError && !candidatesLoading && (
                    <div className="p-6 mx-6 mt-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      <strong>Error:</strong> {candidatesError}
                      <button onClick={fetchCandidates} className="ml-3 underline font-bold hover:text-red-800">Retry</button>
                    </div>
                  )}
                  {!candidatesLoading && !candidatesError && (
                    <CandidatesView
                      candidates={candidates}
                      onSelectCandidate={(cand) => setActiveCandidate(cand)}
                      onBookmarkToggle={handleBookmarkToggle}
                      onShortlistCandidate={(cand) => {
                        handleMoveCandidateStage(cand.id, 'Shortlisted');
                        setCandidates((prev) => prev.map((c) => c.id === cand.id ? { ...c, bookmarked: true } : c));
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
                <ProfileView onShowToast={showToast} onUserUpdate={handleReplaceAuthUser} />
              )}

              {currentRoute === 'settings' && (
                <SettingsView onResetData={handleResetData} onShowToast={showToast} onUserUpdate={handleReplaceAuthUser} />
              )}

              {currentRoute === 'subscription' && (
                <SubscriptionView authUser={authUser} onSuccess={handleSubscriptionSuccess} onBack={() => handleNavigate('dashboard')} />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}