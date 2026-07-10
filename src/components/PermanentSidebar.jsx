import { cloneElement, isValidElement, useContext } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  FaUser, FaUsers, FaBoxOpen, FaShoppingCart, FaListOl,
  FaTachometerAlt, FaCalendarAlt, FaUserTag, FaCog, FaCrown, FaFileInvoice,
} from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { usePlan } from '../context/planContext';
import {
  Box, List, ListItem, ListItemIcon, ListItemText,
  Drawer, Tooltip, styled, Chip, Typography, Divider,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

// ─── Estilos ─────────────────────────────────────────────────────────────────

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
    '&:hover': { backgroundColor: theme.palette.action.selected },
  }),
  ...(disabled && {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  }),
}));

// ─── Componente ──────────────────────────────────────────────────────────────

const PermanentSidebar = ({ width = 240, collapsed = false }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { canAccessModule, currentPlan, isTrialExpired, planInfo } = usePlan();

  if (!user || location.pathname === '/login') return null;

  const currentWidth = collapsed ? 72 : width;

  /**
   * La empresa es SuperAdmin cuando el usuario tiene rol 'superadmin'.
   * Esos usuarios tienen acceso total y ven módulos exclusivos.
   */
  const empresaNombre =
    user?.empresa && typeof user.empresa === 'object' ? user.empresa.nombre : '';
  const isEmpresaSuperAdmin = empresaNombre === 'SuperAdmin';
  const isOwnerSuperAdmin =
    isEmpresaSuperAdmin &&
    user?.rol === 'superadmin' &&
    user?.esAdminPrincipal === true &&
    user?.nombreUsuario === 'superadmin';
  const isSuperAdmin = user?.rol === 'superadmin' && (!isEmpresaSuperAdmin || isOwnerSuperAdmin);

  // ── Verificación de permiso de rol (visible o no en sidebar) ─────────────
  // Bloqueado por ROL → NO aparece en sidebar en absoluto.
  // Bloqueado por PLAN → aparece en gris con tooltip.
  const canSee = (perm) => {
    if (!perm) return true;

    // SuperAdmin (owner) y admin principal siempre pueden ver todo
    // EXCEPCIÓN: En la empresa "SuperAdmin" solo el owner mantiene el bypass. Los demás respetan permisos.
    if (isSuperAdmin) return true;
    if (!isEmpresaSuperAdmin && user.esAdminPrincipal) return true;
    if (!isEmpresaSuperAdmin && user.rol === 'admin') return true;

    // Sistema de roles RBAC (rol_id con permisos)
    if (user.rol_id?.activo && user.rol_id?.permisos) {
      return user.rol_id.permisos?.[perm]?.ver === true;
    }

    // Legacy: permisos embebidos en el usuario
    if (user?.permisos?.[perm]?.ver === true) return true;

    return false;
  };

  // ── Verificación de acceso por plan ──────────────────────────────────────
  // SuperAdmin siempre tiene acceso a todos los módulos.
  const isModuleAvailableByPlan = (moduleName) => {
    if (isSuperAdmin) return true;
    return canAccessModule(moduleName);
  };

  // ── Construcción del menú ─────────────────────────────────────────────────
  const buildMenuItems = () => {
    const items = [];

    // Dashboard — siempre disponible
    if (canSee('dashboard')) {
      items.push({ text: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard', module: 'dashboard' });
    }

    // Clientes
    if (canSee('clientes')) {
      items.push({ text: 'Clientes', icon: <FaUsers />, path: '/clientes', module: 'clientes' });
    }

    // Productos
    if (canSee('productos')) {
      items.push({ text: 'Productos', icon: <FaBoxOpen />, path: '/productos', module: 'productos' });
    }

    // Ventas
    if (canSee('ventas')) {
      items.push({ text: 'Ventas', icon: <FaShoppingCart />, path: '/ventas', module: 'ventas' });
    }

    // Cronograma de eventos (básico)
    if (canSee('eventos')) {
      items.push({ text: 'Cronograma', icon: <FaCalendarAlt />, path: '/eventos', module: 'eventos' });
    }

    // Eventos Premium — se muestra siempre que el usuario tenga permiso de rol;
    // si el plan no lo incluye, aparece en gris con candado y tooltip.
    if (canSee('eventosPremium')) {
      items.push({
        text: 'Eventos Premium',
        icon: <FaCrown />,
        path: '/eventos-premium',
        module: 'eventosPremium',
        planTooltip: 'Eventos Premium requiere un plan Pro o superior.',
      });
    }

    // Consecutivos
    if (canSee('consecutivos')) {
      items.push({ text: 'Consecutivos', icon: <FaListOl />, path: '/consecutivos', module: 'facturacion' });
    }

    // Cotizaciones
    if (canSee('cotizaciones')) {
      items.push({ text: 'Cotizaciones', icon: <FaFileInvoice />, path: '/cotizaciones', module: 'cotizaciones' });
    }

    // Disponibilidad
    if (canSee('disponibilidad')) {
      items.push({ text: 'Disponibilidad', icon: <FaCalendarAlt />, path: '/disponibilidad', module: 'eventos' });
    }

    // Configuración — se muestra siempre que el usuario tenga permiso de rol;
    // si el plan no lo incluye (ej. básico), aparece en gris con candado.
    if (canSee('configuracion')) {
      items.push({
        text: 'Configuración',
        icon: <FaCog />,
        path: '/configuraciones',
        module: 'configuracion',
        planTooltip: 'Configuración no está disponible en el plan Básico. Mejora tu plan para acceder.',
      });
    }

    // Usuarios
    if (canSee('usuarios')) {
      items.push({ text: 'Usuarios', icon: <FaUser />, path: '/usuarios', module: 'usuarios' });
    }

    // Roles — se muestra siempre que el usuario tenga permiso de rol;
    // si el plan no lo incluye, aparece en gris con candado.
    if (canSee('roles')) {
      items.push({
        text: 'Roles',
        icon: <FaUserTag />,
        path: '/roles',
        module: 'roles',
        planTooltip: 'Roles y Permisos requiere un plan Pro o superior.',
      });
    }

    // ── Módulos exclusivos de SuperAdmin ─────────────────────────────────
    // Nunca aparecen para otras empresas, ni en gris.
    if (isSuperAdmin && canSee('dashboard_global')) {
      items.push({
        text: 'Dashboard Global',
        icon: <FaTachometerAlt />,
        path: '/superadmin/dashboard',
        module: 'dashboard_global',
      });
    }

    if (isSuperAdmin && canSee('empresas')) {
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

  const isSelected = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const renderIcon = (icon) =>
    isValidElement(icon) ? cloneElement(icon, { size: 20 }) : icon;

  // Tooltip: collapsed → nombre del ítem; bloqueado por plan → mensaje de upgrade
  const getTooltipText = (item) => {
    const available = isModuleAvailableByPlan(item.module);
    if (collapsed) {
      return available ? item.text : `${item.text} — ${item.planTooltip || 'No disponible en tu plan actual.'}`;
    }
    if (!available) {
      return item.planTooltip || 'Este módulo no está disponible en tu plan actual.';
    }
    return '';
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
              label={isSuperAdmin ? 'SuperAdmin' : `Plan ${currentPlan.nombre}`}
              color={
                isSuperAdmin ? 'error'
                : currentPlan.id === 'premium' ? 'success'
                : currentPlan.id === 'pro' ? 'primary'
                : 'default'
              }
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
            {!isSuperAdmin && isTrialExpired() && (
              <Typography variant="caption" display="block" color="error" sx={{ mt: 0.5 }}>
                Trial expirado
              </Typography>
            )}
          </Box>
        )}

        {/* Ítems del menú */}
        <List sx={{ flexGrow: 1, py: 1, overflowX: 'hidden', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const moduleAvailable = isModuleAvailableByPlan(item.module);
            const tooltipText     = getTooltipText(item);

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
                    '& svg': { width: 20, height: 20, display: 'block', color: 'inherit', flexShrink: 0 },
                  }}
                >
                  {renderIcon(item.icon)}
                </ListItemIcon>
                {!collapsed && (
                  <>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ color: moduleAvailable ? 'text.primary' : 'text.disabled' }}
                    />
                    {!moduleAvailable && (
                      <LockIcon fontSize="small" sx={{ color: 'grey.400', ml: 1 }} />
                    )}
                  </>
                )}
              </StyledListItem>
            );

            return tooltipText ? (
              <Tooltip title={tooltipText} placement="right" key={item.text}>
                <span>{content}</span>
              </Tooltip>
            ) : content;
          })}
        </List>

        {/* Botón "Ver Planes" — solo para el admin principal y no para SuperAdmin */}
        {!collapsed && !isSuperAdmin && user?.esAdminPrincipal && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <StyledListItem
              button
              component={RouterLink}
              to="/planes"
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <FaCrown size={20} />
              </ListItemIcon>
              <ListItemText primary="Ver Planes" primaryTypographyProps={{ fontWeight: 'bold' }} />
            </StyledListItem>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default PermanentSidebar;
