import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import { usePlan } from '../context/PlanContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControlLabel,
  Checkbox,
  IconButton,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const ProductoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isReadOnlyMode } = usePlan();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipoDeServicio: 'Venta',
    tipoDeCobro: 'unidad',
    precio: '',
    cantidadTotal: '',
    estado: true
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducto = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/productos/${id}`);
      const data = response.data || {};
      setFormData({
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        tipoDeServicio: data.tipoDeServicio || 'Venta',
        tipoDeCobro: data.tipoDeCobro || 'unidad',
        precio: data.precio != null ? String(data.precio) : '',
        cantidadTotal:
          data.cantidadTotal != null ? String(data.cantidadTotal) : '',
        estado: data.estado != null ? data.estado : true,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Error al cargar los datos del producto'
      );
      console.error('Error al cargar producto:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      fetchProducto();
    }
  }, [isEditMode, fetchProducto]);

const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  let newValue = type === 'checkbox' ? checked : value;

  // Auto-asignar tipoDeCobro según tipoDeServicio
  if (name === 'tipoDeServicio') {
    setFormData({
      ...formData,
      tipoDeServicio: newValue,
      tipoDeCobro: newValue === 'Venta' ? 'unidad' : 'hora',
    });
    return;
  }

  setFormData({ ...formData, [name]: newValue });
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.nombre || !formData.descripcion || formData.precio === '') {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    if (isNaN(formData.precio) || parseFloat(formData.precio) <= 0) {
      toast.error('El precio debe ser un número mayor que cero');
      return;
    }

    if (
      formData.cantidadTotal !== '' &&
      (isNaN(formData.cantidadTotal) || parseFloat(formData.cantidadTotal) < 0)
    ) {
      toast.error('La cantidad total debe ser un número mayor o igual a cero');
      return;
    }

    try {
      setSubmitting(true);
      
      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tipoDeServicio: formData.tipoDeServicio,
        tipoDeCobro: formData.tipoDeCobro,
        precio: parseFloat(formData.precio),
        cantidadTotal:
          formData.cantidadTotal === ''
            ? 0
            : parseFloat(formData.cantidadTotal),
        estado: formData.estado,
      };
      
      if (isEditMode) {
        await api.put(`/productos/${id}`, productoData);
        toast.success('Producto actualizado correctamente');
      } else {
        await api.post('/productos', productoData);
        toast.success('Producto creado correctamente');
      }
      
      navigate('/productos');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar el producto');
      console.error('Error al guardar producto:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Bloquear acceso al formulario en modo solo lectura (trial expirado)
  if (isReadOnlyMode()) {
    toast.warning('Tu periodo de prueba ha expirado. No puedes crear ni editar productos.');
    navigate('/productos');
    return null;
  }

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/productos')}
          sx={{ mr: 2 }}
        >
          <FaArrowLeft />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            margin="normal"
            required
            placeholder="Ingrese el nombre del producto"
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
            placeholder="Ingrese la descripción del producto"
            variant="outlined"
            required
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Tipo de servicio</InputLabel>
            <Select
              name="tipoDeServicio"
              value={formData.tipoDeServicio}
              onChange={handleChange}
              label="Tipo de servicio"
            >
              <MenuItem value="Alquiler">Alquiler</MenuItem>
              <MenuItem value="Venta">Venta</MenuItem>
            </Select>
          </FormControl>
<TextField
  fullWidth
  label="Tipo de cobro"
  value={formData.tipoDeServicio === 'Venta' ? 'Por unidad' : 'Por hora'}
  margin="normal"
  variant="outlined"
  InputProps={{ readOnly: true }}
  helperText="Se asigna automáticamente según el tipo de servicio"
  sx={{ '& .MuiInputBase-input': { color: 'text.secondary' } }}
/>

          <TextField
            fullWidth
            label={
              formData.tipoDeCobro === 'hora' ? 'Precio (por hora)' : 'Precio (por unidad)'
            }
            name="precio"
            type="number"
            value={formData.precio}
            onChange={handleChange}
            margin="normal"
            required
            placeholder="Ingrese el precio"
            inputProps={{ min: 0, step: 1 }}
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Cantidad (stock inicial)"
            name="cantidadTotal"
            type="number"
            value={formData.cantidadTotal}
            onChange={handleChange}
            margin="normal"
            placeholder="Ingrese la cantidad total disponible (opcional)"
            inputProps={{ min: 0, step: 1 }}
            variant="outlined"
            helperText="Capacidad máxima de este producto para reservas en cualquier rango de fechas."
          />

          <FormControlLabel
            control={
              <Checkbox
                name="estado"
                checked={formData.estado}
                onChange={handleChange}
                color="primary"
              />
            }
            label="Activo"
            sx={{ mt: 2, mb: 3 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <FaSave />}
              sx={{ py: 1.5, px: 3 }}
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProductoForm;
