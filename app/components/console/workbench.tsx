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
  onNewRequest?: () => void;
  onCloseRequest?: () => void;
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
  onNewRequest,
  onCloseRequest,
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
        return 'text-sky-400';
      case 'POST':
        return 'text-amber-400';
      case 'PUT':
        return 'text-indigo-400';
      case 'PATCH':
        return 'text-purple-400';
      case 'DELETE':
        return 'text-rose-400';
      default:
        return 'text-amber-400';
    }
  };

  return (
    <section className="h-full flex flex-col min-w-0 select-none" style={{ background: 'var(--workbench-bg)' }}>
      {/* Top Workspace Tab Strip & Save Toolbar */}
      <div className="min-h-[42px] px-2 sm:px-3 border-b border-[var(--border)] flex items-center justify-between gap-2 shrink-0 inset-shadow" style={{ background: 'var(--surface-2)' }}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {sidebarCollapsed && onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-[var(--surface-5)] cursor-pointer shrink-0 -ml-1 mr-1 transition-colors"
              title="Open Collections Sidebar"
            >
              <PanelLeftOpen size={13} />
            </Button>
          )}

          <div className="h-9 flex items-center gap-1.5 sm:gap-2 px-2.5 border-x border-[var(--border)] min-w-0 max-w-md rounded-none" style={{ background: 'var(--surface-4)' }}>
            <span className={`method-badge ${method.toLowerCase()}`}>{method}</span>
            <span className="text-[10px] font-mono text-slate-600 uppercase shrink-0 tracking-wider">
              {countrySlug}
            </span>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Request Name"
              className="text-sm font-medium text-slate-200 bg-transparent outline-none border-b border-transparent focus:border-[var(--primary)] truncate min-w-0 w-24 sm:w-44 md:w-56 transition-colors"
              title="Click to rename request"
            />
            {dirty && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 status-dot-live"
                title="Unsaved changes"
              />
            )}
            {onCloseRequest && (
              <button type="button" onClick={onCloseRequest} className="w-5 h-5 grid place-items-center rounded text-slate-500 hover:text-slate-200 hover:bg-[var(--surface-5)] transition-colors" title="Close" aria-label="Close request tab"><X size={12} /></button>
            )}
          </div>
          {onNewRequest && (
            <button type="button" onClick={onNewRequest} className="w-6 h-6 grid place-items-center rounded text-slate-500 hover:text-slate-200 hover:bg-[var(--surface-5)] transition-colors" title="New request tab" aria-label="New request tab"><Plus size={13} /></button>
          )}
        </div>

        {/* State Tags & Save Action */}
        <div className="flex items-center gap-2 shrink-0">
          {savedMessage && (
            <span className="hidden md:flex items-center gap-1 text-[10.5px] text-emerald-400 font-mono animate-fade-in">
              <CheckCircle2 size={12} />
              {savedMessage}
            </span>
          )}
          {loadedHistoryId && (
            <span className="hidden md:flex items-center gap-1 text-[10.5px] text-sky-400 font-mono animate-fade-in">
              <RotateCcw size={11} />
              Snapshot
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={saving || !name.trim() || !url.trim()}
            className="h-7 px-2.5 border-[var(--border)] text-slate-300 text-xs font-medium gap-1.5 cursor-pointer shadow-none transition-all hover:text-slate-100 hover:border-[var(--primary)]/40"
            style={{ background: 'var(--surface-4)' }}
            title="Save Request to Collection (Ctrl+S)"
          >
            {saving ? <Loader2 size={12} className="spin" /> : <Save size={12} />}
            <span>Save</span>
            <kbd className="text-[9px] font-mono text-slate-600 hidden sm:inline ml-0.5">Ctrl S</kbd>
          </Button>
        </div>
      </div>

      {/* Main Request Work Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 sm:px-4 lg:px-5 py-4 space-y-3.5">

        {/* Unified Request Bar */}
        <div className="grid grid-cols-[84px_minmax(0,1fr)_auto] sm:grid-cols-[95px_minmax(0,1fr)_auto_auto] items-center gap-2">
          {/* Method Selector */}
          <Select
            value={method}
            onValueChange={(val) => {
              if (val) onMethodChange(val as Method);
            }}
          >
            <SelectTrigger
              className={`w-full h-10 font-mono font-bold text-sm shadow-none cursor-pointer border transition-all focus:ring-1 focus:ring-[var(--primary)] ${getMethodColorClass(method)}`}
              style={{ background: 'var(--surface-4)', borderColor: 'var(--border)' }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs font-mono font-bold" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <SelectItem value="GET" className="text-sky-400">GET</SelectItem>
              <SelectItem value="POST" className="text-amber-400">POST</SelectItem>
              <SelectItem value="PUT" className="text-indigo-400">PUT</SelectItem>
              <SelectItem value="PATCH" className="text-purple-400">PATCH</SelectItem>
              <SelectItem value="DELETE" className="text-rose-400">DELETE</SelectItem>
            </SelectContent>
          </Select>

          {/* URL Composer */}
          <div
            className="flex-1 flex items-center h-10 border rounded overflow-hidden transition-all duration-150 focus-within:ring-1 focus-within:ring-[var(--primary)]/60 focus-within:border-[var(--primary)]/60"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
          >
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 h-full border-r text-slate-500 font-mono text-[11px] select-none shrink-0"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <Lock size={10} className="text-emerald-500" />
              <span className="text-slate-500">{baseUrl}</span>
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
              className="flex-1 h-full px-3 bg-transparent text-[13px] font-mono text-slate-100 outline-none placeholder:text-slate-700"
              spellCheck={false}
            />
            {detectedVariables.length > 0 && (
              <span className="mr-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40 shrink-0">
                {detectedVariables.length} var{detectedVariables.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* cURL Copy Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyCurl}
            className="hidden sm:inline-flex h-10 px-3 text-slate-400 text-sm gap-1.5 shrink-0 cursor-pointer shadow-none transition-all hover:text-slate-200 border-[var(--border)] hover:border-[var(--border)]"
            style={{ background: 'var(--surface-4)' }}
            title="Copy as cURL"
          >
            {copiedCurl ? (
              <Check size={13} className="text-emerald-400" />
            ) : (
              <Terminal size={13} />
            )}
            <span className="hidden sm:inline text-[11px]">
              {copiedCurl ? 'Copied!' : 'cURL'}
            </span>
          </Button>

          {/* Send Button */}
          <Button
            onClick={onSend}
            disabled={running || !url.trim()}
            className="h-10 px-4 sm:px-5 text-white font-semibold text-sm flex items-center gap-2 shrink-0 cursor-pointer transition-all btn-glow"
            style={{
              background: running ? 'var(--surface-4)' : 'linear-gradient(135deg, #4a7de0 0%, #5b8def 50%, #6a99f2 100%)',
              boxShadow: running ? 'none' : '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            {running ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
            <span>{running ? 'Sending…' : 'Send'}</span>
            {!running && <kbd className="hidden sm:inline text-[9px] font-mono opacity-60 ml-0.5">Ctrl ↵</kbd>}
          </Button>
        </div>

        {/* Security Strip */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 px-0.5 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={11} className={isStatusInquiry ? 'text-amber-400' : 'text-emerald-500'} />
              <span className={isStatusInquiry ? 'text-amber-400/80' : 'text-emerald-500/80'}>
                {isStatusInquiry ? 'HMAC Exempt' : 'HMAC-SHA256 Signed'}
              </span>
            </span>
            <span className="text-slate-700">·</span>
            <span>Plaintext JSON</span>
          </div>
          <span className="text-[10px]">
            Press <kbd className="text-slate-500 font-mono bg-[var(--surface-4)] px-1 py-0.5 rounded text-[9px]">Ctrl+Enter</kbd> to send
          </span>
        </div>

        {/* Postman-Grade Request Tabs */}
        <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0 pt-1">
          <TabsList variant="line" className="bg-transparent border-b border-[#222734] justify-start rounded-none p-0 h-auto gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden shrink-0">
            <TabsTrigger
              value="params"
              className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-white data-active:bg-transparent text-xs sm:text-sm py-2 px-1 text-slate-400 font-medium hover:text-slate-200 transition-colors cursor-pointer shadow-none"
            >
              <span>Params</span>
              {paramRows.filter((p) => p.enabled && p.key).length > 0 && (
                <span className="font-mono text-[10px] font-bold text-sky-400 ml-1">
                  ({paramRows.filter((p) => p.enabled && p.key).length})
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="headers"
              className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-white data-active:bg-transparent text-xs sm:text-sm py-2 px-1 text-slate-400 font-medium hover:text-slate-200 transition-colors cursor-pointer shadow-none"
            >
              <span>Headers</span>
              <span className="font-mono text-[10px] text-slate-500 ml-1">
                ({headerRows.filter((h) => h.enabled && h.key).length + (isStatusInquiry ? 2 : 4)})
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="body"
              className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-white data-active:bg-transparent text-xs sm:text-sm py-2 px-1 text-slate-400 font-medium hover:text-slate-200 transition-colors cursor-pointer shadow-none"
            >
              <span>Body</span>
              {method !== 'GET' && (
                <span className="text-[10px] text-emerald-400 font-mono ml-1">JSON</span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="signing"
              className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-white data-active:bg-transparent text-xs sm:text-sm py-2 px-1 text-slate-400 font-medium hover:text-slate-200 transition-colors cursor-pointer shadow-none"
            >
              <span>Signing Details</span>
            </TabsTrigger>

            <TabsTrigger
              value="variables"
              className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-white data-active:bg-transparent text-xs sm:text-sm py-2 px-1 text-slate-400 font-medium hover:text-slate-200 transition-colors cursor-pointer shadow-none"
            >
              <span>Variables</span>
              {detectedVariables.length > 0 && (
                <span className="font-mono text-[10px] font-bold text-amber-400 ml-1">
                  ({detectedVariables.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* PARAMS TAB */}
          <TabsContent value="params" className="mt-3 flex-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Query Parameters
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={addParamRow}
                className="h-7 text-xs text-sky-400 hover:text-sky-300 hover:bg-[#121927] gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Row</span>
              </Button>
            </div>

            <div className="border border-[#1a2336] rounded-md overflow-x-auto bg-[#0b0f17]">
              <table className="w-full min-w-[640px] text-xs text-left">
                <thead className="bg-[#101624] text-slate-400 font-mono uppercase text-[10px] border-b border-[#1a2336]">
                  <tr>
                    <th className="w-8 p-2 text-center">✓</th>
                    <th className="p-2 w-1/3">Key</th>
                    <th className="p-2 w-1/2">Value</th>
                    <th className="w-9 p-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2336] font-mono">
                  {paramRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 font-sans text-xs">
                        No query parameters configured. Click &quot;Add Row&quot; or type query parameters directly in the URL path.
                      </td>
                    </tr>
                  ) : (
                    paramRows.map((row) => (
                      <tr key={row.id} className="hover:bg-[#101726]/60">
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) => updateParamRow(row.id, 'enabled', e.target.checked)}
                            className="rounded border-[#26354d] bg-[#0d121c] text-sky-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={row.key}
                            onChange={(e) => updateParamRow(row.id, 'key', e.target.value)}
                            placeholder="Key"
                            className="w-full bg-transparent px-2 py-1 outline-none text-slate-200 placeholder:text-slate-600 font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={row.value}
                            onChange={(e) => updateParamRow(row.id, 'value', e.target.value)}
                            placeholder="Value"
                            className="w-full bg-transparent px-2 py-1 outline-none text-slate-200 placeholder:text-slate-600 font-mono text-xs"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            onClick={() => deleteParamRow(row.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
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
            <div className="p-3 rounded-md bg-[#0d131f] border border-[#1a2336] text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sky-300 font-semibold">
                  <KeyRound size={14} />
                  <span>Outbound Security Headers (Auto-injected by Server)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyGeneratedHeaders}
                  className="h-6 text-[11px] text-slate-400 hover:text-sky-400 gap-1 cursor-pointer"
                >
                  {copiedHeaders ? (
                    <CheckCircle2 size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedHeaders ? 'Copied' : 'Copy Preview'}</span>
                </Button>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between p-1.5 rounded bg-[#080b11] border border-[#162032]">
                  <span className="text-slate-400">X-API-KEY</span>
                  <span className="text-emerald-400">•••••••• (Injected safely from environment vault)</span>
                </div>

                {!isStatusInquiry ? (
                  <>
                    <div className="flex items-center justify-between p-1.5 rounded bg-[#080b11] border border-[#162032]">
                      <span className="text-slate-400">X-TIMESTAMP</span>
                      <span className="text-sky-400">[Canonical Epoch Timestamp (ms)]</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-[#080b11] border border-[#162032]">
                      <span className="text-slate-400">X-NONCE</span>
                      <span className="text-sky-400">[Cryptographic Nonce (UUID v4)]</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-[#080b11] border border-[#162032]">
                      <span className="text-slate-400">X-SIGNATURE</span>
                      <span className="text-sky-400">[Base64(HMAC-SHA256(canonical, API_SECRET))]</span>
                    </div>
                  </>
                ) : (
                  <div className="p-1.5 rounded bg-sky-950/30 border border-sky-800/40 text-sky-300 text-[11px]">
                    Status Inquiry Spec: Only X-API-KEY is required. HMAC signature headers omitted.
                  </div>
                )}

                <div className="flex items-center justify-between p-1.5 rounded bg-[#080b11] border border-[#162032]">
                  <span className="text-slate-400">Content-Type</span>
                  <span className="text-slate-200">application/json</span>
                </div>
              </div>
            </div>

            {/* Custom Headers Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                  Custom Outbound Headers
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addHeaderRow}
                  className="h-7 text-xs text-sky-400 hover:text-sky-300 hover:bg-[#121927] gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Header</span>
                </Button>
              </div>

              <div className="border border-[#1a2336] rounded-md overflow-x-auto bg-[#0b0f17]">
                <table className="w-full min-w-[640px] text-xs text-left">
                  <thead className="bg-[#101624] text-slate-400 font-mono uppercase text-[10px] border-b border-[#1a2336]">
                    <tr>
                      <th className="w-8 p-2 text-center">✓</th>
                      <th className="p-2 w-1/3">Header Name</th>
                      <th className="p-2 w-1/2">Header Value</th>
                      <th className="w-9 p-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2336] font-mono">
                    {headerRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 font-sans text-xs">
                          No custom headers defined.
                        </td>
                      </tr>
                    ) : (
                      headerRows.map((row) => (
                        <tr key={row.id} className="hover:bg-[#101726]/60">
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={row.enabled}
                              onChange={(e) => updateHeaderRow(row.id, 'enabled', e.target.checked)}
                              className="rounded border-[#26354d] bg-[#0d121c] text-sky-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              value={row.key}
                              onChange={(e) => updateHeaderRow(row.id, 'key', e.target.value)}
                              placeholder="Header name"
                              className="w-full bg-transparent px-2 py-1 outline-none text-slate-200 placeholder:text-slate-600 font-mono text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              value={row.value}
                              onChange={(e) => updateHeaderRow(row.id, 'value', e.target.value)}
                              placeholder="Value"
                              className="w-full bg-transparent px-2 py-1 outline-none text-slate-200 placeholder:text-slate-600 font-mono text-xs"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <button
                              onClick={() => deleteHeaderRow(row.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
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
            <div className="flex-1 flex flex-col border border-[#1c2436] rounded bg-[#0a0d14] overflow-hidden">
              {/* Code Editor Toolbar */}
              <div className="h-7.5 px-3 bg-[#0e121a] border-b border-[#1c2436] flex items-center justify-between text-xs text-slate-400 shrink-0 select-none">
                <div className="flex items-center gap-2 font-mono text-[10.5px]">
                  <Code2 size={12} className="text-slate-400" />
                  <span className="text-slate-300 font-medium">JSON (Raw payload)</span>
                  <span className="text-slate-600">•</span>
                  <span>{body.length} chars</span>
                  <span className="text-slate-600">•</span>
                  <span>{new TextEncoder().encode(body).byteLength} B</span>
                </div>

                {method !== 'GET' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleBeautify}
                      className="flex items-center gap-1 text-[10.5px] font-mono text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded hover:bg-[#141b29] transition-colors cursor-pointer"
                      title="Format & indent JSON"
                    >
                      <Sparkles size={11} />
                      <span>Format</span>
                    </button>

                    <button
                      onClick={handleMinify}
                      className="flex items-center gap-1 text-[10.5px] font-mono text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-[#141b29] transition-colors cursor-pointer"
                      title="Minify JSON payload"
                    >
                      <span>Minify</span>
                    </button>

                    <button
                      onClick={handleCopyBody}
                      className="flex items-center gap-1 text-[10.5px] font-mono text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-[#141b29] transition-colors cursor-pointer"
                      title="Copy Body"
                    >
                      {copiedBody ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedBody ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => onBodyChange('')}
                      className="flex items-center gap-1 text-[10.5px] font-mono text-slate-500 hover:text-rose-400 px-1.5 py-0.5 rounded hover:bg-[#141b29] transition-colors cursor-pointer"
                      title="Clear Body"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>

              {/* JSON Error Notification */}
              {jsonError && (
                <div className="p-2 bg-rose-950/70 border-b border-rose-800/80 text-rose-300 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-rose-400 shrink-0" />
                    <span>JSON Parse Error: {jsonError}</span>
                  </div>
                  <button
                    onClick={() => setJsonError('')}
                    className="text-rose-400 hover:text-white cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Editor Workspace */}
              <div className="flex-1 flex min-h-[220px] overflow-hidden bg-[#080a10]">
                {/* Gutter Line Numbers */}
                <div className="w-10 bg-[#0a0d14] border-r border-[#1a2130] py-2.5 pr-2 text-right select-none font-mono text-[11px] text-slate-500 leading-[1.65]">
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
                  className="flex-1 h-full w-full resize-none rounded-none border-0 font-mono text-xs leading-relaxed shadow-none focus-visible:ring-0 bg-[#080a10] text-slate-100 placeholder:text-slate-600 focus:bg-[#080a10] selection:bg-sky-900/60 p-2.5"
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
            <div className="p-4 rounded-md bg-[#0d131f] border border-[#1a2336] space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck size={16} />
                <span>HMAC-SHA256 Request Signing Pipeline</span>
              </div>

              <p className="text-slate-300 leading-relaxed">
                AssanPay uses canonical request signatures to prevent tampering, replay attacks, and unauthorized transactions.
              </p>

              <div className="p-3 rounded bg-[#080b11] border border-[#1a2336] font-mono text-[11px] text-sky-300 space-y-1">
                <div className="text-slate-500">// Canonical String Format</div>
                <div>METHOD = &quot;{method}&quot;</div>
                <div>PATH = &quot;{url.trim()}&quot;</div>
                <div>TIMESTAMP = EpochMs(Date.now())</div>
                <div>NONCE = crypto.randomUUID()</div>
                <div>BODY_HASH = SHA256(requestBody)</div>
                <div className="text-emerald-400 pt-1">
                  SIGNATURE = Base64(HMAC-SHA256(canonicalString, API_SECRET))
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded bg-[#101726] border border-[#1a2336]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                    Signature Policy
                  </span>
                  <strong className={isStatusInquiry ? 'text-amber-400' : 'text-emerald-400'}>
                    {isStatusInquiry ? 'Exempt (Status Inquiry Spec)' : 'Required (HMAC-SHA256)'}
                  </strong>
                </div>

                <div className="p-3 rounded bg-[#101726] border border-[#1a2336]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                    Payload Encryption
                  </span>
                  <strong className="text-slate-200">Disabled (Unencrypted JSON Mode)</strong>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* VARIABLES TAB */}
          <TabsContent value="variables" className="mt-3 flex-1 overflow-y-auto">
            <div className="p-4 rounded-md bg-[#0d131f] border border-[#1a2336] space-y-3 text-xs">
              <div className="flex items-center gap-2 text-sky-400 font-semibold">
                <Braces size={16} />
                <span>Detected Request Variables</span>
              </div>

              {detectedVariables.length === 0 ? (
                <p className="text-slate-500 text-xs">
                  No <code className="text-sky-300 font-mono">{'{{var}}'}</code> placeholders detected. Use variables like <code className="text-sky-300 font-mono">{'{{orderId}}'}</code> in the URL, query parameters, or body.
                </p>
              ) : (
                <div className="border border-[#1a2336] rounded overflow-x-auto bg-[#080b11]">
                  <table className="w-full min-w-[560px] text-xs text-left font-mono">
                    <thead className="bg-[#101624] text-slate-400 uppercase text-[10px] border-b border-[#1a2336]">
                      <tr>
                        <th className="p-2">Variable Token</th>
                        <th className="p-2">Resolution Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2336]">
                      {detectedVariables.map((v) => (
                        <tr key={v}>
                          <td className="p-2 text-sky-300 font-semibold">{'{{'}{v}{'}}'}</td>
                          <td className="p-2 text-slate-400 font-sans">
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
