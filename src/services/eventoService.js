import api from './api';

const EVENTOS_URL = '/eventos';

export const fetchEventos = (params = {}) => {
  return api.get(EVENTOS_URL, { params });
};

export const fetchEventoById = (id) => {
  return api.get(`${EVENTOS_URL}/${id}`);
};