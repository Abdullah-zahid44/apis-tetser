import { requireAuth } from '@/lib/auth/session';
import { getSafeEnvironmentReadiness } from '@/lib/assanpay/credentials';
import { INITIAL_COUNTRIES } from '@/lib/assanpay/endpoint-registry';

export const runtime = 'nodejs';

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return Response.json(
      { error: 'Unauthorized. Access restricted to verified @assanpay.com employees.' },
      { status: 401 }
    );
  }

  const environments = ['sandbox'] as const;
  const configMap: Record<
    string,
    Record<string, ReturnType<typeof getSafeEnvironmentReadiness>>
  > = {};

  for (const country of INITIAL_COUNTRIES) {
    configMap[country.slug] = {};
    for (const env of environments) {
      configMap[country.slug][env] = getSafeEnvironmentReadiness(country.slug, env);
    }
  }

  return Response.json(
    {
      environments: configMap,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
