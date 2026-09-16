import { auth } from './config';

export type AuthenticatedUser = {
  id?: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string;
};

/**
 * Validates the caller's session server-side.
 * Returns the AuthenticatedUser if valid and ends in @assanpay.com.
 * Returns null if unauthenticated or unauthorized.
 */
export async function requireAuth(): Promise<AuthenticatedUser | null> {
  // Check development bypass only if explicitly enabled in local .env
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
    return {
      id: 'dev-user-id',
      name: 'Local Dev Engineer',
      email: 'support@assanpay.com',
      image: null,
      role: 'admin',
    };
  }

  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }

  const email = session.user.email.trim().toLowerCase();
  const domain = email.split('@').pop();

  if (domain !== 'assanpay.com') {
    return null;
  }

  return {
    id: session.user.id || '',
    name: session.user.name,
    email,
    image: session.user.image,
    role: (session.user as { role?: string }).role || 'support',
  };
}

/**
 * Helper to validate an email domain strictly.
 */
export function isValidAssanPayEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  if (parts.length < 2) return false;
  return parts[parts.length - 1] === 'assanpay.com';
}
