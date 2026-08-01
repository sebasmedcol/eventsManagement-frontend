import { Dialog, DialogContent, Box, Typography, Button, Avatar } from '@mui/material';
import { LockRounded as LockIcon, Upgrade as UpgradeIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../context/planContext';

/**
 * Modal de "Acceso bloqueado". Se muestra al iniciar sesión (si el plan ya
 * está vencido) y cada vez que una petición de gestión (POST/PUT/PATCH/DELETE)
 * recibe 403 del backend. Es descartable: "Cerrar" solo oculta la modal,
 * no cierra la sesión — el usuario sigue navegando la app en modo lectura,
 * tal como lo permite el backend (GET siempre pasa).
 */
const PlanBlockModal = ({ onClose }) => {
  const { getBlockInfo } = usePlan();
  const navigate = useNavigate();

  const blockInfo = getBlockInfo();
  const mensaje = blockInfo?.mensaje || 'Tu plan ha finalizado. Renueva tu suscripcion para continuar usando la plataforma.';

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <Dialog
      open
      maxWidth="xs"
      fullWidth
      onClose={handleClose}
      BackdropProps={{ sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.65)' } }}
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box sx={{ bgcolor: 'error.main', px: 3, py: 2.5, textAlign: 'center' }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', mx: 'auto', mb: 1 }}>
          <LockIcon fontSize="large" />
        </Avatar>
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>Acceso bloqueado</Typography>
      </Box>
      <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 3, px: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>{mensaje}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button variant="contained" color="primary" size="large" startIcon={<UpgradeIcon />} onClick={() => { handleClose(); navigate('/planes'); }}>
            Renovar plan
          </Button>
          <Button variant="text" color="inherit" startIcon={<CloseIcon />} onClick={handleClose}>
            Cerrar
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PlanBlockModal;