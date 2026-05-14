import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const DOCUMENTO_EMPRESA = {
  NIT: { label: 'NIT', maxLength: 20 },
  RUT: { label: 'RUT', maxLength: 12 },
};

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    documentoTipo: 'NIT',
    documentoNumero: '',
    direccion: '',
    telefono: '',
    email: '',
    confirmEmail: '',
    adminTelefono: '',
    adminEmail: '',
    adminConfirmEmail: '',
    plan: 'free',
    nombreUsuario: '',
    password: '',
    confirmPassword: '',
  });

  const {
    nombre,
    documentoTipo,
    documentoNumero,
    direccion,
    telefono,
    email,
    confirmEmail,
    adminTelefono,
    adminEmail,
    adminConfirmEmail,
    plan,
    nombreUsuario,
    password,
    confirmPassword,
  } = formData;
  const { register, isAuthenticated, error, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [empresaNombreStatus, setEmpresaNombreStatus] = useState('idle');
  const [usuarioNombreStatus, setUsuarioNombreStatus] = useState('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === 'documentoTipo') {
      const cfg = DOCUMENTO_EMPRESA[value] || DOCUMENTO_EMPRESA.NIT;
      setFormData((prev) => ({
        ...prev,
        documentoTipo: value,
        documentoNumero: String(prev.documentoNumero || '').slice(0, cfg.maxLength),
      }));
      return;
    }
    if (name === 'documentoNumero') {
      const cfg = DOCUMENTO_EMPRESA[documentoTipo] || DOCUMENTO_EMPRESA.NIT;
      setFormData((prev) => ({
        ...prev,
        documentoNumero: String(value || '').slice(0, cfg.maxLength),
      }));
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    const value = nombre.trim();
    if (value.length < 3) {
      setEmpresaNombreStatus('idle');
      return;
    }

    setEmpresaNombreStatus('checking');
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/auth/disponibilidad/empresa', {
          params: { nombre: value },
        });
        setEmpresaNombreStatus(res.data?.disponible ? 'available' : 'taken');
      } catch {
        setEmpresaNombreStatus('idle');
      }
    }, 450);

    return () => clearTimeout(t);
  }, [nombre]);

  useEffect(() => {
    const value = nombreUsuario.trim();
    if (value.length < 3) {
      setUsuarioNombreStatus('idle');
      return;
    }

    setUsuarioNombreStatus('checking');
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/auth/disponibilidad/usuario', {
          params: { nombreUsuario: value },
        });
        setUsuarioNombreStatus(res.data?.disponible ? 'available' : 'taken');
      } catch {
        setUsuarioNombreStatus('idle');
      }
    }, 450);

    return () => clearTimeout(t);
  }, [nombreUsuario]);

  const validarPassword = (value) => {
    const raw = String(value ?? '');
    if (raw !== raw.trim()) {
      return 'La contraseña no puede contener espacios';
    }
    if (/\s/.test(raw)) {
      return 'La contraseña no puede contener espacios';
    }
    if (raw.length < 8 || raw.length > 20) {
      return 'La contraseña debe tener entre 8 y 20 caracteres';
    }
    if (!/[A-Z]/.test(raw)) {
      return 'La contraseña debe incluir al menos 1 mayúscula';
    }
    if (!/[0-9]/.test(raw)) {
      return 'La contraseña debe incluir al menos 1 número';
    }
    if (!/[^A-Za-z0-9]/.test(raw)) {
      return 'La contraseña debe incluir al menos 1 carácter especial';
    }
    return null;
  };

  const passwordOk = !validarPassword(password);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (
      !nombre ||
      !direccion ||
      !telefono ||
      !email ||
      !nombreUsuario ||
      !password ||
      !adminTelefono ||
      !adminEmail
    ) {
      toast.error('Por favor complete los campos obligatorios (NIT/RUT es opcional)');
      return;
    }

    if (email.trim().length > 254 || confirmEmail.trim().length > 254) {
      toast.error('El correo no puede superar 254 caracteres');
      return;
    }

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      toast.error('Los correos no coinciden');
      return;
    }

    if (adminEmail.trim().length > 254 || adminConfirmEmail.trim().length > 254) {
      toast.error('El correo del usuario no puede superar 254 caracteres');
      return;
    }

    if (adminEmail.trim().toLowerCase() !== adminConfirmEmail.trim().toLowerCase()) {
      toast.error('Los correos del usuario no coinciden');
      return;
    }

    if (adminTelefono.trim().length > 15) {
      toast.error('El teléfono del usuario no puede superar 15 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    const passwordError = validarPassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (empresaNombreStatus === 'taken') {
      toast.error('Nombre de empresa no disponible');
      return;
    }

    if (usuarioNombreStatus === 'taken') {
      toast.error('Nombre de usuario no disponible');
      return;
    }

    const payload = {
      nombre,
      tipoDocumento: documentoTipo,
      nit: documentoNumero,
      direccion,
      telefono,
      email,
      adminTelefono,
      adminEmail,
      adminConfirmEmail,
      plan,
      nombreUsuario,
      password,
    };

    const ok = await register(payload);
    if (ok) {
      toast.success('Empresa registrada correctamente');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Tooltip title="Volver a iniciar sesión">
              <IconButton onClick={() => navigate('/login')} size="small">
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
              NExt Event
            </Typography>
            <Typography component="h2" variant="h6" sx={{ mb: 3 }}>
              Crear empresa y usuario administrador
            </Typography>
          </Box>

          <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Datos de la empresa
            </Typography>

            <TextField
              margin="normal"
              required
              fullWidth
              id="nombre"
              label="Nombre de la empresa"
              name="nombre"
              value={nombre}
              onChange={onChange}
              variant="outlined"
              inputProps={{ maxLength: 150 }}
              error={empresaNombreStatus === 'taken'}
              helperText={
                empresaNombreStatus === 'checking'
                  ? 'Validando nombre...'
                  : empresaNombreStatus === 'taken'
                    ? 'Nombre de empresa no disponible'
                    : empresaNombreStatus === 'available'
                      ? 'Nombre disponible'
                      : ''
              }
            />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 160, flexGrow: 0 }} margin="normal">
                <InputLabel>Documento</InputLabel>
                <Select
                  name="documentoTipo"
                  label="Documento"
                  value={documentoTipo}
                  onChange={onChange}
                >
                  <MenuItem value="NIT">NIT</MenuItem>
                  <MenuItem value="RUT">RUT</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="normal"
                fullWidth
                id="documentoNumero"
                label={`Número de ${DOCUMENTO_EMPRESA[documentoTipo]?.label || 'documento'} (opcional)`}
                name="documentoNumero"
                value={documentoNumero}
                onChange={onChange}
                variant="outlined"
                inputProps={{
                  maxLength: DOCUMENTO_EMPRESA[documentoTipo]?.maxLength || 20,
                }}
                helperText={`Máx ${DOCUMENTO_EMPRESA[documentoTipo]?.maxLength || 20} caracteres`}
              />
            </Box>
            <TextField
              margin="normal"
              required
              fullWidth
              id="direccion"
              label="Dirección"
              name="direccion"
              value={direccion}
              onChange={onChange}
              variant="outlined"
              inputProps={{ maxLength: 200 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="telefono"
              label="Teléfono"
              name="telefono"
              value={telefono}
              onChange={onChange}
              variant="outlined"
              inputProps={{ maxLength: 15 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo electrónico"
              name="email"
              type="email"
              value={email}
              onChange={onChange}
              variant="outlined"
              inputProps={{ maxLength: 254 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="confirmEmail"
              label="Confirmar correo electrónico"
              name="confirmEmail"
              type="email"
              value={confirmEmail}
              onChange={onChange}
              variant="outlined"
              inputProps={{ maxLength: 254 }}
              error={
                confirmEmail.length > 0 &&
                email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()
              }
              helperText={
                confirmEmail.length > 0 &&
                email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()
                  ? 'Los correos no coinciden'
                  : ''
              }
            />
            <FormControl margin="normal" fullWidth required>
              <InputLabel id="plan-label">Plan</InputLabel>
              <Select
                labelId="plan-label"
                id="plan"
                label="Plan"
                name="plan"
                value={plan}
                onChange={onChange}
              >
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Usuario administrador
            </Typography>

            <TextField
              margin="normal"
              required
              fullWidth
              id="nombreUsuario"
              label="Usuario"
              name="nombreUsuario"
              autoComplete="username"
              value={nombreUsuario}
              onChange={onChange}
              variant="outlined"
              inputProps={{ maxLength: 50 }}
              error={usuarioNombreStatus === 'taken'}
              helperText={
                usuarioNombreStatus === 'checking'
                  ? 'Validando usuario...'
                  : usuarioNombreStatus === 'taken'
                    ? 'Nombre de usuario no disponible'
                    : usuarioNombreStatus === 'available'
                      ? 'Nombre disponible'
                      : ''
              }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="adminTelefono"
              label="Teléfono (usuario)"
              name="adminTelefono"
              value={adminTelefono}
              onChange={onChange}
              variant="outlined"
              inputProps={{ maxLength: 15 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="adminEmail"
              label="Correo (usuario)"
              name="adminEmail"
              type="email"
              value={adminEmail}
              onChange={onChange}
              variant="outlined"
              inputProps={{ maxLength: 254 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="adminConfirmEmail"
              label="Confirmar correo (usuario)"
              name="adminConfirmEmail"
              type="email"
              value={adminConfirmEmail}
              onChange={onChange}
              variant="outlined"
              inputProps={{ maxLength: 254 }}
              error={
                adminConfirmEmail.length > 0 &&
                adminEmail.trim().toLowerCase() !== adminConfirmEmail.trim().toLowerCase()
              }
              helperText={
                adminConfirmEmail.length > 0 &&
                adminEmail.trim().toLowerCase() !== adminConfirmEmail.trim().toLowerCase()
                  ? 'Los correos del usuario no coinciden'
                  : ''
              }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={onChange}
              variant="outlined"
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
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
            {password.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, mb: 2 }}>
                <Chip
                  size="small"
                  label="8-20 caracteres"
                  color={
                    password.length >= 8 && password.length <= 20 ? 'success' : 'default'
                  }
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label="1 mayúscula"
                  color={/[A-Z]/.test(password) ? 'success' : 'default'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label="1 número"
                  color={/[0-9]/.test(password) ? 'success' : 'default'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label="1 especial"
                  color={/[^A-Za-z0-9]/.test(password) ? 'success' : 'default'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label="sin espacios"
                  color={/\s/.test(password) ? 'default' : 'success'}
                  variant="outlined"
                />
              </Box>
            )}

            {password.length > 0 && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={onChange}
                variant="outlined"
                sx={{ mb: 3 }}
                error={confirmPassword.length > 0 && confirmPassword !== password}
                helperText={
                  confirmPassword.length > 0 && confirmPassword !== password
                    ? 'Las contraseñas no coinciden'
                    : ''
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 2, py: 1.5 }}
              disabled={
                loading ||
                !passwordOk ||
                empresaNombreStatus === 'taken' ||
                usuarioNombreStatus === 'taken'
              }
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Registrar empresa'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
