import { useContext, useEffect, useRef, useState } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUser,
  FaUserTie,
  FaUserShield,
  FaUserCog,
  FaUserSecret,
  FaUserNinja,
  FaUserAstronaut,
  FaUserGraduate,
  FaUserMd,
  FaUserTag,
  FaUserFriends,
  FaUserClock,
  FaUserCheck,
  FaUserEdit,
  FaUserPlus,
  FaUserMinus,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Chip,
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AuthContext from '../context/AuthContext';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../services/usuarioService';
import { getRoles } from '../services/rolService';
import api from '../services/api';

const INDICATIVOS_COMUNES = ['+57', '+1', '+52', '+34', '+51', '+54', '+56', '+58'];
const ICONOS_USUARIO = [
  { value: 'user', label: 'Usuario', Icon: FaUser },
  { value: 'userTie', label: 'Admin', Icon: FaUserTie },
  { value: 'userShield', label: 'Superadmin', Icon: FaUserShield },
  { value: 'userCog', label: 'Operador', Icon: FaUserCog },
  { value: 'userSecret', label: 'Secreto', Icon: FaUserSecret },
  { value: 'userNinja', label: 'Ninja', Icon: FaUserNinja },
  { value: 'userAstronaut', label: 'Astronauta', Icon: FaUserAstronaut },
  { value: 'userGraduate', label: 'Graduado', Icon: FaUserGraduate },
  { value: 'userMd', label: 'Medico', Icon: FaUserMd },
  { value: 'userTag', label: 'Etiqueta', Icon: FaUserTag },
  { value: 'userFriends', label: 'Equipo', Icon: FaUserFriends },
  { value: 'userClock', label: 'Tiempo', Icon: FaUserClock },
  { value: 'userCheck', label: 'Verificado', Icon: FaUserCheck },
  { value: 'userEdit', label: 'Editor', Icon: FaUserEdit },
  { value: 'userPlus', label: 'Nuevo', Icon: FaUserPlus },
  { value: 'userMinus', label: 'Baja', Icon: FaUserMinus },
];

const getIconoPorRol = (rol) => {
  if (rol === 'superadmin') return 'userShield';
  if (rol === 'admin') return 'userTie';
  if (rol === 'operador') return 'userCog';
  return 'user';
};

const validarPassword = (password) => {
  const raw = String(password ?? '');
  if (raw !== raw.trim()) {
    return 'La contrasena no puede contener espacios';
  }
  if (/\s/.test(raw)) {
    return 'La contrasena no puede contener espacios';
  }
  if (raw.length < 8 || raw.length > 20) {
    return 'La contrasena debe tener entre 8 y 20 caracteres';
  }
  if (!/[A-Z]/.test(raw)) {
    return 'La contrasena debe incluir al menos 1 mayuscula';
  }
  if (!/[0-9]/.test(raw)) {
    return 'La contrasena debe incluir al menos 1 numero';
  }
  if (!/[^A-Za-z0-9]/.test(raw)) {
    return 'La contrasena debe incluir al menos 1 caracter especial';
  }
  return null;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Usuarios = () => {
  const { user } = useContext(AuthContext);
  const userId = user?._id;
  const userEmpresaId = user?.empresaId;
  const userRol = user?.rol;
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedUsuarios = useRef(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [checkingNombreUsuario, setCheckingNombreUsuario] = useState(false);
  const [nombreUsuarioDisponible, setNombreUsuarioDisponible] = useState(null);
  const [iconTouched, setIconTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombreUsuario: '',
    password: '',
    confirmPassword: '',
    rol: 'operador',
    rol_id: '',
    estado: true,
    esAdminPrincipal: false,
    email: '',
    emailConfirm: '',
    indicativoSelect: '+57',
    indicativoCustom: '',
    telefono: '',
    icono: 'userCog',
  });

  useEffect(() => {
    if (!userRol || (userRol !== 'admin' && userRol !== 'superadmin')) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const showLoading = !hasLoadedUsuarios.current;
      try {
        if (showLoading) setLoading(true);
        const [usuariosData, rolesData] = await Promise.all([
          getUsuarios(),
          getRoles(),
        ]);
        setUsuarios(usuariosData);
        setRoles(rolesData.filter((r) => r.activo)); // Solo mostrar roles activos
        hasLoadedUsuarios.current = true;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al cargar los datos');
        console.error('Error al cargar datos:', error);
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchData();
  }, [userId, userEmpresaId, userRol]);

  const handleOpenModal = (usuario = null) => {
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (usuario) {
      const indicativoUsuario = usuario.indicativo || '+57';
      const indicativoEsComun = INDICATIVOS_COMUNES.includes(indicativoUsuario);
      setEditingUsuario(usuario);
      setFormData({
        nombreUsuario: usuario.nombreUsuario,
        password: '',
        confirmPassword: '',
        rol: usuario.rol,
        rol_id: usuario.rol_id?._id || usuario.rol_id || '',
        estado: usuario.estado,
        esAdminPrincipal: !!usuario.esAdminPrincipal,
        email: usuario.email || '',
        emailConfirm: usuario.email || '',
        indicativoSelect: indicativoEsComun ? indicativoUsuario : 'custom',
        indicativoCustom: indicativoEsComun ? '' : indicativoUsuario,
        telefono: usuario.telefono || '',
        icono: usuario.icono || getIconoPorRol(usuario.rol),
      });
    } else {
      setEditingUsuario(null);
      // Buscar el rol de Operador por defecto
      const rolOperador = roles.find((r) => r.nombre.toLowerCase() === 'operador');
      setFormData({
        nombreUsuario: '',
        password: '',
        confirmPassword: '',
        rol: 'operador',
        rol_id: rolOperador?._id || '',
        estado: true,
        esAdminPrincipal: false,
        email: '',
        emailConfirm: '',
        indicativoSelect: '+57',
        indicativoCustom: '',
        telefono: '',
        icono: 'userCog',
      });
    }
    setCheckingNombreUsuario(false);
    setNombreUsuarioDisponible(null);
    setIconTouched(false);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCheckingNombreUsuario(false);
    setNombreUsuarioDisponible(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'icono') {
      setIconTouched(true);
    }
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'rol' && !iconTouched) {
        next.icono = getIconoPorRol(value);
      }
      if (name === 'indicativoSelect' && value !== 'custom') {
        next.indicativoCustom = '';
      }
      return next;
    });
  };

  const handleSelectIcon = (value) => {
    setIconTouched(true);
    setFormData((prev) => ({ ...prev, icono: value }));
  };

  const handleToggleEstado = (e) => {
    setFormData((prev) => ({ ...prev, estado: e.target.checked }));
  };

  const handleSubmit = async () => {
    try {
      const nombreUsuarioTrim = formData.nombreUsuario.trim();
      if (!nombreUsuarioTrim || (!editingUsuario && !formData.password)) {
        toast.error('Usuario y contrasena son obligatorios para nuevos usuarios');
        return;
      }

      if (nombreUsuarioTrim.length > 50) {
        toast.error('El nombre de usuario no puede superar 50 caracteres');
        return;
      }

      if (nombreUsuarioDisponible === false) {
        toast.error('El nombre de usuario no esta disponible');
        return;
      }

      const emailTrim = formData.email.trim().toLowerCase();
      const emailConfirmTrim = formData.emailConfirm.trim().toLowerCase();

      if ((emailTrim || emailConfirmTrim) && emailTrim !== emailConfirmTrim) {
        toast.error('El correo y la confirmacion de correo deben coincidir');
        return;
      }

      if (emailTrim && emailTrim.length > 254) {
        toast.error('El correo no puede superar 254 caracteres');
        return;
      }

      if (emailTrim && !emailRegex.test(emailTrim)) {
        toast.error('Correo electronico invalido');
        return;
      }

      const telefonoTrim = formData.telefono.trim();
      if (telefonoTrim && telefonoTrim.length > 15) {
        toast.error('El telefono no puede superar 15 caracteres');
        return;
      }

      const indicativoFinal =
        formData.indicativoSelect === 'custom'
          ? formData.indicativoCustom.trim()
          : formData.indicativoSelect;

      if (!indicativoFinal) {
        toast.error('Debe seleccionar o ingresar un indicativo');
        return;
      }

      if (formData.password) {
        const passwordError = validarPassword(formData.password);
        if (passwordError) {
          toast.error(passwordError);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error('Las contrasenas no coinciden');
          return;
        }
      }

      const payload = {
        nombreUsuario: nombreUsuarioTrim,
        rol: formData.rol,
        rol_id: formData.rol_id || null,
        estado: formData.estado,
        email: emailTrim || undefined,
        telefono: telefonoTrim || undefined,
        indicativo: indicativoFinal,
        icono: formData.icono || undefined,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUsuario) {
        const actualizado = await updateUsuario(editingUsuario._id, payload);
        setUsuarios((prev) =>
          prev.map((u) => (u._id === actualizado._id ? actualizado : u))
        );
        toast.success('Usuario actualizado');
      } else {
        const creado = await createUsuario(payload);
        setUsuarios((prev) => [...prev, creado]);
        toast.success('Usuario creado');
      }

      setOpenModal(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Error al guardar el usuario'
      );
      console.error('Error al guardar usuario:', error);
    }
  };

  useEffect(() => {
    if (!openModal) return;
    const nombre = formData.nombreUsuario.trim();
    if (!nombre) {
      setNombreUsuarioDisponible(null);
      setCheckingNombreUsuario(false);
      return;
    }
    if (nombre.length > 50) {
      setNombreUsuarioDisponible(false);
      setCheckingNombreUsuario(false);
      return;
    }
    if (
      editingUsuario &&
      (editingUsuario.nombreUsuario || '').toLowerCase() === nombre.toLowerCase()
    ) {
      setNombreUsuarioDisponible(true);
      setCheckingNombreUsuario(false);
      return;
    }

    let isActive = true;
    setCheckingNombreUsuario(true);
    const id = setTimeout(async () => {
      try {
        const response = await api.get('/auth/disponibilidad/usuario', {
          params: { nombreUsuario: nombre },
        });
        if (!isActive) return;
        setNombreUsuarioDisponible(!!response.data?.disponible);
      } catch {
        if (isActive) setNombreUsuarioDisponible(null);
      } finally {
        if (isActive) setCheckingNombreUsuario(false);
      }
    }, 450);

    return () => {
      isActive = false;
      clearTimeout(id);
    };
  }, [formData.nombreUsuario, editingUsuario, openModal]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que desea desactivar este usuario?')) return;

    try {
      const actualizado = await deleteUsuario(id);
      setUsuarios((prev) =>
        prev.map((u) => (u._id === actualizado._id ? actualizado : u))
      );
      toast.success('Usuario desactivado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al desactivar el usuario');
      console.error('Error al desactivar usuario:', error);
    }
  };

  // Helper para obtener el nombre del rol asignado
  const getRolNombre = (usuario) => {
    if (usuario.rol_id && typeof usuario.rol_id === 'object') {
      return usuario.rol_id.nombre;
    }
    // Fallback al campo rol legacy
    return usuario.rol;
  };

  if (!user || (user.rol !== 'admin' && user.rol !== 'superadmin')) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">
            Solo los administradores pueden gestionar usuarios.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Usuarios</Typography>
          <Tooltip title="Crear un nuevo usuario para esta empresa">
            <Button
              variant="contained"
              startIcon={<FaPlus />}
              onClick={() => handleOpenModal(null)}
            >
              Nuevo usuario
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
                    <TableCell>Usuario</TableCell>
                    <TableCell>Rol asignado</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usuarios.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>{u.nombreUsuario}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRolNombre(u)}
                          {u.esAdminPrincipal && (
                            <Chip
                              label="Principal"
                              color="primary"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.estado ? 'Activo' : 'Inactivo'}
                          color={u.estado ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip
                          title={
                            u.esAdminPrincipal
                              ? 'Editar datos del administrador principal (rol y estado bloqueados)'
                              : 'Editar datos y rol del usuario'
                          }
                        >
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenModal(u)}
                            sx={{ mr: 1 }}
                          >
                            <FaEdit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            u.esAdminPrincipal
                              ? 'No se puede desactivar el administrador principal'
                              : 'Desactivar usuario (no se eliminara definitivamente)'
                          }
                        >
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(u._id)}
                              disabled={u.esAdminPrincipal}
                            >
                              <FaTrash />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {usuarios.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No hay usuarios registrados.
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
        <DialogTitle>{editingUsuario ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            required
            fullWidth
            id="nombreUsuario"
            label="Usuario"
            name="nombreUsuario"
            value={formData.nombreUsuario}
            onChange={handleChange}
            variant="outlined"
            inputProps={{ maxLength: 50 }}
            error={nombreUsuarioDisponible === false}
            helperText={
              checkingNombreUsuario
                ? 'Verificando disponibilidad...'
                : nombreUsuarioDisponible === false
                  ? 'No disponible'
                  : nombreUsuarioDisponible === true
                    ? 'Disponible'
                    : ''
            }
          />

          <TextField
            margin="normal"
            fullWidth
            name="email"
            label="Correo"
            type="email"
            value={formData.email}
            onChange={handleChange}
            variant="outlined"
            inputProps={{ maxLength: 254 }}
          />
          <TextField
            margin="normal"
            fullWidth
            name="emailConfirm"
            label="Confirmar correo"
            type="email"
            value={formData.emailConfirm}
            onChange={handleChange}
            variant="outlined"
            inputProps={{ maxLength: 254 }}
            error={
              (formData.email.trim() || formData.emailConfirm.trim()) &&
              formData.email.trim().toLowerCase() !==
              formData.emailConfirm.trim().toLowerCase()
            }
            helperText={
              (formData.email.trim() || formData.emailConfirm.trim()) &&
                formData.email.trim().toLowerCase() !==
                formData.emailConfirm.trim().toLowerCase()
                ? 'Debe coincidir con el correo'
                : ''
            }
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <FormControl margin="normal" sx={{ minWidth: 160 }}>
              <InputLabel id="indicativo-label">Indicativo</InputLabel>
              <Select
                labelId="indicativo-label"
                id="indicativoSelect"
                name="indicativoSelect"
                value={formData.indicativoSelect}
                label="Indicativo"
                onChange={handleChange}
              >
                {INDICATIVOS_COMUNES.map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
                <MenuItem value="custom">Personalizado</MenuItem>
              </Select>
            </FormControl>

            {formData.indicativoSelect === 'custom' && (
              <TextField
                margin="normal"
                name="indicativoCustom"
                label="Indicativo personalizado"
                value={formData.indicativoCustom}
                onChange={handleChange}
                variant="outlined"
                inputProps={{ maxLength: 6 }}
                sx={{ flex: 1 }}
              />
            )}
          </Box>

          <TextField
            margin="normal"
            fullWidth
            name="telefono"
            label="Telefono"
            value={formData.telefono}
            onChange={handleChange}
            variant="outlined"
            inputProps={{ maxLength: 15 }}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Icono
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
                gap: 1,
                mt: 1,
              }}
            >
              {ICONOS_USUARIO.map((opt) => {
                const selected = formData.icono === opt.value;
                const Icon = opt.Icon;
                return (
                  <Tooltip title={opt.label} key={opt.value}>
                    <IconButton
                      aria-label={opt.label}
                      onClick={() => handleSelectIcon(opt.value)}
                      sx={{
                        borderRadius: 1,
                        border: selected ? '2px solid' : '1px solid',
                        borderColor: selected ? 'primary.main' : 'divider',
                        backgroundColor: selected ? 'action.selected' : 'transparent',
                      }}
                    >
                      <Icon size={20} />
                    </IconButton>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>

          <TextField
            margin="normal"
            fullWidth
            name="password"
            label={editingUsuario ? 'Contrasena (dejar en blanco para no cambiar)' : 'Contrasena'}
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={formData.password}
            onChange={handleChange}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Ver contrasena'}
                    onClick={() => setShowPassword((p) => !p)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {formData.password.length > 0 && (
            <TextField
              margin="normal"
              fullWidth
              name="confirmPassword"
              label="Confirmar contrasena"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              variant="outlined"
              error={
                formData.confirmPassword.length > 0 &&
                formData.confirmPassword !== formData.password
              }
              helperText={
                formData.confirmPassword.length > 0 &&
                  formData.confirmPassword !== formData.password
                  ? 'Las contrasenas no coinciden'
                  : ''
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showConfirmPassword ? 'Ocultar contrasena' : 'Ver contrasena'}
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {(!editingUsuario || formData.password) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip
                size="small"
                label="8-20 caracteres"
                color={
                  formData.password.length >= 8 && formData.password.length <= 20
                    ? 'success'
                    : 'default'
                }
                variant="outlined"
              />
              <Chip
                size="small"
                label="1 mayuscula"
                color={/[A-Z]/.test(formData.password) ? 'success' : 'default'}
                variant="outlined"
              />
              <Chip
                size="small"
                label="1 numero"
                color={/[0-9]/.test(formData.password) ? 'success' : 'default'}
                variant="outlined"
              />
              <Chip
                size="small"
                label="1 especial"
                color={
                  /[^A-Za-z0-9]/.test(formData.password) ? 'success' : 'default'
                }
                variant="outlined"
              />
              <Chip
                size="small"
                label="sin espacios"
                color={/\s/.test(formData.password) ? 'default' : 'success'}
                variant="outlined"
              />
            </Box>
          )}

          {/* Rol Asignado - nuevo campo que apunta a la coleccion de Roles */}
          <FormControl
            margin="normal"
            fullWidth
            disabled={formData.esAdminPrincipal}
          >
            <InputLabel id="rol-id-label">Rol asignado</InputLabel>
            <Select
              labelId="rol-id-label"
              id="rol_id"
              name="rol_id"
              value={formData.rol_id}
              label="Rol asignado"
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>Sin rol asignado</em>
              </MenuItem>
              {roles.map((r) => (
                <MenuItem key={r._id} value={r._id}>
                  {r.nombre}
                  {r.descripcion && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 1, color: 'text.secondary' }}
                    >
                      - {r.descripcion}
                    </Typography>
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Rol legacy - solo visible para superadmin */}
          {user?.rol === 'superadmin' && (
            <FormControl
              margin="normal"
              fullWidth
              disabled={formData.esAdminPrincipal}
            >
              <InputLabel id="rol-label">Rol del sistema (legacy)</InputLabel>
              <Select
                labelId="rol-label"
                id="rol"
                name="rol"
                value={formData.rol}
                label="Rol del sistema (legacy)"
                onChange={handleChange}
              >
                <MenuItem value="superadmin">Superadmin</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="operador">Operador</MenuItem>
                <MenuItem value="usuario">Usuario</MenuItem>
              </Select>
            </FormControl>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={formData.estado}
                onChange={handleToggleEstado}
                color="primary"
                disabled={formData.esAdminPrincipal}
              />
            }
            label={formData.estado ? 'Activo' : 'Inactivo'}
            sx={{ mt: 1 }}
          />
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

export default Usuarios;
