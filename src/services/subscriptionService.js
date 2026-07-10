import api from './api';

export const getAcceptanceTokens = () =>
  api.get('/subscriptions/acceptance-tokens').then((r) => r.data.data);

export const getCheckoutPreview = (planId) =>
  api.get(`/subscriptions/checkout-preview/${planId}`).then((r) => r.data.data);

export const initiateCheckout = (planId) =>
  api.post('/subscriptions/checkout', { planId }).then((r) => r.data.data);

export const payWith3DS = (payload) =>
  api.post('/subscriptions/pay-with-3ds', payload).then((r) => r.data.data);

export const getTransactionStatus = (transactionId) =>
  api.get(`/subscriptions/transactions/${transactionId}/status`).then((r) => r.data.data);

export const createPaymentSource = (payload) =>
  api.post('/subscriptions/payment-sources', payload).then((r) => r.data.data);

export const getPaymentSourceStatus = (paymentSourceId) =>
  api.get(`/subscriptions/payment-sources/${paymentSourceId}/status`).then((r) => r.data.data);

/**
 * Tokeniza tarjeta directamente con Wompi (llave pública — nunca enviar PAN al backend).
 */
export async function tokenizeCard({ number, expMonth, expYear, cvc, cardHolder }) {
  const apiUrl = import.meta.env.VITE_WOMPI_API_URL;
  const publicKey = import.meta.env.VITE_WOMPI_PUBLIC_KEY;

  if (!apiUrl || !publicKey) {
    throw new Error('Wompi no configurado en el frontend (.env.development).');
  }

  const response = await fetch(`${apiUrl}/tokens/cards`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${publicKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: number.replace(/\s/g, ''),
      exp_month: expMonth.padStart(2, '0'),
      exp_year: expYear.slice(-2),
      cvc,
      card_holder: cardHolder,
    }),
  });

  const json = await response.json();
  if (!response.ok || json.status !== 'CREATED') {
    const msg = json.error?.messages?.join?.(' ') || json.error?.reason || 'Tokenización fallida';
    throw new Error(msg);
  }
  return json.data.id;
}

export const SANDBOX_3DS_SCENARIOS = [
  { value: 'challenge_v2', label: '3DS con Challenge (iframe) — recomendado' },
  { value: 'no_challenge_success', label: '3DS aprobado sin challenge (rápido)' },
  { value: 'challenge_denied', label: '3DS declinado (prueba error)' },
];

export const SANDBOX_TEST_CARD = {
  number: '4242 4242 4242 4242',
  expMonth: '12',
  expYear: '29',
  cvc: '123',
  cardHolder: 'Cliente Prueba NextEvents',
};
