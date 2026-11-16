'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Archive,
  Pencil,
  Send,
  Loader2,
  Code2,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Braces,
  Trash2,
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
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { autoRefreshPayloadIdentifiers } from '@/lib/variables/resolver';
import {
  suggestVariables,
  getAutocompleteContext,
  type Suggestion,
  type VariableKeyInfo,
} from '@/lib/variables/suggest';
export type { VariableKeyInfo };
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
import type { DraftSaveStatus } from '@/hooks/use-draft-autosave';
import { environmentLabel } from '@/lib/environment-label';

interface WorkbenchProps {
  countrySlug: string;
  environment: string;
  name: string;

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
  /** Auto-save draft indicator state (silent workbench draft, separate from Save to Collection). */
  draftSaveStatus?: DraftSaveStatus;
  /** Local HH:MM label for the last successful auto-save. */
  draftSavedLabel?: string | null;
  /** User variable keys for {{var}} autocomplete (keys + isSecret flags only — never values). */
  variableKeys?: VariableKeyInfo[];
}

export function Workbench({
  countrySlug,
  environment,
  name,

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
  draftSaveStatus = 'idle',
  draftSavedLabel = null,
  variableKeys = [],
}: WorkbenchProps) {
  const [jsonError, setJsonError] = useState('');
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [requestTab, setRequestTab] = useState('body');

  // Every newly opened API starts on its payload instead of preserving the
  // tab selected for the previous request.
  useEffect(() => {
    setRequestTab('body');
  }, [countrySlug, environment, name]);

  const currentEnvConfig = config?.[countrySlug]?.[environment];
  const baseUrl = currentEnvConfig?.hostname
    ? `https://${currentEnvConfig.hostname}`
    : 'https://api.assanpay.com';
  const isStatusInquiry = url.includes('/status-inquiry') || requiresSignature === false;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bodyContainerRef = useRef<HTMLDivElement>(null);

  // ---- {{variable}} autocomplete (URL input + body editor) ----
  const urlInputRef = useRef<HTMLInputElement>(null);
  const suggestDropdownRef = useRef<HTMLDivElement>(null);
  const [varAutocomplete, setVarAutocomplete] = useState<{
    field: 'url' | 'body';
    start: number;
    partial: string;
    activeIndex: number;
    rect: { top: number; left: number; width: number };
  } | null>(null);

  const autocompleteSuggestions = useMemo(
    () =>
      varAutocomplete
        ? suggestVariables({ keys: variableKeys, partial: varAutocomplete.partial })
        : [],
    [variableKeys, varAutocomplete]
  );

  // Detect an open `{{partial` context at the caret; opens/updates the dropdown.
  // Dismisses when the context closes: `}}` typed, invalid char, caret moved away.
  const updateVariableAutocomplete = (
    field: 'url' | 'body',
    text: string,
    caret: number | null,
    el: HTMLElement | null
  ) => {
    const ctx =
      caret === null || caret === undefined ? null : getAutocompleteContext(text, caret);
    setVarAutocomplete((prev) => {
      if (!ctx) return null;
      // Preserve keyboard position while the partial is unchanged (e.g. arrow keys).
      const kept = prev && prev.field === field && prev.partial === ctx.partial ? prev : null;
      let rect = kept?.rect;
      const r = el?.getBoundingClientRect();
      if (r) {
        const width = Math.min(r.width, 320);
        const maxLeft =
          (typeof window !== 'undefined' ? window.innerWidth : 1280) - width - 8;
        rect = {
          // URL: below the field. Body: at the top of the editor (dropdown is fixed).
          top: field === 'body' ? r.top + 8 : r.bottom + 4,
          left: Math.max(8, Math.min(r.left, maxLeft)),
          width,
        };
      }
      if (!rect) return null;
      return {
        field,
        start: ctx.start,
        partial: ctx.partial,
        activeIndex: kept?.activeIndex ?? 0,
        rect,
      };
    });
  };

  // Replace `{{partial` with `{{key}}` and place the caret after `}}`.
  const acceptVariableSuggestion = (suggestion: Suggestion) => {
    const ac = varAutocomplete;
    if (!ac) return;
    const isUrl = ac.field === 'url';
    const text = isUrl ? url : body;
    const el = isUrl ? urlInputRef.current : textareaRef.current;
    const caret = el?.selectionStart ?? text.length;
    const inserted = `{{${suggestion.key}}}`;
    const next = text.slice(0, ac.start) + inserted + text.slice(caret);
    if (isUrl) {
      onUrlChange(next);
    } else {
      onBodyChange(next);
      if (jsonError) setJsonError('');
    }
    setVarAutocomplete(null);
    requestAnimationFrame(() => {
      const target = isUrl ? urlInputRef.current : textareaRef.current;
      if (target) {
        target.focus();
        const pos = ac.start + inserted.length;
        target.setSelectionRange(pos, pos);
      }
    });
  };

  // Keyboard for the autocomplete dropdown. Returns true when the key was consumed.
  const handleVariableAutocompleteKeyDown = (
    e: React.KeyboardEvent,
    field: 'url' | 'body'
  ): boolean => {
    if (!varAutocomplete || varAutocomplete.field !== field) return false;
    const items = autocompleteSuggestions;
    if (items.length === 0) return false;
    const activeIdx = Math.min(varAutocomplete.activeIndex, items.length - 1);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setVarAutocomplete((prev) => {
        if (!prev) return prev;
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        return { ...prev, activeIndex: (activeIdx + dir + items.length) % items.length };
      });
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (e.ctrlKey || e.metaKey) return false; // Ctrl+Enter still sends the request
      e.preventDefault();
      acceptVariableSuggestion(items[activeIdx]);
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setVarAutocomplete(null);
      return true;
    }
    return false;
  };

  // Keep the keyboard-active row visible inside the dropdown
  useEffect(() => {
    if (!varAutocomplete) return;
    suggestDropdownRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [varAutocomplete]);

  // The dropdown is fixed-positioned: dismiss when the layout scrolls/resizes
  useEffect(() => {
    if (!varAutocomplete) return;
    const close = () => setVarAutocomplete(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [varAutocomplete]);

  // When virtual keyboard opens on mobile, scroll body container into view so it appears above keyboard
  const handleTextareaFocus = () => {
    setTimeout(() => {
      if (bodyContainerRef.current) {
        bodyContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (textareaRef.current) {
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 300);
  };

  // Auto-regenerate fresh orderId & branchCode in body
  const handleRegenerateOrderId = () => {
    const updated = autoRefreshPayloadIdentifiers(body, { forceRefreshOrderId: true });
    if (updated !== body) {
      onBodyChange(updated);
    }
  };

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
          'BODY_HASH=$(printf "%s" "$BODY" | openssl dgst -sha256 | awk "{print \$2}")',
          'CANONICAL=$(printf "%s\n%s\n%s\n%s\n%s" "$METHOD" "$PATH_WITH_QUERY" "$TIMESTAMP" "$NONCE" "$BODY_HASH")',
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
        return 'text-[var(--method-get)]';
      case 'POST':
        return 'text-[var(--method-post)]';
      case 'PUT':
        return 'text-[var(--method-put)]';
      case 'PATCH':
        return 'text-[var(--method-patch)]';
      case 'DELETE':
        return 'text-[var(--method-delete)]';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <section className="h-full flex flex-col min-w-0" style={{ background: 'var(--workbench-bg)' }}>
      {/* Top Workspace Tab Strip & Save Toolbar */}
      <div className="min-h-[72px] px-2.5 sm:px-3 py-2 border-b border-[var(--border)] flex items-center justify-between gap-2.5 sm:gap-3 shrink-0" style={{ background: 'var(--surface-1)' }}>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/80 bg-card px-2.5 sm:px-3 py-2 shadow-[0_3px_12px_rgba(15,45,82,0.05)]">
          {sidebarCollapsed && onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer shrink-0 -ml-1 transition-colors"
              title="Open Collections Sidebar"
            >
              <PanelLeftOpen size={13} />
            </Button>
          )}

          <span className="hidden min-[440px]:flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileJson size={16} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`method-badge ${method.toLowerCase()}`}>{method}</span>
              <h1 className="min-w-0 truncate text-sm sm:text-[15px] font-bold leading-tight tracking-[-0.01em] text-foreground" title={name}>{name}</h1>
              {dirty && <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" title="Unsaved changes" />}
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
              <span className="truncate">{countrySlug.toUpperCase()} market</span>
              <span className="size-1 shrink-0 rounded-full bg-border-strong" />
              <span className="truncate">{environmentLabel(environment)}</span>
            </div>
          </div>
        </div>

        {/* State Tags & Save Action */}
        <div className="flex items-center gap-2 shrink-0">
          {savedMessage && (
            <span className="hidden 2xl:flex items-center gap-1 text-xs text-success font-mono animate-fade-in">
              <CheckCircle2 size={12} />
              {savedMessage}
            </span>
          )}
          {loadedHistoryId && (
            <span className="hidden 2xl:flex items-center gap-1 text-xs text-primary font-mono animate-fade-in">
              <RotateCcw size={11} />
              Snapshot
            </span>
          )}

          {/* Silent workbench-draft auto-save indicator (independent of Save to Collection) */}
          {draftSaveStatus === 'saving' && (
            <span className="hidden 2xl:flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Loader2 size={12} className="spin" />
              Saving…
            </span>
          )}
          {draftSaveStatus === 'saved' && draftSavedLabel && (
            <span className="hidden 2xl:flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Check size={12} />
              Auto-saved · {draftSavedLabel}
            </span>
          )}
          {draftSaveStatus === 'failed' && (
            <span
              className="hidden 2xl:flex items-center gap-1 text-xs text-muted-foreground font-mono"
              title="Draft save failed — will retry on the next edit"
            >
              Save failed
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={saving || !name.trim() || !url.trim()}
            className="h-10 min-w-10 px-2.5 sm:px-3 rounded-xl border-[var(--border)] text-secondary-foreground text-sm font-semibold gap-2 cursor-pointer shadow-[0_2px_8px_rgba(15,45,82,0.05)] transition-colors hover:text-primary hover:border-[var(--primary)]/40 bg-card"
            title="Save Request to Collection (Ctrl+S)"
          >
            {saving ? <Loader2 size={12} className="spin" /> : <Save size={12} />}
            <span className="hidden min-[420px]:inline">Save</span>
            <kbd className="text-[11px] font-mono text-muted-foreground hidden 2xl:inline ml-0.5">Ctrl S</kbd>
          </Button>
        </div>
      </div>

      {/* Request Bar — STICKY, always visible above keyboard */}
      <div className="shrink-0 px-3 sm:px-5 pt-4 sm:pt-5 pb-3 space-y-3" style={{ background: 'var(--workbench-bg)' }}>

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
                className={`!h-12 w-[104px] shrink-0 self-stretch rounded-none border-0 bg-transparent px-3.5 py-0 font-sans text-sm font-semibold leading-none tracking-[0.04em] shadow-none transition-colors cursor-pointer focus:ring-0 sm:w-[116px] [&_[data-slot=select-value]]:h-full [&_[data-slot=select-value]]:items-center [&>svg:last-child]:self-center ${getMethodColorClass(method)}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                sideOffset={6}
                className="w-[148px] rounded-2xl border border-border/90 p-1.5 font-sans text-sm font-semibold shadow-[0_14px_32px_-10px_rgba(15,23,42,0.24),0_4px_10px_-4px_rgba(15,23,42,0.12)]"
                style={{ background: 'var(--surface-1)' }}
              >
                <SelectItem value="GET" className="h-9 cursor-pointer rounded-xl py-0 pl-3 pr-8 font-mono text-xs font-bold tracking-[0.03em] text-[var(--method-get)] hover:bg-emerald-50 focus:bg-emerald-50 data-selected:bg-emerald-50 dark:hover:bg-emerald-950/35 dark:focus:bg-emerald-950/35 dark:data-selected:bg-emerald-950/35">
                  GET
                </SelectItem>
                <SelectItem value="POST" className="h-9 cursor-pointer rounded-xl py-0 pl-3 pr-8 font-mono text-xs font-bold tracking-[0.03em] text-[var(--method-post)] hover:bg-orange-50 focus:bg-orange-50 data-selected:bg-orange-50 dark:hover:bg-orange-950/35 dark:focus:bg-orange-950/35 dark:data-selected:bg-orange-950/35">
                  POST
                </SelectItem>
                <SelectItem value="PUT" className="h-9 cursor-pointer rounded-xl py-0 pl-3 pr-8 font-mono text-xs font-bold tracking-[0.03em] text-[var(--method-put)] hover:bg-blue-50 focus:bg-blue-50 data-selected:bg-blue-50 dark:hover:bg-blue-950/35 dark:focus:bg-blue-950/35 dark:data-selected:bg-blue-950/35">
                  PUT
                </SelectItem>
                <SelectItem value="PATCH" className="h-9 cursor-pointer rounded-xl py-0 pl-3 pr-8 font-mono text-xs font-bold tracking-[0.03em] text-[var(--method-patch)] hover:bg-violet-50 focus:bg-violet-50 data-selected:bg-violet-50 dark:hover:bg-violet-950/35 dark:focus:bg-violet-950/35 dark:data-selected:bg-violet-950/35">
                  PATCH
                </SelectItem>
                <SelectItem value="DELETE" className="h-9 cursor-pointer rounded-xl py-0 pl-3 pr-8 font-mono text-xs font-bold tracking-[0.03em] text-[var(--method-delete)] hover:bg-red-50 focus:bg-red-50 data-selected:bg-red-50 dark:hover:bg-red-950/35 dark:focus:bg-red-950/35 dark:data-selected:bg-red-950/35">
                  DELETE
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Divider */}
            <div className="w-px self-stretch my-2 shrink-0" style={{ background: 'var(--border)' }} />

            {/* URL Composer */}
            <div className="flex-1 flex items-center min-w-0">
              <div
                className="hidden 2xl:flex items-center gap-1.5 pl-3 h-full text-muted-foreground font-mono text-[11px] select-none shrink-0"
              >
                <Lock size={10} className="text-success" />
                <span className="text-muted-foreground">{baseUrl}</span>
              </div>
              <input
                ref={urlInputRef}
                value={url}
                onChange={(e) => {
                  onUrlChange(e.target.value);
                  updateVariableAutocomplete(
                    'url',
                    e.target.value,
                    e.currentTarget.selectionStart,
                    e.currentTarget
                  );
                }}
                onClick={(e) => {
                  updateVariableAutocomplete(
                    'url',
                    e.currentTarget.value,
                    e.currentTarget.selectionStart,
                    e.currentTarget
                  );
                }}
                onKeyUp={(e) => {
                  updateVariableAutocomplete(
                    'url',
                    e.currentTarget.value,
                    e.currentTarget.selectionStart,
                    e.currentTarget
                  );
                }}
                onBlur={() => setVarAutocomplete(null)}
                onFocus={(e) => {
                  setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
                }}
                onKeyDown={(e) => {
                  if (handleVariableAutocompleteKeyDown(e, 'url')) return;
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder="/api/payments/p2p/submit"
                className="flex-1 h-12 sm:h-full px-3 bg-transparent text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground/60 min-w-0"
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
              className="hidden sm:flex items-center gap-1.5 px-4 min-h-12 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-sm font-medium"
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
              className="btn-postman-send flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-7 h-12 sm:h-auto font-semibold text-sm cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{running ? 'Sending…' : 'Send'}</span>
              {!running && <kbd className="hidden 2xl:inline text-[10px] font-mono opacity-70 bg-black/15 px-1.5 py-0.5 rounded">Ctrl ↵</kbd>}
            </button>
          </div>
        </div>

      </div>

      {/* Scrollable Tabs Area — only this part scrolls */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 sm:px-5 pb-64 sm:pb-6 overscroll-y-contain">

        {/* Postman-Grade Request Tabs */}
        <Tabs value={requestTab} onValueChange={setRequestTab} className="flex flex-col min-w-0 pt-1">
          <TabsList
            variant="line"
            className="console-scroll-tabs w-full max-w-full min-w-0 justify-start rounded-xl border border-border/80 bg-[var(--surface-2)] p-1.5 h-auto gap-1.5 overflow-x-auto overflow-y-hidden shrink-0 shadow-[0_8px_24px_rgba(15,45,82,0.05)]"
          >
            <TabsTrigger
              value="body"
              className="group/request-tab min-h-10 rounded-lg border border-transparent px-3 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground font-semibold hover:text-foreground hover:bg-background/70 data-active:border-primary/20 data-active:bg-background data-active:text-primary data-active:shadow-[0_3px_12px_rgba(2,101,210,0.12)] cursor-pointer shrink-0 after:hidden"
            >
              <Braces className="size-3.5 text-muted-foreground group-data-active/request-tab:text-primary" />
              <span>Body</span>
              {method !== 'GET' && (
                <span className="rounded-md bg-[#e8f2ff] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-primary">JSON</span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="headers"
              className="group/request-tab min-h-10 rounded-lg border border-transparent px-3 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground font-semibold hover:text-foreground hover:bg-background/70 data-active:border-primary/20 data-active:bg-background data-active:text-primary data-active:shadow-[0_3px_12px_rgba(2,101,210,0.12)] cursor-pointer shrink-0 after:hidden"
            >
              <ListChecks className="size-3.5 text-muted-foreground group-data-active/request-tab:text-primary" />
              <span>Headers</span>
              <span className="min-w-5 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-primary">
                {headerRows.filter((h) => h.enabled && h.key).length + (isStatusInquiry ? 2 : 4)}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="signing"
              className="group/request-tab min-h-10 rounded-lg border border-transparent px-3 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground font-semibold hover:text-foreground hover:bg-background/70 data-active:border-primary/20 data-active:bg-background data-active:text-primary data-active:shadow-[0_3px_12px_rgba(2,101,210,0.12)] cursor-pointer shrink-0 after:hidden"
            >
              <ShieldCheck className="size-3.5 text-muted-foreground group-data-active/request-tab:text-primary" />
              <span>Signing Details</span>
              <span className="hidden sm:inline rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-emerald-700">HMAC</span>
            </TabsTrigger>
          </TabsList>

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

          </TabsContent>

          {/* BODY TAB */}
          <TabsContent value="body" className="mt-2.5 flex flex-col">
            <div
              ref={bodyContainerRef}
              className="flex flex-col border border-border rounded-xl overflow-hidden min-h-[320px] sm:min-h-[360px]"
              style={{ background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
            >
              {/* Code Editor Toolbar — subtle, integrated */}
              <div
                className="min-h-[36px] px-2.5 sm:px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-1.5 text-xs text-muted-foreground shrink-0 select-none overflow-x-auto"
                style={{ background: 'var(--surface-2)' }}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[11px] min-w-0 shrink-0">
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
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleRegenerateOrderId}
                      className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary-hover px-1.5 sm:px-2 py-1 rounded-md hover:bg-primary/10 transition-colors cursor-pointer whitespace-nowrap"
                      title="Auto-generate fresh unique orderId & apply env branchCode"
                    >
                      <RotateCcw size={11} />
                      <span className="hidden xs:inline">New Order ID</span>
                      <span className="xs:hidden">New ID</span>
                    </button>

                    <button
                      onClick={handleBeautify}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary px-1.5 sm:px-2 py-1 rounded-md hover:bg-primary/10 transition-colors cursor-pointer"
                      title="Format & indent JSON"
                    >
                      <Sparkles size={11} />
                      <span>Format</span>
                    </button>

                    <button
                      onClick={handleMinify}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-1.5 sm:px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer hidden sm:flex"
                      title="Minify JSON payload"
                    >
                      <span>Minify</span>
                    </button>

                    <button
                      onClick={handleCopyBody}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-1.5 sm:px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                      title="Copy Body"
                    >
                      {copiedBody ? <CheckCircle2 size={11} className="text-success" /> : <Copy size={11} />}
                      <span className="hidden sm:inline">{copiedBody ? 'Copied' : 'Copy'}</span>
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
              <div className="flex h-[260px] sm:h-[300px] overflow-hidden" style={{ background: 'var(--surface-1)' }}>
                {/* Gutter Line Numbers */}
                <div className="w-8 sm:w-10 border-r border-border/50 py-2.5 sm:py-3 pr-1.5 sm:pr-2 text-right select-none font-mono text-[10px] sm:text-[11px] text-muted-foreground/50 leading-[1.65] shrink-0" style={{ background: 'var(--surface-1)' }}>
                  {lineNumbers.map((num) => (
                    <div key={num}>{num}</div>
                  ))}
                </div>

                {/* Textarea */}
                <Textarea
                  ref={textareaRef}
                  value={body}
                  onFocus={handleTextareaFocus}
                  onChange={(e) => {
                    onBodyChange(e.target.value);
                    if (jsonError) setJsonError('');
                    updateVariableAutocomplete(
                      'body',
                      e.target.value,
                      e.currentTarget.selectionStart,
                      e.currentTarget
                    );
                  }}
                  onClick={(e) => {
                    updateVariableAutocomplete(
                      'body',
                      e.currentTarget.value,
                      e.currentTarget.selectionStart,
                      e.currentTarget
                    );
                  }}
                  onKeyUp={(e) => {
                    updateVariableAutocomplete(
                      'body',
                      e.currentTarget.value,
                      e.currentTarget.selectionStart,
                      e.currentTarget
                    );
                  }}
                  onBlur={() => setVarAutocomplete(null)}
                  onKeyDown={(e) => {
                    if (handleVariableAutocompleteKeyDown(e, 'body')) return;
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  className="flex-1 w-full resize-none rounded-none border-0 font-mono text-xs sm:text-[13px] leading-relaxed shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50 selection:bg-primary/25 p-2.5 sm:p-3"
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
        </Tabs>
      </div>

      {/* {{variable}} autocomplete dropdown — fixed under the field, portaled out of clipped containers */}
      {varAutocomplete &&
        autocompleteSuggestions.length > 0 &&
        createPortal(
          <div
            ref={suggestDropdownRef}
            role="listbox"
            aria-label="Variable suggestions"
            className="fixed z-[80] rounded-lg border border-border shadow-[var(--shadow-lift)]"
            style={{
              top: varAutocomplete.rect.top,
              left: varAutocomplete.rect.left,
              width: varAutocomplete.rect.width,
              background: 'var(--surface-1)',
            }}
          >
            <div className="max-h-60 overflow-auto p-1">
              {autocompleteSuggestions.map((s, i) => {
                const active =
                  i === Math.min(varAutocomplete.activeIndex, autocompleteSuggestions.length - 1);
                return (
                  <button
                    key={`${s.builtin ? 'builtin' : 'user'}:${s.key}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-active={active ? 'true' : undefined}
                    onMouseDown={(e) => {
                      // preventDefault keeps input focus so the click registers before blur
                      e.preventDefault();
                      acceptVariableSuggestion(s);
                    }}
                    onMouseEnter={() =>
                      setVarAutocomplete((prev) => (prev ? { ...prev, activeIndex: i } : prev))
                    }
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left cursor-pointer transition-colors duration-150 ${
                      active ? 'bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-mono text-xs text-foreground truncate flex-1">
                      {s.key}
                    </span>
                    {s.isSecret && (
                      <Lock
                        size={12}
                        className="text-muted-foreground shrink-0"
                        aria-label="Secret variable"
                      />
                    )}
                    {s.builtin && (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground/60 shrink-0">
                        built-in
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}

