import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { THEMES, DEFAULT_THEME_ID } from '../config/themes';

// Claves de persistencia en localStorage.
// 'color-mode' es la clave EXISTENTE: no se renombra para no perder
// las preferencias de usuarios actuales.
const THEME_ID_KEY = 'ian-theme-id';
const COLOR_MODE_KEY = 'color-mode';

const VALID_MODES = ['light', 'dark', 'system'];

const ThemeContext = createContext(undefined);

const readInitialThemeId = () => {
  try {
    const saved = localStorage.getItem(THEME_ID_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME_ID;
};

const readInitialColorMode = () => {
  try {
    const saved = localStorage.getItem(COLOR_MODE_KEY);
    if (saved && VALID_MODES.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  return 'light';
};

const getSystemMode = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeContextProvider = ({ children }) => {
  const [themeId, setThemeIdState] = useState(readInitialThemeId);
  const [colorMode, setColorModeState] = useState(readInitialColorMode);
  const [systemMode, setSystemMode] = useState(getSystemMode);

  // Escuchar cambios de preferencia del sistema operativo cuando el modo
  // seleccionado es 'system'.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemMode(e.matches ? 'dark' : 'light');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Persistir el tema activo.
  const setThemeId = (id) => {
    if (!THEMES.some((t) => t.id === id)) return;
    setThemeIdState(id);
    try {
      localStorage.setItem(THEME_ID_KEY, id);
    } catch {
      /* ignore */
    }
  };

  // Persistir el modo de color (light | dark | system).
  const setColorMode = (mode) => {
    if (!VALID_MODES.includes(mode)) return;
    setColorModeState(mode);
    try {
      localStorage.setItem(COLOR_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const resolvedMode = colorMode === 'system' ? systemMode : colorMode;

  const currentThemeTokens = useMemo(() => {
    const theme = THEMES.find((t) => t.id === themeId) || THEMES.find((t) => t.id === DEFAULT_THEME_ID);
    return theme.tokens;
  }, [themeId]);

  const value = useMemo(
    () => ({
      themeId,
      setThemeId,
      colorMode,
      setColorMode,
      resolvedMode,
      availableThemes: THEMES,
      currentThemeTokens,
    }),
    [themeId, colorMode, resolvedMode, currentThemeTokens]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => useContext(ThemeContext);
