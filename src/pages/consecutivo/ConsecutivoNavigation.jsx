import { useState } from 'react';
import { Box, Button, ButtonGroup } from '@mui/material';
import { FaListAlt, FaFileInvoice } from 'react-icons/fa';
import Consecutivos from './Consecutivos';
import Facturas from './Facturas';

const ConsecutivoNavigation = () => {
  const [activeView, setActiveView] = useState('consecutivos'); // 'consecutivos' o 'facturas'

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ButtonGroup variant="contained" aria-label="outlined primary button group">
          <Button
            startIcon={<FaListAlt />}
            onClick={() => setActiveView('consecutivos')}
            variant={activeView === 'consecutivos' ? 'contained' : 'outlined'}
            color={activeView === 'consecutivos' ? 'primary' : 'inherit'}
            sx={{ px: 3, py: 1 }}
          >
            Consecutivos
          </Button>
          <Button
            startIcon={<FaFileInvoice />}
            onClick={() => setActiveView('facturas')}
            variant={activeView === 'facturas' ? 'contained' : 'outlined'}
            color={activeView === 'facturas' ? 'primary' : 'inherit'}
            sx={{ px: 3, py: 1 }}
          >
            Facturas
          </Button>
        </ButtonGroup>
      </Box>

      {activeView === 'consecutivos' ? <Consecutivos /> : <Facturas />}
    </Box>
  );
};

export default ConsecutivoNavigation;