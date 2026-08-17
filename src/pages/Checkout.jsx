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
  Chip,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
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
  `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount || 0)}`;

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
  const checkoutMode = searchParams.get('mode') || 'checkout';
  const navigate = useNavigate();
  const { refreshPlanInfoAfterPayment } = usePlan();

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
  const esRenovacion = checkoutMode === 'renovar';
  const tituloCheckout = esRenovacion ? `Renovación segura — ${planPreview?.nombre}` : `Checkout — ${planPreview?.nombre}`;
  const subtituloCheckout = esRenovacion
    ? 'Renueva tu plan con una experiencia de pago más clara, profesional y protegida por Wompi.'
    : 'Completa tu compra con una experiencia de pago clara, profesional y protegida por Wompi.';
  const etiquetaFlujo = esRenovacion ? 'Renovación del plan' : 'Nuevo plan';
  const textoCTA = esRenovacion ? 'Renovar y pagar ahora' : 'Pagar y activar plan';

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
    await refreshPlanInfoAfterPayment();
    navigate(`/pago/exito?plan=${planId}&tx=${txId || ''}&renewal=${renewalStatus}`);
  };

  const startPaymentSourceSetup = async (txId = transactionId) => {
    if (!saveForRenewal || !acceptance) {
      await goToSuccess('skipped', txId);
      return;
    }

    try {
      const newAcceptance = await getAcceptanceTokens();

      const newToken = await tokenizeCard({
        number: card.number,
        expMonth: card.expMonth,
        expYear: card.expYear,
        cvc: card.cvc,
        cardHolder: card.cardHolder,
      });

      const result = await createPaymentSource({
        cardToken: newToken,
        acceptanceToken: newAcceptance.acceptance_token,
        acceptPersonalAuth: newAcceptance.accept_personal_auth,
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
        await startPaymentSourceSetup(result.transactionId);
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
      await startPaymentSourceSetup(transactionId);
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/planes')} sx={{ mb: 2 }}>
        Volver a planes
      </Button>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        {tituloCheckout}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {subtituloCheckout}
      </Typography>

      <Paper
        sx={{
          mb: 3,
          p: { xs: 2.25, md: 3 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}14 100%)`,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: (theme) => `0 10px 24px ${theme.palette.primary.main}40`,
                  }}
                >
                  <ShieldRoundedIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Haz tu pago seguro a través de Wompi
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tus datos se procesan con validaciones de seguridad y tokenización para brindar una experiencia más confiable en compra y renovación.
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Chip icon={<LockIcon />} label="Pago protegido" color="primary" variant="outlined" />
              <Chip icon={<VerifiedUserOutlinedIcon />} label="Verificación bancaria" color="success" variant="outlined" />
              <Chip icon={<AutorenewRoundedIcon />} label={saveForRenewal ? 'Auto-renovación activable' : 'Auto-renovación opcional'} color="secondary" variant="outlined" />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

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

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              position: { md: 'sticky' },
              top: { md: 24 },
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Chip label={etiquetaFlujo} color="secondary" size="small" sx={{ mb: 1.5, fontWeight: 700 }} />
                <Typography variant="h6" gutterBottom fontWeight={700}>
                  Resumen de tu plan
                </Typography>
                <Typography variant="h3" color="primary.main" fontWeight={800} lineHeight={1.1}>
                  {formatCOP(checkoutData?.amountFormatted || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  COP / mes
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack spacing={1.25}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Plan seleccionado
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {planPreview?.nombre}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Referencia
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                      {checkoutData?.reference}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Email de confirmación
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                      {checkoutData?.customerEmail}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Alert
                severity="success"
                icon={<ShieldRoundedIcon fontSize="inherit" />}
                sx={{ borderRadius: 3 }}
              >
                <Typography variant="body2" fontWeight={700}>
                  Pago seguro a través de Wompi
                </Typography>
                <Typography variant="caption" display="block">
                  Una validación adicional del banco, cuando aplica, ayuda a reforzar la seguridad del pago.
                </Typography>
              </Alert>

              {isSandbox && (
                <Alert severity="info" sx={{ borderRadius: 3 }}>
                  Sandbox: usa la tarjeta de prueba <strong>4242 4242 4242 4242</strong>
                </Alert>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            {step === STEPS.THREE_DS && transactionId ? (
              <ThreeDSChallenge
                transactionId={transactionId}
                initialThreeDsAuth={initialThreeDsAuth}
                onComplete={handle3DSComplete}
                onError={(err) => {
                  if (err.message?.includes('Tiempo de espera agotado')) {
                    toast.warn(
                      'La verificación sigue pendiente. Si estás en sandbox, elige Approved, Declined o Error dentro del simulador de Wompi.'
                    );
                    return;
                  }
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
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h5" gutterBottom fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LockIcon fontSize="small" /> Datos de pago
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completa la información de tu tarjeta y confirma las autorizaciones requeridas para procesar tu pago de forma segura.
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2.25,
                      borderRadius: 3,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                      Autorizaciones y seguridad
                    </Typography>
                    <Stack spacing={0.5}>
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
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      p: 2.25,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                      Información de la tarjeta
                    </Typography>

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
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Mes (MM)"
                          value={card.expMonth}
                          onChange={(e) => setCard({ ...card, expMonth: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Año (YY)"
                          value={card.expYear}
                          onChange={(e) => setCard({ ...card, expYear: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
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
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: 'background.default',
                      border: '1px dashed',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight={700}>
                        Haz tu pago seguro a través de Wompi
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Al continuar, tu pago podrá pasar por una validación adicional de tu banco cuando aplique. Esto ayuda a mejorar la seguridad del checkout en todos los planes y renovaciones.
                      </Typography>
                    </Stack>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      mt: 1,
                      minHeight: 54,
                      fontWeight: 700,
                      fontSize: '1rem',
                      boxShadow: (theme) => `0 14px 30px ${theme.palette.primary.main}55`,
                    }}
                    disabled={paying || step === STEPS.PROCESSING}
                    onClick={handlePay}
                  >
                    {paying ? <CircularProgress size={24} color="inherit" /> : textoCTA}
                  </Button>
                </Stack>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
