import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaPrint } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  CircularProgress,
  Container,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
} from '@mui/material';

const CotizacionDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasPrinted = useRef(false);

  const shouldAutoPrint = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('print') === '1';
  }, [location.search]);

  const fetchCotizacion = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cotizaciones/${id}`);
      setCotizacion(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Error al cargar los datos de la cotización'
      );
      console.error('Error al cargar cotización:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCotizacion();
  }, [fetchCotizacion]);

  useEffect(() => {
    if (!shouldAutoPrint) return;
    if (loading) return;
    if (!cotizacion) return;
    if (hasPrinted.current) return;
    hasPrinted.current = true;
    const id = setTimeout(() => {
      window.print();
    }, 250);
    return () => clearTimeout(id);
  }, [shouldAutoPrint, loading, cotizacion]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleString('es-CO');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!cotizacion) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          No se encontró la cotización solicitada.
        </Alert>
        <Button
          onClick={() => navigate('/cotizaciones')}
          variant="contained"
          startIcon={<FaArrowLeft />}
        >
          Volver a Cotizaciones
        </Button>
      </Container>
    );
  }

  const fechaExpedicion =
    cotizacion.fechaExpedicion || cotizacion.createdAt || null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        className="print-controls"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/cotizaciones')} sx={{ mr: 2 }}>
            <FaArrowLeft />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Detalle de Cotización
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={handlePrint}
            variant="contained"
            color="secondary"
            startIcon={<FaPrint />}
          >
            Imprimir
          </Button>
        </Box>
      </Box>

      <Paper
        elevation={3}
        className="print-shadow-none invoice"
        sx={{ p: 4, mb: 3 }}
      >
        <img src="/logo.png" alt="Marca de agua" className="watermark" />
        <Box className="invoice-content">
          <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ width: 96, flexShrink: 0 }}>
                <img
                  src="/logo.png"
                  alt="IAN Sonido Logo"
                  style={{ width: '96px', height: 'auto' }}
                />
              </Box>
              <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  component="h2"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                >
                  IAN SONIDO
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Cotización
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Este documento corresponde a una cotización (no es una venta).
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Identificador:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  {cotizacion._id}
                </Typography>
              </Grid>
              <Grid
                item
                xs={12}
                md={6}
                sx={{ textAlign: { xs: 'left', md: 'right' } }}
              >
                <Typography variant="body2" color="text.secondary">
                  Fecha de expedición:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  {formatDateTime(fechaExpedicion)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
              Información del Cliente
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'background.paper'
                    : 'grey.50',
              }}
            >
              <Typography variant="body1" sx={{ mb: 1 }}>
                <Typography component="span" sx={{ fontWeight: 'medium' }}>
                  Nombre:
                </Typography>{' '}
                {cotizacion.cliente?.nombreCompleto || 'No disponible'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <Typography component="span" sx={{ fontWeight: 'medium' }}>
                  Teléfono:
                </Typography>{' '}
                {cotizacion.cliente?.telefono || 'No disponible'}
              </Typography>
              <Typography variant="body1">
                <Typography component="span" sx={{ fontWeight: 'medium' }}>
                  Dirección:
                </Typography>{' '}
                {cotizacion.cliente?.direccion || 'No disponible'}
              </Typography>
            </Paper>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
              Información del Servicio
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'background.paper'
                    : 'grey.50',
              }}
            >
              <Typography variant="body1">
                <Typography component="span" sx={{ fontWeight: 'medium' }}>
                  Tipo de servicio:
                </Typography>{' '}
                {cotizacion.tipoDeServicio || 'No definido'}
              </Typography>
            </Paper>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
              Productos
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Precio Unitario</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(cotizacion.productos || []).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.producto?.nombre || 'Producto'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(item.precioUnitario || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {item.cantidad}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.subtotal || 0)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Paper
              variant="outlined"
              className="print-shadow-none"
              sx={{
                width: '100%',
                maxWidth: 340,
                p: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'background.paper'
                    : 'grey.50',
                ml: 'auto',
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', mb: 1, textAlign: 'right' }}
              >
                Resumen
              </Typography>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="subtitle2" fontWeight="bold">
                  {formatCurrency(cotizacion.total || 0)}
                </Typography>
              </Box>
            </Paper>
          </Box>

          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: 1,
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Los precios pueden cambiar de acuerdo al mercado.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              IAN SONIDO - Teléfono: 3022798519
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CotizacionDetalle;
