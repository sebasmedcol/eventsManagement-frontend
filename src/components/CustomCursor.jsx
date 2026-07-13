import { useEffect, useRef } from 'react';
import { useAppTheme } from '../context/ThemeContext';

// Selector de elementos que se consideran "clicables" para transformar el
// cursor de flecha a un indicador tipo "mano".
const POINTER_SELECTOR =
  'a, button, [role="button"], .MuiButtonBase-root, summary, label, ' +
  'input[type="checkbox"], input[type="radio"], select, [data-cursor="pointer"]';

const TEXT_SELECTOR = 'input, textarea, [contenteditable="true"]';

/**
 * Cursor personalizado y animado.
 *
 * Soporta varios diseños intercambiables (elegidos desde el menú de
 * temas): un único indicador que sigue el puntero con una leve suavidad
 * y que se transforma visiblemente al pasar sobre elementos interactivos.
 * Cuando el diseño elegido es "sistema" el componente no hace nada y se
 * deja el cursor nativo del sistema operativo.
 *
 * Se desactiva automáticamente en dispositivos táctiles y cuando el
 * usuario prefiere menos movimiento (prefers-reduced-motion).
 */
const CustomCursor = () => {
  const { cursorStyle } = useAppTheme() || {};
  const cursorRef = useRef(null);
  const target = useRef({ x: -100, y: -100 });
  const current = useRef({ x: -100, y: -100 });
  const rafId = useRef(null);

  const isSystemCursor = !cursorStyle || cursorStyle === 'sistema';

  useEffect(() => {
    if (isSystemCursor) return undefined;

    const isFinePointer = window.matchMedia?.('(pointer: fine)')?.matches;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (!isFinePointer || prefersReducedMotion) return undefined;

    const el = cursorRef.current;
    if (!el) return undefined;

    document.body.classList.add('app-custom-cursor');

    const handleMove = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!el.classList.contains('is-visible')) {
        el.classList.add('is-visible');
      }

      const overText = e.target?.closest?.(TEXT_SELECTOR);
      const overPointer = !overText && e.target?.closest?.(POINTER_SELECTOR);

      el.style.opacity = overText ? '0' : '';
      el.classList.toggle('is-pointer', Boolean(overPointer));
    };

    const handleLeave = () => el.classList.remove('is-visible');
    const handleDown = () => el.classList.add('is-down');
    const handleUp = () => el.classList.remove('is-down');

    const tick = () => {
      // Suavizado leve (lerp) para que el movimiento se sienta vivo sin
      // convertirse en una "bola persiguiendo" con retraso notorio.
      current.current.x += (target.current.x - current.current.x) * 0.35;
      current.current.y += (target.current.y - current.current.y) * 0.35;
      el.style.transform = `translate3d(${current.current.x - 4}px, ${current.current.y - 4}px, 0)`;
      rafId.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    rafId.current = requestAnimationFrame(tick);

    return () => {
      document.body.classList.remove('app-custom-cursor');
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isSystemCursor]);

  if (isSystemCursor) return null;

  return <div ref={cursorRef} className={`app-cursor app-cursor--${cursorStyle}`} aria-hidden="true" />;
};

export default CustomCursor;
