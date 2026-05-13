import api from './api';

const EVENTOS_URL = '/eventos';
const EVENTOS_PREMIUM_URL = '/eventos-premium';

export const fetchEventos = (params = {}) => {
  return api.get(EVENTOS_URL, { params });
};

export const fetchEventoById = (id) => {
  return api.get(`${EVENTOS_URL}/${id}`);
};

export const fetchEventosPremium = () => {
  return api.get(EVENTOS_PREMIUM_URL);
};

export const fetchEventoPremiumById = (id) => {
  return api.get(`${EVENTOS_PREMIUM_URL}/${id}`);
};

export const createEventoPremium = (payload) => {
  return api.post(EVENTOS_PREMIUM_URL, payload);
};

export const updateEventoPremium = (id, payload) => {
  return api.put(`${EVENTOS_PREMIUM_URL}/${id}`, payload);
};

export const deleteEventoPremium = (id) => {
  return api.delete(`${EVENTOS_PREMIUM_URL}/${id}`);
};

export const fetchUsuariosEmpresaPremiumEventos = () => {
  return api.get(`${EVENTOS_PREMIUM_URL}/usuarios`);
};

export const fetchNotificacionesEventosPremium = () => {
  return api.get(`${EVENTOS_PREMIUM_URL}/notificaciones`);
};

export const marcarNotificacionEventosPremiumLeida = (fichaId) => {
  return api.put(`${EVENTOS_PREMIUM_URL}/notificaciones/${fichaId}/leida`);
};

export const fetchFichasEventoPremium = (eventoId) => {
  return api.get(`${EVENTOS_PREMIUM_URL}/${eventoId}/fichas`);
};

export const createFichaEventoPremium = (eventoId, payload) => {
  return api.post(`${EVENTOS_PREMIUM_URL}/${eventoId}/fichas`, payload);
};

export const updateFichaEventoPremium = (fichaId, payload) => {
  return api.put(`${EVENTOS_PREMIUM_URL}/fichas/${fichaId}`, payload);
};

export const deleteFichaEventoPremium = (fichaId) => {
  return api.delete(`${EVENTOS_PREMIUM_URL}/fichas/${fichaId}`);
};

export const fetchFichaEventoPremium = (fichaId) => {
  return api.get(`${EVENTOS_PREMIUM_URL}/fichas/${fichaId}`);
};

export const addProductoFichaEventoPremium = (fichaId, payload) => {
  return api.post(`${EVENTOS_PREMIUM_URL}/fichas/${fichaId}/productos`, payload);
};

export const updateProductoFichaEventoPremium = (fichaId, itemId, payload) => {
  return api.put(
    `${EVENTOS_PREMIUM_URL}/fichas/${fichaId}/productos/${itemId}`,
    payload
  );
};

export const deleteProductoFichaEventoPremium = (fichaId, itemId) => {
  return api.delete(`${EVENTOS_PREMIUM_URL}/fichas/${fichaId}/productos/${itemId}`);
};
