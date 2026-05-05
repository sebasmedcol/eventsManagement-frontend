import { useContext } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FaUser, FaUsers, FaBoxOpen, FaShoppingCart, FaListOl, FaTachometerAlt, FaCalendarAlt } from 'react-icons/fa';
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

  const menuItems = [
    { text: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard' },
    { text: 'Clientes', icon: <FaUsers />, path: '/clientes' },
    { text: 'Productos', icon: <FaBoxOpen />, path: '/productos' },
    { text: 'Ventas', icon: <FaShoppingCart />, path: '/ventas' },
    { text: 'Consecutivos', icon: <FaListOl />, path: '/consecutivos' },
    { text: 'Cotizaciones', icon: <FaListOl />, path: '/cotizaciones' },
    { text: 'Disponibilidad', icon: <FaCalendarAlt />, path: '/disponibilidad' },
    ...(user.rol === 'admin' || user.rol === 'superadmin'
      ? [{ text: 'Usuarios', icon: <FaUser />, path: '/usuarios' }]
      : []),
    ...(user.rol === 'superadmin'
      ? [
          {
            text: 'Dashboard global',
            icon: <FaTachometerAlt />,
            path: '/superadmin/dashboard',
          },
          { text: 'Empresas', icon: <FaUsers />, path: '/superadmin/empresas' },
        ]
      : []),
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
