import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { usePlan } from '../context/PlanContext';
import { 
  LimitedButton, 
  UsageIndicator, 
  PlanRestricted,
  FeatureRestricted,
} from '../components/plan';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Página de Clientes con restricciones de plan integradas
 * Ejemplo de implementación completa de límites y restricciones
 */
const ClientesWithPlan = () => {
  // Estado de datos
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalClientes, setTotalClientes] = useState(0);
  
  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // create | edit
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  // Estado de notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Estado de menú de acciones
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCliente, setMenuCliente] = useState(null);
  
  // Hook del plan
  const { 
    checkLimit, 
    canUseFeature, 
    refreshPlanInfo,
    getFeatureRestrictionMessage,
  } = usePlan();
  
  // Obtener información de límites
  const clientesLimit = checkLimit('clientes');
  
  /**
   * Cargar clientes desde el servidor
   */
  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
        },
      });
      
      if (response.data.success) {
        setClientes(response.data.data || response.data.clientes || []);
        setTotalClientes(response.data.total || 0);
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setError(err.response?.data?.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm]);
  
  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);
  
  /**
   * Manejar creación de cliente
   */
  const handleCreate = () => {
    // Verificar límite antes de abrir el diálogo
    if (!clientesLimit.canCreate) {
      setSnackbar({
        open: true,
        message: `Has alcanzado el límite de clientes para tu plan (${clientesLimit.current}/${clientesLimit.limit}). Mejora tu plan para agregar más.`,
        severity: 'warning',
      });
      return;
    }
    
    setDialogMode('create');
    setSelectedCliente(null);
    setOpenDialog(true);
  };
  
  /**
   * Manejar edición de cliente
   */
  const handleEdit = (cliente) => {
    setDialogMode('edit');
    setSelectedCliente(cliente);
    setOpenDialog(true);
    handleCloseMenu();
  };
  
  /**
   * Manejar eliminación de cliente
   */
  const handleDelete = async (cliente) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${cliente.nombre}?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/clientes/${cliente._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSnackbar({
        open: true,
        message: 'Cliente eliminado correctamente',
        severity: 'success',
      });
      
      fetchClientes();
      refreshPlanInfo(); // Actualizar info del plan (límites)
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error al eliminar cliente',
        severity: 'error',
      });
    }
    
    handleCloseMenu();
  };
  
  /**
   * Guardar cliente (crear o editar)
   */
  const handleSaveCliente = async (clienteData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (dialogMode === 'create') {
        const response = await axios.post(`${API_URL}/clientes`, clienteData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Verificar si el servidor rechazó por límite
        if (response.data.code === 'LIMIT_REACHED') {
          setSnackbar({
            open: true,
            message: response.data.message,
            severity: 'warning',
          });
          return;
        }
        
        setSnackbar({
          open: true,
          message: 'Cliente creado correctamente',
          severity: 'success',
        });
      } else {
        await axios.put(`${API_URL}/clientes/${selectedCliente._id}`, clienteData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setSnackbar({
          open: true,
          message: 'Cliente actualizado correctamente',
          severity: 'success',
        });
      }
      
      setOpenDialog(false);
      fetchClientes();
      refreshPlanInfo(); // Actualizar info del plan
    } catch (err) {
      // Manejar error de límite del backend
      if (err.response?.data?.code === 'LIMIT_REACHED') {
        setSnackbar({
          open: true,
          message: err.response.data.message,
          severity: 'warning',
        });
      } else {
        setSnackbar({
          open: true,
          message: err.response?.data?.message || 'Error al guardar cliente',
          severity: 'error',
        });
      }
    }
  };
  
  /**
   * Manejar exportación a Excel
   */
  const handleExportExcel = async () => {
    if (!canUseFeature('exportarExcel')) {
      setSnackbar({
        open: true,
        message: getFeatureRestrictionMessage('exportarExcel'),
        severity: 'warning',
      });
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/clientes/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      // Descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'clientes.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      if (err.response?.data?.code === 'FEATURE_NOT_AVAILABLE') {
        setSnackbar({
          open: true,
          message: err.response.data.message,
          severity: 'warning',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error al exportar clientes',
          severity: 'error',
        });
      }
    }
  };
  
  /**
   * Manejar exportación a PDF
   */
  const handleExportPDF = async () => {
    if (!canUseFeature('exportarPDF')) {
      setSnackbar({
        open: true,
        message: getFeatureRestrictionMessage('exportarPDF'),
        severity: 'warning',
      });
      return;
    }
    
    // Implementar exportación a PDF...
    setSnackbar({
      open: true,
      message: 'Exportación a PDF en desarrollo',
      severity: 'info',
    });
  };
  
  // Menú handlers
  const handleOpenMenu = (event, cliente) => {
    setAnchorEl(event.currentTarget);
    setMenuCliente(cliente);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuCliente(null);
  };
  
  return (
    <PlanRestricted moduleName="clientes">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Clientes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestiona los clientes de tu empresa
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Indicador de uso */}
            <UsageIndicator resourceType="clientes" size="medium" />
            
            {/* Botón de crear con límite */}
            <LimitedButton
              resourceType="clientes"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              showUsage={false}
            >
              Nuevo Cliente
            </LimitedButton>
          </Box>
        </Box>
        
        {/* Barra de herramientas */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Buscar clientes..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            
            <Box sx={{ flex: 1 }} />
            
            {/* Botón de exportar Excel */}
            <FeatureRestricted featureName="exportarExcel">
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={handleExportExcel}
                size="small"
              >
                Excel
              </Button>
            </FeatureRestricted>
            
            {/* Botón de exportar PDF */}
            <FeatureRestricted featureName="exportarPDF">
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={handleExportPDF}
                size="small"
              >
                PDF
              </Button>
            </FeatureRestricted>
            
            <IconButton onClick={fetchClientes} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Paper>
        
        {/* Tabla de clientes */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Ciudad</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No hay clientes registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente._id} hover>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {cliente.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>{cliente.telefono}</TableCell>
                      <TableCell>{cliente.ciudad}</TableCell>
                      <TableCell>
                        <Chip
                          label={cliente.activo ? 'Activo' : 'Inactivo'}
                          color={cliente.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMenu(e, cliente)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalClientes}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count}`
            }
          />
        </Paper>
        
        {/* Menú de acciones */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={() => handleEdit(menuCliente)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar
          </MenuItem>
          <MenuItem 
            onClick={() => handleDelete(menuCliente)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Eliminar
          </MenuItem>
        </Menu>
        
        {/* Snackbar de notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        
        {/* Dialog de crear/editar - Implementar según necesidad */}
        {/* <ClienteDialog open={openDialog} ... /> */}
      </Box>
    </PlanRestricted>
  );
};

export default ClientesWithPlan;
