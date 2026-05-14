import { useContext, useEffect, useRef, useState } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserTag,
} from 'react-icons/fa';
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
  Switch,
  FormControlLabel,
  Tooltip,
  Chip,
} from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import AuthContext from '../context/AuthContext';
import { getRoles, createRol, updateRol, deleteRol } from '../services/rolService';

// Definimos permisos disponibles por módulo
// 'full' = crear, ver, editar, eliminar
// 'view_only' = solo ver
// 'view_edit' = ver y editar
const MODULOS_PERMISOS = [
  { key: 'dashboard', label: 'Dashboard', permisos: ['ver'] },
  { key: 'clientes', label: 'Clientes', permisos: ['crear', 'ver', 'editar', 'eliminar'] },
  { key: 'productos', label: 'Productos', permisos: ['crear', 'ver', 'editar', 'eliminar'] },
  { key: 'ventas', label: 'Ventas', permisos: ['crear', 'ver', 'editar', 'eliminar'] },
  { key: 'eventos', label: 'Cronograma de eventos', permisos: ['crear', 'ver', 'editar', 'eliminar'] },
  { key: 'consecutivos', label: 'Consecutivos', permisos: ['crear', 'ver', 'editar', 'eliminar'] },
  { key: 'cotizaciones', label: 'Cotizaciones', permisos: ['crear', 'ver', 'editar', 'eliminar'] },
  { key: 'disponibilidad', label: 'Disponibilidad', permisos: ['ver'] },
  { key: 'configuracion', label: 'Configuracion', permisos: ['ver', 'editar'] },
  { key: 'usuarios', label: 'Usuarios', permisos: ['crear', 'ver', 'editar', 'eliminar'] },
  { key: 'roles', label: 'Roles', permisos: ['crear', 'ver', 'editar', 'eliminar'] },
  { key: 'dashboard_global', label: 'Dashboard global', permisos: ['ver'] },
  { key: 'empresas', label: 'Empresas', permisos: ['ver'] },
];

const buildPermisosDefault = () => {
  const base = {};
  MODULOS_PERMISOS.forEach((m) => {
    const permisoObj = {};
    ['crear', 'ver', 'editar', 'eliminar'].forEach((accion) => {
      permisoObj[accion] = false;
    });
    base[m.key] = permisoObj;
  });
  return base;
};

const normalizarPermisosUI = (input) => {
  const base = buildPermisosDefault();
  if (!input || typeof input !== 'object') return base;
  MODULOS_PERMISOS.forEach((m) => {
    const v = input[m.key];
    if (!v || typeof v !== 'object') return;
    base[m.key] = {
      crear: v.crear === true,
      ver: v.ver === true,
      editar: v.editar === true,
      eliminar: v.eliminar === true,
    };
  });
  return base;
};

const Roles = () => {
  const { user } = useContext(AuthContext);
  const userRol = user?.rol;
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedRoles = useRef(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
    permisos: buildPermisosDefault(),
  });

  useEffect(() => {
    if (!userRol || (userRol !== 'admin' && userRol !== 'superadmin')) {
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const showLoading = !hasLoadedRoles.current;
      try {
        if (showLoading) setLoading(true);
        const data = await getRoles();
        setRoles(data);
        hasLoadedRoles.current = true;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al cargar los roles');
        console.error('Error al cargar roles:', error);
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchRoles();
  }, [userRol]);

  const handleOpenModal = (rol = null) => {
    if (rol) {
      setEditingRol(rol);
      setFormData({
        nombre: rol.nombre,
        descripcion: rol.descripcion || '',
        activo: rol.activo,
        permisos: normalizarPermisosUI(rol.permisos),
      });
    } else {
      setEditingRol(null);
      setFormData({
        nombre: '',
        descripcion: '',
        activo: true,
        permisos: buildPermisosDefault(),
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleActivo = (e) => {
    setFormData((prev) => ({ ...prev, activo: e.target.checked }));
  };

  const handlePermisoToggle = (modulo, accion) => {
    setFormData((prev) => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [modulo]: {
          ...(prev.permisos?.[modulo] || {
            crear: false,
            ver: false,
            editar: false,
            eliminar: false,
          }),
          [accion]: !(prev.permisos?.[modulo]?.[accion] === true),
        },
      },
    }));
  };

const handleToggleModuloCompleto = (modulo) => {
    const moduloConfig = MODULOS_PERMISOS.find((m) => m.key === modulo);
    if (!moduloConfig) return;
    
    const currentPermisos = formData.permisos[modulo] || {};
    // Solo verificar las acciones disponibles para este módulo
    const allActive = moduloConfig.permisos.every(
      (accion) => currentPermisos[accion] === true
    );

    const newPermisos = { crear: false, ver: false, editar: false, eliminar: false };
    moduloConfig.permisos.forEach((accion) => {
      newPermisos[accion] = !allActive;
    });

    setFormData((prev) => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [modulo]: newPermisos,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
      const nombreTrim = formData.nombre.trim();
      if (!nombreTrim) {
        toast.error('El nombre del rol es obligatorio');
        return;
      }

      if (nombreTrim.length > 50) {
        toast.error('El nombre del rol no puede superar 50 caracteres');
        return;
      }

      const descripcionTrim = formData.descripcion.trim();
      if (descripcionTrim.length > 200) {
        toast.error('La descripcion no puede superar 200 caracteres');
        return;
      }

      const payload = {
        nombre: nombreTrim,
        descripcion: descripcionTrim,
        activo: formData.activo,
        permisos: formData.permisos,
      };

      if (editingRol) {
        const actualizado = await updateRol(editingRol._id, payload);
        setRoles((prev) =>
          prev.map((r) => (r._id === actualizado._id ? actualizado : r))
        );
        toast.success('Rol actualizado');
      } else {
        const creado = await createRol(payload);
        setRoles((prev) => [...prev, creado]);
        toast.success('Rol creado');
      }

      setOpenModal(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Error al guardar el rol'
      );
      console.error('Error al guardar rol:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que desea eliminar este rol? Esta acción no se puede deshacer.')) return;

    try {
      await deleteRol(id);
      setRoles((prev) => prev.filter((r) => r._id !== id));
      toast.success('Rol eliminado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar el rol');
      console.error('Error al eliminar rol:', error);
    }
  };

  if (!user || (user.rol !== 'admin' && user.rol !== 'superadmin')) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">
            Solo los administradores pueden gestionar roles.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Roles</Typography>
          <Tooltip title="Crear un nuevo rol para esta empresa">
            <Button
              variant="contained"
              startIcon={<FaPlus />}
              onClick={() => handleOpenModal(null)}
            >
              Nuevo rol
            </Button>
          </Tooltip>
        </Box>

        <Paper>
          {loading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripcion</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FaUserTag />
                          {r.nombre}
                        </Box>
                      </TableCell>
                      <TableCell>{r.descripcion || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={r.activo ? 'Activo' : 'Inactivo'}
                          color={r.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {r.esPredeterminado && (
                          <Chip
                            label="Predeterminado"
                            color="primary"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar rol y permisos">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenModal(r)}
                            sx={{ mr: 1 }}
                          >
                            <FaEdit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            r.esPredeterminado
                              ? 'No se puede eliminar un rol predeterminado'
                              : 'Eliminar rol'
                          }
                        >
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(r._id)}
                              disabled={r.esPredeterminado}
                            >
                              <FaTrash />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {roles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay roles registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>{editingRol ? 'Editar rol' : 'Nuevo rol'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            required
            fullWidth
            id="nombre"
            label="Nombre del rol"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            variant="outlined"
            inputProps={{ maxLength: 50 }}
          />

          <TextField
            margin="normal"
            fullWidth
            name="descripcion"
            label="Descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            variant="outlined"
            multiline
            rows={2}
            inputProps={{ maxLength: 200 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.activo}
                onChange={handleToggleActivo}
                color="primary"
              />
            }
            label={formData.activo ? 'Activo' : 'Inactivo'}
            sx={{ mt: 1 }}
          />

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Permisos por modulo
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              C = Crear, V = Ver, E = Editar, D = Eliminar. Haz clic en el nombre del modulo para activar/desactivar todos los permisos.
            </Typography>
{MODULOS_PERMISOS.map((m) => {
              const moduloPermisos = formData.permisos[m.key] || {};
              // Verificar si todas las acciones disponibles están activas
              const allActive = m.permisos.every(
                (accion) => moduloPermisos[accion] === true
              );
              return (
                <Box
                  key={m.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    px: 1.5,
                    py: 1,
                    mb: 1,
                  }}
                >
                  <Tooltip title="Clic para activar/desactivar todos los permisos de este modulo">
                    <Typography
                      variant="body2"
                      sx={{
                        minWidth: 170,
                        cursor: 'pointer',
                        fontWeight: allActive ? 600 : 400,
                        color: allActive ? 'primary.main' : 'text.primary',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={() => handleToggleModuloCompleto(m.key)}
                    >
                      {m.label}
                    </Typography>
                  </Tooltip>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {m.permisos.includes('crear') && (
                      <Tooltip title="Crear">
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={formData.permisos?.[m.key]?.crear === true}
                              onChange={() => handlePermisoToggle(m.key, 'crear')}
                            />
                          }
                          label="C"
                          sx={{ m: 0 }}
                        />
                      </Tooltip>
                    )}
                    {m.permisos.includes('ver') && (
                      <Tooltip title="Ver">
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={formData.permisos?.[m.key]?.ver === true}
                              onChange={() => handlePermisoToggle(m.key, 'ver')}
                            />
                          }
                          label="V"
                          sx={{ m: 0 }}
                        />
                      </Tooltip>
                    )}
                    {m.permisos.includes('editar') && (
                      <Tooltip title="Editar">
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={formData.permisos?.[m.key]?.editar === true}
                              onChange={() => handlePermisoToggle(m.key, 'editar')}
                            />
                          }
                          label="E"
                          sx={{ m: 0 }}
                        />
                      </Tooltip>
                    )}
                    {m.permisos.includes('eliminar') && (
                      <Tooltip title="Eliminar">
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={formData.permisos?.[m.key]?.eliminar === true}
                              onChange={() => handlePermisoToggle(m.key, 'eliminar')}
                            />
                          }
                          label="D"
                          sx={{ m: 0 }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Roles;
