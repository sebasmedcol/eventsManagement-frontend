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
  FormControlLabel,
  Alert,
  Stack,
  Tooltip,
} from '@mui/material';
import { usePlan } from '../context/planContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';

const Suscripcion = () => {
  const {
    currentPlan,
    estadoSuscripcion,
    fechaProximoCobro,
    autoRenovacion,
    loading,
    refreshPlanInfo,
    requiresPaymentAction,
  } = usePlan();
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

  const handleConciliar = async () => {
    try {
      setProcesando(true);
      const { data } = await api.post('/subscriptions/reconcile', { minutosAtras: 15, forzar: true });
      toast.success(
        data.data?.error > 0
          ? `Conciliación ejecutada (${data.data?.error || 0} con error)`
          : 'Conciliación ejecutada correctamente.'
      );
      await Promise.all([refreshPlanInfo(), (async () => {
        const r = await api.get('/subscriptions/payments');
        if (r.data.success) setPagos(r.data.data);
      })()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al conciliar pagos.');
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
  const isPaid = !isTrial && currentPlan && currentPlan?.id !== 'super';
  const requiereAccionPorContexto = typeof requiresPaymentAction === 'function' ? requiresPaymentAction() : false;
  const esRequierePago =
    ['past_due', 'expirada', 'cancelada', 'pendiente_pago'].includes(estadoSuscripcion) ||
    (isPaid && requiereAccionPorContexto);
  const esActiva = estadoSuscripcion === 'activa';
  const esVencida = ['past_due', 'expirada', 'cancelada'].includes(estadoSuscripcion);
  const esPeriodoVencidoConEstadoActivo = esRequierePago && esActiva;

  const estadoChipColor = (estado) => {
    if (esPeriodoVencidoConEstadoActivo) return 'warning';
    if (estado === 'activa') return 'success';
    if (estado === 'past_due' || estado === 'pendiente_pago') return 'warning';
    return 'error';
  };

  const etiquetaEstado = () => {
    if (esPeriodoVencidoConEstadoActivo) return 'VENCIDO';
    return estadoSuscripcion?.toUpperCase();
  };

  const mensajeAlertaEstado = () => {
    if (estadoSuscripcion === 'past_due') return 'Tu pago del mes está pendiente. Actualiza o paga ahora para mantener el acceso completo a tus funciones.';
    if (estadoSuscripcion === 'expirada') return 'Tu suscripción expiró. Realiza el pago para reactivar tu plan y recuperar todas las funciones.';
    if (estadoSuscripcion === 'cancelada') return 'Tu renovación automática fue cancelada y el período finalizó. Renueva ahora para continuar con tu plan.';
    if (estadoSuscripcion === 'pendiente_pago') return 'Tienes un intento de pago pendiente o iniciado. Puedes pagar ahora o volver a intentarlo.';
    if (esPeriodoVencidoConEstadoActivo) return 'Tu período actual ya venció. Aunque el estado todavía figure como activo, ya necesitas renovar para seguir usando el plan normalmente.';
    return '';
  };

  const etiquetaAccionPago = () => {
    if (estadoSuscripcion === 'expirada' || estadoSuscripcion === 'cancelada') return 'Reactivar y Pagar Ahora';
    if (estadoSuscripcion === 'past_due') return 'Pagar Ahora — Pago Vencido';
    if (estadoSuscripcion === 'pendiente_pago') return 'Completar Pago Ahora';
    if (esPeriodoVencidoConEstadoActivo) return 'Renovar y Pagar Ahora';
    return 'Pagar Ahora';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gestión de Suscripción
      </Typography>

      {isPaid && (esVencida || esPeriodoVencidoConEstadoActivo) && (
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {estadoSuscripcion === 'past_due'
              ? 'Pago vencido'
              : esPeriodoVencidoConEstadoActivo
                ? 'Plan vencido'
                : 'Suscripción inactiva'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {mensajeAlertaEstado()}
          </Typography>
        </Alert>
      )}

      {isPaid && estadoSuscripcion === 'pendiente_pago' && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2">{mensajeAlertaEstado()}</Typography>
        </Alert>
      )}

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
                label={etiquetaEstado()}
                color={estadoChipColor(estadoSuscripcion)}
                size="small" 
              />
            </Box>

            {isPaid && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Renovación Automática
                </Typography>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={autoRenovacion && esActiva} 
                      onChange={handleToggleRenovacion}
                      disabled={procesando || !esActiva || esRequierePago}
                    />
                  }
                  label={
                    esRequierePago
                      ? 'Disponible luego de pagar'
                      : !esActiva
                      ? (estadoSuscripcion === 'expirada' || estadoSuscripcion === 'cancelada')
                        ? 'Disponible luego de reactivar'
                        : 'Disponible luego de pagar'
                      : (autoRenovacion ? 'Activada' : 'Desactivada')
                  }
                />
              </Box>
            )}

          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {isTrial ? 'Período de Prueba' : (esRequierePago ? 'Último estado del cobro' : 'Próximo Cobro')}
              </Typography>
              
              <Typography variant="h6" fontWeight="bold">
                {fechaProximoCobro 
                  ? new Date(fechaProximoCobro).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'N/A'
                }
              </Typography>

              {isPaid && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Monto: <strong>${(currentPlan?.precio || 0).toLocaleString('es-CO')} COP</strong>
                </Typography>
              )}

              <Stack spacing={2} sx={{ mt: 3 }}>
                {isTrial && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigate('/planes')}
                    fullWidth
                  >
                    Adquirir Plan
                  </Button>
                )}

                {isPaid && (
                  <>
                    {esRequierePago ? (
                      <Button
                        variant="contained"
                        color={estadoSuscripcion === 'expirada' || estadoSuscripcion === 'cancelada' ? 'error' : 'warning'}
                        startIcon={<PaymentIcon />}
                        onClick={() => navigate(`/checkout?plan=${currentPlan?.id}&mode=renovar`)}
                        size="large"
                        fullWidth
                        sx={{ fontWeight: 'bold' }}
                      >
                        {etiquetaAccionPago()}
                      </Button>
                    ) : (
                      <Button 
                        variant="outlined" 
                        startIcon={<CreditCardIcon />}
                        onClick={() => navigate(`/checkout?plan=${currentPlan?.id}&mode=update_card`)}
                        fullWidth
                      >
                        Actualizar Tarjeta
                      </Button>
                    )}

                    {esRequierePago ? (
                      <Tooltip
                        arrow
                        title="Revisa en Wompi si hay pagos pendientes o desactualizados y sincroniza el estado real de tu suscripción. No realiza un cobro nuevo."
                      >
                        <span>
                          <Button
                            variant="text"
                            startIcon={<RefreshIcon />}
                            onClick={handleConciliar}
                            disabled={procesando}
                            size="small"
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            Reconciliar pagos pendientes
                          </Button>
                        </span>
                      </Tooltip>
                    ) : null}
                  </>
                )}
              </Stack>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="text" onClick={() => navigate('/planes')}>
            {isTrial ? 'Ver Planes' : 'Cambiar Plan (Upgrade/Downgrade)'}
          </Button>
        </Box>
      </Paper>

      {isPaid && (
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Historial de Pagos
            </Typography>
            <Tooltip
              arrow
              title="Vuelve a consultar en Wompi el estado de pagos pendientes o inconsistentes y actualiza este historial. No intenta cobrar otra vez."
            >
              <span>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<RefreshIcon />}
                  onClick={handleConciliar}
                  disabled={procesando}
                >
                  Conciliar pendientes
                </Button>
              </span>
            </Tooltip>
          </Box>
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
