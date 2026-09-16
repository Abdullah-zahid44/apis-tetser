import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          hd: 'assanpay.com',
          prompt: 'select_account',
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) return false;

      // 1. Normalize email to lowercase
      const normalizedEmail = user.email.trim().toLowerCase();

      // 2. Extract domain after the final @
      const parts = normalizedEmail.split('@');
      if (parts.length < 2) return false;
      const domain = parts[parts.length - 1];

      // 3. Reject any domain that is not exactly assanpay.com
      if (domain !== 'assanpay.com') {
        console.warn(`[AUTH] Rejected sign-in attempt from non-AssanPay domain: ${normalizedEmail}`);
        return false;
      }

      // 4. Check if Google verified the email
      if (profile && typeof profile === 'object' && 'email_verified' in profile) {
        if (profile.email_verified === false) {
          console.warn(`[AUTH] Rejected sign-in attempt with unverified email: ${normalizedEmail}`);
          return false;
        }
      }

      // 5. Upsert internal user into PostgreSQL
      try {
        const db = getDb();
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(users)
            .set({
              name: user.name || existing[0].name,
              image: user.image || existing[0].image,
              lastLoginAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(users.id, existing[0].id));
        } else {
          await db.insert(users).values({
            name: user.name || 'AssanPay Staff',
            email: normalizedEmail,
            image: user.image || null,
            role: 'support',
            lastLoginAt: new Date(),
          });
        }
      } catch (err) {
        console.error('[AUTH] Could not synchronize user to database:', err);
        // Do not block login if database is momentarily degraded; user domain was validated
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
        try {
          const db = getDb();
          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.email, token.email as string))
            .limit(1);
          if (dbUser.length > 0) {
            session.user.id = dbUser[0].id;
            (session.user as { id?: string; role?: string }).role = dbUser[0].role;
          }
        } catch {
          (session.user as { role?: string }).role = 'support';
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email.toLowerCase();
      }
      return token;
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
