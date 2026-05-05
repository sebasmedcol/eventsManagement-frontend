import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControlLabel,
  Checkbox,
  IconButton,
  CircularProgress,
  Container,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Autocomplete,
  Tooltip
} from '@mui/material';

const VentaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    cliente: '',
    facturaHasConsecutivo: '',
    productos: [],
    tipoDeServicio: '',
    duracionDelEvento: '',
    fechaDelEvento: '',
    eventoInicio: '',
    eventoFin: '',
    soloCobrarTiempoEvento: false,
    loadInInicio: '',
    loadOutFin: '',
    subtotal: 0,
    descuento: 0,
    ivaPorcentaje: 0,
    ivaValor: 0,
    abono: 0,
    totalPagar: 0,
    estado: true,
    clienteTelefono: '',
    clienteDireccion: ''
  });

  const [clientes, setClientes] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [facturasConsecutivos, setFacturasConsecutivos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientesRes, productosRes, facturasConsecutivosRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/productos'),
        api.get('/factura-consecutivo')
      ]);

      setClientes(clientesRes.data.filter(cliente => cliente.estado));
      setProductosDisponibles(productosRes.data.filter(producto => producto.estado));
      // Filtrar solo relaciones con factura y consecutivo activos
      const relacionesActivas = (facturasConsecutivosRes.data || []).filter((item) =>
        item && item.factura && item.consecutivo && item.factura.estado && item.consecutivo.estado
      );
      setFacturasConsecutivos(relacionesActivas);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar los datos');
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVenta = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ventas/${id}`);
      
      // Formatear la fecha del evento para el input date
      let ventaData = response.data;
      if (ventaData.fechaDelEvento) {
        const fecha = new Date(ventaData.fechaDelEvento);
        ventaData.fechaDelEvento = fecha.toISOString().split('T')[0];
      }

      const toDateTimeLocal = (value) => {
        if (!value) return '';
        const d = new Date(value);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
      };

      ventaData.eventoInicio = toDateTimeLocal(ventaData.eventoInicio);
      ventaData.eventoFin = toDateTimeLocal(ventaData.eventoFin);
      ventaData.loadInInicio = toDateTimeLocal(ventaData.loadInInicio);
      ventaData.loadOutFin = toDateTimeLocal(ventaData.loadOutFin);
      ventaData.soloCobrarTiempoEvento = !!ventaData.soloCobrarTiempoEvento;
      ventaData.estado = ventaData.estado === 'activa';
      
      setFormData(ventaData);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Error al cargar los datos de la venta'
      );
      console.error('Error al cargar venta:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    if (isEditMode) {
      fetchVenta();
    }
  }, [fetchData, fetchVenta, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let newValue = type === 'checkbox' ? checked : value;
    
    // Convertir valores numéricos
    if (name === 'descuento' || name === 'abono' || name === 'ivaPorcentaje') {
      newValue = value === '' ? 0 : parseFloat(value);
    }
    
    if (name === 'cliente') {
      const cliente = clientes.find(c => c._id === value);
      if (cliente) {
        setFormData(prev => ({
          ...prev,
          [name]: newValue,
          clienteTelefono: cliente.telefono || '',
          clienteDireccion: cliente.direccion || ''
        }));
        return;
      }
    }

    if (name === 'tipoDeServicio') {
      setProductoSeleccionado('');
      setCantidadProducto(1);
      setFormData((prev) => ({
        ...prev,
        tipoDeServicio: newValue,
        eventoInicio: newValue === 'Alquiler' ? prev.eventoInicio : '',
        eventoFin: newValue === 'Alquiler' ? prev.eventoFin : '',
        loadInInicio: newValue === 'Alquiler' ? prev.loadInInicio : '',
        loadOutFin: newValue === 'Alquiler' ? prev.loadOutFin : '',
        soloCobrarTiempoEvento: newValue === 'Alquiler' ? prev.soloCobrarTiempoEvento : false,
        duracionDelEvento: '',
      }));
      return;
    }

    if (name === 'facturaHasConsecutivo') {
      const rel = facturasConsecutivos.find((x) => x._id === value);
      setFormData((prev) => ({
        ...prev,
        facturaHasConsecutivo: value,
        ivaPorcentaje: rel?.factura?.ivaPorcentaje ?? prev.ivaPorcentaje ?? 0,
      }));
      return;
    }
    
    setFormData(prev => {
      const newData = { ...prev, [name]: newValue };
      
      return newData;
    });
  };

  const parseDateTimeLocal = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  const formatDuration = (minutes) => {
    const total = Math.max(0, Math.floor(minutes));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const getMinutosCobro = useCallback(() => {
    if (formData.tipoDeServicio !== 'Alquiler') return 60;
    const eventoInicio = parseDateTimeLocal(formData.eventoInicio);
    const eventoFin = parseDateTimeLocal(formData.eventoFin);
    const loadInInicio = parseDateTimeLocal(formData.loadInInicio);
    const loadOutFin = parseDateTimeLocal(formData.loadOutFin);
    if (!eventoInicio || !eventoFin) return 0;
    if (!loadInInicio || !loadOutFin) return 0;
    const inicio = formData.soloCobrarTiempoEvento ? eventoInicio : loadInInicio;
    const fin = formData.soloCobrarTiempoEvento ? eventoFin : loadOutFin;
    const diff = Math.round((fin.getTime() - inicio.getTime()) / 60000);
    return diff > 0 ? diff : 0;
  }, [
    formData.tipoDeServicio,
    formData.eventoInicio,
    formData.eventoFin,
    formData.loadInInicio,
    formData.loadOutFin,
    formData.soloCobrarTiempoEvento,
  ]);

  const calcularTotales = useCallback(() => {
    const minutosCobro = getMinutosCobro();
    const horasCobro = formData.tipoDeServicio === 'Venta' ? 1 : minutosCobro / 60;

    const productosCalculados = formData.productos.map((item) => {
      const tipoDeCobro = item.producto?.tipoDeCobro || 'unidad';
      const precio = Number(item.precioUnitario) || 0;
      const cantidad = Number(item.cantidad) || 0;
      const subtotalItem =
        tipoDeCobro === 'hora' ? round2(precio * cantidad * horasCobro) : round2(precio * cantidad);
      return { ...item, subtotal: subtotalItem };
    });

    const subtotal = round2(productosCalculados.reduce((acc, x) => acc + (Number(x.subtotal) || 0), 0));
    const descuento = Math.max(0, Number(formData.descuento) || 0);
    const ivaPorcentaje = Math.min(100, Math.max(0, Number(formData.ivaPorcentaje) || 0));
    const base = Math.max(0, subtotal - descuento);
    const ivaValor = round2(base * (ivaPorcentaje / 100));
    const totalPagar = round2(base + ivaValor);

    setFormData((prev) => {
      const prevProductos = prev.productos || [];
      const sameProducts =
        prevProductos.length === productosCalculados.length &&
        prevProductos.every((p, idx) => (p.subtotal ?? 0) === (productosCalculados[idx].subtotal ?? 0));

      return {
        ...prev,
        productos: sameProducts ? prev.productos : productosCalculados,
        subtotal,
        ivaPorcentaje,
        ivaValor,
        totalPagar,
        duracionDelEvento: prev.tipoDeServicio === 'Alquiler' ? formatDuration(minutosCobro) : '',
      };
    });
  }, [
    formData.productos,
    formData.descuento,
    formData.ivaPorcentaje,
    formData.tipoDeServicio,
    getMinutosCobro,
  ]);

  useEffect(() => {
    calcularTotales();
  }, [calcularTotales]);

  const handleCantidadChange = (e) => {
    setCantidadProducto(parseInt(e.target.value) || 1);
  };

  const agregarProducto = () => {
    if (!productoSeleccionado) {
      toast.error('Debe seleccionar un producto');
      return;
    }

    const producto = productosDisponibles.find(p => p._id === productoSeleccionado);
    if (!producto) return;

    const stockTotal = producto.cantidadTotal != null ? Number(producto.cantidadTotal) : 0;
    const existente = formData.productos.find((p) => p.producto._id === productoSeleccionado);
    const cantidadActual = existente ? Number(existente.cantidad) || 0 : 0;
    const nuevaCantidad = cantidadActual + cantidadProducto;

    if (stockTotal >= 0 && nuevaCantidad > stockTotal) {
      toast.error(`La cantidad no puede superar el stock (${stockTotal})`);
      return;
    }

    if (producto.tipoDeCobro === 'hora' && formData.tipoDeServicio === 'Alquiler') {
      const minutosCobro = getMinutosCobro();
      if (!minutosCobro) {
        toast.error('Seleccione primero las fechas/horas para calcular la duración');
        return;
      }
    }

    // Verificar si el producto ya está en la lista
    const productoExistente = formData.productos.find(p => p.producto._id === productoSeleccionado);
    
    let nuevosProductos;
    if (productoExistente) {
      // Actualizar cantidad si ya existe
      nuevosProductos = formData.productos.map(p => 
        p.producto._id === productoSeleccionado 
          ? { ...p, cantidad: nuevaCantidad } 
          : p
      );
    } else {
      // Agregar nuevo producto
      nuevosProductos = [
        ...formData.productos,
        {
          producto,
          cantidad: cantidadProducto,
          precioUnitario: producto.precio,
          subtotal: 0
        }
      ];
    }

    setFormData(prev => ({
      ...prev,
      productos: nuevosProductos
    }));

    // Resetear selección
    setProductoSeleccionado('');
    setCantidadProducto(1);
  };

  const eliminarProducto = (index) => {
    const nuevosProductos = formData.productos.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      productos: nuevosProductos
    }));
  };

  // Validación: asegurar que la relación factura-consecutivo existe y está activa
  const validateFacturaConsecutivoActivo = async () => {
    try {
      if (!formData.facturaHasConsecutivo) return false;
      const res = await api.get(`/factura-consecutivo/${formData.facturaHasConsecutivo}`);
      const rel = res.data;
      if (!rel || !rel.factura || !rel.consecutivo) {
        toast.error('La relación factura-consecutivo no existe o está incompleta');
        return false;
      }
      if (!rel.factura.estado || !rel.consecutivo.estado) {
        toast.error('La factura y/o el consecutivo están inactivos');
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      toast.error('No se pudo validar la factura y consecutivo, intente nuevamente');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.cliente || !formData.facturaHasConsecutivo || formData.productos.length === 0 || !formData.tipoDeServicio) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    if (formData.tipoDeServicio === 'Alquiler') {
      if (!formData.eventoInicio || !formData.eventoFin || !formData.loadInInicio || !formData.loadOutFin) {
        toast.error('Por favor complete las fechas y horas del evento y load-in/load-out');
        return;
      }
    }

    try {
      setSubmitting(true);
      // Validación adicional: relación activa
      const relacionValida = await validateFacturaConsecutivoActivo();
      if (!relacionValida) {
        setSubmitting(false);
        return;
      }
      
      // Preparar datos para enviar
      const ventaData = {
        ...formData,
        // Asegurarse de que los valores numéricos sean números
        subtotal: parseFloat(formData.subtotal),
        descuento: parseFloat(formData.descuento),
        ivaPorcentaje: parseFloat(formData.ivaPorcentaje),
        ivaValor: parseFloat(formData.ivaValor),
        abono: parseFloat(formData.abono),
        totalPagar: parseFloat(formData.totalPagar),
        estado: formData.estado ? 'activa' : 'cancelada',
        // Formatear productos para el backend
        productos: formData.productos.map(p => ({
          producto: p.producto._id,
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario,
          subtotal: p.subtotal
        })),
        // Incluir datos del cliente
        clienteTelefono: formData.clienteTelefono,
        clienteDireccion: formData.clienteDireccion
      };
      
      if (isEditMode) {
        await api.put(`/ventas/${id}`, ventaData);
        toast.success('Venta actualizada correctamente');
      } else {
        await api.post('/ventas', ventaData);
        toast.success('Venta creada correctamente');
      }
      
      navigate('/ventas');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar la venta');
      console.error('Error al guardar venta:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const mapTipoServicio = (value) => {
    if (value === 'Evento') return 'Alquiler';
    return value;
  };

  const productosFiltrados = productosDisponibles.filter((p) => {
    const servicio = mapTipoServicio(formData.tipoDeServicio);
    if (!servicio) return true;
    if (!p.tipoDeServicio) return true;
    return p.tipoDeServicio === servicio;
  });

  const puedeSeleccionarProductos = !!formData.tipoDeServicio;
  const productosParaSelector = puedeSeleccionarProductos ? productosFiltrados : [];

  const productoSeleccionadoObj =
    productosParaSelector.find((p) => p._id === productoSeleccionado) || null;
  const stockMaxSeleccionado =
    productoSeleccionadoObj?.cantidadTotal != null
      ? Number(productoSeleccionadoObj.cantidadTotal)
      : null;
  const cantidadExcedeStock =
    stockMaxSeleccionado != null ? cantidadProducto > stockMaxSeleccionado : false;

  const getProductoLabel = (p) => {
    const base = `${p.nombre} - ${formatCurrency(p.precio)}`;
    if (p.tipoDeCobro === 'hora') return `${base} / hora`;
    return `${base} / unidad`;
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('es-CO');
  };

  const fechaExpedicion = isEditMode
    ? formatDateTime(formData.fecha || formData.createdAt)
    : new Date().toLocaleString('es-CO');

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/ventas')}
          sx={{ mr: 2 }}
        >
          <FaArrowLeft />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {isEditMode ? 'Editar Venta' : 'Nueva Venta'}
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Cliente */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(option) => option.nombreCompleto || ''}
                  value={clientes.find(c => c._id === formData.cliente) || null}
                  onChange={(event, newValue) => {
                    setFormData({
                      ...formData,
                      cliente: newValue ? newValue._id : '',
                      clienteTelefono: newValue ? newValue.telefono || '' : '',
                      clienteDireccion: newValue ? newValue.direccion || '' : ''
                    });
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Cliente" 
                      variant="outlined" 
                      required 
                    />
                  )}
                  filterOptions={(options, state) => {
                    return options.filter(option =>
                      option.nombreCompleto.toLowerCase().includes(state.inputValue.toLowerCase())
                    );
                  }}
                />
              </FormControl>
            </Grid>
            
            {/* Teléfono del Cliente */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Teléfono del Cliente"
                name="clienteTelefono"
                value={formData.clienteTelefono}
                onChange={handleChange}
                disabled={!formData.cliente}
              />
            </Grid>
            
            {/* Dirección del Cliente */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Dirección del Cliente"
                name="clienteDireccion"
                value={formData.clienteDireccion}
                onChange={handleChange}
                disabled={!formData.cliente}
              />
            </Grid>

            {/* Factura y Consecutivo */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Factura y Consecutivo</InputLabel>
                <Select
                  name="facturaHasConsecutivo"
                  value={formData.facturaHasConsecutivo}
                  onChange={handleChange}
                  label="Factura y Consecutivo"
                >
                  {facturasConsecutivos.map(item => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.factura.nombre} - Consecutivo: {item.consecutivo.contador}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Tipo de Servicio */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Servicio</InputLabel>
                <Select
                  name="tipoDeServicio"
                  value={formData.tipoDeServicio}
                  onChange={handleChange}
                  label="Tipo de Servicio"
                >
                  <MenuItem value="Alquiler">Alquiler</MenuItem>
                  <MenuItem value="Venta">Venta</MenuItem>
                  {formData.tipoDeServicio &&
                    !['Alquiler', 'Venta'].includes(formData.tipoDeServicio) && (
                      <MenuItem value={formData.tipoDeServicio}>
                        {formData.tipoDeServicio}
                      </MenuItem>
                    )}
                </Select>
              </FormControl>
            </Grid>

            {/* Fecha de expedición */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fecha de expedición de Comprobante"
                value={fechaExpedicion}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            </Grid>
          </Grid>

          {formData.tipoDeServicio === 'Alquiler' && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                Evento y Cronograma
              </Typography>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Inicio del evento"
                    name="eventoInicio"
                    type="datetime-local"
                    value={formData.eventoInicio}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fin del evento"
                    name="eventoFin"
                    type="datetime-local"
                    value={formData.eventoFin}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="soloCobrarTiempoEvento"
                        checked={formData.soloCobrarTiempoEvento}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="Solo tener en cuenta tiempo de fecha de evento para cobrar"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Tooltip title="Montaje">
                    <Box>
                      <TextField
                        fullWidth
                        label="Load-in (inicio)"
                        name="loadInInicio"
                        type="datetime-local"
                        value={formData.loadInInicio}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        required
                      />
                    </Box>
                  </Tooltip>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Tooltip title="Desmontaje">
                    <Box>
                      <TextField
                        fullWidth
                        label="Load-out (fin)"
                        name="loadOutFin"
                        type="datetime-local"
                        value={formData.loadOutFin}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        required
                      />
                    </Box>
                  </Tooltip>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Duración del evento"
                    value={formData.duracionDelEvento}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Sección de Productos */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
              Productos *
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={productosParaSelector}
                    getOptionLabel={getProductoLabel}
                    value={productosParaSelector.find(p => p._id === productoSeleccionado) || null}
                    onChange={(event, newValue) => {
                      setProductoSeleccionado(newValue ? newValue._id : '');
                    }}
                    disabled={!puedeSeleccionarProductos}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Producto" 
                        variant="outlined" 
                        helperText={
                          !puedeSeleccionarProductos
                            ? 'Seleccione primero el tipo de servicio'
                            : undefined
                        }
                      />
                    )}
                    filterOptions={(options, state) => {
                      return options.filter(option =>
                        option.nombre.toLowerCase().includes(state.inputValue.toLowerCase())
                      );
                    }}
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label={
                    stockMaxSeleccionado != null
                      ? `Cantidad (máx: ${stockMaxSeleccionado})`
                      : 'Cantidad'
                  }
                  type="number"
                  value={cantidadProducto}
                  onChange={handleCantidadChange}
                  inputProps={{
                    min: 1,
                    ...(stockMaxSeleccionado != null ? { max: stockMaxSeleccionado } : {}),
                  }}
                  variant="outlined"
                  disabled={!puedeSeleccionarProductos || !productoSeleccionadoObj}
                  error={!!productoSeleccionadoObj && cantidadExcedeStock}
                  helperText={
                    productoSeleccionadoObj
                      ? stockMaxSeleccionado != null
                        ? `Stock disponible: ${stockMaxSeleccionado}`
                        : 'Stock disponible: 0'
                      : 'Seleccione un producto para ver el stock'
                  }
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Button
                  type="button"
                  onClick={agregarProducto}
                  variant="contained"
                  startIcon={<FaPlus />}
                  sx={{ height: '56px' }}
                  disabled={!productoSeleccionado || cantidadExcedeStock}
                >
                  Agregar
                </Button>
              </Grid>
            </Grid>
            
            {/* Lista de productos agregados */}
            {formData.productos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography color="text.secondary">No hay productos agregados</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Precio Unitario</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.productos.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.producto.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(item.precioUnitario)}
                            {item.producto.tipoDeCobro === 'hora' ? ' / hora' : ' / unidad'}
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
                        <TableCell align="right">
                          <IconButton
                            onClick={() => eliminarProducto(index)}
                            color="error"
                            size="small"
                          >
                            <FaTrash />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Sección de Totales */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descuento"
                    name="descuento"
                    type="number"
                    value={formData.descuento}
                    onChange={handleChange}
                    inputProps={{ min: 0 }}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="IVA (%)"
                    name="ivaPorcentaje"
                    type="number"
                    value={formData.ivaPorcentaje}
                    onChange={handleChange}
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Abono"
                    name="abono"
                    type="number"
                    value={formData.abono}
                    onChange={handleChange}
                    inputProps={{ min: 0 }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="estado"
                        checked={formData.estado}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="Activa"
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50' }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="medium">Subtotal:</Typography>
                    <Typography variant="body2">{formatCurrency(formData.subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="medium">Descuento:</Typography>
                    <Typography variant="body2">{formatCurrency(formData.descuento)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="medium">IVA:</Typography>
                    <Typography variant="body2">{formatCurrency(formData.ivaValor)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="medium">Total a Pagar (incl. IVA):</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatCurrency(formData.totalPagar)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2" fontWeight="medium">Abono:</Typography>
                    <Typography variant="body2">{formatCurrency(formData.abono)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="medium">Saldo Pendiente:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="error">
                      {formatCurrency(Math.max(0, formData.totalPagar - formData.abono))}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <FaSave />}
              sx={{ py: 1.5, px: 3 }}
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default VentaForm;
