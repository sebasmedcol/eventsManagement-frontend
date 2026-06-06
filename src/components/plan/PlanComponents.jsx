import React from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Button,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Lock as LockIcon,
  Upgrade as UpgradeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { usePlan } from '../../context/PlanContext';

/**
 * Componente que envuelve contenido y lo restringe basado en acceso a modulos
 */
export const PlanRestricted = ({ 
  moduleName, 
  children, 
  showMessage = true,
  fallback = null,
}) => {
  const { canAccessModule, getModuleRestrictionMessage } = usePlan();
  
  if (canAccessModule(moduleName)) {
    return children;
  }
  
  if (fallback) {
    return fallback;
  }
  
  if (!showMessage) {
    return null;
  }
  
  const message = getModuleRestrictionMessage(moduleName);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        textAlign: 'center',
        minHeight: 200,
        bgcolor: 'grey.50',
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'grey.300',
      }}
    >
      <LockIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Modulo no disponible
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 2 }}>
        {message}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<UpgradeIcon />}
        href="/planes"
      >
        Ver planes disponibles
      </Button>
    </Box>
  );
};

/**
 * Componente que envuelve contenido y lo restringe basado en caracteristicas
 */
export const FeatureRestricted = ({ 
  featureName, 
  children, 
  showMessage = true,
  fallback = null,
}) => {
  const { canUseFeature, getFeatureRestrictionMessage } = usePlan();
  
  if (canUseFeature(featureName)) {
    return children;
  }
  
  if (fallback) {
    return fallback;
  }
  
  if (!showMessage) {
    return null;
  }
  
  const message = getFeatureRestrictionMessage(featureName);
  
  return (
    <Tooltip title={message} arrow>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', opacity: 0.5 }}>
        {children}
        <LockIcon sx={{ fontSize: 16, ml: 0.5, color: 'grey.500' }} />
      </Box>
    </Tooltip>
  );
};

/**
 * Boton con verificacion de limites
 */
export const LimitedButton = ({
  resourceType,
  children,
  onClick,
  disabled = false,
  showUsage = true,
  ...buttonProps
}) => {
  const { checkLimit, getLimitRestrictionMessage, formatLimitUsage, getUsageColor } = usePlan();
  
  const limitInfo = checkLimit(resourceType);
  const canCreate = limitInfo.canCreate;
  const message = getLimitRestrictionMessage(resourceType);
  const usageText = formatLimitUsage(resourceType);
  const usageColor = getUsageColor(resourceType);
  
  const button = (
    <Button
      onClick={canCreate ? onClick : undefined}
      disabled={disabled || !canCreate}
      {...buttonProps}
      sx={{
        ...buttonProps.sx,
        position: 'relative',
      }}
    >
      {children}
      {showUsage && !limitInfo.unlimited && (
        <Chip
          label={usageText}
          size="small"
          color={usageColor}
          sx={{
            ml: 1,
            height: 20,
            fontSize: '0.7rem',
          }}
        />
      )}
      {!canCreate && (
        <LockIcon sx={{ ml: 1, fontSize: 16 }} />
      )}
    </Button>
  );
  
  if (!canCreate && message) {
    return (
      <Tooltip title={message} arrow>
        <span>{button}</span>
      </Tooltip>
    );
  }
  
  return button;
};

/**
 * Indicador de uso de recursos
 */
export const UsageIndicator = ({ 
  resourceType, 
  showLabel = true, 
  showProgress = true,
  size = 'medium',
}) => {
  const { checkLimit, formatLimitUsage, getUsageColor } = usePlan();
  
  const limitInfo = checkLimit(resourceType);
  const usageText = formatLimitUsage(resourceType);
  const usageColor = getUsageColor(resourceType);
  
  if (limitInfo.unlimited) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showLabel && (
          <Typography variant={size === 'small' ? 'caption' : 'body2'} color="text.secondary">
            {limitInfo.displayName}:
          </Typography>
        )}
        <Chip
          label="Ilimitado"
          size="small"
          color="success"
          variant="outlined"
          icon={<CheckCircleIcon />}
        />
      </Box>
    );
  }
  
  const getColorValue = (color) => {
    switch (color) {
      case 'error': return 'error.main';
      case 'warning': return 'warning.main';
      default: return 'success.main';
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: size === 'small' ? 80 : 120 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {showLabel && (
          <Typography variant={size === 'small' ? 'caption' : 'body2'} color="text.secondary">
            {limitInfo.displayName}
          </Typography>
        )}
        <Typography 
          variant={size === 'small' ? 'caption' : 'body2'} 
          fontWeight="medium"
          color={getColorValue(usageColor)}
        >
          {usageText}
        </Typography>
      </Box>
      {showProgress && (
        <LinearProgress
          variant="determinate"
          value={Math.min(limitInfo.percentage, 100)}
          color={usageColor}
          sx={{
            height: size === 'small' ? 4 : 6,
            borderRadius: 1,
            bgcolor: 'grey.200',
          }}
        />
      )}
    </Box>
  );
};

/**
 * Banner de trial con cuenta regresiva
 */
export const TrialBanner = ({ onClose, variant = 'standard' }) => {
  const { isTrialActive, isTrialExpired, getTrialDaysRemaining, trialInfo } = usePlan();
  
  if (!trialInfo) return null;
  
  const diasRestantes = getTrialDaysRemaining();
  
  if (isTrialExpired()) {
    return (
      <Alert 
        severity="error" 
        variant="filled"
        sx={{ borderRadius: 0 }}
        action={
          <Button color="inherit" size="small" href="/planes">
            Ver planes
          </Button>
        }
      >
        <AlertTitle>Tu periodo de prueba ha expirado</AlertTitle>
        Por favor, selecciona un plan para continuar usando NextEvents.
      </Alert>
    );
  }
  
  if (isTrialActive() && diasRestantes <= 7) {
    const severity = diasRestantes <= 3 ? 'warning' : 'info';
    
    return (
      <Alert 
        severity={severity}
        variant={variant}
        sx={{ borderRadius: 0 }}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" size="small" href="/planes">
              Ver planes
            </Button>
            {onClose && (
              <IconButton color="inherit" size="small" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        }
      >
        <AlertTitle>
          {diasRestantes === 0 
            ? 'Ultimo dia de prueba' 
            : diasRestantes === 1 
              ? 'Queda 1 dia de prueba'
              : `Quedan ${diasRestantes} dias de prueba`
          }
        </AlertTitle>
        Aprovecha para explorar todas las funcionalidades antes de que termine tu periodo de prueba.
      </Alert>
    );
  }
  
  return null;
};

/**
 * Card de recomendacion de upgrade
 */
export const UpgradeRecommendation = ({ variant = 'outlined' }) => {
  const { shouldRecommendUpgrade, getUpgradeRecommendation, currentPlan } = usePlan();
  
  if (!shouldRecommendUpgrade()) return null;
  
  const recommendation = getUpgradeRecommendation();
  
  return (
    <Paper 
      variant={variant}
      sx={{ 
        p: 2, 
        bgcolor: 'primary.50',
        borderColor: 'primary.200',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <UpgradeIcon sx={{ color: 'primary.main', mt: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Listo para crecer?
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {recommendation.razon}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Actualiza a <strong>{recommendation.planNombre}</strong> por solo ${recommendation.precio}/mes
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="small" 
            href="/planes"
            sx={{ mt: 1 }}
          >
            Ver beneficios
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

/**
 * Tooltip con icono de informacion sobre restriccion de plan
 */
export const PlanInfoTooltip = ({ message }) => {
  return (
    <Tooltip title={message} arrow>
      <IconButton size="small" sx={{ ml: 0.5 }}>
        <InfoIcon fontSize="small" color="action" />
      </IconButton>
    </Tooltip>
  );
};

/**
 * Icono de candado para elementos bloqueados
 */
export const LockedIcon = ({ tooltip, size = 'small' }) => {
  const icon = <LockIcon fontSize={size} sx={{ color: 'grey.400' }} />;
  
  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {icon}
      </Tooltip>
    );
  }
  
  return icon;
};

/**
 * Badge que indica el plan actual
 */
/**
 * Banner que se muestra cuando el periodo de prueba ha expirado.
 * Avisa al usuario que está en modo solo lectura y lo invita a seleccionar un plan.
 */
export const TrialExpiredBanner = () => {
  const { isTrialExpired } = usePlan();

  if (!isTrialExpired()) return null;

  return (
    <Alert
      severity="warning"
      icon={<LockIcon />}
      sx={{ mb: 2, borderRadius: 2 }}
      action={
        <Button
          color="warning"
          size="small"
          variant="contained"
          startIcon={<UpgradeIcon />}
          href="/planes"
        >
          Ver planes
        </Button>
      }
    >
      <AlertTitle>Periodo de prueba expirado — Modo solo lectura</AlertTitle>
      Tu prueba gratuita ha terminado. Puedes consultar toda tu información, pero no podrás crear, editar
      ni eliminar registros hasta que selecciones un plan.
    </Alert>
  );
};

export const PlanBadge = ({ showName = true }) => {
  const { currentPlan } = usePlan();
  
  if (!currentPlan) return null;
  
  const getColor = () => {
    switch (currentPlan.id) {
      case 'premium': return 'success';
      case 'pro': return 'primary';
      case 'basico': return 'info';
      default: return 'default';
    }
  };
  
  return (
    <Chip
      label={showName ? `Plan ${currentPlan.nombre}` : currentPlan.nombre}
      color={getColor()}
      size="small"
      variant="outlined"
    />
  );
};

/**
 * Resumen de uso de recursos
 */
export const UsageSummary = ({ resources = ['clientes', 'productos', 'ventas', 'eventos'] }) => {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Uso de tu plan
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {resources.map((resource) => (
          <UsageIndicator 
            key={resource} 
            resourceType={resource} 
            size="small"
          />
        ))}
      </Box>
    </Paper>
  );
};

// Export individual components
export {
  PlanRestricted as default,
};
