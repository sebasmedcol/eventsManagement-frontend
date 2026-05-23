import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';
import usePermisos from '../hooks/usePermisos';
import { usePlan } from '../context/PlanContext';
import { LimitedButton, UsageIndicator, PlanRestricted, UpgradeRecommendation } from '../components/plan';
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

const Clientes = () => {
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisos();
  const { checkLimit, refreshPlanInfo, canAccessModule, shouldRecommendUpgrade } = usePlan();
  const indicativos = ['+57', '+1', '+34', '+52', '+54', '+56', '+51', '+55'];
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'crear', 'ver', 'editar', 'eliminar'
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    documentoTipo: '',
    documentoNumero: '',
    telefono: '',
    direccion: '',
    estado: true
  });
  const [indicativoChoice, setIndicativoChoice] = useState('+57');
  const [indicativoCustom, setIndicativoCustom] = useState('');

  // Verificar acceso al modulo
  const hasModuleAccess = canAccessModule('clientes');
  const limitInfo = checkLimit('clientes');

  useEffect(() => {
    if (hasModuleAccess) {
      fetchClientes();
    }
  }, [hasModuleAccess]);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      // Manejar errores especificos de plan
      if (error.response?.data?.code === 'MODULE_NOT_AVAILABLE') {
        toast.error('Este modulo no esta disponible en tu plan actual');
      } else if (error.response?.data?.code === 'TRIAL_EXPIRED') {
        toast.error('Tu periodo de prueba ha expirado. Por favor selecciona un plan.');
      } else {
        toast.error(error.response?.data?.message || 'Error al cargar los clientes');
      }
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/clientes/${id}`);
      toast.success('Cliente eliminado correctamente');
      fetchClientes();
      refreshPlanInfo(); // Actualizar info del plan despues de eliminar
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar el cliente');
      console.error('Error al eliminar cliente:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const nombreTrim = formData.nombreCompleto.trim();
      const telefonoTrim = formData.telefono.trim();
      const direccionTrim = formData.direccion.trim();
      const emailTrim = formData.email.trim();
      const docNumTrim = formData.documentoNumero.trim();
      const indicativoFinal =
        indicativoChoice === 'OTRO' ? indicativoCustom.trim() : indicativoChoice;

      if (!nombreTrim || !telefonoTrim || !direccionTrim) {
        toast.error('Por favor complete los campos obligatorios');
        return;
      }
      if (nombreTrim.length > 50) {
        toast.error('El nombre del cliente no puede superar 50 caracteres');
        return;
      }
      if (emailTrim.length > 254) {
        toast.error('El correo no puede superar 254 caracteres');
        return;
      }
      if (docNumTrim.length > 30) {
        toast.error('El numero de documento no puede superar 30 caracteres');
        return;
      }
      if (telefonoTrim.length > 15) {
        toast.error('El telefono no puede superar 15 caracteres');
        return;
      }
      if (!indicativoFinal) {
        toast.error('El indicativo es obligatorio');
        return;
      }

      const payload = {
        ...formData,
        nombreCompleto: nombreTrim,
        telefono: telefonoTrim,
        direccion: direccionTrim,
        email: emailTrim,
        documentoNumero: docNumTrim,
        indicativo: indicativoFinal,
      };

      await api.post('/clientes', payload);
      toast.success('Cliente creado correctamente');
      fetchClientes();
      refreshPlanInfo(); // Actualizar info del plan despues de crear
      closeModal();
    } catch (error) {
      // Manejar errores especificos de plan
      if (error.response?.data?.code === 'LIMIT_REACHED') {
        toast.error(`Has alcanzado el limite de clientes de tu plan. Mejora tu plan para agregar mas.`);
      } else if (error.response?.data?.code === 'TRIAL_EXPIRED') {
        toast.error('Tu periodo de prueba ha expirado. Por favor selecciona un plan.');
      } else {
        toast.error(error.response?.data?.message || 'Error al crear el cliente');
      }
      console.error('Error al crear cliente:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const nombreTrim = formData.nombreCompleto.trim();
      const telefonoTrim = formData.telefono.trim();
      const direccionTrim = formData.direccion.trim();
      const emailTrim = formData.email.trim();
      const docNumTrim = formData.documentoNumero.trim();
      const indicativoFinal =
        indicativoChoice === 'OTRO' ? indicativoCustom.trim() : indicativoChoice;

      if (!nombreTrim || !telefonoTrim || !direccionTrim) {
        toast.error('Por favor complete los campos obligatorios');
        return;
      }
      if (nombreTrim.length > 50) {
        toast.error('El nombre del cliente no puede superar 50 caracteres');
        return;
      }
      if (emailTrim.length > 254) {
        toast.error('El correo no puede superar 254 caracteres');
        return;
      }
      if (docNumTrim.length > 30) {
        toast.error('El numero de documento no puede superar 30 caracteres');
        return;
      }
      if (telefonoTrim.length > 15) {
        toast.error('El telefono no puede superar 15 caracteres');
        return;
      }
      if (!indicativoFinal) {
        toast.error('El indicativo es obligatorio');
        return;
      }

      const payload = {
        ...formData,
        nombreCompleto: nombreTrim,
        telefono: telefonoTrim,
        direccion: direccionTrim,
        email: emailTrim,
        documentoNumero: docNumTrim,
        indicativo: indicativoFinal,
      };

      await api.put(`/clientes/${selectedCliente._id}`, payload);
      toast.success('Cliente actualizado correctamente');
      fetchClientes();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar el cliente');
      console.error('Error al actualizar cliente:', error);
    }
  };

  const openModal = (type, cliente = null) => {
    setModalType(type);
    setSelectedCliente(cliente);
    
    if (type === 'crear') {
      setFormData({
        nombreCompleto: '',
        email: '',
        documentoTipo: '',
        documentoNumero: '',
        telefono: '',
        direccion: '',
        estado: true,
      });
      setIndicativoChoice('+57');
      setIndicativoCustom('');
    } else if (cliente) {
      setFormData({
        nombreCompleto: cliente.nombreCompleto || '',
        email: cliente.email || '',
        documentoTipo: cliente.documentoTipo || '',
        documentoNumero: cliente.documentoNumero || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        estado: cliente.estado !== undefined ? cliente.estado : true
      });

      const indicativoCliente = (cliente.indicativo || '+57').trim();
      if (indicativos.includes(indicativoCliente)) {
        setIndicativoChoice(indicativoCliente);
        setIndicativoCustom('');
      } else {
        setIndicativoChoice('OTRO');
        setIndicativoCustom(indicativoCliente);
      }
    }
    
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('');
    setSelectedCliente(null);
    setFormData({
      nombreCompleto: '',
      email: '',
      documentoTipo: '',
      documentoNumero: '',
      telefono: '',
      direccion: '',
      estado: true,
    });
    setIndicativoChoice('+57');
    setIndicativoCustom('');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClientes = filteredClientes.slice(startIndex, endIndex);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(event.target.value);
    setCurrentPage(1);
  };

  // Si el modulo no esta disponible, mostrar mensaje de restriccion
  if (!hasModuleAccess) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PlanRestricted moduleName="clientes" />
      </Container>
    );
  }

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
          Modulo de Clientes
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Indicador de uso de limite */}
          <UsageIndicator resourceType="clientes" showProgress={true} size="medium" />
          
          {puedeCrear('clientes') && (
            <LimitedButton
              resourceType="clientes"
              onClick={() => openModal('crear')}
              variant="contained"
              color="primary"
              startIcon={<FaPlus />}
              showUsage={false}
            >
              Crear Cliente
            </LimitedButton>
          )}
        </Box>
      </Box>

      {/* Recomendacion de upgrade si esta cerca del limite */}
      {shouldRecommendUpgrade() && (
        <Box sx={{ mb: 3 }}>
          <UpgradeRecommendation />
        </Box>
      )}

      {/* Controles de busqueda y paginacion */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            placeholder="Buscar clientes por nombre..."
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
            <InputLabel>Items por pagina</InputLabel>
            <Select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              label="Items por pagina"
            >
              <MenuItem value={5}>5 por pagina</MenuItem>
              <MenuItem value={10}>10 por pagina</MenuItem>
              <MenuItem value={15}>15 por pagina</MenuItem>
              <MenuItem value={25}>25 por pagina</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Informacion de paginacion */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" fontWeight="bold" color="text.secondary">
          Total: {filteredClientes.length} clientes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pagina {filteredClientes.length > 0 ? currentPage : 0} de {totalPages}
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        {currentClientes.length === 0 ? (
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            No se encontraron clientes
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre Completo</TableCell>
                    <TableCell>Telefono</TableCell>
                    <TableCell>Direccion</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentClientes.map((cliente, index) => (
                    <TableRow key={cliente._id} hover>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {cliente.nombreCompleto}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {(cliente.indicativo ? `${cliente.indicativo} ` : '') + (cliente.telefono || '')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {cliente.direccion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cliente.estado ? 'Activo' : 'Inactivo'}
                          color={cliente.estado ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <IconButton
                            onClick={() => openModal('ver', cliente)}
                            color="info"
                            size="small"
                            title="Ver detalles"
                          >
                            <FaEye />
                          </IconButton>
                          {puedeEditar('clientes') && (
                            <IconButton
                              onClick={() => openModal('editar', cliente)}
                              color="primary"
                              size="small"
                              title="Editar"
                            >
                              <FaEdit />
                            </IconButton>
                          )}
                          {puedeEliminar('clientes') && (
                            <IconButton
                              onClick={() => openModal('eliminar', cliente)}
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

            {/* Paginacion */}
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
          {modalType === 'crear' && 'Crear Nuevo Cliente'}
          {modalType === 'ver' && 'Detalles del Cliente'}
          {modalType === 'editar' && 'Editar Cliente'}
          {modalType === 'eliminar' && 'Confirmar Eliminacion'}
        </DialogTitle>
        <DialogContent>
          {modalType === 'ver' && selectedCliente && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>ID:</strong> {selectedCliente._id}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Nombre Completo:</strong> {selectedCliente.nombreCompleto}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Telefono:</strong> {selectedCliente.telefono}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Indicativo:</strong> {selectedCliente.indicativo || '-'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Correo:</strong> {selectedCliente.email || '-'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Documento:</strong>{' '}
                {selectedCliente.documentoTipo
                  ? `${selectedCliente.documentoTipo} - ${selectedCliente.documentoNumero || ''}`
                  : '-'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Direccion:</strong> {selectedCliente.direccion}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Estado:</strong> {selectedCliente.estado ? 'Activo' : 'Inactivo'}
              </Typography>
            </Box>
          )}

          {(modalType === 'crear' || modalType === 'editar') && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Nombre Completo"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleInputChange}
                margin="normal"
                required
                placeholder="Ingrese el nombre completo del cliente"
                variant="outlined"
                inputProps={{ maxLength: 50 }}
              />
              <TextField
                fullWidth
                label="Correo (opcional)"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                margin="normal"
                placeholder="correo@dominio.com"
                variant="outlined"
                inputProps={{ maxLength: 254 }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo de documento (opcional)</InputLabel>
                <Select
                  name="documentoTipo"
                  value={formData.documentoTipo}
                  onChange={handleInputChange}
                  label="Tipo de documento (opcional)"
                >
                  <MenuItem value="">Sin documento</MenuItem>
                  <MenuItem value="cedula">Cedula</MenuItem>
                  <MenuItem value="cedula_extranjeria">Cedula de Extranjeria</MenuItem>
                  <MenuItem value="ppt">PPT</MenuItem>
                  <MenuItem value="rut">RUT</MenuItem>
                  <MenuItem value="nit">NIT</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Numero de documento (opcional)"
                name="documentoNumero"
                value={formData.documentoNumero}
                onChange={handleInputChange}
                margin="normal"
                placeholder="Max 30 caracteres"
                variant="outlined"
                inputProps={{ maxLength: 30 }}
                disabled={!formData.documentoTipo}
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 180, flexGrow: 0 }} margin="normal">
                  <InputLabel>Indicativo</InputLabel>
                  <Select
                    value={indicativoChoice}
                    label="Indicativo"
                    onChange={(e) => setIndicativoChoice(e.target.value)}
                  >
                    {indicativos.map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                    <MenuItem value="OTRO">Otro</MenuItem>
                  </Select>
                </FormControl>
                {indicativoChoice === 'OTRO' && (
                  <TextField
                    margin="normal"
                    label="Indicativo personalizado"
                    value={indicativoCustom}
                    onChange={(e) => setIndicativoCustom(e.target.value)}
                    placeholder="Ej: +57"
                    inputProps={{ maxLength: 6 }}
                    sx={{ minWidth: 200 }}
                  />
                )}
                <TextField
                  fullWidth
                  label="Telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  placeholder="Max 15 caracteres"
                  variant="outlined"
                  inputProps={{ maxLength: 15 }}
                  sx={{ flexGrow: 1, minWidth: 240 }}
                />
              </Box>
              <TextField
                fullWidth
                label="Direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={3}
                placeholder="Ingrese la direccion completa..."
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

          {modalType === 'eliminar' && selectedCliente && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Estas seguro de que deseas eliminar el cliente <strong>"{selectedCliente.nombreCompleto}"</strong>?
              </Typography>
              <Typography variant="body2" color="error" sx={{ fontSize: '14px' }}>
                Esta accion no se puede deshacer.
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
              Crear Cliente
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
                handleDelete(selectedCliente._id);
                closeModal();
              }} 
              variant="contained" 
              color="error"
            >
              Si, Eliminar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Clientes;
