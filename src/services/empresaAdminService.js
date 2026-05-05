import api from './api';

const ENDPOINT = '/empresas-admin';

export const getEmpresasAdmin = async () => {
  const response = await api.get(ENDPOINT);
  return response.data;
};

export const getEmpresaUsuariosAdmin = async (empresaId) => {
  const response = await api.get(`${ENDPOINT}/${empresaId}/usuarios`);
  return response.data;
};

export const aprobarEmpresaAdmin = async (empresaId) => {
  const response = await api.patch(`${ENDPOINT}/${empresaId}/aprobar`);
  return response.data;
};

export const rechazarEmpresaAdmin = async (empresaId) => {
  const response = await api.patch(`${ENDPOINT}/${empresaId}/rechazar`);
  return response.data;
};

export const bloquearEmpresaAdmin = async (empresaId) => {
  const response = await api.patch(`${ENDPOINT}/${empresaId}/bloquear`);
  return response.data;
};

export const desbloquearEmpresaAdmin = async (empresaId) => {
  const response = await api.patch(`${ENDPOINT}/${empresaId}/desbloquear`);
  return response.data;
};

export const getEstadisticasEmpresasAdmin = async () => {
  const response = await api.get(`${ENDPOINT}/stats/general`);
  return response.data;
};
