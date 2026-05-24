import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack,
  Tooltip,
  Alert,
} from '@mui/material';
import { FaPlus, FaEdit, FaTrash, FaCogs } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { usePlan } from '../context/planContext';
import api from '../services/api';
import {
  fetchEventosPremium,
  createEventoPremium,
  updateEventoPremium,
  deleteEventoPremium,
  fetchUsuariosEmpresaPremiumEventos,
} from '../services/eventoService';

const EventosPremium = () => {
  const { user } = useContext(AuthContext);
  const { canAccessModule } = usePlan();
  const navigate = useNavigate();

  // Usa plansConfig como única fuente de verdad.
  // free_trial tiene eventosPremium: true, por lo que este check lo permite.
  const hasPremium = canAccessModule('eventosPremium');

  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    cliente: '',
    fechaDelEvento: '',
    responsable: '',
    estado: true,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [eventosRes, usuariosRes] = await Promise.all([
        fetchEventosPremium(),
        fetchUsuariosEmpresaPremiumEventos(),
      ]);
      setEventos(Array.isArray(eventosRes.data) ? eventosRes.data : []);
      setUsuarios(Array.isArray(usuariosRes.data) ? usuariosRes.data : []);
      try {
        const clientesRes = await api.get('/clientes');
        setClientes(Array.isArray(clientesRes.data) ? clientesRes.data : []);
      } catch (err) {
        setClientes([]);
        console.error(err);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar eventos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasPremium) {
      setLoading(false);
      return;
    }
    loadData();
  }, [hasPremium, loadData]);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      nombre: '',
      cliente: '',
      fechaDelEvento: '',
      responsable: '',
      estado: true,
    });
    setOpenModal(true);
  };

  const openEdit = (evento) => {
    setEditing(evento);
    const toDateInput = (value) => {
      if (!value) return '';
      const d = new Date(value);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    setFormData({
      nombre: evento.nombre || '',
      cliente: evento.cliente?._id || evento.cliente || '',
      fechaDelEvento: toDateInput(evento.fechaDelEvento),
      responsable: evento.responsable?._id || evento.responsable || '',
      estado: evento.estado !== false,
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.nombre.trim() || !formData.cliente || !formData.fechaDelEvento || !formData.responsable) {
        toast.error('Complete los campos obligatorios');
        return;
      }

      const payload = {
        nombre: formData.nombre.trim(),
        cliente: formData.cliente,
        fechaDelEvento: formData.fechaDelEvento,
        responsable: formData.responsable,
        estado: formData.estado,
      };

      if (editing?._id) {
        const res = await updateEventoPremium(editing._id, payload);
        setEventos((prev) => prev.map((e) => (e._id === editing._id ? res.data : e)));
        toast.success('Evento actualizado');
      } else {
        const res = await createEventoPremium(payload);
        setEventos((prev) => [...prev, res.data]);
        toast.success('Evento creado');
      }

      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar el evento');
      console.error(error);
    }
  };

  const handleDelete = async (evento) => {
    if (!window.confirm('¿Eliminar este evento?')) return;
    try {
      await deleteEventoPremium(evento._id);
      setEventos((prev) => prev.filter((e) => e._id !== evento._id));
      toast.success('Evento eliminado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar el evento');
      console.error(error);
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return eventos;
    return eventos.filter((e) => {
      const nombre = String(e.nombre || '').toLowerCase();
      const cliente = String(e.cliente?.nombreCompleto || '').toLowerCase();
      const responsable = String(e.responsable?.nombreUsuario || '').toLowerCase();
      return nombre.includes(q) || cliente.includes(q) || responsable.includes(q);
    });
  }, [eventos, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * itemsPerPage;
  const current = filtered.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-CO');
  };

  if (!hasPremium) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Tu plan no incluye acceso al módulo premium de Eventos.
        </Alert>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Eventos (Premium)
        </Typography>
        <Button variant="contained" startIcon={<FaPlus />} onClick={openCreate}>
          Nuevo evento
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Buscar"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            sx={{ minWidth: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Items</InputLabel>
            <Select
              value={itemsPerPage}
              label="Items"
              onChange={(e) => {
                setItemsPerPage(e.target.value);
                setCurrentPage(1);
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={15}>15</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Total: {filtered.length}
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Evento</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Responsable</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {current.map((e) => (
                <TableRow key={e._id} hover>
                  <TableCell>{e.nombre}</TableCell>
                  <TableCell>{e.cliente?.nombreCompleto || '-'}</TableCell>
                  <TableCell>{formatDate(e.fechaDelEvento)}</TableCell>
                  <TableCell>{e.responsable?.nombreUsuario || '-'}</TableCell>
                  <TableCell>{e.estado === false ? 'Inactivo' : 'Activo'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Gestionar fichas">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/eventos-premium/${e._id}/gestion`)}
                      >
                        <FaCogs />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton color="secondary" onClick={() => openEdit(e)}>
                        <FaEdit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" onClick={() => handleDelete(e)}>
                        <FaTrash />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {current.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay eventos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setCurrentPage(p)}
              color="primary"
              size="small"
            />
          </Stack>
        </Box>
      </Paper>

      <Dialog open={openModal} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar evento' : 'Nuevo evento'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            margin="normal"
            fullWidth
            name="nombre"
            label="Nombre del evento"
            value={formData.nombre}
            onChange={handleChange}
          />
          <FormControl margin="normal" fullWidth>
            <InputLabel id="cliente-label">Cliente</InputLabel>
            <Select
              labelId="cliente-label"
              name="cliente"
              label="Cliente"
              value={formData.cliente}
              onChange={handleChange}
            >
              {clientes.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.nombreCompleto}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            fullWidth
            name="fechaDelEvento"
            label="Fecha del evento"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.fechaDelEvento}
            onChange={handleChange}
          />
          <FormControl margin="normal" fullWidth>
            <InputLabel id="resp-label">Responsable</InputLabel>
            <Select
              labelId="resp-label"
              name="responsable"
              label="Responsable"
              value={formData.responsable}
              onChange={handleChange}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventosPremium;