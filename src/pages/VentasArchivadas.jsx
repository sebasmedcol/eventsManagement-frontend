import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaArchive } from 'react-icons/fa';
import { Box, Button, CircularProgress, Container, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { getAniosArchivados, getVentasArchivadas } from '../services/ventaService';

const VentasArchivadas = () => {
  const [anios, setAnios] = useState([]);
  const [anio, setAnio] = useState('');
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAniosArchivados().then((data) => setAnios(Array.isArray(data) ? data : (data.anios || []))).catch(() => toast.error('No se pudieron cargar los años archivados'));
  }, []);

  const formatCurrency = (value) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

  const formatDate = (value) => new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const cargarVentas = async (value) => {
    setAnio(value);
    setVentas([]);
    if (!value) return;
    try {
      setLoading(true);
      const data = await getVentasArchivadas(value);
      setVentas(Array.isArray(data) ? data : (data.ventas || []));
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar las ventas archivadas');
    } finally { setLoading(false); }
  };

  return <Container maxWidth="lg" sx={{ py: 4 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}><FaArchive style={{ marginRight: 10 }} />Ventas archivadas</Typography>
      <Button component={Link} to="/ventas" startIcon={<FaArrowLeft />} variant="outlined">Volver a ventas</Button>
    </Stack>
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Seleccione un año para consultar las ventas archivadas</Typography>
      <Select fullWidth value={anio} displayEmpty onChange={(e) => cargarVentas(e.target.value)}>
        <MenuItem value="" disabled>Seleccione un año</MenuItem>
        {anios.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
      </Select>
    </Paper>
    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box> : anio && <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Cliente</TableCell><TableCell>Total</TableCell></TableRow></TableHead><TableBody>{ventas.map((venta) => <TableRow key={venta._id}><TableCell>{formatDate(venta.fecha)}</TableCell><TableCell>{venta.cliente?.nombreCompleto || venta.clienteNombre || '—'}</TableCell><TableCell>{formatCurrency(venta.totalPagar)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}
  </Container>;
};

export default VentasArchivadas;
