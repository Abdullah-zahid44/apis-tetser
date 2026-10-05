import { parseAmount, formatAmount } from '../lib/parse-amount';

export function runParseAmountTests(): { passed: boolean; message: string }[] {
  const results: { passed: boolean; message: string }[] = [];

  const cases: Array<{
    label: string;
    body: string | null | undefined;
    expected: number | null;
  }> = [
    { label: 'lowercase amount key', body: '{"amount":5000}', expected: 5000 },
    { label: 'PascalCase Amount key', body: '{"Amount":1250}', expected: 1250 },
    { label: 'UPPERCASE AMOUNT key', body: '{"AMOUNT":99}', expected: 99 },
    { label: 'numeric string value', body: '{"Amount":"1250.50"}', expected: 1250.5 },
    { label: 'numeric string with surrounding whitespace', body: '{"amount":" 300 "}', expected: 300 },
    { label: 'lowercase key wins over PascalCase', body: '{"amount":1,"Amount":2}', expected: 1 },
    { label: 'PascalCase wins over UPPERCASE', body: '{"Amount":2,"AMOUNT":3}', expected: 2 },
    { label: 'missing keys -> null', body: '{"orderId":"ORD-1"}', expected: null },
    { label: 'non-numeric string -> null', body: '{"amount":"abc"}', expected: null },
    { label: 'empty string value -> null', body: '{"amount":""}', expected: null },
    { label: 'invalid JSON -> null', body: 'not-json{', expected: null },
    { label: 'JSON array -> null', body: '[5000]', expected: null },
    { label: 'JSON number at top level -> null', body: '5000', expected: null },
    { label: 'empty body -> null', body: '', expected: null },
    { label: 'null body -> null', body: null, expected: null },
    { label: 'undefined body -> null', body: undefined, expected: null },
    { label: 'zero amount parses', body: '{"amount":0}', expected: 0 },
    { label: 'falls through garbage lowercase to valid PascalCase', body: '{"amount":"abc","Amount":42}', expected: 42 },
  ];

  for (const c of cases) {
    const actual = parseAmount(c.body);
    results.push({
      passed: actual === c.expected,
      message: `parseAmount: ${c.label} -> ${String(actual)} (expected ${String(c.expected)})`,
    });
  }

  results.push({
    passed: formatAmount('{"amount":12500}') === '12,500',
    message: `formatAmount: formats 12500 as "12,500" -> ${formatAmount('{"amount":12500}')}`,
  });
  results.push({
    passed: formatAmount('{"Amount":"999.99"}') === '999.99',
    message: `formatAmount: keeps decimals "999.99" -> ${formatAmount('{"Amount":"999.99"}')}`,
  });
  results.push({
    passed: formatAmount('{"amount":"nope"}') === '—',
    message: `formatAmount: unparseable renders as '—' -> ${formatAmount('{"amount":"nope"}')}`,
  });
  results.push({
    passed: formatAmount(null) === '—',
    message: `formatAmount: null body renders as '—' -> ${formatAmount(null)}`,
  });

  return results;
}
