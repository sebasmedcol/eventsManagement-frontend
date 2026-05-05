import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import AuthContext from '../context/AuthContext';

const EmpresaPendiente = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const nombreEmpresa =
    user && user.empresa && typeof user.empresa === 'object'
      ? user.empresa.nombre
      : 'tu empresa';

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          Empresa pendiente de aprobación
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Hemos recibido la solicitud de registro de {nombreEmpresa}.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tu cuenta ha sido creada, pero aún no puedes usar la plataforma porque
          un administrador debe aprobar la empresa. Este proceso puede tardar
          hasta 24 horas. Una vez aprobada, podrás iniciar sesión normalmente.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Cerrar sesión
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EmpresaPendiente;

