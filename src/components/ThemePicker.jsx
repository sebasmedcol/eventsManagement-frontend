import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAppTheme } from '../context/ThemeContext';

const MODE_LABELS = {
  light: 'Claro',
  dark: 'Oscuro',
};

const ThemePicker = ({ anchorEl, onClose }) => {
  const navigate = useNavigate();
  const {
    themeId,
    setThemeId,
    colorMode,
    toggleColorMode,
    resolvedMode,
    availableThemes,
    cursorStyle,
    setCursorStyle,
    availableCursorStyles,
  } = useAppTheme();

  const handleGoToConfig = () => {
    onClose?.();
    navigate('/configuraciones');
  };

  const ModeIcon = resolvedMode === 'dark' ? DarkModeIcon : LightModeIcon;

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { sx: { width: 220 } } }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', px: 2, pt: 1, display: 'block' }}>
        Tema de color
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          px: 2,
          py: 1,
        }}
      >
        {availableThemes.map((t) => {
          const isActive = themeId === t.id;
          return (
            <Tooltip title={t.nombre} key={t.id}>
              <Box
                onClick={() => setThemeId(t.id)}
                role="button"
                aria-label={`Tema ${t.nombre}`}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  background: t.tokens.appBarGradient,
                  outline: isActive ? '2px solid' : '1px solid',
                  outlineColor: isActive ? 'primary.main' : 'divider',
                  outlineOffset: isActive ? '1px' : 0,
                  transition: 'outline-color 0.2s, transform 0.15s cubic-bezier(.34,1.56,.64,1)',
                  '&:hover': { transform: 'scale(1.06)' },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      <Divider />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ModeIcon fontSize="small" />
          <Typography variant="body2">{MODE_LABELS[colorMode]}</Typography>
        </Box>
        <Tooltip title="Cambiar modo">
          <IconButton size="small" onClick={toggleColorMode} aria-label="Cambiar modo de color">
            {resolvedMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      <Typography variant="caption" sx={{ color: 'text.secondary', px: 2, pt: 1, display: 'block' }}>
        Diseño de cursor
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          px: 2,
          py: 1,
        }}
      >
        {availableCursorStyles.map((c) => {
          const isActive = cursorStyle === c.id;
          return (
            <Tooltip title={c.descripcion} key={c.id}>
              <Box
                onClick={() => setCursorStyle(c.id)}
                role="button"
                aria-label={`Cursor ${c.nombre}`}
                sx={{
                  height: 56,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  bgcolor: 'action.hover',
                  outline: isActive ? '2px solid' : '1px solid',
                  outlineColor: isActive ? 'primary.main' : 'divider',
                  outlineOffset: isActive ? '1px' : 0,
                  transition: 'outline-color 0.2s, transform 0.15s cubic-bezier(.34,1.56,.64,1)',
                  '&:hover': { transform: 'scale(1.04)' },
                }}
              >
                {c.id === 'organico' && (
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '30% 70% 65% 35% / 40% 45% 55% 60%',
                      background: 'linear-gradient(135deg, var(--app-accent, #5D87FF) 0%, var(--app-accent-soft, #8A5DFF) 100%)',
                    }}
                  />
                )}
                {c.id === 'anillo' && (
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: '2.5px solid #22D3EE',
                    }}
                  />
                )}
                {c.id === 'diamante' && (
                  <Box
                    sx={{
                      width: 13,
                      height: 13,
                      borderRadius: '3px',
                      transform: 'rotate(45deg)',
                      background: 'linear-gradient(135deg, #F472B6 0%, #A855F7 100%)',
                      boxShadow: '0 0 6px rgba(217, 70, 239, 0.6)',
                    }}
                  />
                )}
                {c.id === 'sistema' && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: 15,
                      lineHeight: 1,
                      color: 'text.secondary',
                      transform: 'rotate(-12deg)',
                    }}
                  >
                    ➤
                  </Box>
                )}
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                  {c.nombre}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      <Divider />

      <MenuItem onClick={handleGoToConfig}>
        <Typography variant="body2">Mas opciones aqui</Typography>
      </MenuItem>
    </Menu>
  );
};

export default ThemePicker;
