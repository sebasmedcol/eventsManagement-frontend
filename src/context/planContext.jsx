import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

/**
 * Contexto para gestión del plan de suscripción
 * Proporciona información sobre el plan, límites y accesos a módulos/características
 */
const PlanContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const PlanProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Obtiene la información completa del plan desde el servidor
   */
  const fetchPlanInfo = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/config/plan-info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setPlanInfo(response.data.data);
      }
    } catch (err) {
      console.error('Error al obtener información del plan:', err);
      setError(err.response?.data?.message || 'Error al cargar información del plan');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Cargar información del plan al autenticarse
  useEffect(() => {
    if (isAuthenticated) {
      fetchPlanInfo();
    } else {
      setPlanInfo(null);
      setLoading(false);
    }
  }, [isAuthenticated, fetchPlanInfo]);

  /**
   * Verifica si un módulo está disponible en el plan actual
   * @param {string} moduleName - Nombre del módulo
   * @returns {boolean}
   */
  const canAccessModule = useCallback((moduleName) => {
    if (!planInfo?.modulos) return true; // Si no hay info, permitir por defecto
    return planInfo.modulos[moduleName]?.disponible === true;
  }, [planInfo]);

  /**
   * Verifica si una característica está disponible en el plan actual
   * @param {string} featureName - Nombre de la característica
   * @returns {boolean}
   */
  const canUseFeature = useCallback((featureName) => {
    if (!planInfo?.caracteristicas) return true;
    return planInfo.caracteristicas[featureName]?.disponible === true;
  }, [planInfo]);

  /**
   * Verifica el estado de un límite de recursos
   * @param {string} resourceType - Tipo de recurso (clientes, productos, etc.)
   * @returns {Object} { canCreate, limit, current, remaining, percentage, unlimited }
   */
  const checkLimit = useCallback((resourceType) => {
    if (!planInfo?.limites) {
      return {
        canCreate: true,
        limit: -1,
        current: 0,
        remaining: null,
        percentage: 0,
        unlimited: true,
      };
    }

    const limitInfo = planInfo.limites[resourceType];
    if (!limitInfo) {
      return {
        canCreate: true,
        limit: -1,
        current: 0,
        remaining: null,
        percentage: 0,
        unlimited: true,
      };
    }

    return {
      canCreate: limitInfo.canCreate,
      limit: limitInfo.limit,
      current: limitInfo.current,
      remaining: limitInfo.remaining,
      percentage: limitInfo.percentage,
      unlimited: limitInfo.unlimited,
      displayName: limitInfo.displayName,
    };
  }, [planInfo]);

  /**
   * Obtiene el mensaje de restricción para un módulo
   * @param {string} moduleName - Nombre del módulo
   * @returns {string|null}
   */
  const getModuleRestrictionMessage = useCallback((moduleName) => {
    if (canAccessModule(moduleName)) return null;
    
    const moduloNombre = planInfo?.modulos?.[moduleName]?.nombre || moduleName;
    const planNombre = planInfo?.plan?.nombre || 'actual';
    
    return `El módulo "${moduloNombre}" no está disponible en tu plan ${planNombre}. Mejora tu plan para acceder a esta funcionalidad.`;
  }, [canAccessModule, planInfo]);

  /**
   * Obtiene el mensaje de restricción para una característica
   * @param {string} featureName - Nombre de la característica
   * @returns {string|null}
   */
  const getFeatureRestrictionMessage = useCallback((featureName) => {
    if (canUseFeature(featureName)) return null;
    
    const featureNombre = planInfo?.caracteristicas?.[featureName]?.nombre || featureName;
    const planNombre = planInfo?.plan?.nombre || 'actual';
    
    return `La función "${featureNombre}" no está disponible en tu plan ${planNombre}. Mejora tu plan para usar esta función.`;
  }, [canUseFeature, planInfo]);

  /**
   * Obtiene el mensaje de límite alcanzado para un recurso
   * @param {string} resourceType - Tipo de recurso
   * @returns {string|null}
   */
  const getLimitRestrictionMessage = useCallback((resourceType) => {
    const limitInfo = checkLimit(resourceType);
    if (limitInfo.canCreate || limitInfo.unlimited) return null;
    
    const displayName = limitInfo.displayName || resourceType;
    const planNombre = planInfo?.plan?.nombre || 'actual';
    
    return `Has alcanzado el límite de ${displayName} para tu plan ${planNombre} (${limitInfo.current}/${limitInfo.limit}). Mejora tu plan para agregar más.`;
  }, [checkLimit, planInfo]);

  /**
   * Verifica si el período de prueba está activo
   */
  const isTrialActive = useCallback(() => {
    if (!planInfo?.trial) return false;
    return !planInfo.trial.expirado;
  }, [planInfo]);

  /**
   * Verifica si el período de prueba ha expirado
   */
  const isTrialExpired = useCallback(() => {
    if (!planInfo?.trial) return false;
    return planInfo.trial.expirado === true;
  }, [planInfo]);

  /**
   * Obtiene los días restantes del trial
   */
  const getTrialDaysRemaining = useCallback(() => {
    if (!planInfo?.trial) return null;
    return planInfo.trial.diasRestantes;
  }, [planInfo]);

  /**
   * Verifica si se recomienda actualizar el plan
   */
  const shouldRecommendUpgrade = useCallback(() => {
    return planInfo?.upgrade?.recomendado === true;
  }, [planInfo]);

  /**
   * Obtiene información del plan recomendado para upgrade
   */
  const getUpgradeRecommendation = useCallback(() => {
    return planInfo?.upgrade || null;
  }, [planInfo]);

  /**
   * Formatea el texto de uso de un límite
   * @param {string} resourceType - Tipo de recurso
   * @returns {string} Texto formateado (ej: "28/30" o "Ilimitado")
   */
  const formatLimitUsage = useCallback((resourceType) => {
    const limitInfo = checkLimit(resourceType);
    if (limitInfo.unlimited) return 'Ilimitado';
    return `${limitInfo.current}/${limitInfo.limit}`;
  }, [checkLimit]);

  /**
   * Obtiene el color del indicador de uso basado en el porcentaje
   * @param {string} resourceType - Tipo de recurso
   * @returns {string} Color del indicador (success, warning, error)
   */
  const getUsageColor = useCallback((resourceType) => {
    const limitInfo = checkLimit(resourceType);
    if (limitInfo.unlimited) return 'success';
    
    if (limitInfo.percentage >= 100) return 'error';
    if (limitInfo.percentage >= 80) return 'warning';
    return 'success';
  }, [checkLimit]);

  const value = {
    // Estado
    planInfo,
    loading,
    error,
    
    // Plan actual
    currentPlan: planInfo?.plan || null,
    
    // Verificaciones de acceso
    canAccessModule,
    canUseFeature,
    checkLimit,
    
    // Mensajes de restricción
    getModuleRestrictionMessage,
    getFeatureRestrictionMessage,
    getLimitRestrictionMessage,
    
    // Trial
    isTrialActive,
    isTrialExpired,
    getTrialDaysRemaining,
    trialInfo: planInfo?.trial || null,
    
    // Upgrade
    shouldRecommendUpgrade,
    getUpgradeRecommendation,
    
    // Utilidades de formato
    formatLimitUsage,
    getUsageColor,
    
    // Acciones
    refreshPlanInfo: fetchPlanInfo,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};

/**
 * Hook para acceder al contexto del plan
 */
export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan debe usarse dentro de un PlanProvider');
  }
  return context;
};

/**
 * HOC para proteger componentes basados en acceso a módulos
 * @param {React.Component} Component - Componente a proteger
 * @param {string} moduleName - Nombre del módulo requerido
 * @param {React.Component} FallbackComponent - Componente a mostrar si no tiene acceso
 */
export const withModuleAccess = (Component, moduleName, FallbackComponent = null) => {
  return function WithModuleAccessWrapper(props) {
    const { canAccessModule, getModuleRestrictionMessage } = usePlan();
    
    if (!canAccessModule(moduleName)) {
      if (FallbackComponent) {
        return <FallbackComponent message={getModuleRestrictionMessage(moduleName)} />;
      }
      return null;
    }
    
    return <Component {...props} />;
  };
};

/**
 * HOC para proteger componentes basados en características
 * @param {React.Component} Component - Componente a proteger
 * @param {string} featureName - Nombre de la característica requerida
 * @param {React.Component} FallbackComponent - Componente a mostrar si no tiene acceso
 */
export const withFeatureAccess = (Component, featureName, FallbackComponent = null) => {
  return function WithFeatureAccessWrapper(props) {
    const { canUseFeature, getFeatureRestrictionMessage } = usePlan();
    
    if (!canUseFeature(featureName)) {
      if (FallbackComponent) {
        return <FallbackComponent message={getFeatureRestrictionMessage(featureName)} />;
      }
      return null;
    }
    
    return <Component {...props} />;
  };
};

export default PlanContext;
