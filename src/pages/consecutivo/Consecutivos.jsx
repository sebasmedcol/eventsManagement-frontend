import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import api from '../../services/api';
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

const Consecutivos = () => {
  const [consecutivos, setConsecutivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'crear', 'ver', 'editar', 'eliminar'
  const [selectedConsecutivo, setSelectedConsecutivo] = useState(null);
  const [formData, setFormData] = useState({
    fecha: '',
    contador: '',
    estado: true
  });

  useEffect(() => {
    fetchConsecutivos();
  }, []);

  const fetchConsecutivos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consecutivos');
      setConsecutivos(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar los consecutivos');
      console.error('Error al cargar consecutivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/consecutivos/${id}`);
      toast.success('Consecutivo eliminado correctamente');
      fetchConsecutivos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar el consecutivo');
      console.error('Error al eliminar consecutivo:', error);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.fecha || !formData.contador) {
        toast.error('Por favor complete todos los campos requeridos');
        return;
      }

      const consecutivoData = {
        ...formData,
        contador: parseInt(formData.contador)
      };
      await api.post('/consecutivos', consecutivoData);
      toast.success('Consecutivo creado correctamente');
      fetchConsecutivos();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear el consecutivo');
      console.error('Error al crear consecutivo:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!formData.fecha || !formData.contador) {
        toast.error('Por favor complete todos los campos requeridos');
        return;
      }

      const consecutivoData = {
        ...formData,
        contador: parseInt(formData.contador)
      };
      await api.put(`/consecutivos/${selectedConsecutivo._id}`, consecutivoData);
      toast.success('Consecutivo actualizado correctamente');
      fetchConsecutivos();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar el consecutivo');
      console.error('Error al actualizar consecutivo:', error);
    }
  };

  const openModal = (type, consecutivo = null) => {
    setModalType(type);
    setSelectedConsecutivo(consecutivo);
    
    if (type === 'crear') {
      setFormData({ 
        fecha: new Date().toISOString().split('T')[0], 
        contador: '', 
        estado: true 
      });
    } else if (consecutivo) {
      setFormData({
        fecha: consecutivo.fecha ? new Date(consecutivo.fecha).toISOString().split('T')[0] : '',
        contador: consecutivo.contador?.toString() || '',
        estado: consecutivo.estado
      });
    }
    
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('');
    setSelectedConsecutivo(null);
    setFormData({ fecha: '', contador: '', estado: true });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const filteredConsecutivos = consecutivos.filter(consecutivo =>
    consecutivo.fecha?.includes(searchTerm) ||
    consecutivo.contador?.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredConsecutivos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConsecutivos = filteredConsecutivos.slice(startIndex, endIndex);

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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Módulo de Consecutivos
        </Typography>
        <Button
          onClick={() => openModal('crear')}
          variant="contained"
          color="primary"
          startIcon={<FaPlus />}
        >
          Crear Consecutivo
        </Button>
      </Box>

      {/* Controles de búsqueda y paginación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            placeholder="🔍 Buscar consecutivos por fecha o contador..."
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
          Total: {filteredConsecutivos.length} consecutivos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Página {filteredConsecutivos.length > 0 ? currentPage : 0} de {totalPages}
        </Typography>
      </Box>

      {/* Tabla de consecutivos */}
      <Paper elevation={3} sx={{ p: 2 }}>
        {currentConsecutivos.length === 0 ? (
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            No se encontraron consecutivos
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Contador</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentConsecutivos.map((consecutivo, index) => (
                    <TableRow key={consecutivo._id} hover>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(consecutivo.fecha)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {consecutivo.contador}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={consecutivo.estado ? 'Activo' : 'Inactivo'}
                          color={consecutivo.estado ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <IconButton
                            onClick={() => openModal('ver', consecutivo)}
                            color="info"
                            size="small"
                            title="Ver detalles"
                          >
                            <FaEye />
                          </IconButton>
                          <IconButton
                            onClick={() => openModal('editar', consecutivo)}
                            color="primary"
                            size="small"
                            title="Editar"
                          >
                            <FaEdit />
                          </IconButton>
                          <IconButton
                            onClick={() => openModal('eliminar', consecutivo)}
                            color="error"
                            size="small"
                            title="Eliminar"
                          >
                            <FaTrash />
                          </IconButton>
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
          {modalType === 'crear' && 'Crear Nuevo Consecutivo'}
          {modalType === 'ver' && 'Detalles del Consecutivo'}
          {modalType === 'editar' && 'Editar Consecutivo'}
          {modalType === 'eliminar' && 'Confirmar Eliminación'}
        </DialogTitle>
        <DialogContent>
          {modalType === 'ver' && selectedConsecutivo && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>ID:</strong> {selectedConsecutivo._id}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Fecha:</strong> {formatDate(selectedConsecutivo.fecha)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Contador:</strong> {selectedConsecutivo.contador}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Estado:</strong> {selectedConsecutivo.estado ? 'Activo' : 'Inactivo'}
              </Typography>
            </Box>
          )}

          {(modalType === 'crear' || modalType === 'editar') && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleInputChange}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Contador"
                name="contador"
                type="number"
                value={formData.contador}
                onChange={handleInputChange}
                margin="normal"
                required
                placeholder="Ingrese el número del contador"
                inputProps={{ min: 0 }}
                variant="outlined"
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

          {modalType === 'eliminar' && selectedConsecutivo && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ¿Estás seguro de que deseas eliminar el consecutivo del <strong>"{formatDate(selectedConsecutivo.fecha)}"</strong>?
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
              Crear Consecutivo
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
                handleDelete(selectedConsecutivo._id);
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

export default Consecutivos;
