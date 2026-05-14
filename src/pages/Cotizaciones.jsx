import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPlus, FaExchangeAlt, FaEye, FaEdit, FaPrint } from 'react-icons/fa';
import { toast } from 'react-toastify';
import usePermisos from '../hooks/usePermisos';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  CircularProgress,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tooltip,
} from '@mui/material';
import { getClientes } from '../services/clienteService';
import { getProductos } from '../services/productoService';
import {
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  updateCotizacion,
} from '../services/cotizacionService';

const Cotizaciones = () => {
  const { puedeCrear, puedeEditar } = usePermisos();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openNueva, setOpenNueva] = useState(false);
  const [editingCotizacionId, setEditingCotizacionId] = useState('');
  const [editingCotizacion, setEditingCotizacion] = useState(null);
  const [openVer, setOpenVer] = useState(false);
  const [cotizacionVer, setCotizacionVer] = useState(null);
  const [loadingVer, setLoadingVer] = useState(false);

  const [formNueva, setFormNueva] = useState({
    cliente: '',
    tipoDeServicio: '',
    productos: [],
  });

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const focusId = searchParams.get('focus') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cotz, cls, prods] = await Promise.all([
          getCotizaciones(),
          getClientes(),
          getProductos(),
        ]);
        setCotizaciones(cotz);
        setClientes(cls);
        setProductos(prods);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al cargar datos de cotizaciones');
        console.error('Error cotizaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (focusId) {
      const exists = cotizaciones.some((c) => c._id === focusId);
      if (!exists) {
        navigate('/cotizaciones', { replace: true });
      }
    }
  }, [focusId, cotizaciones, navigate]);

  const calcularTotal = (items) => {
    return items.reduce(
      (acc, item) => acc + (item.subtotal || 0),
      0
    );
  };

  const mapTipoServicio = (value) => {
    if (value === 'Evento') return 'Alquiler';
    return value;
  };

  const productosFiltrados = productos.filter((p) => {
    const servicio = mapTipoServicio(formNueva.tipoDeServicio);
    if (!servicio) return true;
    if (!p.tipoDeServicio) return true;
    return p.tipoDeServicio === servicio;
  });

  const handleOpenNueva = (cotizacion = null) => {
    if (cotizacion) {
      setEditingCotizacionId(cotizacion._id);
      setEditingCotizacion(cotizacion);
      setFormNueva({
        cliente: cotizacion.cliente?._id || cotizacion.cliente || '',
        tipoDeServicio: cotizacion.tipoDeServicio || '',
        productos: (cotizacion.productos || []).map((p) => ({
          producto: p.producto?._id || p.producto || '',
          cantidad: Number(p.cantidad) || 1,
          precioUnitario: Number(p.precioUnitario) || 0,
          subtotal: Number(p.subtotal) || 0,
        })),
      });
    } else {
      setEditingCotizacionId('');
      setEditingCotizacion(null);
      setFormNueva({
        cliente: '',
        tipoDeServicio: '',
        productos: [],
      });
    }
    setOpenNueva(true);
  };

  const handleCloseNueva = () => {
    setOpenNueva(false);
    setEditingCotizacionId('');
    setEditingCotizacion(null);
  };

  const handleAddProducto = () => {
    if (!formNueva.tipoDeServicio) {
      toast.error('Seleccione primero el tipo de servicio');
      return;
    }
    setFormNueva((prev) => ({
      ...prev,
      productos: [
        ...prev.productos,
        { producto: '', cantidad: 1, precioUnitario: 0, subtotal: 0 },
      ],
    }));
  };

  const handleChangeProducto = (index, field, value) => {
    setFormNueva((prev) => {
      const updated = [...prev.productos];
      const prevItem = updated[index] || {
        producto: '',
        cantidad: 1,
        precioUnitario: 0,
        subtotal: 0,
      };
      const item = { ...prevItem, [field]: value };

      if (field === 'producto') {
        const productoSeleccionado = productos.find((p) => p._id === value);
        const precioAuto = Number(productoSeleccionado?.precio) || 0;
        item.precioUnitario = precioAuto;
      }

      const cantidad = Number(item.cantidad) || 0;
      const precio = Number(item.precioUnitario) || 0;
      item.subtotal = cantidad * precio;
      updated[index] = item;
      return { ...prev, productos: updated };
    });
  };

  const handleRemoveProducto = (index) => {
    setFormNueva((prev) => {
      const updated = [...prev.productos];
      updated.splice(index, 1);
      return { ...prev, productos: updated };
    });
  };

  const handleSubmitNueva = async () => {
    try {
      if (!formNueva.cliente || !formNueva.tipoDeServicio || formNueva.productos.length === 0) {
        toast.error('Seleccione cliente, tipo de servicio y al menos un producto');
        return;
      }

      const total = calcularTotal(formNueva.productos);

      const payload = {
        cliente: formNueva.cliente,
        tipoDeServicio: formNueva.tipoDeServicio,
        productos: formNueva.productos.map((p) => ({
          producto: p.producto,
          cantidad: Number(p.cantidad) || 0,
          precioUnitario: Number(p.precioUnitario) || 0,
          subtotal: Number(p.subtotal) || 0,
        })),
        total,
      };

      if (editingCotizacionId) {
        const actualizada = await updateCotizacion(editingCotizacionId, payload);
        setCotizaciones((prev) =>
          prev.map((c) => (c._id === actualizada._id ? actualizada : c))
        );
        toast.success('Cotización actualizada');
      } else {
        const creada = await createCotizacion(payload);
        setCotizaciones((prev) => [...prev, creada]);
        toast.success('Cotización creada');
      }
      setOpenNueva(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (editingCotizacionId ? 'Error al actualizar la cotización' : 'Error al crear la cotización')
      );
      console.error('Error guardar cotización:', error);
    }
  };

  const handleOpenVer = async (cotizacion) => {
    setOpenVer(true);
    setCotizacionVer(cotizacion || null);
    setLoadingVer(true);
    try {
      const full = await getCotizacionById(cotizacion._id);
      setCotizacionVer(full);
    } catch {
      setCotizacionVer(cotizacion || null);
    } finally {
      setLoadingVer(false);
    }
  };

  const handleCloseVer = () => {
    setOpenVer(false);
    setCotizacionVer(null);
    setLoadingVer(false);
  };

  const handleCambioEstado = async (cotizacion, nuevoEstado) => {
    try {
      const actualizada = await updateCotizacion(cotizacion._id, {
        estado: nuevoEstado,
      });
      setCotizaciones((prev) =>
        prev.map((c) => (c._id === actualizada._id ? actualizada : c))
      );
      toast.success('Estado de la cotización actualizado');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Error al actualizar el estado'
      );
      console.error('Error actualizar estado cotización:', error);
    }
  };

  const handleRechazar = async (cotizacion) => {
    try {
      if (!window.confirm('¿Marcar esta cotización como rechazada?')) return;
      const actualizada = await updateCotizacion(cotizacion._id, {
        estado: 'rechazada',
      });
      setCotizaciones((prev) =>
        prev.map((c) => (c._id === actualizada._id ? actualizada : c))
      );
      toast.success('Cotización marcada como rechazada');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Error al actualizar la cotización'
      );
      console.error('Error actualizar cotización:', error);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Cotizaciones</Typography>
          <Tooltip title="Crear una nueva cotización a partir de cliente y productos">
            <Button
              variant="contained"
              startIcon={<FaPlus />}
              onClick={handleOpenNueva}
            >
              Nueva cotización
            </Button>
          </Tooltip>
        </Box>

        <Paper>
          {loading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Creada</TableCell>
                    <TableCell>Última edición</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cotizaciones.map((c) => (
                    <TableRow
                      key={c._id}
                      sx={
                        c._id === focusId
                          ? { backgroundColor: 'rgba(83,155,255,0.1)' }
                          : undefined
                      }
                    >
                      <TableCell>{c.cliente?.nombreCompleto || 'Sin cliente'}</TableCell>
                      <TableCell>{c.total?.toFixed(2)}</TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <InputLabel id={`estado-label-${c._id}`}>Estado</InputLabel>
                          <Select
                            labelId={`estado-label-${c._id}`}
                            value={c.estado || 'borrador'}
                            label="Estado"
                            onChange={(e) =>
                              handleCambioEstado(c, e.target.value)
                            }
                          >
                            <MenuItem value="borrador">Borrador</MenuItem>
                            <MenuItem value="enviada">Enviada</MenuItem>
                            <MenuItem value="aceptada">Aceptada</MenuItem>
                            <MenuItem value="rechazada">Rechazada</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {c.updatedAt
                          ? new Date(c.updatedAt).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Ver detalle de la cotización">
                          <IconButton
                            color="info"
                            onClick={() => handleOpenVer(c)}
                            sx={{ mr: 1 }}
                          >
                            <FaEye />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar cotización">
                          <IconButton
                            color="secondary"
                            onClick={() => handleOpenNueva(c)}
                            sx={{ mr: 1 }}
                          >
                            <FaEdit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Convertir esta cotización en una venta con consecutivo">
                          <IconButton
                            color="primary"
                            onClick={() =>
                              navigate(`/ventas/nueva?fromCotizacion=${c._id}`, {
                                state: { fromCotizacion: c },
                              })
                            }
                            sx={{ mr: 1 }}
                          >
                            <FaExchangeAlt />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Imprimir cotización">
                          <IconButton
                            color="secondary"
                            onClick={() => navigate(`/cotizaciones/ver/${c._id}?print=1`)}
                            sx={{ mr: 1 }}
                          >
                            <FaPrint />
                          </IconButton>
                        </Tooltip>
                        {c.estado !== 'rechazada' && (
                          <Tooltip title="Marcar la cotización como rechazada">
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleRechazar(c)}
                            >
                              Rechazar
                            </Button>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {cotizaciones.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay cotizaciones registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Modal nueva cotización */}
      <Dialog open={openNueva} onClose={handleCloseNueva} fullWidth maxWidth="md">
        <DialogTitle>{editingCotizacionId ? 'Editar cotización' : 'Nueva cotización'}</DialogTitle>
        <DialogContent>
          {editingCotizacionId && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Última edición:{' '}
                {editingCotizacion?.updatedAt
                  ? new Date(editingCotizacion.updatedAt).toLocaleString()
                  : '-'}
              </Typography>
            </Box>
          )}
          <FormControl margin="normal" fullWidth>
            <InputLabel id="cliente-label">Cliente</InputLabel>
            <Select
              labelId="cliente-label"
              id="cliente"
              name="cliente"
              value={formNueva.cliente}
              label="Cliente"
              onChange={(e) =>
                setFormNueva((prev) => ({ ...prev, cliente: e.target.value }))
              }
            >
              {clientes.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.nombreCompleto}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl margin="normal" fullWidth>
            <InputLabel id="tipo-servicio-label">Tipo de servicio</InputLabel>
            <Select
              labelId="tipo-servicio-label"
              id="tipoDeServicio"
              name="tipoDeServicio"
              value={formNueva.tipoDeServicio}
              label="Tipo de servicio"
              onChange={(e) =>
                setFormNueva((prev) => ({
                  ...prev,
                  tipoDeServicio: e.target.value,
                  productos: [],
                }))
              }
            >
              <MenuItem value="Venta">Venta</MenuItem>
              <MenuItem value="Alquiler">Alquiler</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 2, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1">Productos</Typography>
            <Tooltip title="Agregar un producto a la cotización">
              <Button variant="outlined" size="small" onClick={handleAddProducto}>
                Agregar producto
              </Button>
            </Tooltip>
          </Box>

          {formNueva.productos.map((item, index) => (
            <Paper key={index} sx={{ p: 2, mb: 1 }} variant="outlined">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id={`producto-label-${index}`}>Producto</InputLabel>
                    <Select
                      labelId={`producto-label-${index}`}
                      value={item.producto}
                      label="Producto"
                      onChange={(e) =>
                        handleChangeProducto(index, 'producto', e.target.value)
                      }
                    >
                      {productosFiltrados.map((p) => (
                        <MenuItem key={p._id} value={p._id}>
                          {p.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="Cantidad"
                    type="number"
                    fullWidth
                    value={item.cantidad}
                    onChange={(e) =>
                      handleChangeProducto(index, 'cantidad', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Precio unitario"
                    type="number"
                    fullWidth
                    value={item.precioUnitario}
                    onChange={(e) =>
                      handleChangeProducto(index, 'precioUnitario', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="Subtotal"
                    type="number"
                    fullWidth
                    value={item.subtotal}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="Quitar este producto de la cotización">
                    <Button
                      color="error"
                      onClick={() => handleRemoveProducto(index)}
                    >
                      X
                    </Button>
                  </Tooltip>
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">
              Total: {calcularTotal(formNueva.productos).toFixed(2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNueva}>Cancelar</Button>
          <Button onClick={handleSubmitNueva} variant="contained">
            {editingCotizacionId ? 'Guardar cambios' : 'Guardar cotización'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal ver cotización */}
      <Dialog open={openVer} onClose={handleCloseVer} fullWidth maxWidth="md">
        <DialogTitle>Detalle de la cotización</DialogTitle>
        <DialogContent dividers>
          {loadingVer ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : cotizacionVer ? (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {cotizacionVer.cliente?.nombreCompleto || 'Sin cliente'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estado: {cotizacionVer.estado || 'borrador'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tipo de servicio: {cotizacionVer.tipoDeServicio || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Creada:{' '}
                {cotizacionVer.createdAt
                  ? new Date(cotizacionVer.createdAt).toLocaleString()
                  : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fecha de expedición:{' '}
                {cotizacionVer.fechaExpedicion
                  ? new Date(cotizacionVer.fechaExpedicion).toLocaleString()
                  : cotizacionVer.createdAt
                    ? new Date(cotizacionVer.createdAt).toLocaleString()
                    : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Última edición:{' '}
                {cotizacionVer.updatedAt
                  ? new Date(cotizacionVer.updatedAt).toLocaleString()
                  : '-'}
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Productos
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2, mb: 2 }}>
                {(cotizacionVer.productos || []).map((p, idx) => (
                  <li key={idx}>
                    {p.producto?.nombre || 'Producto'} × {p.cantidad} — ${Number(p.subtotal || 0).toFixed(2)}
                  </li>
                ))}
              </Box>

              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                Total: ${Number(cotizacionVer.total || 0).toFixed(2)}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No se pudo cargar la cotización.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {cotizacionVer && (
            <Button
              variant="outlined"
              onClick={() => navigate(`/cotizaciones/ver/${cotizacionVer._id}?print=1`)}
            >
              Imprimir
            </Button>
          )}
          {cotizacionVer && (
            <Button
              variant="outlined"
              onClick={() => {
                handleCloseVer();
                handleOpenNueva(cotizacionVer);
              }}
            >
              Editar
            </Button>
          )}
          <Button onClick={handleCloseVer}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cotizaciones;
