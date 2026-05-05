import api from './api';

const ENDPOINT = '/factura-consecutivo';

export const getRelacionesFacturaConsecutivo = async () => {
  const response = await api.get(ENDPOINT);
  return response.data;
};

