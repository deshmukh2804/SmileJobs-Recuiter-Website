import React from 'react';
import {
  TrendingUp,
  BarChart3,
  Clock,
  ShieldCheck,
  Users,
  CheckCircle,
  Award,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const funnelSteps = [
    { label: 'Applications', count: 1284, percentage: '100%' },
    { label: 'Screening Passed', count: 430, percentage: '33.5%' },
    { label: 'Shortlisted Pool', count: 142, percentage: '11.1%' },
    { label: 'Interviews Completed', count: 54, percentage: '4.2%' },
    { label: 'Offers Dispatched', count: 22, percentage: '1.7%' },
    { label: 'Offers Accepted / Hired', count: 18, percentage: '1.4%' },
  ];

  const deptVelocity = [
    { dept: 'Design', days: 16, status: 'Fastest' },
    { dept: 'Marketing', days: 14, status: 'Fastest' },
    { dept: 'Engineering', days: 22, status: 'On Target' },
    { dept: 'Product Management', days: 26, status: 'Moderate' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
          Recruitment Intelligence & Velocity
        </h1>
        <p className="text-sm text-[#6F687A] mt-1">
          Quantitative telemetry on candidate throughput, verification fidelity, and time-to-hire.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E8E3EF] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6F687A]">
            <span>Median Time-to-Offer</span>
            <Clock className="w-4 h-4 text-[#42326E]" />
          </div>
          <div className="text-3xl font-extrabold text-[#2C1B57] mt-2">18 Days</div>
          <div className="text-xs text-emerald-700 font-semibold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            4.2 days faster than industry average
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E3EF] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6F687A]">
            <span>Offer Acceptance Rate</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#2C1B57] mt-2">88.2%</div>
          <div className="text-xs text-[#6F687A] font-semibold mt-2">
            18 signed out of 22 extended offers
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E3EF] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6F687A]">
            <span>Verification Audit Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#2C1B57] mt-2">94.6%</div>
          <div className="text-xs text-emerald-700 font-semibold mt-2 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Zero falsified tenure incidents
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E3EF] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6F687A]">
            <span>Cost per Verified Hire</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#2C1B57] mt-2">₹12,400</div>
          <div className="text-xs text-emerald-700 font-semibold mt-2">
            62% reduction vs. traditional recruitment agency
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E3EF] shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-[#2C1B57]">
            Full Lifecycle Hiring Funnel
          </h2>
          <p className="text-xs text-[#6F687A]">
            Conversion benchmarks from first applicant receipt to signed employment contract.
          </p>
        </div>

        <div className="space-y-4">
          {funnelSteps.map((step, idx) => {
            const widthPct = Math.max(12, 100 - idx * 16);
            return (
              <div key={step.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2C1B57]">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#6F687A]">
                      {step.count.toLocaleString()} candidates
                    </span>
                    <span className="font-extrabold text-[#42326E] bg-[#EDE6FA] px-2 py-0.5 rounded-md text-[11px]">
                      {step.percentage}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#F7F4FA] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#E8E3EF]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#42326E] to-[#6E5B9A] transition-all duration-700"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom 2 breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Velocity by Department */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E3EF] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#2C1B57]">
            Velocity by Department (Days to Hire)
          </h3>
          <div className="divide-y divide-[#EFEAF6] text-xs">
            {deptVelocity.map((item) => (
              <div key={item.dept} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#2C1B57]">{item.dept}</div>
                  <div className="text-[11px] text-[#6F687A]">
                    Benchmarked over last 90 days
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-sm text-[#42326E]">
                    {item.days} days
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Candidate Source Attribution */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E3EF] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#2C1B57]">
            Candidate Source Attribution
          </h3>
          <div className="space-y-3 pt-2 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-[#2C1B57]">
                  Smile Jobs Verified Talent Directory
                </span>
                <span className="font-bold text-[#42326E]">54%</span>
              </div>
              <div className="w-full bg-[#EFEAF6] h-2 rounded-full overflow-hidden">
                <div className="bg-[#42326E] h-full" style={{ width: '54%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-[#2C1B57]">Direct Inbound Postings</span>
                <span className="font-bold text-[#42326E]">28%</span>
              </div>
              <div className="w-full bg-[#EFEAF6] h-2 rounded-full overflow-hidden">
                <div className="bg-[#6E5B9A] h-full" style={{ width: '28%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-[#2C1B57]">Team & Employee Referrals</span>
                <span className="font-bold text-[#42326E]">18%</span>
              </div>
              <div className="w-full bg-[#EFEAF6] h-2 rounded-full overflow-hidden">
                <div className="bg-[#B29CFE] h-full" style={{ width: '18%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
