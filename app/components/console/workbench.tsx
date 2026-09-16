'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Loader2,
  Code2,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Braces,
  Trash2,
  Plus,
  Save,
  CheckCircle2,
  RotateCcw,
  Lock,
  Copy,
  Undo2,
  FileJson,
  Layers,
  HelpCircle,
  AlertTriangle,
  PanelLeftOpen,
  Terminal,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { Method, ParamRow, HeaderRow, SafeConfig } from './types';

interface WorkbenchProps {
  countrySlug: string;
  environment: string;
  name: string;
  onNameChange: (name: string) => void;
  method: Method;
  onMethodChange: (method: Method) => void;
  url: string;
  onUrlChange: (url: string) => void;
  body: string;
  onBodyChange: (body: string) => void;
  paramRows: ParamRow[];
  onParamRowsChange: (rows: ParamRow[]) => void;
  headerRows: HeaderRow[];
  onHeaderRowsChange: (rows: HeaderRow[]) => void;
  onSend: () => void;
  onSave: () => void;
  running: boolean;
  saving: boolean;
  dirty: boolean;
  savedMessage: string;
  loadedHistoryId: string | null;
  config: SafeConfig | null;
  requiresSignature?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Workbench({
  countrySlug,
  environment,
  name,
  onNameChange,
  method,
  onMethodChange,
  url,
  onUrlChange,
  body,
  onBodyChange,
  paramRows,
  onParamRowsChange,
  headerRows,
  onHeaderRowsChange,
  onSend,
  onSave,
  running,
  saving,
  dirty,
  savedMessage,
  loadedHistoryId,
  config,
  requiresSignature = true,
  sidebarCollapsed,
  onToggleSidebar,
}: WorkbenchProps) {
  const [jsonError, setJsonError] = useState('');
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const currentEnvConfig = config?.[countrySlug]?.[environment];
  const baseUrl = currentEnvConfig?.hostname
    ? `https://${currentEnvConfig.hostname}`
    : 'https://api.assanpay.com';
  const isStatusInquiry = url.includes('/status-inquiry') || requiresSignature === false;

  // Beautify JSON body
  const handleBeautify = () => {
    try {
      if (!body.trim()) return;
      const parsed = JSON.parse(body);
      onBodyChange(JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON syntax');
    }
  };

  // Minify JSON body
  const handleMinify = () => {
    try {
      if (!body.trim()) return;
      const parsed = JSON.parse(body);
      onBodyChange(JSON.stringify(parsed));
      setJsonError('');
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON syntax');
    }
  };

  // Copy body to clipboard
  const handleCopyBody = async () => {
    if (!body) return;
    await navigator.clipboard.writeText(body);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 1500);
  };

  // Add query param row
  const addParamRow = () => {
    onParamRowsChange([
      ...paramRows,
      { id: `param-${Date.now()}`, enabled: true, key: '', value: '', description: '' },
    ]);
  };

  const updateParamRow = (id: string, field: keyof ParamRow, val: unknown) => {
    const updated = paramRows.map((row) => (row.id === id ? { ...row, [field]: val } : row));
    onParamRowsChange(updated);
  };

  const deleteParamRow = (id: string) => {
    onParamRowsChange(paramRows.filter((row) => row.id !== id));
  };

  // Add custom header row
  const addHeaderRow = () => {
    onHeaderRowsChange([
      ...headerRows,
      { id: `header-${Date.now()}`, enabled: true, key: '', value: '', description: '' },
    ]);
  };

  const updateHeaderRow = (id: string, field: keyof HeaderRow, val: unknown) => {
    const updated = headerRows.map((row) => (row.id === id ? { ...row, [field]: val } : row));
    onHeaderRowsChange(updated);
  };

  const deleteHeaderRow = (id: string) => {
    onHeaderRowsChange(headerRows.filter((row) => row.id !== id));
  };

  // Synchronize params to URL query string
  useEffect(() => {
    const [path] = url.split('?');
    const enabledParams = paramRows.filter((p) => p.enabled && p.key.trim());
    if (enabledParams.length === 0) return;

    const sp = new URLSearchParams();
    enabledParams.forEach((p) => sp.set(p.key.trim(), p.value));
    const newQuery = sp.toString();
    const newUrl = newQuery ? `${path}?${newQuery}` : path;
    if (newUrl !== url) {
      onUrlChange(newUrl);
    }
  }, [paramRows]);

  // Extract variables in current request
  const detectedVariables = useMemo(() => {
    const text = `${url} ${body}`;
    const matches = text.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ''))));
  }, [url, body]);

  // Line numbers for body editor
  const lineNumbers = useMemo(() => {
    const count = (body.match(/\n/g) || []).length + 1;
    return Array.from({ length: Math.max(count, 14) }, (_, i) => i + 1);
  }, [body]);

  const copyGeneratedHeaders = async () => {
    const text = [
      `X-API-KEY: •••••••• (Managed by server)`,
      !isStatusInquiry ? `X-TIMESTAMP: [Unix Timestamp]` : null,
      !isStatusInquiry ? `X-NONCE: [UUID v4]` : null,
      !isStatusInquiry ? `X-SIGNATURE: [HMAC-SHA256 Base64]` : null,
      `Content-Type: application/json`,
      `Accept: application/json`,
    ]
      .filter(Boolean)
      .join('\n');

    await navigator.clipboard.writeText(text);
    setCopiedHeaders(true);
    setTimeout(() => setCopiedHeaders(false), 1500);
  };

  const [copiedCurl, setCopiedCurl] = useState(false);

  // Generate a runnable Bash cURL script without exposing server-side secrets.
  const handleCopyCurl = async () => {
    try {
      const shellQuote = (value: string) => `'${value.replace(/'/g, `'"'"'`)}'`;
      const lines = [
        `METHOD=${shellQuote(method)}`,
        `BASE_URL=${shellQuote(baseUrl)}`,
        `PATH_WITH_QUERY=${shellQuote(url)}`,
        `BODY=${shellQuote(method === 'GET' ? '' : body.trim())}`,
        'API_KEY="${ASSANPAY_API_KEY:?Set ASSANPAY_API_KEY first}"',
      ];

      if (!isStatusInquiry) {
        lines.push(
          'API_SECRET="${ASSANPAY_API_SECRET:?Set ASSANPAY_API_SECRET first}"',
          'TIMESTAMP=$(date +%s)',
          'NONCE=$(uuidgen | tr "[:upper:]" "[:lower:]")',
          'BODY_HASH=$(printf "%s" "$BODY" | openssl dgst -sha256 | awk "{print \\$2}")',
          'CANONICAL=$(printf "%s\\n%s\\n%s\\n%s\\n%s" "$METHOD" "$PATH_WITH_QUERY" "$TIMESTAMP" "$NONCE" "$BODY_HASH")',
          'SIGNATURE=$(printf "%s" "$CANONICAL" | openssl dgst -sha256 -hmac "$API_SECRET" -binary | openssl base64 -A)'
        );
      }

      const curlParts = [
        'curl --request "$METHOD" \\',
        '  --url "$BASE_URL$PATH_WITH_QUERY" \\',
        '  --header "X-API-KEY: $API_KEY" \\',
        '  --header "Accept: application/json"',
      ];
      if (!isStatusInquiry) {
        curlParts[curlParts.length - 1] += ' \\';
        curlParts.push('  --header "X-TIMESTAMP: $TIMESTAMP" \\', '  --header "X-NONCE: $NONCE" \\', '  --header "X-SIGNATURE: $SIGNATURE"');
      }
      headerRows.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
        curlParts[curlParts.length - 1] += ' \\';
        curlParts.push(`  --header ${shellQuote(`${h.key.trim()}: ${h.value.trim()}`)}`);
      });
      if (body.trim() && method !== 'GET') {
        curlParts[curlParts.length - 1] += ' \\';
        curlParts.push('  --header "Content-Type: application/json" \\', '  --data-raw "$BODY"');
      }

      await navigator.clipboard.writeText([...lines, '', ...curlParts].join('\n'));
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 1600);
    } catch {
      // ignore
    }
  };

  const getMethodColorClass = (m: Method) => {
    switch (m) {
      case 'GET':
        return 'text-primary';
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
    <section className="h-full flex flex-col min-w-0 select-none" style={{ background: 'var(--workbench-bg)' }}>
      {/* Top Workspace Tab Strip & Save Toolbar */}
      <div className="min-h-[42px] px-2 sm:px-3 border-b border-[var(--border)] flex items-center justify-between gap-2 shrink-0" style={{ background: 'var(--surface-2)' }}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {sidebarCollapsed && onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-5)] cursor-pointer shrink-0 -ml-1 mr-1 transition-colors"
              title="Open Collections Sidebar"
            >
              <PanelLeftOpen size={13} />
            </Button>
          )}

          <div className="h-9 flex items-center gap-1.5 sm:gap-2 px-2.5 border-x border-[var(--border)] min-w-0 max-w-md rounded-none" style={{ background: 'var(--surface-4)' }}>
            <span className={`method-badge ${method.toLowerCase()}`}>{method}</span>
            <span className="text-xs font-mono text-muted-foreground uppercase shrink-0 tracking-wider">
              {countrySlug}
            </span>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Request Name"
              className="text-sm font-medium text-foreground bg-transparent outline-none border-b border-transparent focus:border-[var(--primary)] truncate min-w-0 w-24 sm:w-44 md:w-56 transition-colors"
              title="Click to rename request"
            />
            {dirty && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-warning shrink-0"
                title="Unsaved changes"
              />
            )}
          </div>
        </div>

        {/* State Tags & Save Action */}
        <div className="flex items-center gap-2 shrink-0">
          {savedMessage && (
            <span className="hidden md:flex items-center gap-1 text-xs text-success font-mono animate-fade-in">
              <CheckCircle2 size={12} />
              {savedMessage}
            </span>
          )}
          {loadedHistoryId && (
            <span className="hidden md:flex items-center gap-1 text-xs text-primary font-mono animate-fade-in">
              <RotateCcw size={11} />
              Snapshot
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={saving || !name.trim() || !url.trim()}
            className="h-7 px-2.5 border-[var(--border)] text-secondary-foreground text-xs font-medium gap-1.5 cursor-pointer shadow-none transition-colors hover:text-foreground hover:border-[var(--primary)]/40"
            style={{ background: 'var(--surface-4)' }}
            title="Save Request to Collection (Ctrl+S)"
          >
            {saving ? <Loader2 size={12} className="spin" /> : <Save size={12} />}
            <span>Save</span>
            <kbd className="text-[11px] font-mono text-muted-foreground hidden sm:inline ml-0.5">Ctrl S</kbd>
          </Button>
        </div>
      </div>

      {/* Main Request Work Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 sm:px-4 lg:px-5 py-4 space-y-3.5">

        {/* Context Breadcrumb — country / environment / request */}
        <Breadcrumb className="shrink-0">
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink className="text-muted-foreground hover:text-foreground capitalize cursor-default">
                {countrySlug}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-muted-foreground hover:text-foreground cursor-default">
                Sandbox
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
                {name || 'Untitled Request'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Unified Request Bar — single cohesive instrument */}
        <div
          className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0 rounded-xl border overflow-hidden transition-colors duration-150 focus-within:border-[var(--primary)]/60 focus-within:ring-2 focus-within:ring-[var(--primary)]/20"
          style={{ background: 'var(--surface-1)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          {/* Method + URL — one seamless unit */}
          <div className="flex flex-1 items-stretch min-w-0">
            {/* Method Selector — integrated, borderless */}
            <Select
              value={method}
              onValueChange={(val) => {
                if (val) onMethodChange(val as Method);
              }}
            >
              <SelectTrigger
                className={`w-[92px] sm:w-[104px] shrink-0 h-11 sm:h-auto font-mono font-bold text-[13px] shadow-none cursor-pointer border-0 rounded-none bg-transparent px-3 transition-colors focus:ring-0 ${getMethodColorClass(method)}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs font-mono font-bold" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <SelectItem value="GET" className="text-primary">GET</SelectItem>
                <SelectItem value="POST" className="text-[var(--color-method-post)]">POST</SelectItem>
                <SelectItem value="PUT" className="text-[var(--color-method-put)]">PUT</SelectItem>
                <SelectItem value="PATCH" className="text-[var(--color-method-patch)]">PATCH</SelectItem>
                <SelectItem value="DELETE" className="text-[var(--color-method-delete)]">DELETE</SelectItem>
              </SelectContent>
            </Select>

            {/* Divider */}
            <div className="w-px self-stretch my-2 shrink-0" style={{ background: 'var(--border)' }} />

            {/* URL Composer */}
            <div className="flex-1 flex items-center min-w-0">
              <div
                className="hidden lg:flex items-center gap-1.5 pl-3 h-full text-muted-foreground font-mono text-[11px] select-none shrink-0"
              >
                <Lock size={10} className="text-success" />
                <span className="text-muted-foreground">{baseUrl}</span>
              </div>
              <input
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder="/api/payments/p2p/submit"
                className="flex-1 h-11 sm:h-full px-3 bg-transparent text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground/60 min-w-0"
                spellCheck={false}
              />
              {detectedVariables.length > 0 && (
                <span className="mr-2 text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/25 shrink-0">
                  {detectedVariables.length} var{detectedVariables.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions — attached to the bar */}
          <div className="flex items-stretch shrink-0 border-t sm:border-t-0 sm:border-l" style={{ borderColor: 'var(--border)' }}>
            {/* cURL Copy Button */}
            <button
              type="button"
              onClick={handleCopyCurl}
              className="hidden sm:flex items-center gap-1.5 px-3 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-[12px] font-medium"
              title="Copy as cURL"
            >
              {copiedCurl ? (
                <Check size={13} className="text-success" />
              ) : (
                <Terminal size={13} />
              )}
              <span>{copiedCurl ? 'Copied!' : 'cURL'}</span>
            </button>
            <div className="hidden sm:block w-px self-stretch my-2" style={{ background: 'var(--border)' }} />

            {/* Send Button — integrated */}
            <button
              onClick={onSend}
              disabled={running || !url.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 sm:px-6 h-11 sm:h-auto bg-primary text-primary-foreground font-semibold text-sm cursor-pointer transition-all duration-150 hover:brightness-[1.08] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{running ? 'Sending…' : 'Send'}</span>
              {!running && <kbd className="hidden lg:inline text-[10px] font-mono opacity-70 bg-black/15 px-1.5 py-0.5 rounded">Ctrl ↵</kbd>}
            </button>
          </div>
        </div>

        {/* Security Strip */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground px-0.5 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={11} className={isStatusInquiry ? 'text-warning' : 'text-success'} />
              <span className={isStatusInquiry ? 'text-warning/80' : 'text-success/80'}>
                {isStatusInquiry ? 'HMAC Exempt' : 'HMAC-SHA256 Signed'}
              </span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span>Plaintext JSON</span>
          </div>
          <span className="text-xs">
            Press <kbd className="text-muted-foreground font-mono bg-[var(--surface-4)] px-1 py-0.5 rounded text-[11px]">Ctrl+Enter</kbd> to send
          </span>
        </div>

        {/* Postman-Grade Request Tabs */}
        <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0 pt-1">
          <TabsList variant="line" className="bg-transparent border-b border-border justify-start rounded-none p-0 h-auto gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden shrink-0 scrollbar-none">
            <TabsTrigger
              value="params"
              className="rounded-none border-0 border-b-2 border-transparent data-active:border-primary data-active:text-foreground data-active:bg-transparent text-xs sm:text-sm py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none shrink-0"
            >
              <span>Params</span>
              {paramRows.filter((p) => p.enabled && p.key).length > 0 && (
                <span className="font-mono text-xs font-bold text-primary ml-1">
                  ({paramRows.filter((p) => p.enabled && p.key).length})
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="headers"
              className="rounded-none border-0 border-b-2 border-transparent data-active:border-primary data-active:text-foreground data-active:bg-transparent text-xs sm:text-sm py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none shrink-0"
            >
              <span>Headers</span>
              <span className="font-mono text-xs text-muted-foreground ml-1">
                ({headerRows.filter((h) => h.enabled && h.key).length + (isStatusInquiry ? 2 : 4)})
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="body"
              className="rounded-none border-0 border-b-2 border-transparent data-active:border-primary data-active:text-foreground data-active:bg-transparent text-xs sm:text-sm py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none shrink-0"
            >
              <span>Body</span>
              {method !== 'GET' && (
                <span className="text-xs text-primary font-mono ml-1">JSON</span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="signing"
              className="rounded-none border-0 border-b-2 border-transparent data-active:border-primary data-active:text-foreground data-active:bg-transparent text-xs sm:text-sm py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none shrink-0"
            >
              <span>Signing Details</span>
            </TabsTrigger>

            <TabsTrigger
              value="variables"
              className="rounded-none border-0 border-b-2 border-transparent data-active:border-primary data-active:text-foreground data-active:bg-transparent text-xs sm:text-sm py-2 px-1 text-muted-foreground font-medium hover:text-foreground transition-colors cursor-pointer shadow-none shrink-0"
            >
              <span>Variables</span>
              {detectedVariables.length > 0 && (
                <span className="font-mono text-xs font-bold text-warning ml-1">
                  ({detectedVariables.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* PARAMS TAB */}
          <TabsContent value="params" className="mt-3 flex-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Query Parameters
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={addParamRow}
                className="h-7 text-xs text-primary hover:text-primary hover:bg-muted gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Row</span>
              </Button>
            </div>

            <div className="border border-border rounded-xl overflow-x-auto" style={{ background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}>
              <table className="w-full min-w-[640px] text-xs text-left">
                <thead className="text-muted-foreground border-b border-border">
                  <tr className="text-[11px] uppercase tracking-[0.05em] font-semibold">
                    <th className="w-8 p-2.5 text-center font-medium">✓</th>
                    <th className="p-2.5 w-1/3 font-medium">Key</th>
                    <th className="p-2.5 w-1/2 font-medium">Value</th>
                    <th className="w-9 p-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {paramRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground font-sans text-xs">
                        No query parameters configured. Click &quot;Add Row&quot; or type query parameters directly in the URL path.
                      </td>
                    </tr>
                  ) : (
                    paramRows.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) => updateParamRow(row.id, 'enabled', e.target.checked)}
                            className="rounded border-border bg-card text-primary cursor-pointer"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={row.key}
                            onChange={(e) => updateParamRow(row.id, 'key', e.target.value)}
                            placeholder="Key"
                            className="w-full bg-transparent px-2 py-1 outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={row.value}
                            onChange={(e) => updateParamRow(row.id, 'value', e.target.value)}
                            placeholder="Value"
                            className="w-full bg-transparent px-2 py-1 outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            onClick={() => deleteParamRow(row.id)}
                            className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* HEADERS TAB */}
          <TabsContent value="headers" className="mt-3 flex-1 flex flex-col space-y-4">
            {/* Auto-injected System Headers */}
            <div className="p-3 rounded-md bg-card border border-border text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <KeyRound size={14} />
                  <span>Outbound Security Headers (Auto-injected by Server)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyGeneratedHeaders}
                  className="h-6 text-[11px] text-muted-foreground hover:text-primary gap-1 cursor-pointer"
                >
                  {copiedHeaders ? (
                    <CheckCircle2 size={12} className="text-success" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedHeaders ? 'Copied' : 'Copy Preview'}</span>
                </Button>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between p-1.5 rounded bg-background border border-border">
                  <span className="text-muted-foreground">X-API-KEY</span>
                  <span className="text-success">•••••••• (Injected safely from environment vault)</span>
                </div>

                {!isStatusInquiry ? (
                  <>
                    <div className="flex items-center justify-between p-1.5 rounded bg-background border border-border">
                      <span className="text-muted-foreground">X-TIMESTAMP</span>
                      <span className="text-primary">[Canonical Epoch Timestamp (ms)]</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-background border border-border">
                      <span className="text-muted-foreground">X-NONCE</span>
                      <span className="text-primary">[Cryptographic Nonce (UUID v4)]</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-background border border-border">
                      <span className="text-muted-foreground">X-SIGNATURE</span>
                      <span className="text-primary">[Base64(HMAC-SHA256(canonical, API_SECRET))]</span>
                    </div>
                  </>
                ) : (
                  <div className="p-1.5 rounded bg-primary/10 border border-primary/25 text-primary text-[11px]">
                    Status Inquiry Spec: Only X-API-KEY is required. HMAC signature headers omitted.
                  </div>
                )}

                <div className="flex items-center justify-between p-1.5 rounded bg-background border border-border">
                  <span className="text-muted-foreground">Content-Type</span>
                  <span className="text-foreground">application/json</span>
                </div>
              </div>
            </div>

            {/* Custom Headers Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Custom Outbound Headers
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addHeaderRow}
                  className="h-7 text-xs text-primary hover:text-primary hover:bg-muted gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Header</span>
                </Button>
              </div>

              <div className="border border-border rounded-xl overflow-x-auto" style={{ background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}>
                <table className="w-full min-w-[640px] text-xs text-left">
                  <thead className="text-muted-foreground border-b border-border">
                    <tr className="text-[11px] uppercase tracking-[0.05em] font-semibold">
                      <th className="w-8 p-2.5 text-center font-medium">✓</th>
                      <th className="p-2.5 w-1/3 font-medium">Header Name</th>
                      <th className="p-2.5 w-1/2 font-medium">Header Value</th>
                      <th className="w-9 p-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {headerRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground font-sans text-xs">
                          No custom headers defined.
                        </td>
                      </tr>
                    ) : (
                      headerRows.map((row) => (
                        <tr key={row.id} className="hover:bg-card/60">
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={row.enabled}
                              onChange={(e) => updateHeaderRow(row.id, 'enabled', e.target.checked)}
                              className="rounded border-border bg-card text-primary cursor-pointer"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              value={row.key}
                              onChange={(e) => updateHeaderRow(row.id, 'key', e.target.value)}
                              placeholder="Header name"
                              className="w-full bg-transparent px-2 py-1 outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              value={row.value}
                              onChange={(e) => updateHeaderRow(row.id, 'value', e.target.value)}
                              placeholder="Value"
                              className="w-full bg-transparent px-2 py-1 outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <button
                              onClick={() => deleteHeaderRow(row.id)}
                              className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* BODY TAB */}
          <TabsContent value="body" className="mt-2.5 flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col border border-border rounded-xl overflow-hidden" style={{ background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}>
              {/* Code Editor Toolbar — subtle, integrated */}
              <div className="min-h-[36px] px-3 py-1 border-b border-border/70 flex items-center justify-between gap-2 text-xs text-muted-foreground shrink-0 select-none flex-wrap" style={{ background: 'var(--surface-2)' }}>
                <div className="flex items-center gap-2 font-mono text-[11px] min-w-0">
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/10 text-primary shrink-0">
                    <Code2 size={11} />
                  </span>
                  <span className="text-foreground font-semibold">JSON</span>
                  <span className="hidden sm:inline text-muted-foreground/50">·</span>
                  <span className="hidden sm:inline text-muted-foreground">Raw payload</span>
                  <span className="hidden md:inline text-muted-foreground/50">·</span>
                  <span className="hidden md:inline tabular-nums">{body.length} chars</span>
                  <span className="hidden md:inline text-muted-foreground/50">·</span>
                  <span className="hidden md:inline tabular-nums">{new TextEncoder().encode(body).byteLength} B</span>
                </div>

                {method !== 'GET' && (
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={handleBeautify}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary px-2 py-1 rounded-md hover:bg-primary/10 transition-colors cursor-pointer"
                      title="Format & indent JSON"
                    >
                      <Sparkles size={11} />
                      <span>Format</span>
                    </button>

                    <button
                      onClick={handleMinify}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                      title="Minify JSON payload"
                    >
                      <span>Minify</span>
                    </button>

                    <button
                      onClick={handleCopyBody}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                      title="Copy Body"
                    >
                      {copiedBody ? <CheckCircle2 size={11} className="text-success" /> : <Copy size={11} />}
                      <span>{copiedBody ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => onBodyChange('')}
                      className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Clear Body"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* JSON Error Notification */}
              {jsonError && (
                <div className="p-2 bg-destructive/10 border-b border-destructive/25 text-destructive text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-destructive shrink-0" />
                    <span>JSON Parse Error: {jsonError}</span>
                  </div>
                  <button
                    onClick={() => setJsonError('')}
                    className="text-destructive hover:text-foreground cursor-pointer px-1"
                    aria-label="Dismiss JSON error"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Editor Workspace */}
              <div className="flex-1 flex min-h-[220px] overflow-hidden" style={{ background: 'var(--surface-1)' }}>
                {/* Gutter Line Numbers */}
                <div className="w-10 border-r border-border/50 py-3 pr-2 text-right select-none font-mono text-[11px] text-muted-foreground/50 leading-[1.65]" style={{ background: 'var(--surface-1)' }}>
                  {lineNumbers.map((num) => (
                    <div key={num}>{num}</div>
                  ))}
                </div>

                {/* Textarea */}
                <Textarea
                  value={body}
                  onChange={(e) => {
                    onBodyChange(e.target.value);
                    if (jsonError) setJsonError('');
                  }}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  className="flex-1 h-full w-full resize-none rounded-none border-0 font-mono text-[13px] leading-relaxed shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50 selection:bg-primary/25 p-3"
                  style={{ background: 'transparent' }}
                  placeholder={
                    method === 'GET'
                      ? '// GET requests execute with URL parameters and do not transmit a request body.'
                      : '{\n  "orderId": "{{orderId}}",\n  "amount": 500\n}'
                  }
                  disabled={method === 'GET'}
                  spellCheck={false}
                />
              </div>
            </div>
          </TabsContent>

          {/* SIGNING TAB */}
          <TabsContent value="signing" className="mt-3 flex-1 overflow-y-auto space-y-3">
            <div className="p-4 rounded-md bg-card border border-border space-y-3 text-xs">
              <div className="flex items-center gap-2 text-success font-semibold">
                <ShieldCheck size={16} />
                <span>HMAC-SHA256 Request Signing Pipeline</span>
              </div>

              <p className="text-secondary-foreground leading-relaxed">
                AssanPay uses canonical request signatures to prevent tampering, replay attacks, and unauthorized transactions.
              </p>

              <div className="p-3 rounded bg-background border border-border font-mono text-[11px] text-primary space-y-1">
                <div className="text-muted-foreground">// Canonical String Format</div>
                <div>METHOD = &quot;{method}&quot;</div>
                <div>PATH = &quot;{url.trim()}&quot;</div>
                <div>TIMESTAMP = EpochMs(Date.now())</div>
                <div>NONCE = crypto.randomUUID()</div>
                <div>BODY_HASH = SHA256(requestBody)</div>
                <div className="text-success pt-1">
                  SIGNATURE = Base64(HMAC-SHA256(canonicalString, API_SECRET))
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded bg-card border border-border">
                  <span className="text-xs font-mono text-muted-foreground uppercase block mb-1">
                    Signature Policy
                  </span>
                  <strong className={isStatusInquiry ? 'text-warning' : 'text-success'}>
                    {isStatusInquiry ? 'Exempt (Status Inquiry Spec)' : 'Required (HMAC-SHA256)'}
                  </strong>
                </div>

                <div className="p-3 rounded bg-card border border-border">
                  <span className="text-xs font-mono text-muted-foreground uppercase block mb-1">
                    Payload Encryption
                  </span>
                  <strong className="text-foreground">Disabled (Unencrypted JSON Mode)</strong>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* VARIABLES TAB */}
          <TabsContent value="variables" className="mt-3 flex-1 overflow-y-auto">
            <div className="p-4 rounded-md bg-card border border-border space-y-3 text-xs">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Braces size={16} />
                <span>Detected Request Variables</span>
              </div>

              {detectedVariables.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No <code className="text-primary font-mono">{'{{var}}'}</code> placeholders detected. Use variables like <code className="text-primary font-mono">{'{{orderId}}'}</code> in the URL, query parameters, or body.
                </p>
              ) : (
                <div className="border border-border rounded overflow-x-auto bg-background">
                  <table className="w-full min-w-[560px] text-xs text-left font-mono">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-xs border-b border-border">
                      <tr>
                        <th className="p-2">Variable Token</th>
                        <th className="p-2">Resolution Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detectedVariables.map((v) => (
                        <tr key={v}>
                          <td className="p-2 text-primary font-semibold">{'{{'}{v}{'}}'}</td>
                          <td className="p-2 text-muted-foreground font-sans">
                            {['timestamp', 'uuid', 'randomOrderId'].includes(v)
                              ? 'Built-in dynamic generator'
                              : 'Resolved from Environment Variables Workspace'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
