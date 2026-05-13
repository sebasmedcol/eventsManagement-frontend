import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPrint } from 'react-icons/fa';
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
  Divider
} from '@mui/material';

const CONFIG_STORAGE_KEY = 'ian_config';

const readStoredConfig = () => {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const buildLogoDataUrl = (logo) => {
  if (!logo?.format || !logo?.dataBase64) return '';
  if (logo.format === 'svg') return `data:image/svg+xml;base64,${logo.dataBase64}`;
  if (logo.format === 'webp') return `data:image/webp;base64,${logo.dataBase64}`;
  return '';
};

const VentaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(() => readStoredConfig());

  const fetchVenta = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ventas/${id}`);
      setVenta(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar los datos de la venta');
      console.error('Error al cargar venta:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVenta();
  }, [fetchVenta]);

  useEffect(() => {
    setConfig(readStoredConfig());
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    // Construir una fecha local a partir de los componentes UTC
    // para evitar el desfase de un día por la zona horaria.
    const localDate = new Date(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate()
    );
    return localDate.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          height: '100vh' 
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!venta) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          No se encontró la venta solicitada.
        </Alert>
        <Button
          onClick={() => navigate('/ventas')}
          variant="contained"
          startIcon={<FaArrowLeft />}
        >
          Volver a Ventas
        </Button>
      </Container>
    );
  }

  const empresaNombre = config?.empresa?.nombre || 'Empresa';
  const empresaNit = config?.empresa?.nit || '';
  const empresaTelefono = config?.empresa?.telefono || '';
  const mostrarLogo = config?.empresa?.mostrarLogoEnComprobante === true;
  const logoSrc = mostrarLogo ? buildLogoDataUrl(config?.empresa?.logo) : '';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box className="print-controls" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={() => navigate('/ventas')}
            sx={{ mr: 2 }}
          >
            <FaArrowLeft />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Detalle de Venta
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={() => navigate(`/ventas/editar/${venta._id}`)}
            variant="contained"
            color="primary"
            startIcon={<FaEdit />}
          >
            Editar
          </Button>
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

      <Paper elevation={3} className="print-shadow-none invoice" sx={{ p: 4, mb: 3 }}>
        {/* Marca de agua detrás del contenido */}
        <img src="/logo.png" alt="Marca de agua" className="watermark" />
        <Box className="invoice-content">
          {/* Encabezado */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              {/* Logo arriba a la izquierda */}
              <Box sx={{ width: 96, flexShrink: 0 }}>
                {logoSrc ? (
                  <img src={logoSrc} alt="Logo" style={{ width: '96px', height: 'auto' }} />
                ) : (
                  <Box sx={{ width: '96px', height: 32 }} />
                )}
              </Box>
              {/* Títulos centrados */}
              <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {empresaNombre}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Comprobante de Pago
                </Typography>
                {empresaNit && (
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    NIT/RUT: {empresaNit}
                  </Typography>
                )}
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Consecutivo:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  {venta.facturaHasConsecutivo?.factura?.nombre} - {(() => {
                    const n = venta?.numeroConsecutivo ?? venta?.facturaHasConsecutivo?.consecutivo?.contador;
                    return n ? `00${n}`.slice(-3) : 'N/A';
                  })()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Typography variant="body2" color="text.secondary">Fecha:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  {formatDate(venta.fecha)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          {/* Información del Cliente */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
              Información del Cliente
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <Typography component="span" sx={{ fontWeight: 'medium' }}>Nombre:</Typography> {venta.cliente?.nombreCompleto}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <Typography component="span" sx={{ fontWeight: 'medium' }}>Teléfono:</Typography> {venta.cliente?.telefono || venta.clienteTelefono || 'No disponible'}
              </Typography>
              <Typography variant="body1">
                <Typography component="span" sx={{ fontWeight: 'medium' }}>Dirección:</Typography> {venta.cliente?.direccion || venta.clienteDireccion || 'No disponible'}
              </Typography>
            </Paper>
          </Box>
          
          {/* Información del Evento */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
              Información del Servicio
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <Typography component="span" sx={{ fontWeight: 'medium' }}>Tipo de Servicio:</Typography> {venta.tipoDeServicio}
              </Typography>
              {venta.duracionDelEvento && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <Typography component="span" sx={{ fontWeight: 'medium' }}>Duración:</Typography> {venta.duracionDelEvento}
                </Typography>
              )}
              {venta.fechaDelEvento && (
                <Typography variant="body1">
                  <Typography component="span" sx={{ fontWeight: 'medium' }}>Fecha del Evento:</Typography> {formatDate(venta.fechaDelEvento)}
                </Typography>
              )}
            </Paper>
          </Box>
          
          {/* Productos */}
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
                  {venta.productos.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.producto?.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(item.precioUnitario)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {item.cantidad}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.subtotal)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Resumen de Pago */}
          {(() => {
            const saldoPendiente = Math.max(0, venta.totalPagar - venta.abono);
            return (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Paper
                  variant="outlined"
                  className="print-shadow-none"
                  sx={{ width: '100%', maxWidth: 340, p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50', ml: 'auto' }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'right' }}>
                    Resumen de Pago
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" fontWeight="medium">Subtotal:</Typography>
                    <Typography variant="body2">{formatCurrency(venta.subtotal)}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="medium">Descuento:</Typography>
                    <Typography variant="body2">{formatCurrency(venta.descuento)}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                    <Typography variant="subtitle2" fontWeight="bold">Total a Pagar:</Typography>
                    <Typography variant="subtitle2" fontWeight="bold">{formatCurrency(venta.totalPagar)}</Typography>
                  </Box>

                  <Divider sx={{ my: 0.75 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" fontWeight="medium">Abono:</Typography>
                    <Typography variant="body2">{formatCurrency(venta.abono)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">Saldo Pendiente:</Typography>
                    {saldoPendiente === 0 ? (
                      <Typography variant="body2" fontWeight="bold" sx={{ color: 'success.main' }}>PAGADO</Typography>
                    ) : (
                      <Typography variant="body2" fontWeight="bold" color="error">
                        {formatCurrency(saldoPendiente)}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            );
          })()}
          
          {/* Pie de página */}
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Gracias por su compra
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {empresaNombre}{empresaTelefono ? ` - Teléfono: ${empresaTelefono}` : ''}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default VentaDetalle;
