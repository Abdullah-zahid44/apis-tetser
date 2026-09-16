import { signIn } from '@/lib/auth/config';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isDenied = searchParams.error === 'AccessDenied' || searchParams.error === 'OAuthSignin' || searchParams.error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">

      {/* Background ambient glows — warm amber */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-25 bg-primary" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-15 bg-primary" />
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Main Card */}
        <div className="rounded-[18px] p-6 sm:p-8 relative overflow-hidden bg-card border border-border shadow-[var(--shadow-lift)]">
          {/* Top edge highlight */}
          <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {/* Brand Header */}
          <div className="text-center mb-7 relative z-10">
            {/* Logo */}
            <div className="brand-mark inline-flex items-center justify-center w-14 h-14 rounded-[16px] mb-5">
              <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.2} />
            </div>

            <h1 className="font-display text-[24px] font-bold tracking-tight text-foreground mb-2">
              AssanPay Console
            </h1>
            <p className="text-[11px] uppercase tracking-[0.14em] font-mono font-semibold text-primary">
              API Testing Workspace
            </p>
          </div>

          {/* Error Alert */}
          {isDenied && (
            <div className="mb-5 p-4 rounded-[12px] flex items-start gap-3 animate-fade-in bg-destructive/10 border border-destructive/25">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-destructive text-[13px] block mb-0.5">Authentication Rejected</strong>
                <span className="text-[12px] leading-relaxed text-muted-foreground">
                  Access restricted to authorized AssanPay employees only.
                </span>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="mb-5 p-4 rounded-[12px] flex items-start gap-3 bg-muted/60 border border-border">
            <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[13px] font-semibold text-foreground">Authorized Personnel Only</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Direct access to live &amp; sandbox payment gateways. All actions are audited.
              </p>
            </div>
          </div>

          {/* Google Sign In */}
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/' });
            }}
          >
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-[14px] rounded-[12px] flex items-center justify-center gap-3 group bg-foreground text-background hover:bg-foreground/90"
            >
              {/* Google Logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </form>

          {/* Footer notice */}
          <p className="mt-6 text-center text-[12px] font-mono text-muted-foreground">
            Restricted to <span className="text-primary font-semibold">@assanpay.com</span> accounts only
          </p>
        </div>

        {/* Below-card security badge */}
        <div className="mt-5 flex items-center justify-center gap-3 text-[11.5px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Zap size={11} className="text-primary" />
            Zero Client Secrets
          </span>
          <span className="opacity-40">·</span>
          <span>AssanPay Enterprise Security</span>
        </div>
      </div>
    </div>
  );
}
