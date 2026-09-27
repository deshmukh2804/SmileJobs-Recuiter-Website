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
      console.warn("⚠️ [Auth] 401 Unauthorized - Token invalid or expired.");
    }
    return Promise.reject(error);
  }
);

export interface SendOtpPayload {
  phone?: string;
  email?: string;
}

export interface VerifyOtpPayload {
  phone?: string;
  email?: string;
  otp: string;
  name?: string;
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
      localStorage.setItem('verihire_user', JSON.stringify(data.data.user));
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
      localStorage.setItem('verihire_user', JSON.stringify(data.data.user));
    }
    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('verihire_token');
    localStorage.removeItem('verihire_user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('verihire_user');
    return user ? JSON.parse(user) : null;
  },

  updateCachedUser: (updates: Record<string, any>) => {
    const user = localStorage.getItem('verihire_user');
    if (user) {
      const parsed = JSON.parse(user);
      const merged = { ...parsed, ...updates };
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