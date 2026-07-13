import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  WarningAmberRounded as WarningIcon,
  Upgrade as UpgradeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../context/planContext';
import { useAppTheme } from '../../context/ThemeContext';

const TRIAL_TOTAL_DIAS = 7;

/**
 * Modal de cuenta regresiva de prueba.
 *
 * Reemplaza el antiguo banner fijo en la parte superior (Alert de MUI a lo
 * ancho de la pantalla) por una ventana modal que se muestra sobre un fondo
 * difuminado, usando la paleta y el degradado del tema activo del usuario
 * (el mismo `appBarGradient` que usa la barra de navegación) para que se
 * sienta consistente con el resto del aplicativo, sin importar el tema o el
 * modo claro/oscuro seleccionados.
 */
export const TrialModal = ({ open, onClose }) => {
  const { isTrialActive, isTrialExpired, getTrialDaysRemaining, trialInfo } = usePlan();
  const { currentThemeTokens } = useAppTheme();
  const navigate = useNavigate();

  if (!trialInfo) return null;
  if (isTrialExpired()) return null;
  if (!isTrialActive()) return null;

  const diasRestantes = getTrialDaysRemaining();
  if (diasRestantes > TRIAL_TOTAL_DIAS) return null;

  const esUrgente = diasRestantes <= 3;
  const colorSeveridad = esUrgente ? 'warning' : 'info';
  const progreso = Math.max(
    0,
    Math.min(100, ((TRIAL_TOTAL_DIAS - diasRestantes) / TRIAL_TOTAL_DIAS) * 100)
  );

  const titulo =
    diasRestantes === 0
      ? 'Último día de prueba'
      : diasRestantes === 1
        ? 'Queda 1 día de prueba'
        : `Quedan ${diasRestantes} días de prueba`;

  const handleVerPlanes = () => {
    onClose?.();
    navigate('/planes');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
        },
      }}
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* Cabecera con el degradado del tema activo, igual al de la Navbar */}
      <Box
        sx={{
          background: currentThemeTokens.appBarGradient,
          px: 3,
          py: 2.5,
          position: 'relative',
        }}
      >
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.85)' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: 'rgba(255,255,255,0.18)',
            color: '#fff',
            mb: 1,
          }}
        >
          {esUrgente ? <WarningIcon /> : <AccessTimeIcon />}
        </Avatar>

        <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
          {titulo}
        </Typography>
      </Box>

      <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 3, px: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Aprovecha para explorar todas las funcionalidades antes de que termine tu periodo de prueba.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={progreso}
            color={colorSeveridad}
            sx={{ height: 6, borderRadius: 1, bgcolor: 'action.hover' }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Más tarde
          </Button>
          <Button
            variant="contained"
            color={colorSeveridad}
            startIcon={<UpgradeIcon />}
            onClick={handleVerPlanes}
          >
            Ver planes
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TrialModal;
