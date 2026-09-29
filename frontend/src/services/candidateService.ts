import api from './authService';
import { Candidate, PipelineStage } from '../types';

export const candidateService = {
  // List all candidates
  listCandidates: async (): Promise<Candidate[]> => {
    const { data } = await api.get('/candidates');
    return data?.data || [];
  },

  // Get full candidate details
  getFullDetails: async (id: string) => {
    const { data } = await api.get(`/candidates/${id}/full-details`);
    return data?.data;
  },

  // Update status (workflow)
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/candidates/${id}/status`, { status });
    return data?.data;
  },

  // Legacy: Update stage
  updateStage: async (id: string, stage: PipelineStage) => {
    const { data } = await api.patch(`/candidates/${id}/stage`, { stage });
    return data?.data;
  },

  // Bulk status update
  bulkUpdateStatus: async (ids: string[], status: string) => {
    const { data } = await api.post('/candidates/bulk-status', { ids, status });
    return data?.data;
  },

  // Bookmark toggle
  toggleBookmark: async (id: string) => {
    const { data } = await api.patch(`/candidates/${id}/bookmark`);
    return data?.data;
  },

  // Add note
  addNote: async (id: string, note: string) => {
    const { data } = await api.post(`/candidates/${id}/notes`, { note });
    return data?.data;
  },

  // Delete application
  deleteApplication: async (id: string) => {
    const { data } = await api.delete(`/candidates/${id}`);
    return data?.data;
  },
};