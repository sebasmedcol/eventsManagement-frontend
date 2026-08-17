import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { usePlan } from '../context/planContext';

export default function PagoExito() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshPlanInfoAfterPayment } = usePlan();
  const renewal = params.get('renewal');

  useEffect(() => {
    // Limpia la caché vieja y refresca con los nuevos datos del plan activo.
    refreshPlanInfoAfterPayment();
  }, [refreshPlanInfoAfterPayment]);

  const handleGoToDashboard = async () => {
    // Asegurarse de que el plan esté refrescado antes de navegar
    // (por si el usuario llegó directo a esta URL).
    await refreshPlanInfoAfterPayment();
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          ¡Pago exitoso!
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Tu plan ha sido activado. Ya puedes usar todas las funciones incluidas.
        </Typography>
        {renewal === 'configured' && (
          <Typography color="success.main" sx={{ mb: 2 }}>
            La auto-renovación quedó configurada con tu tarjeta.
          </Typography>
        )}
        {renewal === 'failed' && (
          <Typography color="warning.main" sx={{ mb: 2 }}>
            El plan quedó activo, pero la auto-renovación no pudo configurarse por ahora.
            Puedes reintentar este paso más adelante desde la gestión de suscripción.
          </Typography>
        )}
        {params.get('tx') && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 3 }}>
            Transacción: {params.get('tx')}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={handleGoToDashboard}>
            Ir al dashboard
          </Button>
          <Button variant="outlined" onClick={() => navigate('/planes')}>
            Ver planes
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
