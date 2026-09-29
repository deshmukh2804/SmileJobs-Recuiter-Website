import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('verihire_token');
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ [Auth] 401 Unauthorized - Token invalid or expired.');
    }
    return Promise.reject(error);
  }
);

// ✅ Helper: detect and strip legacy fake emails
const sanitizeUser = (user: any) => {
  if (!user) return user;
  const cleaned = { ...user };
  if (cleaned.email && String(cleaned.email).includes('@phone.verihire.local')) {
    cleaned.email = '';
  }
  if (cleaned.name === 'Verified Recruiter') cleaned.name = '';
  if (cleaned.companyName === 'Verihire Talent Technologies') cleaned.companyName = '';
  if (cleaned.designation === 'Lead Recruiter') cleaned.designation = '';
  return cleaned;
};

export interface SendOtpPayload {
  phone?: string;
  email?: string;
}

export interface VerifyOtpPayload {
  phone?: string;
  email?: string;
  otp: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  companyName?: string;
}

export const authService = {
  sendOtp: async (payload: SendOtpPayload) => {
    const { data } = await api.post('/auth/send-otp', {
      ...payload,
      role: 'recruiter',
    });
    return data;
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    const { data } = await api.post('/auth/verify-otp', {
      ...payload,
      role: 'recruiter',
    });
    if (data?.data?.token) {
      localStorage.setItem('verihire_token', data.data.token);
      const cleaned = sanitizeUser(data.data.user);
      localStorage.setItem('verihire_user', JSON.stringify(cleaned));
      data.data.user = cleaned;
    }
    return data;
  },

  googleLogin: async (accessToken: string) => {
    const { data } = await api.post('/auth/google', {
      accessToken,
      role: 'recruiter',
    });
    if (data?.data?.token) {
      localStorage.setItem('verihire_token', data.data.token);
      const cleaned = sanitizeUser(data.data.user);
      localStorage.setItem('verihire_user', JSON.stringify(cleaned));
      data.data.user = cleaned;
    }
    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore
    }
    localStorage.removeItem('verihire_token');
    localStorage.removeItem('verihire_user');
  },

  // ✅ Force-refresh from server (source of truth)
  fetchMe: async () => {
    const { data } = await api.get('/auth/me');
    if (data?.data?.user) {
      const cleaned = sanitizeUser(data.data.user);
      localStorage.setItem('verihire_user', JSON.stringify(cleaned));
      return cleaned;
    }
    return null;
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await api.put('/auth/profile', payload);
    if (data?.data?.user) {
      const cleaned = sanitizeUser(data.data.user);
      localStorage.setItem('verihire_user', JSON.stringify(cleaned));
      return cleaned;
    }
    return null;
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('verihire_user');
    if (!user) return null;
    try {
      const parsed = JSON.parse(user);
      const cleaned = sanitizeUser(parsed);
      // Persist cleaned version back so cache stays clean
      localStorage.setItem('verihire_user', JSON.stringify(cleaned));
      return cleaned;
    } catch {
      return null;
    }
  },

  updateCachedUser: (updates: Record<string, any>) => {
    const user = localStorage.getItem('verihire_user');
    if (user) {
      const parsed = JSON.parse(user);
      const merged = sanitizeUser({ ...parsed, ...updates });
      localStorage.setItem('verihire_user', JSON.stringify(merged));
      return merged;
    }
    return null;
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('verihire_token');
    return !!token && token !== 'null' && token !== 'undefined';
  },
};

export default api;