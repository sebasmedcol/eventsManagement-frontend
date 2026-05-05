import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import AuthContext from '../context/AuthContext';
import {
  getEstadisticasEmpresasAdmin,
  getEmpresasAdmin,
} from '../services/empresaAdminService';

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [empresasRecientes, setEmpresasRecientes] = useState([]);

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

  if (!user || user.rol !== 'superadmin') {
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

  const usuariosPorRol = stats.usuariosPorRol || {};

  const tarjetas = [
    {
      titulo: 'Empresas totales',
      valor: stats.totalEmpresas,
    },
    {
      titulo: 'Pendientes',
      valor: stats.pendientes,
    },
    {
      titulo: 'Aprobadas',
      valor: stats.aprobadas,
    },
    {
      titulo: 'Rechazadas',
      valor: stats.rechazadas,
    },
    {
      titulo: 'Bloqueadas',
      valor: stats.bloqueadas,
    },
    {
      titulo: 'Usuarios totales',
      valor: stats.totalUsuarios,
    },
  ];

  const tarjetasUsuarios = [
    {
      titulo: 'Superadmins',
      valor: usuariosPorRol.superadmin || 0,
    },
    {
      titulo: 'Admins',
      valor: usuariosPorRol.admin || 0,
    },
    {
      titulo: 'Operadores',
      valor: usuariosPorRol.operador || 0,
    },
    {
      titulo: 'Usuarios',
      valor: usuariosPorRol.usuario || 0,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Dashboard global
      </Typography>

      <Grid container spacing={3}>
        {tarjetas.map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.titulo}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.titulo}
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {t.valor}
              </Typography>
            </Paper>
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
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t.titulo}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {t.valor}
                </Typography>
              </Paper>
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
    </Container>
  );
};

export default SuperAdminDashboard;

