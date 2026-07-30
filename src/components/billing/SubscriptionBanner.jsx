import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../context/planContext';

const SubscriptionBanner = () => {
  const { 
    isTrialActive, 
    getTrialDaysRemaining, 
    isPaymentPastDue, 
    estadoSuscripcion,
    requiresPaymentAction,
    currentPlan,
    fechaProximoCobro,
    loading 
  } = usePlan();
  const navigate = useNavigate();

  if (loading || currentPlan?.id === 'super') return null;

  // 1. Caso: Pago Vencido (Past Due)
  if (isPaymentPastDue() || estadoSuscripcion === 'expirada') {
    return (
      <Alert 
        severity="error" 
        variant="filled"
        sx={{ borderRadius: 0, justifyContent: 'center', py: 1 }}
        action={
          <Button color="inherit" size="small" onClick={() => navigate('/checkout')}>
            ACTUALIZAR PAGO
          </Button>
        }
      >
        <AlertTitle sx={{ m: 0, fontWeight: 'bold' }}>¡Atención!</AlertTitle>
        {estadoSuscripcion === 'expirada' 
          ? 'Tu suscripción ha expirado por falta de pago. Actualiza tu método de pago para restaurar el acceso.' 
          : 'No pudimos procesar tu último pago. Actualiza tu método de pago para evitar la suspensión del servicio.'}
      </Alert>
    );
  }

  // 2. Caso: Trial Activo (menos de 4 días) o Expirado
  if (currentPlan?.id === 'free_trial') {
    const diasRestantes = getTrialDaysRemaining();
    const expirado = diasRestantes !== null && diasRestantes <= 0;

    if (expirado) {
      return (
        <Alert 
          severity="warning" 
          variant="filled"
          sx={{ borderRadius: 0, justifyContent: 'center', py: 1 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/planes')}>
              ELEGIR PLAN
            </Button>
          }
        >
          <AlertTitle sx={{ m: 0, fontWeight: 'bold' }}>Período de prueba terminado</AlertTitle>
          Tu cuenta está en modo de solo lectura. Elige un plan para continuar.
        </Alert>
      );
    }

    if (diasRestantes !== null && diasRestantes <= 3) {
      return (
        <Alert 
          severity="info" 
          variant="filled"
          sx={{ borderRadius: 0, justifyContent: 'center', py: 1 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/planes')}>
              VER PLANES
            </Button>
          }
        >
          Tu período de prueba termina en {diasRestantes} día(s). Elige un plan pronto para no perder el acceso.
        </Alert>
      );
    }
  }

  // 3. Caso: Próximo cobro (menos de 4 días)
  if (fechaProximoCobro && estadoSuscripcion === 'activa') {
    const msRestantes = new Date(fechaProximoCobro).getTime() - Date.now();
    const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));

    if (diasRestantes > 0 && diasRestantes <= 3) {
      return (
        <Alert 
          severity="info"
          sx={{ borderRadius: 0, justifyContent: 'center', py: 0.5 }}
        >
          Tu plan {currentPlan?.nombre} se renovará automáticamente en {diasRestantes} día(s).
        </Alert>
      );
    }
  }

  return null;
};

export default SubscriptionBanner;
