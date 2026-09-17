import React from 'react';
import { signIn } from '@/lib/auth/config';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { BorderBeam } from '@/registry/magicui/border-beam';

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isDenied = searchParams.error === 'AccessDenied' || searchParams.error === 'OAuthSignin' || Boolean(searchParams.error);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-15 bg-[#0265d2]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-10 bg-[#e05320]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        <Card className="relative overflow-hidden border border-border bg-card shadow-[var(--shadow-card)]">
          <CardHeader className="text-center pb-2">
            {/* Brand Mark */}
            <div className="mx-auto brand-mark inline-flex items-center justify-center w-13 h-13 rounded-xl mb-3">
              <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.2} />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              AssanPay Console
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Internal API Workbench &amp; Testing Workspace
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Error Alert */}
            {isDenied && (
              <div className="p-3 rounded-md flex items-start gap-2.5 animate-fade-in bg-destructive/10 border border-destructive/25">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-destructive text-xs block mb-0.5">
                    Authentication Rejected
                  </strong>
                  <span className="text-[11px] leading-relaxed text-muted-foreground">
                    Access restricted to authorized AssanPay employees only.
                  </span>
                </div>
              </div>
            )}

            {/* Google Sign In Button */}
            <form
              action={async () => {
                'use server';
                await signIn('google', { redirectTo: '/' });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                size="lg"
                className="w-full h-11 text-sm rounded-[5px] flex items-center justify-center gap-2.5 border-border bg-[var(--surface-4)] text-foreground hover:bg-[var(--surface-3)]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center pb-5 pt-1">
            <p className="text-xs text-muted-foreground">
              Restricted to <span className="text-primary font-semibold">@assanpay.com</span> accounts
            </p>
          </CardFooter>

          {/* Glowing Border Beam with Postman brand gradient */}
          <BorderBeam duration={8} size={120} colorFrom="#0265d2" colorTo="#e05320" />
        </Card>
      </div>
    </div>
  );
}
