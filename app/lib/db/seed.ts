import dotenv from 'dotenv';
dotenv.config();

import { getDb } from './index';
import { countries, apiEndpoints } from './schema';
import { INITIAL_COUNTRIES, INITIAL_ENDPOINTS } from '../assanpay/endpoint-registry';
import { eq } from 'drizzle-orm';

export async function seed() {
  console.log('🌱 Starting AssanPay database seed...');
  const db = getDb();

  // 1. Seed countries
  const countryMap = new Map<string, string>(); // slug -> id

  for (const c of INITIAL_COUNTRIES) {
    const existing = await db
      .select()
      .from(countries)
      .where(eq(countries.slug, c.slug))
      .limit(1);

    if (existing.length > 0) {
      countryMap.set(c.slug, existing[0].id);
      await db
        .update(countries)
        .set({
          code: c.code,
          name: c.name,
          currency: c.currency,
          flagEmoji: c.flagEmoji,
          displayOrder: c.displayOrder,
          isActive: true,
        })
        .where(eq(countries.id, existing[0].id));
      console.log(`✓ Country ${c.name} (${c.slug}) already exists.`);
    } else {
      const inserted = await db
        .insert(countries)
        .values({
          code: c.code,
          slug: c.slug,
          name: c.name,
          currency: c.currency,
          flagEmoji: c.flagEmoji,
          displayOrder: c.displayOrder,
          isActive: true,
        })
        .returning({ id: countries.id });
      countryMap.set(c.slug, inserted[0].id);
      console.log(`✓ Inserted country: ${c.name} (${c.slug})`);
    }
  }

  // Remove the obsolete PKR-style catalog that was briefly published under
  // the Crypto market before the USDT/TRC-20 manual became the source of truth.
  const obsoleteCryptoSlugs = [
    'crypto-payin-encrypted',
    'crypto-zindigi-confirm',
    'crypto-sync-payin',
    'crypto-sync-payin-encrypted',
    'crypto-checkout-encrypted',
    'crypto-payout',
    'crypto-payout-encrypted',
    'crypto-payout-status',
  ];
  for (const slug of obsoleteCryptoSlugs) {
    await db.delete(apiEndpoints).where(eq(apiEndpoints.slug, slug));
  }

  // 2. Seed endpoints
  const endpointOrderByCountry = new Map<string, number>();
  for (const ep of INITIAL_ENDPOINTS) {
    const displayOrder = (endpointOrderByCountry.get(ep.countrySlug) || 0) + 1;
    endpointOrderByCountry.set(ep.countrySlug, displayOrder);
    const countryId = countryMap.get(ep.countrySlug);
    if (!countryId) {
      console.warn(`⚠️ Skipping endpoint ${ep.slug}: Country ${ep.countrySlug} not found.`);
      continue;
    }

    const existing = await db
      .select()
      .from(apiEndpoints)
      .where(eq(apiEndpoints.slug, ep.slug))
      .limit(1);

    if (existing.length > 0) {
      await db.update(apiEndpoints)
        .set({
          countryId,
          name: ep.name,
          category: ep.category,
          description: ep.description,
          method: ep.method,
          path: ep.path,
          defaultQuery: ep.defaultQuery || {},
          defaultHeaders: ep.defaultHeaders || {},
          defaultBody: ep.defaultBody || '',
          requiresSignature: ep.requiresSignature,
          signatureStrategy: ep.signatureStrategy || 'assanpay-v1',
          isMoneyMovement: ep.isMoneyMovement || false,
          isActive: true,
          displayOrder,
        })
        .where(eq(apiEndpoints.slug, ep.slug));
      console.log(`✓ Endpoint ${ep.name} (${ep.slug}) already exists.`);
    } else {
      await db.insert(apiEndpoints).values({
        countryId,
        name: ep.name,
        slug: ep.slug,
        category: ep.category,
        description: ep.description,
        method: ep.method,
        path: ep.path,
        defaultQuery: ep.defaultQuery || {},
        defaultHeaders: ep.defaultHeaders || {},
        defaultBody: ep.defaultBody || '',
        requiresSignature: ep.requiresSignature,
        signatureStrategy: ep.signatureStrategy || 'assanpay-v1',
        isMoneyMovement: ep.isMoneyMovement || false,
        isActive: true,
        displayOrder,
      });
      console.log(`✓ Inserted endpoint: ${ep.name} (${ep.slug})`);
    }
  }

  console.log('✅ Seeding completed successfully!');
}

if (process.argv[1]?.includes('seed')) {
  seed().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
