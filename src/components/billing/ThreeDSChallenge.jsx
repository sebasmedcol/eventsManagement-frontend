import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, Stack } from '@mui/material';
import { getTransactionStatus } from '../../services/subscriptionService';
import { extractChallengeHtml } from '../../utils/decodeIframeHtml';

const FINAL_STATUSES = ['APPROVED', 'DECLINED', 'ERROR', 'VOIDED'];

/**
 * Polling 3DS + renderizado de iframe CHALLENGE (Wompi v2).
 */
export default function ThreeDSChallenge({
  transactionId,
  initialThreeDsAuth,
  onComplete,
  onError,
  pollingInterval = 2500,
  pollingTimeout = 120000,
}) {
  const [threeDsAuth, setThreeDsAuth] = useState(initialThreeDsAuth);
  const [status, setStatus] = useState('PENDING');
  const [iframeHtml, setIframeHtml] = useState(null);
  const [showMcLogo, setShowMcLogo] = useState(Boolean(initialThreeDsAuth));
  const [asyncPaymentUrl, setAsyncPaymentUrl] = useState(null);
  const [lastStep, setLastStep] = useState(initialThreeDsAuth?.current_step || null);
  const [lastStepStatus, setLastStepStatus] = useState(initialThreeDsAuth?.current_step_status || null);
  const cancelledRef = useRef(false);

  const processAuth = useCallback((auth, txStatus) => {
    if (!auth) return;
    setThreeDsAuth(auth);
    setLastStep(auth.current_step || null);
    setLastStepStatus(auth.current_step_status || null);

    if (auth.current_step === 'CHALLENGE' && auth.current_step_status === 'PENDING') {
      const html = extractChallengeHtml(auth);
      if (html) {
        setIframeHtml(html);
        setShowMcLogo(false);
      }
    }

    if (auth.current_step === 'AUTHENTICATION') {
      setShowMcLogo(true);
      setIframeHtml(null);
      setTimeout(() => setShowMcLogo(false), 2500);
    }

    if (FINAL_STATUSES.includes(txStatus)) {
      onComplete(txStatus);
    }
  }, [onComplete]);

  useEffect(() => {
    cancelledRef.current = false;
    const start = Date.now();

    const poll = async () => {
      while (!cancelledRef.current && Date.now() - start < pollingTimeout) {
        try {
          const data = await getTransactionStatus(transactionId);
          setStatus(data.status);
          setAsyncPaymentUrl(data.asyncPaymentUrl || null);
          processAuth(data.threeDsAuth, data.status);

          if (FINAL_STATUSES.includes(data.status)) {
            return;
          }
        } catch (err) {
          if (!cancelledRef.current && onError) {
            onError(err);
          }
          return;
        }
        await new Promise((r) => setTimeout(r, pollingInterval));
      }
      if (!cancelledRef.current && onError) {
        onError(new Error('Tiempo de espera agotado en autenticación 3DS.'));
      }
    };

    poll();
    return () => {
      cancelledRef.current = true;
    };
  }, [transactionId, pollingInterval, pollingTimeout, processAuth, onError]);

  return (
    <Box sx={{ mt: 2 }}>
      {showMcLogo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            Autenticando tu transacción de forma segura (3D Secure)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Verificación protegida por Mastercard Identity Check
          </Typography>
        </Alert>
      )}

      {!FINAL_STATUSES.includes(status) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Estado transacción:</strong> {status}
            </Typography>
            {lastStep && (
              <Typography variant="body2">
                <strong>Paso 3DS:</strong> {lastStep}
                {lastStepStatus ? ` (${lastStepStatus})` : ''}
              </Typography>
            )}
            {asyncPaymentUrl && (
              <>
                <Typography variant="body2">
                  Wompi entregó una URL asíncrona de autenticación como respaldo.
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    href={asyncPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir autenticación en nueva pestaña
                  </Button>
                </Box>
              </>
            )}
          </Stack>
        </Alert>
      )}

      {!FINAL_STATUSES.includes(status) && !iframeHtml && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
          <CircularProgress size={28} />
          <Typography variant="body2">
            Procesando autenticación 3D Secure… ({status})
          </Typography>
        </Box>
      )}

      {iframeHtml && threeDsAuth?.current_step === 'CHALLENGE' && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Completa la verificación de tu banco en el siguiente recuadro:
          </Typography>
          <Box
            component="iframe"
            title="3DS Challenge"
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
