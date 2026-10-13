import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface ProfilePricing {
  price: number;
  priceInPaise: number;
  currency: string;
  minQuantity: number;
  maxQuantity: number;
  enabled: boolean;
  description: string;
}

export interface RecruiterCredits {
  _id: string;
  recruiterId: string;
  balance: number;
  totalPurchased: number;
  totalExpended: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePurchase {
  _id: string;
  recruiterId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  totalAmountInPaise: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  purchasedAt?: string;
  createdAt: string;
}

export interface UnlockedProfile {
  _id: string;
  candidateId: string;
  name: string;
  email: string;
  phone: string;
  hasResume: boolean;
  resumeUrl: string;
  headline?: string;
  location?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  profilePicture?: string;
  role?: string;
  entitlementId?: string;
  unlockedAt?: string;
  sourceCollection?: string;
}

export interface UnlockedProfilesResponse {
  profiles: UnlockedProfile[];
  totalUnlocked: number;
  credits: RecruiterCredits | null;
  _debug?: {
    totalInAdminUsersCollection: number;
    recruiterEmail: string;
    entitlementCount: number;
    hydratedCount: number;
    availableBalance: number;
  };
}

const getHeaders = () => {
  const token = localStorage.getItem('verihire_token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

export const getPricing = async (): Promise<ProfilePricing> => {
  const response = await axios.get(`${API_URL}/profile-purchase/pricing`, getHeaders());
  return response.data?.data || response.data;
};

export const getQuote = async (quantity: number) => {
  const response = await axios.get(`${API_URL}/profile-purchase/quote?quantity=${quantity}`, getHeaders());
  return response.data?.data || response.data;
};

export const createOrder = async (quantity: number) => {
  const response = await axios.post(`${API_URL}/profile-purchase/orders`, { quantity }, getHeaders());
  return response.data?.data || response.data;
};

export const verifyPayment = async (payload: {
  purchaseId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const response = await axios.post(`${API_URL}/profile-purchase/verify`, payload, getHeaders());
  return response.data?.data || response.data;
};

export const getCredits = async (): Promise<RecruiterCredits> => {
  const response = await axios.get(`${API_URL}/profile-purchase/credits`, getHeaders());
  return response.data?.data || response.data;
};

export const unlockCandidate = async (candidateId: string) => {
  const response = await axios.post(`${API_URL}/profile-purchase/unlock`, { candidateId }, getHeaders());
  return response.data?.data || response.data;
};

export const getUnlockedIds = async (): Promise<string[]> => {
  const response = await axios.get(`${API_URL}/profile-purchase/unlocked-ids`, getHeaders());
  return response.data?.data || response.data;
};

export const getUnlockedProfiles = async (): Promise<UnlockedProfilesResponse> => {
  const response = await axios.get(`${API_URL}/profile-purchase/unlocked-profiles`, getHeaders());
  return response.data?.data || response.data;
};

export const getPurchases = async (): Promise<ProfilePurchase[]> => {
  const response = await axios.get(`${API_URL}/profile-purchase/purchases`, getHeaders());
  return response.data?.data || response.data;
};

export const openResumeInNewTab = (candidateId: string): void => {
  const token = localStorage.getItem('verihire_token');
  const proxyUrl = `${API_URL}/profile-purchase/resume/${candidateId}?token=${encodeURIComponent(token || '')}`;
  window.open(proxyUrl, '_blank', 'noopener,noreferrer');
};

export const profilePurchaseService = {
  getPricing,
  getQuote,
  createOrder,
  verifyPayment,
  getCredits,
  unlockCandidate,
  getUnlockedIds,
  getUnlockedProfiles,
  getPurchases,
  openResumeInNewTab,
};

export default profilePurchaseService;