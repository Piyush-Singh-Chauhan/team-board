import apiClient, { setAuthToken, clearAuthToken } from './client.js';

export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

export const verifyCode = async (email, otp) => {
  const response = await apiClient.post('/auth/verify-otp', { email, otp });
  if (response.data.success && response.data.data.token) {
    setAuthToken(response.data.data.token);
  }
  return response.data;
};

export const resendCode = async (email) => {
  const response = await apiClient.post('/auth/resend-otp', { email });
  return response.data;
};

export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  if (response.data.success && response.data.data.token) {
    setAuthToken(response.data.data.token);
  }
  return response.data;
};

export const logout = () => {
  clearAuthToken();
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resendForgotPasswordOTP = async (email) => {
  const response = await apiClient.post('/auth/resend-forgot-password-otp', { email });
  return response.data;
};

export const verifyForgotPasswordOTP = async (email, otp) => {
  const response = await apiClient.post('/auth/verify-forgot-password-otp', { email, otp });
  return response.data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', { email, otp, newPassword });
  return response.data;
};
