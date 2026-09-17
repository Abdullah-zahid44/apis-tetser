/**
 * Postman-style variable resolver for {{variableName}} patterns.
 * Interpolates variables into URLs, query params, headers, and request bodies.
 */

export type VariableMap = Record<string, string>;

/**
 * Replaces all occurrences of {{varName}} in a string with its resolved value.
 * If a variable is missing, leaves {{varName}} intact or replaces with empty string.
 */
export function resolveVariablesInString(
  input: string,
  variables: VariableMap,
  keepUnresolved = false
): string {
  if (!input) return input;

  return input.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return variables[key];
    }
    return keepUnresolved ? match : '';
  });
}

/**
 * Resolves variables across query parameters.
 */
export function resolveVariablesInParams(
  params: Record<string, string>,
  variables: VariableMap
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    resolved[resolveVariablesInString(k, variables)] = resolveVariablesInString(v, variables);
  }
  return resolved;
}

/**
 * Resolves variables across headers.
 */
export function resolveVariablesInHeaders(
  headers: Record<string, string>,
  variables: VariableMap
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    resolved[k] = resolveVariablesInString(v, variables);
  }
  return resolved;
}

/**
 * Generates a fresh guaranteed unique orderId based on current unix timestamp.
 */
export function generateOrderId(prefix = 'ORD'): string {
  return `${prefix}${Date.now()}`;
}

/**
 * Generates dynamic mock variables if not already defined:
 * e.g. {{uuid}}, {{timestamp}}, {{orderId}}, {{branchCode}}
 */
export function getBuiltInDynamicVariables(): VariableMap {
  const now = Date.now();
  const branchCode =
    (typeof process !== 'undefined' && (process.env.ASSANPAY_BRANCH_CODE || process.env.NEXT_PUBLIC_ASSANPAY_BRANCH_CODE)) ||
    'APTEST01';

  return {
    timestamp: Math.floor(now / 1000).toString(),
    isoTimestamp: new Date(now).toISOString(),
    uuid: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    randomOrderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    orderId: generateOrderId('ORD'),
    branchCode,
  };
}

/**
 * Merges built-in dynamic variables with user variables.
 */
export function mergeVariables(userVars: VariableMap): VariableMap {
  return {
    ...getBuiltInDynamicVariables(),
    ...userVars,
  };
}

/**
 * Automatically updates dynamic transaction identifiers (fresh unique orderId and env branchCode)
 * in a JSON or raw payload string before execution.
 */
export function autoRefreshPayloadIdentifiers(
  bodyStr: string,
  options?: { branchCode?: string; newOrderId?: string; forceRefreshOrderId?: boolean }
): string {
  if (!bodyStr || !bodyStr.trim()) return bodyStr;

  const freshOrderId = options?.newOrderId || generateOrderId('ORD');
  const targetBranch =
    options?.branchCode ||
    (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_ASSANPAY_BRANCH_CODE || process.env.ASSANPAY_BRANCH_CODE)) ||
    'APTEST01';

  try {
    const parsed: unknown = JSON.parse(bodyStr);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      let changed = false;

      if ('orderId' in record) {
        const currentOrderId = String(record.orderId || '');
        if (
          options?.forceRefreshOrderId !== false &&
          (options?.forceRefreshOrderId ||
            currentOrderId === 'ORD1999' ||
            currentOrderId === '{{orderId}}' ||
            currentOrderId.startsWith('ORD') ||
            currentOrderId.startsWith('PO-') ||
            currentOrderId.startsWith('OR'))
        ) {
          record.orderId = freshOrderId;
          changed = true;
        }
      }
      if ('branchCode' in record && targetBranch) {
        record.branchCode = targetBranch;
        changed = true;
      }

      if (changed) {
        return JSON.stringify(record, null, 2);
      }
    }
  } catch {
    // If not strict JSON, apply regex replacement
    let updated = bodyStr.replace(/"orderId"\s*:\s*"[^"]*"/g, `"orderId": "${freshOrderId}"`);
    if (targetBranch) {
      updated = updated.replace(/"branchCode"\s*:\s*"[^"]*"/g, `"branchCode": "${targetBranch}"`);
    }
    return updated;
  }

  return bodyStr;
}
