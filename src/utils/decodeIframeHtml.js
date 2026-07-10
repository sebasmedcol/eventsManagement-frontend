/**
 * Decodifica HTML escapado del challenge 3DS (three_ds_method_data).
 */
export function decodeIframeHtml(escapedHtml) {
  if (!escapedHtml) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(escapedHtml, 'text/html');
  return doc.documentElement?.outerHTML || escapedHtml
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

export function extractChallengeHtml(threeDsAuth) {
  if (!threeDsAuth?.three_ds_method_data) return null;
  return decodeIframeHtml(threeDsAuth.three_ds_method_data);
}
