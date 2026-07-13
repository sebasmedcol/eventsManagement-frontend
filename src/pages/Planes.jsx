import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { usePlan } from '../context/planContext';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
  Alert,
  Paper,
  Tab,
  Tabs,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Rocket as RocketIcon,
  Business as BusinessIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';

const EXCLUDED_MODULES = [
  'reportes',
  'reportes avanzados',
  'integraciones',
  'acceso api',
  'respaldos',
  'auditoria',
  'logistica avanzada',
  'seguimiento de tareas',
  'estadisticas avanzadas',
];

const normalizeStr = (str) =>
  (str || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const filterModulos = (modulos) =>
  (modulos || []).filter(
    (m) => !EXCLUDED_MODULES.includes(normalizeStr(m.nombre))
  );

// El modulo de Configuracion esta incluido en TODOS los planes (incluido el
// Basico), asi que sin importar lo que diga el backend, en esta pantalla
// siempre se muestra como disponible (nunca con una "X").
const esModuloConfiguracion = (nombre) => normalizeStr(nombre) === 'configuracion';

const moduloEstaDisponible = (modulo) =>
  esModuloConfiguracion(modulo?.nombre) ? true : modulo?.disponible === true;

const Planes = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentPlan, refreshPlanInfo, isTrialExpired, getTrialDaysRemaining, trialInfo } = usePlan();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchPlanes();
  }, []);

  const fetchPlanes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/config/plans');
      if (response.data.success) {
        setPlanes(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar planes:', error);
      toast.error('Error al cargar los planes disponibles');
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'premium':
        return <StarIcon sx={{ fontSize: 40, color: '#FFD700' }} />;
      case 'pro':
        return <RocketIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />;
      case 'basico':
        return <BusinessIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />;
      default:
        return <OfferIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'premium':
        return { main: '#FFD700', light: '#FFF8DC' };
      case 'pro':
        return { main: theme.palette.primary.main, light: alpha(theme.palette.primary.main, 0.1) };
      case 'basico':
        return { main: theme.palette.info.main, light: alpha(theme.palette.info.main, 0.1) };
      default:
        return { main: theme.palette.success.main, light: alpha(theme.palette.success.main, 0.1) };
    }
  };

  const formatLimit = (value) => {
    if (value === -1) return 'Ilimitado';
    return value.toLocaleString();
  };

  const handleSelectPlan = (planId) => {
    const normalizedPlanId = planId === 'free' ? 'free_trial' : planId;

    if (normalizedPlanId === 'free_trial') {
      toast.info('Tu cuenta ya cuenta con flujo de prueba gratuita o plan activo.');
      return;
    }

    navigate(`/checkout?plan=${normalizedPlanId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const orderedPlans = ['free_trial', 'basico', 'pro', 'premium'];
  const sortedPlanes = planes.sort((a, b) => orderedPlans.indexOf(a.id) - orderedPlans.indexOf(b.id));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Planes y Precios
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Elige el plan que mejor se adapte a las necesidades de tu negocio
        </Typography>
      </Box>

      {/* Alerta de trial */}
      {trialInfo && (
        <Box sx={{ mb: 4 }}>
          {isTrialExpired() ? (
            <Alert severity="error" sx={{ justifyContent: 'center' }}>
              Tu periodo de prueba ha expirado. Selecciona un plan para continuar usando NextEvents.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ justifyContent: 'center' }}>
              Te quedan <strong>{getTrialDaysRemaining()} dias</strong> de prueba gratuita. 
              Aprovecha para explorar todas las funcionalidades.
            </Alert>
          )}
        </Box>
      )}

      {/* Plan actual */}
      {currentPlan && (
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Chip
            label={`Tu plan actual: ${currentPlan.nombre}`}
            color="primary"
            size="large"
            sx={{ fontSize: '1rem', py: 2, px: 2 }}
          />
        </Box>
      )}

      {/* Tabs para cambiar vista */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Vista de Tarjetas" />
          <Tab label="Comparacion Detallada" />
        </Tabs>
      </Box>

      {/* Vista de tarjetas */}
      {activeTab === 0 && (
        <Grid container spacing={3} justifyContent="center" sx={{ pt: 2 }}>
          {sortedPlanes.map((plan) => {
            const colors = getPlanColor(plan.id);
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isPremium = plan.id === 'premium';

            return (
              <Grid item xs={12} sm={6} md={3} key={plan.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'visible',
                    border: isCurrentPlan ? `3px solid ${colors.main}` : '1px solid',
                    borderColor: isCurrentPlan ? colors.main : 'divider',
                    transform: isPremium ? 'scale(1.05)' : 'none',
                    zIndex: isPremium ? 1 : 0,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: isPremium ? 'scale(1.08)' : 'scale(1.02)',
                      boxShadow: theme.shadows[10],
                    },
                  }}
                >
                  {/* Badge de popular */}
                  {isPremium && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: colors.main,
                        color: 'black',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      MAS POPULAR
                    </Box>
                  )}

                  {/* Badge de plan actual */}
                  {isCurrentPlan && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: isPremium ? 20 : -12,
                        right: 10,
                        bgcolor: 'success.main',
                        color: 'white',
                        px: 1.5,
                        py: 0.3,
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      ACTUAL
                    </Box>
                  )}

                  <CardHeader
                    sx={{
                      bgcolor: colors.light,
                      textAlign: 'center',
                      pt: isPremium ? 4 : 3,
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                    title={
                      <Box>
                        {getPlanIcon(plan.id)}
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                          {plan.nombre}
                        </Typography>
                        {plan.slogan && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            "{plan.slogan}"
                          </Typography>
                        )}
                      </Box>
                    }
                  />

                  <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                    {/* Precio */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      {plan.precio === 0 ? (
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          Gratis
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            ${plan.precio}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            /mes
                          </Typography>
                        </>
                      )}
                      {plan.duracionDias && (
                        <Chip 
                          label={`${plan.duracionDias} dias gratis`} 
                          size="small" 
                          color="success" 
                          sx={{ mt: 1 }} 
                        />
                      )}
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Limites principales */}
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Limites:
                    </Typography>
                    <List dense>
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${formatLimit(plan.limites?.clientes)} clientes`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${formatLimit(plan.limites?.productos)} productos`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${formatLimit(plan.limites?.ventas)} ventas`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${formatLimit(plan.limites?.usuarios)} usuarios`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    </List>

                    {/* Modulos destacados */}
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                      Modulos:
                    </Typography>
                    <List dense>
                      {filterModulos(plan.modulos).slice(0, 5).map((modulo) => {
                        const disponible = moduloEstaDisponible(modulo);
                        return (
                          <ListItem key={modulo.id} sx={{ py: 0.25 }}>
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              {disponible ? (
                                <CheckIcon color="success" fontSize="small" />
                              ) : (
                                <CloseIcon color="disabled" fontSize="small" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={modulo.nombre}
                              primaryTypographyProps={{
                                variant: 'body2',
                                color: disponible ? 'text.primary' : 'text.disabled',
                              }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant={isCurrentPlan ? 'outlined' : 'contained'}
                      color={isCurrentPlan ? 'success' : 'primary'}
                      fullWidth
                      disabled={isCurrentPlan}
                      onClick={() => handleSelectPlan(plan.id)}
                      sx={{
                        py: 1.5,
                        fontWeight: 'bold',
                      }}
                    >
                      {isCurrentPlan ? 'Plan Actual' : plan.precio === 0 ? 'Comenzar Gratis' : 'Seleccionar Plan'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Vista de comparacion detallada */}
      {activeTab === 1 && (
        <Paper sx={{ overflow: 'auto' }}>
          <Box sx={{ minWidth: 800 }}>
            {/* Encabezado de planes */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ width: 200, p: 2, fontWeight: 'bold' }}>Caracteristicas</Box>
              {sortedPlanes.map((plan) => (
                <Box
                  key={plan.id}
                  sx={{
                    flex: 1,
                    p: 2,
                    textAlign: 'center',
                    bgcolor: currentPlan?.id === plan.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {plan.nombre}
                  </Typography>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    {plan.precio === 0 ? 'Gratis' : `$${plan.precio}/mes`}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Limites */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', fontWeight: 'bold' }}>
                Limites Operativos
              </Box>
              {['clientes', 'productos', 'ventas', 'eventos', 'cotizaciones', 'usuarios'].map((limite) => (
                <Box key={limite} sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ width: 200, p: 2, textTransform: 'capitalize' }}>{limite}</Box>
                  {sortedPlanes.map((plan) => (
                    <Box
                      key={`${plan.id}-${limite}`}
                      sx={{
                        flex: 1,
                        p: 2,
                        textAlign: 'center',
                        bgcolor: currentPlan?.id === plan.id ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                      }}
                    >
                      {formatLimit(plan.limites?.[limite] || 0)}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>

            {/* Modulos */}
            <Box>
              <Box sx={{ p: 2, bgcolor: 'grey.100', fontWeight: 'bold' }}>
                Modulos Disponibles
              </Box>
              {filterModulos(sortedPlanes[0]?.modulos).map((moduloRef) => (
                <Box key={moduloRef.id} sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ width: 200, p: 2 }}>{moduloRef.nombre}</Box>
                  {sortedPlanes.map((plan) => {
                    const modulo = plan.modulos?.find((m) => m.id === moduloRef.id);
                    const disponible = esModuloConfiguracion(moduloRef.nombre) ? true : moduloEstaDisponible(modulo);
                    return (
                      <Box
                        key={`${plan.id}-${moduloRef.id}`}
                        sx={{
                          flex: 1,
                          p: 2,
                          textAlign: 'center',
                          bgcolor: currentPlan?.id === plan.id ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                        }}
                      >
                        {disponible ? (
                          <CheckIcon color="success" />
                        ) : (
                          <CloseIcon color="disabled" />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      )}


    </Container>
  );
};

export default Planes;
