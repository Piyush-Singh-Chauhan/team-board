import apiClient from './client.js';

export const getBoards = async (teamId) => {
  const response = await apiClient.get(`/teams/${teamId}/boards`);
  return response.data;
};

export const addBoard = async (teamId, boardData) => {
  const response = await apiClient.post(`/teams/${teamId}/boards`, boardData);
  return response.data;
};

export const getBoard = async (boardId) => {
  const response = await apiClient.get(`/boards/${boardId}`);
  return response.data;
};

export const editBoard = async (boardId, boardData) => {
  const response = await apiClient.put(`/boards/${boardId}`, boardData);
  return response.data;
};

export const deleteBoard = async (boardId) => {
  const response = await apiClient.delete(`/boards/${boardId}`);
  return response.data;
};

export const moveCards = async (boardId, reorderData) => {
  const response = await apiClient.post(`/boards/${boardId}/cards/order`, reorderData);
  return response.data;
};
