import {
  resolveVariablesInString,
  resolveVariablesInParams,
  resolveVariablesInHeaders,
  autoRefreshPayloadIdentifiers,
} from '../lib/variables/resolver';

export function runVariableTests(): { passed: boolean; message: string }[] {
  const results = [];

  const vars = {
    orderId: 'ORD-999',
    amount: '500',
    customerMobile: '03273595453',
    callbackUrl: 'https://merchant.com/webhook',
  };

  // 1. URL Path interpolation
  const path = '/api/merchant/status-inquiry?type=payin&orderId={{orderId}}';
  const resolvedPath = resolveVariablesInString(path, vars);
  results.push({
    passed: resolvedPath === '/api/merchant/status-inquiry?type=payin&orderId=ORD-999',
    message: `Interpolates path variable {{orderId}} correctly -> ${resolvedPath}`,
  });

  // 2. Request body JSON interpolation
  const body = '{"orderId": "{{orderId}}", "amount": {{amount}}, "contact": "{{customerMobile}}"}';
  const resolvedBody = resolveVariablesInString(body, vars);
  results.push({
    passed: resolvedBody === '{"orderId": "ORD-999", "amount": 500, "contact": "03273595453"}',
    message: `Interpolates multiple body variables correctly`,
  });

  // 3. Missing variable behavior (replaces with empty string if not keepUnresolved)
  const withMissing = 'Hello {{unknownVar}}!';
  const resolvedMissing = resolveVariablesInString(withMissing, vars, false);
  results.push({
    passed: resolvedMissing === 'Hello !',
    message: `Safely strips missing variable when keepUnresolved=false -> ${resolvedMissing}`,
  });

  const keptMissing = resolveVariablesInString(withMissing, vars, true);
  results.push({
    passed: keptMissing === 'Hello {{unknownVar}}!',
    message: `Preserves missing variable when keepUnresolved=true -> ${keptMissing}`,
  });

  // 4. Params interpolation
  const queryParams = { id: '{{orderId}}', sum: '{{amount}}' };
  const resolvedParams = resolveVariablesInParams(queryParams, vars);
  results.push({
    passed: resolvedParams.id === 'ORD-999' && resolvedParams.sum === '500',
    message: `Resolves query params map correctly`,
  });

  // 5. Headers interpolation
  const headers = { 'X-Order-Ref': '{{orderId}}' };
  const resolvedHeaders = resolveVariablesInHeaders(headers, vars);
  results.push({
    passed: resolvedHeaders['X-Order-Ref'] === 'ORD-999',
    message: `Resolves headers map correctly`,
  });

  // 6. Dynamic orderId and branchCode auto-refresh
  const samplePayload = JSON.stringify({
    orderId: 'ORD1999',
    amount: 10,
    branchCode: 'OLD_BRANCH',
  });
  const refreshedPayload = autoRefreshPayloadIdentifiers(samplePayload, { branchCode: 'APTEST01' });
  const parsedRefreshed = JSON.parse(refreshedPayload);
  results.push({
    passed:
      parsedRefreshed.orderId !== 'ORD1999' &&
      parsedRefreshed.orderId.startsWith('ORD') &&
      parsedRefreshed.branchCode === 'APTEST01',
    message: `Auto-refreshes static orderId and applies env branchCode: ${parsedRefreshed.orderId}, ${parsedRefreshed.branchCode}`,
  });

  // 7. Consecutive refreshes guarantee unique orderIds
  const secondRefreshed = autoRefreshPayloadIdentifiers(samplePayload, { newOrderId: 'ORD-UNIQUE-1' });
  const thirdRefreshed = autoRefreshPayloadIdentifiers(samplePayload, { newOrderId: 'ORD-UNIQUE-2' });
  results.push({
    passed: JSON.parse(secondRefreshed).orderId !== JSON.parse(thirdRefreshed).orderId,
    message: `Consecutive calls generate distinct unique orderIds`,
  });

  return results;
}
