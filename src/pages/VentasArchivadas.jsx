import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaArchive, FaEye, FaTimes } from 'react-icons/fa';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';
import { getAniosArchivados, getVentasArchivadas } from '../services/ventaService';

const emptyValue = 'No disponible';

const displayValue = (value) => {
  if (value === undefined || value === null || value === '') return emptyValue;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
};

const VentasArchivadas = () => {
  const [anios, setAnios] = useState([]);
  const [anio, setAnio] = useState('');
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAniosArchivados()
      .then((data) => setAnios(Array.isArray(data) ? data : (data.anios || [])))
      .catch(() => toast.error('No se pudieron cargar los años archivados'));
  }, []);

  const formatCurrency = (value) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

  const formatDate = (value, includeTime = false) => {
    if (!value) return emptyValue;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  };

  const getClientName = (venta) => venta.cliente?.nombreCompleto || venta.clienteNombre || emptyValue;

  const cargarVentas = async (value) => {
    setAnio(value);
    setVentas([]);
    setVentaSeleccionada(null);
    if (!value) return;

    try {
      setLoading(true);
      const data = await getVentasArchivadas(value);
      setVentas(Array.isArray(data) ? data : (data.ventas || []));
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar las ventas archivadas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          <FaArchive style={{ marginRight: 10 }} />
          Ventas archivadas
        </Typography>
        <Button component={Link} to="/ventas" startIcon={<FaArrowLeft />} variant="outlined">
          Volver a ventas
        </Button>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Seleccione un año para consultar las ventas archivadas
        </Typography>
        <Select fullWidth value={anio} displayEmpty onChange={(event) => cargarVentas(event.target.value)}>
          <MenuItem value="" disabled>Seleccione un año</MenuItem>
          {anios.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
        </Select>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : anio ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Tipo de servicio</TableCell>
                <TableCell>Total</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ventas.length ? ventas.map((venta) => (
                <TableRow key={venta._id} hover>
                  <TableCell>{formatDate(venta.fecha)}</TableCell>
                  <TableCell>{getClientName(venta)}</TableCell>
                  <TableCell>{displayValue(venta.tipoDeServicio)}</TableCell>
                  <TableCell>{formatCurrency(venta.totalPagar)}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FaEye />}
                      onClick={() => setVentaSeleccionada(venta)}
                      aria-label={`Ver detalle de la venta ${venta.numeroConsecutivo || venta._id}`}
                    >
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No hay ventas archivadas para este año.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      <Dialog
        open={Boolean(ventaSeleccionada)}
        onClose={() => setVentaSeleccionada(null)}
        fullWidth
        maxWidth="md"
        aria-labelledby="detalle-venta-archivada"
      >
        {ventaSeleccionada && (
          <>
            <DialogTitle id="detalle-venta-archivada" sx={{ pr: 6 }}>
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                Detalle de venta archivada
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consecutivo: {displayValue(ventaSeleccionada.numeroConsecutivo)}
              </Typography>
              <Button
                onClick={() => setVentaSeleccionada(null)}
                aria-label="Cerrar detalle"
                sx={{ position: 'absolute', right: 8, top: 8, minWidth: 40 }}
              >
                <FaTimes />
              </Button>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Información general</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><Detail label="ID de venta archivada" value={ventaSeleccionada._id} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Año de venta" value={ventaSeleccionada.anioVenta} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Fecha de la venta" value={formatDate(ventaSeleccionada.fecha, true)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Fecha de archivado" value={formatDate(ventaSeleccionada.fechaArchivado, true)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Última actualización" value={formatDate(ventaSeleccionada.updatedAt, true)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Tipo de servicio" value={ventaSeleccionada.tipoDeServicio} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Estado" value={ventaSeleccionada.estado} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Estado del pago" value={ventaSeleccionada.estadoPago} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Empresa" value={ventaSeleccionada.empresa} /></Grid>
                    </Grid>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Cliente</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><Detail label="Nombre" value={getClientName(ventaSeleccionada)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="ID del cliente" value={ventaSeleccionada.cliente?._id || ventaSeleccionada.cliente} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Teléfono" value={ventaSeleccionada.cliente?.telefono || ventaSeleccionada.clienteTelefono} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Dirección" value={ventaSeleccionada.cliente?.direccion || ventaSeleccionada.clienteDireccion} /></Grid>
                    </Grid>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Evento y fechas</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><Detail label="Fecha del evento" value={formatDate(ventaSeleccionada.fechaDelEvento)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Duración" value={ventaSeleccionada.duracionDelEvento} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Inicio del evento" value={formatDate(ventaSeleccionada.eventoInicio, true)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Fin del evento" value={formatDate(ventaSeleccionada.eventoFin, true)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Inicio de load-in" value={formatDate(ventaSeleccionada.loadInInicio, true)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Fin de load-out" value={formatDate(ventaSeleccionada.loadOutFin, true)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Inicio de servicio" value={formatDate(ventaSeleccionada.fechaInicio, true)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Fin de servicio" value={formatDate(ventaSeleccionada.fechaFin, true)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Solo cobrar tiempo del evento" value={ventaSeleccionada.soloCobrarTiempoEvento} /></Grid>
                    </Grid>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Productos</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Producto</TableCell><TableCell>ID</TableCell><TableCell align="right">Cantidad</TableCell><TableCell align="right">Precio unitario</TableCell><TableCell align="right">Subtotal</TableCell></TableRow></TableHead>
                      <TableBody>
                        {(ventaSeleccionada.productos || []).map((item, index) => (
                          <TableRow key={item._id || index}>
                            <TableCell>{item.producto?.nombre || emptyValue}</TableCell>
                            <TableCell>{displayValue(item.producto?._id || item.producto)}</TableCell>
                            <TableCell align="right">{displayValue(item.cantidad)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.precioUnitario)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Resumen de pago</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><Detail label="Subtotal" value={formatCurrency(ventaSeleccionada.subtotal)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Descuento" value={formatCurrency(ventaSeleccionada.descuento)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="IVA (%)" value={`${displayValue(ventaSeleccionada.ivaPorcentaje)}%`} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Valor del IVA" value={formatCurrency(ventaSeleccionada.ivaValor)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Total a pagar" value={formatCurrency(ventaSeleccionada.totalPagar)} strong /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Abono" value={formatCurrency(ventaSeleccionada.abono)} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Saldo pendiente" value={formatCurrency(ventaSeleccionada.saldoPendiente)} strong /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Fecha límite de pago" value={formatDate(ventaSeleccionada.fechaLimitePago)} /></Grid>
                    </Grid>
                    <Chip label={displayValue(ventaSeleccionada.estadoPago)} color={ventaSeleccionada.estadoPago === 'pagada' ? 'success' : 'warning'} sx={{ mt: 2 }} />
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Facturación</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><Detail label="ID factura/consecutivo" value={ventaSeleccionada.facturaHasConsecutivo?._id || ventaSeleccionada.facturaHasConsecutivo} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="Factura" value={ventaSeleccionada.facturaHasConsecutivo?.factura?.nombre} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="ID de factura" value={ventaSeleccionada.facturaHasConsecutivo?.factura?._id} /></Grid>
                      <Grid item xs={12} sm={6}><Detail label="ID de consecutivo" value={ventaSeleccionada.facturaHasConsecutivo?.consecutivo?._id} /></Grid>
                    </Grid>
                  </Paper>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setVentaSeleccionada(null)} variant="contained">Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

const Detail = ({ label, value, strong = false }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body1" sx={{ fontWeight: strong ? 'bold' : 'medium', wordBreak: 'break-word' }}>
      {displayValue(value)}
    </Typography>
  </Box>
);

export default VentasArchivadas;
