import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../context/planContext';

/**
 * Modal promocional para usuarios en el plan Free.
 *
 * A diferencia del aviso anterior (que quedaba incrustado en la pantalla
 * sin forma de cerrarlo), este se muestra como una ventana modal con el
 * fondo difuminado, una única vez por cada inicio de sesión, y se puede
 * cerrar con la "X" en la esquina superior derecha.
 */
const FreePlanUpgradeModal = () => {
  const { currentPlan, getUpgradeRecommendation } = usePlan();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!currentPlan) return;

    let justLoggedIn = false;
    try {
      justLoggedIn = sessionStorage.getItem('justLoggedIn') === '1';
    } catch {
      justLoggedIn = false;
    }

    if (justLoggedIn && currentPlan.id === 'free') {
      setOpen(true);
    }

    // Se consume el flag para que, aunque el usuario navegue entre
    // pantallas, el modal no reaparezca hasta el próximo inicio de sesión.
    if (justLoggedIn) {
      try {
        sessionStorage.removeItem('justLoggedIn');
      } catch {
        /* ignore */
      }
    }
  }, [currentPlan]);

  const handleClose = () => setOpen(false);

  const handleVerPlanes = () => {
    setOpen(false);
    navigate('/planes');
  };

  if (!currentPlan || currentPlan.id !== 'free') return null;

  const recomendacion = getUpgradeRecommendation?.();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
        },
      }}
      PaperProps={{ sx: { borderRadius: 3, position: 'relative', overflow: 'visible' } }}
    >
      <IconButton
        aria-label="Cerrar"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          color: 'text.secondary',
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ textAlign: 'center', pt: 5, pb: 4, px: 4 }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2,
            bgcolor: 'primary.main',
          }}
        >
          <UpgradeIcon fontSize="large" />
        </Avatar>

        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Estás en el plan Free
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: recomendacion ? 1 : 3 }}>
          Mejora tu plan para desbloquear más módulos, límites más altos y funciones avanzadas.
        </Typography>

        {recomendacion && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {recomendacion.razon ? `${recomendacion.razon} ` : ''}
            {recomendacion.planNombre && (
              <>
                Prueba <strong>{recomendacion.planNombre}</strong>
                {recomendacion.precio != null ? ` por solo $${recomendacion.precio}/mes` : ''}.
              </>
            )}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            Ahora no
          </Button>
          <Button variant="contained" color="primary" onClick={handleVerPlanes}>
            Ver planes
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FreePlanUpgradeModal;
