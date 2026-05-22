import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Tooltip,
  Collapse,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Build as BuildIcon,
  ShoppingCart as ShoppingCartIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  CalendarMonth as CalendarIcon,
  Warehouse as WarehouseIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  AssessmentOutlined as ReportsAdvancedIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  IntegrationInstructions as IntegrationIcon,
  Api as ApiIcon,
  Backup as BackupIcon,
  History as HistoryIcon,
  ExpandLess,
  ExpandMore,
  Lock as LockIcon,
  Upgrade as UpgradeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';
import { PlanBadge, UsageSummary } from '../components/plan';

const DRAWER_WIDTH = 260;

/**
 * Configuración de items del sidebar con sus módulos asociados
 */
const menuItems = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon, module: 'dashboard' },
      { label: 'Calendario', path: '/calendario', icon: CalendarIcon, module: 'calendario' },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { label: 'Clientes', path: '/clientes', icon: PeopleIcon, module: 'clientes' },
      { label: 'Productos', path: '/productos', icon: InventoryIcon, module: 'productos' },
      { label: 'Servicios', path: '/servicios', icon: BuildIcon, module: 'servicios' },
      { label: 'Eventos', path: '/eventos', icon: EventIcon, module: 'eventos' },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { label: 'Ventas', path: '/ventas', icon: ShoppingCartIcon, module: 'ventas' },
      { label: 'Cotizaciones', path: '/cotizaciones', icon: DescriptionIcon, module: 'cotizaciones' },
      { label: 'Facturación', path: '/facturacion', icon: ReceiptIcon, module: 'facturacion' },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Inventario', path: '/inventario', icon: WarehouseIcon, module: 'inventario' },
      { label: 'Proveedores', path: '/proveedores', icon: LocalShippingIcon, module: 'proveedores' },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { label: 'Reportes', path: '/reportes', icon: AssessmentIcon, module: 'reportes' },
      { label: 'Reportes Avanzados', path: '/reportes-avanzados', icon: ReportsAdvancedIcon, module: 'reportesAvanzados' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Usuarios', path: '/usuarios', icon: GroupIcon, module: 'usuarios' },
      { label: 'Roles', path: '/roles', icon: SecurityIcon, module: 'roles' },
      { label: 'Configuración', path: '/configuracion', icon: SettingsIcon, module: 'configuracion' },
    ],
  },
  {
    title: 'Avanzado',
    items: [
      { label: 'Integraciones', path: '/integraciones', icon: IntegrationIcon, module: 'integraciones' },
      { label: 'API', path: '/api', icon: ApiIcon, module: 'api' },
      { label: 'Respaldos', path: '/backups', icon: BackupIcon, module: 'backups' },
      { label: 'Auditoría', path: '/auditoria', icon: HistoryIcon, module: 'auditoria' },
    ],
  },
];

/**
 * Item del sidebar con soporte para restricciones de plan
 */
const SidebarItem = ({ item, isActive, onNavigate }) => {
  const { canAccessModule, getModuleRestrictionMessage } = usePlan();
  const theme = useTheme();
  
  const hasAccess = canAccessModule(item.module);
  const restrictionMessage = getModuleRestrictionMessage(item.module);
  const Icon = item.icon;
  
  const handleClick = () => {
    if (hasAccess) {
      onNavigate(item.path);
    }
  };
  
  const itemContent = (
    <ListItemButton
      onClick={handleClick}
      selected={isActive}
      disabled={!hasAccess}
      sx={{
        borderRadius: 1,
        mx: 1,
        mb: 0.5,
        '&.Mui-selected': {
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.18),
          },
          '& .MuiListItemIcon-root': {
            color: 'primary.main',
          },
          '& .MuiListItemText-primary': {
            color: 'primary.main',
            fontWeight: 600,
          },
        },
        '&.Mui-disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
        },
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.06),
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 40,
          color: isActive ? 'primary.main' : 'text.secondary',
        }}
      >
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{
          fontSize: '0.875rem',
          fontWeight: isActive ? 600 : 400,
        }}
      />
      {!hasAccess && (
        <LockIcon 
          fontSize="small" 
          sx={{ 
            color: 'grey.400',
            fontSize: 16,
          }} 
        />
      )}
    </ListItemButton>
  );
  
  // Si no tiene acceso, envolver en tooltip
  if (!hasAccess && restrictionMessage) {
    return (
      <Tooltip 
        title={restrictionMessage} 
        placement="right"
        arrow
      >
        <Box component="span" sx={{ display: 'block' }}>
          {itemContent}
        </Box>
      </Tooltip>
    );
  }
  
  return itemContent;
};

/**
 * Grupo de items del sidebar
 */
const SidebarGroup = ({ group, currentPath, onNavigate }) => {
  const { canAccessModule } = usePlan();
  const [open, setOpen] = React.useState(true);
  
  // Verificar si al menos un item del grupo tiene acceso
  const hasAnyAccess = group.items.some(item => canAccessModule(item.module));
  
  // Verificar si algún item del grupo está activo
  const hasActiveItem = group.items.some(item => currentPath === item.path);
  
  return (
    <Box sx={{ mb: 1 }}>
      <ListItem
        sx={{
          px: 2,
          py: 0.5,
          cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <ListItemText
          primary={group.title}
          primaryTypographyProps={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        />
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {group.items.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
              isActive={currentPath === item.path}
              onNavigate={onNavigate}
            />
          ))}
        </List>
      </Collapse>
    </Box>
  );
};

/**
 * Sidebar principal con restricciones de plan integradas
 */
const PermanentSidebarWithPlan = ({ 
  open = true, 
  onClose,
  variant = 'permanent',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPlan, isTrialActive, getTrialDaysRemaining } = usePlan();
  const theme = useTheme();
  
  const handleNavigate = (path) => {
    navigate(path);
    if (variant === 'temporary' && onClose) {
      onClose();
    }
  };
  
  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* Logo y nombre de la empresa */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="primary">
          NextEvents
        </Typography>
      </Box>
      
      {/* Badge del plan actual */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <PlanBadge showName />
        {isTrialActive() && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ ml: 1 }}
          >
            ({getTrialDaysRemaining()} días)
          </Typography>
        )}
      </Box>
      
      {/* Items del menú */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1,
        }}
      >
        <List>
          {menuItems.map((group, index) => (
            <SidebarGroup
              key={group.title}
              group={group}
              currentPath={location.pathname}
              onNavigate={handleNavigate}
            />
          ))}
        </List>
      </Box>
      
      {/* Sección inferior con uso del plan */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <UsageSummary resources={['clientes', 'productos', 'ventas']} />
        
        {/* Botón de upgrade */}
        {currentPlan?.id !== 'premium' && (
          <Box sx={{ mt: 2 }}>
            <ListItemButton
              onClick={() => handleNavigate('/planes')}
              sx={{
                borderRadius: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <UpgradeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Mejorar plan"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              />
            </ListItemButton>
          </Box>
        )}
      </Box>
    </Box>
  );
  
  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: variant === 'temporary' ? 8 : 'none',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default PermanentSidebarWithPlan;
