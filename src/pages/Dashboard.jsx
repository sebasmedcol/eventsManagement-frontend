import { useContext, useEffect, useState, useMemo } from 'react';
import { FaUsers, FaBoxOpen, FaShoppingCart, FaListOl, FaCalendarAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Button,
  Paper
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
// NUEVOS IMPORTS DE GRAFICAS Y FECHAS
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import moment from 'moment';
import 'moment/locale/es';
import { fetchEventos } from '../services/eventoService';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    clientes: 0,
    productos: 0,
    ventas: 0,
    consecutivos: 0,
    eventos: 0,
  });
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const [ventasAll, setVentasAll] = useState([]);
  const [eventosAll, setEventosAll] = useState([]);
  const [cotizacionesAll, setCotizacionesAll] = useState([]);
  const currentYear = moment().year();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [productosAll, setProductosAll] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener estadísticas básicas
        const [clientesRes, productosRes, ventasRes, consecutivosRes, cotizacionesRes] = await Promise.all([
          api.get('/clientes'),
          api.get('/productos'),
          api.get('/ventas'),
          api.get('/consecutivos'),
          api.get('/cotizaciones'),
        ]);

        const ventasData = Array.isArray(ventasRes.data) ? ventasRes.data : [];
        setVentasAll(ventasData);
        setProductosAll(Array.isArray(productosRes.data) ? productosRes.data : []);

        const cotizacionesData = Array.isArray(cotizacionesRes.data)
          ? cotizacionesRes.data
          : [];
        setCotizacionesAll(cotizacionesData);

        // Obtener número de eventos activos y guardar lista
        let eventosCount = 0;
        let eventosData = [];
        try {
          const eventosRes = await api.get('/eventos');
          eventosData = Array.isArray(eventosRes.data) ? eventosRes.data : [];
          eventosCount = eventosData.length;
        } catch (err) {
          // Si 404, entonces no hay eventos, dejamos en 0
          if (err?.response?.status !== 404) {
            console.error('Error al cargar eventos:', err);
          }
          eventosData = [];
        }
        setEventosAll(eventosData);

        setStats({
          clientes: clientesRes.data.length,
          productos: productosRes.data.length,
          ventas: ventasData.length,
          consecutivos: consecutivosRes.data.length,
          eventos: eventosCount,
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Cargar eventos próximos (30 días) para sección de programación
  useEffect(() => {
    const loadUpcomingEvents = async () => {
      try {
        const today = moment().startOf('day');
        const from = today.format('YYYY-MM-DD');
        const to = today.clone().add(30, 'days').endOf('day').format('YYYY-MM-DD');
        const res = await fetchEventos({ from, to });
        const data = Array.isArray(res.data) ? res.data : [];
        setEventosAll(data);
      } catch (err) {
        if (err?.response?.status === 404) {
          setEventosAll([]);
        } else {
          console.error('Error al cargar eventos próximos:', err);
        }
      }
    };
    loadUpcomingEvents();
  }, []);

  // Helper para fecha de venta
  const getVentaDate = (v) => {
    const d = v?.fechaDelEvento || v?.fecha || v?.createdAt;
    return d ? new Date(d) : null;
  };

  // Ventas válidas (activas)
  const validVentas = useMemo(
    () => (ventasAll || []).filter((v) => v && v.estado !== false),
    [ventasAll]
  );

  // Años disponibles para filtrar (incluye el año actual aunque no haya ventas)
  const availableYears = useMemo(() => {
    const years = new Set();
    validVentas.forEach((v) => {
      const d = getVentaDate(v);
      if (!d) return;
      years.add(moment(d).year());
    });
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [validVentas, currentYear]);

  // Series de ventas por mes para el año seleccionado (enero → diciembre)
  const salesSeries = useMemo(() => {
    const base = Array.from({ length: 12 }, (_, i) => ({
      label: moment().month(i).format('MMM'),
      monthIndex: i,
      total: 0,
    }));

    validVentas.forEach((v) => {
      const d = getVentaDate(v);
      if (!d) return;
      const m = moment(d);
      if (m.year() !== selectedYear) return;
      const monthIndex = m.month(); // 0-11
      base[monthIndex].total += Number(v.totalPagar || 0);
    });

    return base;
  }, [validVentas, selectedYear]);

  // Cotizaciones enviadas con más de 1 mes de antigüedad
  const staleCotizaciones = useMemo(() => {
    const threshold = moment().subtract(1, 'month');

    return (cotizacionesAll || [])
      .filter((c) => {
        if (!c) return false;
        if (c.estado !== 'enviada') return false;
        if (!c.createdAt) return false;
        const created = moment(c.createdAt);
        return created.isBefore(threshold);
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(0, 5);
  }, [cotizacionesAll]);

  // Top productos por ingresos en el año seleccionado
  const topProductos = useMemo(() => {
    const byProducto = new Map();

    validVentas.forEach((v) => {
      const d = getVentaDate(v);
      if (!d) return;
      const m = moment(d);
      if (m.year() !== selectedYear) return;

      const items = Array.isArray(v.productos) ? v.productos : [];
      items.forEach((item) => {
        const prod = item.producto;
        const nombre =
          prod && typeof prod === 'object' ? prod.nombre : 'Producto';
        const key = nombre || 'Producto';
        const subtotal =
          item.subtotal ||
          (Number(item.precioUnitario || 0) * Number(item.cantidad || 0));

        const prev = byProducto.get(key) || { nombre: key, total: 0 };
        prev.total += Number(subtotal || 0);
        byProducto.set(key, prev);
      });
    });

    return Array.from(byProducto.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [validVentas, selectedYear]);

  // Distribución de eventos por día de la semana (próximos 30 días)
  const eventsByDow = useMemo(() => {
    const counts = {
      'Lun': 0, 'Mar': 0, 'Mié': 0, 'Jue': 0, 'Vie': 0, 'Sáb': 0, 'Dom': 0,
    };
    (eventosAll || []).forEach((e) => {
      const d = e?.start || e?.venta?.fechaDelEvento;
      if (!d) return;
      const day = moment(d).format('ddd'); // Lun, Mar, Mié...
      const key = day.charAt(0).toUpperCase() + day.slice(1).replace('.', '');
      if (counts[key] !== undefined) {
        counts[key] += 1;
      }
    });
    return Object.entries(counts).map(([label, total]) => ({ label, total }));
  }, [eventosAll]);

  const productosSinStock = useMemo(() => {
  return (productosAll || [])
    .filter((p) => p && p.estado !== false && (p.cantidadTotal === 0 || p.cantidadTotal == null))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}, [productosAll]);

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

  const tiles = [
    { key: 'clientes', label: 'Clientes', value: stats.clientes, color: theme.palette.secondary, to: '/clientes', icon: <FaUsers /> },
    { key: 'productos', label: 'Productos', value: stats.productos, color: theme.palette.success, to: '/productos', icon: <FaBoxOpen /> },
    { key: 'ventas', label: 'Ventas', value: stats.ventas, color: theme.palette.error, to: '/ventas', icon: <FaShoppingCart /> },
    { key: 'consecutivos', label: 'Consecutivos', value: stats.consecutivos, color: theme.palette.info, to: '/consecutivos', icon: <FaListOl /> },
    { key: 'eventos', label: 'Cronograma de eventos', value: stats.eventos, color: theme.palette.warning, to: '/eventos', icon: <FaCalendarAlt /> },
  ];

  const nombreEmpresa =
    user && user.empresa && typeof user.empresa === 'object'
      ? user.empresa.nombre
      : '';

  return (
    <Box sx={{ pt: 2, pl: 4, pr: 5 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Dashboard
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 'medium' }}>
          Bienvenido, {user?.nombreUsuario}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Empresa: {nombreEmpresa || '-'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Aquí puedes ver un resumen de la actividad del sistema.
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {tiles.map(({ key, label, value, color, to, icon }) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: `linear-gradient(135deg, ${alpha(color.main, 0.16)} 0%, ${alpha(color.main, 0.06)} 100%)`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.shadows[8],
                },
                '::after': {
                  content: '""',
                  position: 'absolute',
                  right: -40,
                  bottom: -40,
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: `radial-gradient(${alpha(color.main, 0.25)}, transparent 60%)`,
                  pointerEvents: 'none',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      background: `linear-gradient(135deg, ${alpha(color.main, 0.30)} 0%, ${alpha(color.main, 0.10)} 100%)`,
                      border: '1px solid',
                      borderColor: alpha(color.main, 0.4),
                    }}
                  >
                    {icon}
                  </Box>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: alpha(color.main, 0.9), fontWeight: 700 }}>
                      {label}
                    </Typography>
                    <Typography variant="h4" component="h3" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                      {value?.toLocaleString?.() ?? value}
                    </Typography>
                  </Box>
                </Box>

                <Button 
                  component={Link} 
                  to={to} 
                  size="small"
                  sx={{ mt: 1, px: 0, color: color.main, fontWeight: 600 }}
                >
                  Ver {label.toLowerCase()} →
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h3" sx={{ mb: 3, fontWeight: 'medium' }}>
          Acciones Rápidas
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Button
              component={Link}
              to="/clientes/nuevo"
              variant="contained"
              color="secondary" // morado
              fullWidth
              startIcon={<FaUsers />}
              sx={{ py: 1.5 }}
            >
              Nuevo Cliente
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              component={Link}
              to="/productos/nuevo"
              variant="contained"
              color="success" // verde
              fullWidth
              startIcon={<FaBoxOpen />}
              sx={{ py: 1.5 }}
            >
              Nuevo Producto
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              component={Link}
              to="/ventas/nueva"
              variant="contained"
              color="error" // rojo
              fullWidth
              startIcon={<FaShoppingCart />}
              sx={{ py: 1.5 }}
            >
              Nueva Venta
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              component={Link}
              to="/consecutivos"
              variant="contained"
              color="warning" // naranja
              fullWidth
              startIcon={<FaListOl />}
              sx={{ py: 1.5 }}
            >
              Ver Consecutivos
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* NUEVAS SECCIONES: se muestran después de las funcionalidades existentes */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {/* Ventas Filtradas */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'medium' }}>Ventas por mes</Typography>
              <Box sx={{ minWidth: 160 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Año
                </Typography>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{ padding: '8px', borderRadius: 8 }}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </Box>
            </Box>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesSeries} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill={theme.palette.secondary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Programación: Distribución por día de la semana */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'medium', mb: 2 }}>Programación (30 días)</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Próximos eventos: {eventosAll.length}
              </Typography>
            </Box>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventsByDow} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Eventos" fill={theme.palette.info.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      {/* Alerta de productos sin stock */}
<Grid container spacing={3} sx={{ mt: 4 }}>
  <Grid item xs={12}>
    <Paper sx={{ p: 3, border: '1px solid', borderColor: 'warning.light' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FaBoxOpen color={theme.palette.warning.main} size={20} />
        <Typography variant="h5" sx={{ fontWeight: 'medium', color: 'warning.dark' }}>
          ⚠️ Productos sin stock ({productosSinStock.length})
        </Typography>
      </Box>

      {productosSinStock.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Todos los productos tienen stock disponible. ✅
        </Typography>
      ) : (
        <Grid container spacing={1}>
          {/* Encabezados */}
          <Grid item xs={5}>
            <Typography variant="subtitle2" color="text.secondary">Producto</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle2" color="text.secondary">Tipo de servicio</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="subtitle2" color="text.secondary" align="right">Stock</Typography>
          </Grid>

          {/* Filas */}
          {productosSinStock.map((p) => (
            <Grid item xs={12} key={p._id}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.warning.main, 0.08),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.warning.main, 0.3),
                }}
              >
                <Typography variant="body2" fontWeight="bold" sx={{ flex: 5 }}>
                  {p.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 4 }}>
                  {p.tipoDeServicio || '-'}
                </Typography>
                <Box sx={{ flex: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{
                      color: 'error.main',
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      px: 1.5,
                      py: 0.3,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                    }}
                  >
                    Sin stock
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  </Grid>
</Grid>
      {/* Top productos por ingresos en el año seleccionado */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'medium', mb: 2 }}>
              Top productos por ingresos ({selectedYear})
            </Typography>
            {topProductos.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay ventas para el año seleccionado.
              </Typography>
            ) : (
              <Grid container spacing={1}>
                <Grid item xs={8}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Producto
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary" align="right">
                    Ingresos
                  </Typography>
                </Grid>
                {topProductos.map((p) => (
                  <Grid item xs={12} key={p.nombre}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{p.nombre}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                        }).format(p.total)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'medium', mb: 2 }}>
              Cotizaciones enviadas (+1 mes)
            </Typography>
            {staleCotizaciones.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay cotizaciones enviadas con más de un mes de antigüedad.
              </Typography>
            ) : (
              <>
                {staleCotizaciones.map((c) => {
                  const dias = moment().diff(moment(c.createdAt), 'days');
                  return (
                    <Box
                      key={c._id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1.5,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {c.cliente?.nombreCompleto || 'Sin cliente'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total:{' '}
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                          }).format(c.total || 0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Enviada hace {dias} días ·{' '}
                          {moment(c.createdAt).format('DD/MM/YYYY')}
                        </Typography>
                      </Box>
                      <Button
                        component={Link}
                        to={`/cotizaciones?focus=${c._id}`}
                        size="small"
                        variant="outlined"
                      >
                        Ver cotización
                      </Button>
                    </Box>
                  );
                })}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
