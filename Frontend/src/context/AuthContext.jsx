import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginAPI, register as registerAPI, logout as logoutAPI } from '../api/auth.js';
import { getTeams as getTeamsAPI } from '../api/teams.js';
import { getMyInvitations } from '../api/invitations.js';
import { getAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [inviteCount, setInviteCount] = useState(0);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const teamsData = await getTeamsAPI();
      if (teamsData.success) {
        setTeams(teamsData.data);
        setUser({ authenticated: true });
        await refreshInvitations();
      }
    } catch (error) {
      console.error('Error :', error);
      logoutAPI();
      setUser(null);
      setTeams([]);
      setInviteCount(0);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await loginAPI(credentials);
      if (response.success) {
        setUser(response.data.user);
        await fetchUserData();
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerAPI(userData);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    logoutAPI();
    setUser(null);
    setTeams([]);
    setInviteCount(0);
  };

  const refreshTeams = async () => {
    try {
      const teamsData = await getTeamsAPI();
      if (teamsData.success) {
        setTeams(teamsData.data);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const refreshInvitations = async () => {
    try {
      const result = await getMyInvitations();
      if (result.success) {
        setInviteCount(result.data?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  const value = {
    user,
    teams,
    loading,
    login,
    register,
    logout,
    refreshTeams,
    refreshInvitations,
    setUser,
    isAuthenticated: !!user && !!getAuthToken(),
    inviteCount,
    setInviteCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
