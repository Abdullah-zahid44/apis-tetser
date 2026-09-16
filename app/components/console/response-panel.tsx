'use client';

import React, { useState } from 'react';
import {
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Activity,
  Send,
  ShieldCheck,
  AlertTriangle,
  Download,
  Trash2,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ExecutionResult } from './types';

interface ResponsePanelProps {
  countrySlug: string;
  result: ExecutionResult | null;
  running: boolean;
  loadedHistoryId: string | null;
  onClear?: () => void;
}

export function ResponsePanel({
  countrySlug,
  result,
  running,
  loadedHistoryId,
  onClear,
}: ResponsePanelProps) {
  const [copiedType, setCopiedType] = useState<'json' | 'raw' | 'headers' | null>(null);

  const copyToClipboard = async (text: string, type: 'json' | 'raw' | 'headers') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1600);
    } catch {
      // ignore
    }
  };

  const isSuccess =
    result?.ok ||
    (result?.upstream.status && result.upstream.status >= 200 && result.upstream.status < 300);
  const isTimeout = result?.error?.type === 'TIMEOUT';

  const prettyJson = result
    ? typeof result.upstream.body === 'object'
      ? JSON.stringify(result.upstream.body, null, 2)
      : result.upstream.rawBody
    : '';

  const downloadExample = () => {
    if (!result) return;
    const blob = new Blob([prettyJson], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `assanpay-${countrySlug}-${result.meta.requestId.slice(0, 8)}.json`;
    link.click();
    URL.revokeObjectURL(href);
  };

  const getStatusBadgeStyle = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'bg-emerald-950/50 text-emerald-300 border-emerald-600/40';
    }
    if (status === 202) {
      return 'bg-amber-950/50 text-amber-300 border-amber-600/40';
    }
    if (status >= 400 && status < 500) {
      return 'bg-amber-950/50 text-amber-300 border-amber-600/40';
    }
    return 'bg-rose-950/60 text-rose-300 border-rose-600/50';
  };

  return (
    <section className="h-full flex flex-col min-w-0 select-none" style={{ background: 'var(--response-bg)' }}>
      {/* Response Panel Header */}
      <div className="min-h-10 px-2 sm:px-3 py-1 border-b border-[var(--border)] flex items-center justify-between gap-2 shrink-0 inset-shadow" style={{ background: 'var(--surface-2)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Response
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm font-semibold text-foreground">
            {running
              ? 'Sending request'
              : loadedHistoryId
                ? 'Saved run'
                : result
                  ? `${result.upstream.status} ${result.upstream.statusText || ''}`
                  : 'Ready'}
          </span>
        </div>

        {/* Quick Toolbar Actions */}
        {result && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(prettyJson, 'json')}
              className="h-8 text-xs text-secondary-foreground hover:text-white hover:bg-card px-2.5 gap-1.5 cursor-pointer rounded-lg"
              title="Copy JSON Response"
            >
              {copiedType === 'json' ? (
                <CheckCircle2 size={12} className="text-emerald-400" />
              ) : (
                <Copy size={11} />
              )}
              <span className="hidden sm:inline">{copiedType === 'json' ? 'Copied' : 'JSON'}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={downloadExample} className="h-8 text-xs text-secondary-foreground hover:text-white hover:bg-card px-2 sm:px-2.5 gap-1.5 cursor-pointer rounded-lg" title="Save response as JSON example"><Download size={12} /><span className="hidden sm:inline">Save example</span></Button>
            {onClear && <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-xs text-muted-foreground hover:text-rose-300 hover:bg-rose-950/20 px-2 sm:px-2.5 gap-1.5 cursor-pointer rounded-lg" title="Clear response"><Trash2 size={12} /><span className="hidden sm:inline">Clear</span></Button>}
          </div>
        )}
      </div>

      {/* Developer Telemetry Bar */}
      <div className="min-h-9 px-2 sm:px-3 py-1 border-b border-[var(--border)] flex items-center justify-between font-mono text-xs text-muted-foreground shrink-0 overflow-x-auto" style={{ background: 'var(--surface-1)' }}>
        {result ? (
          <>
            <div className="flex items-center gap-3">
              {/* HTTP Status Code Badge */}
              <span
                className={`flex items-center gap-1.5 px-2 py-0.2 rounded text-[12px] font-bold border ${getStatusBadgeStyle(
                  result.upstream.status
                )}`}
              >
                {isSuccess ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                <span>
                  {result.upstream.status} {result.upstream.statusText || ''}
                </span>
              </span>

              {/* Latency */}
              <span className="flex items-center gap-1 text-secondary-foreground text-[12px]">
                <Clock3 size={11} className={result.meta.durationMs < 500 ? 'text-emerald-400' : 'text-amber-400'} />
                <span>{result.meta.durationMs} ms</span>
              </span>

              {/* Payload Size */}
              <span className="flex items-center gap-1 text-secondary-foreground text-[12px]">
                <Activity size={11} className="text-muted-foreground" />
                <span>{(result.meta.responseSize / 1024).toFixed(2)} KB</span>
              </span>

              {/* HMAC Signer Tag */}
              {result.meta.signed && (
                <span className="hidden sm:flex items-center gap-1 text-[11.5px] text-emerald-400">
                  <ShieldCheck size={11} />
                  <span>Request signed</span>
                </span>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground hidden md:block">
              ID: {result.meta.requestId.slice(0, 8)}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Activity size={11} />
            <span>Ready — Press Ctrl+Enter to execute request</span>
          </div>
        )}
      </div>

      {/* Main Response Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: 'var(--code-bg)' }}>
        {running ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 animate-fade-in">
            <div
              className="relative w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(14,26,48,0.8), rgba(20,38,72,0.6))',
                boxShadow: '0 0 20px color-mix(in srgb, var(--primary) 22%, transparent), inset 0 0 20px color-mix(in srgb, var(--primary) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--primary) 28%, transparent)',
              }}
            >
              <Send size={22} className="spin" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <strong className="text-foreground text-sm block mb-1">Transmitting to AssanPay Gateway…</strong>
              <p className="text-xs text-muted-foreground max-w-xs font-mono">
                Signing HMAC-SHA256 · Canonicalizing path & timestamp
              </p>
            </div>
            {/* Shimmer bars to indicate loading */}
            <div className="w-64 space-y-2 mt-2">
              <div className="skeleton h-2 w-full" />
              <div className="skeleton h-2 w-4/5" />
              <div className="skeleton h-2 w-3/5" />
            </div>
          </div>
        ) : result ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Error banner if request failed */}
            {!isSuccess && result.error && (
              <Alert variant="destructive" className="m-3 w-auto">
                <AlertCircle />
                <AlertTitle>{result.error.type || 'GATEWAY_ERROR'} (HTTP {result.upstream.status})</AlertTitle>
                <AlertDescription>{result.error.message}</AlertDescription>

                {isTimeout && (
                  <div className="p-2 rounded bg-amber-950/70 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-1.5 mt-1">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Timeout: Request outcome is uncertain. Do NOT blindly retry money-movement endpoints without checking status inquiry.
                    </span>
                  </div>
                )}
              </Alert>
            )}

            <Tabs defaultValue="pretty" className="flex-1 flex flex-col min-h-0">
              <TabsList variant="line" className="bg-muted border-b border-border justify-start rounded-none p-0 h-auto gap-4 px-3 shrink-0">
                <TabsTrigger
                  value="pretty"
                  className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-white data-active:bg-transparent text-xs py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none"
                >
                  Pretty JSON
                </TabsTrigger>
                <TabsTrigger
                  value="raw"
                  className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-white data-active:bg-transparent text-xs py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none"
                >
                  Raw Response
                </TabsTrigger>
                <TabsTrigger
                  value="headers"
                  className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-white data-active:bg-transparent text-xs py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none"
                >
                  Headers ({Object.keys(result.upstream.headers).length})
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-white data-active:bg-transparent text-xs py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none"
                >
                  Outbound Request
                </TabsTrigger>
                <TabsTrigger
                  value="meta"
                  className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-white data-active:bg-transparent text-xs py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none"
                >
                  Audit Meta
                </TabsTrigger>
              </TabsList>

              {/* Pretty JSON Tab */}
              <TabsContent value="pretty" className="flex-1 overflow-y-auto p-4 m-0" style={{ background: 'var(--code-bg)' }}>
                <pre className="text-[12.5px] font-mono text-foreground whitespace-pre-wrap leading-relaxed select-text">
                  {prettyJson || '// Empty response body.'}
                </pre>
              </TabsContent>

              {/* Raw Response Tab */}
              <TabsContent value="raw" className="flex-1 overflow-y-auto p-4 m-0" style={{ background: 'var(--code-bg)' }}>
                <pre className="text-[12px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed select-text">
                  {result.upstream.rawBody || '// No raw body'}
                </pre>
              </TabsContent>

              {/* Headers Tab */}
              <TabsContent value="headers" className="flex-1 overflow-y-auto p-3 m-0" style={{ background: 'var(--code-bg)' }}>
                <div className="border border-[var(--border)] rounded overflow-x-auto">
                  <table className="w-full min-w-[520px] text-xs font-mono">
                    <tbody className="divide-y divide-[var(--border)]">
                      {Object.entries(result.upstream.headers).map(([k, v]) => (
                        <tr key={k} className="transition-colors" style={{ background: 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="p-2 text-primary font-semibold w-1/3 border-r border-[var(--border)] select-text">{k}</td>
                          <td className="p-2 text-secondary-foreground break-all select-text">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Outbound Request Details Tab */}
              <TabsContent value="details" className="flex-1 overflow-y-auto p-3 m-0 space-y-3 text-xs bg-muted">
                <div>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                    Executed Method & Final URL
                  </span>
                  <div className="flex items-center gap-2 p-2 rounded bg-card border border-border">
                    <span className="font-bold text-amber-400 font-mono">{result.request.method}</span>
                    <span className="font-mono text-foreground break-all">{result.request.url}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                    Outbound Security Headers
                  </span>
                  <div className="p-2.5 rounded bg-card border border-border font-mono text-[11px] space-y-1">
                    {Object.entries(result.request.headers).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{k}:</span>
                        <span className="text-foreground break-all text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                    Outbound Request Body
                  </span>
                  <pre className="p-2.5 rounded bg-card border border-border font-mono text-[11px] text-secondary-foreground whitespace-pre-wrap">
                    {typeof result.request.body === 'object'
                      ? JSON.stringify(result.request.body, null, 2)
                      : String(result.request.body || '(Empty body)')}
                  </pre>
                </div>
              </TabsContent>

              {/* Audit Meta Tab */}
              <TabsContent value="meta" className="flex-1 overflow-y-auto p-3 m-0 bg-muted">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[11px] font-mono text-muted-foreground uppercase block">Country Gateway</span>
                    <strong className="text-foreground">{result.meta.country.toUpperCase()}</strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[11px] font-mono text-muted-foreground uppercase block">Environment</span>
                    <strong className="text-foreground">{result.meta.environment.toUpperCase()}</strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[11px] font-mono text-muted-foreground uppercase block">HMAC-SHA256 Status</span>
                    <strong className="text-emerald-400">
                      {result.meta.signed ? 'Signed by backend' : 'Omitted per spec'}
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[11px] font-mono text-muted-foreground uppercase block">Execution Duration</span>
                    <strong className="text-foreground">{result.meta.durationMs} ms</strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border sm:col-span-2">
                    <span className="text-[11px] font-mono text-muted-foreground uppercase block">Request UUID / Nonce</span>
                    <strong className="font-mono text-primary break-all">{result.meta.requestId}</strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border sm:col-span-2">
                    <span className="text-[11px] font-mono text-muted-foreground uppercase block">Audited Operator</span>
                    <strong className="text-secondary-foreground">{result.meta.executedBy || 'AssanPay Support'}</strong>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
            >
              <Code2 size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No response yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
                Configure a request and press{' '}
                <kbd className="font-mono text-muted-foreground bg-[var(--surface-3)] px-1 py-0.5 rounded text-[11px]">Ctrl+Enter</kbd>{' '}
                to send.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
