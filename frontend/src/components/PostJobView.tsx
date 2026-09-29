import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { JobListing, AppRoute, AuthUser, CompanyProfile } from '../types';
import { companyService } from '../services/companyService';
import { jobService } from '../services/jobService';
import { SubscriptionView } from './SubscriptionView';
import { subscriptionService } from '../services/subscriptionService';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Save,
  ShieldCheck,
  Building2,
  AlertCircle,
  Loader2,
  Clock,
  XCircle,
  X,
  Plus,
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  FileText,
  Settings,
  Eye,
  Phone,
  Mail,
  Globe,
  Calendar,
  Star,
  Zap,
  ChevronDown,
  Search,
  Info,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Trash2,
  MessageCircle,
  Smartphone,
  User,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   INTERFACES
   ───────────────────────────────────────────────────────────────────────── */
interface PostJobViewProps {
  onPublishJob: (job: any) => void;
  onSaveDraft: (job: any) => void;
  onNavigate: (route: AppRoute) => void;
  authUser?: AuthUser | null;
  onShowToast?: (msg: string) => void;
  editJobId?: string | null;
}

interface JobFormData {
  title: string;
  department: string;
  role: string;
  jobType: string;
  workMode: string;
  qualification: string;
  applicationUrl: string;
  status: string;
  companyName: string;
  companyWebsite: string;
  industry: string;
  establishedYear: string;
  organizationSize: string;
  locationAddress: string;
  locationCity: string;
  locationState: string;
  locationCountry: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: string;
  experienceMin: string;
  experienceMax: string;
  experienceText: string;
  noticePeriod: string;
  jobDescription: string;
  skills: string;
  languages: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  jobTiming: string;
  workingDays: string;
  recruiterName: string;
  recruiterDesignation: string;
  recruiterEmail: string;
  recruiterMobileNumber: string;
  recruiterWhatsappNumber: string;
  contactVisibilityWhatsapp: boolean;
  contactVisibilityMobile: boolean;
  noPaymentInvolved: boolean;
  featured: boolean;
}

const initialFormData: JobFormData = {
  title: '',
  department: '',
  role: '',
  jobType: 'Full-Time',
  workMode: 'On-site',
  qualification: '',
  applicationUrl: '',
  status: 'Draft',
  companyName: '',
  companyWebsite: '',
  industry: '',
  establishedYear: '',
  organizationSize: '',
  locationAddress: '',
  locationCity: '',
  locationState: '',
  locationCountry: 'India',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'INR',
  salaryPeriod: 'month',
  experienceMin: '',
  experienceMax: '',
  experienceText: '',
  noticePeriod: '',
  jobDescription: '',
  skills: '',
  languages: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  jobTiming: '10:00 AM to 05:00 PM',
  workingDays: 'Mon - Fri',
  recruiterName: '',
  recruiterDesignation: '',
  recruiterEmail: '',
  recruiterMobileNumber: '',
  recruiterWhatsappNumber: '',
  contactVisibilityWhatsapp: true,
  contactVisibilityMobile: true,
  noPaymentInvolved: true,
  featured: false,
};

/* ─────────────────────────────────────────────────────────────────────────
   SUGGESTION LISTS
   ───────────────────────────────────────────────────────────────────────── */
const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
  'HTML', 'CSS', 'Tailwind CSS', 'Sass', 'Bootstrap', 'Next.js', 'Vue.js', 'Angular',
  'Express.js', 'Django', 'Flask', 'Spring Boot', 'GraphQL', 'REST API',
  'Git', 'GitHub', 'CI/CD', 'Jenkins', 'Linux',
  'Unity 3D', 'Unreal Engine', 'AR/VR', 'Blender', 'Figma', 'Adobe XD', 'Photoshop',
  'Data Analysis', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'SQL',
  'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Project Management', 'Agile', 'Scrum',
];

const LANGUAGE_SUGGESTIONS = [
  'English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Punjabi', 'Odia', 'Assamese', 'Urdu', 'Sanskrit',
  'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Korean', 'Arabic',
];

const BENEFIT_SUGGESTIONS = [
  'Health Insurance', 'Medical Insurance', 'Life Insurance', 'Dental Coverage',
  'Annual Bonus', 'Performance Bonus', 'Joining Bonus', 'Stock Options', 'ESOPs',
  'Paid Time Off', 'Flexible Working Hours', 'Work From Home', 'Remote Work',
  'Provident Fund', 'Gratuity', 'Meal Coupons', 'Free Meals', 'Cab Facility',
  'Gym Membership', 'Wellness Programs', 'Mental Health Support',
  'Training & Development', 'Certification Reimbursement', 'Learning Budget',
  'Maternity Leave', 'Paternity Leave', 'Childcare Support',
  'Relocation Assistance', 'Housing Allowance', 'Internet Reimbursement',
];

const NOTICE_PERIOD_OPTIONS = [
  'Immediate Joiner', '15 Days', '30 Days / 1 Month', '45 Days',
  '60 Days / 2 Months', '90 Days / 3 Months', 'Serving Notice Period', 'Flexible / Negotiable',
];

const DESIGNATION_SUGGESTIONS = [
  'HR Manager', 'HR Lead', 'HR Executive', 'Talent Acquisition Manager',
  'Recruiter', 'Senior Recruiter', 'Technical Recruiter', 'Hiring Manager',
  'CEO', 'CTO', 'COO', 'Founder', 'Co-Founder', 'Director',
  'Team Lead', 'Engineering Manager', 'Product Manager',
];

const ORGANIZATION_SIZE_OPTIONS = [
  '1-10 employees', '11-50 employees', '51-100 employees', '100-200 employees',
  '201-500 employees', '501-1000 employees', '1001-5000 employees',
  '5001-10000 employees', '10000+ employees',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const INDIAN_CITIES: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Solapur', 'Kolhapur', 'Navi Mumbai'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Noida'],
  'Delhi': ['New Delhi', 'Delhi'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Mohali'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
  'Chandigarh': ['Chandigarh'],
};

const ALL_CITIES = Array.from(new Set(Object.values(INDIAN_CITIES).flat())).sort();

const CURRENCY_OPTIONS = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY'];
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SGD: 'S$', AUD: 'A$', CAD: 'C$', JPY: '¥',
};

const PERIOD_OPTIONS = [
  { value: 'hour', label: 'Hourly', short: 'hr' },
  { value: 'day', label: 'Daily', short: 'day' },
  { value: 'week', label: 'Weekly', short: 'wk' },
  { value: 'month', label: 'Monthly', short: 'mo' },
  { value: 'year', label: 'Yearly', short: 'yr' },
];

/* ─────────────────────────────────────────────────────────────────────────
   HELPER FUNCTIONS
   ───────────────────────────────────────────────────────────────────────── */
const getCurrencySymbol = (c: string) => CURRENCY_SYMBOLS[c?.toUpperCase()?.trim()] || c || '';
const formatNumberIN = (v: string) => {
  if (!v) return '';
  const n = Number(v);
  return isNaN(n) ? v : n.toLocaleString('en-IN');
};

const extractPhone = (raw?: string | null): string => {
  if (!raw) return '';
  let d = String(raw).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length > 10) d = d.slice(-10);
  return d;
};

const formatTo12hString = (t24: string): string => {
  if (!t24 || !t24.includes(':')) return '10:00 AM';
  const [hStr, mStr] = t24.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
};

const convertTo24h = (timeStr: string): string => {
  if (!timeStr) return '10:00';
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '10:00';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3];
  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const parseWorkingDaysString = (str?: string): string[] => {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (!str) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const cleaned = str.trim();
  if (cleaned.includes('-') || cleaned.includes('–')) {
    const parts = cleaned.split(/\s*(?:-|–)\s*/);
    if (parts.length === 2) {
      const startIdx = order.findIndex(d => d.toLowerCase() === parts[0].trim().toLowerCase().slice(0, 3));
      const endIdx = order.findIndex(d => d.toLowerCase() === parts[1].trim().toLowerCase().slice(0, 3));
      if (startIdx !== -1 && endIdx !== -1) {
        const range = [];
        for (let i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) range.push(order[i]);
        return range;
      }
    }
  }
  return order.filter(d => cleaned.toLowerCase().includes(d.toLowerCase()));
};

const serializeWorkingDays = (selected: string[]): string => {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const sorted = [...selected].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  if (sorted.length === 0) return '';
  const indices = sorted.map(d => order.indexOf(d));
  let isConsecutive = true;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) { isConsecutive = false; break; }
  }
  if (isConsecutive && sorted.length > 2) return `${sorted[0]} - ${sorted[sorted.length - 1]}`;
  return sorted.join(', ');
};

/* ─────────────────────────────────────────────────────────────────────────
   VALIDATORS
   ───────────────────────────────────────────────────────────────────────── */
const VALIDATORS = {
  required: (v: string) => (!v?.trim() ? 'This field is required' : ''),
  url: (v: string) => {
    if (!v) return '';
    return /^https?:\/\/([\w-]+\.)+[\w-]+(\/.*)?$/.test(v) ? '' : 'Must start with http:// or https://';
  },
  email: (v: string) => {
    if (!v) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email';
  },
  phone: (v: string) => {
    if (!v) return '';
    return /^\d{10}$/.test(v.trim()) ? '' : 'Must be exactly 10 digits';
  },
  number: (v: string, min?: number, max?: number) => {
    if (!v) return '';
    if (!/^\d+(\.\d+)?$/.test(v)) return 'Must be a valid number';
    const num = Number(v);
    if (min !== undefined && num < min) return `Minimum value: ${min}`;
    if (max !== undefined && num > max) return `Maximum value: ${max}`;
    return '';
  },
  minLength: (v: string, len: number) => {
    if (!v) return '';
    return v.trim().length < len ? `Must be at least ${len} characters` : '';
  },
  year: (v: string) => {
    if (!v) return '';
    const year = Number(v);
    const current = new Date().getFullYear();
    if (!/^\d{4}$/.test(v)) return 'Must be a 4-digit year';
    if (year < 1800 || year > current) return `Year must be between 1800 and ${current}`;
    return '';
  },
};

const SECTION_LABELS = [
  { label: 'Basic Info', icon: Briefcase, desc: 'Job title, type & mode' },
  { label: 'Company Info', icon: Building2, desc: 'Company snapshot (editable)' },
  { label: 'Description', icon: FileText, desc: 'Role details & responsibilities' },
  { label: 'Skills', icon: Zap, desc: 'Requirements & benefits' },
  { label: 'Compensation', icon: DollarSign, desc: 'Salary & experience' },
  { label: 'Location', icon: MapPin, desc: 'Work location & schedule' },
  { label: 'Recruiter', icon: User, desc: 'Contact person snapshot' },
  { label: 'Settings', icon: Settings, desc: 'Status & publish options' },
];

const FIELD_TO_SECTION: Record<string, number> = {
  title: 0, department: 0, role: 0, jobType: 0, workMode: 0, qualification: 0, applicationUrl: 0,
  companyName: 1, companyWebsite: 1, industry: 1, establishedYear: 1, organizationSize: 1,
  jobDescription: 2, responsibilities: 2, requirements: 2,
  skills: 3, benefits: 3, languages: 3,
  salaryMin: 4, salaryMax: 4, experienceMin: 4, experienceMax: 4, noticePeriod: 4,
  locationCity: 5, locationState: 5, locationAddress: 5, jobTiming: 5, workingDays: 5,
  recruiterName: 6, recruiterDesignation: 6, recruiterEmail: 6,
  recruiterMobileNumber: 6, recruiterWhatsappNumber: 6,
};

/* ─────────────────────────────────────────────────────────────────────────
   TAG INPUT COMPONENT
   ───────────────────────────────────────────────────────────────────────── */
interface TagInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  suggestions?: string[];
  colorScheme?: 'purple' | 'green' | 'amber';
}

const TagInput = memo(function TagInput({
  value, onChange, placeholder, suggestions = [], colorScheme = 'purple',
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tags = useMemo(() => value.split(',').map(s => s.trim()).filter(Boolean), [value]);

  const colors = {
    purple: { bg: 'bg-[#EDE6FA]', text: 'text-[#42326E]', border: 'border-[#D7C8ED]' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  }[colorScheme];

  const addTag = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setInput('');
      return;
    }
    onChange([...tags, trimmed].join(', '));
    setInput('');
  }, [tags, onChange]);

  const removeTag = useCallback((index: number) => {
    onChange(tags.filter((_, i) => i !== index).join(', '));
  }, [tags, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    else if (e.key === 'Backspace' && !input && tags.length > 0) removeTag(tags.length - 1);
  }, [input, tags, addTag, removeTag]);

  const filteredSuggestions = useMemo(() => {
    if (!input.trim()) return [];
    const lower = input.toLowerCase();
    return suggestions
      .filter(s => s.toLowerCase().includes(lower) && !tags.some(t => t.toLowerCase() === s.toLowerCase()))
      .slice(0, 8);
  }, [input, suggestions, tags]);

  return (
    <div className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 border border-[#E8E3EF] rounded-xl p-2.5 min-h-[46px] bg-white cursor-text focus-within:border-[#42326E] focus-within:ring-2 focus-within:ring-[#42326E]/10 transition-all"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, idx) => (
          <span key={idx} className={`inline-flex items-center gap-1.5 ${colors.bg} ${colors.text} ${colors.border} border rounded-lg px-2.5 py-1 text-xs font-semibold`}>
            {tag}
            <button type="button" onClick={e => { e.stopPropagation(); removeTag(idx); }} className={`${colors.text} hover:opacity-70 text-sm font-bold leading-none`}>×</button>
          </span>
        ))}
        <input
          ref={inputRef} type="text" value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => { setTimeout(() => setShowSuggestions(false), 180); if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[130px] border-none outline-none text-sm bg-transparent text-[#1D2939] py-1 px-1"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E3EF] rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {filteredSuggestions.map((sug, idx) => (
            <div key={idx} onMouseDown={e => { e.preventDefault(); addTag(sug); }} className="px-3 py-2 text-sm text-[#49454F] cursor-pointer hover:bg-[#F8F5FF] border-b border-[#F2F4F7] last:border-0">
              {sug}
            </div>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-[#98A2B3]">
        Press <strong>Enter</strong> or <strong>comma</strong> to add · Click <strong>×</strong> to remove
        {tags.length > 0 && <span className="ml-1.5 text-[#42326E] font-semibold">({tags.length} added)</span>}
      </p>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   SEARCHABLE COMBOBOX COMPONENT
   ───────────────────────────────────────────────────────────────────────── */
interface ComboBoxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  error?: boolean;
  onBlur?: () => void;
}

const ComboBox = memo(function ComboBox({ value, onChange, options, placeholder, error, onBlur }: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value || ''); }, [value]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  }, [search, options]);

  const showAddCustom = search.trim().length > 0 && !options.some(opt => opt.toLowerCase() === search.trim().toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center border rounded-xl h-[44px] px-3 gap-1.5 transition-all ${error ? 'border-red-400 bg-red-50/50' : open ? 'border-[#42326E] ring-2 ring-[#42326E]/10' : 'border-[#E8E3EF] bg-white'}`}>
        <Search className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
        <input type="text" value={search} placeholder={placeholder}
          onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { setTimeout(() => { if (onBlur) onBlur(); }, 150); }}
          className="flex-1 border-none outline-none text-sm bg-transparent text-[#1D2939] min-w-0" />
        <ChevronDown className={`w-3.5 h-3.5 text-[#98A2B3] transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E3EF] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((opt, idx) => (
            <div key={idx} onMouseDown={e => { e.preventDefault(); onChange(opt); setSearch(opt); setOpen(false); onBlur?.(); }}
              className={`px-3 py-2.5 text-sm cursor-pointer border-b border-[#F2F4F7] last:border-0 flex items-center justify-between ${opt === value ? 'bg-[#F8F5FF] text-[#42326E] font-bold' : 'text-[#49454F] hover:bg-[#FAFAFA]'}`}>
              <span>{opt}</span>
              {opt === value && <Check className="w-3.5 h-3.5" />}
            </div>
          )) : !showAddCustom && (
            <div className="px-3 py-3 text-xs text-[#98A2B3] text-center">No matches found</div>
          )}
          {showAddCustom && (
            <div onMouseDown={e => { e.preventDefault(); onChange(search.trim()); setOpen(false); onBlur?.(); }}
              className="px-3 py-2.5 text-sm cursor-pointer bg-blue-50 text-blue-700 font-semibold flex items-center gap-2 hover:bg-blue-100">
              <Plus className="w-3.5 h-3.5" /> Add "{search.trim()}" as custom
            </div>
          )}
        </div>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   ANALOG CLOCK PICKER
   ───────────────────────────────────────────────────────────────────────── */
interface ClockPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const ClockPicker = memo(function ClockPicker({ label, value, onChange }: ClockPickerProps) {
  const clockRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [isDragging, setIsDragging] = useState(false);
  const [h24, m] = value.split(':').map(v => parseInt(v, 10) || 0);
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;

  const updateTime = (newH12: number, newM: number, newP: 'AM' | 'PM') => {
    let h = newH12 % 12;
    if (newP === 'PM') h += 12;
    onChange(`${h.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`);
  };

  const handleClockInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    if (mode === 'hour') {
      let sel = Math.round(angle / 30);
      if (sel === 0) sel = 12;
      if (sel > 12) sel = 12;
      updateTime(sel, m, period);
    } else {
      const sel = Math.round(angle / 6) % 60;
      updateTime(hour12, sel, period);
    }
  };

  const size = 160;
  const center = size / 2;
  const numberRadius = 54;
  const handAngle = mode === 'hour' ? (hour12 % 12) * 30 : m * 6;
  const handRad = (handAngle - 90) * (Math.PI / 180);
  const handX = center + numberRadius * Math.cos(handRad);
  const handY = center + numberRadius * Math.sin(handRad);

  return (
    <div className="flex flex-col items-center gap-2 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl p-3 w-[180px]">
      <span className="text-[10px] font-bold text-[#6F687A] uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-[#F2F4F7] rounded-lg px-2 py-1">
          <input type="text" inputMode="numeric" value={hour12.toString().padStart(2, '0')} onFocus={() => setMode('hour')}
            onChange={e => { let val = parseInt(e.target.value.replace(/\D/g, ''), 10); if (isNaN(val)) return; val = Math.max(1, Math.min(12, val)); updateTime(val, m, period); }}
            className={`w-6 text-center border-none text-sm font-bold outline-none rounded ${mode === 'hour' ? 'bg-[#42326E] text-white' : 'bg-transparent text-[#1D2939]'}`} />
          <span className="font-bold text-[#6F687A]">:</span>
          <input type="text" inputMode="numeric" value={m.toString().padStart(2, '0')} onFocus={() => setMode('minute')}
            onChange={e => { let val = parseInt(e.target.value.replace(/\D/g, ''), 10); if (isNaN(val)) return; val = Math.max(0, Math.min(59, val)); updateTime(hour12, val, period); }}
            className={`w-6 text-center border-none text-sm font-bold outline-none rounded ${mode === 'minute' ? 'bg-[#42326E] text-white' : 'bg-transparent text-[#1D2939]'}`} />
        </div>
        <div className="flex flex-col gap-0.5">
          {(['AM', 'PM'] as const).map(p => (
            <button key={p} type="button" onClick={() => updateTime(hour12, m, p)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border-none cursor-pointer ${period === p ? 'bg-[#42326E] text-white' : 'bg-[#F2F4F7] text-[#6F687A]'}`}>{p}</button>
          ))}
        </div>
      </div>
      <svg ref={clockRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        onMouseDown={e => { setIsDragging(true); handleClockInteraction(e); }}
        onMouseMove={e => { if (isDragging) handleClockInteraction(e); }}
        onMouseUp={() => { if (mode === 'hour') setTimeout(() => setMode('minute'), 200); setIsDragging(false); }}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={e => { setIsDragging(true); handleClockInteraction(e); }}
        onTouchMove={e => { if (isDragging) handleClockInteraction(e); }}
        onTouchEnd={() => { if (mode === 'hour') setTimeout(() => setMode('minute'), 200); setIsDragging(false); }}
        className="cursor-pointer select-none touch-none">
        <circle cx={center} cy={center} r={68} fill="#F8F5FF" stroke="#42326E" strokeWidth="1" opacity="0.5" />
        {mode === 'hour'
          ? Array.from({ length: 12 }, (_, i) => {
            const num = i + 1;
            const angle = (num * 30 - 90) * (Math.PI / 180);
            const x = center + numberRadius * Math.cos(angle);
            const y = center + numberRadius * Math.sin(angle);
            const isSelected = num === hour12;
            return (<g key={num}>{isSelected && <circle cx={x} cy={y} r="10" fill="#42326E" />}<text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill={isSelected ? '#fff' : '#6F687A'} style={{ pointerEvents: 'none' }}>{num}</text></g>);
          })
          : Array.from({ length: 12 }, (_, i) => {
            const num = i * 5;
            const angle = (num * 6 - 90) * (Math.PI / 180);
            const x = center + numberRadius * Math.cos(angle);
            const y = center + numberRadius * Math.sin(angle);
            const isSelected = num === m;
            return (<g key={num}>{isSelected && <circle cx={x} cy={y} r="10" fill="#42326E" />}<text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="bold" fill={isSelected ? '#fff' : '#6F687A'} style={{ pointerEvents: 'none' }}>{num.toString().padStart(2, '0')}</text></g>);
          })}
        <line x1={center} y1={center} x2={handX} y2={handY} stroke="#42326E" strokeWidth="2" strokeLinecap="round" style={{ pointerEvents: 'none' }} />
        <circle cx={center} cy={center} r="3" fill="#42326E" style={{ pointerEvents: 'none' }} />
      </svg>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PostJobView COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export const PostJobView: React.FC<PostJobViewProps> = ({
  onPublishJob, onSaveDraft, onNavigate, authUser, onShowToast, editJobId,
}) => {
  const isEditing = !!editJobId;

  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ✅ Subscription quota states
  const [quotaChecking, setQuotaChecking] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // ⭐ Track verification from API response, not just authUser prop
  const [verificationStatus, setVerificationStatus] = useState<string>('loading');
  const [isVerifiedFromAPI, setIsVerifiedFromAPI] = useState<boolean | null>(null);

  // Timing & days
  const [timingStart, setTimingStart] = useState('10:00');
  const [timingEnd, setTimingEnd] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  // Derived
  const currencySymbol = getCurrencySymbol(formData.salaryCurrency);
  const activePeriod = PERIOD_OPTIONS.find(p => p.value === formData.salaryPeriod);

  const salaryPreview = useMemo(() => {
    const min = formData.salaryMin ? `${currencySymbol}${formatNumberIN(formData.salaryMin)}` : '';
    const max = formData.salaryMax ? `${currencySymbol}${formatNumberIN(formData.salaryMax)}` : '';
    const per = activePeriod ? ` / ${activePeriod.short}` : '';
    if (min && max) return `${min} – ${max}${per}`;
    if (min) return `From ${min}${per}`;
    if (max) return `Up to ${max}${per}`;
    return 'Not disclosed';
  }, [formData.salaryMin, formData.salaryMax, currencySymbol, activePeriod]);

  const experiencePreview = useMemo(() => {
    const { experienceMin: min, experienceMax: max } = formData;
    if (min && max) return `${min} – ${max} years`;
    if (min) return `${min}+ years`;
    if (max) return `Up to ${max} years`;
    return 'Any experience';
  }, [formData.experienceMin, formData.experienceMax]);

  const salaryRangeInvalid = !!(formData.salaryMin && formData.salaryMax && Number(formData.salaryMin) > Number(formData.salaryMax));
  const experienceRangeInvalid = !!(formData.experienceMin && formData.experienceMax && Number(formData.experienceMin) > Number(formData.experienceMax));
  const errorCount = Object.keys(fieldErrors).filter(k => fieldErrors[k]).length;

  useEffect(() => {
    const timing = `${formatTo12hString(timingStart)} to ${formatTo12hString(timingEnd)}`;
    const days = serializeWorkingDays(selectedDays);
    setFormData(prev => ({ ...prev, jobTiming: timing, workingDays: days }));
  }, [timingStart, timingEnd, selectedDays]);

  useEffect(() => {
    setFieldErrors(prev => {
      const next = { ...prev };
      if (formData.salaryMin && formData.salaryMax && Number(formData.salaryMin) > Number(formData.salaryMax)) {
        next.salaryMax = 'Max salary must be ≥ min salary';
      } else if (next.salaryMax === 'Max salary must be ≥ min salary') {
        delete next.salaryMax;
      }
      if (formData.experienceMin && formData.experienceMax && Number(formData.experienceMin) > Number(formData.experienceMax)) {
        next.experienceMax = 'Max experience must be ≥ min experience';
      } else if (next.experienceMax === 'Max experience must be ≥ min experience') {
        delete next.experienceMax;
      }
      return next;
    });
  }, [formData.salaryMin, formData.salaryMax, formData.experienceMin, formData.experienceMax]);

  // ══════════════════════════════════════════════════
  // ⭐ Load profile and determine verification from API
  // ══════════════════════════════════════════════════
  useEffect(() => {
    const load = async () => {
      try {
        const res = await companyService.getProfile();
        const data = res.data;
        const cp = data?.companyProfile as CompanyProfile | undefined;

        const apiVerificationStatus = data?.verificationStatus || 'not_submitted';
        const apiIsVerified = data?.isVerified === true;

        setVerificationStatus(apiVerificationStatus);
        setIsVerifiedFromAPI(apiIsVerified);

        if (cp) {
          setCompanyProfile(cp);
          setFormData(prev => ({
            ...prev,
            companyName: cp.name || '',
            companyWebsite: cp.website || '',
            industry: cp.industry || '',
            establishedYear: cp.establishedYear?.toString() || cp.foundedYear || '',
            organizationSize: cp.organizationSize || cp.teamSize || '',
            locationCity: cp.city || prev.locationCity,
            locationState: cp.state || prev.locationState,
            locationCountry: cp.country || prev.locationCountry,
            locationAddress: cp.address || prev.locationAddress,
            recruiterName: cp.contactPerson?.name || '',
            recruiterDesignation: cp.contactPerson?.designation || '',
            recruiterEmail: cp.contactEmail || '',
            recruiterMobileNumber: extractPhone(cp.contactPhone),
            recruiterWhatsappNumber: extractPhone(cp.whatsappNumber),
          }));
        }
        setProfileComplete(!!data?.isProfileComplete);

        if (editJobId) {
          const jRes = await jobService.getJob(editJobId);
          const j = jRes.data?.job || jRes.data;
          if (j) {
            setFormData({
              title: j.title || '',
              department: j.department || '',
              role: j.role || '',
              jobType: j.jobType || 'Full-Time',
              workMode: j.workMode || 'On-site',
              qualification: j.qualification || '',
              applicationUrl: j.applicationUrl || '',
              status: j.status || 'Draft',
              companyName: j.companyName || '',
              companyWebsite: j.companyWebsite || '',
              industry: j.industry || '',
              establishedYear: j.establishedYear?.toString() || '',
              organizationSize: j.organizationSize || '',
              locationAddress: j.location?.address || '',
              locationCity: j.location?.city || '',
              locationState: j.location?.state || '',
              locationCountry: j.location?.country || 'India',
              salaryMin: j.salary?.min?.toString() || '',
              salaryMax: j.salary?.max?.toString() || '',
              salaryCurrency: j.salary?.currency || 'INR',
              salaryPeriod: j.salary?.period || 'month',
              experienceMin: j.experience?.min?.toString() || '',
              experienceMax: j.experience?.max?.toString() || '',
              experienceText: j.experience?.text || '',
              noticePeriod: j.noticePeriod || '',
              jobDescription: j.jobDescription || '',
              skills: Array.isArray(j.skills) ? j.skills.join(', ') : '',
              languages: Array.isArray(j.languages) ? j.languages.join(', ') : '',
              responsibilities: Array.isArray(j.responsibilities) ? j.responsibilities.join('\n') : '',
              requirements: Array.isArray(j.requirements) ? j.requirements.join('\n') : '',
              benefits: Array.isArray(j.benefits) ? j.benefits.join(', ') : '',
              jobTiming: j.jobTiming || '10:00 AM to 05:00 PM',
              workingDays: j.workingDays || 'Mon - Fri',
              recruiterName: j.contactPerson?.name || '',
              recruiterDesignation: j.contactPerson?.designation || '',
              recruiterEmail: j.recruiterEmail || '',
              recruiterMobileNumber: extractPhone(j.recruiterMobileNumber),
              recruiterWhatsappNumber: extractPhone(j.recruiterWhatsappNumber),
              contactVisibilityWhatsapp: j.contactVisibility?.whatsapp !== false,
              contactVisibilityMobile: j.contactVisibility?.mobile !== false,
              noPaymentInvolved: j.noPaymentInvolved !== false,
              featured: !!j.featured,
            });

            if (j.jobTiming) {
              const parts = j.jobTiming.split(/\s*(?:to|–|-)\s*/i);
              if (parts.length >= 2) {
                setTimingStart(convertTo24h(parts[0]));
                setTimingEnd(convertTo24h(parts[1]));
              }
            }
            if (j.workingDays) setSelectedDays(parseWorkingDaysString(j.workingDays));
          }
        }
      } catch (err) {
        console.warn('Could not load data', err);
        setVerificationStatus(authUser?.verificationStatus || 'not_submitted');
        setIsVerifiedFromAPI(authUser?.isVerified || false);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    load();
  }, [editJobId, authUser]);

  // ══════════════════════════════════════════════════
  // ✅ CHECK SUBSCRIPTION QUOTA (runs after profile loads)
  // ══════════════════════════════════════════════════
  useEffect(() => {
    const checkQuota = async () => {
      if (isEditing) {
        setQuotaChecking(false);
        return;
      }
      try {
        const usage = await subscriptionService.getUsage();
        if (!usage.subscriptionActive || usage.remainingJobs <= 0) {
          setQuotaExceeded(true);
        } else {
          setQuotaExceeded(false);
        }
      } catch (err) {
        console.warn('Could not verify subscription quota', err);
        setQuotaExceeded(true);
      } finally {
        setQuotaChecking(false);
      }
    };

    const isApprovedNow =
      verificationStatus === 'approved' ||
      isVerifiedFromAPI === true ||
      authUser?.isVerified === true ||
      authUser?.verificationStatus === 'approved';

    if (isApprovedNow && !isLoadingProfile) {
      checkQuota();
    } else if (!isLoadingProfile) {
      setQuotaChecking(false);
    }
  }, [verificationStatus, isVerifiedFromAPI, authUser, isLoadingProfile, isEditing]);

  /* ─── Validation ─── */
  const validateField = useCallback((name: string, value: any): string => {
    switch (name) {
      case 'title': return VALIDATORS.required(value) || VALIDATORS.minLength(value, 3);
      case 'companyName': return VALIDATORS.required(value);
      case 'jobDescription': return VALIDATORS.required(value) || VALIDATORS.minLength(value, 20);
      case 'locationCity': return VALIDATORS.required(value);
      case 'applicationUrl': case 'companyWebsite': return VALIDATORS.url(value);
      case 'recruiterEmail': return VALIDATORS.email(value);
      case 'recruiterMobileNumber': case 'recruiterWhatsappNumber': return value ? VALIDATORS.phone(value) : '';
      case 'establishedYear': return VALIDATORS.year(value);
      case 'salaryMin': case 'salaryMax': return VALIDATORS.number(value, 0);
      case 'experienceMin': case 'experienceMax': return VALIDATORS.number(value, 0, 50);
      default: return '';
    }
  }, []);

  const validateAll = useCallback((): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, (formData as any)[key]);
      if (err) errors[key] = err;
    });
    if (salaryRangeInvalid) errors.salaryMax = 'Max salary must be ≥ min salary';
    if (experienceRangeInvalid) errors.experienceMax = 'Max experience must be ≥ min experience';
    return { valid: Object.keys(errors).length === 0, errors };
  }, [formData, validateField, salaryRangeInvalid, experienceRangeInvalid]);

  /* ─── Handlers ─── */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    if (name === 'recruiterMobileNumber' || name === 'recruiterWhatsappNumber') {
      newValue = String(newValue).replace(/\D/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (touchedFields[name] || fieldErrors[name]) {
      const err = validateField(name, newValue);
      setFieldErrors(prev => {
        const next = { ...prev };
        if (err) next[name] = err; else delete next[name];
        return next;
      });
    }
  }, [touchedFields, fieldErrors, validateField]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors(prev => {
      const next = { ...prev };
      if (err) next[name] = err; else delete next[name];
      return next;
    });
  }, [validateField]);

  const sectionHasErrors = useCallback((idx: number): boolean => {
    return Object.keys(fieldErrors).some(f => FIELD_TO_SECTION[f] === idx && !!fieldErrors[f]);
  }, [fieldErrors]);

  /* ─── Build Payload ─── */
  const buildPayload = useCallback((statusOverride?: string) => ({
    title: formData.title.trim(),
    department: formData.department.trim(),
    role: formData.role.trim() || formData.title.trim(),
    jobType: formData.jobType,
    workMode: formData.workMode,
    qualification: formData.qualification.trim(),
    applicationUrl: formData.applicationUrl.trim(),
    status: statusOverride || formData.status,
    companyName: formData.companyName.trim(),
    companyWebsite: formData.companyWebsite.trim(),
    industry: formData.industry.trim(),
    establishedYear: formData.establishedYear ? Number(formData.establishedYear) : null,
    organizationSize: formData.organizationSize.trim(),
    companyLogo: companyProfile?.logo || { url: '', publicId: '' },
    companyImages: companyProfile?.gallery || [],
    companyInitials: companyProfile?.companyInitials || '',
    location: {
      address: formData.locationAddress.trim(),
      city: formData.locationCity.trim(),
      state: formData.locationState.trim(),
      country: formData.locationCountry.trim(),
    },
    salary: {
      min: formData.salaryMin ? Number(formData.salaryMin) : 0,
      max: formData.salaryMax ? Number(formData.salaryMax) : 0,
      currency: formData.salaryCurrency,
      period: formData.salaryPeriod,
    },
    experience: {
      min: formData.experienceMin ? Number(formData.experienceMin) : 0,
      max: formData.experienceMax ? Number(formData.experienceMax) : 0,
      text: formData.experienceText.trim(),
    },
    noticePeriod: formData.noticePeriod.trim(),
    jobDescription: formData.jobDescription.trim(),
    skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
    languages: formData.languages.split(',').map(s => s.trim()).filter(Boolean),
    responsibilities: formData.responsibilities.split('\n').map(s => s.trim()).filter(Boolean),
    requirements: formData.requirements.split('\n').map(s => s.trim()).filter(Boolean),
    benefits: formData.benefits.split(',').map(s => s.trim()).filter(Boolean),
    jobTiming: formData.jobTiming.trim(),
    workingDays: formData.workingDays.trim(),
    contactPerson: {
      name: formData.recruiterName.trim(),
      designation: formData.recruiterDesignation.trim(),
    },
    recruiterEmail: formData.recruiterEmail.trim(),
    recruiterMobileNumber: formData.recruiterMobileNumber ? `+91${formData.recruiterMobileNumber}` : '',
    recruiterWhatsappNumber: formData.recruiterWhatsappNumber ? `+91${formData.recruiterWhatsappNumber}` : '',
    contactVisibility: {
      whatsapp: formData.contactVisibilityWhatsapp,
      mobile: formData.contactVisibilityMobile,
    },
    noPaymentInvolved: formData.noPaymentInvolved,
    featured: formData.featured,
    isCompanyVerified: verificationStatus === 'approved',
  }), [formData, companyProfile, verificationStatus]);

  /* ─── Publish / Update ─── */
  const handlePublish = useCallback(async () => {
    setGlobalError(null);
    setSuccessMessage(null);
    const { valid, errors } = validateAll();
    if (!valid) {
      setFieldErrors(errors);
      const touched: Record<string, boolean> = { ...touchedFields };
      Object.keys(errors).forEach(k => (touched[k] = true));
      setTouchedFields(touched);
      setShowErrorSummary(true);
      const firstField = Object.keys(errors)[0];
      const section = FIELD_TO_SECTION[firstField];
      if (section !== undefined) setActiveSection(section);
      setGlobalError(`Please fix ${Object.keys(errors).length} error(s) before publishing`);
      return;
    }
    setShowErrorSummary(false);
    setIsPublishing(true);
    try {
      const payload = buildPayload();
      if (isEditing && editJobId) {
        await jobService.updateJob(editJobId, payload);
        setSuccessMessage(`Job "${formData.title}" updated successfully!`);
        onShowToast?.(`Job "${formData.title}" updated!`);
      } else {
        await jobService.createJob(payload);
        setSuccessMessage(`Job "${formData.title}" published successfully!`);
        onShowToast?.(`Job "${formData.title}" published!`);
      }
      onPublishJob(payload);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Save failed. Please try again.';
      setGlobalError(msg);
      // If backend says quota exceeded, show subscription view
      if (err.response?.status === 403 && msg.toLowerCase().includes('limit')) {
        setQuotaExceeded(true);
      }
    } finally {
      setIsPublishing(false);
    }
  }, [validateAll, touchedFields, buildPayload, formData.title, onShowToast, onPublishJob, isEditing, editJobId]);

  const handleSaveDraftClick = useCallback(() => {
    onSaveDraft(buildPayload('Draft'));
    onShowToast?.('Draft saved!');
  }, [buildPayload, onSaveDraft, onShowToast]);

  /* ─── Field Error Display ─── */
  const FieldError = ({ name }: { name: string }) => {
    if (!touchedFields[name] || !fieldErrors[name]) return null;
    return (
      <span className="flex items-center gap-1 mt-1.5 text-[11px] text-red-500 font-medium">
        <AlertTriangle className="w-3 h-3" /> {fieldErrors[name]}
      </span>
    );
  };

  const getInputClass = (name: string) =>
    `w-full text-sm py-2.5 px-3.5 border rounded-xl outline-none transition-all font-medium ${
      touchedFields[name] && fieldErrors[name]
        ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
        : 'border-[#E8E3EF] bg-white focus:border-[#42326E] focus:ring-2 focus:ring-[#42326E]/10'
    }`;

  const AutoFilledBadge = () => (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full ml-2">
      <ShieldCheck className="w-2.5 h-2.5" /> Auto-filled · Editable
    </span>
  );

  /* ═══════════════════════════════════════════════════════════════════
     RENDER GATES — Loading → Quota → Verification → Form
     ═══════════════════════════════════════════════════════════════════ */

  // GATE 1: Loading state (profile + quota check)
  if (isLoadingProfile || quotaChecking) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#42326E]" />
        <p className="text-sm text-[#6F687A] font-medium">
          {isEditing
            ? 'Loading job data...'
            : quotaChecking
              ? 'Checking your subscription...'
              : 'Loading your company profile...'}
        </p>
      </div>
    );
  }

  // GATE 2: Quota exceeded — show subscription upgrade view
  if (quotaExceeded && !isEditing) {
    return (
      <SubscriptionView
        authUser={authUser}
        message="You've reached your job posting limit. Upgrade your plan to post more jobs."
        onSuccess={() => {
          setQuotaExceeded(false);
          setQuotaChecking(true);
          subscriptionService
            .getUsage()
            .then((u) => {
              if (u.subscriptionActive && u.remainingJobs > 0) {
                setQuotaExceeded(false);
              } else {
                setQuotaExceeded(true);
              }
            })
            .catch(() => setQuotaExceeded(true))
            .finally(() => setQuotaChecking(false));
        }}
        onBack={() => onNavigate('dashboard')}
      />
    );
  }

  // GATE 3: Verification check
  const isApproved =
    verificationStatus === 'approved' ||
    isVerifiedFromAPI === true ||
    authUser?.isVerified === true ||
    authUser?.verificationStatus === 'approved';

  if (!isApproved) {
    const effectiveStatus = verificationStatus !== 'loading'
      ? verificationStatus
      : (authUser?.verificationStatus || 'not_submitted');

    const statusScreens: Record<string, {
      icon: React.ReactNode;
      bg: string;
      title: string;
      desc: string;
      cta: string;
    }> = {
      not_submitted: {
        icon: <AlertCircle className="w-8 h-8 text-amber-600" />,
        bg: 'bg-amber-50 border-amber-200',
        title: 'Company Verification Required',
        desc: 'You must verify your company before posting jobs. Complete your profile, upload documents, and submit for review.',
        cta: 'Complete Verification',
      },
      pending: {
        icon: <Clock className="w-8 h-8 text-blue-600 animate-pulse" />,
        bg: 'bg-blue-50 border-blue-200',
        title: 'Verification Under Review',
        desc: 'Your documents are being reviewed. This usually takes 24-48 hours. You can post jobs once approved.',
        cta: 'View Status',
      },
      rejected: {
        icon: <XCircle className="w-8 h-8 text-rose-600" />,
        bg: 'bg-rose-50 border-rose-200',
        title: 'Verification Rejected',
        desc: authUser?.rejectionReason || 'Your verification was not approved. Please update your documents and resubmit.',
        cta: 'Fix & Resubmit',
      },
    };

    const screen = statusScreens[effectiveStatus] || statusScreens.not_submitted;

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto animate-in fade-in duration-200">
        <div className={`border-2 rounded-3xl p-10 text-center space-y-5 ${screen.bg}`}>
          <div className="w-20 h-20 rounded-3xl bg-white mx-auto flex items-center justify-center shadow-sm">
            {screen.icon}
          </div>
          <h2 className="text-2xl font-extrabold text-[#2C1B57]">{screen.title}</h2>
          <p className="text-sm text-[#49454F] max-w-lg mx-auto leading-relaxed">{screen.desc}</p>
          {!profileComplete && effectiveStatus === 'not_submitted' && (
            <div className="p-3 bg-white/60 rounded-xl border border-amber-300 max-w-md mx-auto">
              <p className="text-xs text-amber-800 font-semibold">
                📋 Your profile is incomplete. Please add required fields.
              </p>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button onClick={() => onNavigate('company')}
              className="px-6 py-3 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {screen.cta}
            </button>
            <button onClick={() => onNavigate('dashboard')}
              className="px-6 py-3 bg-white hover:bg-gray-50 text-[#49454F] text-xs font-bold rounded-xl border border-[#E8E3EF] inline-flex items-center gap-2">
              Go to Dashboard
            </button>
          </div>
          <div className="pt-4 border-t border-white/40 text-[11px] text-[#6F687A]">
            Status: <span className="font-bold uppercase">{effectiveStatus.replace('_', ' ')}</span>
            {effectiveStatus === 'approved' && ' ✓'}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
     MAIN FORM (Verified User with Active Subscription)
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      {/* Header */}
<div className="flex items-start justify-between flex-wrap gap-4">
  <div>
    <div className="flex items-center gap-2 flex-wrap">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
        {isEditing ? 'Edit Job Listing' : 'Post a New Job'}
      </h1>
      {/* ✅ PREMIUM BADGE for Standard/Enterprise users */}
      {authUser?.subscription?.tier === 'enterprise' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-300 shadow-sm">
          👑 Enterprise
        </span>
      )}
      {authUser?.subscription?.tier === 'standard' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-[#EDE6FA] to-[#D7C8ED] text-[#42326E] text-[10px] font-bold rounded-full border border-[#B29CFE] shadow-sm">
          ⚡ Pro
        </span>
      )}
    </div>
    <p className="text-sm text-[#6F687A] mt-1">
      Company & recruiter info auto-filled from your profile. Changes here save to <b>this job only</b>.
    </p>
    {/* ✅ Usage indicator for premium users */}
    {authUser?.usage && authUser.usage.subscriptionActive && (
      <p className="text-[11px] text-[#6F687A] mt-1 flex items-center gap-1.5">
        <span className={`font-bold ${authUser.usage.remainingJobs <= 2 ? 'text-red-600' : 'text-emerald-700'}`}>
          {authUser.usage.remainingJobs} job{authUser.usage.remainingJobs !== 1 ? 's' : ''} remaining
        </span>
        <span className="text-[#E8E3EF]">|</span>
        <span>{authUser.usage.jobsUsed}/{authUser.usage.jobLimit} used</span>
      </p>
    )}
  </div>
  {errorCount > 0 && (
    <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
      <span className="text-xs font-bold text-red-600">{errorCount} error{errorCount > 1 ? 's' : ''}</span>
    </div>
  )}
</div>

      {/* Company Badge */}
    {/* Company Badge — Premium styling for Enterprise/Standard users */}
{companyProfile && (
  <div className={`p-4 rounded-2xl flex items-center gap-3 ${
    authUser?.subscription?.tier === 'enterprise'
      ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
      : authUser?.subscription?.tier === 'standard'
        ? 'bg-gradient-to-r from-[#F8F5FF] to-emerald-50 border border-[#D7C8ED]'
        : 'bg-emerald-50 border border-emerald-200'
  }`}>
          {companyProfile.logo?.url ? (
            <img src={companyProfile.logo.url} alt="" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#2C1B57] text-white flex items-center justify-center font-bold text-xs">
              {companyProfile.companyInitials || 'CO'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              Verified Company: {companyProfile.name}
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-[11px] text-emerald-700 truncate">
              Profile Contact: {companyProfile.contactPerson?.name || 'N/A'}
              {companyProfile.contactPhone && ` • ${companyProfile.contactPhone}`}
            </div>
          </div>
        </div>
      )}

      {/* Global Alerts */}
      {globalError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-xs text-red-700 font-semibold flex-1">{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs text-emerald-700 font-semibold flex-1">{successMessage}</span>
        </div>
      )}

      {/* Error Summary */}
      {showErrorSummary && errorCount > 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
          <p className="text-xs font-bold text-red-700 mb-2">
            {errorCount} error{errorCount > 1 ? 's' : ''} must be fixed:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(fieldErrors).filter(([, v]) => v).map(([field, err]) => {
              const secIdx = FIELD_TO_SECTION[field] ?? 0;
              return (
                <button key={field} type="button" onClick={() => setActiveSection(secIdx)}
                  className="text-left p-2 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors">
                  <span className="text-[10px] font-bold text-[#42326E]">{SECTION_LABELS[secIdx]?.label} →</span>
                  <p className="text-[10px] text-red-600 mt-0.5"><strong>{field}:</strong> {err}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Layout: Sidebar + Content */}
      <div className="flex gap-6 min-h-[600px]">
        {/* Sidebar Navigation */}
        <div className="hidden md:flex flex-col w-56 shrink-0 bg-white border border-[#E8E3EF] rounded-2xl overflow-hidden self-start">
          <div className="p-3 border-b border-[#E8E3EF] bg-[#FAFAFA]">
            <p className="text-[10px] font-bold text-[#6F687A] uppercase tracking-wider">Sections</p>
          </div>
          {SECTION_LABELS.map((sec, idx) => {
            const hasErr = sectionHasErrors(idx);
            const isActive = activeSection === idx;
            const Icon = sec.icon;
            return (
              <button key={idx} type="button" onClick={() => setActiveSection(idx)}
                className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-all border-l-[3px] ${
                  isActive ? 'bg-[#F8F5FF] border-l-[#42326E] text-[#42326E]'
                  : hasErr ? 'bg-red-50/50 border-l-red-400 text-red-600'
                  : 'border-l-transparent text-[#49454F] hover:bg-[#FAFAFA]'
                }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${hasErr ? 'bg-red-100' : isActive ? 'bg-[#42326E] text-white' : 'bg-[#F2F4F7]'}`}>
                  {hasErr ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#6F687A]'}`} />}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-[#42326E]' : hasErr ? 'text-red-600' : 'text-[#49454F]'}`}>{sec.label}</p>
                  <p className="text-[10px] text-[#98A2B3] truncate">{sec.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile Section Tabs */}
        <div className="md:hidden flex overflow-x-auto gap-2 pb-2 -mx-4 px-4">
          {SECTION_LABELS.map((sec, idx) => {
            const hasErr = sectionHasErrors(idx);
            const isActive = activeSection === idx;
            const Icon = sec.icon;
            return (
              <button key={idx} type="button" onClick={() => setActiveSection(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border transition-all ${
                  isActive ? 'bg-[#42326E] text-white border-[#42326E]'
                  : hasErr ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-[#49454F] border-[#E8E3EF]'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {sec.label}
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-[#E8E3EF] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 sm:p-8 space-y-6">

              {/* ══════ SECTION 0: Basic Info ══════ */}
              {activeSection === 0 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3EF]">
                    <div className="w-9 h-9 rounded-xl bg-[#F8F5FF] flex items-center justify-center">
                      <Briefcase className="w-4.5 h-4.5 text-[#42326E]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#2C1B57]">Basic Job Information</h3>
                      <p className="text-xs text-[#6F687A]">Title, type, work mode, and qualification</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-1.5">Job Title <span className="text-red-400">*</span></label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Senior Product Designer" className={getInputClass('title')} maxLength={120} />
                    <div className="flex justify-between mt-1">
                      <FieldError name="title" />
                      <span className={`text-[10px] font-medium ${formData.title.length < 3 && formData.title.length > 0 ? 'text-red-400' : 'text-[#98A2B3]'}`}>{formData.title.length}/120</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#49454F] mb-1.5">Department</label>
                      <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Design" className={getInputClass('department')} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#49454F] mb-1.5">Role / Designation</label>
                      <input type="text" name="role" value={formData.role} onChange={handleChange} placeholder="e.g. Lead Designer" className={getInputClass('role')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-2">Employment Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Full-Time', 'Part-Time', 'Contract', 'Internship'].map(type => (
                        <button key={type} type="button" onClick={() => setFormData(prev => ({ ...prev, jobType: type }))}
                          className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${formData.jobType === type ? 'bg-[#2C1B57] text-white border-[#2C1B57] shadow-sm' : 'bg-[#FCFCF7] text-[#49454F] border-[#E8E3EF] hover:border-[#B29CFE]'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-2">Work Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['On-site', 'Remote', 'Hybrid'].map(mode => (
                        <button key={mode} type="button" onClick={() => setFormData(prev => ({ ...prev, workMode: mode }))}
                          className={`py-2.5 px-4 text-xs font-bold rounded-xl border transition-all ${formData.workMode === mode ? 'bg-[#2C1B57] text-white border-[#2C1B57] shadow-sm' : 'bg-[#FCFCF7] text-[#49454F] border-[#E8E3EF] hover:border-[#B29CFE]'}`}>
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#49454F] mb-1.5">Qualification</label>
                      <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. B.Tech / B.Des" className={getInputClass('qualification')} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#49454F] mb-1.5">Application URL</label>
                      <input type="url" name="applicationUrl" value={formData.applicationUrl} onChange={handleChange} onBlur={handleBlur} placeholder="https://company.com/apply" className={getInputClass('applicationUrl')} />
                      <FieldError name="applicationUrl" />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3EF]">
                    <div className="w-9 h-9 rounded-xl bg-[#F8F5FF] flex items-center justify-center"><Building2 className="w-4.5 h-4.5 text-[#42326E]" /></div>
                    <div><h3 className="text-lg font-bold text-[#2C1B57] flex items-center">Company Information<AutoFilledBadge /></h3><p className="text-xs text-[#6F687A]">Snapshot for this job — edit as needed</p></div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2"><Info className="w-4 h-4 shrink-0 mt-0.5" /><span>These fields are auto-filled from your company profile. <b>Changes here save to this job listing only</b>.</span></div>
                  <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Company Name <span className="text-red-400">*</span></label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. HCL Technologies" className={getInputClass('companyName')} /><FieldError name="companyName" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Website</label><input type="url" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} onBlur={handleBlur} placeholder="https://..." className={getInputClass('companyWebsite')} /><FieldError name="companyWebsite" /></div>
                    <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Industry</label><input type="text" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. IT, Healthcare" className={getInputClass('industry')} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Established Year</label><input type="text" name="establishedYear" value={formData.establishedYear} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. 2005" maxLength={4} className={getInputClass('establishedYear')} /><FieldError name="establishedYear" /></div>
                    <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Organization Size</label><select name="organizationSize" value={ORGANIZATION_SIZE_OPTIONS.includes(formData.organizationSize) ? formData.organizationSize : ''} onChange={handleChange} className={getInputClass('organizationSize')}><option value="">Select Size</option>{ORGANIZATION_SIZE_OPTIONS.map(sz => (<option key={sz} value={sz}>{sz}</option>))}</select></div>
                  </div>
                </div>
              )}

              {activeSection === 2 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3EF]">
                    <div className="w-9 h-9 rounded-xl bg-[#F8F5FF] flex items-center justify-center"><FileText className="w-4.5 h-4.5 text-[#42326E]" /></div>
                    <div><h3 className="text-lg font-bold text-[#2C1B57]">Job Description</h3><p className="text-xs text-[#6F687A]">Describe the role, responsibilities, and requirements</p></div>
                  </div>
                  <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Description <span className="text-red-400">*</span><span className="font-normal text-[#98A2B3] ml-1">(min 20 characters)</span></label><textarea name="jobDescription" value={formData.jobDescription} onChange={handleChange} onBlur={handleBlur} rows={8} placeholder="Describe the overall scope, responsibilities, work environment, and impact..." className={`${getInputClass('jobDescription')} resize-vertical leading-relaxed`} /><div className="flex justify-between mt-1"><FieldError name="jobDescription" /><span className={`text-[10px] font-medium ${formData.jobDescription.length > 0 && formData.jobDescription.length < 20 ? 'text-red-400' : 'text-[#98A2B3]'}`}>{formData.jobDescription.length}/20 min</span></div></div>
                  <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Responsibilities <span className="font-normal text-[#98A2B3]">(one per line)</span></label><textarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} rows={5} placeholder={"Lead design sprints\nMaintain design system\nRun usability interviews"} className={`${getInputClass('responsibilities')} resize-vertical leading-relaxed`} /></div>
                  <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Requirements <span className="font-normal text-[#98A2B3]">(one per line)</span></label><textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={5} placeholder={"4+ years in product design\nExperience with design systems\nStrong portfolio"} className={`${getInputClass('requirements')} resize-vertical leading-relaxed`} /></div>
                </div>
              )}

              {activeSection === 3 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3EF]">
                    <div className="w-9 h-9 rounded-xl bg-[#F8F5FF] flex items-center justify-center"><Zap className="w-4.5 h-4.5 text-[#42326E]" /></div>
                    <div><h3 className="text-lg font-bold text-[#2C1B57]">Skills, Benefits & Languages</h3><p className="text-xs text-[#6F687A]">Add tags for skills, benefits, and languages</p></div>
                  </div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl"><div className="flex items-center gap-2 mb-3"><span className="text-base">🛠</span><span className="text-sm font-bold text-[#2C1B57]">Skills Required</span></div><TagInput value={formData.skills} onChange={v => setFormData(prev => ({ ...prev, skills: v }))} placeholder="Type a skill and press Enter" suggestions={SKILL_SUGGESTIONS} colorScheme="purple" /></div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl"><div className="flex items-center gap-2 mb-3"><span className="text-base">🎁</span><span className="text-sm font-bold text-[#2C1B57]">Benefits Offered</span></div><TagInput value={formData.benefits} onChange={v => setFormData(prev => ({ ...prev, benefits: v }))} placeholder="Type a benefit and press Enter" suggestions={BENEFIT_SUGGESTIONS} colorScheme="green" /></div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl"><div className="flex items-center gap-2 mb-3"><span className="text-base">🗣</span><span className="text-sm font-bold text-[#2C1B57]">Languages Required</span></div><TagInput value={formData.languages} onChange={v => setFormData(prev => ({ ...prev, languages: v }))} placeholder="Type a language and press Enter" suggestions={LANGUAGE_SUGGESTIONS} colorScheme="amber" /></div>
                </div>
              )}

              {activeSection === 4 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3EF]">
                    <div className="w-9 h-9 rounded-xl bg-[#F8F5FF] flex items-center justify-center"><DollarSign className="w-4.5 h-4.5 text-[#42326E]" /></div>
                    <div><h3 className="text-lg font-bold text-[#2C1B57]">Salary, Experience & Notice</h3><p className="text-xs text-[#6F687A]">Compensation details and experience requirements</p></div>
                  </div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl space-y-4">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-base">💰</span><span className="text-sm font-bold text-[#2C1B57]">Compensation</span></div><span className="text-[10px] font-semibold text-[#6F687A] bg-[#F2F4F7] px-2.5 py-1 rounded-full">Optional</span></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Currency</label><select name="salaryCurrency" value={formData.salaryCurrency} onChange={handleChange} className={getInputClass('salaryCurrency')}>{CURRENCY_OPTIONS.map(c => (<option key={c} value={c}>{getCurrencySymbol(c)} {c}</option>))}</select></div>
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Period</label><div className="flex gap-1.5 bg-[#F2F4F7] border border-[#E8E3EF] rounded-xl p-1 h-[44px] items-center">{PERIOD_OPTIONS.map(p => (<button key={p.value} type="button" onClick={() => setFormData(prev => ({ ...prev, salaryPeriod: p.value }))} className={`flex-1 h-full rounded-lg text-[11px] font-bold transition-all ${formData.salaryPeriod === p.value ? 'bg-[#42326E] text-white shadow-sm' : 'text-[#49454F] hover:bg-white/60'}`}>{p.label}</button>))}</div></div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Minimum</label><div className={`flex items-center border rounded-xl h-[48px] overflow-hidden ${touchedFields.salaryMin && fieldErrors.salaryMin ? 'border-red-400 bg-red-50/50' : salaryRangeInvalid ? 'border-amber-300' : 'border-[#E8E3EF]'}`}><span className="w-11 h-full flex items-center justify-center bg-[#F8F5FF] border-r border-[#E8E3EF] text-sm font-bold text-[#42326E] shrink-0">{currencySymbol || '¤'}</span><input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleChange} onBlur={handleBlur} placeholder="25000" min="0" className="flex-1 border-none outline-none px-3 text-sm font-semibold text-[#1D2939] bg-transparent h-full" /></div>{formData.salaryMin && !fieldErrors.salaryMin && (<span className="text-[10px] text-[#6F687A] mt-1 block">{currencySymbol}{formatNumberIN(formData.salaryMin)}</span>)}<FieldError name="salaryMin" /></div>
                      <div className="flex items-center justify-center h-[48px] mt-6 text-[#98A2B3] font-bold text-lg">—</div>
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Maximum</label><div className={`flex items-center border rounded-xl h-[48px] overflow-hidden ${(touchedFields.salaryMax && fieldErrors.salaryMax) || salaryRangeInvalid ? 'border-red-400 bg-red-50/50' : 'border-[#E8E3EF]'}`}><span className="w-11 h-full flex items-center justify-center bg-[#F8F5FF] border-r border-[#E8E3EF] text-sm font-bold text-[#42326E] shrink-0">{currencySymbol || '¤'}</span><input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleChange} onBlur={handleBlur} placeholder="45000" min="0" className="flex-1 border-none outline-none px-3 text-sm font-semibold text-[#1D2939] bg-transparent h-full" /></div>{formData.salaryMax && !fieldErrors.salaryMax && (<span className="text-[10px] text-[#6F687A] mt-1 block">{currencySymbol}{formatNumberIN(formData.salaryMax)}</span>)}{!salaryRangeInvalid && <FieldError name="salaryMax" />}</div>
                    </div>
                    {salaryRangeInvalid && (<div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"><AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /><div className="flex-1 min-w-0"><p className="text-xs font-bold text-red-700">Invalid range</p><p className="text-[10px] text-red-600">Max must be ≥ min</p></div><button type="button" onClick={() => setFormData(prev => ({ ...prev, salaryMin: prev.salaryMax, salaryMax: prev.salaryMin }))} className="px-3 py-1.5 rounded-lg border border-red-300 bg-white text-red-700 text-[11px] font-bold flex items-center gap-1.5 hover:bg-red-50"><RotateCcw className="w-3 h-3" /> Swap</button></div>)}
                    <div className="pt-3 border-t border-dashed border-[#E8E3EF] flex items-center justify-between"><span className="text-[10px] font-bold text-[#6F687A] tracking-wider">PREVIEW</span><span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${salaryRangeInvalid ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E]'}`}>{salaryPreview}</span></div>
                  </div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl space-y-4">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-base">🎯</span><span className="text-sm font-bold text-[#2C1B57]">Experience</span></div></div>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Min (years)</label><input type="number" name="experienceMin" value={formData.experienceMin} onChange={handleChange} onBlur={handleBlur} placeholder="0" min="0" max="50" className={getInputClass('experienceMin')} /><FieldError name="experienceMin" /></div>
                      <div className="flex items-center justify-center h-[44px] mt-6 text-[#98A2B3] font-bold text-lg">—</div>
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Max (years)</label><input type="number" name="experienceMax" value={formData.experienceMax} onChange={handleChange} onBlur={handleBlur} placeholder="5" min="0" max="50" className={getInputClass('experienceMax')} />{!experienceRangeInvalid && <FieldError name="experienceMax" />}</div>
                    </div>
                    {experienceRangeInvalid && (<div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"><AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-xs text-red-600 flex-1">Max must be ≥ min</p><button type="button" onClick={() => setFormData(prev => ({ ...prev, experienceMin: prev.experienceMax, experienceMax: prev.experienceMin }))} className="px-3 py-1.5 rounded-lg border border-red-300 bg-white text-red-700 text-[11px] font-bold flex items-center gap-1.5"><RotateCcw className="w-3 h-3" /> Swap</button></div>)}
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] font-bold text-[#6F687A]">QUICK SET:</span>{[{ label: 'Fresher', min: '0', max: '1' },{ label: '1-3 yrs', min: '1', max: '3' },{ label: '2-5 yrs', min: '2', max: '5' },{ label: '5-8 yrs', min: '5', max: '8' },{ label: '10+ yrs', min: '10', max: '20' }].map(p => (<button key={p.label} type="button" onClick={() => setFormData(prev => ({ ...prev, experienceMin: p.min, experienceMax: p.max }))} className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${formData.experienceMin === p.min && formData.experienceMax === p.max ? 'bg-[#42326E] text-white border-[#42326E]' : 'bg-white text-[#49454F] border-[#E8E3EF] hover:border-[#B29CFE]'}`}>{p.label}</button>))}</div>
                    <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Experience Label</label><input type="text" name="experienceText" value={formData.experienceText} onChange={handleChange} placeholder="e.g. 2-5 years in product design" className={getInputClass('experienceText')} /></div>
                    <div className="pt-3 border-t border-dashed border-[#E8E3EF] flex items-center justify-between"><span className="text-[10px] font-bold text-[#6F687A] tracking-wider">PREVIEW</span><span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${experienceRangeInvalid ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E]'}`}>{experiencePreview}</span></div>
                  </div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl space-y-4">
                    <div className="flex items-center gap-2"><span className="text-base">⏳</span><span className="text-sm font-bold text-[#2C1B57]">Notice Period</span></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select name="noticePeriod" value={NOTICE_PERIOD_OPTIONS.includes(formData.noticePeriod) ? formData.noticePeriod : ''} onChange={handleChange} className={getInputClass('noticePeriod')}><option value="">Select Notice Period</option>{NOTICE_PERIOD_OPTIONS.map(np => (<option key={np} value={np}>{np}</option>))}</select>
                      <input type="text" name="noticePeriod" value={formData.noticePeriod} onChange={handleChange} placeholder="Or custom" className={getInputClass('noticePeriod')} />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 5 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3EF]">
                    <div className="w-9 h-9 rounded-xl bg-[#F8F5FF] flex items-center justify-center"><MapPin className="w-4.5 h-4.5 text-[#42326E]" /></div>
                    <div><h3 className="text-lg font-bold text-[#2C1B57]">Location & Schedule</h3><p className="text-xs text-[#6F687A]">Work location, timing, and working days</p></div>
                  </div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl space-y-4">
                    <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Full Address</label><input type="text" name="locationAddress" value={formData.locationAddress} onChange={handleChange} placeholder="e.g. Phase 3, Kalpana Nagar" className={getInputClass('locationAddress')} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">State</label><ComboBox value={formData.locationState} onChange={v => setFormData(prev => ({ ...prev, locationState: v }))} options={INDIAN_STATES} placeholder="Search state" /></div>
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">City <span className="text-red-400">*</span></label><ComboBox value={formData.locationCity} onChange={v => { setFormData(prev => ({ ...prev, locationCity: v })); if (touchedFields.locationCity || fieldErrors.locationCity) { const err = validateField('locationCity', v); setFieldErrors(prev => { const n = { ...prev }; if (err) n.locationCity = err; else delete n.locationCity; return n; }); } }} onBlur={() => { setTouchedFields(prev => ({ ...prev, locationCity: true })); const err = validateField('locationCity', formData.locationCity); setFieldErrors(prev => { const n = { ...prev }; if (err) n.locationCity = err; else delete n.locationCity; return n; }); }} options={formData.locationState && INDIAN_CITIES[formData.locationState] ? INDIAN_CITIES[formData.locationState] : ALL_CITIES} placeholder="Search city" error={!!(touchedFields.locationCity && fieldErrors.locationCity)} /><FieldError name="locationCity" /></div>
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Country</label><input type="text" name="locationCountry" value={formData.locationCountry} onChange={handleChange} className={getInputClass('locationCountry')} /></div>
                    </div>
                  </div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl space-y-4">
                    <div className="flex items-center gap-2"><span className="text-base">🕒</span><span className="text-sm font-bold text-[#2C1B57]">Job Timing</span></div>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                      <ClockPicker label="Start Time" value={timingStart} onChange={setTimingStart} />
                      <div className="flex flex-col items-center gap-1"><ArrowRight className="w-5 h-5 text-[#98A2B3]" /><span className="text-[10px] font-bold text-[#6F687A]">TO</span></div>
                      <ClockPicker label="End Time" value={timingEnd} onChange={setTimingEnd} />
                    </div>
                    <div className="pt-3 border-t border-dashed border-[#E8E3EF] flex items-center justify-between flex-wrap gap-2"><span className="text-[10px] font-bold text-[#6F687A] tracking-wider">TIMING</span><div className="flex items-center gap-2"><span className="px-2.5 py-1 bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] rounded-lg text-xs font-bold font-mono">{formatTo12hString(timingStart)}</span><span className="text-[#98A2B3] font-bold">→</span><span className="px-2.5 py-1 bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] rounded-lg text-xs font-bold font-mono">{formatTo12hString(timingEnd)}</span></div></div>
                  </div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl space-y-4">
                    <div className="flex items-center gap-2"><span className="text-base">📅</span><span className="text-sm font-bold text-[#2C1B57]">Working Days</span></div>
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] font-bold text-[#6F687A]">PRESETS:</span>{[{ key: 'weekdays', label: 'Mon - Fri', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },{ key: 'extended', label: 'Mon - Sat', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },{ key: 'all', label: 'All 7 Days', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }].map(p => (<button key={p.key} type="button" onClick={() => setSelectedDays(p.days)} className="px-3 py-1.5 rounded-full bg-white border border-[#E8E3EF] text-[11px] font-semibold text-[#49454F] hover:border-[#B29CFE] transition-all">{p.label}</button>))}</div>
                    <div className="flex gap-2 flex-wrap">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (<button key={day} type="button" onClick={() => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedDays.includes(day) ? 'bg-[#42326E] text-white border-[#42326E] shadow-sm' : 'bg-white text-[#49454F] border-[#E8E3EF] hover:border-[#B29CFE]'}`}>{day}</button>))}</div>
                    <div className="pt-3 border-t border-dashed border-[#E8E3EF] flex items-center justify-between"><span className="text-[10px] font-bold text-[#6F687A] tracking-wider">SAVED</span><span className="px-3 py-1.5 bg-[#F8F5FF] border border-[#D7C8ED] text-[#42326E] rounded-lg text-xs font-bold">{formData.workingDays || 'No days selected'}</span></div>
                  </div>
                </div>
              )}

              {activeSection === 6 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3EF]">
                    <div className="w-9 h-9 rounded-xl bg-[#F8F5FF] flex items-center justify-center"><User className="w-4.5 h-4.5 text-[#42326E]" /></div>
                    <div><h3 className="text-lg font-bold text-[#2C1B57] flex items-center">Recruiter & Contact Details<AutoFilledBadge /></h3><p className="text-xs text-[#6F687A]">Contact person snapshot for this job</p></div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2"><Info className="w-4 h-4 shrink-0 mt-0.5" /><span>Editing here does NOT change your main profile contact.</span></div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Recruiter Name</label><input type="text" name="recruiterName" value={formData.recruiterName} onChange={handleChange} placeholder="e.g. Bhavuk Deshmukh" className={getInputClass('recruiterName')} /></div>
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Designation</label><ComboBox value={formData.recruiterDesignation} onChange={v => setFormData(prev => ({ ...prev, recruiterDesignation: v }))} options={DESIGNATION_SUGGESTIONS} placeholder="e.g. HR Manager" /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-[#49454F] mb-1.5"><Mail className="w-3 h-3 inline mr-1" />Official Email</label><input type="email" name="recruiterEmail" value={formData.recruiterEmail} onChange={handleChange} onBlur={handleBlur} placeholder="recruiter@company.com" className={getInputClass('recruiterEmail')} /><FieldError name="recruiterEmail" /></div>
                  </div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5"><Smartphone className="w-3 h-3 inline mr-1" />Mobile (10 digits)</label><div className={`flex items-stretch border rounded-xl overflow-hidden h-[44px] ${touchedFields.recruiterMobileNumber && fieldErrors.recruiterMobileNumber ? 'border-red-400 bg-red-50/50' : 'border-[#E8E3EF] bg-white'}`}><span className="bg-[#F2F4F7] px-3 flex items-center border-r border-[#E8E3EF] text-xs font-bold text-[#6F687A]">+91</span><input type="tel" name="recruiterMobileNumber" value={formData.recruiterMobileNumber} onChange={handleChange} onBlur={handleBlur} placeholder="9876543210" maxLength={10} inputMode="numeric" className="flex-1 px-3 outline-none border-none text-sm bg-transparent text-[#1D2939]" /></div><FieldError name="recruiterMobileNumber" /></div>
                      <div><label className="block text-xs font-bold text-[#49454F] mb-1.5"><MessageCircle className="w-3 h-3 inline mr-1" />WhatsApp (10 digits)</label><div className={`flex items-stretch border rounded-xl overflow-hidden h-[44px] ${touchedFields.recruiterWhatsappNumber && fieldErrors.recruiterWhatsappNumber ? 'border-red-400 bg-red-50/50' : 'border-[#E8E3EF] bg-white'}`}><span className="bg-[#F2F4F7] px-3 flex items-center border-r border-[#E8E3EF] text-xs font-bold text-[#6F687A]">+91</span><input type="tel" name="recruiterWhatsappNumber" value={formData.recruiterWhatsappNumber} onChange={handleChange} onBlur={handleBlur} placeholder="9876543210" maxLength={10} inputMode="numeric" className="flex-1 px-3 outline-none border-none text-sm bg-transparent text-[#1D2939]" /></div><FieldError name="recruiterWhatsappNumber" /></div>
                    </div>
                  </div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl space-y-4">
                    <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-[#42326E]" /><span className="text-sm font-bold text-[#2C1B57]">Visibility on Job Listing</span></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={`p-4 rounded-xl border-2 transition-all ${formData.contactVisibilityWhatsapp ? 'border-emerald-400 bg-emerald-50/40' : 'border-[#E8E3EF] bg-white'}`}><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-bold text-[#2C1B57]">WhatsApp</p><p className="text-[10px] text-[#6F687A] mt-0.5">{formData.contactVisibilityWhatsapp ? '✓ Visible' : '✗ Hidden'}</p></div><button type="button" onClick={() => setFormData(prev => ({ ...prev, contactVisibilityWhatsapp: !prev.contactVisibilityWhatsapp }))} className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${formData.contactVisibilityWhatsapp ? 'bg-emerald-500' : 'bg-gray-300'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${formData.contactVisibilityWhatsapp ? 'left-[22px]' : 'left-0.5'}`} /></button></div></div>
                      <div className={`p-4 rounded-xl border-2 transition-all ${formData.contactVisibilityMobile ? 'border-[#42326E] bg-[#F8F5FF]' : 'border-[#E8E3EF] bg-white'}`}><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-bold text-[#2C1B57]">Mobile Call</p><p className="text-[10px] text-[#6F687A] mt-0.5">{formData.contactVisibilityMobile ? '✓ Visible' : '✗ Hidden'}</p></div><button type="button" onClick={() => setFormData(prev => ({ ...prev, contactVisibilityMobile: !prev.contactVisibilityMobile }))} className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${formData.contactVisibilityMobile ? 'bg-[#42326E]' : 'bg-gray-300'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${formData.contactVisibilityMobile ? 'left-[22px]' : 'left-0.5'}`} /></button></div></div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 7 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3EF]">
                    <div className="w-9 h-9 rounded-xl bg-[#F8F5FF] flex items-center justify-center"><Settings className="w-4.5 h-4.5 text-[#42326E]" /></div>
                    <div><h3 className="text-lg font-bold text-[#2C1B57]">Status & Settings</h3><p className="text-xs text-[#6F687A]">Publishing options and listing flags</p></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-[#49454F] mb-1.5">Job Status</label><select name="status" value={formData.status} onChange={handleChange} className={getInputClass('status')}><option value="Draft">Draft</option><option value="Live">Live / Active</option>{isEditing && <option value="Paused">Paused</option>}{isEditing && <option value="Closed">Closed</option>}</select></div>
                    <div className="flex flex-col gap-4 pt-6">
                      <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} className="w-4 h-4 cursor-pointer accent-[#42326E] rounded" /><div><span className="text-xs font-bold text-[#49454F] flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /> Feature This Listing</span><p className="text-[10px] text-[#98A2B3]">Featured jobs get priority visibility</p></div></label>
                      <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="noPaymentInvolved" checked={formData.noPaymentInvolved} onChange={handleChange} className="w-4 h-4 cursor-pointer accent-[#42326E] rounded" /><div><span className="text-xs font-bold text-[#49454F] flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> No Payment Involved</span><p className="text-[10px] text-[#98A2B3]">Free to apply</p></div></label>
                    </div>
                  </div>
                  <div className="p-5 bg-[#FAFAFA] border border-[#E8E3EF] rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 mb-1"><Eye className="w-4 h-4 text-[#42326E]" /><span className="text-sm font-bold text-[#2C1B57]">Quick Preview</span></div>
                    <div className="bg-white border border-[#E8E3EF] rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {companyProfile?.logo?.url ? (<img src={companyProfile.logo.url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />) : (<div className="w-12 h-12 rounded-xl bg-[#2C1B57] text-white flex items-center justify-center font-bold shrink-0">{companyProfile?.companyInitials || 'CO'}</div>)}
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">{formData.status === 'Live' && (<span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Ready to Publish</span>)}{formData.status === 'Draft' && (<span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Draft</span>)}{formData.featured && (<span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-2.5 h-2.5" /> Featured</span>)}</div>
                            <h4 className="text-lg font-extrabold text-[#2C1B57]">{formData.title || 'Untitled Position'}</h4>
                            <p className="text-xs text-[#6F687A] mt-0.5">{formData.companyName || 'Your Company'} • {formData.locationCity || 'City'}, {formData.locationState || 'State'} • {formData.workMode} • {formData.jobType}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0"><div className="text-sm font-extrabold text-[#2C1B57]">{salaryPreview}</div><span className="text-[10px] text-[#6F687A]">{experiencePreview}</span></div>
                      </div>
                      {formData.skills && (<div><p className="text-[10px] font-bold text-[#2C1B57] mb-1.5">Skills</p><div className="flex flex-wrap gap-1.5">{formData.skills.split(',').filter(Boolean).slice(0, 8).map((s, i) => (<span key={i} className="px-2 py-0.5 bg-[#EDE6FA] border border-[#D7C8ED] rounded text-[10px] text-[#42326E] font-semibold">{s.trim()}</span>))}</div></div>)}
                      <div className="pt-2 border-t border-[#E8E3EF] flex items-center gap-4 text-[10px] text-[#6F687A] flex-wrap">{formData.workingDays && <span>📅 {formData.workingDays}</span>}{formData.jobTiming && <span>🕒 {formData.jobTiming}</span>}{formData.noticePeriod && <span>⏳ {formData.noticePeriod}</span>}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="px-6 sm:px-8 py-4 border-t border-[#E8E3EF] bg-[#FAFAFA] flex items-center justify-between">
              <button type="button" onClick={() => setActiveSection(s => Math.max(0, s - 1))} disabled={activeSection === 0}
                className="px-4 py-2.5 text-xs font-bold text-[#49454F] hover:bg-gray-100 disabled:opacity-30 rounded-xl flex items-center gap-1.5 transition-all">
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={handleSaveDraftClick}
                  className="px-4 py-2.5 bg-white border border-[#E8E3EF] hover:border-[#D7C8ED] text-xs font-bold text-[#2C1B57] rounded-xl shadow-xs flex items-center gap-1.5 transition-all">
                  <Save className="w-3.5 h-3.5" /> Save Draft
                </button>
                {activeSection < SECTION_LABELS.length - 1 ? (
                  <button type="button" onClick={() => setActiveSection(s => Math.min(SECTION_LABELS.length - 1, s + 1))}
                    className="px-6 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all">
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button type="button" onClick={handlePublish} disabled={isPublishing}
                    className="px-6 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all">
                    {isPublishing ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />{isEditing ? 'Updating...' : 'Publishing...'}</>) : (<><Check className="w-3.5 h-3.5" />{isEditing ? 'Update Job' : 'Publish Job'}</>)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJobView;