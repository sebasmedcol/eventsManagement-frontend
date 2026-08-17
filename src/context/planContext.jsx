import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const PlanContext = createContext(null);
const PLAN_INFO_CACHE_KEY = 'plan_info_cache';

export const PlanProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverBlock, setServerBlock] = useState(null);
  // Controla la modal de "Acceso bloqueado". Es la ÚNICA fuente de verdad
  // sobre cuándo mostrarla: se activa (a) una vez al iniciar sesión, si el
  // plan ya estaba vencido, y (b) cada vez que el backend responde 403 a
  // una petición de gestión (POST/PUT/PATCH/DELETE). NUNCA se activa por
  // el simple hecho de navegar/hacer click en un módulo.
  const [showBlockModal, setShowBlockModal] = useState(false);
  const initialBlockCheckedRef = useRef(false);

  const persistCache = useCallback((data) => {
    try { if (data) localStorage.setItem(PLAN_INFO_CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, []);
  const readCache = useCallback(() => {
    try { const raw = localStorage.getItem(PLAN_INFO_CACHE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }, []);

  const fetchPlanInfo = useCallback(async ({ fromPayment = false } = {}) => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      // Si se llama tras un pago, limpiar caché antes de la petición para
      // evitar que los datos vencidos disparen el modal de bloqueo.
      if (fromPayment) {
        try { localStorage.removeItem(PLAN_INFO_CACHE_KEY); } catch { /* ignore */ }
        initialBlockCheckedRef.current = false;
      }
      const response = await api.get('/config/plan-info');
      if (response.data.success) {
        const newPlanInfo = response.data.data;
        setPlanInfo(newPlanInfo);
        persistCache(newPlanInfo);
        // Si el plan ahora está activo (acceso no bloqueado) cerrar el modal
        // de bloqueo automáticamente (para el flujo post-pago exitoso).
        const bloqueado = newPlanInfo?.acceso?.bloqueado === true ||
          newPlanInfo?.estadoSuscripcion === 'expirada' ||
          newPlanInfo?.estadoSuscripcion === 'cancelada' ||
          newPlanInfo?.trial?.expirado === true;
        if (!bloqueado) {
          setShowBlockModal(false);
          setServerBlock(null);
        }
      }
    } catch (err) {
      console.error('Error al obtener informacion del plan:', err);
      setError(err.response?.data?.message || 'Error al cargar informacion del plan');
      const cached = readCache();
      if (cached) setPlanInfo(cached);
    } finally { setLoading(false); }
  }, [isAuthenticated, persistCache, readCache]);

  useEffect(() => {
    if (isAuthenticated) { fetchPlanInfo(); }
    else {
      setPlanInfo(null); setServerBlock(null); setLoading(false);
      setShowBlockModal(false);
      initialBlockCheckedRef.current = false;
      try { localStorage.removeItem(PLAN_INFO_CACHE_KEY); } catch { /* ignore */ }
    }
  }, [isAuthenticated, fetchPlanInfo]);

  useEffect(() => {
    const onBlocked = (e) => {
      setServerBlock(e.detail || { motivo: 'SUBSCRIPTION_EXPIRED', mensaje: 'Tu plan ha finalizado. Renueva para continuar.' });
      setShowBlockModal(true); // 403 en una petición de gestión → reabrir la modal
      fetchPlanInfo();
    };
    window.addEventListener('plan:blocked', onBlocked);
    return () => window.removeEventListener('plan:blocked', onBlocked);
  }, [fetchPlanInfo]);

  const dismissBlockModal = useCallback(() => setShowBlockModal(false), []);

  const isSuperAdminAccount = planInfo?.isSuperAdmin === true || planInfo?.plan?.id === 'super';

  const getBlockInfo = useCallback(() => {
    if (serverBlock) return serverBlock;
    if (!planInfo || isSuperAdminAccount) return null;

    if (planInfo.acceso?.bloqueado === true) {
      return {
        motivo: planInfo.acceso.motivo || 'SUBSCRIPTION_EXPIRED',
        mensaje: planInfo.acceso.mensaje || 'Tu plan ha finalizado. Renueva tu suscripcion para continuar.',
      };
    }

    const estado = planInfo.estadoSuscripcion;
    if (estado === 'expirada' || estado === 'cancelada') {
      return { motivo: 'SUBSCRIPTION_EXPIRED', mensaje: 'Tu suscripcion ha expirado. Renueva tu plan para volver a acceder.' };
    }
    if (estado === 'past_due' && planInfo.fechaProximoCobro) {
      const diasMora = Math.floor((Date.now() - new Date(planInfo.fechaProximoCobro).getTime()) / (1000 * 60 * 60 * 24));
      if (diasMora > 7) {
        return { motivo: 'SUBSCRIPTION_EXPIRED', mensaje: 'Tu pago esta vencido y el periodo de gracia termino. Actualiza tu metodo de pago para continuar.' };
      }
    }
    const periodoExpirado =
      planInfo.periodoActual?.expirado === true ||
      (Number.isFinite(planInfo.periodoActual?.diasRestantes) && planInfo.periodoActual.diasRestantes <= 0) ||
      planInfo.trial?.expirado === true;
    if (periodoExpirado) {
      const esTrial = planInfo.plan?.id === 'free_trial';
      return {
        motivo: esTrial ? 'TRIAL_EXPIRED' : 'SUBSCRIPTION_EXPIRED',
        mensaje: esTrial
          ? 'Tu periodo de prueba ha finalizado. Elige un plan para seguir usando la plataforma.'
          : 'Tu plan ha llegado a su fin. Renueva tu suscripcion para continuar.',
      };
    }
    return null;
  }, [serverBlock, planInfo, isSuperAdminAccount]);

  const isAccessBlocked = useCallback(() => getBlockInfo() !== null, [getBlockInfo]);

  // Mostrar la modal UNA sola vez al iniciar sesión (o al recargar la app
  // logueado) si el plan ya llegaba vencido. No vuelve a dispararse por
  // navegar entre módulos; solo se reactiva con el evento 'plan:blocked'
  // (arriba) cuando una petición de gestión recibe 403.
  useEffect(() => {
    if (!planInfo || initialBlockCheckedRef.current) return;
    initialBlockCheckedRef.current = true;
    if (isAccessBlocked()) setShowBlockModal(true);
  }, [planInfo, isAccessBlocked]);

  const canAccessModule = useCallback((moduleName) => {
    if (isSuperAdminAccount) return true;
    if (moduleName === 'configuracion') return true;
    if (!planInfo?.modulos) return false;
    // Nota: NO se bloquea por isAccessBlocked() aquí. Un plan vencido sigue
    // pudiendo ver/navegar sus módulos (modo solo lectura); lo que se
    // restringe es la gestión (crear/editar/eliminar), vía isReadOnlyMode()
    // en cada página. Este check solo refleja si el módulo está incluido
    // en el plan contratado (tier), no el estado de la suscripción.
    return planInfo.modulos[moduleName]?.disponible === true;
  }, [isSuperAdminAccount, planInfo]);

  const canUseFeature = useCallback((featureName) => {
    if (isSuperAdminAccount) return true;
    if (isAccessBlocked()) return false;
    if (!planInfo?.caracteristicas) return false;
    return planInfo.caracteristicas[featureName]?.disponible === true;
  }, [isSuperAdminAccount, isAccessBlocked, planInfo]);

  const checkLimit = useCallback((resourceType) => {
    const blocked = isAccessBlocked();
    if (!planInfo?.limites || !planInfo.limites[resourceType]) {
      return { canCreate: !blocked, limit: -1, current: 0, remaining: null, percentage: 0, unlimited: !blocked };
    }
    const limitInfo = planInfo.limites[resourceType];
    return {
      canCreate: blocked ? false : limitInfo.canCreate,
      limit: limitInfo.limit, current: limitInfo.current, remaining: limitInfo.remaining,
      percentage: limitInfo.percentage, unlimited: limitInfo.unlimited, displayName: limitInfo.displayName,
    };
  }, [planInfo, isAccessBlocked]);

  const getModuleRestrictionMessage = useCallback((moduleName) => {
    if (canAccessModule(moduleName)) return null;
    const b = getBlockInfo(); if (b) return b.mensaje;
    const moduloNombre = planInfo?.modulos?.[moduleName]?.nombre || moduleName;
    const planNombre = planInfo?.plan?.nombre || 'actual';
    return `El modulo "${moduloNombre}" no esta disponible en tu plan ${planNombre}. Mejora tu plan para acceder a esta funcionalidad.`;
  }, [canAccessModule, getBlockInfo, planInfo]);

  const getFeatureRestrictionMessage = useCallback((featureName) => {
    if (canUseFeature(featureName)) return null;
    const b = getBlockInfo(); if (b) return b.mensaje;
    const featureNombre = planInfo?.caracteristicas?.[featureName]?.nombre || featureName;
    const planNombre = planInfo?.plan?.nombre || 'actual';
    return `La funcion "${featureNombre}" no esta disponible en tu plan ${planNombre}. Mejora tu plan para usar esta funcion.`;
  }, [canUseFeature, getBlockInfo, planInfo]);

  const getLimitRestrictionMessage = useCallback((resourceType) => {
    const limitInfo = checkLimit(resourceType);
    if (limitInfo.canCreate || limitInfo.unlimited) return null;
    const b = getBlockInfo(); if (b) return b.mensaje;
    const displayName = limitInfo.displayName || resourceType;
    const planNombre = planInfo?.plan?.nombre || 'actual';
    return `Has alcanzado el limite de ${displayName} para tu plan ${planNombre} (${limitInfo.current}/${limitInfo.limit}). Mejora tu plan para agregar mas.`;
  }, [checkLimit, getBlockInfo, planInfo]);

  const isTrialActive = useCallback(() => (planInfo?.trial ? !planInfo.trial.expirado : false), [planInfo]);
  const isTrialExpired = useCallback(() => (planInfo?.trial ? planInfo.trial.expirado === true : false), [planInfo]);
  const isPaymentPastDue = useCallback(() => planInfo?.estadoSuscripcion === 'past_due', [planInfo]);
  const requiresPaymentAction = useCallback(() => planInfo?.requiereAccionPago === true || isAccessBlocked(), [planInfo, isAccessBlocked]);
  const isReadOnlyMode = useCallback(() => isAccessBlocked(), [isAccessBlocked]);

  const getTrialDaysRemaining = useCallback(() => {
    if (planInfo?.periodoActual && Number.isFinite(planInfo.periodoActual.diasRestantes)) return planInfo.periodoActual.diasRestantes;
    if (!planInfo?.trial) return null;
    return planInfo.trial.diasRestantes;
  }, [planInfo]);

  const shouldRecommendUpgrade = useCallback(() => planInfo?.upgrade?.recomendado === true, [planInfo]);
  const getUpgradeRecommendation = useCallback(() => planInfo?.upgrade || null, [planInfo]);
  const formatLimitUsage = useCallback((r) => { const l = checkLimit(r); return l.unlimited ? 'Ilimitado' : `${l.current}/${l.limit}`; }, [checkLimit]);
  const getUsageColor = useCallback((r) => { const l = checkLimit(r); if (l.unlimited) return 'success'; if (l.percentage >= 100) return 'error'; if (l.percentage >= 80) return 'warning'; return 'success'; }, [checkLimit]);

  const value = {
    planInfo, loading, error,
    currentPlan: planInfo?.plan || null,
    isSuperAdminAccount,
    isAccessBlocked, getBlockInfo,
    showBlockModal, dismissBlockModal,
    canAccessModule, canUseFeature, checkLimit,
    getModuleRestrictionMessage, getFeatureRestrictionMessage, getLimitRestrictionMessage,
    isTrialActive, isTrialExpired, isReadOnlyMode, getTrialDaysRemaining,
    trialInfo: planInfo?.trial || null,
    estadoSuscripcion: planInfo?.estadoSuscripcion || 'activa',
    fechaProximoCobro: planInfo?.fechaProximoCobro || null,
    autoRenovacion: planInfo?.autoRenovacion || false,
    isPaymentPastDue, requiresPaymentAction,
    shouldRecommendUpgrade, getUpgradeRecommendation,
    formatLimitUsage, getUsageColor,
    refreshPlanInfo: fetchPlanInfo,
    refreshPlanInfoAfterPayment: () => fetchPlanInfo({ fromPayment: true }),
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) throw new Error('usePlan debe usarse dentro de un PlanProvider');
  return context;
};

export const withModuleAccess = (Component, moduleName, FallbackComponent = null) => {
  return function WithModuleAccessWrapper(props) {
    const { canAccessModule, getModuleRestrictionMessage } = usePlan();
    if (!canAccessModule(moduleName)) return FallbackComponent ? <FallbackComponent message={getModuleRestrictionMessage(moduleName)} /> : null;
    return <Component {...props} />;
  };
};

export const withFeatureAccess = (Component, featureName, FallbackComponent = null) => {
  return function WithFeatureAccessWrapper(props) {
    const { canUseFeature, getFeatureRestrictionMessage } = usePlan();
    if (!canUseFeature(featureName)) return FallbackComponent ? <FallbackComponent message={getFeatureRestrictionMessage(featureName)} /> : null;
    return <Component {...props} />;
  };
};

export default PlanContext;