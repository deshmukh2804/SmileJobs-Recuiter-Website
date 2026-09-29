import React, { useState } from 'react';
import { Candidate, PipelineStage, AppRoute } from '../types';
import { AuthUser } from '../types';
import {
  TrendingUp,
  Briefcase,
  UserCheck,
  Zap,
  Plus,
  ShieldCheck,
  Calendar,
  MoreHorizontal,
  ChevronRight,
  MapPin,
  Clock,
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

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      {/* Top Header */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <div className="flex items-center gap-2 flex-wrap">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
        Good morning, Bhavuk
      </h1>
      {/* ✅ Subscription tier badge on dashboard */}
      {authUser?.subscription?.tier && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
          authUser.subscription.tier === 'enterprise'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : authUser.subscription.tier === 'standard'
              ? 'bg-[#EDE6FA] text-[#42326E] border-[#D7C8ED]'
              : 'bg-gray-50 text-gray-600 border-gray-200'
        }`}>
          {authUser.subscription.tier === 'enterprise' && '👑'}
          {authUser.subscription.tier === 'standard' && '⚡'}
          {authUser.subscription.tier === 'basic' && '🛡️'}
          {authUser.subscription.name}
        </span>
      )}
    </div>
    <p className="text-sm text-[#6F687A] mt-1">
      Here is your live recruiting pipeline and candidate verification overview.
    </p>
  </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('candidates')}
            className="px-4 py-2.5 bg-white border border-[#E8E3EF] hover:border-[#D7C8ED] text-xs font-bold text-[#2C1B57] rounded-xl shadow-xs transition-all"
          >
            Find Candidates
          </button>
          <button
            onClick={() => onNavigate('post-job')}
            className="px-4 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </button>
        </div>
      </div>

      {/* Metric Bento Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E3EF] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#6F687A]">Total Applicants</span>
              <div className="text-3xl font-extrabold text-[#2C1B57] mt-1">1,284</div>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              +18.4%
            </span>
          </div>
          {/* Mini weekly bars */}
          <div className="flex items-end gap-1.5 h-9 mt-4">
            {[35, 50, 42, 70, 60, 85, 100].map((height, i) => (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-sm transition-all ${
                  i === 6 ? 'bg-[#42326E]' : 'bg-[#EDE6FA]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E3EF] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#6F687A]">Active Openings</span>
              <div className="text-3xl font-extrabold text-[#2C1B57] mt-1">18</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-[#6F687A] mt-4 flex items-center justify-between">
            <span>Across 4 departments</span>
            <button
              onClick={() => onNavigate('my-jobs')}
              className="text-[#42326E] font-bold hover:underline"
            >
              View listings →
            </button>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E3EF] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#6F687A]">Verified Talent</span>
              <div className="text-3xl font-extrabold text-[#2C1B57] mt-1">124</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-[#6F687A] mt-4 flex items-center gap-1.5 text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>92% passed Gov ID audits</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E3EF] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#6F687A]">Shortlisted Pool</span>
              <div className="text-3xl font-extrabold text-[#2C1B57] mt-1">37</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-[#6F687A] mt-4 flex items-center justify-between">
            <span>9 ready for interview</span>
            <button
              onClick={() => onNavigate('shortlisted')}
              className="text-[#42326E] font-bold hover:underline"
            >
              Review pool →
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Kanban Pipeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#2C1B57]">Recruitment Pipeline</h2>
            <p className="text-xs text-[#6F687A]">
              Drag and drop candidate cards or click them to inspect credentials and shift stages.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#6F687A] bg-white border border-[#E8E3EF] px-3 py-1.5 rounded-lg shadow-xs">
            {candidates.length} active candidates in pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageCandidates = candidates.filter((c) => c.stage === stage);
            const isOver = dragOverStage === stage;

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
                className={`bg-[#EDECE6]/80 rounded-2xl p-3 flex flex-col min-h-[480px] transition-colors ${
                  isOver ? 'bg-[#EDE6FA] ring-2 ring-[#B29CFE]' : ''
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1.5 pb-3 border-b border-black/5 mb-3">
                  <h3 className="text-xs font-extrabold text-[#49454F] uppercase tracking-wider">
                    {stage}
                  </h3>
                  <span className="text-xs font-bold text-[#6F687A] bg-white px-2 py-0.5 rounded-full shadow-xs">
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards in this Stage */}
                <div className="space-y-2.5 flex-1">
                  {stageCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, cand.id)}
                      onClick={() => onSelectCandidate(cand)}
                      className="bg-white p-3 rounded-xl border border-[#E8E3EF] shadow-xs hover:shadow-md hover:border-[#B29CFE] transition-all cursor-grab active:cursor-grabbing group"
                    >
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                          style={{ backgroundColor: cand.avatarBg }}
                        >
                          {getInitials(cand.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#2C1B57] truncate group-hover:text-[#42326E]">
                            {cand.name}
                          </div>
                          <div className="text-[10px] text-[#6F687A] truncate">
                            {cand.role}
                          </div>
                        </div>
                      </div>

                      {/* Location & Experience tags */}
                      <div className="flex items-center gap-1.5 text-[10px] text-[#49454F] mb-2.5 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded">
                          {cand.location.split(',')[0]}
                        </span>
                        <span className="px-1.5 py-0.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded">
                          {cand.skills[0]}
                        </span>
                      </div>

                      {/* Footer with Verification & Date */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#EFEAF6] text-[10px]">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                        <span className="text-[#6F687A]">{cand.appliedDate}</span>
                      </div>

                      {/* Quick stage mover action */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 pt-1.5 flex items-center justify-between text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <button
                          onClick={() => onScheduleInterview(cand)}
                          className="text-[#42326E] font-bold hover:underline flex items-center gap-0.5"
                        >
                          <Calendar className="w-3 h-3" />
                          Interview
                        </button>
                        <select
                          value={cand.stage}
                          onChange={(e) =>
                            onMoveCandidateStage(cand.id, e.target.value as PipelineStage)
                          }
                          className="bg-[#FCFCF7] text-[10px] font-semibold text-[#49454F] border border-[#E8E3EF] rounded px-1.5 py-0.5"
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>
                              Move: {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {stageCandidates.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-black/10 rounded-xl flex items-center justify-center text-xs text-[#6F687A] italic text-center p-3">
                      Drop candidate here
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
