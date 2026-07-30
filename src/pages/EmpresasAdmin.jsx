import { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import {
  getEmpresasAdmin,
  getEmpresaUsuariosAdmin,
  aprobarEmpresaAdmin,
  rechazarEmpresaAdmin,
  bloquearEmpresaAdmin,
  desbloquearEmpresaAdmin,
} from '../services/empresaAdminService';

const EmpresasAdmin = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [openUsuarios, setOpenUsuarios] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const focusId = searchParams.get('focus') || '';

  useEffect(() => {
    if (!user || user.rol !== 'superadmin') {
      navigate('/dashboard');
      return;
    }

    const cargarEmpresas = async () => {
      try {
        setLoading(true);
        const data = await getEmpresasAdmin();
        setEmpresas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al cargar empresas');
      } finally {
        setLoading(false);
      }
    };

    cargarEmpresas();
  }, [user, navigate]);

  const handleVerUsuarios = async (empresa) => {
    try {
      setSelectedEmpresa(empresa);
      setUsuariosLoading(true);
      setOpenUsuarios(true);
      const data = await getEmpresaUsuariosAdmin(empresa._id);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al cargar usuarios de la empresa');
    } finally {
      setUsuariosLoading(false);
    }
  };

  const handleAprobar = async (empresa) => {
    try {
      const actualizada = await aprobarEmpresaAdmin(empresa._id);
      setEmpresas((prev) =>
        prev.map((e) => (e._id === actualizada._id ? actualizada : e))
      );
      toast.success('Empresa aprobada');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al aprobar la empresa');
    }
  };

  const handleRechazar = async (empresa) => {
    try {
      const confirm = window.confirm(
        '¿Rechazar esta empresa? No podrá operar hasta ser aprobada nuevamente.'
      );
      if (!confirm) return;

      const actualizada = await rechazarEmpresaAdmin(empresa._id);
      setEmpresas((prev) =>
        prev.map((e) => (e._id === actualizada._id ? actualizada : e))
      );
      toast.success('Empresa rechazada');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al rechazar la empresa');
    }
  };

  if (!user || user.rol !== 'superadmin') {
    return null;
  }

  const ordenEmpresas = [...empresas].sort((a, b) => {
    const prioridad = (estado) => {
      if (estado === 'pendiente') return 0;
      if (estado === 'aprobada') return 1;
      return 2;
    };
    const pa = prioridad(a.estadoAprobacion);
    const pb = prioridad(b.estadoAprobacion);
    if (pa !== pb) return pa - pb;
    return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
  });

  const getEstadoColor = (estado) => {
    if (estado === 'aprobada') return 'success';
    if (estado === 'pendiente') return 'warning';
    return 'error';
  };

  const getAccesoLabel = (empresa) => {
    return empresa.estado ? 'Habilitado' : 'Bloqueado';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Administración de empresas
      </Typography>

      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : ordenEmpresas.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay empresas registradas.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>NIT</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Estado Plan</TableCell>
                  <TableCell>Próx. Cobro</TableCell>
                  <TableCell>Validación</TableCell>
                  <TableCell>Acceso</TableCell>
                  <TableCell>Creación</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordenEmpresas.map((empresa) => (
                  <TableRow
                    key={empresa._id}
                    sx={
                      empresa._id === focusId
                        ? { backgroundColor: 'rgba(83,155,255,0.1)' }
                        : undefined
                    }
                  >
                    <TableCell>{empresa.nombre}</TableCell>
                    <TableCell>{empresa.nit}</TableCell>
                    <TableCell>{empresa.email}</TableCell>
                    <TableCell>{empresa.plan}</TableCell>
                    <TableCell>
                      <Chip
                        label={empresa.estadoSuscripcion || 'activa'}
                        color={
                          empresa.estadoSuscripcion === 'past_due' ? 'warning' :
                          empresa.estadoSuscripcion === 'expirada' || empresa.estadoSuscripcion === 'cancelada' ? 'error' : 'success'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {empresa.fechaProximoCobro
                        ? new Date(empresa.fechaProximoCobro).toLocaleDateString('es-CO')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={empresa.estadoAprobacion || 'aprobada'}
                        color={getEstadoColor(empresa.estadoAprobacion)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getAccesoLabel(empresa)}
                        color={empresa.estado ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {empresa.fechaCreacion
                        ? new Date(empresa.fechaCreacion).toLocaleDateString(
                            'es-CO'
                          )
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleVerUsuarios(empresa)}
                        >
                          Ver usuarios
                        </Button>

                        {(empresa.estadoAprobacion === 'pendiente' ||
                          empresa.estadoAprobacion === 'rechazada') && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleAprobar(empresa)}
                          >
                            Aprobar
                          </Button>
                        )}

                        {empresa.estadoAprobacion === 'pendiente' && (
                          <Button
                            size="small"
                            variant="text"
                            color="error"
                            onClick={() => handleRechazar(empresa)}
                          >
                            Rechazar
                          </Button>
                        )}

                        {empresa.estadoAprobacion === 'aprobada' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={async () => {
                              try {
                                const accion = empresa.estado
                                  ? 'bloquear'
                                  : 'desbloquear';
                                const confirm = window.confirm(
                                  empresa.estado
                                    ? '¿Bloquear acceso de esta empresa? Sus usuarios no podrán usar la plataforma.'
                                    : '¿Habilitar nuevamente el acceso de esta empresa?'
                                );
                                if (!confirm) return;

                                const actualizada = empresa.estado
                                  ? await bloquearEmpresaAdmin(empresa._id)
                                  : await desbloquearEmpresaAdmin(empresa._id);

                                setEmpresas((prev) =>
                                  prev.map((e) =>
                                    e._id === actualizada._id ? actualizada : e
                                  )
                                );
                                toast.success(
                                  accion === 'bloquear'
                                    ? 'Acceso bloqueado para la empresa'
                                    : 'Acceso habilitado para la empresa'
                                );
                              } catch (error) {
                                console.error(error);
                                toast.error(
                                  error.response?.data?.message || 'Error al cambiar el estado de acceso'
                                );
                              }
                            }}
                          >
                            {empresa.estado
                              ? 'Bloquear acceso'
                              : 'Habilitar acceso'}
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={openUsuarios}
        onClose={() => setOpenUsuarios(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Usuarios de {selectedEmpresa?.nombre || ''}
        </DialogTitle>
        <DialogContent dividers>
          {usuariosLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : usuarios.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay usuarios registrados para esta empresa.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Creado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>{u.nombreUsuario}</TableCell>
                    <TableCell>
                      {u.rol}
                      {u.esAdminPrincipal && (
                        <Chip
                          label="Principal"
                          color="primary"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{u.estado ? 'Activo' : 'Inactivo'}</TableCell>
                    <TableCell>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleString('es-CO')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUsuarios(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmpresasAdmin;
