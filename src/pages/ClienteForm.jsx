import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
// import axios from 'axios';
import { toast } from 'react-toastify';
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
  Container
} from '@mui/material';
import api from '../services/api';

const ClienteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    direccion: '',
    estado: true
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCliente = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clientes/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar los datos del cliente');
      console.error('Error al cargar cliente:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      fetchCliente();
    }
  }, [isEditMode, fetchCliente]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.nombreCompleto || !formData.telefono) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    try {
      setSubmitting(true);
      
      if (isEditMode) {
        await api.put(`/clientes/${id}`, formData);
        toast.success('Cliente actualizado correctamente');
      } else {
        await api.post('/clientes', formData);
        toast.success('Cliente creado correctamente');
      }
      
      navigate('/clientes');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar el cliente');
      console.error('Error al guardar cliente:', error);
    } finally {
      setSubmitting(false);
    }
  };

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
          onClick={() => navigate('/clientes')}
          sx={{ mr: 2 }}
        >
          <FaArrowLeft />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nombre Completo"
            name="nombreCompleto"
            value={formData.nombreCompleto}
            onChange={handleChange}
            margin="normal"
            required
            placeholder="Ingrese el nombre completo"
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            margin="normal"
            required
            placeholder="Ingrese el teléfono"
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            margin="normal"
            placeholder="Ingrese la dirección"
            variant="outlined"
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

export default ClienteForm;
