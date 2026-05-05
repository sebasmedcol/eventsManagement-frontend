import api from './api';

const ENDPOINT = '/clientes';

export const getClientes = async () => {
  const response = await api.get(ENDPOINT);
  return response.data;
};

export const getClienteById = async (id) => {
  const response = await api.get(`${ENDPOINT}/${id}`);
  return response.data;
};

export const createCliente = async (clienteData) => {
  const response = await api.post(ENDPOINT, clienteData);
  return response.data;
};

export const updateCliente = async (id, clienteData) => {
  const response = await api.put(`${ENDPOINT}/${id}`, clienteData);
  return response.data;
};

export const deleteCliente = async (id) => {
  const response = await api.delete(`${ENDPOINT}/${id}`);
  return response.data;
};