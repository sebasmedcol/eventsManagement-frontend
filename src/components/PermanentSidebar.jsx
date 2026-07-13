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
  Drawer, Tooltip, styled, Chip, Typography, alpha,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

// ─── Estilos ─────────────────────────────────────────────────────────────────
// Efecto de "pintado": al pasar el mouse, el fondo del item se rellena de
// izquierda a derecha (clip-path creciendo desde el borde izquierdo). Al
// quitar el mouse (si no está seleccionado) se despinta de derecha a
// izquierda. Un item seleccionado queda pintado de forma permanente hasta
// que el usuario navega a otro.
const StyledListItem = styled(ListItem)(({ theme, selected, disabled }) => {
  const tint = theme.palette.mode === 'dark' ? 0.22 : 0.12;
  const tintStrong = theme.palette.mode === 'dark' ? 0.32 : 0.18;
  return {
    position: 'relative',
    borderRadius: '10px',
    margin: '8px 8px',
    maxWidth: '100%',
    overflow: 'hidden',
    transition: 'color 0.25s ease, transform 0.15s ease',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      zIndex: 0,
      borderRadius: 'inherit',
      background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, tint)} 0%, ${alpha(theme.palette.primary.main, tint * 0.6)} 100%)`,
      clipPath: 'inset(0 100% 0 0)',
      transition: 'clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none',
    },
    '& .MuiListItemIcon-root, & .MuiListItemText-root, & .sidebar-item-extra': {
      position: 'relative',
      zIndex: 1,
    },
    '&:hover::before': {
      clipPath: disabled ? 'inset(0 100% 0 0)' : 'inset(0 0% 0 0)',
    },
    '&:hover': {
      transform: disabled ? 'none' : 'translateX(2px)',
    },
    '&:active': {
      transform: disabled ? 'none' : 'scale(0.98)',
    },
    ...(selected && {
      boxShadow: `0 2px 10px ${alpha(theme.palette.primary.main, 0.22)}`,
      '&::before': {
        clipPath: 'inset(0 0% 0 0)',
        background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, tintStrong)} 0%, ${alpha(theme.palette.primary.main, tintStrong * 0.65)} 100%)`,
      },
    }),
    ...(disabled && {
      opacity: 0.5,
      cursor: 'not-allowed',
      pointerEvents: 'none',
    }),
  };
});

// Contenedor animado que reemplaza el "aparece/desaparece de golpe" del
// texto del menú cuando el sidebar se colapsa o expande: en vez de dejar de
// renderizarse, se desvanece y encoge en sincronía con el ancho del Drawer.
const CollapsibleLabel = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ collapsed }) => ({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  minWidth: 0,
  opacity: collapsed ? 0 : 1,
  maxWidth: collapsed ? 0 : '100%',
  transform: collapsed ? 'translateX(-6px)' : 'translateX(0)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  transition: 'opacity 0.22s ease, max-width 0.3s ease, transform 0.3s ease',
}));

// ─── Componente ──────────────────────────────────────────────────────────────

const PermanentSidebar = ({ width = 240, collapsed = false }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { canAccessModule, currentPlan, isTrialExpired, getTrialDaysRemaining } = usePlan();
  // Días restantes del plan actual. El backend expone esto hoy como
  // "días restantes de trial"; se reutiliza tal cual (sin tocar backend)
  // como aproximación de "tiempo restante del plan actual".
  const diasRestantesPlan = getTrialDaysRemaining?.();

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

    // Configuración — incluida en todos los planes, sin candado ni restricción.
    if (canSee('configuracion')) {
      items.push({ text: 'Configuración', icon: <FaCog />, path: '/configuraciones', module: 'configuracion' });
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
          transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        width: currentWidth,
        flexShrink: 0,
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      open
    >
      <Box sx={{ width: currentWidth, height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>

        {/* Badge del plan actual */}
        {/*
          Nota: CollapsibleLabel define overflow:hidden + white-space:nowrap
          para animar el colapso de los ítems del menú. Al reutilizarlo aquí,
          eso convertía este bloque en un flex-item "encogible" (overflow
          distinto de visible resetea su min-height automático a 0), por lo
          que en ventanas con poca altura el layout flex-column terminaba
          comprimiéndolo para cederle espacio a la lista de menú, ocultando
          el texto de "días restantes". Se fuerza flexShrink: 0 para que este
          bloque siempre reserve su espacio real, y se permite el wrap del
          texto para que sea responsive en vez de recortarse.
        */}
        <CollapsibleLabel
          collapsed={collapsed}
          sx={{
            display: 'block',
            width: '100%',
            flexShrink: 0,
            overflow: 'visible',
            whiteSpace: 'normal',
          }}
        >
          {currentPlan && (
            <Box sx={{ p: { xs: 1.25, sm: 2 }, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
              <Chip
                label={isSuperAdmin ? 'SuperAdmin' : `Plan ${currentPlan.nombre}`}
                color={
                  isSuperAdmin ? 'error'
                  : currentPlan.id === 'premium' ? 'success'
                  : currentPlan.id === 'pro' ? 'primary'
                  : 'default'
                }
                size="small"
                sx={{ fontWeight: 'bold', maxWidth: '100%' }}
              />
              {!isSuperAdmin && isTrialExpired() && (
                <Typography
                  variant="caption"
                  display="block"
                  color="error"
                  sx={{ mt: 0.5, whiteSpace: 'normal', wordBreak: 'break-word' }}
                >
                  Trial expirado
                </Typography>
              )}
              {!isSuperAdmin && !isTrialExpired() && Number.isFinite(diasRestantesPlan) && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ mt: 0.5, whiteSpace: 'normal', wordBreak: 'break-word' }}
                >
                  {diasRestantesPlan} {diasRestantesPlan === 1 ? 'día restante' : 'días restantes'}
                </Typography>
              )}
            </Box>
          )}
        </CollapsibleLabel>

        {/* Ítems del menú + botón "Ver Planes" — ambos dentro de la misma
            zona con scroll, para que el botón nunca quede fuera de vista
            cuando el listado de módulos es largo. */}
        <Box
          className="app-scrollbar"
          sx={{
            flexGrow: 1,
            minHeight: 0,
            overflowX: 'hidden',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <List sx={{ py: 1 }}>
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
                    margin: collapsed ? '8px auto' : '8px 8px',
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
                      transition: 'color 0.25s ease',
                      '& svg': { width: 20, height: 20, display: 'block', color: 'inherit', flexShrink: 0 },
                    }}
                  >
                    {renderIcon(item.icon)}
                  </ListItemIcon>
                  <CollapsibleLabel collapsed={collapsed}>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ color: moduleAvailable ? 'text.primary' : 'text.disabled' }}
                    />
                    {!moduleAvailable && (
                      <LockIcon fontSize="small" className="sidebar-item-extra" sx={{ color: 'grey.400', ml: 1, flexShrink: 0 }} />
                    )}
                  </CollapsibleLabel>
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
          {!isSuperAdmin && user?.esAdminPrincipal && (
            <CollapsibleLabel collapsed={collapsed} sx={{ display: 'block', width: '100%', mt: 'auto' }}>
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <StyledListItem
                  button
                  component={RouterLink}
                  to="/planes"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&::before': { display: 'none' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    <FaCrown size={20} />
                  </ListItemIcon>
                  <ListItemText primary="Ver Planes" primaryTypographyProps={{ fontWeight: 'bold' }} />
                </StyledListItem>
              </Box>
            </CollapsibleLabel>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default PermanentSidebar;