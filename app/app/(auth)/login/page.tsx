import { signIn } from '@/lib/auth/config';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isDenied = searchParams.error === 'AccessDenied' || searchParams.error === 'OAuthSignin' || searchParams.error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden selection:bg-cyan-500/20"
      style={{ background: 'radial-gradient(ellipse at 60% 30%, #0d1829 0%, #080b10 60%, #050709 100%)' }}>

      {/* Background ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ background: 'radial-gradient(circle, #3b6fd4, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-15"
          style={{ background: 'radial-gradient(circle, #0e9d6b, transparent)' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid opacity-30" />
      </div>

      <div className="w-full max-w-[400px] relative z-10 animate-fade-in">
        {/* Main Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
          style={{
            background: 'rgba(14, 16, 22, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Top edge highlight */}
          <div className="absolute top-0 left-8 right-8 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(91,141,239,0.4), transparent)' }} />

          {/* Brand Header */}
          <div className="text-center mb-7 relative z-10">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 relative"
              style={{
                background: 'linear-gradient(135deg, #1a3460 0%, #1e3d7a 50%, #234795 100%)',
                boxShadow: '0 8px 24px rgba(91,141,239,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                border: '1px solid rgba(91,141,239,0.3)',
              }}>
              <ShieldCheck className="w-7 h-7" style={{ color: '#93b4f5' }} strokeWidth={2} />
            </div>

            <h1 className="text-[22px] font-bold tracking-tight text-white mb-1.5">
              AssanPay API Console
            </h1>
            <p className="text-[10.5px] uppercase tracking-[0.15em] font-mono font-semibold"
              style={{ color: '#5b8def', opacity: 0.85 }}>
              Technical Support &amp; Debugging Workspace
            </p>
          </div>

          {/* Error Alert */}
          {isDenied && (
            <div
              className="mb-5 p-3.5 rounded-xl flex items-start gap-2.5 animate-fade-in"
              style={{
                background: 'rgba(127,29,29,0.3)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5',
              }}
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-rose-300 text-xs block mb-0.5">Authentication Rejected</strong>
                <span className="text-xs leading-relaxed text-rose-400/80">
                  Access restricted to authorized AssanPay employees only.
                </span>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div
            className="mb-5 p-3.5 rounded-xl flex items-start gap-3"
            style={{
              background: 'rgba(8, 16, 32, 0.6)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[12px] font-semibold text-slate-200">Authorized Personnel Only</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Direct access to live & sandbox payment gateways. All actions are audited.
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
              className="w-full h-11 text-slate-900 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {/* Google Logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </form>

          {/* Footer notice */}
          <p className="mt-5 text-center text-[10.5px] font-mono"
            style={{ color: 'rgba(100,116,139,0.7)' }}>
            Restricted to{' '}
            <span style={{ color: '#5b8def', opacity: 0.9 }}>@assanpay.com</span>{' '}
            accounts only
          </p>
        </div>

        {/* Below-card security badge */}
        <div className="mt-4 flex items-center justify-center gap-3 text-[10px] font-mono" style={{ color: 'rgba(71,85,105,0.6)' }}>
          <span className="flex items-center gap-1.5">
            <Zap size={10} className="text-emerald-700" />
            Zero Client Secrets
          </span>
          <span>·</span>
          <span>AssanPay Enterprise Security</span>
        </div>
      </div>
    </div>
  );
}
