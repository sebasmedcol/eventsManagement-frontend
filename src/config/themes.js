// Definición de los temas de color de la aplicación.
// Cada tema incluye sus tokens funcionales de MUI (primary, secondary, etc.),
// el gradiente del AppBar y las superficies para modo claro y oscuro.

export const THEMES = [
  // ── Tema 1 — Estándar (el actual, sin cambios visuales) ──────────────
  {
    id: 'estandar',
    nombre: 'Estándar',
    descripcion: 'El tema original de la aplicación',
    tokens: {
      primary:   { main: '#5D87FF', light: '#7AA4FF', dark: '#2F5BFF', contrastText: '#fff' },
      secondary: { main: '#8A5DFF', light: '#A186FF', dark: '#6B35FF', contrastText: '#170B36' },
      success:   { main: '#13DEB9', light: '#4EE8CE', dark: '#0FB597', contrastText: '#003B32' },
      warning:   { main: '#FFAE1F', light: '#FFC462', dark: '#E08D00', contrastText: '#3D2B00' },
      error:     { main: '#FA896B', light: '#FFB09C', dark: '#E76B49', contrastText: '#3E120B' },
      info:      { main: '#539BFF', light: '#84B7FF', dark: '#1C6BFF', contrastText: '#0A1B3A' },
      appBarGradient: 'linear-gradient(90deg, rgba(1,62,80,0.75) 0%, rgba(251,107,18,0.5) 100%)',
      light: {
        bgDefault: '#F6F9FC', bgPaper: '#FFFFFF',
        textPrimary: '#111827', textSecondary: '#6B7280',
        sidebarBg: '#ffffff', sidebarBackdropFilter: 'none',
      },
      dark: {
        bgDefault: '#0b1220', bgPaper: '#111827',
        textPrimary: '#E5E7EB', textSecondary: '#9CA3AF',
        sidebarBg: 'rgba(1, 62, 80, 0.3)', sidebarBackdropFilter: 'blur(6px)',
      },
    },
  },

  // ── Tema 2 — Atardecer ───────────────────────────────────────────────
  {
    id: 'atardecer',
    nombre: 'Atardecer',
    descripcion: 'Energía cálida en naranjas y lavanda',
    tokens: {
      primary:   { main: '#E85D04', light: '#FF7D2E', dark: '#B84600', contrastText: '#fff' },
      secondary: { main: '#C77DFF', light: '#DBA8FF', dark: '#A351FF', contrastText: '#1E0045' },
      success:   { main: '#52B788', light: '#74CFA3', dark: '#2E8A60', contrastText: '#002918' },
      warning:   { main: '#FFAE1F', light: '#FFC462', dark: '#E08D00', contrastText: '#3D2B00' },
      error:     { main: '#E63946', light: '#FF6B77', dark: '#B81C28', contrastText: '#fff' },
      info:      { main: '#F4A261', light: '#FFB87A', dark: '#D07A3A', contrastText: '#3D1800' },
      appBarGradient: 'linear-gradient(90deg, rgba(90,20,0,0.92) 0%, rgba(232,93,4,0.80) 100%)',
      light: {
        bgDefault: '#FFF1E6', bgPaper: '#FFFFFF',
        textPrimary: '#2D1200', textSecondary: '#7A4A2A',
        sidebarBg: '#ffffff', sidebarBackdropFilter: 'none',
      },
      dark: {
        bgDefault: '#130800', bgPaper: '#1F0D00',
        textPrimary: '#F9DECA', textSecondary: '#C8956A',
        sidebarBg: 'rgba(90, 20, 0, 0.35)', sidebarBackdropFilter: 'blur(6px)',
      },
    },
  },

  // ── Tema 3 — Selva ───────────────────────────────────────────────────
  {
    id: 'selva',
    nombre: 'Selva',
    descripcion: 'Calma y confianza en verdes naturales',
    tokens: {
      primary:   { main: '#2D6A4F', light: '#52B788', dark: '#1B4332', contrastText: '#fff' },
      secondary: { main: '#52B788', light: '#95D5B2', dark: '#2D6A4F', contrastText: '#002918' },
      success:   { main: '#95D5B2', light: '#B7E9CE', dark: '#52B788', contrastText: '#002918' },
      warning:   { main: '#F4A261', light: '#FFB87A', dark: '#D07A3A', contrastText: '#3D1800' },
      error:     { main: '#E63946', light: '#FF6B77', dark: '#B81C28', contrastText: '#fff' },
      info:      { main: '#74C69D', light: '#95D5B2', dark: '#40916C', contrastText: '#002918' },
      appBarGradient: 'linear-gradient(90deg, rgba(10,30,20,0.92) 0%, rgba(45,106,79,0.82) 100%)',
      light: {
        bgDefault: '#F0F7F4', bgPaper: '#FFFFFF',
        textPrimary: '#0D2C1C', textSecondary: '#3A6B50',
        sidebarBg: '#ffffff', sidebarBackdropFilter: 'none',
      },
      dark: {
        bgDefault: '#050F0A', bgPaper: '#0A1F14',
        textPrimary: '#C8EAD8', textSecondary: '#74C69D',
        sidebarBg: 'rgba(10, 30, 20, 0.40)', sidebarBackdropFilter: 'blur(6px)',
      },
    },
  },

  // ── Tema 4 — Galaxia ─────────────────────────────────────────────────
  {
    id: 'galaxia',
    nombre: 'Galaxia',
    descripcion: 'Tecnológico y premium en púrpura y cian',
    tokens: {
      primary:   { main: '#7B2FBE', light: '#9D5CDE', dark: '#5A1A99', contrastText: '#fff' },
      secondary: { main: '#3A0CA3', light: '#5E35C8', dark: '#260880', contrastText: '#fff' },
      success:   { main: '#00BCD4', light: '#4DD8E8', dark: '#0097A7', contrastText: '#002B30' },
      warning:   { main: '#FFAE1F', light: '#FFC462', dark: '#E08D00', contrastText: '#3D2B00' },
      error:     { main: '#FA896B', light: '#FFB09C', dark: '#E76B49', contrastText: '#3E120B' },
      info:      { main: '#00BCD4', light: '#4DD8E8', dark: '#0097A7', contrastText: '#002B30' },
      appBarGradient: 'linear-gradient(90deg, rgba(18,8,60,0.92) 0%, rgba(123,47,190,0.82) 100%)',
      light: {
        bgDefault: '#F3F0FF', bgPaper: '#FFFFFF',
        textPrimary: '#1E0A4E', textSecondary: '#5A3E8A',
        sidebarBg: '#ffffff', sidebarBackdropFilter: 'none',
      },
      dark: {
        bgDefault: '#06041A', bgPaper: '#0F0B2A',
        textPrimary: '#DDD6FE', textSecondary: '#A78BFA',
        sidebarBg: 'rgba(18, 8, 60, 0.40)', sidebarBackdropFilter: 'blur(6px)',
      },
    },
  },
];

export const DEFAULT_THEME_ID = 'estandar';

// Diseños de cursor disponibles en el menú de temas. 'sistema' desactiva
// el cursor personalizado y deja el cursor nativo del sistema operativo.
export const CURSOR_STYLES = [
  {
    id: 'organico',
    nombre: 'Orgánico',
    descripcion: 'Gota suave con los colores del tema activo',
  },
  {
    id: 'anillo',
    nombre: 'Anillo',
    descripcion: 'Aro fino en tonos cian/azul eléctrico',
  },
  {
    id: 'diamante',
    nombre: 'Diamante',
    descripcion: 'Rombo con resplandor magenta/violeta',
  },
  {
    id: 'sistema',
    nombre: 'Predeterminado',
    descripcion: 'El cursor original del sistema operativo',
  },
];

export const DEFAULT_CURSOR_STYLE = 'organico';
