export type AppRoute =
  | 'landing'
  | 'login'
  | 'dashboard'
  | 'post-job'
  | 'edit-job'
  | 'job-details'
  | 'my-jobs'
  | 'candidates'
  | 'shortlisted'
  | 'interviews'
  | 'messages'
  | 'notifications'
  | 'analytics'
  | 'company'
  | 'settings';

export type PipelineStage =
  | 'Applied'
  | 'Screening'
  | 'Shortlisted'
  | 'Interview'
  | 'Selected'
  | 'Hired';

export interface VerificationStatus {
  identity: boolean;
  phone: boolean;
  email: boolean;
  experience: boolean;
  education: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  department: string;
  location: string;
  experienceYears: number;
  skills: string[];
  matchScore: number;
  salaryExpected: string;
  avatarBg: string;
  bio: string;
  appliedDate: string;
  currentCompany: string;
  previousCompanies: string[];
  education: string;
  phone: string;
  email: string;
  stage: PipelineStage;
  bookmarked: boolean;
  verified: VerificationStatus;
  notes: string[];
  jobId?: string;        // NEW
  jobTitle?: string;     // NEW
  resumeUrl?: string;    // NEW
}

// ... (rest of your types remain 100% the same — JobListing, Interview, ChatMessage, etc.)
export interface JobListing {
  id: string;
  title: string;
  department: string;
  openings: number;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  responsibilities: string;
  requiredExperience: string;
  education: string;
  skills: string;
  salaryRange: string;
  salaryType: 'Annual' | 'Monthly' | 'Hourly';
  benefits: string;
  incentives: string;
  country: string;
  state: string;
  city: string;
  area: string;
  workMode: 'On-site' | 'Hybrid' | 'Remote';
  preferredSkills: string;
  availability: 'Immediate' | 'Within 30 days' | 'Within 60 days' | 'Flexible';
  status: 'active' | 'draft' | 'paused' | 'closed';
  postedDate: string;
  applicantsCount: number;
  shortlistedCount: number;
  jobTiming?: string;
  workingDays?: string;
  noticePeriod?: string;
  languages?: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateRole: string;
  date: string;
  time: string;
  format: 'Google Meet' | 'Zoom' | 'In-person' | 'Phone Screen';
  interviewer: string;
  link: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface ChatMessage {
  id: string;
  sender: 'recruiter' | 'candidate';
  text: string;
  time: string;
}

export interface MessageThread {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateRole: string;
  candidateAvatarBg: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  messages: ChatMessage[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'application' | 'verification' | 'interview' | 'system';
  read: boolean;
  linkRoute?: AppRoute;
}

export interface CompanyLogo {
  url: string;
  publicId: string;
}

export interface GalleryImage {
  _id?: string;
  url: string;
  publicId: string;
  uploadedAt?: string;
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  industry: string;
  headquarters: string;
  website: string;
  teamSize: string;
  foundedYear: string;
  about: string;
  perks: string[];

  logo?: CompanyLogo;
  gallery?: GalleryImage[];
  companyInitials?: string;

  address?: string;
  city?: string;
  state?: string;
  country?: string;

  registrationNumber?: string;
  gstNumber?: string;
  panNumber?: string;

  contactPerson?: { name: string; designation: string };
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  linkedInUrl?: string;

  organizationSize?: string;
  establishedYear?: number | string;
}

export type DocumentType =
  | 'company_registration'
  | 'gst_certificate'
  | 'pan_card'
  | 'incorporation_certificate'
  | 'authorization_letter'
  | 'other';

export type CompanyVerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'approved'
  | 'rejected';

export interface VerificationDocument {
  _id: string;
  docType: DocumentType;
  docName: string;
  public_id: string;
  url: string;
  format?: string;
  size?: number;
  uploadedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: { url?: string; public_id?: string };
  role: 'recruiter';
  loginMethod: 'google' | 'phone_otp' | 'email_otp';
  companyName?: string;
  isVerified?: boolean;
  verificationStatus?: CompanyVerificationStatus;
  verificationSubmittedAt?: string | null;
  verificationReviewedAt?: string | null;
  rejectionReason?: string;
}