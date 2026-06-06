import { useContext, useEffect, useRef, useState } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaUserTag,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  Box, Typography, Button, Paper, IconButton, CircularProgress,
  Container, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, Tooltip, Chip,
} from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import AuthContext from '../context/AuthContext';
import { usePlan } from '../context/planContext';
import { TrialExpiredBanner } from '../components/plan';
import { getRoles, createRol, updateRol, deleteRol } from '../services/rolService';

/**
 * Todos los módulos posibles en el sistema.
 * - dashboard_global y empresas: solo para empresa SuperAdmin.
 * - Los demás se filtran según el plan activo de la empresa.
 */
const TODOS_LOS_MODULOS = [
  { key: 'dashboard',       label: 'Dashboard',              permisos: ['ver'],                              soloSuperAdmin: false },
  { key: 'clientes',        label: 'Clientes',               permisos: ['crear', 'ver', 'editar', 'eliminar'], soloSuperAdmin: false },
  { key: 'productos',       label: 'Productos',              permisos: ['crear', 'ver', 'editar', 'eliminar'], soloSuperAdmin: false },
  { key: 'ventas',          label: 'Ventas',                 permisos: ['crear', 'ver', 'editar', 'eliminar'], soloSuperAdmin: false },
  { key: 'eventos',         label: 'Cronograma de eventos',  permisos: ['crear', 'ver', 'editar', 'eliminar'], soloSuperAdmin: false },
  { key: 'eventosPremium',  label: 'Eventos Premium',        permisos: ['crear', 'ver', 'editar', 'eliminar'], soloSuperAdmin: false, planModule: 'eventosPremium' },
  { key: 'consecutivos',    label: 'Consecutivos',           permisos: ['crear', 'ver', 'editar', 'eliminar'], soloSuperAdmin: false },
  { key: 'cotizaciones',    label: 'Cotizaciones',           permisos: ['crear', 'ver', 'editar', 'eliminar'], soloSuperAdmin: false },
  { key: 'disponibilidad',  label: 'Disponibilidad',         permisos: ['ver'],                              soloSuperAdmin: false },
  { key: 'configuracion',   label: 'Configuración',          permisos: ['ver', 'editar'],                    soloSuperAdmin: false, planModule: 'configuracion' },
  { key: 'usuarios',        label: 'Usuarios',               permisos: ['crear', 'ver', 'editar', 'eliminar'], soloSuperAdmin: false },
  { key: 'roles',           label: 'Roles',                  permisos: ['crear', 'ver', 'editar', 'eliminar'], soloSuperAdmin: false },
  // ── Solo empresa SuperAdmin ─────────────────────────────────────────────
  { key: 'dashboard_global', label: 'Dashboard Global',      permisos: ['ver'],                              soloSuperAdmin: true },
  { key: 'empresas',         label: 'Empresas',              permisos: ['ver'],                              soloSuperAdmin: true },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildPermisosDefault = (modulos) => {
  const base = {};
  modulos.forEach((m) => {
    base[m.key] = { crear: false, ver: false, editar: false, eliminar: false };
  });
  return base;
};

const normalizarPermisosUI = (input, modulos) => {
  const base = buildPermisosDefault(modulos);
  if (!input || typeof input !== 'object') return base;
  modulos.forEach((m) => {
    const v = input[m.key];
    if (!v || typeof v !== 'object') return;
    base[m.key] = {
      crear:    v.crear    === true,
      ver:      v.ver      === true,
      editar:   v.editar   === true,
      eliminar: v.eliminar === true,
    };
  });
  return base;
};

// ─── Componente ──────────────────────────────────────────────────────────────

const Roles = () => {
  const { user }    = useContext(AuthContext);
  const { canAccessModule, planInfo, isReadOnlyMode } = usePlan();
  const readOnly = isReadOnlyMode();

  const isSuperAdmin = user?.rol === 'superadmin';

  /**
   * Filtra los módulos según el contexto:
   * - SuperAdmin: ve todos.
   * - Otras empresas: nunca ven dashboard_global ni empresas.
   *   Además, los módulos bloqueados por plan se muestran deshabilitados.
   */
  const MODULOS_PERMISOS = TODOS_LOS_MODULOS.filter((m) => {
    if (m.soloSuperAdmin) return isSuperAdmin;
    return true;
  });

  /**
   * Determina si un módulo está bloqueado por el plan actual.
   * SuperAdmin nunca tiene módulos bloqueados.
   */
  const isModuloBlockedByPlan = (modulo) => {
    if (isSuperAdmin) return false;
    if (!modulo.planModule) return false; // sin restricción de plan definida
    return !canAccessModule(modulo.planModule);
  };

  const userRol = user?.rol;
  const [roles,       setRoles]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const hasLoadedRoles = useRef(false);
  const [openModal,   setOpenModal]   = useState(false);
  const [editingRol,  setEditingRol]  = useState(null);
  const [formData,    setFormData]    = useState({
    nombre: '',
    descripcion: '',
    activo: true,
    permisos: buildPermisosDefault(MODULOS_PERMISOS),
  });

  useEffect(() => {
    const tieneAcceso = userRol === 'admin' || userRol === 'superadmin' ||
      user?.esAdminPrincipal ||
      user?.rol_id?.permisos?.roles?.ver === true ||
      user?.permisos?.roles?.ver === true;
    if (!userRol || !tieneAcceso) {
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
        nombre:      rol.nombre,
        descripcion: rol.descripcion || '',
        activo:      rol.activo,
        permisos:    normalizarPermisosUI(rol.permisos, MODULOS_PERMISOS),
      });
    } else {
      setEditingRol(null);
      setFormData({
        nombre: '', descripcion: '', activo: true,
        permisos: buildPermisosDefault(MODULOS_PERMISOS),
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => setOpenModal(false);

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
          ...(prev.permisos?.[modulo] || { crear: false, ver: false, editar: false, eliminar: false }),
          [accion]: !(prev.permisos?.[modulo]?.[accion] === true),
        },
      },
    }));
  };

  const handleToggleModuloCompleto = (moduloKey) => {
    const moduloConfig = MODULOS_PERMISOS.find((m) => m.key === moduloKey);
    if (!moduloConfig) return;

    const currentPermisos = formData.permisos[moduloKey] || {};
    const allActive = moduloConfig.permisos.every((accion) => currentPermisos[accion] === true);

    const newPermisos = { crear: false, ver: false, editar: false, eliminar: false };
    moduloConfig.permisos.forEach((accion) => { newPermisos[accion] = !allActive; });

    setFormData((prev) => ({
      ...prev,
      permisos: { ...prev.permisos, [moduloKey]: newPermisos },
    }));
  };

  const handleSubmit = async () => {
    try {
      const nombreTrim = formData.nombre.trim();
      if (!nombreTrim) { toast.error('El nombre del rol es obligatorio'); return; }
      if (nombreTrim.length > 50) { toast.error('El nombre del rol no puede superar 50 caracteres'); return; }

      const descripcionTrim = formData.descripcion.trim();
      if (descripcionTrim.length > 200) { toast.error('La descripción no puede superar 200 caracteres'); return; }

      const payload = {
        nombre:      nombreTrim,
        descripcion: descripcionTrim,
        activo:      formData.activo,
        permisos:    formData.permisos,
      };

      if (editingRol) {
        const actualizado = await updateRol(editingRol._id, payload);
        setRoles((prev) => prev.map((r) => (r._id === actualizado._id ? actualizado : r)));
        toast.success('Rol actualizado');
      } else {
        const creado = await createRol(payload);
        setRoles((prev) => [...prev, creado]);
        toast.success('Rol creado');
      }

      setOpenModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar el rol');
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
    }
  };

  const puedeGestionarRoles =
    user?.rol === 'admin' || user?.rol === 'superadmin' ||
    user?.esAdminPrincipal ||
    user?.rol_id?.permisos?.roles?.ver === true ||
    user?.permisos?.roles?.ver === true;

  // Permisos granulares — determinan visibilidad de cada botón de acción
  const esAdminTotal = user?.rol === 'admin' || user?.rol === 'superadmin' || user?.esAdminPrincipal;
  const puedeCrearRol   = esAdminTotal || user?.rol_id?.permisos?.roles?.crear   === true || user?.permisos?.roles?.crear   === true;
  const puedeEditarRol  = esAdminTotal || user?.rol_id?.permisos?.roles?.editar  === true || user?.permisos?.roles?.editar  === true;
  const puedeEliminarRol = esAdminTotal || user?.rol_id?.permisos?.roles?.eliminar === true || user?.permisos?.roles?.eliminar === true;

  if (!user || !puedeGestionarRoles) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">No tienes permisos para gestionar roles.</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3 }}>
        {/* Banner de trial expirado — modo solo lectura */}
        <TrialExpiredBanner />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Roles</Typography>
          {!readOnly && puedeCrearRol && (
            <Tooltip title="Crear un nuevo rol para esta empresa">
              <Button variant="contained" startIcon={<FaPlus />} onClick={() => handleOpenModal(null)}>
                Nuevo rol
              </Button>
            </Tooltip>
          )}
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
                    <TableCell>Descripción</TableCell>
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
                          <FaUserTag /> {r.nombre}
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
                          <Chip label="Predeterminado" color="primary" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {!readOnly && puedeEditarRol && (
                          <Tooltip title="Editar rol y permisos">
                            <IconButton color="primary" onClick={() => handleOpenModal(r)} sx={{ mr: 1 }}>
                              <FaEdit />
                            </IconButton>
                          </Tooltip>
                        )}
                        {!readOnly && puedeEliminarRol && (
                          <Tooltip title={r.esPredeterminado ? 'No se puede eliminar un rol predeterminado' : 'Eliminar rol'}>
                            <span>
                              <IconButton color="error" onClick={() => handleDelete(r._id)} disabled={r.esPredeterminado}>
                                <FaTrash />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {roles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No hay roles registrados.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* ── Modal de creación / edición ────────────────────────────────── */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>{editingRol ? 'Editar rol' : 'Nuevo rol'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal" required fullWidth
            id="nombre" label="Nombre del rol" name="nombre"
            value={formData.nombre} onChange={handleChange}
            variant="outlined" inputProps={{ maxLength: 50 }}
          />

          <TextField
            margin="normal" fullWidth
            name="descripcion" label="Descripción"
            value={formData.descripcion} onChange={handleChange}
            variant="outlined" multiline rows={2}
            inputProps={{ maxLength: 200 }}
          />

          <FormControlLabel
            control={<Switch checked={formData.activo} onChange={handleToggleActivo} color="primary" />}
            label={formData.activo ? 'Activo' : 'Inactivo'}
            sx={{ mt: 1 }}
          />

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Permisos por módulo</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              C = Crear · V = Ver · E = Editar · D = Eliminar. Haz clic en el nombre del módulo para activar/desactivar todos sus permisos.
            </Typography>

            {MODULOS_PERMISOS.map((m) => {
              const moduloPermisos = formData.permisos[m.key] || {};
              const allActive      = m.permisos.every((accion) => moduloPermisos[accion] === true);
              const blockedByPlan  = isModuloBlockedByPlan(m);

              // Nombre del plan que bloquea este módulo (para el tooltip)
              const blockTooltip = blockedByPlan
                ? `Este módulo no está incluido en tu plan actual. Mejora tu plan para poder asignar permisos sobre él.`
                : null;

              return (
                <Tooltip
                  key={m.key}
                  title={blockTooltip || ''}
                  placement="left"
                  disableHoverListener={!blockedByPlan}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      border: '1px solid',
                      borderColor: blockedByPlan ? 'grey.300' : 'divider',
                      borderRadius: 1,
                      px: 1.5,
                      py: 1,
                      mb: 1,
                      bgcolor: blockedByPlan ? 'action.disabledBackground' : 'transparent',
                      opacity: blockedByPlan ? 0.55 : 1,
                    }}
                  >
                    {/* Nombre del módulo — clic para toggle (deshabilitado si bloqueado por plan) */}
                    <Tooltip title={blockedByPlan ? '' : 'Clic para activar/desactivar todos los permisos de este módulo'}>
                      <Typography
                        variant="body2"
                        onClick={() => !blockedByPlan && handleToggleModuloCompleto(m.key)}
                        sx={{
                          minWidth: 170,
                          cursor: blockedByPlan ? 'not-allowed' : 'pointer',
                          fontWeight: allActive && !blockedByPlan ? 600 : 400,
                          color: blockedByPlan ? 'text.disabled' : allActive ? 'primary.main' : 'text.primary',
                          '&:hover': !blockedByPlan ? { textDecoration: 'underline' } : {},
                        }}
                      >
                        {m.label}
                      </Typography>
                    </Tooltip>

                    {/* Checkboxes de permisos */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {['crear', 'ver', 'editar', 'eliminar'].map((accion) => {
                        if (!m.permisos.includes(accion)) return null;
                        const label = { crear: 'C', ver: 'V', editar: 'E', eliminar: 'D' }[accion];
                        const title = { crear: 'Crear', ver: 'Ver', editar: 'Editar', eliminar: 'Eliminar' }[accion];
                        return (
                          <Tooltip title={blockedByPlan ? `No disponible en tu plan` : title} key={accion}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={formData.permisos?.[m.key]?.[accion] === true}
                                  onChange={() => handlePermisoToggle(m.key, accion)}
                                  disabled={blockedByPlan}
                                />
                              }
                              label={label}
                              sx={{ m: 0 }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Roles;