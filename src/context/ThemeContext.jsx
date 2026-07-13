import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { THEMES, DEFAULT_THEME_ID, CURSOR_STYLES, DEFAULT_CURSOR_STYLE } from '../config/themes';

// Claves de persistencia en localStorage.
// 'color-mode' es la clave EXISTENTE: no se renombra para no perder
// las preferencias de usuarios actuales.
const THEME_ID_KEY = 'ian-theme-id';
const COLOR_MODE_KEY = 'color-mode';
const CURSOR_STYLE_KEY = 'ian-cursor-style';

// Solo se soportan modo Claro y Oscuro. Si un usuario tenia guardado
// 'system' (de una version anterior), se migra a lo que su sistema
// operativo prefiera en ese momento, para no darle un salto brusco.
const VALID_MODES = ['light', 'dark'];

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

const getSystemMode = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const readInitialColorMode = () => {
  try {
    const saved = localStorage.getItem(COLOR_MODE_KEY);
    if (saved && VALID_MODES.includes(saved)) return saved;
    if (saved === 'system') return getSystemMode();
  } catch {
    /* ignore */
  }
  return 'light';
};

const readInitialCursorStyle = () => {
  try {
    const saved = localStorage.getItem(CURSOR_STYLE_KEY);
    if (saved && CURSOR_STYLES.some((c) => c.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_CURSOR_STYLE;
};

export const ThemeContextProvider = ({ children }) => {
  const [themeId, setThemeIdState] = useState(readInitialThemeId);
  const [colorMode, setColorModeState] = useState(readInitialColorMode);
  const [cursorStyle, setCursorStyleState] = useState(readInitialCursorStyle);

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

  // Persistir el modo de color (light | dark).
  const setColorMode = (mode) => {
    if (!VALID_MODES.includes(mode)) return;
    setColorModeState(mode);
    try {
      localStorage.setItem(COLOR_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const toggleColorMode = () => setColorMode(colorMode === 'dark' ? 'light' : 'dark');

  // Persistir el diseño de cursor elegido.
  const setCursorStyle = (id) => {
    if (!CURSOR_STYLES.some((c) => c.id === id)) return;
    setCursorStyleState(id);
    try {
      localStorage.setItem(CURSOR_STYLE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const resolvedMode = colorMode;

  const currentThemeTokens = useMemo(() => {
    const theme = THEMES.find((t) => t.id === themeId) || THEMES.find((t) => t.id === DEFAULT_THEME_ID);
    return theme.tokens;
  }, [themeId]);

  // Sincroniza variables CSS globales (usadas por el scrollbar y el cursor
  // personalizados) con los colores del tema y modo activos.
  useEffect(() => {
    const root = document.documentElement;
    const surface = resolvedMode === 'dark' ? currentThemeTokens.dark : currentThemeTokens.light;
    root.style.setProperty('--app-accent', currentThemeTokens.primary.main);
    root.style.setProperty('--app-accent-strong', currentThemeTokens.primary.dark);
    root.style.setProperty('--app-accent-soft', currentThemeTokens.secondary.main);
    root.style.setProperty('--app-scrollbar-track', resolvedMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)');
    root.style.setProperty('--app-bg-paper', surface.bgPaper);
    root.setAttribute('data-app-mode', resolvedMode);
  }, [currentThemeTokens, resolvedMode]);

  const value = useMemo(
    () => ({
      themeId,
      setThemeId,
      colorMode,
      setColorMode,
      toggleColorMode,
      resolvedMode,
      availableThemes: THEMES,
      currentThemeTokens,
      cursorStyle,
      setCursorStyle,
      availableCursorStyles: CURSOR_STYLES,
    }),
    [themeId, colorMode, resolvedMode, currentThemeTokens, cursorStyle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => useContext(ThemeContext);
