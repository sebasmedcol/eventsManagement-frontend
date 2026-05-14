import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import PermanentSidebar from './components/PermanentSidebar';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import { useEffect, useMemo, useState } from 'react';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteForm from './pages/ClienteForm';
import Productos from './pages/Productos';
import ProductoForm from './pages/ProductoForm';
import Ventas from './pages/Ventas';
import VentaForm from './pages/VentaForm';
import VentaDetalle from './pages/VentaDetalle';
import Eventos from './pages/Eventos';
import EventosPremium from './pages/EventosPremium';
import GestionEventoPremium from './pages/GestionEventoPremium';
import ConsecutivoNavigation from './pages/consecutivo/ConsecutivoNavigation';
import Usuarios from './pages/Usuarios';
import Roles from './pages/Roles';
import Cotizaciones from './pages/Cotizaciones';
import CotizacionDetalle from './pages/CotizacionDetalle';
import DisponibilidadProducto from './pages/DisponibilidadProducto';
import EmpresasAdmin from './pages/EmpresasAdmin';
import EmpresaPendiente from './pages/EmpresaPendiente';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Configuraciones from './pages/Configuraciones';

// Design tokens inspired by a modern admin template
const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: { main: '#5D87FF', light: '#7AA4FF', dark: '#2F5BFF', contrastText: '#fff' },
    secondary: { main: '#8A5DFF', light: '#A186FF', dark: '#6B35FF', contrastText: '#170B36' },
    success: { main: '#13DEB9', light: '#4EE8CE', dark: '#0FB597', contrastText: '#003B32' },
    warning: { main: '#FFAE1F', light: '#FFC462', dark: '#E08D00', contrastText: '#3D2B00' },
    error:   { main: '#FA896B', light: '#FFB09C', dark: '#E76B49', contrastText: '#3E120B' },
    info:    { main: '#539BFF', light: '#84B7FF', dark: '#1C6BFF', contrastText: '#0A1B3A' },
    accent:  { main: '#49BEFF' },
    neutral: { main: '#64748B' },
    ...(mode === 'light'
      ? {
          background: { default: '#F6F9FC', paper: '#FFFFFF' },
          text: { primary: '#111827', secondary: '#6B7280' },
          divider: 'rgba(145, 158, 171, 0.24)'
        }
      : {
          background: { default: '#0b1220', paper: '#111827' },
          text: { primary: '#E5E7EB', secondary: '#9CA3AF' },
          divider: 'rgba(145, 158, 171, 0.24)'
        }),
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: 'linear-gradient(90deg, rgba(1,62,80,0.75) 0%, rgba(251,107,18,0.5) 100%)',
          color: '#ffffff',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        }),
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          border: theme.palette.mode === 'light' ? '1px solid #eef2f6' : '1px solid rgba(255,255,255,0.06)'
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: theme.palette.mode === 'light' ? '0 2px 8px rgba(16,24,40,0.06)' : '0 2px 8px rgba(0,0,0,0.35)',
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 16,
          paddingBlock: 8,
          boxShadow: 'none',
        },
        containedPrimary: {
          boxShadow: '0 6px 16px rgba(93,135,255,0.35)',
        },
        containedSecondary: {
          boxShadow: '0 6px 16px rgba(138,93,255,0.35)',
        },
        containedSuccess: {
          boxShadow: '0 6px 16px rgba(19,222,185,0.35)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(1, 62, 80, 0.3)' : '#ffffff',
          color: theme.palette.text.primary,
          backdropFilter: theme.palette.mode === 'dark' ? 'blur(6px)' : 'none',
        }),
      },
    },
  },
});

const GlobalWatermark = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  return (
    <img 
      src={isAuthPage ? "/LogoFondoLogin.png" : "/logo.png"} 
      alt="Marca de agua" 
      className="global-watermark" 
      style={isAuthPage ? { borderRadius: '24px' } : {}}
    />
  );
};

function App() {
  // Color mode with persistence
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('color-mode');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === '1';
  });

  useEffect(() => {
    localStorage.setItem('color-mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  // Sidebar width
  const drawerWidth = 240;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Navbar
              onToggleColorMode={() => setMode((p) => (p === 'light' ? 'dark' : 'light'))}
              mode={mode}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebarCollapsed={() => setSidebarCollapsed((p) => !p)}
            />
            <PermanentSidebar width={drawerWidth} collapsed={sidebarCollapsed} />
            <Box
              component="main"
              className="print-main main-watermark-wrapper"
              sx={{
                flexGrow: 1,
                minWidth: 0,
                mt: '64px' // Altura del AppBar
              }}
            >
              {/* Marca de agua global detrás del contenido */}
              <GlobalWatermark />

              <Container maxWidth={false} disableGutters sx={{ py: 2, px: 0 }} className="with-watermark-content">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/empresa-pendiente" element={<EmpresaPendiente />} />
                  
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/superadmin/dashboard" element={
                    <ProtectedRoute>
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Rutas de Clientes */}
                  <Route path="/clientes" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'clientes', accion: 'ver' }}>
                      <Clientes />
                    </ProtectedRoute>
                  } />
                  <Route path="/clientes/nuevo" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'clientes', accion: 'crear' }}>
                      <ClienteForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/clientes/editar/:id" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'clientes', accion: 'editar' }}>
                      <ClienteForm />
                    </ProtectedRoute>
                  } />
                  
                  {/* Rutas de Productos */}
                  <Route path="/productos" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'productos', accion: 'ver' }}>
                      <Productos />
                    </ProtectedRoute>
                  } />
                  <Route path="/productos/nuevo" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'productos', accion: 'crear' }}>
                      <ProductoForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/productos/editar/:id" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'productos', accion: 'editar' }}>
                      <ProductoForm />
                    </ProtectedRoute>
                  } />
                  
                  {/* Rutas de Ventas */}
                  <Route path="/ventas" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'ventas', accion: 'ver' }}>
                      <Ventas />
                    </ProtectedRoute>
                  } />
                  <Route path="/ventas/nueva" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'ventas', accion: 'crear' }}>
                      <VentaForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/ventas/editar/:id" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'ventas', accion: 'editar' }}>
                      <VentaForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/ventas/ver/:id" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'ventas', accion: 'ver' }}>
                      <VentaDetalle />
                    </ProtectedRoute>
                  } />

                  {/* Rutas de Consecutivos */}
                  <Route path="/consecutivos" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'consecutivos', accion: 'ver' }}>
                      <ConsecutivoNavigation />
                    </ProtectedRoute>
                  } />

                  {/* Rutas de Eventos */}
                  <Route path="/eventos" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'eventos', accion: 'ver' }}>
                      <Eventos />
                    </ProtectedRoute>
                  } />
                  <Route path="/eventos-premium" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'eventos', accion: 'ver' }}>
                      <EventosPremium />
                    </ProtectedRoute>
                  } />
                  <Route path="/eventos-premium/:id/gestion" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'eventos', accion: 'editar' }}>
                      <GestionEventoPremium />
                    </ProtectedRoute>
                  } />

                  {/* Rutas de Usuarios (solo admin, backend valida) */}
                  <Route path="/usuarios" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'usuarios', accion: 'ver' }}>
                      <Usuarios />
                    </ProtectedRoute>
                  } />

                  {/* Rutas de Roles (solo admin, backend valida) */}
                  <Route path="/roles" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'roles', accion: 'ver' }}>
                      <Roles />
                    </ProtectedRoute>
                  } />

                  {/* Rutas de Cotizaciones */}
                  <Route path="/cotizaciones" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'cotizaciones', accion: 'ver' }}>
                      <Cotizaciones />
                    </ProtectedRoute>
                  } />
                  <Route path="/cotizaciones/ver/:id" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'cotizaciones', accion: 'ver' }}>
                      <CotizacionDetalle />
                    </ProtectedRoute>
                  } />

                  {/* Rutas de Disponibilidad de Productos */}
                  <Route path="/disponibilidad" element={
                    <ProtectedRoute requiredPermission={{ modulo: 'disponibilidad', accion: 'ver' }}>
                      <DisponibilidadProducto />
                    </ProtectedRoute>
                  } />

                  {/* Rutas de Superadmin */}
                  <Route path="/superadmin/empresas" element={
                    <ProtectedRoute>
                      <EmpresasAdmin />
                    </ProtectedRoute>
                  } />

                  <Route path="/configuraciones" element={
                    <ProtectedRoute>
                      <Configuraciones />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Container>
            </Box>
          </Box>
          <ToastContainer position="bottom-right" />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    );
  }

  export default App;
