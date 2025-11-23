import apiClient from './client.js';

export const getAllUsers = async () => {
  const response = await apiClient.get('/users');
  return response.data;
};


