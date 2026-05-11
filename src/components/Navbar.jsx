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
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CircularProgress from '@mui/material/CircularProgress';
import { getEmpresasAdmin } from '../services/empresaAdminService';
import { fetchNotificacionesEventosPremium } from '../services/eventoService';

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

const Navbar = ({ onToggleColorMode, mode, sidebarCollapsed, onToggleSidebarCollapsed }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingEmpresas, setPendingEmpresas] = useState([]);
  const [eventosNotif, setEventosNotif] = useState([]);
  const [anchorNotif, setAnchorNotif] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const lastNotifCount = useRef(0);

  const isLoginPage = location.pathname === '/login';

  const hasEventosVer = useMemo(() => {
    if (!user) return false;
    if (user.rol === 'admin' || user.rol === 'superadmin' || user.esAdminPrincipal) return true;
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
      lastNotifCount.current = 0;
      return;
    }
    if (!hasPremiumPlan || !hasEventosVer) {
      setEventosNotif([]);
      lastNotifCount.current = 0;
      return;
    }

    let isMounted = true;

    const cargar = async () => {
      try {
        const res = await fetchNotificacionesEventosPremium();
        if (!isMounted) return;
        const data = Array.isArray(res.data) ? res.data : [];
        setEventosNotif(data);
      } catch {
        if (isMounted) setEventosNotif([]);
      }
    };

    cargar();
    const id = setInterval(cargar, 30000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [user, hasPremiumPlan, hasEventosVer]);

  useEffect(() => {
    const count = (pendingEmpresas?.length || 0) + (eventosNotif?.length || 0);
    if (count > lastNotifCount.current && lastNotifCount.current > 0 && eventosNotif.length > 0) {
      toast.info('Tienes fichas asignadas en Eventos');
    }
    lastNotifCount.current = count;
  }, [pendingEmpresas, eventosNotif]);

  const handleOpenNotif = (event) => {
    setAnchorNotif(event.currentTarget);
  };

  const handleCloseNotif = () => {
    setAnchorNotif(null);
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="IAN Logo" style={{ height: 32, width: 'auto', display: 'block' }} />
            </Box>

            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              IAN Management
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Botón para alternar tema claro/oscuro */}
          <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            <IconButton color="inherit" onClick={onToggleColorMode} sx={{ mr: 1 }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {(user.rol === 'superadmin' || (hasPremiumPlan && hasEventosVer)) && (
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

                    {hasPremiumPlan && hasEventosVer && (
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
                <IconButton color="inherit" sx={{ mr: 1 }}>
                  <UserIcon />
                </IconButton>
              </Tooltip>

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
              >
                Salir
              </Button>
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
