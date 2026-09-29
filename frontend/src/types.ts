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
  | 'profile'      // ✅ NEW route for recruiter personal profile
  | 'settings'
    | 'subscription'; 

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
  jobId?: string;
  jobTitle?: string;
  resumeUrl?: string;
}

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
  // ✅ Which field is locked (cannot be edited) based on login method
  lockedField?: 'phone' | 'email' | null;
  companyName?: string;
  designation?: string;
  isVerified?: boolean;
  verificationStatus?: CompanyVerificationStatus;
  verificationSubmittedAt?: string | null;
  verificationReviewedAt?: string | null;
  rejectionReason?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: { url?: string; public_id?: string };
  role: 'recruiter';
  loginMethod: 'google' | 'phone_otp' | 'email_otp';
  lockedField?: 'phone' | 'email' | null;
  companyName?: string;
  designation?: string;
  isVerified?: boolean;
  verificationStatus?: CompanyVerificationStatus;
  verificationSubmittedAt?: string | null;
  verificationReviewedAt?: string | null;
  rejectionReason?: string;
  // ✅ SUBSCRIPTION DATA (returned by /auth/me)
  subscription?: {
    id: string;
    tier: string;
    name: string;
    status: string;
    currentPeriodEnd: string;
    paymentStatus: string;
    cancelAtPeriodEnd?: boolean;
  } | null;
  usage?: {
    jobsUsed: number;
    jobLimit: number;
    remainingJobs: number;
    subscriptionActive: boolean;
  } | null;
}
// ═══ SUBSCRIPTION TYPES ═══

export interface SubscriptionPlan {
  _id: string;
  name: string;
  tier: string; // dynamic from admin: 'basic' | 'standard' | 'enterprise' | custom
  audience?: string;
  price: number;
  priceYearly?: number;
  currency: string;
  billingCycle: string;
  description: string;
  features: string[];
  advantages?: string[];
  jobPostLimit: number;
  resumeViewLimit: number;
  isPopular: boolean;
  isActive: boolean;
  discountPercent?: number;
  trialDays?: number;
  displayOrder?: number;
}

export interface SubscriptionUsage {
  totalJobs: number;
  activeJobs: number;
  pausedJobs: number;
  draftJobs: number;
  closedJobs: number;
  jobsUsed: number;
  jobLimit: number;
  remainingJobs: number;
  subscriptionActive: boolean;
  subscription: {
    id: string;
    tier: string;
    name: string;
    status: string;
    currentPeriodEnd: string;
    paymentStatus: string;
    cancelAtPeriodEnd?: boolean;
  } | null;
}

export interface RazorpayCheckoutInit {
  isFreePlan: boolean;
  subscription?: any;
  orderId?: string;
  razorpayKeyId?: string;
  internalSubId?: string;
  amount?: number;
  currency?: string;
  planName?: string;
  planTier?: string;
}

// ═══ CANDIDATE FULL DETAIL TYPES ═══

export type CandidateStatus =
  | 'Applied'
  | 'Viewed'
  | 'Shortlisted'
  | 'Interview'
  | 'Offered'
  | 'Hired'
  | 'Rejected'
  | 'Withdrawn';

export interface CandidateEducation {
  collegeName: string;
  degree: string;
  specialization: string;
  endYear: string;
}

export interface CandidateMilestone {
  title: string;
  time?: string;
  completed: boolean;
  statusText: string;
  isHighlight: boolean;
}

export interface CandidateWorkflow {
  currentStatus: string;
  allowedNextStatuses: string[];
  currentStepIndex: number;
  totalSteps: number;
  isTerminal: boolean;
}

export interface CandidateJobDetails {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string;
  companyWebsite: string;
  location: { city?: string; state?: string; country?: string; address?: string };
  workMode: string;
  jobType: string;
  contactPerson: { name?: string; designation?: string };
}

export interface CandidateFullDetails {
  _id: string;
  id: string;
  jobId: string;
  userId: string;

  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  candidateCity: string;
  candidateSubLocation: string;
  candidateAvatarUrl: string;
  avatarBg: string;

  resumeUrl: string;
  resumeFileName: string;

  candidateSkills: string[];
  candidateLanguages: string[];
  candidateEnglishLevel: string;

  candidateExperience: string;
  candidateExperienceLevel: string;
  candidateJobTitle: string;
  candidateCurrentCompany: string;
  candidateCurrentSalary: string;

  candidateEducation: CandidateEducation;
  candidateAssets: string[];
  candidateCertifications: string[];

  jobTitle: string;
  jobCompany: string;
  jobCompanyLogo: string;
  jobSalary: string;
  jobLocation: string;
  jobHrName: string;
  jobHrRole: string;
  jobHrPhone: string;
  jobHrWhatsapp: string;

  matchPercentage: number;
  coverNote: string;
  status: CandidateStatus;
  stage: string;
  category: string;
  bookmarked: boolean;

  hrNotes: string;
  recruiterNotes: string[];
  milestones: CandidateMilestone[];

  appliedAt: string;
  viewedAt: string | null;
  shortlistedAt: string | null;
  interviewAt: string | null;
  createdAt: string;
  updatedAt: string;

  jobDetails?: CandidateJobDetails;
  workflow?: CandidateWorkflow;
}