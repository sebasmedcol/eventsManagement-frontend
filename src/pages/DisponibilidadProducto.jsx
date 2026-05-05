import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Container,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Alert,
} from '@mui/material';
import { getProductos } from '../services/productoService';
import { getVentas } from '../services/ventaService';
import { getCotizaciones } from '../services/cotizacionService';

const DisponibilidadProducto = () => {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [cotizacionesFiltradas, setCotizacionesFiltradas] = useState([]);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargandoProductos(true);
        const data = await getProductos();
        setProductos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al cargar productos');
      } finally {
        setCargandoProductos(false);
      }
    };

    cargarProductos();
  }, []);

  const parseFecha = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  const solapanRango = (inicioA, finA, inicioB, finB) => {
    if (!inicioA || !finA || !inicioB || !finB) return false;
    return inicioA <= finB && finA >= inicioB;
  };

  const manejarCalcular = async () => {
    if (!productoId || !fechaInicio || !fechaFin) {
      toast.error('Seleccione producto y rango de fechas');
      return;
    }

    const inicio = parseFecha(fechaInicio);
    const fin = parseFecha(fechaFin);

    if (!inicio || !fin) {
      toast.error('Las fechas proporcionadas no son válidas');
      return;
    }

    if (inicio > fin) {
      toast.error('La fecha de inicio no puede ser mayor que la fecha fin');
      return;
    }

    try {
      setCalculando(true);

      const [ventas, cotizaciones] = await Promise.all([
        getVentas(),
        getCotizaciones(),
      ]);

      const ventasLista = Array.isArray(ventas) ? ventas : [];

      const ventasConProductoYRango = ventasLista.filter((venta) => {
        const inicioVenta = parseFecha(venta.fechaInicio || venta.fechaDelEvento);
        const finVenta = parseFecha(venta.fechaFin || venta.fechaDelEvento);
        if (!solapanRango(inicioVenta, finVenta, inicio, fin)) return false;

        const items = Array.isArray(venta.productos) ? venta.productos : [];
        return items.some((item) => {
          const prod = item.producto;
          const id =
            typeof prod === 'string'
              ? prod
              : prod && typeof prod === 'object'
              ? prod._id
              : null;
          return id === productoId;
        });
      });

      const totalReservado = ventasConProductoYRango.reduce((acc, venta) => {
        const items = Array.isArray(venta.productos) ? venta.productos : [];
        const cantidadVenta = items.reduce((s, item) => {
          const prod = item.producto;
          const id =
            typeof prod === 'string'
              ? prod
              : prod && typeof prod === 'object'
              ? prod._id
              : null;
          if (id !== productoId) return s;
          return s + (item.cantidad || 0);
        }, 0);
        return acc + cantidadVenta;
      }, 0);

      const producto = productos.find((p) => p._id === productoId);
      const capacidad = producto?.cantidadTotal ?? 0;
      const disponible = Math.max(0, capacidad - totalReservado);

      const cotizacionesLista = Array.isArray(cotizaciones) ? cotizaciones : [];
      const cotizacionesConProducto = cotizacionesLista.filter((cot) => {
        const items = Array.isArray(cot.productos) ? cot.productos : [];
        return items.some((item) => {
          const prod = item.producto;
          const id =
            typeof prod === 'string'
              ? prod
              : prod && typeof prod === 'object'
              ? prod._id
              : null;
          return id === productoId;
        });
      });

      setResumen({
        productoNombre: producto?.nombre || '',
        capacidad,
        reservado: totalReservado,
        disponible,
      });
      setVentasFiltradas(ventasConProductoYRango);
      setCotizacionesFiltradas(cotizacionesConProducto);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al calcular la disponibilidad');
    } finally {
      setCalculando(false);
    }
  };

  const formatoFechaCorta = (valor) => {
    if (!valor) return '';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-CO');
  };

  const formatoMoneda = (valor) => {
    if (valor == null) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Disponibilidad de productos por fechas
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Producto</InputLabel>
              <Tooltip title="Seleccione el producto que desea evaluar">
                <Select
                  value={productoId}
                  label="Producto"
                  onChange={(e) => setProductoId(e.target.value)}
                  disabled={cargandoProductos}
                >
                  {productos.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </Tooltip>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Tooltip title="Fecha inicial del rango a revisar">
              <TextField
                fullWidth
                type="date"
                label="Desde"
                InputLabelProps={{ shrink: true }}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </Tooltip>
          </Grid>

          <Grid item xs={12} md={3}>
            <Tooltip title="Fecha final del rango a revisar">
              <TextField
                fullWidth
                type="date"
                label="Hasta"
                InputLabelProps={{ shrink: true }}
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </Tooltip>
          </Grid>

          <Grid item xs={12} md={2}>
            <Tooltip title="Calcular reservas reales y disponibilidad para este producto en el rango seleccionado">
              <span>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={manejarCalcular}
                  disabled={calculando || cargandoProductos}
                >
                  {calculando ? <CircularProgress size={24} /> : 'Ver disponibilidad'}
                </Button>
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {resumen && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Resumen para {resumen.productoNombre}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Alert severity="info">
                Capacidad total: <strong>{resumen.capacidad}</strong>
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="warning">
                Reservado en rango: <strong>{resumen.reservado}</strong>
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity={resumen.disponible > 0 ? 'success' : 'error'}>
                Disponible: <strong>{resumen.disponible}</strong>
              </Alert>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Ventas que usan este producto en el rango
            </Typography>
            {ventasFiltradas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay ventas activas con este producto en el rango seleccionado.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Fechas</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ventasFiltradas.map((venta) => {
                      const items = Array.isArray(venta.productos)
                        ? venta.productos
                        : [];
                      const cantidad = items.reduce((s, item) => {
                        const prod = item.producto;
                        const id =
                          typeof prod === 'string'
                            ? prod
                            : prod && typeof prod === 'object'
                            ? prod._id
                            : null;
                        if (id !== productoId) return s;
                        return s + (item.cantidad || 0);
                      }, 0);

                      return (
                        <TableRow key={venta._id}>
                          <TableCell>
                            {venta.cliente?.nombreCompleto || 'Sin cliente'}
                          </TableCell>
                          <TableCell>
                            {formatoFechaCorta(venta.fechaInicio || venta.fechaDelEvento)}{' '}
                            - {formatoFechaCorta(venta.fechaFin || venta.fechaDelEvento)}
                          </TableCell>
                          <TableCell align="right">{cantidad}</TableCell>
                          <TableCell align="right">
                            {formatoMoneda(venta.totalPagar)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Cotizaciones que incluyen este producto
            </Typography>
            {cotizacionesFiltradas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay cotizaciones con este producto.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cotizacionesFiltradas.map((cotizacion) => {
                      const items = Array.isArray(cotizacion.productos)
                        ? cotizacion.productos
                        : [];
                      const cantidad = items.reduce((s, item) => {
                        const prod = item.producto;
                        const id =
                          typeof prod === 'string'
                            ? prod
                            : prod && typeof prod === 'object'
                            ? prod._id
                            : null;
                        if (id !== productoId) return s;
                        return s + (item.cantidad || 0);
                      }, 0);

                      return (
                        <TableRow key={cotizacion._id}>
                          <TableCell>
                            {cotizacion.cliente?.nombreCompleto || 'Sin cliente'}
                          </TableCell>
                          <TableCell align="right">{cantidad}</TableCell>
                          <TableCell align="right">
                            {cotizacion.estado || 'borrador'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DisponibilidadProducto;

