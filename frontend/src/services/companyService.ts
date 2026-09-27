import api from './authService';

export const companyService = {
  getProfile: async () => {
    const { data } = await api.get('/company/profile');
    return data;
  },

  updateProfile: async (payload: any) => {
    const { data } = await api.put('/company/profile', payload);
    return data;
  },

  uploadLogo: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/company/logo', fd);
    return data;
  },

  // Single image upload (kept for backward compatibility)
  uploadGalleryImage: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/company/gallery', fd);
    return data;
  },

  // ⭐ NEW: Batch upload multiple images at once
  uploadGalleryImagesBatch: async (files: File[]) => {
    const fd = new FormData();
    files.forEach((file) => fd.append('files', file));
    const { data } = await api.post('/company/gallery/batch', fd);
    return data;
  },

  deleteGalleryImage: async (imageId: string) => {
    const { data } = await api.delete(`/company/gallery/${imageId}`);
    return data;
  },

  uploadDocument: async (file: File, docType: string, docName: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('docType', docType);
    fd.append('docName', docName);
    const { data } = await api.post('/company/documents', fd);
    return data;
  },

  deleteDocument: async (documentId: string) => {
    const { data } = await api.delete(`/company/documents/${documentId}`);
    return data;
  },

  submitVerification: async () => {
    const { data } = await api.post('/company/submit-verification');
    return data;
  },

  autoApprove: async () => {
    const { data } = await api.post('/company/auto-approve');
    return data;
  },
};