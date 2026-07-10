import { useContext, useMemo, useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaSignOutAlt,
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
  FaCog,
  FaQuestionCircle,
  FaEnvelope,
} from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import PaletteIcon from '@mui/icons-material/Palette';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CircularProgress from '@mui/material/CircularProgress';
import ThemePicker from './ThemePicker';
import { useAppTheme } from '../context/ThemeContext';
import { getEmpresasAdmin } from '../services/empresaAdminService';
import { fetchNotificacionesEventosPremium, marcarNotificacionEventosPremiumLeida } from '../services/eventoService';

const getIconoPorRol = (rol) => {
  if (rol === 'superadmin') return 'userShield';
  if (rol === 'admin') return 'userTie';
  if (rol === 'operador') return 'userCog';
  return 'user';
};

const getUserIconComponent = (user) => {
  const key = user?.icono || getIconoPorRol(user?.rol);
  const map = {
    user: FaUser,
    userTie: FaUserTie,
    userShield: FaUserShield,
    userCog: FaUserCog,
    userSecret: FaUserSecret,
    userNinja: FaUserNinja,
    userAstronaut: FaUserAstronaut,
    userGraduate: FaUserGraduate,
    userMd: FaUserMd,
    userTag: FaUserTag,
    userFriends: FaUserFriends,
    userClock: FaUserClock,
    userCheck: FaUserCheck,
    userEdit: FaUserEdit,
    userPlus: FaUserPlus,
    userMinus: FaUserMinus,
  };
  return map[key] || FaUser;
};

const Navbar = ({ sidebarCollapsed, onToggleSidebarCollapsed }) => {
  const { user, logout } = useContext(AuthContext);
  const { resolvedMode, colorMode, setColorMode } = useAppTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingEmpresas, setPendingEmpresas] = useState([]);
  const [eventosNotif, setEventosNotif] = useState([]);
  const [anchorNotif, setAnchorNotif] = useState(null);
  const [anchorUser, setAnchorUser] = useState(null);
  const [anchorTheme, setAnchorTheme] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const eventosNotifReady = useRef(false);
  const prevEventosNotifCount = useRef(0);

  // Cicla entre los modos: claro → oscuro → sistema → claro.
  const handleToggleMode = () => {
    setColorMode(colorMode === 'light' ? 'dark' : colorMode === 'dark' ? 'system' : 'light');
  };

  const modeTooltip =
    colorMode === 'light' ? 'Modo oscuro' : colorMode === 'dark' ? 'Modo sistema' : 'Modo claro';

  const isLoginPage = location.pathname === '/login';

  const hasEventosVer = useMemo(() => {
    if (!user) return false;
    if (user.rol === 'admin' || user.rol === 'superadmin' || user.esAdminPrincipal) return true;
    if (user.rol_id && user.rol_id.activo && user.rol_id.permisos) {
      const permisosRol = user.rol_id.permisos;
      if (permisosRol?.eventos?.ver === true) {
        return true;
      }
    }
    return user?.permisos?.eventos?.ver === true;
  }, [user]);

  const hasPremiumPlan = useMemo(() => {
    if (!user) return false;
    if (user.rol === 'superadmin') return true;
    const plan = user?.empresa && typeof user.empresa === 'object' ? user.empresa.plan : '';
    return ['premium', 'super'].includes(plan);
  }, [user]);

  // Un solo handler: en mobile abre el drawer temporal; en desktop colapsa/expande el permanent
  const handleMenuToggle = () => {
    // useMediaQuery no está disponible aquí sin hook, usamos window.innerWidth
    if (window.innerWidth < 600) {
      setMobileOpen((prev) => !prev);
    } else {
      onToggleSidebarCollapsed();
    }
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!user || user.rol !== 'superadmin') {
      setPendingEmpresas([]);
      return;
    }

    let isMounted = true;

    const cargarPendientes = async () => {
      try {
        const data = await getEmpresasAdmin();
        if (!isMounted) return;
        const pendientes = (Array.isArray(data) ? data : []).filter(
          (e) => e.estadoAprobacion === 'pendiente'
        );
        setPendingEmpresas(pendientes);
      } catch {
        if (isMounted) {
          setPendingEmpresas([]);
        }
      }
    };

    cargarPendientes();
    const id = setInterval(cargarPendientes, 30000);

    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setEventosNotif([]);
      eventosNotifReady.current = false;
      prevEventosNotifCount.current = 0;
      return;
    }
    if (!(user.rol === 'superadmin' || hasPremiumPlan)) {
      setEventosNotif([]);
      eventosNotifReady.current = false;
      prevEventosNotifCount.current = 0;
      return;
    }

    let isMounted = true;

    const cargar = async () => {
      try {
        const res = await fetchNotificacionesEventosPremium();
        if (!isMounted) return;
        const data = Array.isArray(res.data) ? res.data : [];
        const nextCount = data.length;
        if (eventosNotifReady.current && nextCount > prevEventosNotifCount.current) {
          toast.info('Tienes fichas asignadas en Eventos');
        }
        prevEventosNotifCount.current = nextCount;
        eventosNotifReady.current = true;
        setEventosNotif(data);
      } catch {
        if (isMounted) setEventosNotif([]);
      }
    };

    cargar();
    const id = setInterval(cargar, 15000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [user, hasPremiumPlan]);

  const handleOpenNotif = (event) => {
    setAnchorNotif(event.currentTarget);
  };

  const handleCloseNotif = () => {
    setAnchorNotif(null);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorUser(null);
  };

  const handleGoToConfig = () => {
    handleCloseUserMenu();
    navigate('/configuraciones');
  };

  const handleHelp = () => {
    handleCloseUserMenu();
    toast.info('Ayuda: próximamente');
  };

  const handleContact = () => {
    handleCloseUserMenu();
    toast.info('Contacto: próximamente');
  };

  const handleGoToEmpresas = (empresaId) => {
    handleCloseNotif();
    navigate(`/superadmin/empresas?focus=${empresaId}`);
  };

  const handleGoToFichaAsignada = (n) => {
    handleCloseNotif();
    if (!n?.eventoId || !n?.fichaId) {
      navigate('/eventos-premium');
      return;
    }
    setEventosNotif((prev) => prev.filter((x) => x._id !== n._id));
    marcarNotificacionEventosPremiumLeida(n.fichaId).catch(() => {});
    navigate(`/eventos-premium/${n.eventoId}/gestion?focusFicha=${n.fichaId}`);
  };

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      logout();
    } finally {
      setLoggingOut(false);
    }
  };

  if (isLoginPage) {
    return null;
  }

  const UserIcon = getUserIconComponent(user);

  return (
    <>
      <AppBar position="fixed" className="print-hidden" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {/* Único ícono de menú: mobile → abre drawer temporal | desktop → colapsa/expande permanent */}
          {user && (
            <Tooltip title={
              window.innerWidth < 600
                ? 'Abrir menú'
                : sidebarCollapsed ? 'Expandir menú' : 'Minimizar menú'
            }>
              <IconButton
                color="inherit"
                aria-label="toggle menu"
                edge="start"
                onClick={handleMenuToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="Next Event Logo" style={{ height: 32, width: 'auto', display: 'block' }} />
            </Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'block' } }}>
              NExt Event
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Selector rápido de tema de color */}
          <Tooltip title="Cambiar tema">
            <IconButton
              color="inherit"
              onClick={(e) => setAnchorTheme(e.currentTarget)}
              sx={{ mr: 1 }}
            >
              <PaletteIcon />
            </IconButton>
          </Tooltip>
          <ThemePicker anchorEl={anchorTheme} onClose={() => setAnchorTheme(null)} />

          {/* Botón para alternar el modo de color (claro → oscuro → sistema) */}
          <Tooltip title={modeTooltip}>
            <IconButton color="inherit" onClick={handleToggleMode} sx={{ mr: 1 }}>
              {colorMode === 'system' ? (
                <SettingsSuggestIcon />
              ) : resolvedMode === 'dark' ? (
                <LightModeIcon />
              ) : (
                <DarkModeIcon />
              )}
            </IconButton>
          </Tooltip>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {(user.rol === 'superadmin' || hasPremiumPlan) && (
                <>
                  <Tooltip title="Notificaciones">
                    <IconButton color="inherit" onClick={handleOpenNotif} sx={{ mr: 1 }}>
                      <Badge
                        color="error"
                        badgeContent={(pendingEmpresas?.length || 0) + (eventosNotif?.length || 0)}
                        overlap="circular"
                      >
                        <NotificationsNoneIcon />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorNotif}
                    open={Boolean(anchorNotif)}
                    onClose={handleCloseNotif}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    {user.rol === 'superadmin' && (
                      <>
                        <MenuItem disabled sx={{ opacity: 0.8 }}>
                          Empresas pendientes
                        </MenuItem>
                        {pendingEmpresas.length === 0 && (
                          <MenuItem disabled>No hay solicitudes pendientes</MenuItem>
                        )}
                        {pendingEmpresas.map((e) => (
                          <MenuItem key={e._id} onClick={() => handleGoToEmpresas(e._id)}>
                            {e.nombre} · {e.email}
                          </MenuItem>
                        ))}
                      </>
                    )}

                    {(user.rol === 'superadmin' || hasPremiumPlan) && (
                      <>
                        {user.rol === 'superadmin' && <MenuItem disabled sx={{ opacity: 0.5 }}>—</MenuItem>}
                        <MenuItem disabled sx={{ opacity: 0.8 }}>
                          Eventos · Fichas asignadas
                        </MenuItem>
                        {eventosNotif.length === 0 && (
                          <MenuItem disabled>No tienes fichas asignadas</MenuItem>
                        )}
                        {eventosNotif.map((n) => (
                          <MenuItem key={n._id} onClick={() => handleGoToFichaAsignada(n)}>
                            {n.clienteNombre ? `${n.clienteNombre} · ` : ''}
                            {n.eventoNombre} · {n.fichaNombre}
                          </MenuItem>
                        ))}
                      </>
                    )}
                  </Menu>
                </>
              )}

              {/* Ícono del usuario */}
              <Tooltip
                title={
                  user
                    ? `${user.nombreUsuario || 'Usuario'} · ${user.rol || ''}`
                    : 'Usuario'
                }
              >
                <IconButton color="inherit" sx={{ mr: 1 }} onClick={handleOpenUserMenu}>
                  <UserIcon />
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorUser}
                open={Boolean(anchorUser)}
                onClose={handleCloseUserMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleGoToConfig}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaCog />
                    <span>Configuración</span>
                  </Box>
                </MenuItem>
                <MenuItem onClick={handleHelp}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaQuestionCircle />
                    <span>Ayuda</span>
                  </Box>
                </MenuItem>
                <MenuItem onClick={handleContact}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaEnvelope />
                    <span>Contacto</span>
                  </Box>
                </MenuItem>
              </Menu>

              {/* Botón Salir: texto en desktop, solo ícono en mobile */}
              <Tooltip title="Salir">
                <span>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={handleLogout}
                    startIcon={
                      loggingOut ? (
                        <CircularProgress size={18} sx={{ color: 'inherit' }} />
                      ) : (
                        <FaSignOutAlt />
                      )
                    }
                    disabled={loggingOut}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                  >
                    Salir
                  </Button>
                  <IconButton
                    color="inherit"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: '#ff6b6b' }}
                  >
                    {loggingOut ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <FaSignOutAlt />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <div className="print-hidden">
        <Sidebar open={mobileOpen} onClose={handleDrawerClose} />
      </div>
    </>
  );
};

export default Navbar;
