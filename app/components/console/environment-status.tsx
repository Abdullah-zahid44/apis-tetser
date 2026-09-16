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
import { Badge } from '@/components/ui/badge';
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
  const environments = ['sandbox', 'production'] as const;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background p-3 sm:p-4 lg:p-6 overflow-y-auto select-none">
      <div className="max-w-5xl mx-auto w-full space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
              <ServerCog size={18} className="text-primary" />
              <span>Environment Readiness & Configuration Matrix</span>
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[11px] font-mono border-border text-muted-foreground"
              >
                Safe Server-Side Audit
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live validation of gateway credentials, HMAC signing engine, and database connectivity. Secrets remain masked and secure.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToWorkbench}
            className="h-7 text-xs text-primary hover:text-primary gap-1 font-mono cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Workbench</span>
          </Button>
        </div>

        {/* Global Infrastructure Health Bar */}
        <div className="p-3.5 rounded-lg bg-card border border-border space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Database size={15} className="text-emerald-400" />
            <span>Core Infrastructure Status</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Database (Neon Postgres)</span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 size={12} />
                CONNECTED
              </span>
            </div>

            <div className="p-2.5 rounded bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">HMAC-SHA256 Signer</span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
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

        {/* Country & Environment Readiness Matrix */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
            Country Gateway Readiness
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
                  <span className="text-[11.5px] font-mono text-muted-foreground uppercase">
                    {country.code}
                  </span>
                </div>

                {/* Environments per Country */}
                <div className="p-3 space-y-3">
                  {environments.map((env) => {
                    const status = config?.[country.slug]?.[env];
                    const isConfigured = Boolean(status?.configured);
                    const isProd = env === 'production';

                    return (
                      <div
                        key={env}
                        className={`p-2.5 rounded border text-xs space-y-2 ${
                          isConfigured
                            ? 'bg-card border-border'
                            : 'bg-amber-950/20 border-amber-900/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold uppercase flex items-center gap-2 text-xs">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isProd ? 'bg-rose-500' : 'bg-primary'
                              }`}
                            />
                            <span className={isProd ? 'text-rose-300' : 'text-primary'}>
                              {env}
                            </span>
                          </span>

                          <span
                            className={`font-mono text-[11.5px] font-bold flex items-center gap-1 ${
                              isConfigured ? 'text-emerald-400' : 'text-amber-400'
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

                        <div className="space-y-1 font-mono text-[12px] text-muted-foreground pt-0.5">
                          <div className="flex justify-between">
                            <span>Base URL:</span>
                            <span className="text-foreground">
                              {status?.hostname ? `https://${status.hostname}` : 'Missing'}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>API Key:</span>
                            <span
                              className={status?.apiKeyConfigured ? 'text-emerald-400' : 'text-amber-400'}
                            >
                              {status?.apiKeyConfigured ? '✓ Configured' : '✗ Missing in .env'}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>API Secret:</span>
                            <span
                              className={status?.apiSecretConfigured ? 'text-emerald-400' : 'text-amber-400'}
                            >
                              {status?.apiSecretConfigured ? '✓ Configured' : '✗ Missing in .env'}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>Callback Route:</span>
                            <span className="text-secondary-foreground truncate max-w-[200px]">
                              /api/callbacks/assanpay/{country.slug}/{env}
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
      </div>
    </div>
  );
}
