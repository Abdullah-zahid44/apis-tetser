import {
  suggestVariables,
  getAutocompleteContext,
  DEFAULT_BUILTINS,
  MAX_SUGGESTIONS,
} from '../lib/variables/suggest';

export function runSuggestTests(): { passed: boolean; message: string }[] {
  const results: { passed: boolean; message: string }[] = [];
  const push = (passed: boolean, message: string) => results.push({ passed, message });

  const keys = [
    { key: 'apiKey', isSecret: true },
    { key: 'apiSecret', isSecret: true },
    { key: 'merchantId', isSecret: false },
    { key: 'myOrderRef', isSecret: false },
    { key: 'customerMobile', isSecret: false },
  ];

  // 1. Prefix matches rank before contains matches
  {
    const s = suggestVariables({ keys, partial: 'mer' });
    push(
      s.length > 0 && s[0].key === 'merchantId',
      `prefix match first: partial 'mer' -> ${s[0]?.key} (expected merchantId)`
    );
  }

  // 2. Prefix beats contains even when the contains match appears earlier in input
  {
    const s = suggestVariables({ keys, partial: 'api' });
    const names = s.map((x) => x.key);
    push(
      names[0] === 'apiKey' && names[1] === 'apiSecret',
      `prefix ranking: partial 'api' -> [${names.slice(0, 2).join(', ')}] (expected apiKey, apiSecret)`
    );
  }

  // 3. Case-insensitive contains matching
  {
    const s = suggestVariables({ keys, partial: 'MOBILE' });
    push(
      s.some((x) => x.key === 'customerMobile'),
      `case-insensitive contains: partial 'MOBILE' matches customerMobile -> ${s.map((x) => x.key).join(', ')}`
    );
  }

  // 4. Case-insensitive prefix matching
  {
    const s = suggestVariables({ keys, partial: 'APIK' });
    push(
      s.length > 0 && s[0].key === 'apiKey',
      `case-insensitive prefix: partial 'APIK' -> ${s[0]?.key} (expected apiKey)`
    );
  }

  // 5. Built-ins included when they match the partial, tagged as builtin
  {
    const s = suggestVariables({ keys, partial: 'ord' });
    const builtin = s.find((x) => x.key === 'orderId');
    push(
      !!builtin && builtin.builtin === true && builtin.isSecret === false,
      `builtin inclusion: partial 'ord' -> orderId found, builtin=${builtin?.builtin}, isSecret=${builtin?.isSecret}`
    );
  }

  // 6. Built-ins listed after user vars when partial is empty
  {
    const s = suggestVariables({ keys, partial: '' });
    const userNames = keys.map((k) => k.key);
    const builtinsFound = s.filter((x) => x.builtin).map((x) => x.key);
    const userSection = s.slice(0, keys.length).map((x) => x.key);
    push(
      builtinsFound.join(',') === DEFAULT_BUILTINS.join(',') &&
        userSection.join(',') === userNames.join(','),
      `empty partial: user vars first [${userSection.join(', ')}], built-ins after [${builtinsFound.join(', ')}]`
    );
  }

  // 7. Dedupe: user key with same name as a built-in wins (no duplicate)
  {
    const s = suggestVariables({ keys: [{ key: 'orderId', isSecret: true }], partial: '' });
    const matches = s.filter((x) => x.key.toLowerCase() === 'orderid');
    push(
      matches.length === 1 && matches[0].builtin === false && matches[0].isSecret === true,
      `dedupe: user 'orderId' wins over builtin -> single entry, builtin=${matches[0]?.builtin}, isSecret=${matches[0]?.isSecret}`
    );
  }

  // 8. Secret flag passes through to suggestions
  {
    const s = suggestVariables({ keys, partial: 'api' });
    const secret = s.find((x) => x.key === 'apiKey');
    const plain = s.find((x) => x.key === 'merchantId');
    push(
      secret?.isSecret === true && (plain === undefined || plain.isSecret === false),
      `secret flag passthrough: apiKey.isSecret=${secret?.isSecret}`
    );
  }

  // 9. Max cap respected
  {
    const many = Array.from({ length: 40 }, (_, i) => ({ key: `var${i}`, isSecret: false }));
    const s = suggestVariables({ keys: many, partial: '' });
    push(
      s.length === MAX_SUGGESTIONS,
      `cap: 40 user vars + built-ins -> ${s.length} suggestions (expected ${MAX_SUGGESTIONS})`
    );
  }

  // 10. No match -> empty list
  {
    const s = suggestVariables({ keys, partial: 'zzz_no_match' });
    push(s.length === 0, `no match: partial 'zzz_no_match' -> ${s.length} suggestions (expected 0)`);
  }

  // 11. getAutocompleteContext: detects open {{partial at caret
  {
    const ctx = getAutocompleteContext('{"orderId": "{{ord', 18);
    push(
      ctx !== null && ctx.start === 13 && ctx.partial === 'ord',
      `context detection: caret inside '{{ord' -> start=${ctx?.start}, partial='${ctx?.partial}' (expected 13, 'ord')`
    );
  }

  // 12. getAutocompleteContext: completed {{var}} closes the context
  {
    const ctx = getAutocompleteContext('{"orderId": "{{orderId}}"', 24);
    push(ctx === null, `completed variable: caret after '}}' -> ${ctx === null ? 'null' : 'context'} (expected null)`);
  }

  // 13. getAutocompleteContext: closing braces typed between {{ and caret close it
  {
    const ctx = getAutocompleteContext('{{ord}} extra {{te', 18);
    push(
      ctx !== null && ctx.partial === 'te',
      `second context: last open '{{te' detected -> partial='${ctx?.partial}' (expected 'te')`
    );
  }

  // 14. getAutocompleteContext: invalid characters after {{ -> no context
  {
    const ctx = getAutocompleteContext('{{ord er', 8);
    push(ctx === null, `space breaks context: '{{ord er' -> ${ctx === null ? 'null' : 'context'} (expected null)`);
  }

  // 15. getAutocompleteContext: empty partial right after {{ is a valid context
  {
    const ctx = getAutocompleteContext('{{', 2);
    push(
      ctx !== null && ctx.partial === '' && ctx.start === 0,
      `empty partial: '{{' -> partial='${ctx?.partial}' (expected '')`
    );
  }

  // 16. Suggestions carry no values — payload is keys + isSecret only
  {
    const s = suggestVariables({ keys: [{ key: 'apiKey', isSecret: true }], partial: 'api' });
    const payloadKeys = s.length > 0 ? Object.keys(s[0]).sort() : [];
    push(
      payloadKeys.join(',') === 'builtin,isSecret,key',
      `no values leak: suggestion payload keys = ${payloadKeys.join(', ')}`
    );
  }

  return results;
}
