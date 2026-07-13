import { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
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
  FaTrash,
  FaSave,
} from 'react-icons/fa';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

const STORAGE_KEY = 'ian_config';
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

const readStoredConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const buildLogoDataUrl = (logo) => {
  if (!logo?.format || !logo?.dataBase64) return '';
  if (logo.format === 'svg') return `data:image/svg+xml;base64,${logo.dataBase64}`;
  if (logo.format === 'webp') return `data:image/webp;base64,${logo.dataBase64}`;
  return '';
};

const Configuraciones = () => {
  const { user } = useContext(AuthContext);
  const canEditEmpresa = user?.rol === 'admin' || user?.rol === 'superadmin';

  const { themeId, setThemeId, colorMode, setColorMode, resolvedMode, availableThemes, cursorStyle, setCursorStyle, availableCursorStyles } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  const [config, setConfig] = useState(() => readStoredConfig());

  const [usuarioForm, setUsuarioForm] = useState({
    email: '',
    emailConfirm: '',
    indicativoSelect: '+57',
    indicativoCustom: '',
    telefono: '',
    icono: '',
  });

  const [empresaForm, setEmpresaForm] = useState({
    nombre: '',
    nit: '',
    direccion: '',
    telefono: '',
    email: '',
  });

  const [logoForm, setLogoForm] = useState({
    dataUrl: '',
    format: '',
    mostrarLogoEnComprobante: true,
  });

  const logoPreview = useMemo(() => {
    if (logoForm.dataUrl) return logoForm.dataUrl;
    return buildLogoDataUrl(config?.empresa?.logo);
  }, [logoForm.dataUrl, config?.empresa?.logo]);

  const loadConfig = async () => {
    try {
      const res = await api.get('/config');
      setConfig(res.data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.message || 'No se pudo cargar configuraciones');
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const fresh = await loadConfig();
      const base = fresh || readStoredConfig();

      if (base?.usuario) {
        const indicativo = base.usuario.indicativo || '+57';
        const indicativoSelect = INDICATIVOS_COMUNES.includes(indicativo) ? indicativo : 'custom';
        setUsuarioForm({
          email: base.usuario.email || '',
          emailConfirm: base.usuario.email || '',
          indicativoSelect,
          indicativoCustom: indicativoSelect === 'custom' ? indicativo : '',
          telefono: base.usuario.telefono || '',
          icono: base.usuario.icono || '',
        });
      }

      if (base?.empresa) {
        setEmpresaForm({
          nombre: base.empresa.nombre || '',
          nit: base.empresa.nit || '',
          direccion: base.empresa.direccion || '',
          telefono: base.empresa.telefono || '',
          email: base.empresa.email || '',
        });
        setLogoForm((prev) => ({
          ...prev,
          mostrarLogoEnComprobante: base.empresa.mostrarLogoEnComprobante === true,
        }));
      }

      setLoading(false);
    };

    init();
  }, []);

  const handleUsuarioChange = (e) => {
    const { name, value } = e.target;
    setUsuarioForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'indicativoSelect' && value !== 'custom') {
        next.indicativoCustom = '';
      }
      return next;
    });
  };

  const handleEmpresaChange = (e) => {
    const { name, value } = e.target;
    setEmpresaForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectIcon = (value) => {
    setUsuarioForm((prev) => ({ ...prev, icono: value }));
  };

  const handlePickLogo = async (file) => {
    if (!file) return;
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    const isWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');
    if (!isSvg && !isWebp) {
      toast.error('Formato inválido. Solo se permite SVG o WebP.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setLogoForm((prev) => ({
        ...prev,
        dataUrl,
        format: isWebp ? 'webp' : 'svg',
      }));
    };
    reader.onerror = () => {
      toast.error('No se pudo leer el archivo');
    };
    reader.readAsDataURL(file);
  };

  const saveUsuario = async () => {
    try {
      setSavingUser(true);

      const email = usuarioForm.email.trim().toLowerCase();
      const emailConfirm = usuarioForm.emailConfirm.trim().toLowerCase();
      if ((email || emailConfirm) && email !== emailConfirm) {
        toast.error('El correo y la confirmación de correo deben coincidir');
        return;
      }

      const indicativo =
        usuarioForm.indicativoSelect === 'custom'
          ? usuarioForm.indicativoCustom.trim()
          : usuarioForm.indicativoSelect;

      const payload = {
        email,
        emailConfirm,
        indicativo,
        telefono: usuarioForm.telefono.trim(),
        icono: usuarioForm.icono,
      };

      await api.patch('/config/usuario', payload);
      const updated = await loadConfig();
      if (updated?.usuario) {
        toast.success('Tu perfil fue actualizado');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'No se pudo actualizar el perfil');
    } finally {
      setSavingUser(false);
    }
  };

  const saveEmpresa = async () => {
    try {
      setSavingEmpresa(true);
      const payload = {
        nombre: empresaForm.nombre.trim(),
        nit: empresaForm.nit.trim(),
        direccion: empresaForm.direccion.trim(),
        telefono: empresaForm.telefono.trim(),
        email: empresaForm.email.trim().toLowerCase(),
      };
      await api.patch('/config/empresa', payload);
      const updated = await loadConfig();
      if (updated?.empresa) {
        toast.success('Empresa actualizada');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'No se pudo actualizar la empresa');
    } finally {
      setSavingEmpresa(false);
    }
  };

  const saveLogo = async () => {
    try {
      setSavingLogo(true);
      const payload = {
        mostrarLogoEnComprobante: logoForm.mostrarLogoEnComprobante === true,
      };
      if (logoForm.dataUrl) {
        payload.dataUrl = logoForm.dataUrl;
        payload.format = logoForm.format;
      }
      await api.patch('/config/empresa/logo', payload);
      setLogoForm((prev) => ({ ...prev, dataUrl: '', format: '' }));
      await loadConfig();
      toast.success('Configuración de logo actualizada');
    } catch (e) {
      toast.error(e.response?.data?.message || 'No se pudo actualizar el logo');
    } finally {
      setSavingLogo(false);
    }
  };

  const clearLogo = async () => {
    try {
      setSavingLogo(true);
      await api.patch('/config/empresa/logo', {
        dataUrl: null,
        mostrarLogoEnComprobante: logoForm.mostrarLogoEnComprobante === true,
      });
      setLogoForm((prev) => ({ ...prev, dataUrl: '', format: '' }));
      await loadConfig();
      toast.success('Logo eliminado');
    } catch (e) {
      toast.error(e.response?.data?.message || 'No se pudo eliminar el logo');
    } finally {
      setSavingLogo(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress size={56} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Configuraciones
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Mi perfil
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 180 }} margin="normal">
            <InputLabel>Indicativo</InputLabel>
            <Select
              name="indicativoSelect"
              value={usuarioForm.indicativoSelect}
              label="Indicativo"
              onChange={handleUsuarioChange}
            >
              {INDICATIVOS_COMUNES.map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                </MenuItem>
              ))}
              <MenuItem value="custom">Personalizado</MenuItem>
            </Select>
          </FormControl>

          {usuarioForm.indicativoSelect === 'custom' && (
            <TextField
              margin="normal"
              name="indicativoCustom"
              label="Indicativo personalizado"
              value={usuarioForm.indicativoCustom}
              onChange={handleUsuarioChange}
              inputProps={{ maxLength: 6 }}
              sx={{ flex: 1, minWidth: 220 }}
            />
          )}
        </Box>

        <TextField
          margin="normal"
          fullWidth
          name="telefono"
          label="Teléfono"
          value={usuarioForm.telefono}
          onChange={handleUsuarioChange}
          inputProps={{ maxLength: 15 }}
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            margin="normal"
            fullWidth
            name="email"
            label="Correo"
            value={usuarioForm.email}
            onChange={handleUsuarioChange}
            inputProps={{ maxLength: 254 }}
            sx={{ minWidth: 280, flex: 1 }}
          />
          <TextField
            margin="normal"
            fullWidth
            name="emailConfirm"
            label="Confirmar correo"
            value={usuarioForm.emailConfirm}
            onChange={handleUsuarioChange}
            inputProps={{ maxLength: 254 }}
            sx={{ minWidth: 280, flex: 1 }}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Ícono
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
              const selected = usuarioForm.icono === opt.value;
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

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={saveUsuario}
            startIcon={savingUser ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <FaSave />}
            disabled={savingUser}
          >
            Guardar perfil
          </Button>
        </Box>
      </Paper>

      {canEditEmpresa && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Empresa
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              margin="normal"
              fullWidth
              name="nombre"
              label="Nombre de empresa"
              value={empresaForm.nombre}
              onChange={handleEmpresaChange}
              inputProps={{ maxLength: 150 }}
              sx={{ minWidth: 280, flex: 1 }}
            />
            <TextField
              margin="normal"
              fullWidth
              name="nit"
              label="NIT / RUT"
              value={empresaForm.nit}
              onChange={handleEmpresaChange}
              inputProps={{ maxLength: 20 }}
              sx={{ minWidth: 220, flex: 1 }}
            />
          </Box>

          <TextField
            margin="normal"
            fullWidth
            name="direccion"
            label="Dirección"
            value={empresaForm.direccion}
            onChange={handleEmpresaChange}
            inputProps={{ maxLength: 200 }}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              margin="normal"
              fullWidth
              name="telefono"
              label="Teléfono"
              value={empresaForm.telefono}
              onChange={handleEmpresaChange}
              inputProps={{ maxLength: 15 }}
              sx={{ minWidth: 220, flex: 1 }}
            />
            <TextField
              margin="normal"
              fullWidth
              name="email"
              label="Correo empresa"
              value={empresaForm.email}
              onChange={handleEmpresaChange}
              inputProps={{ maxLength: 254 }}
              sx={{ minWidth: 280, flex: 1 }}
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={saveEmpresa}
              startIcon={savingEmpresa ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <FaSave />}
              disabled={savingEmpresa}
            >
              Guardar empresa
            </Button>
          </Box>
        </Paper>
      )}

      {canEditEmpresa && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Logo de empresa (SVG o WebP)
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={logoForm.mostrarLogoEnComprobante === true}
                onChange={(e) =>
                  setLogoForm((prev) => ({
                    ...prev,
                    mostrarLogoEnComprobante: e.target.checked,
                  }))
                }
              />
            }
            label="Mostrar logo en el comprobante"
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="outlined" component="label" disabled={savingLogo}>
              Seleccionar archivo
              <input
                hidden
                type="file"
                accept=".svg,image/svg+xml,.webp,image/webp"
                onChange={(e) => handlePickLogo(e.target.files?.[0])}
              />
            </Button>

            <Button
              variant="outlined"
              color="error"
              onClick={clearLogo}
              startIcon={savingLogo ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <FaTrash />}
              disabled={savingLogo}
            >
              Eliminar logo
            </Button>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Vista previa
            </Typography>
            <Box
              sx={{
                mt: 1,
                width: 140,
                height: 80,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                bgcolor: 'background.paper',
              }}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  style={{ maxWidth: '120px', maxHeight: '64px', width: 'auto', height: 'auto' }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Sin logo
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={saveLogo}
              startIcon={savingLogo ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <FaSave />}
              disabled={savingLogo}
            >
              Guardar logo
            </Button>
          </Box>
        </Paper>
      )}

      {/* ── Sección Apariencia ─────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Apariencia
        </Typography>

        {/* Selector de modo */}
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
          Modo de color
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          {[
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Oscuro' },
          ].map(({ value, label }) => (
            <Button
              key={value}
              variant={colorMode === value ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setColorMode(value)}
            >
              {label}
            </Button>
          ))}
        </Box>

        {/* Selector de tema */}
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
          Tema de color
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          {availableThemes.map((t) => {
            const isActive = themeId === t.id;
            return (
              <Box
                key={t.id}
                onClick={() => setThemeId(t.id)}
                sx={{
                  border: isActive ? '2px solid' : '1px solid',
                  borderColor: isActive ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  '&:hover': { boxShadow: 3 },
                  position: 'relative',
                }}
              >
                {/* Previsualización del gradiente de barra */}
                <Box
                  sx={{
                    height: 44,
                    background: t.tokens.appBarGradient,
                  }}
                />
                {/* Info del tema */}
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {t.nombre}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t.descripcion}
                  </Typography>
                  {/* Fila de swatches de colores del tema */}
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    {[
                      t.tokens.primary.main,
                      t.tokens.secondary.main,
                      t.tokens.success.main,
                      resolvedMode === 'dark' ? t.tokens.dark.bgDefault : t.tokens.light.bgDefault,
                    ].map((color, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: color,
                          border: '1px solid',
                          borderColor: 'divider',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                {/* Badge "Activo" */}
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontSize: 10,
                      fontWeight: 700,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    Activo
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Selector de diseño de cursor */}
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
          Diseño de cursor
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          {availableCursorStyles.map((c) => {
            const isActive = cursorStyle === c.id;
            return (
              <Box
                key={c.id}
                onClick={() => setCursorStyle(c.id)}
                role="button"
                aria-label={`Cursor ${c.nombre}`}
                sx={{
                  border: isActive ? '2px solid' : '1px solid',
                  borderColor: isActive ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  '&:hover': { boxShadow: 3 },
                  position: 'relative',
                }}
              >
                {/* Previsualización del diseño de cursor */}
                <Box
                  sx={{
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover',
                  }}
                >
                  {c.id === 'organico' && (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '30% 70% 65% 35% / 40% 45% 55% 60%',
                        background: 'linear-gradient(135deg, var(--app-accent, #5D87FF) 0%, var(--app-accent-soft, #8A5DFF) 100%)',
                      }}
                    />
                  )}
                  {c.id === 'anillo' && (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: '2.5px solid #22D3EE',
                      }}
                    />
                  )}
                  {c.id === 'diamante' && (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '3px',
                        transform: 'rotate(45deg)',
                        background: 'linear-gradient(135deg, #F472B6 0%, #A855F7 100%)',
                        boxShadow: '0 0 6px rgba(217, 70, 239, 0.6)',
                      }}
                    />
                  )}
                  {c.id === 'sistema' && (
                    <Box component="span" sx={{ fontSize: 20, color: 'text.secondary', transform: 'rotate(-12deg)' }}>
                      ➤
                    </Box>
                  )}
                </Box>
                {/* Info del diseño */}
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {c.nombre}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {c.descripcion}
                  </Typography>
                </Box>
                {/* Badge "Activo" */}
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontSize: 10,
                      fontWeight: 700,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    Activo
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Botón de confirmación con toast */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={() => toast.success('Apariencia guardada')}
            startIcon={<FaSave />}
          >
            Guardar apariencia
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Configuraciones;