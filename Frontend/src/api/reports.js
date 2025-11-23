import apiClient from './client.js';

export const getTaskStats = async (teamId) => {
  const response = await apiClient.get(`/teams/${teamId}/reports/tasks-per-member`);
  return response.data;
};

export const getDeadlines = async (teamId) => {
  const response = await apiClient.get(`/teams/${teamId}/reports/near-deadlines`);
  return response.data;
};

export const getCompletion = async (teamId) => {
  const response = await apiClient.get(`/teams/${teamId}/reports/completion-percent`);
  return response.data;
};
