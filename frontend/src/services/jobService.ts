import api from './authService';

export const jobService = {
  createJob: async (payload: any) => {
    const { data } = await api.post('/jobs', payload);
    return data;
  },

  updateJob: async (jobId: string, payload: any) => {
    const { data } = await api.put(`/jobs/${jobId}`, payload);
    return data;
  },

  listMyJobs: async () => {
    const { data } = await api.get('/jobs');
    return data;
  },

  getJob: async (jobId: string) => {
    const { data } = await api.get(`/jobs/${jobId}`);
    return data;
  },

  updateStatus: async (jobId: string, status: string) => {
    const { data } = await api.patch(`/jobs/${jobId}/status`, { status });
    return data;
  },

  deleteJob: async (jobId: string) => {
    const { data } = await api.delete(`/jobs/${jobId}`);
    return data;
  },
};