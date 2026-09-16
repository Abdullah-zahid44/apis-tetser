import { URL } from 'node:url';

/**
 * Validates that a requested URL is safe against SSRF attacks
 * and strictly targets the configured AssanPay base origin.
 */
export function validateAssanPayUrl(
  targetPathOrUrl: string,
  configuredBaseUrl: string
): { valid: boolean; finalUrl?: URL; error?: string } {
  try {
    const base = new URL(configuredBaseUrl);

    // Require HTTPS unless explicitly in local test environment
    if (base.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
      return { valid: false, error: 'Configured gateway base URL must use HTTPS.' };
    }

    // Resolve target relative to configured base
    const resolved = new URL(targetPathOrUrl, base.origin);

    // 1. Origin check: Must strictly match the configured AssanPay gateway origin
    if (resolved.origin.toLowerCase() !== base.origin.toLowerCase()) {
      return {
        valid: false,
        error: `Request origin (${resolved.origin}) does not match configured AssanPay host (${base.origin}).`,
      };
    }

    // 2. Path prefix check: Must start with /api/
    if (!resolved.pathname.startsWith('/api/')) {
      return {
        valid: false,
        error: `Request path must begin with /api/ (received: ${resolved.pathname}).`,
      };
    }

    // 3. Block private / loopback IP hostnames directly
    const hostname = resolved.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return { valid: false, error: 'Access to loopback/internal hosts is strictly blocked.' };
    }

    // 4. Block AWS/GCP/Azure link-local cloud metadata service (169.254.169.254)
    if (hostname.startsWith('169.254.') || hostname.startsWith('10.') || hostname.startsWith('192.168.')) {
      return { valid: false, error: 'Access to private or metadata network addresses is blocked.' };
    }

    return { valid: true, finalUrl: resolved };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Invalid request URL.' };
  }
}
