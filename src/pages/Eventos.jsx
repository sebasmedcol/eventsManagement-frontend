import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
} from '@mui/material';
import { FaCalendarAlt } from 'react-icons/fa';
import api from '../services/api';
import { fetchEventos, fetchEventoById } from '../services/eventoService';

// Calendar imports
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

const Eventos = () => {
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtros, setFiltros] = useState({ cliente: '', tipoDeServicio: '', from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchClientes = useCallback(async () => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadEventos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.from) params.from = filtros.from;
      if (filtros.to) params.to = filtros.to;
      const res = await fetchEventos(params);
      let data = res.data;

      // Filtrado adicional en cliente y tipoDeServicio en frontend
      if (filtros.cliente) {
        data = data.filter((e) => e.venta?.cliente?._id === filtros.cliente);
      }
      if (filtros.tipoDeServicio) {
        data = data.filter((e) => e.venta?.tipoDeServicio === filtros.tipoDeServicio);
      }

      // Normalizar fecha a día local usando componentes UTC para evitar desfases
      const normalizeDate = (iso) => {
        if (!iso) return new Date();
        const d = new Date(iso);
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      };

      // Mapear a formato de react-big-calendar
      // Reemplaza el bloque mapped completo
const mapped = data
  .filter((e) => e.venta?.tipoDeServicio === 'Alquiler') // solo alquileres
  .map((e) => {
    // Inicio: loadInInicio, fallback a fechaDelEvento
    const startRaw = e.venta?.loadInInicio || e.start || e.venta?.fechaDelEvento;
    // Fin: loadOutFin, fallback al mismo día de inicio
    const endRaw = e.venta?.loadOutFin || startRaw;

    const startDate = normalizeDate(startRaw);

    // react-big-calendar maneja end como exclusivo en eventos allDay,
    // por eso se suma 1 día para que el último día aparezca en el calendario
    const endDate = normalizeDate(endRaw);
    endDate.setDate(endDate.getDate() + 1);

    return {
      id: e._id,
      title: `${e.venta?.cliente?.nombreCompleto || 'Sin cliente'}`,
      start: startDate,
      end: endDate,
      resource: e,
      allDay: true,
    };
  });

      setEventos(mapped);
    } catch (err) {
      if (err?.response?.status === 404) {
        setEventos([]);
        toast.info('No hay eventos activos por ahora');
      } else {
        toast.error(err?.response?.data?.message || 'Error al cargar eventos');
      }
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  const eventPropGetter = (event) => {
    const estado = event?.resource?.estado;
    const style = {
      backgroundColor: estado ? '#13DEB9' : '#FA896B',
      borderRadius: '8px',
      opacity: 0.9,
      color: 'black',
      border: '1px solid #e0e0e0',
      display: 'block',
    };
    return { style };
  };

  const onSelectEvent = async (event) => {
    try {
      const id = event?.id || event?.resource?._id || event?.resource?.venta?._id;
      const res = await fetchEventoById(id);
      setSelectedEvent(res.data);
      setModalOpen(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudo cargar el detalle del evento');
    }
  };

  const components = useMemo(() => ({
    toolbar: (props) => {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" onClick={() => props.onNavigate('PREV')}>{'<'}</Button>
            <Typography variant="h6" sx={{ mx: 2 }}>{moment(props.date).format('MMMM YYYY')}</Typography>
            <Button variant="outlined" onClick={() => props.onNavigate('NEXT')}>{'>'}</Button>
            <Button variant="text" onClick={() => props.onNavigate('TODAY')}>Hoy</Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant={props.view === Views.MONTH ? 'contained' : 'outlined'} onClick={() => props.onView(Views.MONTH)}>Mes</Button>
            <Button size="small" variant={props.view === Views.WEEK ? 'contained' : 'outlined'} onClick={() => props.onView(Views.WEEK)}>Semana</Button>
            <Button size="small" variant={props.view === Views.DAY ? 'contained' : 'outlined'} onClick={() => props.onView(Views.DAY)}>Día</Button>
          </Stack>
        </Box>
      );
    }
  }), []);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <FaCalendarAlt />
        <Typography variant="h4" fontWeight="bold">Cronograma de eventos</Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Button disabled>Cargando cronograma...</Button>
        </Box>
      )}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                label="Cliente"
                value={filtros.cliente}
                onChange={(e) => setFiltros((p) => ({ ...p, cliente: e.target.value }))}
              >
                <MenuItem value="">Todos</MenuItem>
                {clientes.map((c) => (
                  <MenuItem key={c._id} value={c._id}>{c.nombreCompleto}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Servicio</InputLabel>
              <Select
                label="Tipo de Servicio"
                value={filtros.tipoDeServicio}
                onChange={(e) => setFiltros((p) => ({ ...p, tipoDeServicio: e.target.value }))}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Alquiler">Alquiler</MenuItem>
                <MenuItem value="Evento">Evento</MenuItem>
                <MenuItem value="Venta">Venta</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Desde"
              InputLabelProps={{ shrink: true }}
              value={filtros.from}
              onChange={(e) => setFiltros((p) => ({ ...p, from: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Hasta"
              InputLabelProps={{ shrink: true }}
              value={filtros.to}
              onChange={(e) => setFiltros((p) => ({ ...p, to: e.target.value }))}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Chip label="Activa" sx={{ bgcolor: '#13DEB9', color: 'black' }} />
          <Chip label="Cancelada" sx={{ bgcolor: '#FA896B', color: 'black' }} />
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          style={{ height: '70vh' }}
          eventPropGetter={eventPropGetter}
          onSelectEvent={onSelectEvent}
          components={components}
        />
      </Paper>

      {/* Modal de detalle */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle del evento</DialogTitle>
        <DialogContent dividers>
          {selectedEvent && (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {selectedEvent.venta?.cliente?.nombreCompleto}
              </Typography>
              <Typography variant="body2">Teléfono: {selectedEvent.venta?.cliente?.telefono || '-'}</Typography>
              <Typography variant="body2" gutterBottom>Dirección: {selectedEvent.venta?.cliente?.direccion || '-'}</Typography>
              <Typography variant="body2">Tipo de servicio: {selectedEvent.tipoDeServicio}</Typography>
              <Typography variant="body2">Fecha del evento: {moment.utc(selectedEvent.start).format('LL')}</Typography>
              <Typography variant="body2">Estado: {selectedEvent.estado ? 'Activa' : 'Cancelada'}</Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">Productos</Typography>
                <ul>
                  {selectedEvent.venta?.productos?.map((p, idx) => (
                    <li key={idx}>{p.producto?.nombre} x {p.cantidad} - ${p.precioUnitario?.toLocaleString()}</li>
                  ))}
                </ul>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">Subtotal: ${selectedEvent.venta?.subtotal?.toLocaleString()}</Typography>
                <Typography variant="body2">Descuento: ${selectedEvent.venta?.descuento?.toLocaleString()}</Typography>
                <Typography variant="body2">Abono: ${selectedEvent.venta?.abono?.toLocaleString()}</Typography>
                <Typography variant="body2" fontWeight="bold">Total a Pagar: ${selectedEvent.venta?.totalPagar?.toLocaleString()}</Typography>
                <Typography variant="body2" fontWeight="bold">Saldo: ${(selectedEvent.venta?.totalPagar - (selectedEvent.venta?.abono || 0))?.toLocaleString()}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedEvent && (
            <Button component={Link} to={`/ventas/ver/${selectedEvent.venta?._id}`} variant="contained" color="primary">
              Ver Venta
            </Button>
          )}
          <Button onClick={() => setModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Eventos;
