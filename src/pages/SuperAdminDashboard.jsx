import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  alpha,
  useTheme,
} from '@mui/material/styles';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Stack,
} from '@mui/material';
import AuthContext from '../context/AuthContext';
import {
  getEstadisticasEmpresasAdmin,
  getEmpresasAdmin,
  getEmpresaUsuariosAdmin,
  getUsuariosGlobalAdmin,
} from '../services/empresaAdminService';

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [empresasAll, setEmpresasAll] = useState([]);
  const [empresasRecientes, setEmpresasRecientes] = useState([]);
  const [usuariosAll, setUsuariosAll] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleKey, setDetalleKey] = useState('');
  const [detalleTitulo, setDetalleTitulo] = useState('');
  const [detalleFiltro, setDetalleFiltro] = useState('');
  const [detallePagina, setDetallePagina] = useState(1);

  const [usuariosEmpresaOpen, setUsuariosEmpresaOpen] = useState(false);
  const [usuariosEmpresa, setUsuariosEmpresa] = useState(null);
  const [usuariosEmpresaList, setUsuariosEmpresaList] = useState([]);
  const [usuariosEmpresaLoading, setUsuariosEmpresaLoading] = useState(false);
  const [usuariosEmpresaFiltro, setUsuariosEmpresaFiltro] = useState('');
  const [usuariosEmpresaPagina, setUsuariosEmpresaPagina] = useState(1);

  useEffect(() => {
    if (!user || user.rol !== 'superadmin') {
      navigate('/dashboard');
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [statsRes, empresasRes] = await Promise.all([
          getEstadisticasEmpresasAdmin(),
          getEmpresasAdmin(),
        ]);

        setStats(statsRes);
        const lista = Array.isArray(empresasRes) ? empresasRes : [];
        setEmpresasAll(lista);
        const recientes = [...lista]
          .sort(
            (a, b) =>
              new Date(b.fechaCreacion || 0).getTime() -
              new Date(a.fechaCreacion || 0).getTime()
          )
          .slice(0, 5);
        setEmpresasRecientes(recientes);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user, navigate]);

  const isSuperAdmin = user?.rol === 'superadmin';
  const safeStats = stats || {};
  const usuariosPorRol = safeStats.usuariosPorRol || {};

  const tarjetas = [
    {
      titulo: 'Empresas totales',
      valor: safeStats.totalEmpresas || 0,
      key: 'empresas:all',
      color: theme.palette.info,
    },
    {
      titulo: 'Pendientes',
      valor: safeStats.pendientes || 0,
      key: 'empresas:pendientes',
      color: theme.palette.warning,
    },
    {
      titulo: 'Aprobadas',
      valor: safeStats.aprobadas || 0,
      key: 'empresas:aprobadas',
      color: theme.palette.success,
    },
    {
      titulo: 'Rechazadas',
      valor: safeStats.rechazadas || 0,
      key: 'empresas:rechazadas',
      color: theme.palette.error,
    },
    {
      titulo: 'Bloqueadas',
      valor: safeStats.bloqueadas || 0,
      key: 'empresas:bloqueadas',
      color: theme.palette.secondary,
    },
    {
      titulo: 'Usuarios totales',
      valor: safeStats.totalUsuarios || 0,
      key: 'usuarios:all',
      color: theme.palette.primary,
    },
  ];

  const tarjetasUsuarios = [
    {
      titulo: 'Superadmins',
      valor: usuariosPorRol.superadmin || 0,
      key: 'usuarios:superadmin',
      color: theme.palette.secondary,
    },
    {
      titulo: 'Admins',
      valor: usuariosPorRol.admin || 0,
      key: 'usuarios:admin',
      color: theme.palette.info,
    },
    {
      titulo: 'Operadores',
      valor: usuariosPorRol.operador || 0,
      key: 'usuarios:operador',
      color: theme.palette.warning,
    },
    {
      titulo: 'Usuarios',
      valor: usuariosPorRol.usuario || 0,
      key: 'usuarios:usuario',
      color: theme.palette.success,
    },
  ];

  const openDetalle = async ({ key, titulo }) => {
    setDetalleKey(key);
    setDetalleTitulo(titulo);
    setDetalleFiltro('');
    setDetallePagina(1);
    setDetalleOpen(true);

    if (key.startsWith('usuarios:') && usuariosAll.length === 0) {
      try {
        setLoadingDetalle(true);
        const list = await getUsuariosGlobalAdmin();
        setUsuariosAll(Array.isArray(list) ? list : []);
      } finally {
        setLoadingDetalle(false);
      }
    }
  };

  const openUsuariosEmpresa = async (empresa) => {
    setUsuariosEmpresa(empresa);
    setUsuariosEmpresaFiltro('');
    setUsuariosEmpresaPagina(1);
    setUsuariosEmpresaOpen(true);
    try {
      setUsuariosEmpresaLoading(true);
      const list = await getEmpresaUsuariosAdmin(empresa._id);
      setUsuariosEmpresaList(Array.isArray(list) ? list : []);
    } finally {
      setUsuariosEmpresaLoading(false);
    }
  };

  const closeUsuariosEmpresa = () => {
    setUsuariosEmpresaOpen(false);
    setUsuariosEmpresa(null);
    setUsuariosEmpresaList([]);
    setUsuariosEmpresaFiltro('');
    setUsuariosEmpresaPagina(1);
    setUsuariosEmpresaLoading(false);
  };

  const closeDetalle = () => {
    setDetalleOpen(false);
    setDetalleKey('');
    setDetalleTitulo('');
    setDetalleFiltro('');
    setDetallePagina(1);
  };

  const empresasFiltradas = useMemo(() => {
    const q = detalleFiltro.trim().toLowerCase();
    const base = empresasAll || [];

    let list = base;
    if (detalleKey === 'empresas:pendientes') {
      list = base.filter((e) => (e.estadoAprobacion || '') === 'pendiente');
    } else if (detalleKey === 'empresas:aprobadas') {
      list = base.filter((e) => (e.estadoAprobacion || '') === 'aprobada');
    } else if (detalleKey === 'empresas:rechazadas') {
      list = base.filter((e) => (e.estadoAprobacion || '') === 'rechazada');
    } else if (detalleKey === 'empresas:bloqueadas') {
      list = base.filter((e) => e.estado === false);
    }

    if (!q) return list;
    return list.filter((e) => {
      const nombre = String(e.nombre || '').toLowerCase();
      const email = String(e.email || '').toLowerCase();
      const plan = String(e.plan || '').toLowerCase();
      const estadoAprobacion = String(e.estadoAprobacion || '').toLowerCase();
      return (
        nombre.includes(q) ||
        email.includes(q) ||
        plan.includes(q) ||
        estadoAprobacion.includes(q)
      );
    });
  }, [detalleFiltro, detalleKey, empresasAll]);

  const usuariosFiltrados = useMemo(() => {
    const q = detalleFiltro.trim().toLowerCase();
    const base = usuariosAll || [];

    let list = base;
    if (detalleKey === 'usuarios:superadmin') {
      list = base.filter((u) => u.rol === 'superadmin');
    } else if (detalleKey === 'usuarios:admin') {
      list = base.filter((u) => u.rol === 'admin');
    } else if (detalleKey === 'usuarios:operador') {
      list = base.filter((u) => u.rol === 'operador');
    } else if (detalleKey === 'usuarios:usuario') {
      list = base.filter((u) => u.rol === 'usuario');
    }

    if (!q) return list;
    return list.filter((u) => {
      const nombreUsuario = String(u.nombreUsuario || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const rol = String(u.rol || '').toLowerCase();
      const empresaNombre = String(u.empresa?.nombre || '').toLowerCase();
      return (
        nombreUsuario.includes(q) ||
        email.includes(q) ||
        rol.includes(q) ||
        empresaNombre.includes(q)
      );
    });
  }, [detalleFiltro, detalleKey, usuariosAll]);

  const rowsPerPage = 5;
  const detalleRows = detalleKey.startsWith('empresas:') ? empresasFiltradas : usuariosFiltrados;
  const totalPages = Math.max(1, Math.ceil((detalleRows?.length || 0) / rowsPerPage));
  const currentPage = Math.min(detallePagina, totalPages);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const pageRows = (detalleRows || []).slice(startIndex, startIndex + rowsPerPage);

  const usuariosEmpresaFiltrados = useMemo(() => {
    const q = usuariosEmpresaFiltro.trim().toLowerCase();
    const base = usuariosEmpresaList || [];
    if (!q) return base;
    return base.filter((u) => {
      const nombreUsuario = String(u.nombreUsuario || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const rol = String(u.rol || '').toLowerCase();
      const telefono = String(u.telefono || '').toLowerCase();
      return (
        nombreUsuario.includes(q) ||
        email.includes(q) ||
        rol.includes(q) ||
        telefono.includes(q)
      );
    });
  }, [usuariosEmpresaFiltro, usuariosEmpresaList]);

  const usuariosEmpresaTotalPages = Math.max(
    1,
    Math.ceil((usuariosEmpresaFiltrados.length || 0) / rowsPerPage)
  );
  const usuariosEmpresaCurrentPage = Math.min(
    usuariosEmpresaPagina,
    usuariosEmpresaTotalPages
  );
  const usuariosEmpresaStart = (usuariosEmpresaCurrentPage - 1) * rowsPerPage;
  const usuariosEmpresaPageRows = usuariosEmpresaFiltrados.slice(
    usuariosEmpresaStart,
    usuariosEmpresaStart + rowsPerPage
  );

  if (!isSuperAdmin) {
    return null;
  }

  if (loading || !stats) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Dashboard global
      </Typography>

      <Grid container spacing={3}>
        {tarjetas.map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.titulo}>
            <Card
              sx={{
                position: 'relative',
                overflow: 'hidden',
                p: 3,
                cursor: 'pointer',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: `linear-gradient(135deg, ${alpha(t.color.main, 0.16)} 0%, ${alpha(t.color.main, 0.06)} 100%)`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: (theme) => theme.shadows[8] },
                '::after': {
                  content: '""',
                  position: 'absolute',
                  right: -40,
                  bottom: -40,
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: `radial-gradient(${alpha(t.color.main, 0.25)}, transparent 60%)`,
                  pointerEvents: 'none',
                },
              }}
              onClick={() => openDetalle({ key: t.key, titulo: t.titulo })}
            >
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: alpha(t.color.main, 0.9), fontWeight: 700 }}>
                  {t.titulo}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 800, letterSpacing: '-0.5px' }}>
                  {t.valor}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Usuarios por rol
        </Typography>
        <Grid container spacing={3}>
          {tarjetasUsuarios.map((t) => (
            <Grid item xs={12} sm={6} md={3} key={t.titulo}>
              <Card
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  p: 2,
                  cursor: 'pointer',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: `linear-gradient(135deg, ${alpha(t.color.main, 0.16)} 0%, ${alpha(t.color.main, 0.06)} 100%)`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: (theme) => theme.shadows[8] },
                  '::after': {
                    content: '""',
                    position: 'absolute',
                    right: -40,
                    bottom: -40,
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: `radial-gradient(${alpha(t.color.main, 0.25)}, transparent 60%)`,
                    pointerEvents: 'none',
                  },
                }}
                onClick={() => openDetalle({ key: t.key, titulo: t.titulo })}
              >
                <CardContent>
                  <Typography variant="subtitle2" sx={{ color: alpha(t.color.main, 0.9), fontWeight: 700 }}>
                    {t.titulo}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1, fontWeight: 800, letterSpacing: '-0.5px' }}>
                    {t.valor}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Últimas empresas registradas
        </Typography>
        <Paper sx={{ p: 2 }}>
          {empresasRecientes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay empresas registradas.
            </Typography>
          ) : (
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Empresa
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Estado
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Creación
                </Typography>
              </Grid>
              {empresasRecientes.map((e) => (
                <Grid item xs={12} key={e._id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ flexBasis: '33%' }}>
                      <Typography variant="body2">{e.nombre}</Typography>
                    </Box>
                    <Box sx={{ flexBasis: '25%' }}>
                      <Typography variant="body2" noWrap>
                        {e.email}
                      </Typography>
                    </Box>
                    <Box sx={{ flexBasis: '17%' }}>
                      <Typography variant="body2">
                        {e.estadoAprobacion || 'aprobada'}
                      </Typography>
                    </Box>
                    <Box sx={{ flexBasis: '25%' }}>
                      <Typography variant="body2">
                        {e.fechaCreacion
                          ? new Date(e.fechaCreacion).toLocaleDateString(
                              'es-CO'
                            )
                          : '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Box>

      <Dialog open={detalleOpen} onClose={closeDetalle} fullWidth maxWidth="md">
        <DialogTitle>{detalleTitulo}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Filtrar"
              value={detalleFiltro}
              onChange={(e) => {
                setDetalleFiltro(e.target.value);
                setDetallePagina(1);
              }}
            />
          </Box>

          {loadingDetalle ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  {detalleKey.startsWith('empresas:') ? (
                    <TableRow>
                      <TableCell>Empresa</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Acceso</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Empresa</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  )}
                </TableHead>
                <TableBody>
                  {pageRows.map((row) =>
                    detalleKey.startsWith('empresas:') ? (
                      <TableRow key={row._id} hover>
                        <TableCell>{row.nombre}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.plan}</TableCell>
                        <TableCell>{row.estadoAprobacion || 'aprobada'}</TableCell>
                        <TableCell>{row.estado === false ? 'Bloqueado' : 'Habilitado'}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openUsuariosEmpresa(row)}
                          >
                            Ver usuarios
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={row._id} hover>
                        <TableCell>{row.nombreUsuario}</TableCell>
                        <TableCell>{row.email || '-'}</TableCell>
                        <TableCell>{row.rol}</TableCell>
                        <TableCell>{row.empresa?.nombre || '-'}</TableCell>
                        <TableCell>{row.estado === false ? 'Inactivo' : 'Activo'}</TableCell>
                      </TableRow>
                    )
                  )}
                  {pageRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay resultados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Total: {detalleRows?.length || 0}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, p) => setDetallePagina(p)}
                color="primary"
                size="small"
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetalle}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={usuariosEmpresaOpen} onClose={closeUsuariosEmpresa} fullWidth maxWidth="md">
        <DialogTitle>
          Usuarios de {usuariosEmpresa?.nombre || ''}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Filtrar"
              value={usuariosEmpresaFiltro}
              onChange={(e) => {
                setUsuariosEmpresaFiltro(e.target.value);
                setUsuariosEmpresaPagina(1);
              }}
            />
          </Box>

          {usuariosEmpresaLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usuariosEmpresaPageRows.map((u) => (
                    <TableRow key={u._id} hover>
                      <TableCell>{u.nombreUsuario}</TableCell>
                      <TableCell>{u.email || '-'}</TableCell>
                      <TableCell>
                        {(u.indicativo || '') + (u.telefono || '') || '-'}
                      </TableCell>
                      <TableCell>{u.rol}</TableCell>
                      <TableCell>{u.estado === false ? 'Inactivo' : 'Activo'}</TableCell>
                    </TableRow>
                  ))}
                  {usuariosEmpresaPageRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay resultados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Total: {usuariosEmpresaFiltrados.length}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Pagination
                count={usuariosEmpresaTotalPages}
                page={usuariosEmpresaCurrentPage}
                onChange={(_, p) => setUsuariosEmpresaPagina(p)}
                color="primary"
                size="small"
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUsuariosEmpresa}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SuperAdminDashboard;
