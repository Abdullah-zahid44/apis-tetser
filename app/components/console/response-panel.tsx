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
  ExternalLink,
  Link2,
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

interface FoundUrl {
  key: string;
  url: string;
}

/** Strip whitespace + surrounding quote layers gateways sometimes wrap around URL values. */
function sanitizeUrl(value: string): string {
  let v = value.trim();
  for (let i = 0; i < 4; i++) {
    const quoted =
      v.length > 1 &&
      ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")));
    if (!quoted) break;
    v = v.slice(1, -1).trim();
  }
  return v.replace(/[.,;)\]]+$/, '');
}

function looksLikeUrl(v: string): boolean {
  return /^https?:\/\/[^\s"'<>\\]+$/i.test(v);
}

/** Copy that also works where navigator.clipboard is unavailable (older mobile webviews). */
async function fallbackCopy(text: string): Promise<boolean> {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  return fallbackCopy(text);
}

function collectUrlsFromValue(value: unknown, key: string, out: FoundUrl[], seen: Set<unknown>): void {
  if (typeof value === 'string') {
    const clean = sanitizeUrl(value);
    if (looksLikeUrl(clean)) out.push({ key, url: clean });
    return;
  }
  if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach((v, i) => collectUrlsFromValue(v, `${key}[${i}]`, out, seen));
    } else {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        collectUrlsFromValue(v, k, out, seen);
      }
    }
  }
}

/** Raw-text fallback: pull bare URLs out of malformed (non-JSON) bodies. */
function extractUrlsFromText(text: string): FoundUrl[] {
  const out: FoundUrl[] = [];
  const re = /https?:\/\/[^\s"'<>\\]+/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const clean = sanitizeUrl(m[0]);
    if (looksLikeUrl(clean) && !out.some((u) => u.url === clean)) {
      out.push({ key: 'response', url: clean });
    }
  }
  return out;
}

function rankUrls(urls: FoundUrl[]): FoundUrl[] {
  const score = (u: FoundUrl) =>
    /checkout|redirect|pay/i.test(u.key) ? 0 : /url|link/i.test(u.key) ? 1 : 2;
  return [...urls].sort((a, b) => score(a) - score(b));
}

const URL_VALUE_LINE = /^(\s*"(?:[^"\\]|\\.)*"\s*:\s*)("(?:[^"\\]|\\.)*")(,?)\s*$/;

function urlLink(href: string, label: string, key: string): React.ReactNode {
  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={href}
      className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary break-all"
    >
      {label}
    </a>
  );
}

/** Render body text with URL values as sanitized, clickable links (keeps JSON layout intact). */
function renderBodyWithLinks(text: string, asJson: boolean): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  text.split('\n').forEach((line, i) => {
    if (i > 0) nodes.push('\n');
    if (asJson) {
      const m = line.match(URL_VALUE_LINE);
      if (m) {
        let decoded: string = m[2];
        try {
          decoded = JSON.parse(m[2]) as string;
        } catch {
          /* keep raw match */
        }
        const clean = sanitizeUrl(decoded);
        if (typeof decoded === 'string' && looksLikeUrl(clean)) {
          nodes.push(
            <span key={`k${i}`}>{m[1]}</span>,
            urlLink(clean, m[2], `u${i}`),
            <span key={`c${i}`}>{m[3]}</span>
          );
          return;
        }
      }
    } else {
      const parts = line.split(/(https?:\/\/[^\s"'<>\\]+)/gi);
      if (parts.length > 1) {
        parts.forEach((part, j) => {
          const clean = sanitizeUrl(part);
          if (/^https?:\/\//i.test(part) && looksLikeUrl(clean)) {
            nodes.push(urlLink(clean, part, `r${i}-${j}`));
          } else {
            nodes.push(part);
          }
        });
        return;
      }
    }
    nodes.push(line);
  });
  return <>{nodes}</>;
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
    if (await copyText(text)) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1600);
    }
  };

  const [linkCopied, setLinkCopied] = useState(false);

  const bodyIsObject =
    !!result && result.upstream.body !== null && typeof result.upstream.body === 'object';

  /** Payment/checkout URLs anywhere in the response body, best match first. */
  const paymentUrls: FoundUrl[] = React.useMemo(() => {
    if (!result) return [];
    const body = result.upstream.body;
    if (body !== null && typeof body === 'object') {
      const found: FoundUrl[] = [];
      collectUrlsFromValue(body, 'response', found, new Set());
      return rankUrls(found);
    }
    // Gateway occasionally returns malformed JSON — still fish the link out of raw text.
    if (result.upstream.rawBody) return rankUrls(extractUrlsFromText(result.upstream.rawBody));
    return [];
  }, [result]);

  const copyPaymentLink = async (url: string) => {
    if (await copyText(url)) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1600);
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
      return 'bg-success/10 text-success border-success/25';
    }
    if (status === 202) {
      return 'bg-warning/10 text-warning border-warning/25';
    }
    if (status >= 400 && status < 500) {
      return 'bg-warning/10 text-warning border-warning/25';
    }
    return 'bg-destructive/10 text-destructive border-destructive/25';
  };

  const getMethodTokenClass = (m: string) => {
    switch (m) {
      case 'GET':
        return 'text-[var(--color-method-get)]';
      case 'POST':
        return 'text-[var(--color-method-post)]';
      case 'PUT':
        return 'text-[var(--color-method-put)]';
      case 'PATCH':
        return 'text-[var(--color-method-patch)]';
      case 'DELETE':
        return 'text-[var(--color-method-delete)]';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <section className="h-full flex flex-col min-w-0 select-none" style={{ background: 'var(--response-bg)' }}>
      {/* Response Panel Header */}
      <div className="min-h-10 px-2 sm:px-3 py-1 border-b border-[var(--border)] flex items-center justify-between gap-2 shrink-0 min-w-0" style={{ background: 'var(--surface-2)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Response
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm font-semibold text-foreground truncate">
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
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(prettyJson, 'json')}
              className="h-8 text-xs text-secondary-foreground hover:text-foreground hover:bg-accent px-2.5 gap-1.5 cursor-pointer rounded-lg"
              title="Copy JSON Response"
            >
              {copiedType === 'json' ? (
                <CheckCircle2 size={12} className="text-success" />
              ) : (
                <Copy size={11} />
              )}
              <span className="hidden sm:inline">{copiedType === 'json' ? 'Copied' : 'JSON'}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={downloadExample} className="h-8 text-xs text-secondary-foreground hover:text-foreground hover:bg-accent px-2 sm:px-2.5 gap-1.5 cursor-pointer rounded-lg" title="Save response as JSON example"><Download size={12} /><span className="hidden sm:inline">Save example</span></Button>
            {onClear && <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2 sm:px-2.5 gap-1.5 cursor-pointer rounded-lg" title="Clear response"><Trash2 size={12} /><span className="hidden sm:inline">Clear</span></Button>}
          </div>
        )}
      </div>

      {/* Developer Telemetry Bar */}
      <div className="min-h-9 px-2 sm:px-3 py-1 border-b border-[var(--border)] flex items-center justify-between font-mono text-xs text-muted-foreground shrink-0 overflow-x-auto" style={{ background: 'var(--surface-1)' }}>
        {result ? (
          <>
            <div className="flex items-center gap-3 whitespace-nowrap">
              {/* HTTP Status Code Badge */}
              <span
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadgeStyle(
                  result.upstream.status
                )}`}
              >
                {isSuccess ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                <span>
                  {result.upstream.status} {result.upstream.statusText || ''}
                </span>
              </span>

              {/* Latency */}
              <span className="flex items-center gap-1 text-secondary-foreground text-xs">
                <Clock3 size={11} className={result.meta.durationMs < 500 ? 'text-success' : 'text-warning'} />
                <span>{result.meta.durationMs} ms</span>
              </span>

              {/* Payload Size */}
              <span className="flex items-center gap-1 text-secondary-foreground text-xs">
                <Activity size={11} className="text-muted-foreground" />
                <span>{(result.meta.responseSize / 1024).toFixed(2)} KB</span>
              </span>

              {/* HMAC Signer Tag */}
              {result.meta.signed && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-success">
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
            <span>Ready</span>
          </div>
        )}
      </div>

      {/* Main Response Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: 'var(--code-bg)' }}>
        {running ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 animate-fade-in">
            <div className="relative w-14 h-14 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/25">
              <Send size={22} className="spin" />
            </div>
            <div>
              <strong className="text-foreground text-sm block mb-1">Transmitting to AssanPay Gateway…</strong>
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
                  <div className="p-2 rounded bg-warning/10 border border-warning/25 text-warning text-xs flex items-start gap-1.5 mt-1">
                    <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                    <span>
                      Timeout: Request outcome is uncertain. Do NOT blindly retry money-movement endpoints without checking status inquiry.
                    </span>
                  </div>
                )}
              </Alert>
            )}

            {/* Payment link quick actions — checkout URL sanitized, ready to copy/open */}
            {paymentUrls.length > 0 && (
              <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/[0.06] px-2.5 py-2 shrink-0">
                <Link2 size={13} className="text-primary shrink-0" />
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => void copyPaymentLink(paymentUrls[0].url)}
                  title="Tap to copy payment link"
                  role="button"
                  aria-label="Copy payment link"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {linkCopied ? <span className="text-success">Copied to clipboard</span> : 'Payment link — tap to copy'}
                  </div>
                  <div className="text-xs font-mono text-foreground truncate select-text">
                    {paymentUrls[0].url}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void copyPaymentLink(paymentUrls[0].url)}
                  className="h-7 text-xs text-secondary-foreground hover:text-foreground hover:bg-accent px-2 gap-1.5 cursor-pointer rounded-lg shrink-0"
                  title="Copy payment link"
                >
                  {linkCopied ? (
                    <CheckCircle2 size={12} className="text-success" />
                  ) : (
                    <Copy size={11} />
                  )}
                  <span className="hidden sm:inline">{linkCopied ? 'Copied' : 'Copy'}</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.open(paymentUrls[0].url, '_blank', 'noopener,noreferrer')}
                  className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer rounded-lg shrink-0"
                  title="Open payment link in new tab"
                >
                  <ExternalLink size={12} />
                  <span className="hidden sm:inline">Open</span>
                </Button>
              </div>
            )}

            <Tabs defaultValue="pretty" className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
              <TabsList variant="line" className="console-scroll-tabs w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden bg-muted border-b border-border justify-start rounded-none p-0 h-auto gap-4 px-3 shrink-0">
                <TabsTrigger
                  value="pretty"
                  className="rounded-none border-0 border-b-2 border-transparent data-active:border-primary data-active:text-foreground data-active:bg-transparent text-xs py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none"
                >
                  Pretty JSON
                </TabsTrigger>
                <TabsTrigger
                  value="raw"
                  className="rounded-none border-0 border-b-2 border-transparent data-active:border-primary data-active:text-foreground data-active:bg-transparent text-xs py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none"
                >
                  Raw Response
                </TabsTrigger>
                <TabsTrigger
                  value="headers"
                  className="rounded-none border-0 border-b-2 border-transparent data-active:border-primary data-active:text-foreground data-active:bg-transparent text-xs py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none"
                >
                  Headers ({Object.keys(result.upstream.headers).length})
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="rounded-none border-0 border-b-2 border-transparent data-active:border-primary data-active:text-foreground data-active:bg-transparent text-xs py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none"
                >
                  Outbound Request
                </TabsTrigger>
                <TabsTrigger
                  value="meta"
                  className="rounded-none border-0 border-b-2 border-transparent data-active:border-primary data-active:text-foreground data-active:bg-transparent text-xs py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none"
                >
                  Audit Meta
                </TabsTrigger>
              </TabsList>

              {/* Pretty JSON Tab — URL values render as sanitized, clickable links */}
              <TabsContent value="pretty" className="flex-1 min-w-0 overflow-auto p-3 sm:p-4 m-0" style={{ background: 'var(--code-bg)' }}>
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed select-text">
                  {prettyJson ? renderBodyWithLinks(prettyJson, bodyIsObject) : '// Empty response body.'}
                </pre>
              </TabsContent>

              {/* Raw Response Tab */}
              <TabsContent value="raw" className="flex-1 min-w-0 overflow-auto p-3 sm:p-4 m-0" style={{ background: 'var(--code-bg)' }}>
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed select-text">
                  {result.upstream.rawBody || '// No raw body'}
                </pre>
              </TabsContent>

              {/* Headers Tab */}
              <TabsContent value="headers" className="flex-1 overflow-y-auto p-3 m-0" style={{ background: 'var(--code-bg)' }}>
                <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[520px] text-xs font-mono">
                    <tbody className="divide-y divide-[var(--border)]">
                      {Object.entries(result.upstream.headers).map(([k, v]) => (
                        <tr key={k} className="transition-colors hover:bg-accent/50">
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
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                    Executed Method & Final URL
                  </span>
                  <div className="flex items-center gap-2 p-2 rounded bg-card border border-border">
                    <span className={`font-bold font-mono ${getMethodTokenClass(result.request.method)}`}>{result.request.method}</span>
                    <span className="font-mono text-foreground break-all">{result.request.url}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
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
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
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
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Country Gateway</span>
                    <strong className="text-foreground">{result.meta.country.toUpperCase()}</strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Environment</span>
                    <strong className="text-foreground">{result.meta.environment.toUpperCase()}</strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">HMAC-SHA256 Status</span>
                    <strong className="text-success">
                      {result.meta.signed ? 'Signed by backend' : 'Omitted per spec'}
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Execution Duration</span>
                    <strong className="text-foreground">{result.meta.durationMs} ms</strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border sm:col-span-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Request UUID / Nonce</span>
                    <strong className="font-mono text-primary break-all">{result.meta.requestId}</strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border sm:col-span-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Audited Operator</span>
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
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

