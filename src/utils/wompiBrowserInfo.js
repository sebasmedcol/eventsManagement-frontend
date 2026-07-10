/**
 * Recolecta browser_info requerido por Wompi 3DS v2.
 */
export function collectBrowserInfo() {
  return {
    browser_color_depth: String(window.screen.colorDepth),
    browser_screen_height: String(window.screen.height),
    browser_screen_width: String(window.screen.width),
    browser_language: window.navigator.language,
    browser_user_agent: window.navigator.userAgent,
    browser_tz: String(new Date().getTimezoneOffset()),
  };
}
