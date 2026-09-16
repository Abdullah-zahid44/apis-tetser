import { isValidAssanPayEmail } from '../lib/auth/session';

export function runAuthTests(): { passed: boolean; message: string }[] {
  const results = [];

  // Valid emails
  const validEmails = [
    'support@assanpay.com',
    'developer@assanpay.com',
    'taqi@assanpay.com',
    'FIRST.LAST@ASSANPAY.COM', // case-insensitive check
  ];

  for (const email of validEmails) {
    const valid = isValidAssanPayEmail(email);
    results.push({
      passed: valid === true,
      message: `Accepts valid employee email: ${email} -> ${valid}`,
    });
  }

  // Unauthorized / Rejected emails
  const invalidEmails = [
    'user@gmail.com',
    'user@yahoo.com',
    'user@assanpay.co', // wrong TLD
    'assanpay@gmail.com',
    'user@fakeassanpay.com',
    'user@assanpay.com.attacker.com',
    'support@sub.assanpay.com',
    '',
    null,
    undefined,
  ];

  for (const email of invalidEmails) {
    const valid = isValidAssanPayEmail(email);
    results.push({
      passed: valid === false,
      message: `Rejects unauthorized email: ${email ?? 'empty'} -> ${valid === false}`,
    });
  }

  return results;
}
