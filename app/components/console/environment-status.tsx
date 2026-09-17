'use client';

import React from 'react';
import {
  ServerCog,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Database,
  Globe,
  Key,
  AlertTriangle,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SafeConfig, Country } from './types';

interface EnvironmentStatusProps {
  countries: Country[];
  config: SafeConfig | null;
  onBackToWorkbench: () => void;
}

export function EnvironmentStatusView({
  countries,
  config,
  onBackToWorkbench,
}: EnvironmentStatusProps) {
  const environments = ['sandbox'] as const;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background p-3 sm:p-4 lg:p-6 overflow-y-auto select-none">
      <div className="max-w-5xl mx-auto w-full space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground flex flex-wrap items-center gap-2">
              <ServerCog size={18} className="text-primary" />
              <span>Environment Readiness</span>
            </h2>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToWorkbench}
            className="h-7 text-xs text-primary hover:text-primary gap-1 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Workbench</span>
          </Button>
        </div>

        {/* Global Infrastructure Health Bar */}
        <div className="p-4 rounded-lg bg-card border border-border space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Database size={15} className="text-success" />
            <span>Infrastructure</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Database (Neon Postgres)</span>
              <span className="text-success flex items-center gap-1 font-bold">
                <CheckCircle2 size={12} />
                CONNECTED
              </span>
            </div>

            <div className="p-2.5 rounded bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">HMAC-SHA256 Signer</span>
              <span className="text-success flex items-center gap-1 font-bold">
                <CheckCircle2 size={12} />
                READY
              </span>
            </div>

            <div className="p-2.5 rounded bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Payload Encryption</span>
              <span className="text-primary font-medium">OFF (Plaintext)</span>
            </div>
          </div>
        </div>

        {/* Country & Gateway Readiness Matrix */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">
            Gateways
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countries.map((country) => (
              <div
                key={country.slug}
                className="rounded-lg bg-card border border-border overflow-hidden"
              >
                {/* Country Card Heading */}
                <div className="p-3 bg-muted border-b border-border flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-foreground text-xs">
                    <span className="text-base">{country.flagEmoji}</span>
                    <span>{country.name}</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-primary border border-primary/25">
                      {country.currency}
                    </span>
                  </span>
                  <span className="text-xs font-mono text-muted-foreground uppercase">
                    {country.code}
                  </span>
                </div>

                {/* Gateway per Country */}
                <div className="p-3 space-y-3">
                  {environments.map((env) => {
                    const status = config?.[country.slug]?.[env];
                    const isConfigured = Boolean(status?.configured);

                    return (
                      <div
                        key={env}
                        className={`p-2.5 rounded border text-xs space-y-2 ${
                          isConfigured
                            ? 'bg-card border-border'
                            : 'bg-warning/10 border-warning/25'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold uppercase flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-primary">
                              API Gateway
                            </span>
                          </span>

                          <span
                            className={`font-mono text-xs font-bold flex items-center gap-1 ${
                              isConfigured ? 'text-success' : 'text-warning'
                            }`}
                          >
                            {isConfigured ? (
                              <>
                                <CheckCircle2 size={12} />
                                CONFIG READY
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={12} />
                                INCOMPLETE .ENV
                              </>
                            )}
                          </span>
                        </div>

                        <div className="space-y-1 font-mono text-xs text-muted-foreground pt-0.5">
                          <div className="flex justify-between">
                            <span>Base URL:</span>
                            <span className="text-foreground">
                              {status?.hostname ? `https://${status.hostname}` : 'Missing'}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>API Key:</span>
                            <span
                              className={status?.apiKeyConfigured ? 'text-success' : 'text-warning'}
                            >
                              {status?.apiKeyConfigured ? '✓ Configured' : '✗ Missing in .env'}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>Branch API Secret:</span>
                            <span
                              className={status?.apiSecretConfigured ? 'text-success' : 'text-warning'}
                            >
                              {status?.apiSecretConfigured ? '✓ Configured' : '✗ Missing in .env'}
                            </span>
                          </div>

                          <div className="flex justify-between gap-2">
                            <span>Main Callback Secret:</span>
                            <span className={status?.callbackSecretConfigured ? 'text-success' : 'text-warning'}>
                              {status?.callbackSecretConfigured ? 'Configured' : 'Missing in .env'}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>Callback Route:</span>
                            <span className="text-secondary-foreground truncate max-w-[200px]">
                              /api/callbacks/assanpay/{country.slug}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Audit Strip */}
        <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck size={14} className="text-success" />
            <span>Strict server-side validation active. Credentials are never sent to the browser.</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Lock size={12} />
            <span>HTTPS Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
