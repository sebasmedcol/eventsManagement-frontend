import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  TextField,
  Grid,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  MenuItem,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import {
  getAcceptanceTokens,
  getCheckoutPreview,
  initiateCheckout,
  payWith3DS,
  tokenizeCard,
  createPaymentSource,
  SANDBOX_3DS_SCENARIOS,
  SANDBOX_TEST_CARD,
} from '../services/subscriptionService';
import { collectBrowserInfo } from '../utils/wompiBrowserInfo';
import ThreeDSChallenge from '../components/billing/ThreeDSChallenge';
import PaymentSource3DS from '../components/billing/PaymentSource3DS';
import { usePlan } from '../context/planContext';

const formatCOP = (amount) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    amount
  );

const STEPS = {
  FORM: 'form',
  PROCESSING: 'processing',
  THREE_DS: 'three_ds',
  PAYMENT_SOURCE: 'payment_source',
  DONE: 'done',
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'basico';
  const navigate = useNavigate();
  const { refreshPlanInfo } = usePlan();

  const [step, setStep] = useState(STEPS.FORM);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [planPreview, setPlanPreview] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [acceptance, setAcceptance] = useState(null);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedPersonalData, setAcceptedPersonalData] = useState(false);
  const [saveForRenewal, setSaveForRenewal] = useState(true);
  const [threeDsScenario, setThreeDsScenario] = useState('challenge_v2');
  const [transactionId, setTransactionId] = useState(null);
  const [initialThreeDsAuth, setInitialThreeDsAuth] = useState(null);
  const [lastCardToken, setLastCardToken] = useState(null);
  const [paymentSourceId, setPaymentSourceId] = useState(null);
  const [initialPaymentSourceAuth, setInitialPaymentSourceAuth] = useState(null);
  const [wompiError, setWompiError] = useState(null);

  const [card, setCard] = useState({ ...SANDBOX_TEST_CARD });
  const [phone, setPhone] = useState('3001234567');

  const isSandbox = import.meta.env.VITE_WOMPI_ENV === 'sandbox';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [preview, tokens, checkout] = await Promise.all([
          getCheckoutPreview(planId),
          getAcceptanceTokens(),
          initiateCheckout(planId),
        ]);
        setPlanPreview(preview);
        setAcceptance(tokens);
        setCheckoutData(checkout);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error al preparar el checkout.');
        navigate('/planes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [planId, navigate]);

  const goToSuccess = async (renewalStatus = 'skipped', txId = transactionId) => {
    await refreshPlanInfo();
    navigate(`/pago/exito?plan=${planId}&tx=${txId || ''}&renewal=${renewalStatus}`);
  };

  const startPaymentSourceSetup = async (cardToken, txId = transactionId) => {
    if (!saveForRenewal || !cardToken || !acceptance) {
      await goToSuccess('skipped', txId);
      return;
    }

    try {
      const result = await createPaymentSource({
        cardToken,
        acceptanceToken: acceptance.acceptance_token,
        acceptPersonalAuth: acceptance.accept_personal_auth,
      });

      setPaymentSourceId(String(result.paymentSourceId));
      setInitialPaymentSourceAuth(result.threeDsAuth || null);

      if (result.status === 'AVAILABLE') {
        toast.success('Auto-renovación configurada correctamente.');
        await goToSuccess('configured', txId);
        return;
      }

      setStep(STEPS.PAYMENT_SOURCE);
    } catch (err) {
      console.error(err);
      toast.warn(
        err.response?.data?.message ||
          'El plan quedó activo, pero la auto-renovación no pudo configurarse todavía.'
      );
      await goToSuccess('failed', txId);
    }
  };

  const handlePay = async () => {
    if (!acceptedPrivacy || !acceptedPersonalData) {
      toast.warn('Debes aceptar los términos de Wompi antes de pagar.');
      return;
    }
    if (!checkoutData || !acceptance) return;

    setPaying(true);
    setWompiError(null);
    setStep(STEPS.PROCESSING);

    try {
      const cardToken = await tokenizeCard({
        number: card.number,
        expMonth: card.expMonth,
        expYear: card.expYear,
        cvc: card.cvc,
        cardHolder: card.cardHolder,
      });
      setLastCardToken(cardToken);

      const result = await payWith3DS({
        planId,
        reference: checkoutData.reference,
        cardToken,
        acceptanceToken: acceptance.acceptance_token,
        acceptPersonalAuth: acceptance.accept_personal_auth,
        fullName: card.cardHolder,
        phoneNumber: phone,
        browserInfo: collectBrowserInfo(),
        threeDsAuthType: isSandbox ? threeDsScenario : undefined,
      });

      setTransactionId(result.transactionId);
      setInitialThreeDsAuth(result.threeDsAuth);

      if (result.status === 'APPROVED') {
        await startPaymentSourceSetup(cardToken, result.transactionId);
        return;
      }

      setStep(STEPS.THREE_DS);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message;
      const wompiResp = err.response?.data?.wompiResponse;
      setWompiError({ message: msg, wompiResponse: wompiResp });
      setStep(STEPS.FORM);
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  const handle3DSComplete = async (finalStatus) => {
    if (finalStatus === 'APPROVED') {
      await startPaymentSourceSetup(lastCardToken, transactionId);
    } else {
      navigate(`/pago/error?plan=${planId}&status=${finalStatus}&tx=${transactionId}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/planes')} sx={{ mb: 2 }}>
        Volver a planes
      </Button>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        Checkout — {planPreview?.nombre}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Pago mensual con autenticación 3D Secure
      </Typography>

      {wompiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            {wompiError.message}
          </Typography>
          {wompiError.wompiResponse && (
            <Typography variant="caption" component="pre" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(wompiError.wompiResponse, null, 2)}
            </Typography>
          )}
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Si el error menciona 3DS no habilitado, abre ticket a Wompi con este mensaje como evidencia.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumen
            </Typography>
            <Typography variant="h4" color="primary.main" fontWeight={700}>
              {formatCOP(checkoutData?.amountFormatted || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              / mes · COP
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2">
              <strong>Referencia:</strong> {checkoutData?.reference}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {checkoutData?.customerEmail}
            </Typography>
            {isSandbox && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Sandbox: tarjeta de prueba 4242 4242 4242 4242
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            {step === STEPS.THREE_DS && transactionId ? (
              <ThreeDSChallenge
                transactionId={transactionId}
                initialThreeDsAuth={initialThreeDsAuth}
                onComplete={handle3DSComplete}
                onError={(err) => {
                  toast.error(err.message);
                  navigate(`/pago/error?plan=${planId}&tx=${transactionId}`);
                }}
              />
            ) : step === STEPS.PAYMENT_SOURCE && paymentSourceId ? (
              <PaymentSource3DS
                paymentSourceId={paymentSourceId}
                initialThreeDsAuth={initialPaymentSourceAuth}
                onComplete={async (finalStatus) => {
                  if (finalStatus === 'AVAILABLE') {
                    toast.success('Auto-renovación configurada correctamente.');
                    await goToSuccess('configured');
                    return;
                  }

                  toast.warn(
                    'El plan quedó activo, pero la auto-renovación no pudo completarse.'
                  );
                  await goToSuccess('failed');
                }}
                onError={async (err) => {
                  toast.warn(err.message);
                  await goToSuccess('failed');
                }}
              />
            ) : (
              <>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon fontSize="small" /> Datos de pago
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptedPrivacy}
                      onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Acepto la{' '}
                      <Link href={acceptance?.acceptance_permalink} target="_blank" rel="noopener">
                        política de privacidad
                      </Link>{' '}
                      de Wompi
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptedPersonalData}
                      onChange={(e) => setAcceptedPersonalData(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Autorizo el{' '}
                      <Link href={acceptance?.personal_auth_permalink} target="_blank" rel="noopener">
                        tratamiento de datos personales
                      </Link>
                    </Typography>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={saveForRenewal}
                      onChange={(e) => setSaveForRenewal(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Guardar esta tarjeta para auto-renovación mensual del plan
                    </Typography>
                  }
                />

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Titular de la tarjeta"
                      value={card.cardHolder}
                      onChange={(e) => setCard({ ...card, cardHolder: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Número de tarjeta"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Mes (MM)"
                      value={card.expMonth}
                      onChange={(e) => setCard({ ...card, expMonth: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Año (YY)"
                      value={card.expYear}
                      onChange={(e) => setCard({ ...card, expYear: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="CVC"
                      value={card.cvc}
                      onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Grid>
                  {isSandbox && (
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Escenario 3DS (solo sandbox)"
                        value={threeDsScenario}
                        onChange={(e) => setThreeDsScenario(e.target.value)}
                        helperText="Usa challenge_v2 para probar el flujo completo con iframe"
                      >
                        {SANDBOX_3DS_SCENARIOS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}
                </Grid>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3 }}
                  disabled={paying || step === STEPS.PROCESSING}
                  onClick={handlePay}
                >
                  {paying ? <CircularProgress size={24} color="inherit" /> : 'Pagar y activar plan'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
