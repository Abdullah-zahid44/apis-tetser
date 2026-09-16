import { runAuthTests } from './auth.test';
import { runVariableTests } from './variables.test';
import { runSecurityTests } from './security.test';
import { runSigningTests } from './signing.test';
import { runCallbackTests } from './callbacks.test';

async function main() {
  console.log('🧪 Running AssanPay Console Test Suites...\n');

  const suites = [
    { name: 'Authentication & @assanpay.com Domain Validation', runner: runAuthTests },
    { name: 'Postman-Style Variable Resolver', runner: runVariableTests },
    { name: 'SSRF Host Validation & Audit Masking', runner: runSecurityTests },
    { name: 'HMAC-SHA256 Request Signing Spec', runner: runSigningTests },
    { name: 'Webhook Callback Verification & Raw Body Integrity', runner: runCallbackTests },
  ];

  let total = 0;
  let passed = 0;
  let failed = 0;

  for (const suite of suites) {
    console.log(`▶ Suite: ${suite.name}`);
    const results = suite.runner();
    for (const r of results) {
      total++;
      if (r.passed) {
        passed++;
        console.log(`  ✓ ${r.message}`);
      } else {
        failed++;
        console.error(`  ✗ FAIL: ${r.message}`);
      }
    }
    console.log('');
  }

  console.log(`══════════════════════════════════════`);
  console.log(`Results: ${passed}/${total} passed (${failed} failed)`);
  console.log(`══════════════════════════════════════`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test runner encountered an error:', err);
  process.exit(1);
});
