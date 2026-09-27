import React, { useState } from 'react';
import {
  Bell,
  Shield,
  Users,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SettingsViewProps {
  onResetData: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onResetData,
  onShowToast,
}) => {
  const [autoVerify, setAutoVerify] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [candidateFeedbackReq, setCandidateFeedbackReq] = useState(true);
  const [anonymousScreening, setAnonymousScreening] = useState(false);

  const handleSavePreferences = () => {
    onShowToast('Settings and pipeline rules updated!');
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
          System & Recruiter Settings
        </h1>
        <p className="text-sm text-[#6F687A] mt-1">
          Configure hiring automation rules, verification sensitivity, and account preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Card 1: Pipeline Automation */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E3EF] shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-[#2C1B57] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#42326E]" />
            Pipeline & Verification Automation
          </h2>

          <div className="space-y-4 divide-y divide-[#EFEAF6] text-xs">
            <div className="pt-2 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#2C1B57]">
                  Automated Candidate Credential Audit
                </div>
                <div className="text-[#6F687A]">
                  Trigger Aadhaar, phone OTP, and work email verification on applicant arrival.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoVerify(!autoVerify)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  autoVerify ? 'bg-[#42326E]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    autoVerify ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#2C1B57]">
                  Instant Notification Dispatches
                </div>
                <div className="text-[#6F687A]">
                  Receive high-priority alerts for 90%+ match applicant submissions.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  emailAlerts ? 'bg-[#42326E]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    emailAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#2C1B57]">
                  Candidate Blind Review Mode
                </div>
                <div className="text-[#6F687A]">
                  Mask candidate names and photos during initial screening to eliminate unconscious bias.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnonymousScreening(!anonymousScreening)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  anonymousScreening ? 'bg-[#42326E]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    anonymousScreening ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E3EF] flex justify-end">
            <button
              onClick={handleSavePreferences}
              className="px-5 py-2 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Update Preferences
            </button>
          </div>
        </div>

        {/* Card 2: Hiring Team Members */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E3EF] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#2C1B57] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#42326E]" />
            Active Hiring Team (Workspace Access)
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FCFCF7] border border-[#E8E3EF]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2C1B57] text-white font-bold flex items-center justify-center text-xs">
                  BD
                </div>
                <div>
                  <div className="font-bold text-[#2C1B57]">Bhavuk Deshmukh (You)</div>
                  <div className="text-[11px] text-[#6F687A]">bhavukdeshmukh@gmail.com</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Workspace Admin
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FCFCF7] border border-[#E8E3EF]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#6E5B9A] text-white font-bold flex items-center justify-center text-xs">
                  TL
                </div>
                <div>
                  <div className="font-bold text-[#2C1B57]">Tech Lead Panel</div>
                  <div className="text-[11px] text-[#6F687A]">techlead@company.com</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Interviewer
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Reset Demonstration Data */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-rose-700 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            Reset Prototype Demonstration Data
          </h2>
          <p className="text-xs text-[#6F687A] leading-relaxed">
            Need to restore the initial candidate applications, jobs table, and Kanban pipeline state? This will repopulate initial sample data.
          </p>
          <button
            onClick={onResetData}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
          >
            Reset Seed Data
          </button>
        </div>
      </div>
    </div>
  );
};
