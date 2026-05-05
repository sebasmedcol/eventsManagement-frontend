import api from './api';

const ENDPOINT = '/usuarios';

export const getUsuarios = async () => {
  const response = await api.get(ENDPOINT);
  return response.data;
};

export const getUsuarioById = async (id) => {
  const response = await api.get(`${ENDPOINT}/${id}`);
  return response.data;
};

export const createUsuario = async (data) => {
  const response = await api.post(ENDPOINT, data);
  return response.data;
};

export const updateUsuario = async (id, data) => {
  const response = await api.put(`${ENDPOINT}/${id}`, data);
  return response.data;
};

export const deleteUsuario = async (id) => {
  const response = await api.delete(`${ENDPOINT}/${id}`);
  return response.data;
};

