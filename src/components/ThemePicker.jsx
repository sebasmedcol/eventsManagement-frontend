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
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { useAppTheme } from '../context/ThemeContext';

const MODE_LABELS = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
};

const ThemePicker = ({ anchorEl, onClose }) => {
  const navigate = useNavigate();
  const {
    themeId,
    setThemeId,
    colorMode,
    setColorMode,
    resolvedMode,
    availableThemes,
  } = useAppTheme();

  const handleToggleMode = () => {
    const next = colorMode === 'light' ? 'dark' : colorMode === 'dark' ? 'system' : 'light';
    setColorMode(next);
  };

  const handleGoToConfig = () => {
    onClose?.();
    navigate('/configuraciones');
  };

  const ModeIcon =
    colorMode === 'system'
      ? SettingsSuggestIcon
      : resolvedMode === 'dark'
        ? DarkModeIcon
        : LightModeIcon;

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
                  transition: 'outline-color 0.2s, transform 0.1s',
                  '&:hover': { transform: 'scale(1.04)' },
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
          <IconButton size="small" onClick={handleToggleMode} aria-label="Cambiar modo de color">
            {resolvedMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      <MenuItem onClick={handleGoToConfig}>
        <Typography variant="body2">Más opciones en Configuraciones</Typography>
      </MenuItem>
    </Menu>
  );
};

export default ThemePicker;
