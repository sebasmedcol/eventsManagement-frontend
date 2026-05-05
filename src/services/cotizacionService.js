import api from './api';

const ENDPOINT = '/cotizaciones';

export const getCotizaciones = async () => {
  const response = await api.get(ENDPOINT);
  return response.data;
};

export const getCotizacionById = async (id) => {
  const response = await api.get(`${ENDPOINT}/${id}`);
  return response.data;
};

export const createCotizacion = async (data) => {
  const response = await api.post(ENDPOINT, data);
  return response.data;
};

export const updateCotizacion = async (id, data) => {
  const response = await api.put(`${ENDPOINT}/${id}`, data);
  return response.data;
};

export const deleteCotizacion = async (id) => {
  const response = await api.delete(`${ENDPOINT}/${id}`);
  return response.data;
};

export const convertirCotizacionAVenta = async (id, data) => {
  const response = await api.post(`${ENDPOINT}/${id}/convertir-a-venta`, data);
  return response.data;
};

