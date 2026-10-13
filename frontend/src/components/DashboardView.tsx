import React, { useState, useEffect, useCallback } from 'react';
import { Candidate, PipelineStage, AppRoute, AuthUser } from '../types';
import {
  TrendingUp,
  Briefcase,
  UserCheck,
  Zap,
  Plus,
  ShieldCheck,
  Calendar,
  MapPin,
  Sparkles,
  Award,
  ChevronDown,
  Crown,
  Coins,
  CreditCard,
  Users,
  Target,
  ArrowUpRight,
  Star,
  Eye,
} from 'lucide-react';
import { getCredits } from '../services/profilePurchaseService';

interface DashboardViewProps {
  candidates: Candidate[];
  onNavigate: (route: AppRoute) => void;
  onSelectCandidate: (candidate: Candidate) => void;
  onMoveCandidateStage: (candidateId: string, newStage: PipelineStage) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  authUser?: AuthUser | null;
}

const AppLogo = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <img
    src="/logo.png"
    alt="Smile Jobs"
    className={`object-contain shrink-0 ${className}`}
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />
);

export const DashboardView: React.FC<DashboardViewProps> = ({
  candidates,
  onNavigate,
  onSelectCandidate,
  onMoveCandidateStage,
  onScheduleInterview,
  authUser,
}) => {
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  // Credit Balance State — live from backend
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [totalPurchased, setTotalPurchased] = useState<number>(0);
  const [totalUsed, setTotalUsed] = useState<number>(0);
  const [creditLoading, setCreditLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCreditBalance();
  }, []);

  const fetchCreditBalance = async () => {
    try {
      setCreditLoading(true);
      const creditData = await getCredits();
      setCreditBalance(creditData.balance ?? 0);
      setTotalPurchased(creditData.totalPurchased ?? 0);
      setTotalUsed(creditData.totalUsed ?? 0);
    } catch (err) {
      console.warn('Could not fetch recruiter credit balance', err);
      setCreditBalance(0);
    } finally {
      setCreditLoading(false);
    }
  };

  const stages: PipelineStage[] = [
    'Applied',
    'Screening',
    'Shortlisted',
    'Interview',
    'Selected',
    'Hired',
  ];

  // Real computed metrics from actual candidate data
  const totalApplicants = candidates.length;
  const verifiedCount = candidates.filter((c) =>
    Object.values(c.verified).some((v) => v)
  ).length;
  const shortlistedCount = candidates.filter((c) => c.stage === 'Shortlisted').length;
  const interviewCount = candidates.filter((c) => c.stage === 'Interview').length;
  const hiredCount = candidates.filter((c) => c.stage === 'Hired').length;
  const selectedCount = candidates.filter((c) => c.stage === 'Selected').length;
  const premiumCandidates = candidates.filter((c) => c.matchScore >= 90);
  const avgMatchScore =
    candidates.length > 0
      ? Math.round(candidates.reduce((sum, c) => sum + c.matchScore, 0) / candidates.length)
      : 0;

  // Stage distribution for mini chart
  const stageDistribution = stages.map(
    (s) => candidates.filter((c) => c.stage === s).length
  );
  const maxStageCount = Math.max(...stageDistribution, 1);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedCandidateId(id);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const candidateId = e.dataTransfer.getData('text/plain') || draggedCandidateId;
    if (candidateId) {
      onMoveCandidateStage(candidateId, targetStage);
    }
    setDraggedCandidateId(null);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const isPremiumCandidate = (cand: Candidate) => cand.matchScore >= 90;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Applied':
        return 'bg-slate-400';
      case 'Screening':
        return 'bg-blue-400';
      case 'Shortlisted':
        return 'bg-purple-500';
      case 'Interview':
        return 'bg-amber-500';
      case 'Selected':
        return 'bg-cyan-500';
      case 'Hired':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStageBarColor = (stage: string) => {
    switch (stage) {
      case 'Applied':
        return 'bg-slate-300';
      case 'Screening':
        return 'bg-blue-300';
      case 'Shortlisted':
        return 'bg-purple-400';
      case 'Interview':
        return 'bg-amber-400';
      case 'Selected':
        return 'bg-cyan-400';
      case 'Hired':
        return 'bg-emerald-400';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col gap-4 bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-[#B29CFE]/20 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-gradient-to-tr from-amber-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <AppLogo className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl shadow-md" />

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
                  {getGreeting()},{' '}
                  {authUser?.name?.split(' ')[0] || 'Recruiter'}
                </h1>

                {authUser?.subscription?.tier && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold rounded-full border shadow-sm ${
                      authUser.subscription.tier === 'enterprise'
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200'
                        : authUser.subscription.tier === 'standard'
                        ? 'bg-gradient-to-r from-[#F8F5FF] to-[#EDE6FA] text-[#42326E] border-[#D7C8ED]'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {authUser.subscription.tier === 'enterprise' && (
                      <Award className="w-3 h-3 text-amber-500" />
                    )}
                    {authUser.subscription.tier === 'standard' && (
                      <Zap className="w-3 h-3 text-[#42326E]" />
                    )}
                    {authUser.subscription.tier === 'basic' && (
                      <ShieldCheck className="w-3 h-3" />
                    )}
                    <span className="uppercase tracking-wider">
                      {authUser.subscription.name}
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">
                Your live recruiting pipeline and candidate overview
              </p>
            </div>
          </div>

          {/* Credit Balance Pill — prominent on all screens */}
          <button
            onClick={() => onNavigate('profile-purchase')}
            className="relative group self-start sm:self-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 shadow-sm group-hover:shadow-md group-hover:border-amber-300 transition-all">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Profile Credits
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-900 tabular-nums leading-tight">
                  {creditLoading ? (
                    <span className="inline-block w-8 h-6 bg-amber-200/50 rounded animate-pulse" />
                  ) : (
                    creditBalance
                  )}
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => onNavigate('candidates')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-gray-200 hover:border-[#D7C8ED] hover:bg-[#F8F5FF] text-[11px] sm:text-xs font-bold text-[#2C1B57] rounded-xl shadow-sm transition-all text-center"
          >
            Find Candidates
          </button>

          <button
            onClick={() => onNavigate('profile-purchase')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] sm:text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Coins className="w-3.5 h-3.5" />
            Buy Credits
          </button>

          <button
            onClick={() => onNavigate('post-job')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-[11px] sm:text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Post Job
          </button>
        </div>
      </div>

      {/* ─── Metric Cards — Real Data ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Applicants */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                Applicants
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] mt-1 tabular-nums">
                {totalApplicants}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#F8F5FF] border border-[#EDE6FA] text-[#42326E] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          {/* Real stage mini chart */}
          <div className="flex items-end gap-1 h-8 sm:h-10 mt-3 sm:mt-5 opacity-80 group-hover:opacity-100 transition-opacity">
            {stageDistribution.map((count, i) => (
              <div
                key={i}
                style={{
                  height: `${Math.max((count / maxStageCount) * 100, 8)}%`,
                }}
                className={`flex-1 rounded-sm transition-all ${getStageBarColor(stages[i])}`}
                title={`${stages[i]}: ${count}`}
              />
            ))}
          </div>
        </div>

        {/* Verified Talent */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                Verified
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] mt-1 tabular-nums">
                {verifiedCount}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-5">
            {totalApplicants > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${(verifiedCount / totalApplicants) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 tabular-nums">
                  {Math.round((verifiedCount / totalApplicants) * 100)}%
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium">
                No applicants yet
              </span>
            )}
          </div>
        </div>

        {/* Interview Pipeline */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                Interviews
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] mt-1 tabular-nums">
                {interviewCount}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-5 flex items-center justify-between font-medium">
            <span>
              {hiredCount} hired • {selectedCount} selected
            </span>
          </div>
        </div>

        {/* Avg Match Score */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                Avg Match
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] mt-1 tabular-nums">
                {avgMatchScore}%
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-5">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${avgMatchScore}%`,
                    background:
                      avgMatchScore >= 80
                        ? 'linear-gradient(90deg, #34d399, #10b981)'
                        : avgMatchScore >= 60
                        ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                        : 'linear-gradient(90deg, #f87171, #ef4444)',
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-gray-500">
                {premiumCandidates.length} top
              </span>
            </div>
          </div>
        </div>

        {/* Profile Credits — Premium Card */}
        <div
          onClick={() => onNavigate('profile-purchase')}
          className="col-span-2 lg:col-span-1 relative rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 opacity-100" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.3),_transparent_50%)]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-600/30 to-transparent rounded-full blur-xl pointer-events-none" />

          {/* Floating coins decoration */}
          <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
            <Coins className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
          </div>

          <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Credits
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white mt-1 tabular-nums drop-shadow-sm">
                  {creditLoading ? (
                    <span className="inline-block w-10 h-8 bg-white/30 rounded animate-pulse" />
                  ) : (
                    creditBalance
                  )}
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white/30 transition-all shrink-0 border border-white/20">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>

            <div className="mt-3 sm:mt-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-white/70">
                  {totalPurchased > 0
                    ? `${totalPurchased} purchased`
                    : 'No purchases yet'}
                </div>
                <div className="text-[10px] font-bold text-white/70">
                  {totalUsed > 0 ? `${totalUsed} profiles unlocked` : 'Ready to unlock'}
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black text-white bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/20 flex items-center gap-1 group-hover:bg-white/30 transition-all">
                Buy More
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Premium Candidates Spotlight ─── */}
      {premiumCandidates.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden">
          {/* Premium background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0E3D] via-[#2C1B57] to-[#42326E]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.15),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(178,156,254,0.1),_transparent_60%)]" />

          <div className="relative z-10 p-4 sm:p-6 md:p-8">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-black text-white flex items-center gap-2 flex-wrap">
                    Premium Matches
                    <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-[#1A0E3D] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                      90%+ Score
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#B29CFE] font-medium mt-0.5">
                    {premiumCandidates.length} exceptional
                    candidate{premiumCandidates.length !== 1 ? 's' : ''} matched
                    to your openings
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('candidates')}
                className="self-start sm:self-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                View All
              </button>
            </div>

            {/* Premium Candidate Cards — Horizontal Scroll */}
            <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 -mx-1 px-1 snap-x snap-mandatory hide-scrollbar">
              {premiumCandidates.slice(0, 8).map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => onSelectCandidate(cand)}
                  className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 hover:border-amber-400/50 hover:bg-white/15 transition-all cursor-pointer group overflow-hidden"
                >
                  {/* Gold top strip */}
                  <div className="h-1 bg-gradient-to-r from-yellow-300 via-amber-500 to-orange-400" />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-inner ring-2 ring-amber-400/60"
                            style={{ backgroundColor: cand.avatarBg }}
                          >
                            {getInitials(cand.name)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#2C1B57] rounded-full" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-white truncate flex items-center gap-1">
                            {cand.name}
                            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-300 shrink-0" />
                          </div>
                          <div className="text-[11px] text-white/60 truncate font-medium">
                            {cand.role}
                          </div>
                        </div>
                      </div>

                      {/* Score badge */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="relative w-11 h-11 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="url(#gold-gradient)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={`${(cand.matchScore / 100) * 94.2} 94.2`}
                            />
                            <defs>
                              <linearGradient
                                id="gold-gradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                              >
                                <stop offset="0%" stopColor="#fbbf24" />
                                <stop offset="100%" stopColor="#f97316" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="absolute text-[11px] font-black text-amber-300 tabular-nums">
                            {cand.matchScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-semibold text-white/80">
                        <MapPin className="w-2.5 h-2.5" />
                        {cand.location.split(',')[0]}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400/20 rounded-md text-[10px] font-bold text-amber-300">
                        <Zap className="w-2.5 h-2.5" />
                        {cand.skills[0]}
                      </span>
                      {cand.experienceYears && (
                        <span className="px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-semibold text-white/70">
                          {cand.experienceYears}y Exp
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleInterview(cand);
                        }}
                        className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <Calendar className="w-3 h-3" />
                        Interview
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCandidate(cand);
                        }}
                        className="flex-1 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-[#1A0E3D] text-[10px] font-black rounded-lg flex items-center justify-center gap-1 hover:from-amber-500 hover:to-orange-600 transition-all shadow-sm"
                      >
                        <Star className="w-3 h-3" />
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Interactive Kanban Pipeline ─── */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3 px-1">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2C1B57] flex items-center gap-2 flex-wrap">
              Recruitment Pipeline
              <span className="px-2.5 py-0.5 rounded-full bg-[#EDE6FA] text-[#42326E] text-[10px] font-bold">
                {candidates.length} Active
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1 font-medium">
              Drag and drop candidate cards to shift stages
            </p>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex overflow-x-auto pb-4 sm:pb-6 pt-2 -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 gap-3 sm:gap-4 snap-x snap-mandatory hide-scrollbar">
          {stages.map((stage) => {
            const stageCandidates = candidates.filter((c) => c.stage === stage);
            const isOver = dragOverStage === stage;

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
                className={`w-[78vw] sm:w-[300px] md:w-[320px] shrink-0 snap-center flex flex-col bg-gray-50/70 rounded-2xl sm:rounded-3xl border transition-all duration-200 min-h-[400px] sm:min-h-[500px] ${
                  isOver
                    ? 'bg-[#F8F5FF] border-[#B29CFE] shadow-inner'
                    : 'border-gray-200/80'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200/80 mb-2 sm:mb-3 bg-white/50 rounded-t-2xl sm:rounded-t-3xl backdrop-blur-sm">
                  <h3 className="text-[12px] sm:text-[13px] font-extrabold text-[#2C1B57] uppercase tracking-wide flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${getStageColor(stage)}`}
                    />
                    {stage}
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 bg-white border border-gray-200 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg shadow-xs">
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards */}
                <div className="px-2 sm:px-3 pb-3 space-y-2 sm:space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {stageCandidates.map((cand) => {
                    const isPremium = isPremiumCandidate(cand);
                    return (
                      <div
                        key={cand.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cand.id)}
                        onClick={() => onSelectCandidate(cand)}
                        className={`bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden ${
                          isPremium
                            ? 'border-2 border-amber-300 ring-2 sm:ring-4 ring-amber-100/50 hover:ring-amber-200/70'
                            : 'border border-gray-200 hover:border-[#B29CFE]'
                        }`}
                      >
                        {/* Premium Gold Strip */}
                        {isPremium && (
                          <>
                            <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gradient-to-r from-yellow-300 via-amber-500 to-orange-400" />
                            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-bl from-amber-300/30 to-transparent rounded-full blur-xl pointer-events-none" />
                          </>
                        )}

                        <div
                          className={`p-3 sm:p-4 ${isPremium ? 'pt-4 sm:pt-5' : ''} relative z-10`}
                        >
                          {/* Avatar + Info */}
                          <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div className="relative shrink-0">
                                <div
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-inner ${
                                    isPremium ? 'ring-2 ring-amber-300' : ''
                                  }`}
                                  style={{
                                    backgroundColor: cand.avatarBg,
                                  }}
                                >
                                  {getInitials(cand.name)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12px] sm:text-[13px] font-extrabold text-[#2C1B57] truncate group-hover:text-[#42326E] transition-colors flex items-center gap-1">
                                  {cand.name}
                                  {isPremium && (
                                    <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                  )}
                                </div>
                                <div className="text-[10px] sm:text-[11px] font-medium text-gray-500 truncate">
                                  {cand.role}
                                </div>
                              </div>
                            </div>

                            {/* Score */}
                            {isPremium ? (
                              <div className="flex flex-col items-end shrink-0">
                                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 border border-amber-500/50 text-white text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg shadow-md whitespace-nowrap">
                                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                  VIP
                                </span>
                                <strong className="text-sm sm:text-base leading-none font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 tabular-nums mt-1">
                                  {cand.matchScore}%
                                </strong>
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-[#42326E] bg-[#F8F5FF] px-2 py-0.5 rounded-md tabular-nums shrink-0">
                                {cand.matchScore}%
                              </span>
                            )}
                          </div>

                          {/* Tags Row */}
                          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
                            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-50 border border-gray-100 rounded-md text-[9px] sm:text-[10px] font-semibold text-gray-600">
                              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                              {cand.location.split(',')[0]}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#F8F5FF] border border-[#EDE6FA] rounded-md text-[9px] sm:text-[10px] font-bold text-[#42326E]">
                              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#B29CFE]" />
                              {cand.skills[0]}
                            </span>
                            {cand.experienceYears && (
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-50 border border-gray-100 rounded-md text-[9px] sm:text-[10px] font-semibold text-gray-600">
                                {cand.experienceYears}y
                              </span>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md">
                              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                              Verified
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400">
                              {cand.appliedDate}
                            </span>
                          </div>

                          {/* Hover Actions */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 sm:mt-3 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <button
                              onClick={() => onScheduleInterview(cand)}
                              className="flex-1 py-1.5 bg-white border border-[#D7C8ED] text-[#42326E] text-[9px] sm:text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 hover:bg-[#F8F5FF] transition-colors shadow-xs"
                            >
                              <Calendar className="w-3 h-3" />
                              Interview
                            </button>
                            <div className="relative flex-1">
                              <select
                                value={cand.stage}
                                onChange={(e) =>
                                  onMoveCandidateStage(
                                    cand.id,
                                    e.target.value as PipelineStage
                                  )
                                }
                                className="w-full py-1.5 pl-2 pr-5 appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-[9px] sm:text-[10px] font-bold rounded-lg outline-none focus:border-[#42326E] cursor-pointer shadow-xs"
                              >
                                {stages.map((s) => (
                                  <option key={s} value={s}>
                                    Move: {s}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty State */}
                  {stageCandidates.length === 0 && (
                    <div className="h-28 sm:h-32 border-2 border-dashed border-gray-300 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2 bg-white/40">
                      <div className="p-2 rounded-full bg-gray-100">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold">
                        Drop here
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom CTA Banner ─── */}
      <div
        onClick={() => onNavigate('profile-purchase')}
        className="relative rounded-2xl overflow-hidden cursor-pointer group hover:shadow-2xl transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A0E3D] via-[#2C1B57] to-[#42326E]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-yellow-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-gradient-to-tr from-[#B29CFE]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0">
              <Coins className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
                Unlock Verified Candidate Profiles
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-[#1A0E3D] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Pay-per-unlock
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-[#B29CFE] mt-1 font-medium">
                Buy profile credits — unlock emails, phones & resumes forever.{' '}
                <span className="text-amber-300 font-bold">
                  {creditBalance > 0
                    ? `You have ${creditBalance} credits ready to use.`
                    : 'Start with 10 credits today!'}
                </span>
              </p>
            </div>
          </div>

          <button className="w-full md:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-[#1A0E3D] text-xs sm:text-sm font-black rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0">
            <CreditCard className="w-4 h-4" />
            Purchase Credits
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;