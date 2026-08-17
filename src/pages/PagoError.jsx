import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Paper, Container, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function PagoError() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planId = params.get('plan') || 'basico';
  const status = params.get('status') || 'ERROR';

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ErrorOutlineIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Pago no completado
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Estado: {status}
        </Typography>
        <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
          No pudimos completar el pago. Puedes intentarlo de nuevo o usar otro método de pago si
          el banco rechazó la verificación.
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => navigate(`/checkout?plan=${planId}`)}>
            Reintentar pago
          </Button>
          <Button variant="outlined" onClick={() => navigate('/planes')}>
            Volver a planes
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
