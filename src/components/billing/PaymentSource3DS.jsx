import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { getPaymentSourceStatus } from '../../services/subscriptionService';
import { extractChallengeHtml } from '../../utils/decodeIframeHtml';

const FINAL_STATUSES = ['AVAILABLE', 'DECLINED', 'ERROR'];

export default function PaymentSource3DS({
  paymentSourceId,
  initialThreeDsAuth,
  onComplete,
  onError,
  pollingInterval = 2500,
  pollingTimeout = 180000,
}) {
  const [status, setStatus] = useState('PENDING');
  const [threeDsAuth, setThreeDsAuth] = useState(initialThreeDsAuth || null);
  const [iframeHtml, setIframeHtml] = useState(extractChallengeHtml(initialThreeDsAuth));
  const cancelledRef = useRef(false);

  const processAuth = useCallback(
    (auth, sourceStatus) => {
      if (auth) {
        setThreeDsAuth(auth);
        setIframeHtml(extractChallengeHtml(auth));
      } else {
        setThreeDsAuth(null);
        setIframeHtml(null);
      }

      if (FINAL_STATUSES.includes(sourceStatus)) {
        onComplete(sourceStatus);
      }
    },
    [onComplete]
  );

  useEffect(() => {
    cancelledRef.current = false;
    const start = Date.now();

    const poll = async () => {
      while (!cancelledRef.current && Date.now() - start < pollingTimeout) {
        try {
          const data = await getPaymentSourceStatus(paymentSourceId);
          setStatus(data.status);
          processAuth(data.threeDsAuth, data.status);

          if (FINAL_STATUSES.includes(data.status)) {
            return;
          }
        } catch (error) {
          if (!cancelledRef.current && onError) {
            onError(error);
          }
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      }

      if (!cancelledRef.current && onError) {
        onError(new Error('Tiempo de espera agotado configurando la auto-renovación.'));
      }
    };

    poll();
    return () => {
      cancelledRef.current = true;
    };
  }, [paymentSourceId, pollingInterval, pollingTimeout, processAuth, onError]);

  return (
    <Box sx={{ mt: 2 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight={600}>
          Configurando tu método de auto-renovación
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Estado: {status}
          {threeDsAuth?.current_step ? ` · Paso 3DS: ${threeDsAuth.current_step}` : ''}
          {threeDsAuth?.current_step_status ? ` (${threeDsAuth.current_step_status})` : ''}
        </Typography>
      </Alert>

      {!FINAL_STATUSES.includes(status) && !iframeHtml && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
          <CircularProgress size={28} />
          <Typography variant="body2">
            Preparando autenticación 3DS de la fuente de pago… ({status})
          </Typography>
        </Box>
      )}

      {iframeHtml && !FINAL_STATUSES.includes(status) && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Completa la verificación para dejar activa la auto-renovación:
          </Typography>
          <Box
            component="iframe"
            title="3DS Payment Source"
            srcDoc={iframeHtml}
            sx={{
              width: '100%',
              minHeight: 480,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          />
        </Box>
      )}
    </Box>
  );
}
