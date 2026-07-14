import apiClient from './api';

export const reportService = {
  getEmployeeFeedbackReport: async (params = {}) => {
    const response = await apiClient.get('/reports/employee-feedback', { params });
    return response.data.data;
  },

  getCompanyReport: async () => {
    const response = await apiClient.get('/reports/company');
    return response.data.data;
  },

  getDepartmentReport: async () => {
    const response = await apiClient.get('/reports/department');
    return response.data.data;
  },

  downloadReport: async (endpoint, params = {}) => {
    const response = await apiClient.get(endpoint, { params: { ...params, format: 'excel' }, responseType: 'blob' });
    return response.data;
  },

  deleteFeedback: async (feedbackId) => {
    const response = await apiClient.delete(`/feedback/${feedbackId}`);
    return response.data;
  },

  updateFeedback: async (feedbackId, data) => {
    const response = await apiClient.put(`/feedback/${feedbackId}`, data);
    return response.data;
  }
};
