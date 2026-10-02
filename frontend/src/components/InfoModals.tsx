import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Send, Mail, MapPin, Phone } from 'lucide-react';

interface InfoModalProps {
  type: 'privacy' | 'terms' | 'contact' | null;
  onClose: () => void;
  onSubmitContact?: (data: { name: string; email: string; message: string }) => void;
}

export const InfoModals: React.FC<InfoModalProps> = ({
  type,
  onClose,
  onSubmitContact,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!type) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    if (onSubmitContact) {
      onSubmitContact({ name, email, message });
    }
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8E3EF] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <div className="p-5 bg-[#2C1B57] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {type === 'privacy' && <ShieldCheck className="w-5 h-5 text-[#B29CFE]" />}
            {type === 'terms' && <FileText className="w-5 h-5 text-[#B29CFE]" />}
            {type === 'contact' && <Mail className="w-5 h-5 text-[#B29CFE]" />}
            <h2 className="text-base font-bold capitalize">
              {type === 'privacy' && 'Privacy Policy & Data Security'}
              {type === 'terms' && 'Terms of Service & Recruiter Agreement'}
              {type === 'contact' && 'Contact Smile Jobs Talent Support'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto text-xs leading-relaxed text-[#49454F] space-y-4 bg-[#FCFCF7]">
          {type === 'privacy' && (
            <>
              <p className="font-semibold text-sm text-[#2C1B57]">
                Your candidate privacy and enterprise hiring data are safeguarded.
              </p>
              <p>
                Smile Jobs complies with ISO 27001 data protection standards, SOC2 Type II audit guidelines, and Indian Digital Personal Data Protection (DPDP) Act compliance.
              </p>
              <h4 className="font-bold text-[#2C1B57] text-xs uppercase tracking-wider">
                1. Candidate Identity Verification
              </h4>
              <p>
                All government identification files, salary slips, and educational proofs are encrypted with AES-256 at rest. PII data is masked during initial discovery until candidates consent to an interview.
              </p>
              <h4 className="font-bold text-[#2C1B57] text-xs uppercase tracking-wider">
                2. Recruiter & Job Data
              </h4>
              <p>
                Employer profiles, job postings, salary figures, and applicant notes belong strictly to your company account and will never be resold to third-party ad networks.
              </p>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800">
                <span className="font-bold">Zero Data Leakage Guarantee:</span> We do not train external LLM models on private candidate resumes or confidential compensation figures.
              </div>
            </>
          )}

          {type === 'terms' && (
            <>
              <p className="font-semibold text-sm text-[#2C1B57]">
                Terms of Service for Employers & Job Seekers
              </p>
              <p>
                By using Smile Jobs, you agree to fair recruitment practices, verified communication channels, and ethical hiring workflows.
              </p>
              <h4 className="font-bold text-[#2C1B57] text-xs uppercase tracking-wider">
                1. Accuracy of Job Listings
              </h4>
              <p>
                Employers agree to publish legitimate vacancies with truthful compensation disclosures, job locations, and verified company domains.
              </p>
              <h4 className="font-bold text-[#2C1B57] text-xs uppercase tracking-wider">
                2. Verified Candidate Conduct
              </h4>
              <p>
                Candidate credentials are systematically authenticated against national databases and past employers. Any misrepresentation results in account termination.
              </p>
              <h4 className="font-bold text-[#2C1B57] text-xs uppercase tracking-wider">
                3. Platform Fair Use
              </h4>
              <p>
                Automated scraping of candidate phone numbers or mass spam outreach is strictly prohibited and subject to immediate workspace suspension.
              </p>
            </>
          )}

          {type === 'contact' && (
            <>
              {sent ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#2C1B57]">Inquiry Dispatched!</h3>
                  <p className="text-xs text-[#6F687A]">
                    Our talent onboarding team will reach back out within 2 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3 text-xs text-[#6F687A] pb-2 border-b border-[#E8E3EF]">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#42326E]" />
                      <span>Use the contact form below</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#42326E]" />
                      <span>Arera Colony, Bhopal</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Bhavuk Deshmukh"
                      className="w-full text-xs py-2 px-3 bg-white border border-[#E8E3EF] rounded-lg focus:outline-hidden focus:border-[#42326E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="bhavuk@company.com"
                      className="w-full text-xs py-2 px-3 bg-white border border-[#E8E3EF] rounded-lg focus:outline-hidden focus:border-[#42326E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-1">
                      Message / Hiring Query
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="How can our verification specialists assist your hiring goals?"
                      className="w-full text-xs py-2 px-3 bg-white border border-[#E8E3EF] rounded-lg focus:outline-hidden focus:border-[#42326E]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-[#49454F] hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-[#42326E] hover:bg-[#322554] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Inquiry
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
