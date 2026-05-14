import { cloneElement, isValidElement, useContext } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FaUser, FaUsers, FaBoxOpen, FaShoppingCart, FaListOl, FaTachometerAlt, FaCalendarAlt, FaUserTag, FaCog } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  Tooltip,
  styled
} from '@mui/material';

// Estilo para el elemento de menú seleccionado
const StyledListItem = styled(ListItem)(({ theme, selected }) => ({
  borderRadius: '8px',
  margin: '4px 8px',
  maxWidth: '100%',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  ...(selected && {
    backgroundColor: theme.palette.action.selected,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  }),
}));

const PermanentSidebar = ({ width = 240, collapsed = false }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Si no hay usuario autenticado o estamos en la página de login, no mostrar el sidebar
  if (!user || location.pathname === '/login') return null;

  const currentWidth = collapsed ? 72 : width;
  const planEmpresa =
    user?.empresa && typeof user.empresa === 'object' ? user.empresa.plan : '';
  const hasPremium = user?.rol === 'superadmin' || ['premium', 'super'].includes(planEmpresa);

  const canSee = (perm) => {
    if (!perm) return true;
    // Superadmin y admin principal siempre tienen acceso
    if (user.rol === 'superadmin' || user.esAdminPrincipal) {
      return true;
    }
    // Admin tiene acceso total a módulos de su empresa
    if (user.rol === 'admin') {
      return true;
    }
    
    // Verificar permisos desde rol_id (nuevo sistema de roles)
    if (user.rol_id && user.rol_id.activo && user.rol_id.permisos) {
      const permisosRol = user.rol_id.permisos;
      // Verificar si el permiso existe y tiene "ver" activo
      if (permisosRol?.[perm]?.ver === true) {
        return true;
      }
      // Si no tiene el permiso de ver, no mostrar
      return false;
    }
    
    // Fallback a permisos embebidos del usuario (legacy)
    if (user?.permisos?.[perm]?.ver === true) {
      return true;
    }
    
    // Por defecto, si no hay permisos configurados, no mostrar
    return false;
  };

  const menuItems = [
    ...(canSee('dashboard') ? [{ text: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard' }] : []),
    ...(canSee('clientes') ? [{ text: 'Clientes', icon: <FaUsers />, path: '/clientes' }] : []),
    ...(canSee('productos') ? [{ text: 'Productos', icon: <FaBoxOpen />, path: '/productos' }] : []),
    ...(canSee('ventas') ? [{ text: 'Ventas', icon: <FaShoppingCart />, path: '/ventas' }] : []),
    ...(canSee('eventos') ? [{ text: 'Cronograma de eventos', icon: <FaCalendarAlt />, path: '/eventos' }] : []),
    ...(canSee('eventos') && hasPremium
      ? [{ text: 'Eventos', icon: <FaCalendarAlt />, path: '/eventos-premium' }]
      : []),
    ...(canSee('consecutivos') ? [{ text: 'Consecutivos', icon: <FaListOl />, path: '/consecutivos' }] : []),
    ...(canSee('cotizaciones') ? [{ text: 'Cotizaciones', icon: <FaListOl />, path: '/cotizaciones' }] : []),
    ...(canSee('disponibilidad') ? [{ text: 'Disponibilidad', icon: <FaCalendarAlt />, path: '/disponibilidad' }] : []),
    ...(canSee('configuracion') ? [{ text: 'Configuracion', icon: <FaCog />, path: '/configuraciones' }] : []),
    ...(canSee('usuarios') ? [{ text: 'Usuarios', icon: <FaUser />, path: '/usuarios' }] : []),
    ...(canSee('roles') ? [{ text: 'Roles', icon: <FaUserTag />, path: '/roles' }] : []),
    ...(canSee('dashboard_global') ? [{ text: 'Dashboard global', icon: <FaTachometerAlt />, path: '/superadmin/dashboard' }] : []),
    ...(canSee('empresas') ? [{ text: 'Empresas', icon: <FaUsers />, path: '/superadmin/empresas' }] : []),
  ];

  const isSelected = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const renderIcon = (icon) => {
    if (isValidElement(icon)) {
      return cloneElement(icon, { size: 20 });
    }
    return icon;
  };

  return (
    <Drawer
      className="print-hidden"
      variant="permanent"
      sx={{
        display: { xs: 'none', sm: 'block' },
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          top: '64px',
          height: 'calc(100% - 64px)',
          overflowX: 'hidden',
          transition: 'width 0.2s ease',
        },
        width: currentWidth,
        flexShrink: 0,
        transition: 'width 0.2s ease',
      }}
      open
    >
      {/* FIX: usar currentWidth en lugar de width para que el Box se ajuste al estado colapsado */}
      <Box sx={{ width: currentWidth, height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        <List sx={{ flexGrow: 1, py: 1, overflowX: 'hidden', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const content = (
              <StyledListItem
                button
                key={item.text}
                component={RouterLink}
                to={item.path}
                selected={isSelected(item.path)}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  // FIX: en modo colapsado, quitar el margin horizontal para que el ítem quepa bien
                  margin: collapsed ? '4px auto' : '4px 8px',
                  px: collapsed ? 0 : undefined,
                  width: collapsed ? `calc(${currentWidth}px - 16px)` : undefined,
                  minHeight: collapsed ? 44 : undefined,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    // FIX: en modo colapsado el ícono ocupa todo el ancho del ítem centrado
                    width: collapsed ? '100%' : 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'text.primary',
                    '& svg': {
                      width: 20,
                      height: 20,
                      display: 'block',
                      color: 'inherit',
                      flexShrink: 0,
                    },
                  }}
                >
                  {renderIcon(item.icon)}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.text} />}
              </StyledListItem>
            );

            if (!collapsed) return content;

            return (
              <Tooltip title={item.text} placement="right" key={item.text}>
                {content}
              </Tooltip>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};

export default PermanentSidebar;
