import React, { useState } from 'react';
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
} from 'lucide-react';

interface DashboardViewProps {
  candidates: Candidate[];
  onNavigate: (route: AppRoute) => void;
  onSelectCandidate: (candidate: Candidate) => void;
  onMoveCandidateStage: (candidateId: string, newStage: PipelineStage) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  authUser?: AuthUser | null;
}

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

  const stages: PipelineStage[] = [
    'Applied',
    'Screening',
    'Shortlisted',
    'Interview',
    'Selected',
    'Hired',
  ];

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

  // Helper to determine if a candidate is "Premium / Top Match"
  const isPremiumCandidate = (cand: Candidate) => cand.matchScore >= 90;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-[#B29CFE]/20 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
              Good morning, {authUser?.name?.split(' ')[0] || 'Recruiter'}
            </h1>
            {authUser?.subscription?.tier && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold rounded-full border shadow-sm ${
                authUser.subscription.tier === 'enterprise'
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200'
                  : authUser.subscription.tier === 'standard'
                    ? 'bg-gradient-to-r from-[#F8F5FF] to-[#EDE6FA] text-[#42326E] border-[#D7C8ED]'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {authUser.subscription.tier === 'enterprise' && <Award className="w-3.5 h-3.5 text-amber-500" />}
                {authUser.subscription.tier === 'standard' && <Zap className="w-3.5 h-3.5 text-[#42326E]" />}
                {authUser.subscription.tier === 'basic' && <ShieldCheck className="w-3.5 h-3.5" />}
                <span className="uppercase tracking-wider">{authUser.subscription.name}</span>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Here is your live recruiting pipeline and candidate verification overview.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('candidates')}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-gray-200 hover:border-[#D7C8ED] hover:bg-[#F8F5FF] text-xs font-bold text-[#2C1B57] rounded-xl shadow-sm transition-all text-center"
          >
            Find Candidates
          </button>
          <button
            onClick={() => onNavigate('post-job')}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Post Job
          </button>
        </div>
      </div>

      {/* ─── Metric Bento Strip ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Applicants</span>
              <div className="text-3xl font-extrabold text-[#2C1B57] mt-1">{candidates.length + 84}</div>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4%
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-10 mt-5 opacity-80 group-hover:opacity-100 transition-opacity">
            {[35, 50, 42, 70, 60, 85, 100].map((height, i) => (
              <div key={i} style={{ height: `${height}%` }} className={`flex-1 rounded-sm transition-all ${i === 6 ? 'bg-[#42326E]' : 'bg-[#EDE6FA]'}`} />
            ))}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Openings</span>
              <div className="text-3xl font-extrabold text-[#2C1B57] mt-1">18</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-5 flex items-center justify-between font-medium">
            <span>Across 4 departments</span>
            <button onClick={() => onNavigate('my-jobs')} className="text-[#42326E] font-bold hover:underline flex items-center gap-1">
              View <span className="text-[10px]">→</span>
            </button>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Verified Talent</span>
              <div className="text-3xl font-extrabold text-[#2C1B57] mt-1">{candidates.filter(c => Object.values(c.verified).some(v => v)).length + 120}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs mt-5 flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg w-max">
            <ShieldCheck className="w-4 h-4" />
            <span>92% passed audits</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shortlisted Pool</span>
              <div className="text-3xl font-extrabold text-[#2C1B57] mt-1">{candidates.filter(c => c.stage === 'Shortlisted').length + 28}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-5 flex items-center justify-between font-medium">
            <span>Ready for interview</span>
            <button onClick={() => onNavigate('shortlisted')} className="text-[#42326E] font-bold hover:underline flex items-center gap-1">
              Review <span className="text-[10px]">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Interactive Kanban Pipeline ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
          <div>
            <h2 className="text-xl font-extrabold text-[#2C1B57] flex items-center gap-2">
              Recruitment Pipeline
              <span className="px-2.5 py-0.5 rounded-full bg-[#EDE6FA] text-[#42326E] text-[10px] font-bold">
                {candidates.length} Active
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Drag and drop candidate cards or click them to inspect credentials and shift stages.
            </p>
          </div>
        </div>

        {/* Kanban Board Container (Mobile horizontal scroll snap setup) */}
        <div className="flex overflow-x-auto pb-6 pt-2 -mx-4 px-4 md:mx-0 md:px-0 gap-4 snap-x snap-mandatory hide-scrollbar">
          {stages.map((stage) => {
            const stageCandidates = candidates.filter((c) => c.stage === stage);
            const isOver = dragOverStage === stage;

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
                className={`w-[85vw] sm:w-[320px] shrink-0 snap-center flex flex-col bg-gray-50/70 rounded-3xl border transition-all duration-200 min-h-[500px] ${
                  isOver ? 'bg-[#F8F5FF] border-[#B29CFE] shadow-inner' : 'border-gray-200/80'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200/80 mb-3 bg-white/50 rounded-t-3xl backdrop-blur-sm">
                  <h3 className="text-[13px] font-extrabold text-[#2C1B57] uppercase tracking-wide flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      stage === 'Hired' ? 'bg-emerald-500' :
                      stage === 'Selected' ? 'bg-blue-500' :
                      stage === 'Interview' ? 'bg-amber-500' :
                      stage === 'Shortlisted' ? 'bg-purple-500' : 'bg-gray-400'
                    }`} />
                    {stage}
                  </h3>
                  <span className="text-[11px] font-bold text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-xs">
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards List */}
                <div className="px-3 pb-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {stageCandidates.map((cand) => {
                    const isPremium = isPremiumCandidate(cand);
                    return (
                      <div
                        key={cand.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cand.id)}
                        onClick={() => onSelectCandidate(cand)}
                        className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden ${
                          isPremium ? 'border-2 border-amber-200' : 'border border-gray-200 hover:border-[#B29CFE]'
                        }`}
                      >
                        {/* 🌟 Premium Highlight Strip */}
                        {isPremium && (
                          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
                        )}

                        <div className={`p-4 ${isPremium ? 'pt-5' : ''}`}>
                          {/* Top Row: Avatar + Premium Badge */}
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-inner"
                                  style={{ backgroundColor: cand.avatarBg }}
                                >
                                  {getInitials(cand.name)}
                                </div>
                                {/* Green Dot Online Indicator */}
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-extrabold text-[#2C1B57] truncate group-hover:text-[#42326E] transition-colors">
                                  {cand.name}
                                </div>
                                <div className="text-[11px] font-medium text-gray-500 truncate">
                                  {cand.role}
                                </div>
                              </div>
                            </div>
                            
                            {/* Premium Match Badge */}
                            {isPremium && (
                              <div className="flex flex-col items-end">
                                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 text-[9px] font-extrabold px-2 py-1 rounded-lg shadow-xs whitespace-nowrap">
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  Top Match
                                </span>
                                <span className="text-[10px] font-bold text-amber-600 mt-1">{cand.matchScore}% Score</span>
                              </div>
                            )}
                          </div>

                          {/* Middle Row: Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-semibold text-gray-600">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {cand.location.split(',')[0]}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F8F5FF] border border-[#EDE6FA] rounded-md text-[10px] font-bold text-[#42326E]">
                              <Zap className="w-3 h-3 text-[#B29CFE]" />
                              {cand.skills[0]}
                            </span>
                            {cand.experienceYears && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-semibold text-gray-600">
                                {cand.experienceYears}y Exp
                              </span>
                            )}
                          </div>

                          {/* Footer Info */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Verified
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400">
                              {cand.appliedDate}
                            </span>
                          </div>

                          {/* Hover Actions */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <button
                              onClick={() => onScheduleInterview(cand)}
                              className="flex-1 py-1.5 bg-white border border-[#D7C8ED] text-[#42326E] text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#F8F5FF] transition-colors shadow-xs"
                            >
                              <Calendar className="w-3 h-3" />
                              Interview
                            </button>
                            <div className="relative flex-1">
                              <select
                                value={cand.stage}
                                onChange={(e) =>
                                  onMoveCandidateStage(cand.id, e.target.value as PipelineStage)
                                }
                                className="w-full py-1.5 pl-2 pr-6 appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-[10px] font-bold rounded-lg outline-none focus:border-[#42326E] cursor-pointer shadow-xs"
                              >
                                {stages.map((s) => (
                                  <option key={s} value={s}>
                                    Move: {s}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty Column Drop Zone */}
                  {stageCandidates.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2 bg-white/40">
                      <div className="p-2 rounded-full bg-gray-100">
                        <Plus className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="text-xs font-bold">Drop here</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;