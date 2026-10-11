import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { usePlan } from '../context/planContext';

export default function PagoExito() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshPlanInfoAfterPayment } = usePlan();
  const renewal = params.get('renewal');
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    // Limpia la caché y actualiza la información del plan en segundo plano sin congelar la interfaz.
    refreshPlanInfoAfterPayment();
  }, [refreshPlanInfoAfterPayment]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoToDashboard = () => {
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

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
          Redirigiendo automáticamente al dashboard en {countdown} segundos...
        </Typography>

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
