/**
 * Variable autocomplete suggestions for the {{variableName}} syntax.
 *
 * Pure logic: no DOM, no fetch. Ranks user variables against the typed
 * partial, then appends matching built-in dynamic variables.
 * The payload is keys + isSecret flags only — values never flow through here.
 */

export interface VariableKeyInfo {
  key: string;
  isSecret: boolean;
}

export interface Suggestion {
  key: string;
  isSecret: boolean;
  builtin: boolean;
}

/** Built-in dynamic variables (see lib/variables/resolver.ts). */
export const DEFAULT_BUILTINS = ['uuid', 'timestamp', 'orderId', 'branchCode'];

/** Max suggestions returned by suggestVariables. */
export const MAX_SUGGESTIONS = 12;

export interface SuggestOptions {
  /** User variables from GET /api/variables (keys + isSecret flags only). */
  keys: VariableKeyInfo[];
  /** The partial text typed after `{{` (may be empty). */
  partial: string;
  /** Built-in variable names to include. Defaults to DEFAULT_BUILTINS. */
  builtins?: string[];
}

/**
 * Returns up to MAX_SUGGESTIONS autocomplete suggestions.
 *
 * Ranking: user keys with a case-insensitive prefix match first, then user
 * keys with a case-insensitive contains match, then built-ins that match
 * (prefix before contains). When partial is empty, all user keys come first,
 * then all built-ins. A user key with the same name (case-insensitive) as a
 * built-in wins — the built-in is dropped (dedupe).
 */
export function suggestVariables({ keys, partial, builtins = DEFAULT_BUILTINS }: SuggestOptions): Suggestion[] {
  const p = (partial || '').toLowerCase();
  const suggestions: Suggestion[] = [];
  const seen = new Set<string>();

  // Collect user keys in prefix-then-contains order (case-insensitive).
  for (const bucket of [true, false]) {
    for (const k of keys) {
      const lowered = k.key.toLowerCase();
      if (!lowered.includes(p)) continue;
      const isPrefix = lowered.startsWith(p);
      if (isPrefix !== bucket) continue;
      seen.add(lowered);
      suggestions.push({ key: k.key, isSecret: k.isSecret, builtin: false });
    }
  }

  // Built-ins: drop any whose name collides with a user key (user key wins).
  for (const bucket of [true, false]) {
    for (const b of builtins) {
      const lowered = b.toLowerCase();
      if (seen.has(lowered)) continue;
      if (!lowered.includes(p)) continue;
      const isPrefix = lowered.startsWith(p);
      if (isPrefix !== bucket) continue;
      seen.add(lowered);
      suggestions.push({ key: b, isSecret: false, builtin: true });
    }
  }

  return suggestions.slice(0, MAX_SUGGESTIONS);
}

export interface AutocompleteContext {
  /** Index of the opening `{{` in the text. */
  start: number;
  /** Text between `{{` and the caret (letters/digits/underscore only). */
  partial: string;
}

/**
 * Detects an open `{{partial` context at the caret for autocomplete.
 * Scans backwards from the caret for `{{` with no closing `}}` before the
 * caret; the text after `{{` must be letters/digits/underscore (the partial).
 * Returns null when there is no open variable context (completed `}}`,
 * invalid characters, or no `{{` at all).
 */
export function getAutocompleteContext(text: string, caret: number): AutocompleteContext | null {
  if (caret < 2 || caret > text.length) return null;
  const before = text.slice(0, caret);
  const openIdx = before.lastIndexOf('{{');
  if (openIdx === -1) return null;
  const afterOpen = before.slice(openIdx + 2);
  if (afterOpen.includes('}}')) return null;
  if (!/^[a-zA-Z0-9_]*$/.test(afterOpen)) return null;
  return { start: openIdx, partial: afterOpen };
}
