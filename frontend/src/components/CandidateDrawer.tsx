import React, { useState } from 'react';
import { Candidate, PipelineStage } from '../types';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Bookmark,
  Plus,
  Send,
  Building2,
  AlertCircle
} from 'lucide-react';

interface CandidateDrawerProps {
  candidate: Candidate | null;
  onClose: () => void;
  onStageChange: (candidateId: string, newStage: PipelineStage) => void;
  onBookmarkToggle: (candidateId: string) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onOpenMessage: (candidate: Candidate) => void;
  onAddNote: (candidateId: string, noteText: string) => void;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  candidate,
  onClose,
  onStageChange,
  onBookmarkToggle,
  onScheduleInterview,
  onOpenMessage,
  onAddNote,
}) => {
  const [newNote, setNewNote] = useState('');

  if (!candidate) return null;

  const stages: PipelineStage[] = [
    'Applied',
    'Screening',
    'Shortlisted',
    'Interview',
    'Selected',
    'Hired',
  ];

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(candidate.id, newNote.trim());
    setNewNote('');
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-6 bg-[#2C1B57] text-white sticky top-0 z-10 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#B29CFE] font-bold">
              Candidate Dossier
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onBookmarkToggle(candidate.id)}
                className={`p-2 rounded-lg border transition-colors ${
                  candidate.bookmarked
                    ? 'bg-[#B29CFE]/20 border-[#B29CFE] text-[#B29CFE]'
                    : 'bg-white/10 border-white/20 text-white/70 hover:text-white'
                }`}
                title={candidate.bookmarked ? 'Saved to shortlisted' : 'Save candidate'}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md shrink-0"
              style={{ backgroundColor: candidate.avatarBg }}
            >
              {getInitials(candidate.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold truncate text-white">{candidate.name}</h2>
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <p className="text-sm text-white/80 mt-0.5">{candidate.role}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {candidate.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {candidate.experienceYears} years exp
                </span>
                <span>•</span>
                <span className="text-[#E0D4FC] font-bold">
                  {candidate.matchScore}% Match
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={() => onScheduleInterview(candidate)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white text-[#2C1B57] hover:bg-[#FCFCF7] text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              Schedule Interview
            </button>
            <button
              onClick={() => onOpenMessage(candidate)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#42326E] text-white hover:bg-[#322554] border border-white/20 text-xs font-bold rounded-lg transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Message Candidate
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-6 flex-1 bg-[#FCFCF7]">
          {/* Stage Progression Selector */}
          <div className="bg-white p-4 rounded-xl border border-[#E8E3EF] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F687A] mb-2.5">
              Hiring Pipeline Stage
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F7F4FA] rounded-lg">
              {stages.map((stage) => {
                const isActive = candidate.stage === stage;
                return (
                  <button
                    key={stage}
                    onClick={() => onStageChange(candidate.id, stage)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-md transition-all truncate text-center ${
                      isActive
                        ? 'bg-[#2C1B57] text-white shadow-xs'
                        : 'text-[#49454F] hover:bg-white hover:text-[#2C1B57]'
                    }`}
                  >
                    {stage}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verification Protocol Breakdown */}
          <div className="bg-white p-4 rounded-xl border border-[#E8E3EF] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#2C1B57] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Credentials Audit
              </h3>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                100% Authentic
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#2C1B57]">Government ID</div>
                  <div className="text-[10px] text-[#6F687A]">Aadhaar / Passport</div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#2C1B57]">Phone Number</div>
                  <div className="text-[10px] text-[#6F687A]">OTP verified</div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#2C1B57]">Work Email</div>
                  <div className="text-[10px] text-[#6F687A]">Domain verified</div>
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                candidate.verified.experience
                  ? 'border-emerald-100 bg-emerald-50/40'
                  : 'border-amber-200 bg-amber-50/40'
              }`}>
                {candidate.verified.experience ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-[#2C1B57]">Work Tenure</div>
                  <div className="text-[10px] text-[#6F687A]">
                    {candidate.verified.experience ? 'PF / Payslip match' : 'In review'}
                  </div>
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                candidate.verified.education
                  ? 'border-emerald-100 bg-emerald-50/40'
                  : 'border-amber-200 bg-amber-50/40'
              }`}>
                {candidate.verified.education ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-[#2C1B57]">Degree / College</div>
                  <div className="text-[10px] text-[#6F687A]">
                    {candidate.verified.education ? 'Accredited match' : 'Self-declared'}
                  </div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-purple-100 bg-[#EDE6FA]/50 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#42326E] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#2C1B57]">Salary Target</div>
                  <div className="text-[10px] text-[#6F687A] font-semibold">{candidate.salaryExpected}</div>
                </div>
              </div>
            </div>
          </div>

          {/* About / Bio */}
          <div className="bg-white p-4 rounded-xl border border-[#E8E3EF] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F687A] mb-2">
              Candidate Summary
            </h3>
            <p className="text-sm text-[#49454F] leading-relaxed">{candidate.bio}</p>
          </div>

          {/* Skills & Competencies */}
          <div className="bg-white p-4 rounded-xl border border-[#E8E3EF] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F687A] mb-2.5">
              Verified Technical Competencies
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 bg-[#F7F4FA] border border-[#E8E3EF] rounded-md text-xs font-semibold text-[#2C1B57]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Career & Work History */}
          <div className="bg-white p-4 rounded-xl border border-[#E8E3EF] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F687A] mb-3">
              Employment Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EDE6FA] text-[#42326E] flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#2C1B57]">
                    {candidate.currentCompany}
                  </div>
                  <div className="text-xs text-[#6F687A]">
                    {candidate.role} • Current (2+ years)
                  </div>
                </div>
              </div>
              {candidate.previousCompanies.map((prev, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#2C1B57]">{prev}</div>
                    <div className="text-xs text-[#6F687A]">Previous Tenure</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EFEAF6] mt-4 pt-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#2C1B57]">{candidate.education}</div>
                <div className="text-xs text-[#6F687A]">Verified Institution</div>
              </div>
            </div>
          </div>

          {/* Direct Contact Info */}
          <div className="bg-white p-4 rounded-xl border border-[#E8E3EF] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F687A] mb-3">
              Direct Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2 bg-[#FCFCF7] rounded-lg border border-[#E8E3EF]">
                <Mail className="w-4 h-4 text-[#42326E] shrink-0" />
                <span className="font-semibold text-[#2C1B57] truncate">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#FCFCF7] rounded-lg border border-[#E8E3EF]">
                <Phone className="w-4 h-4 text-[#42326E] shrink-0" />
                <span className="font-semibold text-[#2C1B57] truncate">{candidate.phone}</span>
              </div>
            </div>
          </div>

          {/* Recruiter Internal Notes */}
          <div className="bg-white p-4 rounded-xl border border-[#E8E3EF] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F687A] mb-3 flex items-center justify-between">
              <span>Hiring Team Notes ({candidate.notes.length})</span>
            </h3>

            {candidate.notes.length > 0 ? (
              <div className="space-y-2 mb-3">
                {candidate.notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#F7F4FA] border border-[#EFEAF6] text-xs text-[#49454F] leading-relaxed"
                  >
                    {note}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6F687A] italic mb-3">
                No recruiter notes added yet. Add interview insights or feedback below.
              </p>
            )}

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add evaluation note or interview feedback..."
                className="flex-1 text-xs px-3 py-2 border border-[#E8E3EF] rounded-lg focus:outline-hidden focus:border-[#42326E] focus:ring-2 focus:ring-[#EDE6FA]"
              />
              <button
                type="submit"
                disabled={!newNote.trim()}
                className="px-3 py-2 bg-[#2C1B57] text-white text-xs font-bold rounded-lg hover:bg-[#322554] disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
