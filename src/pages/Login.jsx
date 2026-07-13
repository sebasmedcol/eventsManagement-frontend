import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Fade from '@mui/material/Fade';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Duraciones de la transición de bienvenida al iniciar sesión: el
// formulario se desvanece mientras aparece el saludo, y luego de un
// instante breve se navega al dashboard (efecto tipo "cambio de
// diapositiva", suave y no muy tardado).
const FADE_DURATION = 380;
const WELCOME_HOLD_MS = 4620;

const Login = () => {
  const [formData, setFormData] = useState({
    nombreUsuario: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const skipAutoRedirect = useRef(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const { nombreUsuario, password } = formData;
  const { login, isAuthenticated, error, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirigir si ya está autenticado (por ejemplo, al entrar directamente
    // a /login con una sesión válida). Si el propio formulario disparó el
    // login, la navegación la controla la secuencia de bienvenida en su
    // lugar, para poder mostrar la transición.
    if (isAuthenticated && !skipAutoRedirect.current) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Mostrar error si existe
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!nombreUsuario || !password) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    skipAutoRedirect.current = true;
    const success = await login(nombreUsuario, password);

    if (success) {
      setShowWelcome(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, FADE_DURATION + WELCOME_HOLD_MS);
    } else {
      skipAutoRedirect.current = false;
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ position: 'relative' }}>
      <Fade in={!showWelcome} timeout={FADE_DURATION} unmountOnExit>
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                <LockOutlinedIcon />
              </Avatar>
              <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
                NExt Event
              </Typography>
              <Typography component="h2" variant="h6" sx={{ mb: 3 }}>
                Iniciar Sesión
              </Typography>
            </Box>

            <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="nombreUsuario"
                label="Usuario"
                name="nombreUsuario"
                autoComplete="username"
                autoFocus
                value={nombreUsuario}
                onChange={onChange}
                variant="outlined"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={onChange}
                variant="outlined"
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Ingresar'
                )}
              </Button>

              <Button
                fullWidth
                variant="text"
                sx={{ mt: 1 }}
                component={RouterLink}
                to="/register"
              >
                Crear nueva empresa
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              &copy; {new Date().getFullYear()} Next Event. Todos los derechos reservados.
            </Typography>
          </Paper>
        </Box>
      </Fade>

      <Fade in={showWelcome} timeout={FADE_DURATION}>
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 3,
            zIndex: (theme) => theme.zIndex.modal + 1,
          }}
        >
          <Avatar sx={{ width: 96, height: 96, mb: 3, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon sx={{ fontSize: 48 }} />
          </Avatar>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
            ¡Bienvenido{nombreUsuario ? `, ${nombreUsuario}` : ''}!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            Estamos preparando tu espacio de trabajo…
          </Typography>
          <CircularProgress size={32} sx={{ mt: 4 }} />
        </Box>
      </Fade>
    </Container>
  );
};

export default Login;
