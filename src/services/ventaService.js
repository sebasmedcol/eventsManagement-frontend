import api from './api';

const ENDPOINT = '/ventas';

export const getVentas = async () => {
  const response = await api.get(ENDPOINT);
  return response.data;
};

export const getVentaById = async (id) => {
  const response = await api.get(`${ENDPOINT}/${id}`);
  return response.data;
};

export const createVenta = async (ventaData) => {
  const response = await api.post(ENDPOINT, ventaData);
  return response.data;
};

export const updateVenta = async (id, ventaData) => {
  const response = await api.put(`${ENDPOINT}/${id}`, ventaData);
  return response.data;
};

export const deleteVenta = async (id) => {
  const response = await api.delete(`${ENDPOINT}/${id}`);
  return response.data;
};

export const getVentasArchivables = async () => (await api.get(`${ENDPOINT}/archivables`)).data;
export const archivarVentas = async () => (await api.post(`${ENDPOINT}/archivar`)).data;
export const getAniosArchivados = async () => (await api.get(`${ENDPOINT}/archivadas/anios`)).data;
export const getVentasArchivadas = async (anio) => (await api.get(`${ENDPOINT}/archivadas`, { params: { anio } })).data;