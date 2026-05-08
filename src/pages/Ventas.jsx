import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaBan } from 'react-icons/fa';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack
} from '@mui/material';

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [selectedVentaAnular, setSelectedVentaAnular] = useState(null);

  useEffect(() => {
    fetchVentas();
  }, []);

  const openModalAnular = (venta) => {
  setSelectedVentaAnular(venta);
  setModalAnularOpen(true);
};

const closeModalAnular = () => {
  setModalAnularOpen(false);
  setSelectedVentaAnular(null);
};

const handleAnular = async (id) => {
  try {
    await api.put(`/ventas/${id}/anular`);
    toast.success('Venta anulada correctamente');
    fetchVentas();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Error al anular la venta');
    console.error('Error al anular venta:', error);
  }
};

const fetchVentas = async () => {
  try {
    setLoading(true);
    // Primero actualizar las vencidas por fecha
    try {
      await api.put('/ventas/actualizar-vencidas');
    } catch (e) {
      console.warn('No se pudieron actualizar vencidas:', e);
    }
    const response = await api.get('/ventas');
    setVentas(response.data);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Error al cargar las ventas');
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (id) => {
    try {
      await api.delete(`/ventas/${id}`);
      toast.success('Venta eliminada correctamente');
      fetchVentas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar la venta');
      console.error('Error al eliminar venta:', error);
    }
  };

  const openModal = (venta = null) => {
    setSelectedVenta(venta);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedVenta(null);
  };

  const filteredVentas = ventas.filter(venta => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      venta.facturaHasConsecutivo?.consecutivo?.contador?.toString().includes(searchTerm) ||
      venta.facturaHasConsecutivo?.factura?.nombre?.toLowerCase().includes(searchTermLower) ||
      venta.cliente?.nombreCompleto?.toLowerCase().includes(searchTermLower) ||
      venta.tipoDeServicio?.toLowerCase().includes(searchTermLower)
    );
  });

  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVentas = filteredVentas.slice(startIndex, endIndex);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(event.target.value);
    setCurrentPage(1);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-CO', options);
  };

  const estadoPagoConfig = {
  pendiente:    { label: 'Pendiente',    color: 'warning' },
  pago_parcial: { label: 'Pago Parcial', color: 'info' },
  pagada:       { label: 'Pagada',       color: 'success' },
  vencida:      { label: 'Vencida',      color: 'error' },
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Módulo de Ventas
        </Typography>
        <Button
          component={Link}
          to="/ventas/nueva"
          variant="contained"
          color="secondary"
          startIcon={<FaPlus />}
        >
          Nueva Venta
        </Button>
      </Box>

      {/* Controles de búsqueda y paginación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            placeholder="🔍 Buscar por factura, consecutivo, cliente o tipo de servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaSearch />
                </InputAdornment>
              ),
            }}
            sx={{ width: 400 }}
            variant="outlined"
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Items por página</InputLabel>
            <Select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              label="Items por página"
            >
              <MenuItem value={5}>5 por página</MenuItem>
              <MenuItem value={10}>10 por página</MenuItem>
              <MenuItem value={15}>15 por página</MenuItem>
              <MenuItem value={25}>25 por página</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Información de paginación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" fontWeight="bold" color="text.secondary">
          Total: {filteredVentas.length} ventas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Página {filteredVentas.length > 0 ? currentPage : 0} de {totalPages}
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        {currentVentas.length === 0 ? (
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            No se encontraron ventas
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Factura / Consecutivo</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo de Servicio</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Estado de Pago</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentVentas.map((venta) => (
                    <TableRow key={venta._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {(
                            venta?.numeroConsecutivo !== undefined && venta?.numeroConsecutivo !== null
                              ? venta.numeroConsecutivo
                              : venta.facturaHasConsecutivo?.consecutivo?.contador
                          ) || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {venta.facturaHasConsecutivo?.factura?.nombre || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {venta.cliente?.nombreCompleto}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(venta.fecha)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {venta.tipoDeServicio}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(venta.totalPagar)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
label={venta.estado === 'activa' ? 'Activa' : 'Inactiva'}
color={venta.estado === 'activa' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                                              <TableCell>
  {(() => {
    const cfg = estadoPagoConfig[venta.estadoPago] || estadoPagoConfig.pendiente;
    return <Chip label={cfg.label} color={cfg.color} size="small" />;
  })()}
</TableCell>
                      <TableCell align="right">
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
    <IconButton
      component={Link}
      to={`/ventas/ver/${venta._id}`}
      color="info"
      size="small"
      title="Ver detalles"
    >
      <FaEye />
    </IconButton>

    {venta.estado === 'activa' && (
      <>
        <IconButton
          component={Link}
          to={`/ventas/editar/${venta._id}`}
          color="primary"
          size="small"
          title="Editar"
        >
          <FaEdit />
        </IconButton>
        <IconButton
          onClick={() => openModalAnular(venta)}
          color="warning"
          size="small"
          title="Anular venta"
        >
          <FaBan />
        </IconButton>
      </>
    )}

    {venta.estado === 'cancelada' && (
      <IconButton
        onClick={() => openModal(venta)}
        color="error"
        size="small"
        title="Eliminar permanentemente"
      >
        <FaTrash />
      </IconButton>
    )}
  </Box>
</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Modal de Eliminación */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          {selectedVenta && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ¿Estás seguro de que deseas eliminar la venta del cliente <strong>"{selectedVenta.cliente?.nombreCompleto}"</strong>?
              </Typography>
              <Typography variant="body2" color="error" sx={{ fontSize: '14px' }}>
                Esta acción no se puede deshacer.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              handleDelete(selectedVenta._id);
              closeModal();
            }} 
            variant="contained" 
            color="error"
          >
            Sí, Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={modalAnularOpen} onClose={closeModalAnular} maxWidth="sm" fullWidth>
  <DialogTitle>Confirmar Anulación</DialogTitle>
  <DialogContent>
    {selectedVentaAnular && (
      <Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          ¿Estás seguro de que deseas anular la venta del cliente{' '}
          <strong>"{selectedVentaAnular.cliente?.nombreCompleto}"</strong>?
        </Typography>
        <Typography variant="body2" color="warning.main" sx={{ fontSize: '14px' }}>
          La venta pasará a estado cancelado y el stock de los productos será restaurado.
        </Typography>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={closeModalAnular}>Cancelar</Button>
    <Button
      onClick={() => {
        handleAnular(selectedVentaAnular._id);
        closeModalAnular();
      }}
      variant="contained"
      color="warning"
    >
      Sí, Anular
    </Button>
  </DialogActions>
</Dialog>
    </Container>
  );
};

export default Ventas;
