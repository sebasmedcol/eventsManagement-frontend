import api from './api';

const ENDPOINT = '/auth';

export const login = async (credentials) => {
  const response = await api.post(`${ENDPOINT}/login`, credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post(`${ENDPOINT}/register`, userData);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get(`${ENDPOINT}/profile`);
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await api.put(`${ENDPOINT}/profile`, userData);
  return response.data;
};

export const checkAuth = async () => {
  const response = await api.get(`${ENDPOINT}/check`);
  return response.data;
};
