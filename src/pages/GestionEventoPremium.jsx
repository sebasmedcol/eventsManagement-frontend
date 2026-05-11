import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  FaArrowLeft,
  FaInfoCircle,
  FaPlus,
  FaTrash,
  FaEdit,
  FaBoxes,
  FaFileCsv,
  FaShoppingCart,
  FaFileInvoiceDollar,
  FaSave,
  FaUndoAlt,
} from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import {
  fetchEventoPremiumById,
  fetchFichasEventoPremium,
  createFichaEventoPremium,
  updateFichaEventoPremium,
  deleteFichaEventoPremium,
  fetchUsuariosEmpresaPremiumEventos,
  fetchFichaEventoPremium,
  addProductoFichaEventoPremium,
  updateProductoFichaEventoPremium,
  deleteProductoFichaEventoPremium,
} from '../services/eventoService';

const COLOR_KEYS = [
  { key: 'primary', label: 'Azul' },
  { key: 'secondary', label: 'Morado' },
  { key: 'success', label: 'Verde' },
  { key: 'warning', label: 'Amarillo' },
  { key: 'error', label: 'Rojo' },
  { key: 'info', label: 'Cian' },
];

const TIPOS_FICHA = ['Alquiler', 'Venta', 'Notas'];

const PLANES_PREMIUM = ['premium', 'super'];

const GestionEventoPremium = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const focusFichaId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('focusFicha') || '';
  }, [location.search]);

  const planEmpresa =
    user?.empresa && typeof user.empresa === 'object' ? user.empresa.plan : '';
  const hasPremium = user?.rol === 'superadmin' || PLANES_PREMIUM.includes(planEmpresa);

  const [loading, setLoading] = useState(true);
  const [evento, setEvento] = useState(null);
  const [fichas, setFichas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);

  const [fichaModalOpen, setFichaModalOpen] = useState(false);
  const [fichaEditing, setFichaEditing] = useState(null);
  const [fichaForm, setFichaForm] = useState({
    nombre: '',
    descripcion: '',
    color: 'info',
    responsable: '',
    tipoDeServicio: 'Alquiler',
    nota: '',
  });
  const fichaFormSnapshot = useRef(null);

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoFicha, setInfoFicha] = useState(null);

  const [productosOpen, setProductosOpen] = useState(false);
  const [productosFicha, setProductosFicha] = useState(null);
  const [productosFichaLoading, setProductosFichaLoading] = useState(false);
  const [addProd, setAddProd] = useState({ producto: '', cantidad: 1, precioUnitario: '' });
  const [productosEdit, setProductosEdit] = useState([]);
  const [productosDirty, setProductosDirty] = useState({});
  const [productosSaving, setProductosSaving] = useState({});
  const [productosSavingAll, setProductosSavingAll] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmPrimaryAction = useRef(null);
  const confirmSecondaryAction = useRef(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [eventoRes, fichasRes, usuariosRes] = await Promise.all([
        fetchEventoPremiumById(id),
        fetchFichasEventoPremium(id),
        fetchUsuariosEmpresaPremiumEventos(),
      ]);
      setEvento(eventoRes.data);
      setFichas(Array.isArray(fichasRes.data) ? fichasRes.data : []);
      setUsuarios(Array.isArray(usuariosRes.data) ? usuariosRes.data : []);
      try {
        const prodRes = await api.get('/productos');
        setProductos(Array.isArray(prodRes.data) ? prodRes.data : []);
      } catch (err) {
        setProductos([]);
        console.error(err);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar gestión del evento');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!hasPremium) {
      setLoading(false);
      return;
    }
    loadData();
  }, [hasPremium, loadData]);

  useEffect(() => {
    if (!focusFichaId) return;
    if (!Array.isArray(fichas) || fichas.length === 0) return;
    const found = fichas.find((f) => f._id === focusFichaId);
    if (!found) return;
    const el = document.getElementById(`ficha-${focusFichaId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    openInfo(found);
  }, [focusFichaId, fichas]);

  const paletteFromKey = (key) => {
    const pal = theme.palette[key];
    return pal || theme.palette.info;
  };

  const formatDateShort = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-CO');
  };

  const openFichaCreate = () => {
    setFichaEditing(null);
    const initial = {
      nombre: '',
      descripcion: '',
      color: 'info',
      responsable: '',
      tipoDeServicio: 'Alquiler',
      nota: '',
    };
    fichaFormSnapshot.current = initial;
    setFichaForm(initial);
    setFichaModalOpen(true);
  };

  const openFichaEdit = (ficha) => {
    setFichaEditing(ficha);
    const initial = {
      nombre: ficha.nombre || '',
      descripcion: ficha.descripcion || '',
      color: ficha.color || 'info',
      responsable: ficha.responsable?._id || ficha.responsable || '',
      tipoDeServicio: ficha.tipoDeServicio || 'Alquiler',
      nota: ficha.nota || '',
    };
    fichaFormSnapshot.current = initial;
    setFichaForm(initial);
    setFichaModalOpen(true);
  };

  const closeFichaModal = () => {
    setFichaModalOpen(false);
    setFichaEditing(null);
  };

  const handleFichaChange = (e) => {
    const { name, value } = e.target;
    setFichaForm((p) => ({ ...p, [name]: value }));
  };

  const fichaFormHasUnsavedChanges = useMemo(() => {
    const snap = fichaFormSnapshot.current;
    if (!fichaModalOpen || !snap) return false;
    return (
      fichaForm.nombre !== snap.nombre ||
      fichaForm.descripcion !== snap.descripcion ||
      fichaForm.color !== snap.color ||
      fichaForm.responsable !== snap.responsable ||
      fichaForm.tipoDeServicio !== snap.tipoDeServicio ||
      fichaForm.nota !== snap.nota
    );
  }, [fichaForm, fichaModalOpen]);

  const saveFicha = async () => {
    try {
      if (!fichaForm.nombre.trim() || !fichaForm.responsable || !fichaForm.tipoDeServicio) {
        toast.error('Complete los campos obligatorios');
        return;
      }
      if (fichaForm.tipoDeServicio === 'Notas' && fichaForm.nota.trim().length > 500) {
        toast.error('La nota no puede superar 500 caracteres');
        return;
      }

      const payload = {
        nombre: fichaForm.nombre.trim(),
        descripcion: fichaForm.descripcion.trim(),
        color: fichaForm.color,
        responsable: fichaForm.responsable,
        tipoDeServicio: fichaForm.tipoDeServicio,
        nota: fichaForm.tipoDeServicio === 'Notas' ? fichaForm.nota.trim() : '',
      };

      if (fichaEditing?._id) {
        const res = await updateFichaEventoPremium(fichaEditing._id, payload);
        setFichas((prev) => prev.map((f) => (f._id === fichaEditing._id ? res.data : f)));
        toast.success('Ficha actualizada');
      } else {
        const res = await createFichaEventoPremium(id, payload);
        setFichas((prev) => [...prev, res.data]);
        toast.success('Ficha creada');
      }
      fichaFormSnapshot.current = null;
      closeFichaModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar la ficha');
      console.error(error);
    }
  };

  const removeFicha = async (ficha) => {
    if (!window.confirm('¿Eliminar esta ficha?')) return;
    try {
      await deleteFichaEventoPremium(ficha._id);
      setFichas((prev) => prev.filter((f) => f._id !== ficha._id));
      toast.success('Ficha eliminada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar la ficha');
      console.error(error);
    }
  };

  const openInfo = (ficha) => {
    setInfoFicha(ficha);
    setInfoOpen(true);
  };

  const closeInfo = () => {
    setInfoOpen(false);
    setInfoFicha(null);
  };

  const productosDisponibles = useMemo(() => {
    if (!productosFicha) return [];
    const tipo = productosFicha.tipoDeServicio;
    if (tipo === 'Notas') return [];
    const normalizedTipo = tipo === 'Alquiler' ? 'Alquiler' : 'Venta';
    return (productos || []).filter((p) => String(p.tipoDeServicio || '').toLowerCase() === normalizedTipo.toLowerCase());
  }, [productos, productosFicha]);

  const refreshProductosFicha = async (fichaId) => {
    const res = await fetchFichaEventoPremium(fichaId);
    return res.data;
  };

  const hydrateProductosEdit = (ficha) => {
    const items = Array.isArray(ficha?.productos) ? ficha.productos : [];
    return items.map((i) => ({
      _id: i._id,
      producto: i.producto,
      cantidad: Number(i.cantidad) || 1,
      precioUnitario: Number(i.precioUnitario) || 0,
    }));
  };

  const openProductos = async (ficha) => {
    try {
      setProductosOpen(true);
      setProductosFichaLoading(true);
      const data = await refreshProductosFicha(ficha._id);
      setProductosFicha(data);
      setProductosEdit(hydrateProductosEdit(data));
      setProductosDirty({});
      setProductosSaving({});
      setAddProd({ producto: '', cantidad: 1, precioUnitario: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar la ficha');
      console.error(error);
      setProductosOpen(false);
    } finally {
      setProductosFichaLoading(false);
    }
  };

  const closeProductos = () => {
    setProductosOpen(false);
    setProductosFicha(null);
    setProductosFichaLoading(false);
    setAddProd({ producto: '', cantidad: 1, precioUnitario: '' });
    setProductosEdit([]);
    setProductosDirty({});
    setProductosSaving({});
    setProductosSavingAll(false);
  };

  const productosDirtyCount = useMemo(() => {
    return Object.keys(productosDirty).filter((k) => productosDirty[k]).length;
  }, [productosDirty]);

  const addProdHasPending = useMemo(() => {
    if (!productosOpen) return false;
    const hasProducto = !!addProd.producto;
    const hasCantidad = String(addProd.cantidad || '') !== '' && Number(addProd.cantidad) !== 1;
    const hasPrecio = String(addProd.precioUnitario || '') !== '';
    return hasProducto || hasCantidad || hasPrecio;
  }, [addProd, productosOpen]);

  const openConfirm = ({ title, message, onSave, onDiscard }) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    confirmPrimaryAction.current = onSave || null;
    confirmSecondaryAction.current = onDiscard || null;
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmTitle('');
    setConfirmMessage('');
    confirmPrimaryAction.current = null;
    confirmSecondaryAction.current = null;
  };

  const attemptCloseProductos = () => {
    if (productosFicha?.venta) {
      closeProductos();
      return;
    }
    if (productosDirtyCount === 0 && !addProdHasPending) {
      closeProductos();
      return;
    }
    openConfirm({
      title: 'Cambios sin guardar',
      message: 'No has guardado los cambios en los productos. ¿Deseas continuar?',
      onSave: async () => {
        closeConfirm();
        if (productosDirtyCount > 0) {
          await saveAll();
        }
        closeProductos();
      },
      onDiscard: () => {
        closeConfirm();
        closeProductos();
      },
    });
  };

  const attemptCloseFichaModal = () => {
    if (!fichaFormHasUnsavedChanges) {
      fichaFormSnapshot.current = null;
      closeFichaModal();
      return;
    }
    openConfirm({
      title: 'Cambios sin guardar',
      message: 'No has guardado los cambios de la ficha. ¿Deseas continuar?',
      onSave: async () => {
        closeConfirm();
        await saveFicha();
      },
      onDiscard: () => {
        closeConfirm();
        fichaFormSnapshot.current = null;
        closeFichaModal();
      },
    });
  };

  const attemptLeavePage = () => {
    if (productosOpen || fichaModalOpen) {
      const title = 'Cambios sin guardar';
      const message = 'Hay cambios sin guardar. ¿Deseas salir de esta vista?';
      openConfirm({
        title,
        message,
        onSave: async () => {
          closeConfirm();
          if (productosOpen && !productosFicha?.venta && productosDirtyCount > 0) {
            await saveAll();
            closeProductos();
          }
          if (fichaModalOpen && fichaFormHasUnsavedChanges) {
            await saveFicha();
          }
          navigate('/eventos-premium');
        },
        onDiscard: () => {
          closeConfirm();
          if (productosOpen) closeProductos();
          if (fichaModalOpen) {
            fichaFormSnapshot.current = null;
            closeFichaModal();
          }
          navigate('/eventos-premium');
        },
      });
      return;
    }
    navigate('/eventos-premium');
  };

  const handleAddProducto = async () => {
    try {
      if (!productosFicha?._id) return;
      if (!addProd.producto) {
        toast.error('Seleccione un producto');
        return;
      }
      const payload = {
        producto: addProd.producto,
        cantidad: Number(addProd.cantidad) || 1,
      };
      if (addProd.precioUnitario !== '') payload.precioUnitario = Number(addProd.precioUnitario) || 0;
      await addProductoFichaEventoPremium(productosFicha._id, payload);
      const data = await refreshProductosFicha(productosFicha._id);
      setProductosFicha(data);
      setProductosEdit(hydrateProductosEdit(data));
      setProductosDirty({});
      setProductosSaving({});
      setAddProd({ producto: '', cantidad: 1, precioUnitario: '' });
      toast.success('Producto agregado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al agregar producto');
      console.error(error);
    }
  };

  const calcSubtotal = (cantidad, precioUnitario) => {
    const c = Math.max(0, Number(cantidad) || 0);
    const p = Math.max(0, Number(precioUnitario) || 0);
    return c * p;
  };

  const handleEditItem = (itemId, field, value) => {
    setProductosEdit((prev) =>
      prev.map((i) => {
        if (i._id !== itemId) return i;
        const next = { ...i };
        if (field === 'cantidad') next.cantidad = Math.max(1, Number(value) || 1);
        if (field === 'precioUnitario') next.precioUnitario = Math.max(0, Number(value) || 0);
        return next;
      })
    );
    setProductosDirty((prev) => ({ ...prev, [itemId]: true }));
  };

  const discardEdits = async () => {
    try {
      if (!productosFicha?._id) return;
      setProductosFichaLoading(true);
      const data = await refreshProductosFicha(productosFicha._id);
      setProductosFicha(data);
      setProductosEdit(hydrateProductosEdit(data));
      setProductosDirty({});
      setProductosSaving({});
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo recargar la ficha');
      console.error(error);
    } finally {
      setProductosFichaLoading(false);
    }
  };

  const saveItem = async (itemId) => {
    try {
      if (!productosFicha?._id) return;
      const item = productosEdit.find((x) => x._id === itemId);
      if (!item) return;
      setProductosSaving((prev) => ({ ...prev, [itemId]: true }));
      await updateProductoFichaEventoPremium(productosFicha._id, itemId, {
        cantidad: Number(item.cantidad) || 1,
        precioUnitario: Number(item.precioUnitario) || 0,
      });
      const data = await refreshProductosFicha(productosFicha._id);
      setProductosFicha(data);
      setProductosEdit(hydrateProductosEdit(data));
      setProductosDirty((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      toast.success('Producto actualizado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar producto');
      console.error(error);
    } finally {
      setProductosSaving((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const saveAll = async () => {
    try {
      if (!productosFicha?._id) return;
      const dirtyIds = Object.keys(productosDirty).filter((k) => productosDirty[k]);
      if (dirtyIds.length === 0) return;

      setProductosSavingAll(true);
      for (const itemId of dirtyIds) {
        const item = productosEdit.find((x) => x._id === itemId);
        if (!item) continue;
        await updateProductoFichaEventoPremium(productosFicha._id, itemId, {
          cantidad: Number(item.cantidad) || 1,
          precioUnitario: Number(item.precioUnitario) || 0,
        });
      }
      const data = await refreshProductosFicha(productosFicha._id);
      setProductosFicha(data);
      setProductosEdit(hydrateProductosEdit(data));
      setProductosDirty({});
      setProductosSaving({});
      toast.success('Cambios guardados');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar cambios');
      console.error(error);
    } finally {
      setProductosSavingAll(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('¿Eliminar este producto de la ficha?')) return;
    try {
      if (!productosFicha?._id) return;
      await deleteProductoFichaEventoPremium(productosFicha._id, itemId);
      const data = await refreshProductosFicha(productosFicha._id);
      setProductosFicha(data);
      setProductosEdit(hydrateProductosEdit(data));
      setProductosDirty((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      setProductosSaving((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      toast.success('Producto eliminado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar producto');
      console.error(error);
    }
  };

  const exportCsv = (ficha) => {
    const productosFichaLocal = ficha?.productos || [];
    const rows = productosFichaLocal.map((i) => ({
      producto: i.producto?.nombre || '',
      cantidad: i.cantidad || 0,
      precioUnitario: i.precioUnitario || 0,
      subtotal: i.subtotal || 0,
    }));
    const header = ['Producto', 'Cantidad', 'PrecioUnitario', 'Subtotal'];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          `"${String(r.producto).replaceAll('"', '""')}"`,
          r.cantidad,
          r.precioUnitario,
          r.subtotal,
        ].join(',')
      ),
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha_${ficha.nombre || 'productos'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hasPremium) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography>
            Tu plan no incluye acceso al módulo premium de Eventos.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button startIcon={<FaArrowLeft />} variant="outlined" onClick={attemptLeavePage}>
          Volver
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Gestión de Eventos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {evento?.nombre || ''} — {evento?.cliente?.nombreCompleto || ''}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<FaPlus />} onClick={openFichaCreate}>
          Nueva ficha
        </Button>
      </Box>

      <Grid container spacing={2}>
        {fichas.map((f) => {
          const pal = paletteFromKey(f.color || 'info');
          const isNotas = f.tipoDeServicio === 'Notas';
          const hasVenta = !!f.venta;
          const ventaObj = typeof f.venta === 'object' ? f.venta : null;
          const numeroConsecutivo = ventaObj?.numeroConsecutivo ?? null;
          const nombreFactura = ventaObj?.facturaHasConsecutivo?.factura?.nombre || '';
          const nombreConsecutivo = ventaObj?.facturaHasConsecutivo?.consecutivo?.nombre || '';
          const fechaVenta = formatDateShort(ventaObj?.createdAt);
          return (
            <Grid item xs={12} md={6} lg={4} key={f._id}>
              <Card
                id={`ficha-${f._id}`}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: focusFichaId === f._id ? alpha(pal.main, 0.8) : 'divider',
                  background: `linear-gradient(135deg, ${alpha(pal.main, 0.16)} 0%, ${alpha(pal.main, 0.06)} 100%)`,
                  '::after': {
                    content: '""',
                    position: 'absolute',
                    right: -40,
                    bottom: -40,
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: `radial-gradient(${alpha(pal.main, 0.25)}, transparent 60%)`,
                    pointerEvents: 'none',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ color: alpha(pal.main, 0.9), fontWeight: 800 }}>
                          {f.tipoDeServicio}
                        </Typography>
                        {hasVenta && (
                          <Chip
                            size="small"
                            color="success"
                            label={numeroConsecutivo ? `Venta asociada #${numeroConsecutivo}` : 'Venta asociada'}
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, wordBreak: 'break-word' }}>
                        {f.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {f.responsable?.nombreUsuario || '-'}
                      </Typography>
                      {hasVenta && (
                        <Box sx={{ mt: 1 }}>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                            {nombreFactura && (
                              <Chip size="small" label={`Factura: ${nombreFactura}`} sx={{ fontWeight: 700 }} />
                            )}
                            {nombreConsecutivo && (
                              <Chip size="small" label={`Consecutivo: ${nombreConsecutivo}`} sx={{ fontWeight: 700 }} />
                            )}
                            {fechaVenta && (
                              <Chip size="small" label={`Fecha: ${fechaVenta}`} sx={{ fontWeight: 700 }} />
                            )}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Info">
                        <IconButton size="small" onClick={() => openInfo(f)}>
                          <FaInfoCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openFichaEdit(f)}>
                          <FaEdit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => removeFicha(f)}>
                          <FaTrash />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  {f.descripcion && (
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                      {f.descripcion}
                    </Typography>
                  )}

                  {isNotas ? (
                    <Paper variant="outlined" sx={{ mt: 2, p: 1.5, bgcolor: alpha(pal.main, 0.06) }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {f.nota || 'Sin nota'}
                      </Typography>
                    </Paper>
                  ) : (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FaBoxes />}
                        onClick={() => openProductos(f)}
                      >
                        Productos
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FaFileCsv />}
                        onClick={() => exportCsv(f)}
                        disabled={!Array.isArray(f.productos) || f.productos.length === 0}
                      >
                        Exportar
                      </Button>
                      {f.venta ? (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<FaFileInvoiceDollar />}
                          onClick={() => navigate(`/ventas/ver/${f.venta?._id || f.venta}`)}
                        >
                          Ver factura
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<FaShoppingCart />}
                          onClick={() =>
                            navigate(`/ventas/nueva?fromEventoFicha=${f._id}`, {
                              state: { fromEventoFicha: f },
                            })
                          }
                        >
                          Convertir a venta
                        </Button>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {fichas.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography align="center">No hay fichas creadas.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={fichaModalOpen} onClose={closeFichaModal} fullWidth maxWidth="sm">
        <DialogTitle>{fichaEditing ? 'Editar ficha' : 'Nueva ficha'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            margin="normal"
            label="Nombre"
            name="nombre"
            value={fichaForm.nombre}
            onChange={handleFichaChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Descripción"
            name="descripcion"
            value={fichaForm.descripcion}
            onChange={handleFichaChange}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de servicio</InputLabel>
            <Select
              name="tipoDeServicio"
              label="Tipo de servicio"
              value={fichaForm.tipoDeServicio}
              onChange={handleFichaChange}
            >
              {TIPOS_FICHA.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {fichaForm.tipoDeServicio === 'Notas' && (
            <TextField
              fullWidth
              margin="normal"
              multiline
              minRows={4}
              label="Nota (máx 500)"
              name="nota"
              value={fichaForm.nota}
              onChange={handleFichaChange}
              inputProps={{ maxLength: 500 }}
              helperText={`${fichaForm.nota.length}/500`}
            />
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>Responsable</InputLabel>
            <Select
              name="responsable"
              label="Responsable"
              value={fichaForm.responsable}
              onChange={handleFichaChange}
            >
              {usuarios
                .filter((u) => u.estado !== false)
                .map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.nombreUsuario} ({u.rol})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Color</InputLabel>
            <Select name="color" label="Color" value={fichaForm.color} onChange={handleFichaChange}>
              {COLOR_KEYS.map((c) => (
                <MenuItem key={c.key} value={c.key}>
                  {c.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={attemptCloseFichaModal}>Cancelar</Button>
          <Button variant="contained" onClick={saveFicha}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={infoOpen} onClose={closeInfo} fullWidth maxWidth="sm">
        <DialogTitle>Detalle de ficha</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" color="text.secondary">
            {infoFicha?.tipoDeServicio || ''}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {infoFicha?.nombre || ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Responsable: {infoFicha?.responsable?.nombreUsuario || '-'}
          </Typography>
          {infoFicha?.descripcion && (
            <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {infoFicha.descripcion}
            </Typography>
          )}
          {infoFicha?.tipoDeServicio === 'Notas' && (
            <Paper variant="outlined" sx={{ mt: 2, p: 1.5 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {infoFicha?.nota || 'Sin nota'}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeInfo}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={productosOpen} onClose={closeProductos} fullWidth maxWidth="md">
        <DialogTitle>Productos de ficha</DialogTitle>
        <DialogContent dividers>
          {productosFichaLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {!!productosFicha?.venta && (
                <Paper variant="outlined" sx={{ mb: 2, p: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Esta ficha ya tiene una venta asociada. Los productos quedan en modo lectura.
                  </Typography>
                </Paper>
              )}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Producto</InputLabel>
                    <Select
                      value={addProd.producto}
                      label="Producto"
                      onChange={(e) => setAddProd((p) => ({ ...p, producto: e.target.value }))}
                      disabled={!!productosFicha?.venta}
                    >
                      {productosDisponibles.map((p) => (
                        <MenuItem key={p._id} value={p._id}>
                          {p.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Cantidad"
                    type="number"
                    value={addProd.cantidad}
                    onChange={(e) => setAddProd((p) => ({ ...p, cantidad: e.target.value }))}
                    inputProps={{ min: 1 }}
                    disabled={!!productosFicha?.venta}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Precio"
                    type="number"
                    value={addProd.precioUnitario}
                    onChange={(e) => setAddProd((p) => ({ ...p, precioUnitario: e.target.value }))}
                    inputProps={{ min: 0 }}
                    disabled={!!productosFicha?.venta}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddProducto}
                    sx={{ height: '40px' }}
                    disabled={!!productosFicha?.venta}
                  >
                    Agregar
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mb: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FaUndoAlt />}
                  onClick={discardEdits}
                  disabled={
                    !!productosFicha?.venta ||
                    productosSavingAll ||
                    Object.keys(productosSaving).some((k) => productosSaving[k])
                  }
                >
                  Descartar cambios
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<FaSave />}
                  onClick={saveAll}
                  disabled={
                    !!productosFicha?.venta ||
                    productosSavingAll ||
                    Object.keys(productosDirty).filter((k) => productosDirty[k]).length === 0
                  }
                >
                  Guardar cambios
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell width={140}>Cantidad</TableCell>
                      <TableCell width={180}>Precio</TableCell>
                      <TableCell width={160}>Subtotal</TableCell>
                      <TableCell width={140} align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(productosEdit || []).map((i) => (
                      <TableRow key={i._id} hover>
                        <TableCell>{i.producto?.nombre || '-'}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={i.cantidad}
                            onChange={(e) => handleEditItem(i._id, 'cantidad', e.target.value)}
                            inputProps={{ min: 1 }}
                            disabled={!!productosFicha?.venta}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={i.precioUnitario}
                            onChange={(e) => handleEditItem(i._id, 'precioUnitario', e.target.value)}
                            inputProps={{ min: 0 }}
                            disabled={!!productosFicha?.venta}
                          />
                        </TableCell>
                        <TableCell>{calcSubtotal(i.cantidad, i.precioUnitario)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => saveItem(i._id)}
                              disabled={
                                !!productosFicha?.venta ||
                                productosSavingAll ||
                                !productosDirty[i._id] ||
                                !!productosSaving[i._id]
                              }
                            >
                              <FaSave />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteItem(i._id)}
                              disabled={!!productosFicha?.venta || productosSavingAll || !!productosSaving[i._id]}
                            >
                              <FaTrash />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(productosEdit || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No hay productos agregados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={attemptCloseProductos}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={closeConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent dividers>
          <Typography>{confirmMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancelar</Button>
          <Button
            onClick={() => {
              const fn = confirmSecondaryAction.current;
              if (typeof fn === 'function') fn();
            }}
            variant="outlined"
            color="warning"
          >
            Continuar sin guardar
          </Button>
          <Button
            onClick={() => {
              const fn = confirmPrimaryAction.current;
              if (typeof fn === 'function') fn();
            }}
            variant="contained"
          >
            Guardar y continuar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GestionEventoPremium;
