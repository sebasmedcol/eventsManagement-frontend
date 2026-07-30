import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Box, 
  Button, 
  Chip, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { usePlan } from '../context/planContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import CreditCardIcon from '@mui/icons-material/CreditCard';

const Suscripcion = () => {
  const { currentPlan, estadoSuscripcion, fechaProximoCobro, autoRenovacion, loading, refreshPlanInfo } = usePlan();
  const navigate = useNavigate();
  
  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(true);
  
  const [openCancel, setOpenCancel] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!loading && currentPlan?.id === 'super') {
      navigate('/dashboard');
    }
  }, [loading, currentPlan, navigate]);

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const response = await api.get('/subscriptions/payments');
        if (response.data.success) {
          setPagos(response.data.data);
        }
      } catch (error) {
        console.error('Error al cargar pagos:', error);
      } finally {
        setLoadingPagos(false);
      }
    };

    fetchPagos();
  }, []);

  const handleToggleRenovacion = async () => {
    if (autoRenovacion) {
      setOpenCancel(true);
    } else {
      try {
        setProcesando(true);
        const res = await api.post('/subscriptions/reactivate');
        toast.success(res.data.message);
        await refreshPlanInfo();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al reactivar la suscripción');
      } finally {
        setProcesando(false);
      }
    }
  };

  const confirmarCancelacion = async () => {
    try {
      setProcesando(true);
      const res = await api.post('/subscriptions/cancel');
      toast.success(res.data.message);
      await refreshPlanInfo();
      setOpenCancel(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cancelar la suscripción');
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const isTrial = currentPlan?.id === 'free_trial';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gestión de Suscripción
      </Typography>

      <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase">
              Plan Actual
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                {currentPlan?.nombre}
              </Typography>
              <Chip 
                label={estadoSuscripcion?.toUpperCase()} 
                color={
                  estadoSuscripcion === 'activa' ? 'success' : 
                  estadoSuscripcion === 'past_due' ? 'warning' : 'error'
                } 
                size="small" 
              />
            </Box>

            {!isTrial && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Renovación Automática
                </Typography>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={autoRenovacion} 
                      onChange={handleToggleRenovacion}
                      disabled={procesando || estadoSuscripcion === 'cancelada' || estadoSuscripcion === 'expirada'} 
                    />
                  }
                  label={autoRenovacion ? 'Activada' : 'Desactivada'}
                />
              </Box>
            )}

          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {isTrial ? 'Período de Prueba' : 'Próximo Cobro'}
              </Typography>
              
              <Typography variant="h6" fontWeight="bold">
                {fechaProximoCobro 
                  ? new Date(fechaProximoCobro).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'N/A'
                }
              </Typography>

              {!isTrial && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Monto: <strong>${(currentPlan?.precio || 0).toLocaleString('es-CO')} COP</strong>
                </Typography>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                {!isTrial ? (
                  <Button 
                    variant="outlined" 
                    startIcon={<CreditCardIcon />}
                    onClick={() => navigate(`/checkout?plan=${currentPlan?.id}`)}
                  >
                    Actualizar Tarjeta
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigate('/planes')}
                  >
                    Adquirir Plan
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="text" onClick={() => navigate('/planes')}>
            {isTrial ? 'Ver Planes' : 'Cambiar Plan (Upgrade/Downgrade)'}
          </Button>
        </Box>
      </Paper>

      {!isTrial && (
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Historial de Pagos
          </Typography>
          {loadingPagos ? (
            <CircularProgress size={24} sx={{ my: 2 }} />
          ) : pagos.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay transacciones registradas.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Referencia</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagos.map((pago) => (
                    <TableRow key={pago._id}>
                      <TableCell>{new Date(pago.createdAt).toLocaleDateString('es-CO')}</TableCell>
                      <TableCell>{pago.wompiReference}</TableCell>
                      <TableCell>${(pago.montoCents / 100).toLocaleString('es-CO')}</TableCell>
                      <TableCell>{pago.tipo}</TableCell>
                      <TableCell>
                        <Chip 
                          label={pago.estado || 'PENDING'} 
                          color={pago.estado === 'APPROVED' ? 'success' : pago.estado === 'PENDING' ? 'warning' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Modal Cancelar */}
      <Dialog open={openCancel} onClose={() => !procesando && setOpenCancel(false)}>
        <DialogTitle>¿Cancelar Suscripción?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Si desactivas la renovación automática, tu plan no se cobrará en el próximo ciclo y perderás el acceso 
            a las funciones premium cuando finalice tu período actual (<strong>{fechaProximoCobro ? new Date(fechaProximoCobro).toLocaleDateString() : ''}</strong>).
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancel(false)} disabled={procesando}>Volver</Button>
          <Button onClick={confirmarCancelacion} color="error" variant="contained" disabled={procesando}>
            Sí, cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Suscripcion;
