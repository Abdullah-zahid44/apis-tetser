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
 * Generates dynamic mock variables if not already defined:
 * e.g. {{uuid}}, {{timestamp}}, {{randomOrderId}}
 */
export function getBuiltInDynamicVariables(): VariableMap {
  const now = Date.now();
  return {
    timestamp: Math.floor(now / 1000).toString(),
    isoTimestamp: new Date(now).toISOString(),
    uuid: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    randomOrderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
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
