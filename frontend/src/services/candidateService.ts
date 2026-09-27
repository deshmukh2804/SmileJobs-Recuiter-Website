import api from './authService';
import { Candidate, PipelineStage } from '../types';

export const candidateService = {
  listCandidates: async (): Promise<Candidate[]> => {
    const { data } = await api.get('/candidates');
    return data?.data || [];
  },

  updateStage: async (id: string, stage: PipelineStage) => {
    const { data } = await api.patch(`/candidates/${id}/stage`, { stage });
    return data?.data;
  },

  toggleBookmark: async (id: string) => {
    const { data } = await api.patch(`/candidates/${id}/bookmark`);
    return data?.data;
  },

  addNote: async (id: string, note: string) => {
    const { data } = await api.post(`/candidates/${id}/notes`, { note });
    return data?.data;
  },
};