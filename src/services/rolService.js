import api from './api';

const ENDPOINT = '/roles';

export const getRoles = async () => {
  const response = await api.get(ENDPOINT);
  return response.data;
};

export const getRolById = async (id) => {
  const response = await api.get(`${ENDPOINT}/${id}`);
  return response.data;
};

export const createRol = async (data) => {
  const response = await api.post(ENDPOINT, data);
  return response.data;
};

export const updateRol = async (id, data) => {
  const response = await api.put(`${ENDPOINT}/${id}`, data);
  return response.data;
};

export const deleteRol = async (id) => {
  const response = await api.delete(`${ENDPOINT}/${id}`);
  return response.data;
};
