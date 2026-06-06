import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { usePlan } from '../../context/PlanContext';
import { TrialExpiredBanner } from '../../components/plan';
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
  Stack,
  Autocomplete
} from '@mui/material';

const Facturas = () => {
  const { isReadOnlyMode } = usePlan();
  const readOnly = isReadOnlyMode();
  const [facturas, setFacturas] = useState([]);
  const [consecutivos, setConsecutivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'crear', 'ver', 'editar', 'eliminar'
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ivaPorcentaje: 0,
    consecutivo: '',
    estado: true
  });

  useEffect(() => {
    fetchFacturas();
    fetchConsecutivos();
  }, []);

  const fetchFacturas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/facturas');
      setFacturas(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar las facturas');
      console.error('Error al cargar facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsecutivos = async () => {
    try {
      const response = await api.get('/consecutivos');
      setConsecutivos(response.data.filter(c => c.estado));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar los consecutivos');
      console.error('Error al cargar consecutivos:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/facturas/${id}`);
      toast.success('Factura eliminada correctamente');
      fetchFacturas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar la factura');
      console.error('Error al eliminar factura:', error);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.nombre || !formData.consecutivo) {
        toast.error('Por favor complete todos los campos requeridos');
        return;
      }

      if (formData.ivaPorcentaje === '' || Number.isNaN(Number(formData.ivaPorcentaje))) {
        toast.error('El IVA debe ser un porcentaje entre 0 y 100');
        return;
      }
      if (Number(formData.ivaPorcentaje) < 0 || Number(formData.ivaPorcentaje) > 100) {
        toast.error('El IVA debe ser un porcentaje entre 0 y 100');
        return;
      }

      // Validar que el consecutivo existe y está activo
      try {
        const res = await api.get(`/consecutivos/${formData.consecutivo}`);
        if (!res?.data?.estado) {
          toast.error('El consecutivo seleccionado está inactivo o no existe');
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error('No se pudo validar el consecutivo seleccionado');
        return;
      }

      await api.post('/facturas', formData);
      toast.success('Factura creada correctamente');
      fetchFacturas();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear la factura');
      console.error('Error al crear factura:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!formData.nombre || !formData.consecutivo) {
        toast.error('Por favor complete todos los campos requeridos');
        return;
      }

      if (formData.ivaPorcentaje === '' || Number.isNaN(Number(formData.ivaPorcentaje))) {
        toast.error('El IVA debe ser un porcentaje entre 0 y 100');
        return;
      }
      if (Number(formData.ivaPorcentaje) < 0 || Number(formData.ivaPorcentaje) > 100) {
        toast.error('El IVA debe ser un porcentaje entre 0 y 100');
        return;
      }

      // Validar que el consecutivo existe y está activo
      try {
        const res = await api.get(`/consecutivos/${formData.consecutivo}`);
        if (!res?.data?.estado) {
          toast.error('El consecutivo seleccionado está inactivo o no existe');
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error('No se pudo validar el consecutivo seleccionado');
        return;
      }

      await api.put(`/facturas/${selectedFactura._id}`, formData);
      toast.success('Factura actualizada correctamente');
      fetchFacturas();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar la factura');
      console.error('Error al actualizar factura:', error);
    }
  };

  const openModal = (type, factura = null) => {
    setModalType(type);
    setSelectedFactura(factura);
    
    if (type === 'crear') {
      setFormData({ 
        nombre: '', 
        ivaPorcentaje: 0,
        consecutivo: '',
        estado: true 
      });
    } else if (factura) {
      setFormData({
        nombre: factura.nombre || '',
        ivaPorcentaje: factura.ivaPorcentaje ?? 0,
        consecutivo: factura.consecutivo?._id || factura.consecutivo || '',
        estado: factura.estado
      });
    }
    
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('');
    setSelectedFactura(null);
    setFormData({ nombre: '', ivaPorcentaje: 0, consecutivo: '', estado: true });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === 'ivaPorcentaje'
          ? value === ''
            ? ''
            : Number(value)
          : type === 'checkbox'
            ? checked
            : value
    });
  };

  const handleConsecutivoChange = (event, value) => {
    setFormData({
      ...formData,
      consecutivo: value ? value._id : ''
    });
  };

  const filteredFacturas = facturas.filter(factura =>
    factura.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFacturas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFacturas = filteredFacturas.slice(startIndex, endIndex);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(event.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-CO', options);
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
    <Container maxWidth={false} disableGutters sx={{ py: 2, pl: 6, pr: 5 }}>
      {/* Banner de trial expirado — modo solo lectura */}
      <TrialExpiredBanner />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Módulo de Facturas
        </Typography>
        {!readOnly && (
          <Button
            onClick={() => openModal('crear')}
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
          >
            Crear Factura
          </Button>
        )}
      </Box>

      {/* Controles de búsqueda y paginación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            placeholder="🔍 Buscar facturas por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaSearch />
                </InputAdornment>
              ),
            }}
            sx={{ width: 350 }}
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
          Total: {filteredFacturas.length} facturas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Página {filteredFacturas.length > 0 ? currentPage : 0} de {totalPages}
        </Typography>
      </Box>

      {/* Tabla de facturas */}
      <Paper elevation={3} sx={{ p: 3 }}>
        {currentFacturas.length === 0 ? (
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            No se encontraron facturas
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>IVA (%)</TableCell>
                    <TableCell>Consecutivo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentFacturas.map((factura, index) => (
                    <TableRow key={factura._id} hover>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {factura.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {factura.ivaPorcentaje ?? 0}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {factura.consecutivo ? `${factura.consecutivo.contador} - ${formatDate(factura.consecutivo.fecha)}` : 'No asignado'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={factura.estado ? 'Activo' : 'Inactivo'}
                          color={factura.estado ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <IconButton
                            onClick={() => openModal('ver', factura)}
                            color="info"
                            size="small"
                            title="Ver detalles"
                          >
                            <FaEye />
                          </IconButton>
                          {!readOnly && (
                            <IconButton
                              onClick={() => openModal('editar', factura)}
                              color="primary"
                              size="small"
                              title="Editar"
                            >
                              <FaEdit />
                            </IconButton>
                          )}
                          {!readOnly && (
                            <IconButton
                              onClick={() => openModal('eliminar', factura)}
                              color="error"
                              size="small"
                              title="Eliminar"
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

      {/* Modal */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {modalType === 'crear' && 'Crear Nueva Factura'}
          {modalType === 'ver' && 'Detalles de la Factura'}
          {modalType === 'editar' && 'Editar Factura'}
          {modalType === 'eliminar' && 'Confirmar Eliminación'}
        </DialogTitle>
        <DialogContent>
          {modalType === 'ver' && selectedFactura && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>ID:</strong> {selectedFactura._id}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Nombre:</strong> {selectedFactura.nombre}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>IVA (%):</strong> {selectedFactura.ivaPorcentaje ?? 0}%
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Consecutivo:</strong> {selectedFactura.consecutivo ? `${selectedFactura.consecutivo.contador} - ${formatDate(selectedFactura.consecutivo.fecha)}` : 'No asignado'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Estado:</strong> {selectedFactura.estado ? 'Activo' : 'Inactivo'}
              </Typography>
            </Box>
          )}

          {(modalType === 'crear' || modalType === 'editar') && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                margin="normal"
                required
                placeholder="Ingrese el nombre de la factura"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="IVA (%)"
                name="ivaPorcentaje"
                type="number"
                value={formData.ivaPorcentaje}
                onChange={handleInputChange}
                margin="normal"
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                variant="outlined"
                helperText="Ejemplo Colombia: 19"
              />
              <Autocomplete
                options={consecutivos}
                getOptionLabel={(option) => `${option.contador} - ${formatDate(option.fecha)}`}
                value={consecutivos.find(c => c._id === formData.consecutivo) || null}
                onChange={handleConsecutivoChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Consecutivo"
                    margin="normal"
                    required
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
              <Box sx={{ mt: 2 }}>
                <label>
                  <input
                    type="checkbox"
                    name="estado"
                    checked={formData.estado}
                    onChange={handleInputChange}
                    style={{ marginRight: 8 }}
                  />
                  Activo
                </label>
              </Box>
            </Box>
          )}

          {modalType === 'eliminar' && selectedFactura && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ¿Estás seguro de que deseas eliminar la factura <strong>"{selectedFactura.nombre}"</strong>?
              </Typography>
              <Typography variant="body2" color="error" sx={{ fontSize: '14px' }}>
                Esta acción no se puede deshacer.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>
            {modalType === 'ver' ? 'Cerrar' : 'Cancelar'}
          </Button>
          {modalType === 'crear' && (
            <Button onClick={handleCreate} variant="contained" color="primary">
              Crear Factura
            </Button>
          )}
          {modalType === 'editar' && (
            <Button onClick={handleUpdate} variant="contained" color="primary">
              Guardar Cambios
            </Button>
          )}
          {modalType === 'eliminar' && (
            <Button 
              onClick={() => {
                handleDelete(selectedFactura._id);
                closeModal();
              }} 
              variant="contained" 
              color="error"
            >
              Sí, Eliminar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Facturas;
