import { INITIAL_COUNTRIES, INITIAL_ENDPOINTS } from '../lib/assanpay/endpoint-registry';

export function runCryptoCatalogTests(): { passed: boolean; message: string }[] {
  const results = [];
  const market = INITIAL_COUNTRIES.find((country) => country.slug === 'crypto');
  const endpoints = INITIAL_ENDPOINTS.filter((endpoint) => endpoint.countrySlug === 'crypto');
  const bySlug = new Map(endpoints.map((endpoint) => [endpoint.slug, endpoint]));

  results.push({
    passed: market?.currency === 'USDT' && market.name.includes('TRC-20'),
    message: 'Defines Crypto as the USDT on TRON (TRC-20) market',
  });
  results.push({
    passed:
      endpoints.length === 4 &&
      bySlug.get('crypto-payin')?.path === '/api/payments' &&
      bySlug.get('crypto-checkout')?.path === '/api/checkout/sessions' &&
      bySlug.get('crypto-payin-status')?.path === '/api/merchant/status-inquiry' &&
      bySlug.get('crypto-balance')?.path === '/api/merchant/balance/h2h',
    message: 'Registers only the four APIs listed in the USDT manual index',
  });

  const payin = JSON.parse(bySlug.get('crypto-payin')?.defaultBody || '{}');
  results.push({
    passed:
      payin.branchCode === '{{branchCode}}' &&
      payin.orderId === '{{orderId}}' &&
      payin.amount === 25.5 &&
      payin.currency === 'USDT' &&
      payin.expiresInMinutes === 30,
    message: 'Uses the documented H2H USDT payin body and 30-minute default expiry',
  });

  const checkout = JSON.parse(bySlug.get('crypto-checkout')?.defaultBody || '{}');
  results.push({
    passed:
      checkout.currency === 'USDT' &&
      checkout.expiresInSeconds === 1800 &&
      typeof checkout.successUrl === 'string' &&
      typeof checkout.failedUrl === 'string' &&
      typeof checkout.pendingUrl === 'string',
    message: 'Uses the documented hosted USDT checkout fields and 1800-second expiry',
  });

  results.push({
    passed:
      bySlug.get('crypto-payin-status')?.requiresSignature === false &&
      JSON.stringify(bySlug.get('crypto-payin-status')?.defaultQuery) ===
        JSON.stringify({ orderId: '{{orderId}}' }) &&
      bySlug.get('crypto-balance')?.requiresSignature === true,
    message: 'Keeps status API-key-only while balance remains HMAC-signed',
  });

  const serialized = JSON.stringify(endpoints).toLowerCase();
  results.push({
    passed:
      !serialized.includes('jazzcash') &&
      !serialized.includes('easypaisa') &&
      !serialized.includes('zindigi') &&
      !serialized.includes('payout') &&
      !serialized.includes('encrypted'),
    message: 'Excludes the obsolete PKR, payout, and encrypted endpoint catalog',
  });

  return results;
}
