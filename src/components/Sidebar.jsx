import { useContext } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FaUser, FaUsers, FaBoxOpen, FaShoppingCart, FaListOl, FaTachometerAlt, FaCalendarAlt, FaCog, FaUserTag } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  Divider,
  Typography,
  styled
} from '@mui/material';

// Estilo para el elemento de menú seleccionado
const StyledListItem = styled(ListItem)(({ theme, selected }) => ({
  borderRadius: '8px',
  margin: '8px 16px',
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

const Sidebar = ({ open, onClose, width = 240 }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Si no hay usuario autenticado, no mostrar el sidebar
  if (!user) return null;

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
      if (permisosRol?.[perm]?.ver === true) {
        return true;
      }
      return false;
    }
    
    // Fallback a permisos embebidos del usuario (legacy)
    if (user?.permisos?.[perm]?.ver === true) {
      return true;
    }
    
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

  const drawer = (
    <Box sx={{ width, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          IAN Management
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, py: 2 }}>
        {menuItems.map((item) => (
          <StyledListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            selected={isSelected(item.path)}
            onClick={onClose}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </StyledListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', sm: 'none' },
        '& .MuiDrawer-paper': { width, borderRight: (theme) => `1px solid ${theme.palette.divider}` },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
