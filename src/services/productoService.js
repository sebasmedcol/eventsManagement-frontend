import api from './api';

const ENDPOINT = '/productos';

export const getProductos = async () => {
  const response = await api.get(ENDPOINT);
  return response.data;
};

export const getProductoById = async (id) => {
  const response = await api.get(`${ENDPOINT}/${id}`);
  return response.data;
};

export const createProducto = async (productoData) => {
  const response = await api.post(ENDPOINT, productoData);
  return response.data;
};

export const updateProducto = async (id, productoData) => {
  const response = await api.put(`${ENDPOINT}/${id}`, productoData);
  return response.data;
};

export const deleteProducto = async (id) => {
  const response = await api.delete(`${ENDPOINT}/${id}`);
  return response.data;
};