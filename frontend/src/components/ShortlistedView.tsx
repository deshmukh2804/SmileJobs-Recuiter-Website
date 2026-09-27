import React from 'react';
import { Candidate, AppRoute } from '../types';
import {
  Star,
  Calendar,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Briefcase,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface ShortlistedViewProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onOpenMessage: (candidate: Candidate) => void;
  onNavigate: (route: AppRoute) => void;
}

export const ShortlistedView: React.FC<ShortlistedViewProps> = ({
  candidates,
  onSelectCandidate,
  onScheduleInterview,
  onOpenMessage,
  onNavigate,
}) => {
  const shortlistedCandidates = candidates.filter(
    (c) => c.stage === 'Shortlisted' || c.bookmarked
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
            Shortlisted Candidates ({shortlistedCandidates.length})
          </h1>
          <p className="text-sm text-[#6F687A] mt-1">
            Pre-screened talent marked for immediate interview scheduling and team review.
          </p>
        </div>

        <button
          onClick={() => onNavigate('candidates')}
          className="px-4 py-2 bg-white border border-[#E8E3EF] hover:border-[#D7C8ED] text-xs font-bold text-[#2C1B57] rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          Add More from Candidate Pool →
        </button>
      </div>

      {shortlistedCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shortlistedCandidates.map((cand) => (
            <div
              key={cand.id}
              onClick={() => onSelectCandidate(cand)}
              className="bg-white p-6 rounded-3xl border border-[#E8E3EF] shadow-xs hover:shadow-lg hover:border-[#B29CFE] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                      style={{ backgroundColor: cand.avatarBg }}
                    >
                      {getInitials(cand.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-[#2C1B57] group-hover:text-[#42326E] transition-colors truncate flex items-center gap-1">
                        {cand.name}
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <div className="text-xs text-[#6F687A] truncate">{cand.role}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EDE6FA] text-[#42326E]">
                    {cand.matchScore}%
                  </span>
                </div>

                <p className="text-xs text-[#49454F] line-clamp-2 mb-4 leading-relaxed">
                  {cand.bio}
                </p>

                <div className="space-y-1 text-xs text-[#6F687A] mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#42326E]" />
                    <span>{cand.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#42326E]" />
                    <span>{cand.experienceYears} yrs experience • Currently at {cand.currentCompany}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {cand.skills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-semibold px-2 py-0.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded text-[#49454F]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="pt-4 border-t border-[#EFEAF6] flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onScheduleInterview(cand)}
                  className="flex-1 py-2 px-3 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Interview
                </button>
                <button
                  onClick={() => onOpenMessage(cand)}
                  className="flex-1 py-2 px-3 bg-white border border-[#E8E3EF] hover:border-[#D7C8ED] text-[#2C1B57] text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E8E3EF] p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EDE6FA] text-[#42326E] flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2C1B57]">
              No candidates shortlisted yet
            </h3>
            <p className="text-xs text-[#6F687A] mt-1 leading-relaxed">
              When you find promising candidates in the directory or pipeline, click "Shortlist" to bookmark them here for fast interview scheduling.
            </p>
          </div>
          <button
            onClick={() => onNavigate('candidates')}
            className="px-5 py-2.5 bg-[#42326E] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#322554] transition-all"
          >
            Explore candidate pool
          </button>
        </div>
      )}
    </div>
  );
};
