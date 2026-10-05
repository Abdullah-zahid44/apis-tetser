import { historyKindForCategory, historyKindForUrl } from '../lib/assanpay/executor';

export function runHistoryKindTests(): { passed: boolean; message: string }[] {
  const results: { passed: boolean; message: string }[] = [];
  const check = (actual: unknown, expected: unknown, label: string) => {
    const ok = actual === expected;
    results.push({
      passed: ok,
      message: `${ok ? '' : 'EXPECTED ' + JSON.stringify(expected) + ' GOT ' + JSON.stringify(actual) + ' — '}${label}`,
    });
  };

  // historyKindForCategory — exact category strings from the endpoint catalog
  check(historyKindForCategory('Payin'), 'payin', "category 'Payin' -> payin");
  check(historyKindForCategory('Payout'), 'payout', "category 'Payout' -> payout");
  check(historyKindForCategory('Checkout'), 'other', "category 'Checkout' -> other");
  check(historyKindForCategory('Status'), 'other', "category 'Status' -> other");
  check(historyKindForCategory(null), 'other', 'category null -> other');
  check(historyKindForCategory(undefined), 'other', 'category undefined -> other');
  check(historyKindForCategory(''), 'other', "category '' -> other");
  check(historyKindForCategory('payin'), 'other', "lowercase 'payin' -> other (exact match only)");

  // historyKindForUrl — heuristic fallback, case-insensitive
  check(historyKindForUrl('https://pc.assanpay.com/api/payout/create'), 'payout', 'URL with payout -> payout');
  check(historyKindForUrl('https://pc.assanpay.com/api/PAYOUT/status'), 'payout', 'uppercase PAYOUT -> payout');
  check(historyKindForUrl('https://pc.assanpay.com/api/payin/init'), 'payin', 'URL with payin -> payin');
  check(historyKindForUrl('https://pc.assanpay.com/api/PayIn/async'), 'payin', 'mixed-case PayIn -> payin');
  check(historyKindForUrl('https://pc.assanpay.com/api/status-inquiry'), 'other', 'unrelated URL -> other');
  check(historyKindForUrl('https://pc.assanpay.com/api/payout/payin-mixed'), 'payout', 'both present -> payout wins');
  check(historyKindForUrl(null), 'other', 'null URL -> other');
  check(historyKindForUrl(undefined), 'other', 'undefined URL -> other');
  check(historyKindForUrl(''), 'other', "empty URL -> other");

  return results;
}
