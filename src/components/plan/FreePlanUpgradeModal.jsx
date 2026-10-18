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
import { useAuth } from '../../context/AuthContext';


const PROMOTION_MODAL_STORAGE_KEY = 'free_plan_promotion_last_shown';
const PROMOTION_INTERVAL_DAYS = 30;

/**
 * Modal promocional para usuarios en el plan Free.

 *
 * A diferencia del aviso anterior (que quedaba incrustado en la pantalla
 * sin forma de cerrarlo), este se muestra como una ventana modal con el
 * fondo difuminado, una única vez por cada inicio de sesión, y se puede
 * cerrar con la "X" en la esquina superior derecha.
 */
const FreePlanUpgradeModal = () => {
  const { currentPlan } = usePlan();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    let shouldShow = true;
    try {
      const lastShownAt = Number(localStorage.getItem(PROMOTION_MODAL_STORAGE_KEY));
      const intervalMs = PROMOTION_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
      shouldShow = !Number.isFinite(lastShownAt) || Date.now() - lastShownAt >= intervalMs;

      if (shouldShow) {
        localStorage.setItem(PROMOTION_MODAL_STORAGE_KEY, String(Date.now()));
      }
    } catch {
      shouldShow = true;
    }

    if (shouldShow) setOpen(true);
  }, [authLoading, isAuthenticated]);


  const handleClose = () => setOpen(false);

  const handleVerPlanes = () => {
    setOpen(false);
    navigate('/planes');
  };

  if (!isAuthenticated) return null;

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
          Dale un plus a tu negocio
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Considera usar nuestros planes de mayor capacidad para acceder a más módulos,
          límites más altos y funciones avanzadas.
        </Typography>


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
