import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
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

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'crear', 'ver', 'editar', 'eliminar'
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipoDeServicio: 'Venta',
    tipoDeCobro: 'unidad',
    precio: '',
    cantidadTotal: '',
    estado: true
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/productos');
      setProductos(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar los productos');
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/productos/${id}`);
      toast.success('Producto eliminado correctamente');
      fetchProductos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar el producto');
      console.error('Error al eliminar producto:', error);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.nombre.trim() || !formData.descripcion.trim() || formData.precio === '') {
        toast.error('Por favor complete los campos obligatorios');
        return;
      }
      if (isNaN(formData.precio) || parseFloat(formData.precio) < 0) {
        toast.error('El precio debe ser un número mayor o igual a cero');
        return;
      }
      if (
        formData.cantidadTotal !== '' &&
        (isNaN(formData.cantidadTotal) || parseFloat(formData.cantidadTotal) < 0)
      ) {
        toast.error('La cantidad debe ser un número mayor o igual a cero');
        return;
      }

      const productoData = {
        ...formData,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: parseFloat(formData.precio),
        cantidadTotal:
          formData.cantidadTotal === '' ? 0 : parseFloat(formData.cantidadTotal),
      };
      await api.post('/productos', productoData);
      toast.success('Producto creado correctamente');
      fetchProductos();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear el producto');
      console.error('Error al crear producto:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!formData.nombre.trim() || !formData.descripcion.trim() || formData.precio === '') {
        toast.error('Por favor complete los campos obligatorios');
        return;
      }
      if (isNaN(formData.precio) || parseFloat(formData.precio) < 0) {
        toast.error('El precio debe ser un número mayor o igual a cero');
        return;
      }
      if (
        formData.cantidadTotal !== '' &&
        (isNaN(formData.cantidadTotal) || parseFloat(formData.cantidadTotal) < 0)
      ) {
        toast.error('La cantidad debe ser un número mayor o igual a cero');
        return;
      }

      const productoData = {
        ...formData,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: parseFloat(formData.precio),
        cantidadTotal:
          formData.cantidadTotal === '' ? 0 : parseFloat(formData.cantidadTotal),
      };
      await api.put(`/productos/${selectedProducto._id}`, productoData);
      toast.success('Producto actualizado correctamente');
      fetchProductos();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar el producto');
      console.error('Error al actualizar producto:', error);
    }
  };

  const openModal = (type, producto = null) => {
    setModalType(type);
    setSelectedProducto(producto);
    
    if (type === 'crear') {
      setFormData({
        nombre: '',
        descripcion: '',
        codigoSKU: '',
        tipoDeServicio: 'Venta',
        tipoDeCobro: 'unidad',
        precio: '',
        cantidadTotal: '',
        estado: true,
      });
    } else if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        codigoSKU: producto.codigoSKU || '',
        tipoDeServicio: producto.tipoDeServicio || 'Venta',
        tipoDeCobro: producto.tipoDeCobro || 'unidad',
        precio: producto.precio?.toString() || '',
        cantidadTotal:
          producto.cantidadTotal != null ? String(producto.cantidadTotal) : '',
        estado: producto.estado !== undefined ? producto.estado : true
      });
    }
    
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('');
    setSelectedProducto(null);
    setFormData({
      nombre: '',
      descripcion: '',
      codigoSKU: '',
      tipoDeServicio: 'Venta',
      tipoDeCobro: 'unidad',
      precio: '',
      cantidadTotal: '',
      estado: true,
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

const filteredProductos = productos.filter(producto =>
  producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
  producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (producto.codigoSKU || '').toLowerCase().includes(searchTerm.toLowerCase())
);

  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProductos = filteredProductos.slice(startIndex, endIndex);

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

  const formatPrecio = (producto) => {
    const base = formatCurrency(producto.precio || 0);
    if (producto.tipoDeCobro === 'hora') return `${base} / hora`;
    return `${base} / unidad`;
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Módulo de Productos
        </Typography>
        <Button
          onClick={() => openModal('crear')}
          variant="contained"
          color="success"
          startIcon={<FaPlus />}
        >
          Crear Producto
        </Button>
      </Box>

      {/* Controles de búsqueda y paginación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            placeholder="🔍 Buscar productos por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaSearch />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
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
          Total: {filteredProductos.length} productos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Página {filteredProductos.length > 0 ? currentPage : 0} de {totalPages}
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 2 }}>
        {currentProductos.length === 0 ? (
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            No se encontraron productos
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Código SKU</TableCell>
                    <TableCell>Tipo de servicio</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentProductos.map((producto, index) => (
                    <TableRow key={producto._id} hover>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {producto.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {producto.descripcion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {producto.codigoSKU || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {producto.tipoDeServicio || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
  {(producto.cantidadTotal === 0 || producto.cantidadTotal == null) ? (
    <Chip label="Sin stock" color="warning" size="small" />
  ) : (
    <Typography variant="body2" color="text.secondary">
      {producto.cantidadTotal}
    </Typography>
  )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatPrecio(producto)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={producto.estado ? 'Activo' : 'Inactivo'}
                          color={producto.estado ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <IconButton
                            onClick={() => openModal('ver', producto)}
                            color="info"
                            size="small"
                            title="Ver detalles"
                          >
                            <FaEye />
                          </IconButton>
                          <IconButton
                            onClick={() => openModal('editar', producto)}
                            color="primary"
                            size="small"
                            title="Editar"
                          >
                            <FaEdit />
                          </IconButton>
                          <IconButton
                            onClick={() => openModal('eliminar', producto)}
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
          {modalType === 'crear' && 'Crear Nuevo Producto'}
          {modalType === 'ver' && 'Detalles del Producto'}
          {modalType === 'editar' && 'Editar Producto'}
          {modalType === 'eliminar' && 'Confirmar Eliminación'}
        </DialogTitle>
        <DialogContent>
          {modalType === 'ver' && selectedProducto && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>ID:</strong> {selectedProducto._id}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Nombre:</strong> {selectedProducto.nombre}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Descripción:</strong> {selectedProducto.descripcion}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Código SKU:</strong>{' '}
                  <span style={{ fontFamily: 'monospace' }}>
                {selectedProducto.codigoSKU || '—'}
                </span>
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Tipo de servicio:</strong> {selectedProducto.tipoDeServicio || '-'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Tipo de cobro:</strong>{' '}
                {selectedProducto.tipoDeCobro === 'hora' ? 'Por hora' : 'Por unidad'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Cantidad (stock inicial):</strong>{' '}
                {selectedProducto.cantidadTotal != null ? selectedProducto.cantidadTotal : 0}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Precio:</strong> {formatPrecio(selectedProducto)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Estado:</strong> {selectedProducto.estado ? 'Activo' : 'Inactivo'}
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
                placeholder="Ingrese el nombre del producto"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={3}
                placeholder="Describa el producto..."
                variant="outlined"
                required
              />
              <TextField
              fullWidth
              label="Código SKU"
              name="codigoSKU"
              value={formData.codigoSKU}
              onChange={handleInputChange}
              margin="normal"
              placeholder="Escanea o escribe el código manualmente"
              variant="outlined"
              autoComplete="off"
              inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 2 } }}
              helperText="Puedes usar un lector láser: enfoca este campo y escanea el código de barras"
              InputProps={{
              endAdornment: (
              <InputAdornment position="end">
              <Typography variant="caption" color="text.secondary" title="Compatible con lector láser">
              📷
              </Typography>
              </InputAdornment>
              ),
              }}
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Tipo de servicio</InputLabel>
                <Select
                  name="tipoDeServicio"
                  value={formData.tipoDeServicio}
                  onChange={handleInputChange}
                  label="Tipo de servicio"
                >
                  <MenuItem value="Alquiler">Alquiler</MenuItem>
                  <MenuItem value="Venta">Venta</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Tipo de cobro</InputLabel>
                <Select
                  name="tipoDeCobro"
                  value={formData.tipoDeCobro}
                  onChange={handleInputChange}
                  label="Tipo de cobro"
                >
                  <MenuItem value="unidad">Por unidad</MenuItem>
                  <MenuItem value="hora">Por hora</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label={
                  formData.tipoDeCobro === 'hora' ? 'Precio (por hora)' : 'Precio (por unidad)'
                }
                name="precio"
                type="number"
                value={formData.precio}
                onChange={handleInputChange}
                margin="normal"
                required
                placeholder="0"
                inputProps={{ min: 0, step: 1000 }}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Cantidad (stock inicial)"
                name="cantidadTotal"
                type="number"
                value={formData.cantidadTotal}
                onChange={handleInputChange}
                margin="normal"
                placeholder="0"
                inputProps={{ min: 0, step: 1 }}
                variant="outlined"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  label="Estado"
                >
                  <MenuItem value={true}>Activo</MenuItem>
                  <MenuItem value={false}>Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {modalType === 'eliminar' && selectedProducto && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ¿Estás seguro de que deseas eliminar el producto <strong>"{selectedProducto.nombre}"</strong>?
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
            <Button onClick={handleCreate} variant="contained" color="success">
              Crear Producto
            </Button>
          )}
          {modalType === 'editar' && (
            <Button onClick={handleUpdate} variant="contained" color="success">
              Guardar Cambios
            </Button>
          )}
          {modalType === 'eliminar' && (
            <Button 
              onClick={() => {
                handleDelete(selectedProducto._id);
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

export default Productos;
