import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Container,
  CircularProgress,
  Alert,
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
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { usePlan } from '../context/PlanContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Página de comparación de planes
 */
const Planes = () => {
  const theme = useTheme();
  const { currentPlan, refreshPlanInfo } = usePlan();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Iconos para cada plan
  const planIcons = {
    free_trial: StorefrontIcon,
    basico: StorefrontIcon,
    pro: BusinessIcon,
    premium: RocketIcon,
  };
  
  // Colores para cada plan
  const planColors = {
    free_trial: 'grey',
    basico: 'info',
    pro: 'primary',
    premium: 'success',
  };
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/config/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data.success) {
          setPlans(response.data.data);
        }
      } catch (err) {
        console.error('Error al cargar planes:', err);
        setError(err.response?.data?.message || 'Error al cargar planes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, []);
  
  const handleSelectPlan = (planId) => {
    // Aquí implementar la lógica de selección de plan
    // Por ejemplo, redirigir a página de pago o contacto
    console.log('Plan seleccionado:', planId);
  };
  
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Gratis';
    return `$${price}/mes`;
  };
  
  const formatLimit = (limit) => {
    if (limit === -1) return 'Ilimitado';
    return limit.toLocaleString();
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Elige el plan perfecto para tu negocio
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Todos los planes incluyen acceso a las funcionalidades esenciales. 
          Elige el que mejor se adapte a tus necesidades.
        </Typography>
      </Box>
      
      {/* Tabs para filtrar */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Tabs 
          value={selectedTab} 
          onChange={(e, v) => setSelectedTab(v)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          <Tab label="Todos los planes" />
          <Tab label="Comparar características" />
        </Tabs>
      </Box>
      
      {selectedTab === 0 ? (
        /* Vista de cards de planes */
        <Grid container spacing={3} justifyContent="center">
          {plans.filter(p => p.id !== 'free_trial').map((plan) => {
            const PlanIcon = planIcons[plan.id] || StorefrontIcon;
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isPro = plan.id === 'pro';
            
            return (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: isPro ? 2 : 1,
                    borderColor: isPro ? 'primary.main' : 'divider',
                    transform: isPro ? 'scale(1.02)' : 'none',
                    boxShadow: isPro ? 8 : 1,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: isPro ? 'scale(1.04)' : 'scale(1.02)',
                      boxShadow: 6,
                    },
                  }}
                >
                  {/* Badge de popular */}
                  {isPro && (
                    <Chip
                      label="Más popular"
                      color="primary"
                      size="small"
                      icon={<StarIcon />}
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                    />
                  )}
                  
                  {/* Badge de plan actual */}
                  {isCurrentPlan && (
                    <Chip
                      label="Tu plan actual"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ flex: 1, pt: isPro ? 4 : 3 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette[planColors[plan.id]]?.main || theme.palette.grey[500], 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <PlanIcon sx={{ fontSize: 30, color: `${planColors[plan.id]}.main` }} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {plan.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                        {plan.descripcion}
                      </Typography>
                    </Box>
                    
                    {/* Precio */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h3" fontWeight="bold" color="primary">
                        {formatPrice(plan.precio)}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Límites principales */}
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Límites incluidos:
                    </Typography>
                    <List dense>
                      {[
                        { key: 'clientes', label: 'Clientes' },
                        { key: 'productos', label: 'Productos' },
                        { key: 'ventas', label: 'Ventas/mes' },
                        { key: 'eventos', label: 'Eventos' },
                        { key: 'usuarios', label: 'Usuarios' },
                      ].map(({ key, label }) => (
                        <ListItem key={key} sx={{ py: 0.5, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${formatLimit(plan.limites[key])} ${label}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Características destacadas */}
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Características:
                    </Typography>
                    <List dense>
                      {plan.caracteristicas.slice(0, 4).map((feature) => (
                        <ListItem key={feature.id} sx={{ py: 0.5, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            {feature.disponible ? (
                              <CheckIcon fontSize="small" color="success" />
                            ) : (
                              <CloseIcon fontSize="small" color="disabled" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={feature.nombre}
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              color: feature.disponible ? 'text.primary' : 'text.disabled',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant={isPro ? 'contained' : 'outlined'}
                      color={planColors[plan.id]}
                      fullWidth
                      size="large"
                      disabled={isCurrentPlan}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {isCurrentPlan ? 'Plan actual' : 'Seleccionar'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* Vista de comparación de características */
        <Paper sx={{ overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 800 }}>
              {/* Header de la tabla */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '200px repeat(3, 1fr)',
                  bgcolor: 'grey.100',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ p: 2, fontWeight: 'bold' }}>Característica</Box>
                {plans.filter(p => p.id !== 'free_trial').map((plan) => (
                  <Box 
                    key={plan.id} 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      fontWeight: 'bold',
                      bgcolor: currentPlan?.id === plan.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    }}
                  >
                    {plan.nombre}
                    <Typography variant="body2" color="text.secondary">
                      {formatPrice(plan.precio)}
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              {/* Sección de límites */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', fontWeight: 'bold' }}>
                Límites
              </Box>
              {[
                { key: 'clientes', label: 'Clientes' },
                { key: 'productos', label: 'Productos' },
                { key: 'servicios', label: 'Servicios' },
                { key: 'ventas', label: 'Ventas' },
                { key: 'eventos', label: 'Eventos' },
                { key: 'cotizaciones', label: 'Cotizaciones' },
                { key: 'usuarios', label: 'Usuarios' },
                { key: 'almacenes', label: 'Almacenes' },
              ].map(({ key, label }) => (
                <Box
                  key={key}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '200px repeat(3, 1fr)',
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'grey.50' },
                  }}
                >
                  <Box sx={{ p: 2 }}>{label}</Box>
                  {plans.filter(p => p.id !== 'free_trial').map((plan) => (
                    <Box key={plan.id} sx={{ p: 2, textAlign: 'center' }}>
                      <Chip
                        label={formatLimit(plan.limites[key])}
                        size="small"
                        color={plan.limites[key] === -1 ? 'success' : 'default'}
                        variant={plan.limites[key] === -1 ? 'filled' : 'outlined'}
                      />
                    </Box>
                  ))}
                </Box>
              ))}
              
              {/* Sección de módulos */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', fontWeight: 'bold' }}>
                Módulos
              </Box>
              {plans[0]?.modulos?.map((modulo) => (
                <Box
                  key={modulo.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '200px repeat(3, 1fr)',
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'grey.50' },
                  }}
                >
                  <Box sx={{ p: 2 }}>{modulo.nombre}</Box>
                  {plans.filter(p => p.id !== 'free_trial').map((plan) => {
                    const planModulo = plan.modulos.find(m => m.id === modulo.id);
                    return (
                      <Box key={plan.id} sx={{ p: 2, textAlign: 'center' }}>
                        {planModulo?.disponible ? (
                          <CheckIcon color="success" />
                        ) : (
                          <CloseIcon color="disabled" />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
              
              {/* Sección de características */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', fontWeight: 'bold' }}>
                Características adicionales
              </Box>
              {plans[0]?.caracteristicas?.map((caracteristica) => (
                <Box
                  key={caracteristica.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '200px repeat(3, 1fr)',
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'grey.50' },
                  }}
                >
                  <Box sx={{ p: 2 }}>{caracteristica.nombre}</Box>
                  {plans.filter(p => p.id !== 'free_trial').map((plan) => {
                    const planCarac = plan.caracteristicas.find(c => c.id === caracteristica.id);
                    return (
                      <Box key={plan.id} sx={{ p: 2, textAlign: 'center' }}>
                        {planCarac?.disponible ? (
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
      
      {/* CTA final */}
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Typography variant="h6" gutterBottom>
          ¿Tienes preguntas sobre los planes?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Nuestro equipo está listo para ayudarte a elegir el mejor plan para tu negocio.
        </Typography>
        <Button variant="outlined" size="large">
          Contactar ventas
        </Button>
      </Box>
    </Container>
  );
};

export default Planes;
