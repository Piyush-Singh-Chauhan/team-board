import apiClient from './client.js';

export const sendTeamInvite = async (teamId, inviteeId, role = 'member') => {
  const response = await apiClient.post(`/teams/${teamId}/invitations`, { inviteeId, role });
  return response.data;
};

export const getMyInvitations = async () => {
  const response = await apiClient.get('/invitations');
  return response.data;
};

export const respondToInvitation = async (inviteId, action) => {
  const response = await apiClient.patch(`/invitations/${inviteId}`, { action });
  return response.data;
};


