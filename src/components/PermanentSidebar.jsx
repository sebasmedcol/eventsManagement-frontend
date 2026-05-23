import { cloneElement, isValidElement, useContext } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FaUser, FaUsers, FaBoxOpen, FaShoppingCart, FaListOl, FaTachometerAlt, FaCalendarAlt, FaUserTag, FaCog, FaCrown, FaFileInvoice } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  Tooltip,
  styled,
  Chip,
  Typography,
  Divider,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

// Estilo para el elemento de menu seleccionado
const StyledListItem = styled(ListItem)(({ theme, selected, disabled }) => ({
  borderRadius: '8px',
  margin: '4px 8px',
  maxWidth: '100%',
  '&:hover': {
    backgroundColor: disabled ? 'transparent' : theme.palette.action.hover,
  },
  ...(selected && {
    backgroundColor: theme.palette.action.selected,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  }),
  ...(disabled && {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  }),
}));

const PermanentSidebar = ({ width = 240, collapsed = false }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { canAccessModule, currentPlan, checkLimit, isTrialExpired } = usePlan();

  // Si no hay usuario autenticado o estamos en la pagina de login, no mostrar el sidebar
  if (!user || location.pathname === '/login') return null;

  const currentWidth = collapsed ? 72 : width;
  const planEmpresa =
    user?.empresa && typeof user.empresa === 'object' ? user.empresa.plan : '';
  const hasPremium = user?.rol === 'superadmin' || ['premium', 'super', 'pro'].includes(planEmpresa);

  const canSee = (perm) => {
    if (!perm) return true;
    // Superadmin y admin principal siempre tienen acceso
    if (user.rol === 'superadmin' || user.esAdminPrincipal) {
      return true;
    }
    // Admin tiene acceso total a modulos de su empresa
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

  // Verificar si un modulo esta disponible en el plan actual
  const isModuleAvailable = (moduleName) => {
    // Si el trial expiro, bloquear la creacion pero permitir ver
    // Superadmin siempre tiene acceso
    if (user.rol === 'superadmin') return true;
    return canAccessModule(moduleName);
  };

  // Construir items del menu con verificacion de plan
  const buildMenuItems = () => {
    const items = [];

    // Dashboard - siempre disponible
    if (canSee('dashboard')) {
      items.push({ 
        text: 'Dashboard', 
        icon: <FaTachometerAlt />, 
        path: '/dashboard',
        module: 'dashboard',
      });
    }

    // Clientes
    if (canSee('clientes')) {
      items.push({ 
        text: 'Clientes', 
        icon: <FaUsers />, 
        path: '/clientes',
        module: 'clientes',
      });
    }

    // Productos
    if (canSee('productos')) {
      items.push({ 
        text: 'Productos', 
        icon: <FaBoxOpen />, 
        path: '/productos',
        module: 'productos',
      });
    }

    // Ventas
    if (canSee('ventas')) {
      items.push({ 
        text: 'Ventas', 
        icon: <FaShoppingCart />, 
        path: '/ventas',
        module: 'ventas',
      });
    }

    // Eventos (Cronograma)
    if (canSee('eventos')) {
      items.push({ 
        text: 'Cronograma', 
        icon: <FaCalendarAlt />, 
        path: '/eventos',
        module: 'eventos',
      });
    }

    // Eventos Premium - solo planes pro/premium
    if (canSee('eventos') && isModuleAvailable('eventosPremium')) {
      items.push({ 
        text: 'Eventos Premium', 
        icon: <FaCrown />, 
        path: '/eventos-premium',
        module: 'eventosPremium',
        requiresPlan: ['pro', 'premium'],
      });
    }

    // Consecutivos
    if (canSee('consecutivos')) {
      items.push({ 
        text: 'Consecutivos', 
        icon: <FaListOl />, 
        path: '/consecutivos',
        module: 'facturacion',
      });
    }

    // Cotizaciones
    if (canSee('cotizaciones')) {
      items.push({ 
        text: 'Cotizaciones', 
        icon: <FaFileInvoice />, 
        path: '/cotizaciones',
        module: 'cotizaciones',
      });
    }

    // Disponibilidad
    if (canSee('disponibilidad')) {
      items.push({ 
        text: 'Disponibilidad', 
        icon: <FaCalendarAlt />, 
        path: '/disponibilidad',
        module: 'eventos',
      });
    }

    // Configuracion
    if (canSee('configuracion')) {
      items.push({ 
        text: 'Configuracion', 
        icon: <FaCog />, 
        path: '/configuraciones',
        module: 'configuracion',
      });
    }

    // Usuarios
    if (canSee('usuarios')) {
      items.push({ 
        text: 'Usuarios', 
        icon: <FaUser />, 
        path: '/usuarios',
        module: 'usuarios',
      });
    }

    // Roles - solo planes pro/premium
    if (canSee('roles') && isModuleAvailable('roles')) {
      items.push({ 
        text: 'Roles', 
        icon: <FaUserTag />, 
        path: '/roles',
        module: 'roles',
        requiresPlan: ['pro', 'premium'],
      });
    }

    // Dashboard global (superadmin)
    if (canSee('dashboard_global')) {
      items.push({ 
        text: 'Dashboard global', 
        icon: <FaTachometerAlt />, 
        path: '/superadmin/dashboard',
        module: 'dashboard',
      });
    }

    // Empresas (superadmin)
    if (canSee('empresas')) {
      items.push({ 
        text: 'Empresas', 
        icon: <FaUsers />, 
        path: '/superadmin/empresas',
        module: 'empresas',
      });
    }

    return items;
  };

  const menuItems = buildMenuItems();

  const isSelected = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const renderIcon = (icon) => {
    if (isValidElement(icon)) {
      return cloneElement(icon, { size: 20 });
    }
    return icon;
  };

  // Obtener tooltip para items bloqueados
  const getTooltip = (item) => {
    if (!isModuleAvailable(item.module)) {
      return `Este modulo no esta disponible en tu plan actual. Mejora a ${item.requiresPlan?.join(' o ') || 'un plan superior'} para acceder.`;
    }
    return item.text;
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
      <Box sx={{ width: currentWidth, height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {/* Badge del plan actual */}
        {!collapsed && currentPlan && (
          <Box sx={{ p: 2, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Chip
              label={`Plan ${currentPlan.nombre}`}
              color={currentPlan.id === 'premium' ? 'success' : currentPlan.id === 'pro' ? 'primary' : 'default'}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
            {isTrialExpired() && (
              <Typography variant="caption" display="block" color="error" sx={{ mt: 0.5 }}>
                Trial expirado
              </Typography>
            )}
          </Box>
        )}

        <List sx={{ flexGrow: 1, py: 1, overflowX: 'hidden', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const moduleAvailable = isModuleAvailable(item.module);
            const tooltipText = collapsed ? item.text : (moduleAvailable ? '' : getTooltip(item));

            const content = (
              <StyledListItem
                button
                key={item.text}
                component={moduleAvailable ? RouterLink : 'div'}
                to={moduleAvailable ? item.path : undefined}
                selected={isSelected(item.path)}
                disabled={!moduleAvailable}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  margin: collapsed ? '4px auto' : '4px 8px',
                  px: collapsed ? 0 : undefined,
                  width: collapsed ? `calc(${currentWidth}px - 16px)` : undefined,
                  minHeight: collapsed ? 44 : undefined,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    width: collapsed ? '100%' : 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: moduleAvailable ? 'text.primary' : 'text.disabled',
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
                {!collapsed && (
                  <>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{
                        color: moduleAvailable ? 'text.primary' : 'text.disabled',
                      }}
                    />
                    {!moduleAvailable && (
                      <LockIcon fontSize="small" sx={{ color: 'grey.400', ml: 1 }} />
                    )}
                  </>
                )}
              </StyledListItem>
            );

            if (tooltipText) {
              return (
                <Tooltip title={tooltipText} placement="right" key={item.text}>
                  <span>{content}</span>
                </Tooltip>
              );
            }

            return content;
          })}
        </List>

        {/* Link a planes */}
        {!collapsed && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <StyledListItem
              button
              component={RouterLink}
              to="/planes"
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <FaCrown size={20} />
              </ListItemIcon>
              <ListItemText 
                primary="Ver Planes" 
                primaryTypographyProps={{ fontWeight: 'bold' }}
              />
            </StyledListItem>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default PermanentSidebar;
