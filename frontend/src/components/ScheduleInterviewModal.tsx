import React, { useState } from 'react';
import { Candidate, Interview } from '../types';
import { X, Calendar, Clock, Video, User, FileText, Check } from 'lucide-react';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onConfirm: (interview: Omit<Interview, 'id'>) => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  candidate,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !candidate) return null;

  const [date, setDate] = useState('2026-09-25');
  const [time, setTime] = useState('02:00 PM - 03:00 PM');
  const [format, setFormat] = useState<'Google Meet' | 'Zoom' | 'In-person' | 'Phone Screen'>('Google Meet');
  const [interviewer, setInterviewer] = useState('Bhavuk Deshmukh & Hiring Manager');
  const [link, setLink] = useState('https://meet.google.com/vrh-team-sync');
  const [notes, setNotes] = useState(`Technical competency and cultural alignment interview for ${candidate.role}.`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateRole: candidate.role,
      date,
      time,
      format,
      interviewer,
      link,
      notes,
      status: 'scheduled',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8E3EF] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-[#2C1B57] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#B29CFE]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Schedule Interview</h2>
              <p className="text-xs text-white/70">
                with {candidate.name} • {candidate.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#FCFCF7]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#49454F] mb-1">
                Interview Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full text-xs py-2 px-3 bg-white border border-[#E8E3EF] rounded-lg focus:outline-hidden focus:border-[#42326E] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#49454F] mb-1">
                Time Window
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-[#E8E3EF] rounded-lg focus:outline-hidden focus:border-[#42326E] font-medium"
              >
                <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                <option value="03:30 PM - 04:30 PM">03:30 PM - 04:30 PM</option>
                <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#49454F] mb-1">
              Interview Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Google Meet', 'Zoom', 'In-person', 'Phone Screen'] as const).map((fmt) => (
                <button
                  type="button"
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    format === fmt
                      ? 'bg-[#2C1B57] text-white border-[#2C1B57] shadow-xs'
                      : 'bg-white text-[#49454F] border-[#E8E3EF] hover:border-[#B29CFE]'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#49454F] mb-1">
              Interview Panel / Interviewers
            </label>
            <div className="relative">
              <input
                type="text"
                value={interviewer}
                onChange={(e) => setInterviewer(e.target.value)}
                required
                placeholder="e.g. Bhavuk Deshmukh & Lead Engineer"
                className="w-full text-xs py-2 px-3 bg-white border border-[#E8E3EF] rounded-lg focus:outline-hidden focus:border-[#42326E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#49454F] mb-1">
              Meeting URL or Office Location
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
              placeholder="https://meet.google.com/..."
              className="w-full text-xs py-2 px-3 bg-white border border-[#E8E3EF] rounded-lg focus:outline-hidden focus:border-[#42326E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#49454F] mb-1">
              Interview Focus & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key evaluation goals, portfolio topics, etc."
              className="w-full text-xs py-2 px-3 bg-white border border-[#E8E3EF] rounded-lg focus:outline-hidden focus:border-[#42326E]"
            />
          </div>

          <div className="pt-2 border-t border-[#E8E3EF] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#49454F] hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#42326E] hover:bg-[#322554] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Confirm & Dispatch Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
