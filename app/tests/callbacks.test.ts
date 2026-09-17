import { verifyCallbackSignature } from '../lib/assanpay/callbacks';
import crypto from 'node:crypto';
import { getAssanPayCallbackSecret, getAssanPayCredentials } from '../lib/assanpay/credentials';
import { callbackOrigin, withCallbackUrl } from '../lib/assanpay/callback-template';
import { INITIAL_ENDPOINTS } from '../lib/assanpay/endpoint-registry';

export function runCallbackTests(): { passed: boolean; message: string }[] {
  const results = [];
  const apiSecret = 'test_webhook_secret_9988';
  const eventId = 'evt_20260427182019';
  const timestamp = '1712345678';
  const rawBody = '{"rail":"MW","type":"payin","amount":1,"status":"SUCCESS","orderId":"ORD1999"}';

  // Generate valid signature using official formula: Base64(HMAC-SHA256(`${eventId}\n${timestamp}\n${rawBody}`, secret))
  const canonical = `${eventId}\n${timestamp}\n${rawBody}`;
  const validSignature = crypto
    .createHmac('sha256', apiSecret)
    .update(canonical)
    .digest('base64');

  const validHeaders = {
    'X-Assanpay-Event-Id': eventId,
    'X-Assanpay-Timestamp': timestamp,
    'X-Assanpay-Signature': validSignature,
  };

  // 1. Valid signature accepted
  const validRes = verifyCallbackSignature(rawBody, validHeaders, apiSecret);
  results.push({
    passed: validRes.valid === true,
    message: `Accepts genuinely signed webhook callback`,
  });

  // 2. Tampered / altered raw body rejected
  const alteredBody = '{"rail":"MW","type":"payin","amount":99999,"status":"SUCCESS","orderId":"ORD1999"}';
  const alteredRes = verifyCallbackSignature(alteredBody, validHeaders, apiSecret);
  results.push({
    passed: alteredRes.valid === false,
    message: `Rejects callback when raw body content has been altered`,
  });

  // 3. Invalid signature string rejected
  const badHeaders = {
    ...validHeaders,
    'X-Assanpay-Signature': 'invalid_signature_base64==',
  };
  const badRes = verifyCallbackSignature(rawBody, badHeaders, apiSecret);
  results.push({
    passed: badRes.valid === false,
    message: `Rejects signature mismatch`,
  });

  // 4. Missing required headers rejected
  const missingRes = verifyCallbackSignature(rawBody, {}, apiSecret);
  results.push({
    passed: missingRes.valid === false,
    message: `Rejects callback missing required headers`,
  });

  const publicOrigin = 'https://assanpay-apis-testing.vercel.app';
  for (const country of ['pkr', 'bdt', 'idr', 'php']) {
    const templates = INITIAL_ENDPOINTS.filter((endpoint) => endpoint.countrySlug === country && endpoint.defaultBody?.includes('"callbackUrl"'));
    results.push({
      passed: templates.length > 0 && templates.every((endpoint) => {
        const filled = JSON.parse(withCallbackUrl(endpoint.defaultBody || '', country, publicOrigin));
        return filled.callbackUrl === `${publicOrigin}/api/callbacks/assanpay/${country}`;
      }),
      message: `Prefills ${country.toUpperCase()} callback URLs in request templates`,
    });
  }
  results.push({
    passed: withCallbackUrl('{"orderId":"A1"}', 'pkr', publicOrigin) === '{"orderId":"A1"}' &&
      callbackOrigin('http://localhost:3000/api/endpoints', publicOrigin) === publicOrigin,
    message: 'Leaves templates without callbackUrl untouched and prefers the configured public origin',
  });

  // Outgoing branch signing and incoming main-merchant verification are isolated.
  const branchKey = 'ASSANPAY_PKR_SANDBOX_API_KEY';
  const branchSecretKey = 'ASSANPAY_PKR_SANDBOX_API_SECRET';
  const mainSecretKey = 'ASSANPAY_PKR_SANDBOX_MAIN_API_SECRET';
  const productionKeys = [
    'ASSANPAY_PKR_PRODUCTION_API_KEY',
    'ASSANPAY_PKR_PRODUCTION_API_SECRET',
    'ASSANPAY_PKR_PRODUCTION_MAIN_API_SECRET',
  ];
  const testKeys = [branchKey, branchSecretKey, mainSecretKey, ...productionKeys];
  const previous = testKeys.map((key) => process.env[key]);
  try {
    process.env[branchKey] = 'branch_api_key';
    process.env[branchSecretKey] = 'branch_request_secret';
    process.env[mainSecretKey] = apiSecret;

    const branch = getAssanPayCredentials('pkr', 'sandbox');
    const callbackSecret = getAssanPayCallbackSecret('pkr', 'sandbox');
    results.push({
      passed: branch.apiKey === 'branch_api_key' && branch.apiSecret === 'branch_request_secret' && callbackSecret === apiSecret,
      message: 'Keeps branch request credentials separate from main callback secret',
    });
    results.push({
      passed: verifyCallbackSignature(rawBody, validHeaders, callbackSecret || '').valid &&
        !verifyCallbackSignature(rawBody, validHeaders, branch.apiSecret || '').valid,
      message: 'Verifies callback with main merchant secret, not branch secret',
    });

    delete process.env[mainSecretKey];
    results.push({
      passed: getAssanPayCallbackSecret('pkr', 'sandbox') === undefined,
      message: 'Does not fall back to branch secret when main callback secret is missing',
    });

    productionKeys.forEach((key) => { process.env[key] = 'live_value_must_not_be_used'; });
    results.push({
      passed: getAssanPayCredentials('pkr', 'production').apiKey === undefined &&
        getAssanPayCallbackSecret('pkr', 'production') === undefined,
      message: 'Never resolves production credentials in sandbox-only mode',
    });
  } finally {
    testKeys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }

  return results;
}
