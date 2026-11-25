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

      // 2. Basic format check (any Google account is allowed — no domain restriction)
      const parts = normalizedEmail.split('@');
      if (parts.length < 2) return false;

      // 3. Check if Google verified the email
      if (profile && typeof profile === 'object' && 'email_verified' in profile) {
        if (profile.email_verified === false) {
          console.warn(`[AUTH] Rejected sign-in attempt with unverified email: ${normalizedEmail}`);
          return false;
        }
      }

      // 4. Upsert internal user into PostgreSQL
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
            name: user.name || 'Portal User',
            email: normalizedEmail,
            image: user.image || null,
            role: 'support',
            lastLoginAt: new Date(),
          });
        }
      } catch (err) {
        console.error('[AUTH] Could not synchronize user to database:', err);
        // Do not block login if database is momentarily degraded; email was verified by Google
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
        session.user.name = (token.name as string) || session.user.name || 'Local Dev Engineer';
        (session.user as { role?: string }).role = (token.role as string) || 'admin';
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
          // DB optional in local dev
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email.toLowerCase();
        if (user.name) token.name = user.name;
        if ((user as { role?: string }).role) token.role = (user as { role?: string }).role;
      }
      return token;
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
