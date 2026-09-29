import React, { useState, useMemo } from 'react';
import { Candidate, CandidateFullDetails, AppRoute } from '../types';
import { candidateService } from '../services/candidateService';
import {
  Star,
  ShieldCheck,
  MapPin,
  Briefcase,
  ArrowRight,
  UserCheck,
  FileText,
  Eye,
  Download,
  ExternalLink,
  X,
  Loader2,
  Phone,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  GraduationCap,
  Languages,
  Package,
  Clock,
  Trash2,
  MessageSquare,
} from 'lucide-react';

interface ShortlistedViewProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onOpenMessage: (candidate: Candidate) => void;
  onNavigate: (route: AppRoute) => void;
}

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

export const ShortlistedView: React.FC<ShortlistedViewProps> = ({
  candidates,
  onNavigate,
}) => {
  const [selectedApp, setSelectedApp] = useState<CandidateFullDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const shortlistedCandidates = useMemo(
    () =>
      candidates.filter(
        (c) => c.stage === 'Shortlisted' || (c as any).status === 'Shortlisted' || c.bookmarked
      ),
    [candidates]
  );

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

  const handleAvatarError = (id: string) => {
    setAvatarErrors((prev) => new Set(prev).add(id));
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

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2C1B57] tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            Shortlisted ({shortlistedCandidates.length})
          </h1>
          <p className="text-xs text-[#6F687A] mt-0.5">
            Pre-screened talent marked for immediate interview scheduling.
          </p>
        </div>

        <button
          onClick={() => onNavigate('candidates')}
          className="px-4 py-2 bg-white border border-[#E8E3EF] hover:border-[#D7C8ED] text-xs font-bold text-[#2C1B57] rounded-xl shadow-xs transition-all self-start sm:self-auto flex items-center gap-1.5"
        >
          Browse Candidates
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {shortlistedCandidates.length > 0 ? (
        <div
          className={`grid gap-4 ${
            selectedApp || showMobileDetail
              ? 'grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)]'
              : 'grid-cols-1'
          }`}
        >
          {/* LEFT: LIST */}
          <div
            className={`space-y-3 ${
              selectedApp && showMobileDetail ? 'hidden xl:block' : 'block'
            } ${
              !selectedApp && !showMobileDetail
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0'
                : ''
            }`}
          >
            {shortlistedCandidates.map((cand) => {
              const status = (cand as any).status || cand.stage;
              const isSelected = selectedApp?._id === cand.id;
              const avatarUrl = (cand as any).avatarUrl;
              const showAvatarImage = avatarUrl && !avatarErrors.has(cand.id);

              return (
                <div
                  key={cand.id}
                  onClick={() => handleSelectCandidate(cand)}
                  className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#42326E] shadow-md ring-2 ring-[#EDE6FA]'
                      : 'border-[#E8E3EF] hover:border-[#B29CFE] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {showAvatarImage ? (
                        <img
                          src={avatarUrl}
                          alt={cand.name}
                          className="w-11 h-11 rounded-xl object-cover border border-[#E8E3EF] shrink-0"
                          onError={() => handleAvatarError(cand.id)}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                          style={{ backgroundColor: cand.avatarBg }}
                        >
                          {getInitials(cand.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-sm text-[#2C1B57] truncate flex items-center gap-1">
                          {cand.name}
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </div>
                        <div className="text-xs text-[#6F687A] truncate">{cand.role}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EDE6FA] text-[#42326E] shrink-0">
                      {cand.matchScore}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-md font-semibold border ${STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP.Applied}`}
                    >
                      {status}
                    </span>
                    {cand.bookmarked && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        ⭐ Bookmarked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#49454F] line-clamp-2 mb-3 leading-relaxed">
                    {cand.bio}
                  </p>

                  <div className="space-y-1 text-xs text-[#6F687A] mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#42326E] shrink-0" />
                      <span className="truncate">{cand.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#42326E] shrink-0" />
                      <span className="truncate">
                        {cand.experienceYears} yrs • {cand.currentCompany}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {cand.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-semibold px-2 py-0.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded text-[#49454F]"
                      >
                        {s}
                      </span>
                    ))}
                    {cand.skills.length > 3 && (
                      <span className="text-[11px] font-semibold text-[#6F687A] px-1">
                        +{cand.skills.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Resume Preview Card */}
                  {(cand as any).resumeUrl && (
                    <div
                      className="mb-3 flex items-center gap-2 p-2 bg-rose-50/50 border border-rose-100 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-[11px] font-semibold text-[#2C1B57] truncate flex-1">
                        {(cand as any).resumeFileName || 'Resume.pdf'}
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleSelectCandidate(cand);
                          setShowResumeModal(true);
                        }}
                        className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 shrink-0"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </div>
                  )}

                  {/* Action Buttons — ONLY CALL & WHATSAPP */}
                  {cand.phone && (
                    <div
                      className="pt-3 border-t border-[#EFEAF6] grid grid-cols-2 gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={`tel:${cand.phone}`}
                        className="py-2 px-3 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${cand.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT: DETAIL PANEL */}
          {(selectedApp || loadingDetails) && (
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
                  {/* Sticky Header */}
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
                        </p>
                        <p className="text-[9px] text-[#9C94A7] mt-0.5">
                          ID: <code>{shortId(selectedApp._id)}</code>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedApp(null);
                        setShowMobileDetail(false);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-[#F8F5FF] flex items-center justify-center text-[#6F687A] hover:text-[#2C1B57]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {/* QUICK CONTACT — ONLY CALL & WHATSAPP */}
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

                    {/* ⭐ RESUME SECTION - VIEW/DOWNLOAD/OPEN */}
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

                    {/* Contact Info */}
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

                    {/* Job Info */}
                    <section className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3">
                      <h3 className="font-bold text-[10px] text-[#2C1B57] flex items-center gap-1 mb-2 uppercase tracking-wider">
                        <Briefcase className="w-3 h-3 text-blue-600" /> Applied For
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
                        <span className="truncate">📍 {selectedApp.jobLocation}</span>
                        <span className="truncate">💰 {selectedApp.jobSalary}</span>
                      </div>
                    </section>

                    {/* Experience + Education */}
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
                            <InfoRow
                              label="End Year"
                              value={selectedApp.candidateEducation.endYear}
                            />
                          </div>
                        ) : (
                          <p className="text-[10px] text-[#9C94A7] italic">
                            No education details
                          </p>
                        )}
                      </section>
                    </div>

                    {/* Skills */}
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

                    {/* Languages / Assets / Certifications */}
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

                    {/* Cover Note */}
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

                    {/* Timeline */}
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
                                {m.time && (
                                  <p className="text-[9px] text-[#9C94A7]">{m.time}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Delete */}
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

      {/* RESUME PREVIEW MODAL */}
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

      {/* Toast */}
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

// HELPERS
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