'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  Search,
  X,
  Maximize2,
  Minimize2,
  GitCompareArrows,
  Settings2,
  FileJson,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JsonTree } from './json-tree';
import { environmentLabel } from '@/lib/environment-label';
import type { ExecutionResult } from './types';

interface ResponsePanelProps {
  countrySlug: string;
  result: ExecutionResult | null;
  previousResult?: ExecutionResult | null;
  running: boolean;
  loadedHistoryId: string | null;
  onClear?: () => void;
  onOpenEnvironment?: () => void;
}

interface FoundUrl {
  key: string;
  url: string;
}

type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';
type DiffRow = { path: string; previous: unknown; current: unknown; status: DiffStatus };

function flattenJson(value: unknown, path = '$', out = new Map<string, unknown>()): Map<string, unknown> {
  if (value !== null && typeof value === 'object') {
    const entries = Array.isArray(value) ? value.map((item, index) => [index, item] as const) : Object.entries(value);
    if (entries.length === 0) out.set(path, value);
    for (const [key, child] of entries) {
      flattenJson(child, Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`, out);
    }
  } else {
    out.set(path, value);
  }
  return out;
}

function buildDiffRows(previous: unknown, current: unknown): DiffRow[] {
  const before = flattenJson(previous);
  const after = flattenJson(current);
  const paths = Array.from(new Set([...before.keys(), ...after.keys()]));
  return paths.slice(0, 1000).map((path) => {
    const hasBefore = before.has(path);
    const hasAfter = after.has(path);
    const previousValue = before.get(path);
    const currentValue = after.get(path);
    const status: DiffStatus = !hasBefore
      ? 'added'
      : !hasAfter
        ? 'removed'
        : JSON.stringify(previousValue) === JSON.stringify(currentValue)
          ? 'unchanged'
          : 'changed';
    return { path, previous: previousValue, current: currentValue, status };
  });
}

function displayDiffValue(value: unknown): string {
  if (value === undefined) return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function countMatches(text: string, query: string): number {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  const haystack = text.toLowerCase();
  while ((from = haystack.indexOf(needle, from)) !== -1) {
    count += 1;
    from += Math.max(needle.length, 1);
  }
  return count;
}

function highlightedText(text: string, query: string): React.ReactNode {
  const needle = query.trim();
  if (!needle) return text;
  const parts = text.split(new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <mark key={index} className="rounded-sm bg-amber-200 px-0.5 text-amber-950">{part}</mark>
    ) : part
  );
}

type ErrorGuidance = {
  title: string;
  explanation: string;
  suggestion: string;
  environmentShortcut?: boolean;
};

function getErrorGuidance(result: ExecutionResult): ErrorGuidance {
  const status = result.upstream.status;
  const details = `${result.error?.type || ''} ${result.error?.code || ''} ${result.error?.message || ''}`.toLowerCase();

  if (status === 401 || status === 403 || /api.?key|credential|unauthori|forbidden|secret/.test(details)) {
    return {
      title: 'Credentials need attention',
      explanation: 'The gateway could not authenticate this request.',
      suggestion: 'Check the selected country credentials and API key configuration, then send the request again.',
      environmentShortcut: true,
    };
  }
  if (result.error?.type === 'TIMEOUT' || /timeout|timed out/.test(details)) {
    return {
      title: 'The gateway took too long to respond',
      explanation: 'The final payment outcome may still be processing even though this request timed out.',
      suggestion: 'Check the status inquiry before retrying a money-movement request.',
    };
  }
  if (status === 400 || status === 422) {
    return {
      title: 'Request data was rejected',
      explanation: 'One or more body fields are missing, invalid, or formatted incorrectly.',
      suggestion: 'Review the request body values highlighted by the technical response and try again.',
    };
  }
  if (status === 404) {
    return {
      title: 'API route was not found',
      explanation: 'This endpoint is unavailable on the selected country gateway.',
      suggestion: 'Confirm the selected API and country, then verify the configured gateway hostname.',
      environmentShortcut: true,
    };
  }
  if (status === 429) {
    return {
      title: 'Too many requests',
      explanation: 'The gateway rate limit has been reached temporarily.',
      suggestion: 'Wait briefly before sending again; avoid rapid repeated retries.',
    };
  }
  if (status >= 500) {
    return {
      title: 'Gateway service error',
      explanation: 'The remote service could not complete the request.',
      suggestion: 'Try again after a short delay. If it continues, share the request ID with the engineering team.',
    };
  }
  return {
    title: 'Request could not be completed',
    explanation: 'The gateway returned an unsuccessful response.',
    suggestion: 'Review the technical details and request body before sending again.',
  };
}

/** Strip whitespace + surrounding quote layers gateways sometimes wrap around URL values. */
export function sanitizeUrl(value: string): string {
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

export function looksLikeUrl(v: string): boolean {
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

export async function copyText(text: string): Promise<boolean> {
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

export function urlLink(href: string, label: string, key: string): React.ReactNode {
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
  previousResult = null,
  running,
  loadedHistoryId,
  onClear,
  onOpenEnvironment,
}: ResponsePanelProps) {
  const [copiedType, setCopiedType] = useState<'json' | 'raw' | 'headers' | 'request' | 'meta' | null>(null);
  // Body viewer mode for the Pretty JSON tab: tree is the default for JSON bodies.
  const [bodyView, setBodyView] = useState<'tree' | 'raw'>('tree');
  const [responseTab, setResponseTab] = useState<'pretty' | 'raw' | 'compare' | 'headers' | 'details' | 'meta'>('pretty');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [changesOnly, setChangesOnly] = useState(true);

  useEffect(() => {
    if (!isFullscreen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isFullscreen]);

  useEffect(() => {
    if (responseTab === 'compare' && !previousResult) setResponseTab('pretty');
  }, [previousResult, responseTab]);

  useEffect(() => {
    setSearchQuery('');
  }, [result?.meta.requestId]);

  const copyToClipboard = async (text: string, type: 'json' | 'raw' | 'headers' | 'request' | 'meta') => {
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

  const searchMatchCount = useMemo(
    () => countMatches(prettyJson || result?.upstream.rawBody || '', searchQuery),
    [prettyJson, result?.upstream.rawBody, searchQuery],
  );

  const diffRows = useMemo(
    () => previousResult && result ? buildDiffRows(previousResult.upstream.body, result.upstream.body) : [],
    [previousResult, result],
  );
  const visibleDiffRows = changesOnly ? diffRows.filter((row) => row.status !== 'unchanged') : diffRows;
  const changedFields = diffRows.filter((row) => row.status !== 'unchanged').length;
  const errorGuidance = result && !isSuccess ? getErrorGuidance(result) : null;

  /** Parsed JSON value for the tree view: object body, or raw text that parses as JSON. */
  const treeData: unknown = React.useMemo(() => {
    if (!result) return undefined;
    if (bodyIsObject) return result.upstream.body;
    if (result.upstream.rawBody) {
      try {
        return JSON.parse(result.upstream.rawBody) as unknown;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [result, bodyIsObject]);

  /** Tree is offered only when the body is valid JSON; otherwise the raw view stays. */
  const canShowTree = treeData !== undefined;
  const effectiveBodyView = canShowTree ? bodyView : 'raw';

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
    <>
      {isFullscreen && <div className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm" aria-hidden="true" />}
      <section
        className={`${isFullscreen ? 'fixed inset-3 sm:inset-6 z-[100] rounded-2xl border border-border shadow-2xl' : 'h-full'} flex flex-col min-w-0 overflow-hidden`}
        style={{ background: 'var(--response-bg)' }}
      >
      {/* Response Panel Header */}
      <div className="min-h-14 px-3 sm:px-4 py-2 border-b border-[var(--border)] flex items-center justify-between gap-3 shrink-0 min-w-0" style={{ background: 'var(--surface-1)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground">
            Response
          </span>
          {(running || loadedHistoryId || result) && (
            <>
              <span className="w-1 h-1 rounded-full bg-border-strong" aria-hidden="true" />
              <span className="text-sm text-muted-foreground truncate">
                {running
                  ? 'Sending request'
                  : loadedHistoryId
                    ? 'Saved run'
                    : `${result?.upstream.status ?? ''} ${result?.upstream.statusText || ''}`}
              </span>
            </>
          )}
        </div>

        {/* Quick Toolbar Actions */}
        {result && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(prettyJson, 'json')}
              className="h-9 text-sm text-secondary-foreground hover:text-foreground hover:bg-accent px-3 gap-2 cursor-pointer rounded-lg"
              title="Copy JSON Response"
            >
              {copiedType === 'json' ? (
                <CheckCircle2 size={12} className="text-success" />
              ) : (
                <Copy size={11} />
              )}
              <span className="hidden sm:inline">{copiedType === 'json' ? 'Copied' : 'JSON'}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={downloadExample} className="h-9 text-sm text-secondary-foreground hover:text-foreground hover:bg-accent px-2.5 sm:px-3 gap-2 cursor-pointer rounded-lg" title="Save response as JSON example"><Download size={13} /><span className="hidden sm:inline">Save</span></Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen((value) => !value)}
              className="h-9 px-2.5 text-secondary-foreground hover:text-foreground hover:bg-accent cursor-pointer rounded-lg"
              title={isFullscreen ? 'Exit full screen' : 'View response full screen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
            {onClear && <Button variant="ghost" size="sm" onClick={onClear} className="h-9 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2.5 sm:px-3 gap-2 cursor-pointer rounded-lg" title="Clear response"><Trash2 size={13} /><span className="hidden sm:inline">Clear</span></Button>}
          </div>
        )}
      </div>

      {/* Response metrics */}
      {result && (
        <div className="min-h-12 px-3 sm:px-4 py-2 border-b border-[var(--border)] flex items-center justify-between font-mono text-xs text-muted-foreground shrink-0 overflow-x-auto bg-card">
          <>
            <div className="flex items-center gap-2 whitespace-nowrap">
              {/* HTTP Status Code Badge */}
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(
                  result.upstream.status
                )}`}
              >
                {isSuccess ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                <span>
                  {isSuccess ? 'Success' : 'Failed'} · {result.upstream.status} {result.upstream.statusText || ''}
                </span>
              </span>

              {/* Latency */}
              <span className="console-metric">
                <Clock3 size={11} className={result.meta.durationMs < 500 ? 'text-success' : 'text-warning'} />
                <span>{result.meta.durationMs} ms</span>
              </span>

              {/* Payload Size */}
              <span className="console-metric">
                <Activity size={11} className="text-muted-foreground" />
                <span>{(result.meta.responseSize / 1024).toFixed(2)} KB</span>
              </span>

              {/* HMAC Signer Tag */}
              {result.meta.signed && (
                <span className="console-metric hidden sm:flex text-success">
                  <ShieldCheck size={11} />
                  <span>Request signed</span>
                </span>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground hidden md:block">
              ID: {result.meta.requestId.slice(0, 8)}
            </div>
          </>
        </div>
      )}

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
            <Tabs
              value={responseTab}
              onValueChange={(value) => value && setResponseTab(value as typeof responseTab)}
              className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden"
            >
              <TabsList
                variant="line"
                className="response-tabs-list console-scroll-tabs w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden justify-start rounded-none !border-0 border-b border-border/80 bg-[#edf5ff] px-2 py-1.5 h-auto gap-1 shrink-0 shadow-none"
              >
                <TabsTrigger value="pretty" className="min-h-10 w-auto shrink-0 justify-center rounded-lg !border-0 text-xs px-3 text-muted-foreground font-semibold hover:bg-white/70 hover:text-foreground data-active:bg-white data-active:text-primary cursor-pointer shadow-none after:hidden">
                  <FileJson size={13} /> Pretty JSON
                </TabsTrigger>
                <TabsTrigger value="raw" className="min-h-10 w-auto shrink-0 justify-center rounded-lg !border-0 text-xs px-3 text-muted-foreground font-semibold hover:bg-white/70 hover:text-foreground data-active:bg-white data-active:text-primary cursor-pointer shadow-none after:hidden">
                  <Code2 size={13} /> Raw <span className="hidden min-[400px]:inline">Response</span>
                </TabsTrigger>
                {previousResult && (
                  <TabsTrigger value="compare" className="min-h-10 w-auto shrink-0 justify-center rounded-lg !border-0 text-xs px-3 text-muted-foreground font-semibold hover:bg-white/70 hover:text-foreground data-active:bg-white data-active:text-primary cursor-pointer shadow-none after:hidden gap-1.5">
                    <GitCompareArrows size={13} />
                    Compare
                    {changedFields > 0 && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary">{changedFields}</span>
                    )}
                  </TabsTrigger>
                )}
                <TabsTrigger value="headers" className="min-h-10 w-auto shrink-0 justify-center rounded-lg !border-0 text-xs px-3 text-muted-foreground font-semibold hover:bg-white/70 hover:text-foreground data-active:bg-white data-active:text-primary cursor-pointer shadow-none after:hidden">
                  <ListChecks size={13} /> Headers <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">{Object.keys(result.upstream.headers).length}</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="min-h-10 w-auto shrink-0 justify-center rounded-lg !border-0 text-xs px-3 text-muted-foreground font-semibold hover:bg-white/70 hover:text-foreground data-active:bg-white data-active:text-primary cursor-pointer shadow-none after:hidden">
                  <Send size={13} /> Request <span className="hidden min-[400px]:inline">Sent</span>
                </TabsTrigger>
                <TabsTrigger value="meta" className="min-h-10 w-auto shrink-0 justify-center rounded-lg !border-0 text-xs px-3 text-muted-foreground font-semibold hover:bg-white/70 hover:text-foreground data-active:bg-white data-active:text-primary cursor-pointer shadow-none after:hidden">
                  <ShieldCheck size={13} /> Audit Meta
                </TabsTrigger>
              </TabsList>

            {/* Error banner if request failed */}
            {responseTab === 'pretty' && !isSuccess && errorGuidance && (
              <Alert variant="destructive" className="m-3 w-auto rounded-xl border-destructive/25 bg-destructive/[0.06]">
                <AlertCircle />
                <AlertTitle className="text-sm">{errorGuidance.title}</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{errorGuidance.explanation}</p>
                  <div className="rounded-lg border border-border bg-background/80 p-2.5 text-foreground">
                    <span className="font-semibold">What to do: </span>{errorGuidance.suggestion}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {errorGuidance.environmentShortcut && onOpenEnvironment && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onOpenEnvironment}
                        className="h-8 gap-1.5 border-destructive/20 bg-background text-xs text-foreground"
                      >
                        <Settings2 size={13} />
                        Open Environment
                      </Button>
                    )}
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer font-medium hover:text-foreground">Technical details</summary>
                      <div className="mt-1.5 rounded-md bg-slate-950 p-2 font-mono text-slate-200">
                        {result.error?.type || 'GATEWAY_ERROR'} · HTTP {result.upstream.status}
                        {result.error?.message ? ` · ${result.error.message}` : ''}
                      </div>
                    </details>
                  </div>

                  {isTimeout && (
                    <div className="p-2 rounded bg-warning/10 border border-warning/25 text-warning text-xs flex items-start gap-1.5">
                      <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                      <span>Do not blindly retry a money-movement request before checking its status.</span>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Payment link quick actions — checkout URL sanitized, ready to copy/open */}
            {responseTab === 'pretty' && paymentUrls.length > 0 && (
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

              {/* Pretty JSON Tab — tree view for JSON bodies, raw text otherwise */}
              <TabsContent value="pretty" className="flex-1 min-w-0 overflow-auto p-3 sm:p-4 m-0" style={{ background: 'var(--code-bg)' }}>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {canShowTree ? (
                    <div className="bg-muted rounded-full p-1 inline-flex" role="group" aria-label="Body view">
                      <button
                        type="button"
                        onClick={() => setBodyView('tree')}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 transition-colors duration-150 cursor-pointer ${
                          effectiveBodyView === 'tree'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Tree
                      </button>
                      <button
                        type="button"
                        onClick={() => setBodyView('raw')}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 transition-colors duration-150 cursor-pointer ${
                          effectiveBodyView === 'raw'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Raw
                      </button>
                    </div>
                  ) : <span />}
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-xs shadow-sm sm:w-64">
                      <Search size={13} className="shrink-0 text-muted-foreground" />
                      <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search response…"
                        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                      />
                      {searchQuery && (
                        <>
                          <span className={`shrink-0 font-mono text-[10px] ${searchMatchCount ? 'text-primary' : 'text-destructive'}`}>
                            {searchMatchCount}
                          </span>
                          <button type="button" onClick={() => setSearchQuery('')} className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Clear search">
                            <X size={12} />
                          </button>
                        </>
                      )}
                    </label>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(prettyJson, 'json')} className="h-8 shrink-0 rounded-lg gap-1.5 px-2.5 text-xs">
                      {copiedType === 'json' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                      <span className="hidden min-[400px]:inline">{copiedType === 'json' ? 'Copied' : 'Copy JSON'}</span>
                    </Button>
                  </div>
                </div>
                {effectiveBodyView === 'tree' ? (
                  <JsonTree key={result.meta.requestId} data={treeData} searchQuery={searchQuery} />
                ) : (
                  <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed select-text">
                    {prettyJson
                      ? searchQuery
                        ? highlightedText(prettyJson, searchQuery)
                        : renderBodyWithLinks(prettyJson, bodyIsObject)
                      : '// Empty response body.'}
                  </pre>
                )}
              </TabsContent>

              {/* Raw Response Tab */}
              <TabsContent value="raw" className="flex-1 min-w-0 overflow-auto p-3 sm:p-4 m-0" style={{ background: 'var(--code-bg)' }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Original response</span>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.upstream.rawBody || '', 'raw')} className="h-8 rounded-lg gap-1.5 text-xs">
                    {copiedType === 'raw' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                    {copiedType === 'raw' ? 'Copied' : 'Copy raw'}
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed select-text">
                    {result.upstream.rawBody || '// No raw body'}
                  </pre>
                </div>
              </TabsContent>

              {/* Current vs previous response comparison */}
              {previousResult && (
                <TabsContent value="compare" className="flex-1 min-w-0 overflow-auto p-3 m-0" style={{ background: 'var(--code-bg)' }}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full border border-border bg-card px-2.5 py-1 font-mono text-muted-foreground">
                        Previous: {previousResult.upstream.status}
                      </span>
                      <span className="rounded-full border border-border bg-card px-2.5 py-1 font-mono text-foreground">
                        Current: {result.upstream.status}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                        {changedFields} changed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={changesOnly}
                          onChange={(event) => setChangesOnly(event.target.checked)}
                          className="rounded border-border text-primary"
                        />
                        Changes only
                      </label>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(prettyJson, 'json')} className="h-8 rounded-lg gap-1.5 text-xs">
                        {copiedType === 'json' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                        {copiedType === 'json' ? 'Copied' : 'Copy current'}
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="grid min-w-[760px] grid-cols-[minmax(180px,0.8fr)_minmax(260px,1fr)_minmax(260px,1fr)] border-b border-border bg-muted text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      <div className="p-2.5">JSON path</div>
                      <div className="border-l border-border p-2.5">Previous response</div>
                      <div className="border-l border-border p-2.5">Current response</div>
                    </div>
                    <div className="min-w-[760px] divide-y divide-border/70">
                      {visibleDiffRows.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">Responses are identical.</div>
                      ) : visibleDiffRows.map((row) => (
                        <div
                          key={row.path}
                          className="grid grid-cols-[minmax(180px,0.8fr)_minmax(260px,1fr)_minmax(260px,1fr)] text-xs font-mono"
                        >
                          <div className="flex items-start gap-2 p-2.5 text-primary">
                            <span className={`mt-1 size-1.5 shrink-0 rounded-full ${
                              row.status === 'added' ? 'bg-emerald-500' : row.status === 'removed' ? 'bg-red-500' : row.status === 'changed' ? 'bg-amber-500' : 'bg-slate-300'
                            }`} />
                            <span className="break-all">{row.path}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void copyText(displayDiffValue(row.previous))}
                            className={`border-l border-border p-2.5 text-left break-all transition-colors hover:bg-accent/50 ${
                              row.status === 'removed' || row.status === 'changed' ? 'bg-red-50 text-red-800' : 'text-muted-foreground'
                            }`}
                            title="Copy previous value"
                          >
                            {displayDiffValue(row.previous)}
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyText(displayDiffValue(row.current))}
                            className={`border-l border-border p-2.5 text-left break-all transition-colors hover:bg-accent/50 ${
                              row.status === 'added' || row.status === 'changed' ? 'bg-emerald-50 text-emerald-800' : 'text-foreground'
                            }`}
                            title="Copy current value"
                          >
                            {displayDiffValue(row.current)}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Headers Tab */}
              <TabsContent value="headers" className="flex-1 overflow-y-auto p-3 m-0" style={{ background: 'var(--code-bg)' }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Response headers</span>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(result.upstream.headers, null, 2), 'headers')} className="h-8 rounded-lg gap-1.5 text-xs">
                    {copiedType === 'headers' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                    {copiedType === 'headers' ? 'Copied' : 'Copy headers'}
                  </Button>
                </div>
                <div className="border border-[var(--border)] rounded-xl overflow-x-auto bg-card shadow-sm">
                  <table className="mobile-card-table w-full min-w-0 sm:min-w-[520px] text-xs font-mono">
                    <tbody className="divide-y divide-[var(--border)]">
                      {Object.entries(result.upstream.headers).map(([k, v]) => (
                        <tr key={k} className="transition-colors hover:bg-accent/50">
                          <td data-label="Header" className="p-2 text-primary font-semibold sm:w-1/3 sm:border-r border-[var(--border)] select-text">{k}</td>
                          <td data-label="Value" className="p-2 text-secondary-foreground break-all select-text">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Outbound Request Details Tab */}
              <TabsContent value="details" className="flex-1 overflow-y-auto p-3 m-0 space-y-3 text-xs bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Executed request</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(result.request, null, 2), 'request')}
                    className="h-8 rounded-lg gap-1.5 bg-card text-xs"
                  >
                    {copiedType === 'request' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                    {copiedType === 'request' ? 'Copied' : 'Copy request'}
                  </Button>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                    Executed Method & Final URL
                  </span>
                  <div className="flex items-start gap-2 p-2 rounded bg-card border border-border">
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
                      <div key={k} className="flex flex-col gap-1 border-b border-border/60 py-1.5 last:border-b-0 sm:flex-row sm:justify-between sm:gap-4">
                        <span className="text-muted-foreground shrink-0">{k}:</span>
                        <span className="text-foreground break-all sm:text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                    Outbound Request Body
                  </span>
                  <pre className="p-2.5 rounded bg-card border border-border font-mono text-[11px] text-secondary-foreground whitespace-pre-wrap break-words overflow-x-auto">
                    {typeof result.request.body === 'object'
                      ? JSON.stringify(result.request.body, null, 2)
                      : String(result.request.body || '(Empty body)')}
                  </pre>
                </div>
              </TabsContent>

              {/* Audit Meta Tab */}
              <TabsContent value="meta" className="flex-1 overflow-y-auto p-3 m-0 bg-muted">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Audit metadata</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(result.meta, null, 2), 'meta')}
                    className="h-8 rounded-lg gap-1.5 bg-card text-xs"
                  >
                    {copiedType === 'meta' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                    {copiedType === 'meta' ? 'Copied' : 'Copy metadata'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Country Gateway</span>
                    <strong className="text-foreground">{result.meta.country.toUpperCase()}</strong>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Environment</span>
                    <strong className="text-foreground">{environmentLabel(result.meta.environment)}</strong>
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
    </>
  );
}

