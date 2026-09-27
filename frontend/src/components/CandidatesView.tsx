import React, { useState } from 'react';
import { Candidate, AppRoute } from '../types';
import {
  Search,
  ShieldCheck,
  Bookmark,
  CheckCircle2,
  Clock,
  MapPin,
  Briefcase,
  Star,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface CandidatesViewProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onBookmarkToggle: (candidateId: string) => void;
  onShortlistCandidate: (candidate: Candidate) => void;
  onOpenMessage: (candidate: Candidate) => void;
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({
  candidates,
  onSelectCandidate,
  onBookmarkToggle,
  onShortlistCandidate,
  onOpenMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('match');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);

  const filters = [
    { id: 'all', label: 'All candidates' },
    { id: 'verified', label: 'Verified only' },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'design', label: 'Design' },
    { id: 'engineering', label: 'Engineering' },
    { id: 'remote', label: 'Remote only' },
  ];

  const getFilteredCandidates = () => {
    let result = candidates.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedFilter === 'verified') {
        return c.verified.identity && c.verified.experience;
      }
      if (selectedFilter === 'shortlisted') {
        return c.stage === 'Shortlisted' || c.bookmarked;
      }
      if (selectedFilter === 'design') {
        return c.department === 'Design';
      }
      if (selectedFilter === 'engineering') {
        return c.department === 'Engineering' || c.department === 'Infrastructure';
      }
      if (selectedFilter === 'remote') {
        return c.location.toLowerCase().includes('remote');
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'match') return b.matchScore - a.matchScore;
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  };

  const filteredCandidates = getFilteredCandidates();
  const topCandidate = filteredCandidates[0];

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 3);
      setIsLoadingMore(false);
    }, 600);
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
      {/* Search Header Banner */}
      <div className="bg-[#2C1B57] text-white rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-xl space-y-4">
        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B29CFE] block mb-1">
            Talent Discovery Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Find your next great hire
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Every candidate is pre-authenticated with government identity, verified degree, and tenure audits.
          </p>
        </div>

        {/* Big Search Input */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-lg max-w-2xl">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-[#6F687A] ml-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by candidate name, skill, title, or city..."
              className="w-full py-2.5 px-3 text-sm text-[#29233A] focus:outline-hidden placeholder:text-[#6F687A]"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#6F687A] hover:text-[#2C1B57] px-2 self-center font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Ambient background blur */}
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-radial from-[#B29CFE]/25 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all shrink-0 ${
                selectedFilter === f.id
                  ? 'bg-[#2C1B57] text-white border-[#2C1B57] shadow-xs'
                  : 'bg-white text-[#49454F] border-[#E8E3EF] hover:border-[#B29CFE]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Count & Sort */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4 text-xs text-[#6F687A]">
          <span className="font-semibold whitespace-nowrap">
            <strong className="text-[#2C1B57]">{filteredCandidates.length}</strong> verified candidates match
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <label className="font-bold text-[#49454F]">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-[#E8E3EF] rounded-lg px-2.5 py-1 text-xs text-[#2C1B57] font-semibold focus:outline-hidden focus:border-[#42326E]"
            >
              <option value="match">Match Score (High to Low)</option>
              <option value="experience">Experience (High to Low)</option>
              <option value="name">Candidate Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Match Spotlight (if available and not heavily filtered away) */}
      {topCandidate && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-[#B29CFE] shadow-sm relative overflow-hidden">
          <span className="absolute top-0 right-8 bg-[#B29CFE] text-[#2C1B57] text-[11px] font-extrabold px-4 py-1 rounded-b-xl tracking-wider uppercase">
            Top Match Recommendation
          </span>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Avatar & Basic info */}
            <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div
                className="w-18 h-18 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0"
                style={{ backgroundColor: topCandidate.avatarBg }}
              >
                {getInitials(topCandidate.name)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    onClick={() => onSelectCandidate(topCandidate)}
                    className="text-xl font-extrabold text-[#2C1B57] hover:text-[#42326E] cursor-pointer"
                  >
                    {topCandidate.name}
                  </h3>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Audit Cleared
                  </span>
                </div>

                <p className="text-xs text-[#6F687A]">
                  {topCandidate.role} • {topCandidate.location} • {topCandidate.experienceYears} yrs experience • Currently at {topCandidate.currentCompany}
                </p>

                {/* Verification badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ID Verified
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Phone OTP
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Work History
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Degree Match
                  </span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {topCandidate.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 bg-[#F7F4FA] border border-[#E8E3EF] text-[#2C1B57] rounded-md text-xs font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Action & Match Score */}
            <div className="lg:col-span-4 flex flex-col justify-between p-4 bg-[#FCFCF7] rounded-2xl border border-[#E8E3EF] space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-[#2C1B57]">Overall Role Match</span>
                  <span className="font-extrabold text-base text-[#42326E]">
                    {topCandidate.matchScore}%
                  </span>
                </div>
                <div className="w-full bg-[#E8E3EF] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#6E5B9A] to-[#42326E] h-full rounded-full transition-all duration-700"
                    style={{ width: `${topCandidate.matchScore}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenMessage(topCandidate)}
                  className="flex-1 py-2 px-3 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Contact
                </button>
                <button
                  onClick={() => onShortlistCandidate(topCandidate)}
                  className="flex-1 py-2 px-3 bg-white border border-[#E8E3EF] hover:border-[#D7C8ED] text-[#2C1B57] text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  {topCandidate.stage === 'Shortlisted' ? 'Shortlisted ✓' : 'Shortlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCandidates.slice(0, visibleCount).map((cand) => (
          <div
            key={cand.id}
            onClick={() => onSelectCandidate(cand)}
            className="bg-white p-6 rounded-3xl border border-[#E8E3EF] shadow-xs hover:shadow-lg hover:border-[#B29CFE] transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
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

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmarkToggle(cand.id);
                  }}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    cand.bookmarked
                      ? 'bg-[#EDE6FA] border-[#B29CFE] text-[#42326E]'
                      : 'bg-white border-[#E8E3EF] text-[#6F687A] hover:text-[#2C1B57]'
                  }`}
                  aria-label="Bookmark candidate"
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${cand.bookmarked ? 'fill-current' : ''}`}
                  />
                </button>
              </div>

              {/* Verified checklist tags */}
              <div className="flex flex-wrap gap-1 mb-3 text-[10px]">
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> ID
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Phone
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Work
                </span>
                {cand.verified.education && (
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Degree
                  </span>
                )}
              </div>

              {/* Bio */}
              <p className="text-xs text-[#49454F] line-clamp-2 mb-4 leading-relaxed">
                {cand.bio}
              </p>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {cand.skills.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="text-[11px] font-semibold px-2 py-0.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded text-[#49454F]"
                  >
                    {s}
                  </span>
                ))}
                {cand.skills.length > 3 && (
                  <span className="text-[11px] font-semibold text-[#6F687A] px-1 py-0.5">
                    +{cand.skills.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-3 border-t border-[#EFEAF6] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#6F687A] flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {cand.location}
                </span>
                <span className="font-bold text-[#C58A3A]">
                  {cand.salaryExpected} exp.
                </span>
              </div>

              {/* Match bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#6F687A] mb-1">
                  <span>Match rating</span>
                  <span className="font-bold text-[#2C1B57]">{cand.matchScore}%</span>
                </div>
                <div className="w-full bg-[#EFEAF6] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#42326E] h-full rounded-full"
                    style={{ width: `${cand.matchScore}%` }}
                  />
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onShortlistCandidate(cand)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    cand.stage === 'Shortlisted'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-[#FCFCF7] border-[#E8E3EF] hover:border-[#D7C8ED] text-[#2C1B57]'
                  }`}
                >
                  {cand.stage === 'Shortlisted' ? 'Shortlisted ✓' : 'Shortlist'}
                </button>
                <button
                  onClick={() => onOpenMessage(cand)}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-[#42326E] hover:bg-[#322554] text-white transition-all text-center"
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton Loading State during load more */}
      {isLoadingMore && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-[#E8E3EF] space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl skeleton-shimmer" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-3/4 skeleton-shimmer rounded" />
                  <div className="h-2.5 w-1/2 skeleton-shimmer rounded" />
                </div>
              </div>
              <div className="h-8 w-full skeleton-shimmer rounded-lg" />
              <div className="h-4 w-5/6 skeleton-shimmer rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {visibleCount < filteredCandidates.length && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2.5 bg-white border border-[#E8E3EF] hover:border-[#B29CFE] text-xs font-bold text-[#2C1B57] rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading candidates...' : 'Load more candidates'}
          </button>
        </div>
      )}
    </div>
  );
};
