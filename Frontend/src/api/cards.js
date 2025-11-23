import apiClient from './client.js';

export const addCard = async (boardId, cardData) => {
  const response = await apiClient.post(`/boards/${boardId}/cards`, cardData);
  return response.data;
};

export const editCard = async (cardId, cardData) => {
  const response = await apiClient.put(`/cards/${cardId}`, cardData);
  return response.data;
};

export const removeCard = async (cardId) => {
  const response = await apiClient.delete(`/cards/${cardId}`);
  return response.data;
};
