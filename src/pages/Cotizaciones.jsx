import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPlus, FaExchangeAlt, FaEye, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
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
  convertirCotizacionAVenta,
  updateCotizacion,
} from '../services/cotizacionService';
import { getRelacionesFacturaConsecutivo } from '../services/facturaConsecutivoService';

const Cotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [relacionesFC, setRelacionesFC] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openNueva, setOpenNueva] = useState(false);
  const [editingCotizacionId, setEditingCotizacionId] = useState('');
  const [editingCotizacion, setEditingCotizacion] = useState(null);
  const [openConvertir, setOpenConvertir] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [openVer, setOpenVer] = useState(false);
  const [cotizacionVer, setCotizacionVer] = useState(null);
  const [loadingVer, setLoadingVer] = useState(false);

  const [formNueva, setFormNueva] = useState({
    cliente: '',
    productos: [],
  });

  const [formConvertir, setFormConvertir] = useState({
    facturaHasConsecutivo: '',
    tipoDeServicio: '',
    duracionDelEvento: '',
    fechaDelEvento: '',
    fechaInicio: '',
    fechaFin: '',
    descuento: 0,
    abono: 0,
    clienteTelefono: '',
    clienteDireccion: '',
  });

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const focusId = searchParams.get('focus') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cotz, cls, prods, rels] = await Promise.all([
          getCotizaciones(),
          getClientes(),
          getProductos(),
          getRelacionesFacturaConsecutivo(),
        ]);
        setCotizaciones(cotz);
        setClientes(cls);
        setProductos(prods);
        setRelacionesFC(rels);
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

  const handleOpenNueva = (cotizacion = null) => {
    if (cotizacion) {
      setEditingCotizacionId(cotizacion._id);
      setEditingCotizacion(cotizacion);
      setFormNueva({
        cliente: cotizacion.cliente?._id || cotizacion.cliente || '',
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
      const item = { ...updated[index], [field]: value };
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
      if (!formNueva.cliente || formNueva.productos.length === 0) {
        toast.error('Seleccione cliente y al menos un producto');
        return;
      }

      const total = calcularTotal(formNueva.productos);

      const payload = {
        cliente: formNueva.cliente,
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

  const handleOpenConvertir = (cotizacion) => {
    setCotizacionSeleccionada(cotizacion);
    setFormConvertir({
      facturaHasConsecutivo: '',
      tipoDeServicio: '',
      duracionDelEvento: '',
      fechaDelEvento: '',
      fechaInicio: '',
      fechaFin: '',
      descuento: 0,
      abono: 0,
      clienteTelefono: cotizacion.cliente?.telefono || '',
      clienteDireccion: cotizacion.cliente?.direccion || '',
    });
    setOpenConvertir(true);
  };

  const handleCloseConvertir = () => {
    setOpenConvertir(false);
  };

  const handleChangeConvertir = (e) => {
    const { name, value } = e.target;
    setFormConvertir((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitConvertir = async () => {
    try {
      const {
        facturaHasConsecutivo,
        tipoDeServicio,
        duracionDelEvento,
        fechaDelEvento,
        fechaInicio,
        fechaFin,
        descuento,
        abono,
        clienteTelefono,
        clienteDireccion,
      } = formConvertir;

      if (
        !facturaHasConsecutivo ||
        !tipoDeServicio ||
        !duracionDelEvento ||
        !fechaDelEvento ||
        !fechaInicio ||
        !fechaFin
      ) {
        toast.error('Complete los campos requeridos para la venta');
        return;
      }

      const payload = {
        facturaHasConsecutivo,
        tipoDeServicio,
        duracionDelEvento,
        fechaDelEvento,
        fechaInicio,
        fechaFin,
        descuento: Number(descuento) || 0,
        abono: Number(abono) || 0,
        clienteTelefono,
        clienteDireccion,
      };

      await convertirCotizacionAVenta(cotizacionSeleccionada._id, payload);
      toast.success('Cotización convertida a venta');
      setOpenConvertir(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Error al convertir la cotización'
      );
      console.error('Error convertir cotización:', error);
    }
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
                            onClick={() => handleOpenConvertir(c)}
                            sx={{ mr: 1 }}
                          >
                            <FaExchangeAlt />
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
                      {productos.map((p) => (
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
                Creada:{' '}
                {cotizacionVer.createdAt
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

      {/* Modal convertir a venta */}
      <Dialog
        open={openConvertir}
        onClose={handleCloseConvertir}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Convertir a venta</DialogTitle>
        <DialogContent>
          <FormControl margin="normal" fullWidth>
            <InputLabel id="fc-label">Factura / Consecutivo</InputLabel>
            <Select
              labelId="fc-label"
              id="facturaHasConsecutivo"
              name="facturaHasConsecutivo"
              value={formConvertir.facturaHasConsecutivo}
              label="Factura / Consecutivo"
              onChange={handleChangeConvertir}
            >
              {relacionesFC.map((r) => (
                <MenuItem key={r._id} value={r._id}>
                  {r.factura?.nombre} - {r.consecutivo?.contador}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="normal"
            fullWidth
            name="tipoDeServicio"
            label="Tipo de servicio"
            value={formConvertir.tipoDeServicio}
            onChange={handleChangeConvertir}
          />
          <TextField
            margin="normal"
            fullWidth
            name="duracionDelEvento"
            label="Duración del evento"
            value={formConvertir.duracionDelEvento}
            onChange={handleChangeConvertir}
          />
          <TextField
            margin="normal"
            fullWidth
            name="fechaDelEvento"
            label="Fecha del evento"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formConvertir.fechaDelEvento}
            onChange={handleChangeConvertir}
          />
          <TextField
            margin="normal"
            fullWidth
            name="fechaInicio"
            label="Fecha inicio (montaje)"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formConvertir.fechaInicio}
            onChange={handleChangeConvertir}
          />
          <TextField
            margin="normal"
            fullWidth
            name="fechaFin"
            label="Fecha fin (desmontaje)"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formConvertir.fechaFin}
            onChange={handleChangeConvertir}
          />

          <TextField
            margin="normal"
            fullWidth
            name="descuento"
            label="Descuento"
            type="number"
            value={formConvertir.descuento}
            onChange={handleChangeConvertir}
          />
          <TextField
            margin="normal"
            fullWidth
            name="abono"
            label="Abono"
            type="number"
            value={formConvertir.abono}
            onChange={handleChangeConvertir}
          />
          <TextField
            margin="normal"
            fullWidth
            name="clienteTelefono"
            label="Teléfono cliente"
            value={formConvertir.clienteTelefono}
            onChange={handleChangeConvertir}
          />
          <TextField
            margin="normal"
            fullWidth
            name="clienteDireccion"
            label="Dirección cliente"
            value={formConvertir.clienteDireccion}
            onChange={handleChangeConvertir}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConvertir}>Cancelar</Button>
          <Button onClick={handleSubmitConvertir} variant="contained">
            Convertir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cotizaciones;
