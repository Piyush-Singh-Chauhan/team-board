import apiClient from './client.js';

export const getTeams = async () => {
  const response = await apiClient.get('/teams');
  return response.data;
};

export const addTeam = async (teamData) => {
  const response = await apiClient.post('/teams', teamData);
  return response.data;
};

export const getTeam = async (teamId) => {
  const response = await apiClient.get(`/teams/${teamId}`);
  return response.data;
};

export const editTeam = async (teamId, teamData) => {
  const response = await apiClient.put(`/teams/${teamId}`, teamData);
  return response.data;
};

export const deleteTeam = async (teamId) => {
  const response = await apiClient.delete(`/teams/${teamId}`);
  return response.data;
};

