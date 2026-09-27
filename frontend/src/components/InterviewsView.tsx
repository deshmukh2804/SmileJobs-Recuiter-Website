import React, { useState } from 'react';
import { Interview, Candidate, AppRoute } from '../types';
import {
  Calendar,
  Clock,
  Video,
  User,
  ExternalLink,
  Plus,
  CheckCircle,
  XCircle,
  Copy,
  Building,
} from 'lucide-react';

interface InterviewsViewProps {
  interviews: Interview[];
  candidates: Candidate[];
  onOpenScheduleModal: (candidate?: Candidate) => void;
  onUpdateStatus: (interviewId: string, status: Interview['status']) => void;
  onNavigate: (route: AppRoute) => void;
  onShowToast: (msg: string) => void;
}

export const InterviewsView: React.FC<InterviewsViewProps> = ({
  interviews,
  candidates,
  onOpenScheduleModal,
  onUpdateStatus,
  onNavigate,
  onShowToast,
}) => {
  const [filterFormat, setFilterFormat] = useState<string>('all');

  const filteredInterviews = interviews.filter((item) => {
    if (filterFormat === 'all') return true;
    return item.format.toLowerCase() === filterFormat.toLowerCase();
  });

  const handleCopyLink = (link: string) => {
    navigator.clipboard?.writeText(link);
    onShowToast('Meeting link copied to clipboard!');
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
            Interview Schedule ({interviews.length})
          </h1>
          <p className="text-sm text-[#6F687A] mt-1">
            Track scheduled sessions, meeting coordinates, and interviewer feedback.
          </p>
        </div>

        <button
          onClick={() => onOpenScheduleModal()}
          className="px-4 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule Interview
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'Google Meet', 'Zoom', 'In-person'].map((fmt) => (
          <button
            key={fmt}
            onClick={() => setFilterFormat(fmt)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all capitalize shrink-0 ${
              filterFormat === fmt
                ? 'bg-[#2C1B57] text-white border-[#2C1B57] shadow-xs'
                : 'bg-white text-[#49454F] border-[#E8E3EF] hover:border-[#B29CFE]'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Interviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInterviews.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-3xl border border-[#E8E3EF] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Header with Date & Format */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EFEAF6]">
                <span className="text-xs font-bold text-[#2C1B57] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#42326E]" />
                  {item.date}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    item.format === 'In-person'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {item.format}
                </span>
              </div>

              {/* Candidate Info */}
              <div className="mt-3">
                <h3 className="text-base font-extrabold text-[#2C1B57]">
                  {item.candidateName}
                </h3>
                <div className="text-xs text-[#6F687A] font-medium">{item.candidateRole}</div>
              </div>

              <div className="mt-3 space-y-2 text-xs text-[#49454F]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#42326E] shrink-0" />
                  <span className="font-semibold">{item.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#42326E] shrink-0" />
                  <span>Panel: {item.interviewer}</span>
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <div className="mt-3 p-2.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded-xl text-xs text-[#6F687A] leading-relaxed">
                  {item.notes}
                </div>
              )}
            </div>

            {/* Link & Status actions */}
            <div className="pt-3 border-t border-[#EFEAF6] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#6F687A] truncate max-w-[180px]">
                  {item.link}
                </span>
                <button
                  onClick={() => handleCopyLink(item.link)}
                  className="p-1 text-[#42326E] hover:text-[#2C1B57] font-bold inline-flex items-center gap-1 text-[11px]"
                  title="Copy link"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>

              <div className="flex items-center gap-2">
                {item.status === 'scheduled' ? (
                  <>
                    <button
                      onClick={() => onUpdateStatus(item.id, 'completed')}
                      className="flex-1 py-1.5 px-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[11px] font-bold rounded-lg border border-emerald-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Complete
                    </button>
                    <button
                      onClick={() => onUpdateStatus(item.id, 'cancelled')}
                      className="py-1.5 px-2 text-rose-700 hover:bg-rose-50 text-[11px] font-bold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F687A]">
                    Status: {item.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInterviews.length === 0 && (
        <div className="bg-white rounded-3xl border border-[#E8E3EF] p-12 text-center max-w-md mx-auto space-y-3">
          <Calendar className="w-12 h-12 text-[#B29CFE] mx-auto" />
          <h3 className="text-base font-bold text-[#2C1B57]">No interviews match filter</h3>
          <p className="text-xs text-[#6F687A]">
            Schedule an interview with a candidate from your Shortlisted or Pipeline list.
          </p>
        </div>
      )}
    </div>
  );
};
