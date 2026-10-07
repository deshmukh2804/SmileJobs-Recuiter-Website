import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  CompanyProfile,
  VerificationDocument,
  CompanyVerificationStatus,
  AuthUser,
  GalleryImage,
} from '../types';
import { companyService } from '../services/companyService';
import { authService } from '../services/authService';
import {
  Save,
  X,
  FileText,
  Upload,
  ShieldCheck,
  Clock,
  AlertCircle,
  Trash2,
  Loader2,
  Send,
  Sparkles,
  FileCheck2,
  BadgeCheck,
  XCircle,
  ImagePlus,
  Camera,
  CheckCircle2,
  Info,
  Building2,
  User,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Hash,
  Briefcase,
  Heart,
  ChevronDown,
  Eye,
  Shield,
  Star,
  Zap,
  TrendingUp,
  Award,
  ArrowRight,
  Search,
  ChevronUp,
} from 'lucide-react';

const MAX_GALLERY = 5;
const REQUIRED_DOCS = 4;

const LIMITS = {
  companyName: { min: 2, max: 100 },
  industry: { min: 2, max: 60 },
  tagline: { min: 0, max: 150 },
  headquarters: { min: 0, max: 80 },
  website: { min: 0, max: 200 },
  organizationSize: { min: 0, max: 30 },
  address: { min: 0, max: 200 },
  city: { min: 2, max: 50 },
  state: { min: 2, max: 50 },
  country: { min: 2, max: 50 },
  about: { min: 5, max: 2000, minWords: 1 },
  perk: { min: 2, max: 50 },
  contactName: { min: 2, max: 80 },
  designation: { min: 2, max: 60 },
  email: { min: 5, max: 100 },
  phone: { min: 10, max: 15 },
  whatsapp: { min: 10, max: 15 },
  linkedIn: { min: 0, max: 200 },
  gstNumber: { min: 15, max: 15 },
  panNumber: { min: 10, max: 10 },
  tanNumber: { min: 10, max: 10 },
  establishedYear: { min: 4, max: 4 },
} as const;

// ═══════════════════════════════════════════════════════
// INDIAN STATES LIST
// ═══════════════════════════════════════════════════════
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// ═══════════════════════════════════════════════════════
// INDUSTRY LIST
// ═══════════════════════════════════════════════════════
const INDUSTRIES = [
  'Information Technology (IT)', 'Software Development', 'IT Services & Consulting',
  'Artificial Intelligence / ML', 'Data Science & Analytics', 'Cybersecurity',
  'Cloud Computing', 'SaaS / Product', 'E-Commerce', 'FinTech',
  'EdTech', 'HealthTech', 'AgriTech', 'PropTech', 'InsurTech',
  'Banking & Financial Services', 'Insurance', 'Accounting & Tax',
  'Healthcare & Hospitals', 'Pharmaceuticals', 'Biotechnology',
  'Manufacturing', 'Automotive', 'Aerospace & Defense',
  'Textiles & Apparel', 'FMCG / Consumer Goods', 'Food & Beverage',
  'Retail & Wholesale', 'Real Estate & Construction', 'Architecture & Interior Design',
  'Logistics & Supply Chain', 'Transportation', 'Shipping & Marine',
  'Telecom', 'Media & Entertainment', 'Advertising & Marketing',
  'Digital Marketing', 'Publishing & Content', 'Gaming',
  'Education & Training', 'Legal Services', 'HR & Recruitment',
  'Management Consulting', 'Event Management',
  'Energy & Utilities', 'Oil & Gas', 'Renewable Energy / CleanTech',
  'Mining & Metals', 'Agriculture & Farming', 'Dairy & Animal Husbandry',
  'Travel & Tourism', 'Hospitality & Hotels', 'Restaurant & Catering',
  'NGO / Non-Profit', 'Government / PSU', 'Defense & Military',
  'Sports & Fitness', 'Beauty & Wellness', 'Interior & Home Furnishing',
  'Printing & Packaging', 'Chemicals & Petrochemicals',
  'Electronics & Semiconductors', 'Robotics & Automation', 'IoT',
  'Freelance / Gig Economy Platform', 'Startup (General)', 'Other',
];

// ═══════════════════════════════════════════════════════
// COMPANY TYPES
// ═══════════════════════════════════════════════════════
const COMPANY_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship', desc: 'Single owner business' },
  { value: 'partnership', label: 'Partnership Firm', desc: 'Registered under Partnership Act' },
  { value: 'llp', label: 'LLP (Limited Liability Partnership)', desc: 'Hybrid corporate structure' },
  { value: 'private_limited', label: 'Private Limited Company', desc: 'Pvt Ltd under Companies Act' },
  { value: 'public_limited', label: 'Public Limited Company', desc: 'Listed or unlisted public company' },
  { value: 'opc', label: 'One Person Company (OPC)', desc: 'Single member company' },
  { value: 'section_8', label: 'Section 8 Company (NGO)', desc: 'Non-profit under Companies Act' },
  { value: 'msme', label: 'MSME / Micro Enterprise', desc: 'Udyam registered enterprise' },
  { value: 'startup', label: 'Startup (DPIIT Registered)', desc: 'DPIIT recognized startup' },
  { value: 'huf', label: 'Hindu Undivided Family (HUF)', desc: 'Family business entity' },
  { value: 'trust', label: 'Trust / Society', desc: 'Registered trust or society' },
  { value: 'cooperative', label: 'Cooperative Society', desc: 'Cooperative under state act' },
  { value: 'other', label: 'Other', desc: 'Custom business type' },
];

// ═══════════════════════════════════════════════════════
// UPDATED DOCUMENT TYPES (4 required)
// ═══════════════════════════════════════════════════════
const DOC_TYPES = [
  {
    value: 'shop_act_msme',
    label: 'Shop Act / MSME Certificate',
    description: 'Shop & Establishment Act License or MSME/Udyam Registration Certificate',
    icon: Building2,
    required: true,
  },
  {
    value: 'gst_certificate',
    label: 'GST Certificate',
    description: 'GST Registration Certificate (GSTIN document)',
    icon: FileCheck2,
    required: true,
  },
  {
    value: 'pan_card',
    label: 'PAN Card',
    description: 'Permanent Account Number Card of the business',
    icon: Shield,
    required: true,
  },
  {
    value: 'tan_card',
    label: 'TAN Card',
    description: 'Tax Deduction and Collection Account Number (TAN) document',
    icon: FileText,
    required: true,
  },
];

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
const countWords = (text: string | null | undefined): number => {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).filter((w) => w.length > 0).length;
};

const isValidPhone = (phone: string) => /^[+]?[\d\s-]{10,15}$/.test(phone.replace(/\s/g, ''));
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidUrl = (url: string) => {
  if (!url) return true;
  try { new URL(url.startsWith('http') ? url : `https://${url}`); return true; } catch { return false; }
};
const isValidGST = (gst: string) => {
  if (!gst) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.toUpperCase());
};
const isValidPAN = (pan: string) => {
  if (!pan) return true;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
};
const isValidTAN = (tan: string) => {
  if (!tan) return true;
  return /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(tan.toUpperCase());
};

interface CompanyProfileViewProps {
  company: CompanyProfile;
  onUpdateCompany: (company: CompanyProfile) => void;
  onShowToast: (msg: string) => void;
  authUser?: AuthUser | null;
  onUpdateAuthUser?: (updates: Partial<AuthUser>) => void;
}

// ═══════════════════════════════════════════════════════
// SEARCHABLE DROPDOWN COMPONENT
// ═══════════════════════════════════════════════════════
const SearchableDropdown: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  required?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
  allowCustom?: boolean;
  hint?: string;
}> = ({ label, value, onChange, options, required, icon, placeholder, allowCustom = true, hint }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [touched, setTouched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [search, options]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isEmpty = touched && required && !value;

  return (
    <div ref={containerRef} className="relative">
      <label className="flex items-center gap-1.5 text-xs font-bold text-[#49454F] mb-1.5">
        {icon && <span className="text-[#6F687A]">{icon}</span>}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (allowCustom) onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch(value);
          }}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          className={`w-full text-xs py-2.5 px-3.5 pr-9 bg-[#FCFCF7] border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            isEmpty
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
              : value
                ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200'
                : 'border-[#E8E3EF] focus:border-[#42326E] focus:ring-[#B29CFE]/30'
          }`}
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) { setSearch(value); inputRef.current?.focus(); }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#6F687A]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#6F687A]" />}
        </button>
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#E8E3EF] rounded-xl shadow-xl max-h-48 overflow-y-auto scrollbar-thin">
          {filtered.map((option, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(option);
                setSearch('');
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#F7F4FA] transition-colors flex items-center gap-2 ${
                value === option ? 'bg-[#EDE6FA] text-[#42326E] font-bold' : 'text-[#49454F]'
              } ${idx === 0 ? 'rounded-t-xl' : ''} ${idx === filtered.length - 1 ? 'rounded-b-xl' : ''}`}
            >
              {value === option && <CheckCircle2 className="w-3.5 h-3.5 text-[#42326E] shrink-0" />}
              <span className="truncate">{option}</span>
            </button>
          ))}
        </div>
      )}

      {isEmpty && (
        <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> This field is required
        </p>
      )}
      {hint && !isEmpty && <p className="text-[10px] text-[#9C94A7] mt-1">{hint}</p>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// COMPANY TYPE SELECTOR
// ═══════════════════════════════════════════════════════
const CompanyTypeSelector: React.FC<{
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}> = ({ value, onChange, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedType = COMPANY_TYPES.find((t) => t.value === value);
  const isEmpty = touched && required && !value;

  return (
    <div ref={containerRef} className="relative">
      <label className="flex items-center gap-1.5 text-xs font-bold text-[#49454F] mb-1.5">
        <Building2 className="w-3.5 h-3.5 text-[#6F687A]" />
        Company Type
        {required && <span className="text-rose-500">*</span>}
      </label>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setTouched(true); }}
        className={`w-full text-left text-xs py-2.5 px-3.5 bg-[#FCFCF7] border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-between gap-2 ${
          isEmpty
            ? 'border-rose-300 focus:ring-rose-200'
            : value
              ? 'border-emerald-300 focus:ring-emerald-200'
              : 'border-[#E8E3EF] focus:ring-[#B29CFE]/30'
        }`}
      >
        <span className={value ? 'text-[#2C1B57] font-semibold' : 'text-[#9C94A7]'}>
          {selectedType ? selectedType.label : 'Select your company type...'}
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#6F687A]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#6F687A]" />}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#E8E3EF] rounded-2xl shadow-xl max-h-64 overflow-y-auto scrollbar-thin">
          {COMPANY_TYPES.map((type, idx) => (
            <button
              key={type.value}
              type="button"
              onClick={() => { onChange(type.value); setIsOpen(false); }}
              className={`w-full text-left px-4 py-3 hover:bg-[#F7F4FA] transition-colors border-b border-[#F3EFF8] last:border-0 ${
                value === type.value ? 'bg-[#EDE6FA]' : ''
              } ${idx === 0 ? 'rounded-t-2xl' : ''} ${idx === COMPANY_TYPES.length - 1 ? 'rounded-b-2xl' : ''}`}
            >
              <div className="flex items-center gap-2">
                {value === type.value && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <div>
                  <div className={`text-xs font-bold ${value === type.value ? 'text-[#42326E]' : 'text-[#2C1B57]'}`}>
                    {type.label}
                  </div>
                  <div className="text-[10px] text-[#9C94A7] mt-0.5">{type.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isEmpty && (
        <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Please select your company type
        </p>
      )}
      {!isEmpty && <p className="text-[10px] text-[#9C94A7] mt-1">Select the legal entity type of your organization</p>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// CHAR COUNTER
// ═══════════════════════════════════════════════════════
const CharCounter: React.FC<{ current: number; max: number; min?: number; label?: string }> = ({ current, max, min, label }) => {
  const isOver = current > max;
  const isUnder = min ? current < min && current > 0 : false;
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOver ? 'bg-rose-500' : isUnder ? 'bg-amber-400' : percentage > 80 ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono font-semibold tabular-nums ${isOver ? 'text-rose-600' : isUnder ? 'text-amber-600' : 'text-gray-400'}`}>
        {current}/{max}{label && ` ${label}`}
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// VALIDATED INPUT
// ═══════════════════════════════════════════════════════
const ValidatedInput: React.FC<{
  label: string; value: string; onChange: (val: string) => void; maxLength: number;
  minLength?: number; required?: boolean; type?: string; placeholder?: string;
  icon?: React.ReactNode; validator?: (val: string) => boolean; validationMsg?: string;
  hint?: string; disabled?: boolean; transform?: 'uppercase' | 'none';
}> = ({ label, value, onChange, maxLength, minLength, required, type = 'text', placeholder, icon, validator, validationMsg, hint, disabled, transform }) => {
  const [touched, setTouched] = useState(false);

  const isOverLimit = value.length > maxLength;
  const isUnderMin = touched && required && minLength ? value.length > 0 && value.length < minLength : false;
  const isEmpty = touched && required && value.length === 0;
  const isInvalid = touched && validator && value.length > 0 ? !validator(value) : false;
  const hasError = isOverLimit || isUnderMin || isEmpty || isInvalid;
  const isValid = touched && !hasError && value.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (transform === 'uppercase') val = val.toUpperCase();
    if (val.length <= maxLength + 5) onChange(val);
  };

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-[#49454F] mb-1.5">
        {icon && <span className="text-[#6F687A]">{icon}</span>}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={type} value={value} onChange={handleChange}
          onBlur={() => setTouched(true)} placeholder={placeholder} disabled={disabled}
          className={`w-full text-xs py-2.5 px-3.5 bg-[#FCFCF7] border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            hasError ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
            : isValid ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200'
            : 'border-[#E8E3EF] focus:border-[#42326E] focus:ring-[#B29CFE]/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {isValid && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
        )}
        {hasError && touched && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {isEmpty && <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> This field is required</p>}
          {isUnderMin && minLength && <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> Minimum {minLength} characters</p>}
          {isInvalid && validationMsg && <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {validationMsg}</p>}
          {isOverLimit && <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Exceeds maximum length</p>}
          {hint && !hasError && <p className="text-[10px] text-[#9C94A7] mt-1">{hint}</p>}
        </div>
        <CharCounter current={value.length} max={maxLength} min={minLength} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// SECTION COMPONENT
// ═══════════════════════════════════════════════════════
const Section: React.FC<{
  title: string; subtitle: string; icon: React.ReactNode; badge?: React.ReactNode;
  children: React.ReactNode; defaultOpen?: boolean;
  completionCount?: { done: number; total: number }; id?: string;
  hasErrors?: boolean;
}> = ({ title, subtitle, icon, badge, children, defaultOpen = true, completionCount, id, hasErrors }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className={`bg-white rounded-3xl border-2 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${
      hasErrors ? 'border-rose-200 shadow-rose-100/50' : completionCount?.done === completionCount?.total ? 'border-emerald-200' : 'border-[#E8E3EF]'
    }`}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 p-6 sm:p-8 text-left hover:bg-[#FDFCFE] transition-colors">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
          hasErrors ? 'bg-rose-100' : completionCount?.done === completionCount?.total ? 'bg-emerald-100' : 'bg-gradient-to-br from-[#EDE6FA] to-[#F7F4FA]'
        }`}>
          {hasErrors ? <AlertCircle className="w-5 h-5 text-rose-600" /> : completionCount?.done === completionCount?.total ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#2C1B57] flex items-center gap-2">{title}{badge}</h3>
          <p className="text-xs text-[#6F687A] mt-0.5">{subtitle}</p>
        </div>
        {completionCount && (
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${completionCount.done === completionCount.total ? 'bg-emerald-400' : hasErrors ? 'bg-rose-400' : 'bg-[#B29CFE]'}`}
                style={{ width: `${(completionCount.done / completionCount.total) * 100}%` }} />
            </div>
            <span className="text-[10px] font-bold text-[#6F687A] tabular-nums whitespace-nowrap">{completionCount.done}/{completionCount.total}</span>
          </div>
        )}
        <div className={`w-8 h-8 rounded-xl bg-[#F7F4FA] flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4 text-[#42326E]" />
        </div>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${open ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 space-y-5 border-t border-[#F3EFF8]">
          <div className="pt-5">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// VERIFICATION STEPPER
// ═══════════════════════════════════════════════════════
const VerificationStepper: React.FC<{ steps: { label: string; done: boolean; active: boolean }[] }> = ({ steps }) => (
  <div className="flex items-center gap-1 w-full">
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 ${
            step.done ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
            : step.active ? 'bg-[#42326E] text-white shadow-sm shadow-purple-200 ring-4 ring-[#B29CFE]/20'
            : 'bg-gray-100 text-gray-400'
          }`}>
            {step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-[9px] font-bold text-center leading-tight max-w-[60px] ${step.done ? 'text-emerald-600' : step.active ? 'text-[#42326E]' : 'text-gray-400'}`}>
            {step.label}
          </span>
        </div>
        {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded-full mb-4 transition-colors duration-300 ${step.done ? 'bg-emerald-300' : 'bg-gray-100'}`} />}
      </React.Fragment>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export const CompanyProfileView: React.FC<CompanyProfileViewProps> = ({
  company, onUpdateCompany, onShowToast, authUser, onUpdateAuthUser,
}) => {
  const [profile, setProfile] = useState<CompanyProfile>({
    ...company,
    contactPerson: company.contactPerson || { name: '', designation: '' },
    gallery: company.gallery || [],
    perks: company.perks || [],
  });
  const [newPerk, setNewPerk] = useState('');
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<CompanyVerificationStatus>(
    (authUser?.verificationStatus as CompanyVerificationStatus) || 'not_submitted'
  );
  const [rejectionReason, setRejectionReason] = useState<string>(authUser?.rejectionReason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequirementsChecklist, setShowRequirementsChecklist] = useState(false);

  const docFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const logoFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (company) {
      setProfile({
        ...company,
        contactPerson: company.contactPerson || { name: '', designation: '' },
        gallery: company.gallery || [],
        perks: company.perks || [],
      });
    }
  }, [company]);

  useEffect(() => {
    if (authUser?.verificationStatus) setVerificationStatus(authUser.verificationStatus as CompanyVerificationStatus);
    if (authUser?.rejectionReason !== undefined) setRejectionReason(authUser.rejectionReason || '');
  }, [authUser?.verificationStatus, authUser?.rejectionReason]);

  useEffect(() => {
    const load = async () => {
      if (!authService.isAuthenticated()) { setIsLoading(false); return; }
      try {
        const res = await companyService.getProfile();
        const data = res.data;
        if (data?.companyProfile) {
          const merged: CompanyProfile = {
            ...profile,
            ...data.companyProfile,
            contactPerson: data.companyProfile.contactPerson || { name: '', designation: '' },
            gallery: data.companyProfile.gallery || [],
            perks: data.companyProfile.perks || [],
          };
          setProfile(merged);
          onUpdateCompany(merged);
        }
        if (data?.verificationDocuments) setDocuments(data.verificationDocuments);
        if (data?.verificationStatus) setVerificationStatus(data.verificationStatus);
        if (data?.rejectionReason !== undefined) setRejectionReason(data.rejectionReason);
      } catch (err) {
        console.warn('Could not load company profile from API', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = useCallback((key: keyof CompanyProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setContactPerson = useCallback((key: 'name' | 'designation', value: string) => {
    setProfile((prev) => ({
      ...prev,
      contactPerson: { name: prev.contactPerson?.name || '', designation: prev.contactPerson?.designation || '', [key]: value },
    }));
  }, []);

  const isAboutValid = useCallback((text: string | null | undefined): boolean => {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (trimmed.length < LIMITS.about.min) return false;
    if (countWords(trimmed) < (LIMITS.about.minWords || 1)) return false;
    return true;
  }, []);

  const basicCompletion = useMemo(() => {
    let done = 0;
    const total = 7;
    if (profile.name && profile.name.length >= LIMITS.companyName.min) done++;
    if (profile.industry && profile.industry.length >= LIMITS.industry.min) done++;
    if (profile.city && profile.city.length >= LIMITS.city.min) done++;
    if (profile.state && profile.state.length >= LIMITS.state.min) done++;
    if (isAboutValid(profile.about)) done++;
    if (profile.logo?.url) done++;
    if (profile.companyType) done++;
    return { done, total };
  }, [profile.name, profile.industry, profile.city, profile.state, profile.about, profile.logo, profile.companyType, isAboutValid]);

  const contactCompletion = useMemo(() => {
    let done = 0;
    const total = 4;
    if (profile.contactPerson?.name && profile.contactPerson.name.length >= LIMITS.contactName.min) done++;
    if (profile.contactPerson?.designation && profile.contactPerson.designation.length >= LIMITS.designation.min) done++;
    if (profile.contactEmail && isValidEmail(profile.contactEmail)) done++;
    if (profile.contactPhone && isValidPhone(profile.contactPhone)) done++;
    return { done, total };
  }, [profile.contactPerson, profile.contactEmail, profile.contactPhone]);

  const legalCompletion = useMemo(() => {
    let done = 0;
    const total = 3;
    if (profile.gstNumber && isValidGST(profile.gstNumber)) done++;
    if (profile.panNumber && isValidPAN(profile.panNumber)) done++;
    if (profile.tanNumber && isValidTAN(profile.tanNumber)) done++;
    return { done, total };
  }, [profile.gstNumber, profile.panNumber, profile.tanNumber]);

  const docCompletion = useMemo(() => {
    const uploadedTypes = new Set(documents.map((d) => d.docType));
    const done = DOC_TYPES.filter((dt) => uploadedTypes.has(dt.value)).length;
    return { done, total: REQUIRED_DOCS };
  }, [documents]);

  const missingRequirements = useMemo(() => {
    const missing: { section: string; field: string; helpText: string; sectionId: string }[] = [];

    if (!profile.name || profile.name.length < LIMITS.companyName.min)
      missing.push({ section: 'Company Info', field: 'Company Name', helpText: `Enter at least ${LIMITS.companyName.min} characters`, sectionId: 'section-company' });
    if (!profile.industry || profile.industry.length < LIMITS.industry.min)
      missing.push({ section: 'Company Info', field: 'Industry', helpText: `Select or type your industry`, sectionId: 'section-company' });
    if (!profile.companyType)
      missing.push({ section: 'Company Info', field: 'Company Type', helpText: `Select your company's legal entity type`, sectionId: 'section-company' });
    if (!profile.city || profile.city.length < LIMITS.city.min)
      missing.push({ section: 'Company Info', field: 'City', helpText: `Enter at least ${LIMITS.city.min} characters`, sectionId: 'section-company' });
    if (!profile.state || profile.state.length < LIMITS.state.min)
      missing.push({ section: 'Company Info', field: 'State', helpText: `Select your state`, sectionId: 'section-company' });
    if (!isAboutValid(profile.about)) {
      const currentChars = (profile.about || '').trim().length;
      missing.push({ section: 'Company Info', field: 'About Description', helpText: `Need ${LIMITS.about.min}+ chars. Currently: ${currentChars}`, sectionId: 'section-company' });
    }
    if (!profile.logo?.url)
      missing.push({ section: 'Company Info', field: 'Company Logo', helpText: 'Upload a company logo image', sectionId: 'section-company' });

    if (!profile.contactPerson?.name || profile.contactPerson.name.length < LIMITS.contactName.min)
      missing.push({ section: 'Contact', field: 'Contact Person Name', helpText: `Enter at least ${LIMITS.contactName.min} characters`, sectionId: 'section-contact' });
    if (!profile.contactPerson?.designation || profile.contactPerson.designation.length < LIMITS.designation.min)
      missing.push({ section: 'Contact', field: 'Designation', helpText: `Enter at least ${LIMITS.designation.min} characters`, sectionId: 'section-contact' });
    if (!profile.contactEmail || !isValidEmail(profile.contactEmail))
      missing.push({ section: 'Contact', field: 'HR Email', helpText: 'Enter a valid email', sectionId: 'section-contact' });
    if (!profile.contactPhone || !isValidPhone(profile.contactPhone))
      missing.push({ section: 'Contact', field: 'Phone Number', helpText: 'Enter 10-15 digit phone', sectionId: 'section-contact' });

    if (!profile.gstNumber || !isValidGST(profile.gstNumber))
      missing.push({ section: 'Legal', field: 'GST Number', helpText: 'Enter valid 15-digit GSTIN', sectionId: 'section-legal' });
    if (!profile.panNumber || !isValidPAN(profile.panNumber))
      missing.push({ section: 'Legal', field: 'PAN Number', helpText: 'Enter valid 10-digit PAN', sectionId: 'section-legal' });
    if (!profile.tanNumber || !isValidTAN(profile.tanNumber))
      missing.push({ section: 'Legal', field: 'TAN Number', helpText: 'Enter valid 10-digit TAN', sectionId: 'section-legal' });

    const uploadedTypes = new Set(documents.map((d) => d.docType));
    DOC_TYPES.forEach((dt) => {
      if (!uploadedTypes.has(dt.value))
        missing.push({ section: 'Documents', field: dt.label, helpText: 'Upload this required document', sectionId: 'section-docs' });
    });

    return missing;
  }, [profile, documents, isAboutValid]);

  const overallReadiness = useMemo(() => {
    const allDone = missingRequirements.length === 0;
    const totalSteps = basicCompletion.total + contactCompletion.total + legalCompletion.total + docCompletion.total;
    const doneSteps = basicCompletion.done + contactCompletion.done + legalCompletion.done + docCompletion.done;
    return { allDone, percentage: Math.round((doneSteps / totalSteps) * 100), doneSteps, totalSteps };
  }, [missingRequirements, basicCompletion, contactCompletion, legalCompletion, docCompletion]);

  const stepperSteps = useMemo(() => [
    { label: 'Company Info', done: basicCompletion.done === basicCompletion.total, active: basicCompletion.done < basicCompletion.total },
    { label: 'Contact', done: contactCompletion.done === contactCompletion.total, active: basicCompletion.done === basicCompletion.total && contactCompletion.done < contactCompletion.total },
    { label: 'Legal', done: legalCompletion.done === legalCompletion.total, active: basicCompletion.done === basicCompletion.total && contactCompletion.done === contactCompletion.total && legalCompletion.done < legalCompletion.total },
    { label: 'Documents', done: docCompletion.done === docCompletion.total, active: basicCompletion.done === basicCompletion.total && contactCompletion.done === contactCompletion.total && legalCompletion.done === legalCompletion.total && docCompletion.done < docCompletion.total },
    { label: 'Submit', done: verificationStatus === 'approved', active: overallReadiness.allDone && (verificationStatus === 'not_submitted' || verificationStatus === 'rejected') },
  ], [basicCompletion, contactCompletion, legalCompletion, docCompletion, verificationStatus, overallReadiness]);

  // ═══ HANDLERS ═══
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    onUpdateCompany(profile);
    try {
      await companyService.updateProfile(profile);
      setSaveSuccess(true);
      onShowToast('✓ Company profile details saved successfully!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      onShowToast(err.response?.data?.message || 'Saved locally');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPerk = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPerk.trim();
    if (!trimmed || trimmed.length < LIMITS.perk.min) return;
    if ((profile.perks || []).length >= 12) { onShowToast('Maximum 12 perks allowed'); return; }
    if ((profile.perks || []).some((p) => p.toLowerCase() === trimmed.toLowerCase())) { onShowToast('Perk already exists'); return; }
    setProfile((p) => ({ ...p, perks: [...(p.perks || []), trimmed] }));
    setNewPerk('');
  }, [newPerk, profile.perks, onShowToast]);

  const handleRemovePerk = useCallback((i: number) => {
    setProfile((p) => ({ ...p, perks: (p.perks || []).filter((_, idx) => idx !== i) }));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { onShowToast('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { onShowToast('Logo size must not exceed 5MB'); return; }
    setIsUploadingLogo(true);
    try {
      const res = await companyService.uploadLogo(file);
      setProfile((p) => ({ ...p, logo: res.data.logo }));
      onShowToast('✓ Company logo uploaded');
    } catch (err: any) {
      onShowToast(err.response?.data?.message || 'Logo upload failed');
    } finally {
      setIsUploadingLogo(false);
      if (logoFileRef.current) logoFileRef.current.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const currentCount = profile.gallery?.length || 0;
    const availableSlots = MAX_GALLERY - currentCount;
    if (availableSlots <= 0) { onShowToast(`Gallery full. Max ${MAX_GALLERY} photos.`); if (galleryFileRef.current) galleryFileRef.current.value = ''; return; }
    const validFiles: File[] = [];
    files.forEach((file) => {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return;
      validFiles.push(file);
    });
    if (validFiles.length === 0) { if (galleryFileRef.current) galleryFileRef.current.value = ''; return; }
    const filesToUpload = validFiles.slice(0, availableSlots);
    setIsUploadingGallery(true);
    try {
      let res;
      if (filesToUpload.length > 1) res = await companyService.uploadGalleryImagesBatch(filesToUpload);
      else res = await companyService.uploadGalleryImage(filesToUpload[0]);
      setProfile((p) => ({ ...p, gallery: res.data.gallery }));
      const uploadedCount = res.data.uploaded ?? filesToUpload.length;
      const remaining = res.data.remaining ?? (MAX_GALLERY - (res.data.gallery?.length || 0));
      onShowToast(`✓ ${uploadedCount} photo${uploadedCount > 1 ? 's' : ''} uploaded • ${remaining} slot${remaining !== 1 ? 's' : ''} left`);
    } catch (err: any) {
      onShowToast(err.response?.data?.message || 'Gallery upload failed');
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileRef.current) galleryFileRef.current.value = '';
    }
  };

  const handleDeleteGallery = async (imageId?: string) => {
    if (!imageId) return;
    if (!confirm('Remove this photo from your gallery?')) return;
    try {
      const res = await companyService.deleteGalleryImage(imageId);
      setProfile((p) => ({ ...p, gallery: res.data.gallery }));
      onShowToast('✓ Photo deleted');
    } catch (err: any) {
      onShowToast(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleDocUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { onShowToast('File size must not exceed 5MB'); return; }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) { onShowToast('Only PDF, JPG, and PNG files accepted'); return; }
    setUploadingDocType(docType);
    try {
      const docConfig = DOC_TYPES.find((d) => d.value === docType);
      const label = docConfig?.label || 'Document';
      const res = await companyService.uploadDocument(file, docType, `${label} - ${file.name}`);
      setDocuments((prev) => { const filtered = prev.filter((d) => d.docType !== docType); return [...filtered, res.data.document]; });
      onShowToast(`✓ ${label} uploaded successfully`);
    } catch (err: any) {
      onShowToast(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingDocType(null);
      const ref = docFileRefs.current[docType];
      if (ref) ref.value = '';
    }
  };

  const handleDeleteDoc = async (id: string, docType: string) => {
    const docConfig = DOC_TYPES.find((d) => d.value === docType);
    if (!confirm(`Delete ${docConfig?.label || 'this document'}?`)) return;
    try {
      await companyService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      onShowToast('✓ Document deleted');
    } catch (err: any) {
      onShowToast(err.response?.data?.message || 'Failed to delete');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmitVerification = async () => {
    if (!overallReadiness.allDone) {
      setShowRequirementsChecklist(true);
      onShowToast(`⚠️ ${missingRequirements.length} required field(s) still missing.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsSubmitting(true);
    try {
      await companyService.updateProfile(profile);
      const res = await companyService.submitVerification();
      setVerificationStatus('pending');
      setRejectionReason('');
      authService.updateCachedUser({ verificationStatus: 'pending', verificationSubmittedAt: res.data.verificationSubmittedAt });
      onUpdateAuthUser?.({ verificationStatus: 'pending', verificationSubmittedAt: res.data.verificationSubmittedAt });
      onShowToast('🎉 Verification submitted! Review within 24-48 hours.');
      setShowRequirementsChecklist(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Submission failed';
      onShowToast(`❌ ${errorMsg}`);
      if (errorMsg.toLowerCase().includes('complete') || errorMsg.toLowerCase().includes('please')) setShowRequirementsChecklist(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoApprove = async () => {
    try {
      await companyService.autoApprove();
      setVerificationStatus('approved');
      setRejectionReason('');
      authService.updateCachedUser({ verificationStatus: 'approved', isVerified: true });
      onUpdateAuthUser?.({ verificationStatus: 'approved', isVerified: true });
      onShowToast('🎉 Company auto-verified! You can now post jobs.');
    } catch (err: any) {
      onShowToast(err.response?.data?.message || 'Auto-approve failed');
    }
  };

  const statusConfig = {
    not_submitted: { bg: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200', iconBg: 'bg-amber-100', icon: <AlertCircle className="w-5 h-5 text-amber-600" />, title: 'Verification Required', desc: 'Complete your profile and upload 4 required documents to get verified.', textColor: 'text-amber-900', descColor: 'text-amber-700' },
    pending: { bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200', iconBg: 'bg-blue-100', icon: <Clock className="w-5 h-5 text-blue-600 animate-pulse" />, title: 'Verification Under Review', desc: 'Our team is reviewing your documents. Usually takes 24-48 business hours.', textColor: 'text-blue-900', descColor: 'text-blue-700' },
    approved: { bg: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200', iconBg: 'bg-emerald-100', icon: <BadgeCheck className="w-5 h-5 text-emerald-600" />, title: 'Verified Trusted Company', desc: 'Your brand is verified. Job postings display the verified trust badge.', textColor: 'text-emerald-900', descColor: 'text-emerald-700' },
    rejected: { bg: 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200', iconBg: 'bg-rose-100', icon: <XCircle className="w-5 h-5 text-rose-600" />, title: 'Verification Rejected', desc: rejectionReason || 'Documents were not clear. Please review, update, and resubmit.', textColor: 'text-rose-900', descColor: 'text-rose-700' },
  };
  const cfg = statusConfig[verificationStatus];
  const galleryCount = profile.gallery?.length || 0;
  const aboutWordCount = countWords(profile.about);
  const aboutCharCount = (profile.about || '').trim().length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#42326E] mx-auto" />
          <p className="text-sm text-[#6F687A] font-medium">Loading profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-32">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-[#B29CFE]" /> Employer Brand
          </h1>
          <p className="text-sm text-[#6F687A] mt-1 max-w-lg">Build a comprehensive company profile to attract premium talent.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${overallReadiness.percentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#EDE6FA] text-[#42326E]'}`}>
            {overallReadiness.percentage === 100 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
            {overallReadiness.percentage}% Complete
          </div>
        </div>
      </div>

      {/* STEPPER */}
      {verificationStatus !== 'approved' && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E3EF] shadow-sm">
          <VerificationStepper steps={stepperSteps} />
        </div>
      )}

      {/* REQUIREMENTS CHECKLIST WITH NAVIGATION */}
      {showRequirementsChecklist && missingRequirements.length > 0 && verificationStatus !== 'approved' && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-200 rounded-3xl p-6 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-rose-600" /></div>
              <div>
                <h3 className="text-sm font-extrabold text-rose-900">{missingRequirements.length} Required Field{missingRequirements.length > 1 ? 's' : ''} Missing</h3>
                <p className="text-xs text-rose-700 mt-0.5">Click on any item to jump to that section</p>
              </div>
            </div>
            <button onClick={() => setShowRequirementsChecklist(false)} className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {missingRequirements.map((req, idx) => (
              <button key={idx} type="button" onClick={() => scrollToSection(req.sectionId)}
                className="flex items-start gap-3 p-3 bg-white rounded-xl border border-rose-100 text-xs hover:bg-rose-50 hover:border-rose-200 transition-all text-left w-full group">
                <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5"><X className="w-3 h-3 text-rose-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{req.section}</div>
                  <div className="text-xs font-bold text-[#2C1B57]">{req.field}</div>
                  <div className="text-[10px] text-[#6F687A] mt-0.5">{req.helpText}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STATUS BANNER */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 ${cfg.bg} flex items-start gap-4`}>
        <div className={`w-11 h-11 rounded-2xl ${cfg.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm ${cfg.textColor} flex items-center gap-2`}>
            {cfg.title}
            {verificationStatus === 'approved' && <span className="text-[10px] px-2.5 py-0.5 bg-emerald-600 text-white rounded-full font-extrabold tracking-wide shadow-sm">ACTIVE</span>}
            {verificationStatus === 'pending' && <span className="text-[10px] px-2.5 py-0.5 bg-blue-600 text-white rounded-full font-extrabold tracking-wide">PENDING REVIEW</span>}
          </div>
          <p className={`text-xs mt-1.5 leading-relaxed ${cfg.descColor}`}>{cfg.desc}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* ═══ SECTION: COMPANY INFO ═══ */}
        <Section id="section-company" title="Company Information" subtitle="Branding, type & core details" icon={<Building2 className="w-5 h-5 text-[#42326E]" />} completionCount={basicCompletion} defaultOpen={true}
          hasErrors={missingRequirements.some((m) => m.sectionId === 'section-company')}>

          {/* Logo */}
          <div className="flex items-center gap-5 pb-5 border-b border-[#F3EFF8]">
            <div className="relative group">
              {profile.logo?.url ? (
                <img src={profile.logo.url} alt="Logo" className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-[#E8E3EF] group-hover:border-[#B29CFE] transition-colors" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2C1B57] to-[#B29CFE] flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
                  {profile.companyInitials || (profile.name ? profile.name.slice(0, 2).toUpperCase() : 'CO')}
                </div>
              )}
              <button type="button" onClick={() => logoFileRef.current?.click()} disabled={isUploadingLogo}
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-[#42326E] hover:bg-[#322554] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input ref={logoFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoUpload} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#2C1B57] flex items-center gap-2">
                {profile.name || 'Your Company Name'}
                {verificationStatus === 'approved' && <BadgeCheck className="w-4 h-4 text-emerald-600" />}
              </h3>
              <p className="text-xs text-[#6F687A] mt-0.5">{profile.tagline || 'Add a tagline for your company'}</p>
              <p className="text-[10px] text-[#9C94A7] mt-1.5 flex items-center gap-1">
                {profile.logo?.url ? <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Logo uploaded</> : <><AlertCircle className="w-3 h-3 text-amber-500" /> Upload logo (JPG, PNG, WebP • Max 5MB)</>}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <ValidatedInput label="Company Name" value={profile.name || ''} onChange={(v) => updateField('name', v)} maxLength={LIMITS.companyName.max} minLength={LIMITS.companyName.min} required icon={<Building2 className="w-3.5 h-3.5" />} placeholder="Acme Corporation Pvt Ltd" />
            <SearchableDropdown label="Industry" value={profile.industry || ''} onChange={(v) => updateField('industry', v)} options={INDUSTRIES} required icon={<Briefcase className="w-3.5 h-3.5" />} placeholder="Search or type your industry..." allowCustom={true} hint="Select from list or type your own" />
          </div>

          {/* Company Type Selector */}
          <CompanyTypeSelector value={profile.companyType || ''} onChange={(v) => updateField('companyType', v)} required />

          <ValidatedInput label="Tagline / Short description" value={profile.tagline || ''} onChange={(v) => updateField('tagline', v)} maxLength={LIMITS.tagline.max} icon={<Star className="w-3.5 h-3.5" />} placeholder="AI-powered hiring infrastructure solutions" hint="Displayed with job listings" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ValidatedInput label="Headquarters" value={profile.headquarters || ''} onChange={(v) => updateField('headquarters', v)} maxLength={LIMITS.headquarters.max} icon={<MapPin className="w-3.5 h-3.5" />} placeholder="e.g. Mumbai, India" />
            <ValidatedInput label="Website URL" value={profile.website || ''} onChange={(v) => updateField('website', v)} maxLength={LIMITS.website.max} icon={<Globe className="w-3.5 h-3.5" />} placeholder="https://acme.org" type="url" validator={isValidUrl} validationMsg="Enter valid URL" />
            <ValidatedInput label="Organization Size" value={profile.organizationSize || profile.teamSize || ''} onChange={(v) => { updateField('organizationSize', v); updateField('teamSize', v); }} maxLength={LIMITS.organizationSize.max} icon={<User className="w-3.5 h-3.5" />} placeholder="e.g. 50-250 employees" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <ValidatedInput label="Address" value={profile.address || ''} onChange={(v) => updateField('address', v)} maxLength={LIMITS.address.max} placeholder="Office address" />
            <ValidatedInput label="City" value={profile.city || ''} onChange={(v) => updateField('city', v)} maxLength={LIMITS.city.max} minLength={LIMITS.city.min} required placeholder="e.g. Pune" />
            <SearchableDropdown label="State" value={profile.state || ''} onChange={(v) => updateField('state', v)} options={INDIAN_STATES} required icon={<MapPin className="w-3.5 h-3.5" />} placeholder="Search state..." allowCustom={true} />
            <ValidatedInput label="Country" value={profile.country || 'India'} onChange={(v) => updateField('country', v)} maxLength={LIMITS.country.max} minLength={LIMITS.country.min} placeholder="India" />
          </div>

          {/* About */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#49454F] mb-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6F687A]" /> About the Organization <span className="text-rose-500">*</span>
              <span className="text-[10px] font-normal text-[#9C94A7] ml-1">(min {LIMITS.about.min} chars)</span>
            </label>
            <textarea rows={5} value={profile.about || ''} onChange={(e) => { if (e.target.value.length <= LIMITS.about.max + 50) updateField('about', e.target.value); }}
              placeholder="Describe your company's mission, values, work culture, and why candidates would want to join you."
              className={`w-full text-xs py-2.5 px-3.5 bg-[#FCFCF7] border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 leading-relaxed transition-all duration-200 ${
                (profile.about?.length || 0) > LIMITS.about.max ? 'border-rose-300 focus:ring-rose-200'
                : isAboutValid(profile.about) ? 'border-emerald-300 focus:ring-emerald-200'
                : 'border-[#E8E3EF] focus:ring-[#B29CFE]/30'
              }`}
            />
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className={`text-[10px] font-semibold flex items-center gap-1 ${isAboutValid(profile.about) ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isAboutValid(profile.about) ? <><CheckCircle2 className="w-3 h-3" /> Valid! ({aboutWordCount} word{aboutWordCount !== 1 ? 's' : ''}, {aboutCharCount} chars)</> : <><Info className="w-3 h-3" /> {aboutWordCount} word{aboutWordCount !== 1 ? 's' : ''}, {aboutCharCount} chars{aboutCharCount < LIMITS.about.min && ` — need ${LIMITS.about.min - aboutCharCount} more`}</>}
              </span>
              <CharCounter current={profile.about?.length || 0} max={LIMITS.about.max} min={LIMITS.about.min} label="chars" />
            </div>
          </div>

          {/* Perks */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#49454F] mb-2">
              <Heart className="w-3.5 h-3.5 text-[#6F687A]" /> Cultural Perks & Benefits
              <span className="text-[10px] font-normal text-[#9C94A7] ml-1">({(profile.perks || []).length}/12)</span>
            </label>
            {(profile.perks || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {(profile.perks || []).map((perk, idx) => (
                  <span key={idx} className="group px-3 py-1.5 bg-gradient-to-r from-[#EDE6FA] to-[#F7F4FA] text-[#42326E] rounded-xl text-xs font-semibold flex items-center gap-2 border border-[#B29CFE]/20 hover:border-[#B29CFE]/50 transition-colors">
                    <Zap className="w-3 h-3 text-[#B29CFE]" />{perk}
                    <button type="button" onClick={() => handleRemovePerk(idx)} className="opacity-40 group-hover:opacity-100 hover:text-rose-600 transition-opacity"><X className="w-3.5 h-3.5" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input type="text" value={newPerk} onChange={(e) => { if (e.target.value.length <= LIMITS.perk.max) setNewPerk(e.target.value); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPerk(e); } }}
                  placeholder="e.g. Free Lunches, Health Insurance" className="w-full text-xs py-2.5 px-3.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded-xl focus:outline-none focus:border-[#42326E] focus:ring-2 focus:ring-[#B29CFE]/30"
                  disabled={(profile.perks || []).length >= 12} />
              </div>
              <button type="button" onClick={handleAddPerk} disabled={(profile.perks || []).length >= 12 || newPerk.trim().length < LIMITS.perk.min}
                className="px-4 py-2.5 bg-white border border-[#E8E3EF] hover:border-[#B29CFE] text-xs font-bold text-[#2C1B57] rounded-xl shadow-sm transition-colors disabled:opacity-40">Add</button>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION: GALLERY ═══ */}
        <Section title="Company Photos & Workspace" subtitle={`Upload workspace photos (${galleryCount}/${MAX_GALLERY})`} icon={<ImagePlus className="w-5 h-5 text-[#42326E]" />} defaultOpen={true}>
          <div className="p-6 bg-gradient-to-br from-[#FCFCF7] to-[#F7F4FA] border-2 border-dashed border-[#E8E3EF] hover:border-[#B29CFE] rounded-2xl transition-all flex flex-col items-center justify-center text-center gap-2 mb-4">
            <ImagePlus className="w-8 h-8 text-[#42326E] opacity-60" />
            <p className="text-xs font-bold text-[#2C1B57]">Upload Office Photos</p>
            <p className="text-[10px] text-[#6F687A]">Select up to 5 photos. JPG, PNG, WebP (max 5MB each)</p>
            <button type="button" onClick={() => galleryFileRef.current?.click()} disabled={isUploadingGallery || galleryCount >= MAX_GALLERY}
              className={`mt-2 px-4 py-2 bg-[#42326E] text-white text-[11px] font-bold rounded-xl shadow-sm hover:bg-[#322554] transition-colors flex items-center gap-1.5 ${galleryCount >= MAX_GALLERY ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {isUploadingGallery ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</> : <><Upload className="w-3.5 h-3.5" /> Choose Photos</>}
            </button>
            <input ref={galleryFileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleGalleryUpload} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {(profile.gallery || []).map((img: GalleryImage) => (
              <div key={img._id || img.publicId} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#E8E3EF] group hover:border-[#B29CFE] transition-colors shadow-sm">
                <img src={img.url} alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <button type="button" onClick={() => handleDeleteGallery(img._id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {galleryCount === 0 && (
            <div className="text-center py-6 text-xs text-[#9C94A7] bg-[#FCFCF7] rounded-2xl border border-dashed border-[#E8E3EF]">
              <Camera className="w-7 h-7 mx-auto mb-1.5 opacity-40 text-[#42326E]" /> No photos uploaded yet.
            </div>
          )}
        </Section>

        {/* ═══ SECTION: CONTACT ═══ */}
        <Section id="section-contact" title="Contact & Recruiter Details" subtitle="Identity displayed to job applicants" icon={<User className="w-5 h-5 text-[#42326E]" />} completionCount={contactCompletion} defaultOpen={true}
          hasErrors={missingRequirements.some((m) => m.sectionId === 'section-contact')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ValidatedInput label="Contact Person Name" value={profile.contactPerson?.name || ''} onChange={(v) => setContactPerson('name', v)} maxLength={LIMITS.contactName.max} minLength={LIMITS.contactName.min} required icon={<User className="w-3.5 h-3.5" />} placeholder="Rahul Dev" />
            <ValidatedInput label="Designation" value={profile.contactPerson?.designation || ''} onChange={(v) => setContactPerson('designation', v)} maxLength={LIMITS.designation.max} minLength={LIMITS.designation.min} required icon={<Award className="w-3.5 h-3.5" />} placeholder="Chief Talent Officer" />
            <ValidatedInput label="Official HR Email" value={profile.contactEmail || ''} onChange={(v) => updateField('contactEmail', v)} maxLength={LIMITS.email.max} minLength={LIMITS.email.min} required type="email" icon={<Mail className="w-3.5 h-3.5" />} placeholder="careers@acme.org" validator={isValidEmail} validationMsg="Enter a valid email" />
            <ValidatedInput label="Recruiter Phone" value={profile.contactPhone || ''} onChange={(v) => updateField('contactPhone', v.replace(/[^0-9+\-\s]/g, ''))} maxLength={LIMITS.phone.max} minLength={LIMITS.phone.min} required type="tel" icon={<Phone className="w-3.5 h-3.5" />} placeholder="+919876543210" validator={isValidPhone} validationMsg="10-15 digit phone number" />
            <ValidatedInput label="WhatsApp Number" value={profile.whatsappNumber || ''} onChange={(v) => updateField('whatsappNumber', v.replace(/[^0-9+\-\s]/g, ''))} maxLength={LIMITS.whatsapp.max} icon={<Phone className="w-3.5 h-3.5" />} placeholder="+919876543210" validator={(v) => !v || isValidPhone(v)} validationMsg="Valid phone number" hint="Optional — For candidate outreach" />
            <ValidatedInput label="LinkedIn Profile URL" value={profile.linkedInUrl || ''} onChange={(v) => updateField('linkedInUrl', v)} maxLength={LIMITS.linkedIn.max} type="url" icon={<Globe className="w-3.5 h-3.5" />} placeholder="https://linkedin.com/company/acme" validator={isValidUrl} validationMsg="Enter valid URL" hint="Optional — Builds brand trust" />
          </div>
        </Section>

        {/* ═══ SECTION: LEGAL ═══ */}
        <Section id="section-legal" title="Legal & Tax Details" subtitle="Required tax identifiers for verification" icon={<Shield className="w-5 h-5 text-[#42326E]" />} completionCount={legalCompletion} defaultOpen={true}
          hasErrors={missingRequirements.some((m) => m.sectionId === 'section-legal')}>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
            <p className="text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" /> All 3 tax identifiers (GST, PAN, TAN) are mandatory for verification
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ValidatedInput label="GST Number (GSTIN)" value={profile.gstNumber || ''} onChange={(v) => updateField('gstNumber', v)} maxLength={LIMITS.gstNumber.max} required icon={<FileCheck2 className="w-3.5 h-3.5" />} placeholder="27ABCDE1234F1Z5" transform="uppercase" validator={isValidGST} validationMsg="Enter valid 15-digit GSTIN" hint="e.g. 27ABCDE1234F1Z5" />
            <ValidatedInput label="Company PAN Number" value={profile.panNumber || ''} onChange={(v) => updateField('panNumber', v)} maxLength={LIMITS.panNumber.max} required icon={<Shield className="w-3.5 h-3.5" />} placeholder="ABCDE1234F" transform="uppercase" validator={isValidPAN} validationMsg="Enter valid 10-digit PAN" hint="e.g. ABCDE1234F" />
            <ValidatedInput label="TAN Number" value={profile.tanNumber || ''} onChange={(v) => updateField('tanNumber', v)} maxLength={LIMITS.tanNumber.max} required icon={<Hash className="w-3.5 h-3.5" />} placeholder="DELA12345F" transform="uppercase" validator={isValidTAN} validationMsg="Enter valid 10-digit TAN (4 letters + 5 digits + 1 letter)" hint="e.g. DELA12345F — Tax Deduction Account Number" />
            <ValidatedInput label="Established Year" value={String(profile.establishedYear || profile.foundedYear || '')} onChange={(v) => { const clean = v.replace(/\D/g, '').slice(0, 4); updateField('establishedYear', clean); updateField('foundedYear', clean); }} maxLength={LIMITS.establishedYear.max} icon={<Calendar className="w-3.5 h-3.5" />} placeholder="2018" validator={(v) => { if (!v) return true; const yr = parseInt(v); return v.length === 4 && yr >= 1800 && yr <= new Date().getFullYear(); }} validationMsg={`Valid year (1800-${new Date().getFullYear()})`} hint="Optional" />
          </div>
        </Section>

        {/* SAVE BAR */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-[#E8E3EF] shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#6F687A]">
            {saveSuccess ? <span className="flex items-center gap-1.5 text-emerald-600 font-extrabold animate-in fade-in"><CheckCircle2 className="w-4 h-4 animate-bounce" /> Profile Saved!</span>
            : <span className="flex items-center gap-1.5 font-semibold"><Info className="w-4 h-4 text-[#B29CFE]" /> Save before submitting for verification</span>}
          </div>
          <button type="submit" disabled={isSaving} className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all duration-200 ${isSaving ? 'bg-[#42326E]/70 cursor-wait' : saveSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#42326E] hover:bg-[#322554]'}`}>
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : saveSuccess ? <><CheckCircle2 className="w-4 h-4" /> Saved ✓</> : <><Save className="w-4 h-4" /> Save Profile</>}
          </button>
        </div>
      </form>

      {/* ═══ SECTION: DOCUMENTS ═══ */}
      <Section id="section-docs" title="Verification Documents" subtitle={`Upload all ${REQUIRED_DOCS} required documents`} icon={<FileCheck2 className="w-5 h-5 text-[#42326E]" />}
        badge={docCompletion.done === docCompletion.total ? <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-extrabold">COMPLETE</span> : <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-extrabold">INCOMPLETE</span>}
        completionCount={docCompletion} defaultOpen={true} hasErrors={missingRequirements.some((m) => m.sectionId === 'section-docs')}>
        <div className="space-y-3">
          {DOC_TYPES.map((docType) => {
            const uploaded = documents.find((d) => d.docType === docType.value);
            const isUploading = uploadingDocType === docType.value;
            const IconComponent = docType.icon;
            const canModify = verificationStatus === 'not_submitted' || verificationStatus === 'rejected';
            return (
              <div key={docType.value} className={`p-4 rounded-2xl border-2 transition-all duration-200 ${uploaded ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-[#FCFCF7] border-[#E8E3EF] hover:border-[#B29CFE]/40'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${uploaded ? 'bg-emerald-100' : 'bg-[#EDE6FA]'}`}>
                      {uploaded ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <IconComponent className="w-5 h-5 text-[#42326E]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#2C1B57] truncate">{docType.label}</h4>
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-extrabold tracking-wider shrink-0">REQUIRED</span>
                      </div>
                      <p className="text-[11px] text-[#6F687A] mt-0.5 truncate">
                        {uploaded ? <span className="text-emerald-600 font-semibold flex items-center gap-1"><FileCheck2 className="w-3.5 h-3.5 shrink-0" />{uploaded.docName}{uploaded.size ? ` • ${(uploaded.size / 1024).toFixed(0)} KB` : ''}</span> : docType.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {uploaded && <a href={uploaded.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-[11px] font-bold text-[#42326E] hover:bg-[#EDE6FA] rounded-lg flex items-center gap-1.5 transition-colors"><Eye className="w-3.5 h-3.5" /> View</a>}
                    {canModify && (
                      <div className="flex items-center gap-1.5">
                        {uploaded ? (
                          <>
                            <button type="button" onClick={() => docFileRefs.current[docType.value]?.click()} disabled={isUploading} className="px-3 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-1 transition-colors">
                              {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Replace
                            </button>
                            <button type="button" onClick={() => handleDeleteDoc(uploaded._id, docType.value)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        ) : (
                          <button type="button" onClick={() => docFileRefs.current[docType.value]?.click()} disabled={isUploading} className="px-4 py-2 bg-[#42326E] hover:bg-[#322554] text-white text-[11px] font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all">
                            {isUploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</> : <><Upload className="w-3.5 h-3.5" /> Choose File</>}
                          </button>
                        )}
                      </div>
                    )}
                    {!canModify && !uploaded && <span className="text-[10px] text-[#9C94A7] font-semibold italic">Locked</span>}
                  </div>
                  <input ref={(el) => { docFileRefs.current[docType.value] = el; }} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleDocUpload(docType.value, e)} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-[#F7F4FA] border border-[#E8E3EF] rounded-2xl">
          <h4 className="text-[11px] font-bold text-[#2C1B57] mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-[#B29CFE]" /> Document Guidelines</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-[#6F687A]">
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Accepted: PDF, JPEG, PNG</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Max 5MB per file</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Must be clear and readable</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> All 4 documents are mandatory</li>
          </ul>
        </div>
      </Section>

      {/* ═══ BOTTOM ACTION BAR ═══ */}
      {(verificationStatus === 'not_submitted' || verificationStatus === 'rejected') && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`p-4 rounded-3xl shadow-2xl border-2 backdrop-blur-md ${overallReadiness.allDone ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-300' : 'bg-white/95 border-[#E8E3EF]'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${overallReadiness.allDone ? 'bg-white/20' : 'bg-amber-100'}`}>
                {overallReadiness.allDone ? <Send className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-extrabold ${overallReadiness.allDone ? 'text-white' : 'text-[#2C1B57]'}`}>
                  {overallReadiness.allDone ? '🎉 Ready to Submit!' : `${missingRequirements.length} field${missingRequirements.length !== 1 ? 's' : ''} pending`}
                </div>
                <div className={`text-[10px] mt-0.5 ${overallReadiness.allDone ? 'text-white/90' : 'text-[#6F687A]'}`}>
                  {overallReadiness.allDone ? 'Click submit for admin review' : 'Complete required fields to submit'}
                </div>
              </div>
              <button type="button" onClick={handleSubmitVerification} disabled={isSubmitting}
                className={`px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0 ${
                  overallReadiness.allDone ? 'bg-white text-emerald-700 hover:bg-emerald-50' : 'bg-[#42326E] hover:bg-[#322554] text-white'
                } disabled:opacity-60`}>
                {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</> : <><Send className="w-3.5 h-3.5" />{overallReadiness.allDone ? 'Submit Now' : 'Submit'}<ArrowRight className="w-3 h-3" /></>}
              </button>
            </div>
            {!overallReadiness.allDone && (
              <button type="button" onClick={handleAutoApprove} className="mt-2 w-full px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors">
                <Sparkles className="w-3 h-3" /> Demo Auto-Approve (Skip Verification)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfileView;