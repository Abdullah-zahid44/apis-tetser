'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Webhook,
  ArrowLeft,
  RefreshCw,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Code2,
  X,
  Radio,
  FileJson,
  ListChecks,
  GitBranch,
  Inbox,
  CalendarClock,
  Banknote,
  Hash,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import type { WebhookEventItem } from './types';
import { JsonTree } from './json-tree';

interface CallbackInboxProps {
  countrySlug: string;
  environment: string;
  onRefreshHistory?: () => void;
}

function getPayloadValue(payload: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  }
  return null;
}

function getCallbackSummary(item: WebhookEventItem) {
  const payload = item.payload || {};
  const type = getPayloadValue(payload, ['type', 'eventType', 'mode', 'action']) || 'Webhook event';
  const status = getPayloadValue(payload, ['status', 'paymentStatus', 'statusCode']) || 'Received';
  const amount = getPayloadValue(payload, ['amount', 'receivedAmount', 'paidAmount']);
  const currency = getPayloadValue(payload, ['currency', 'currencyCode']);
  const orderId = getPayloadValue(payload, ['orderId', 'order_id', 'referenceId']);
  return {
    type,
    status,
    orderId,
    amount: amount ? `${currency ? `${currency} ` : ''}${amount}` : '—',
  };
}

export function CallbackInbox({ countrySlug, environment }: CallbackInboxProps) {
  const [callbacks, setCallbacks] = useState<WebhookEventItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<'list' | 'detail'>('list');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'invalid'>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const [payloadSearch, setPayloadSearch] = useState('');
  const [mobileEndpointOpen, setMobileEndpointOpen] = useState(false);
  const [mobileEventDetailsOpen, setMobileEventDetailsOpen] = useState(false);
  const [eventSidebarCollapsed, setEventSidebarCollapsed] = useState(false);
  const fetchRequestIdRef = useRef(0);

  useEffect(() => {
    setPayloadSearch('');
    setMobileEventDetailsOpen(false);
  }, [selectedId]);

  // Compute public callback URL
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const callbackUrl = `${origin}/api/callbacks/assanpay/${countrySlug}`;

  // Clear the previous market synchronously on selection changes so records
  // from the old country never flash while the new feed is loading.
  useEffect(() => {
    fetchRequestIdRef.current += 1;
    setCallbacks([]);
    setSelectedId(null);
    setMobileSection('list');
    setSearch('');
  }, [countrySlug, environment]);

  const fetchCallbacks = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        country: countrySlug,
        environment,
        limit: '50',
      });
      const res = await fetch(`/api/callbacks?${params.toString()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { callbacks?: WebhookEventItem[] };
        if (requestId !== fetchRequestIdRef.current) return;
        const list = data.callbacks || [];
        setCallbacks(list);
        setSelectedId((currentId) =>
          currentId && list.some((item) => item.id === currentId)
            ? currentId
            : list[0]?.id ?? null
        );
      }
    } catch {
      // ignore
    } finally {
      if (requestId === fetchRequestIdRef.current) setLoading(false);
    }
  }, [countrySlug, environment]);

  // Initial load
  useEffect(() => {
    void fetchCallbacks();
  }, [fetchCallbacks]);

  // Auto-refresh interval (every 5 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void fetchCallbacks();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchCallbacks]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  // Filter list
  const filtered = callbacks.filter((item) => {
    if (filterVerified === 'verified' && !item.signatureVerified) return false;
    if (filterVerified === 'invalid' && item.signatureVerified) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.eventId.toLowerCase().includes(q) ||
        item.rawBody.toLowerCase().includes(q) ||
        item.environment.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedItem = callbacks.find((c) => c.id === selectedId) || filtered[0] || null;
  const selectedSummary = selectedItem ? getCallbackSummary(selectedItem) : null;
  const selectedIndex = selectedItem ? filtered.findIndex((item) => item.id === selectedItem.id) : -1;
  const selectAdjacent = (offset: number) => {
    const next = filtered[selectedIndex + offset];
    if (next) setSelectedId(next.id);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-[#f6f9fd] select-none">
      {/* Top Banner with Webhook URL */}
      <div className="px-3 sm:px-5 py-3 bg-card border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-[0_3px_16px_rgba(15,45,82,0.04)] overflow-hidden">
        {/* Compact endpoint disclosure on phones */}
        <div className="order-3 w-full sm:hidden">
          <button
            type="button"
            onClick={() => setMobileEndpointOpen((open) => !open)}
            className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-[var(--surface-2)] px-3 text-left"
          >
            <Radio size={12} className="text-emerald-600" />
            <span className="flex-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Inbound endpoint</span>
            {mobileEndpointOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>
          {mobileEndpointOpen && (
            <div className="mt-1.5 flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card p-2.5 shadow-sm">
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground select-all" title={callbackUrl}>{callbackUrl}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(callbackUrl, 'url')}
                className="flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                {copied === 'url' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                {copied === 'url' ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Public Inbound URL Pill */}
        <div className="order-3 xl:order-none hidden sm:flex min-h-10 items-center gap-2.5 bg-[var(--surface-2)] border border-border px-3 py-1 rounded-xl w-full xl:w-auto xl:max-w-xl min-w-0 overflow-hidden">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
            <Radio size={12} />
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Inbound endpoint</span>
            <span className="block max-w-full truncate text-[11px] font-mono text-secondary-foreground select-all" title={callbackUrl}>
              {callbackUrl}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(callbackUrl, 'url')}
            className="ml-auto flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/10 cursor-pointer"
          >
            {copied === 'url' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
            <span>{copied === 'url' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded-sm bg-card border-border text-primary cursor-pointer"
            />
            <span className="text-[11px] font-medium">Live refresh</span>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchCallbacks()}
            disabled={loading}
            className="h-9 rounded-xl text-xs bg-card border-border hover:bg-muted text-secondary-foreground gap-1.5 cursor-pointer px-3"
          >
            <RefreshCw size={12} className={loading ? 'spin text-primary' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Split Panels */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Desktop collapsed rail: keeps the reopen action visible. */}
        {eventSidebarCollapsed && (
          <div className="hidden md:flex w-14 shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-3 shadow-[2px_0_12px_rgba(15,45,82,0.04)]">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEventSidebarCollapsed(false)}
              className="size-9 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
              title="Show callback inbox"
              aria-label="Show callback inbox"
            >
              <PanelLeftOpen size={16} />
            </Button>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary" title="Callback Inbox">
              <Inbox size={15} />
            </span>
          </div>
        )}

        {/* Left Side: Events List */}
        <div className={`${eventSidebarCollapsed ? (mobileSection === 'detail' ? 'hidden md:hidden' : 'flex md:hidden') : (mobileSection === 'detail' ? 'hidden md:flex' : 'flex')} w-full md:w-[350px] xl:w-[390px] h-full md:h-auto shrink-0 border-b md:border-b-0 md:border-r border-border flex-col min-h-0 bg-card transition-[width] duration-200`}>
          {/* Dedicated inbox header */}
          <div className="flex min-h-[66px] shrink-0 items-center gap-3 border-b border-border bg-card px-3.5 py-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Inbox size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-bold leading-tight text-foreground">Callback Inbox</h2>
                <span className="inline-flex h-5 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 px-1.5 font-sans text-[10px] font-bold leading-none tabular-nums text-primary">
                  {callbacks.length > 99 ? '99+' : callbacks.length}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">Market-specific webhook events</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEventSidebarCollapsed(true)}
              className="hidden md:flex size-9 shrink-0 rounded-xl border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-primary"
              title="Hide callback inbox"
              aria-label="Hide callback inbox"
            >
              <PanelLeftClose size={15} />
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-border space-y-2.5 bg-card">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by event ID or body..."
                className="w-full h-9 pl-9 pr-8 bg-[var(--surface-2)] border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--surface-2)] p-1 text-[11px]">
              <button
                onClick={() => setFilterVerified('all')}
                className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterVerified === 'all'
                    ? 'bg-background text-primary font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({callbacks.length})
              </button>
              <button
                onClick={() => setFilterVerified('verified')}
                className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterVerified === 'verified'
                    ? 'bg-background text-success font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Verified ({callbacks.filter((item) => item.signatureVerified).length})
              </button>
              <button
                onClick={() => setFilterVerified('invalid')}
                className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterVerified === 'invalid'
                    ? 'bg-background text-destructive font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Invalid ({callbacks.filter((item) => !item.signatureVerified).length})
              </button>
            </div>
          </div>

          {/* Events List */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-1.5 p-2">
            {filtered.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Webhook size={20} />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm">No callbacks yet</EmptyTitle>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    size="sm"
                    onClick={() => void fetchCallbacks()}
                    className="h-7 text-xs gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const summary = getCallbackSummary(item);
                const timeStr = new Date(item.receivedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedId(item.id); setMobileSection('detail'); }}
                    className={`relative w-full overflow-hidden rounded-xl border text-left p-3 transition-all duration-150 flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#eef6ff] border-primary/30 shadow-[0_5px_16px_rgba(2,101,210,0.09)]'
                        : 'border-transparent bg-card hover:border-border hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {isSelected && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock size={11} />
                        {timeStr}
                      </span>
                      {item.signatureVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                          <CheckCircle2 size={10} />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] font-bold text-destructive">
                          <XCircle size={10} />
                          INVALID
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono font-semibold text-foreground truncate" title={item.eventId}>
                      {item.eventId}
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-semibold text-foreground">{summary.type}</span>
                        <span>·</span>
                        <span className="truncate">{summary.status}</span>
                      </div>
                      {summary.amount !== '—' && <span className="shrink-0 font-mono font-semibold text-primary">{summary.amount}</span>}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span className="rounded-md bg-muted px-1.5 py-0.5 uppercase">{item.environment}</span>
                      {item.duplicate && (
                        <span className="inline-flex items-center rounded-full bg-warning/10 border border-warning/25 px-1.5 py-0.5 font-semibold text-warning">
                          Duplicate
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Event Details & Cryptography */}
        <div className={`${mobileSection === 'detail' ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0 min-w-0 overflow-x-hidden overflow-y-auto md:overflow-y-hidden overscroll-y-contain bg-[#f6f9fd] p-2.5 sm:p-4`}>
          {selectedItem ? (
            <div className="flex-none md:flex-1 flex flex-col md:min-h-0 min-w-0 space-y-3 pb-4 md:pb-0">
              <Button variant="ghost" size="sm" onClick={() => setMobileSection('list')} className="md:hidden self-start h-8 gap-1 text-muted-foreground">
                <ArrowLeft size={14} /> Back to callbacks
              </Button>

              {/* Mobile-first compact event summary */}
              {selectedSummary && (
                <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm md:hidden">
                  <div className="flex items-start gap-3">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      selectedItem.signatureVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      <Webhook size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">Selected event · {selectedIndex + 1} of {filtered.length}</span>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <strong className="min-w-0 flex-1 truncate font-mono text-xs text-foreground" title={selectedItem.eventId}>{selectedItem.eventId}</strong>
                        <button type="button" onClick={() => copyToClipboard(selectedItem.eventId, 'event-id')} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" title="Copy event ID">
                          {copied === 'event-id' ? <CheckCircle2 size={13} className="text-success" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarClock size={10} />{new Date(selectedItem.receivedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{selectedSummary.type}</span>
                    <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${/fail|error|reject/i.test(selectedSummary.status) ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{selectedSummary.status}</span>
                    {selectedSummary.amount !== '—' && <span className="rounded-lg bg-emerald-50 px-2 py-1 font-mono text-[10px] font-semibold text-emerald-700">{selectedSummary.amount}</span>}
                  </div>

                  {mobileEventDetailsOpen && (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[10px]">
                      <div><span className="block uppercase tracking-wide text-muted-foreground">Order reference</span><strong className="font-mono text-foreground">{selectedSummary.orderId || '—'}</strong></div>
                      <div><span className="block uppercase tracking-wide text-muted-foreground">Environment</span><strong className="font-mono uppercase text-foreground">{selectedItem.environment}</strong></div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                    <button type="button" onClick={() => setMobileEventDetailsOpen((open) => !open)} className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground">
                      {mobileEventDetailsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      Event details
                    </button>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => selectAdjacent(-1)} disabled={selectedIndex <= 0} className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-30" title="Previous callback"><ChevronLeft size={14} /></button>
                      <button type="button" onClick={() => selectAdjacent(1)} disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1} className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-30" title="Next callback"><ChevronRight size={14} /></button>
                    </div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    selectedItem.signatureVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <Webhook size={18} />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Selected event</span>
                    <h3 className="truncate text-sm font-mono font-bold text-foreground" title={selectedItem.eventId}>
                      {selectedItem.eventId}
                    </h3>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarClock size={11} />
                      {new Date(selectedItem.receivedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(selectedItem.eventId, 'event-id')}
                  className="h-8 text-xs gap-1.5 cursor-pointer rounded-lg"
                >
                  {copied === 'event-id' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                  <span>{copied === 'event-id' ? 'Copied' : 'Copy Event ID'}</span>
                </Button>
              </div>

              {/* Scannable callback summary */}
              {selectedSummary && (
                <div className="hidden md:grid grid-cols-2 gap-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground"><Radio size={11} /> Event type</span>
                    <strong className="block truncate text-xs text-foreground" title={selectedSummary.type}>{selectedSummary.type}</strong>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground"><ShieldCheck size={11} /> Payload status</span>
                    <strong className="block truncate text-xs text-foreground" title={selectedSummary.status}>{selectedSummary.status}</strong>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground"><Banknote size={11} /> Amount</span>
                    <strong className="block truncate font-mono text-xs text-primary">{selectedSummary.amount}</strong>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground"><Hash size={11} /> Order reference</span>
                    <strong className="block truncate font-mono text-xs text-foreground" title={selectedSummary.orderId || undefined}>{selectedSummary.orderId || '—'}</strong>
                  </div>
                </div>
              )}

              {/* Status Alert Banner */}
              <div
                className={`p-2.5 sm:p-3 rounded-xl border text-xs flex items-center gap-2.5 sm:gap-3 shadow-sm ${
                  selectedItem.signatureVerified
                    ? 'bg-success/10 border-success/25 text-success'
                    : 'bg-destructive/10 border-destructive/25 text-destructive'
                }`}
              >
                {selectedItem.signatureVerified ? (
                  <ShieldCheck size={18} className="text-success shrink-0" />
                ) : (
                  <ShieldAlert size={18} className="text-destructive shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <strong className="font-semibold block">
                    <span className="sm:hidden">{selectedItem.signatureVerified ? 'Signature verified' : 'Signature verification failed'}</span>
                    <span className="hidden sm:inline">{selectedItem.signatureVerified
                        ? 'Cryptographic HMAC-SHA256 Signature Validated'
                        : 'Cryptographic Signature Verification Failed'}</span>
                  </strong>
                  <span className="hidden sm:block truncate text-[11px] opacity-90" title={selectedItem.verificationMessage}>{selectedItem.verificationMessage}</span>
                </div>
                <span className={`hidden sm:inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${
                  selectedItem.signatureVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedItem.signatureVerified ? 'Verified' : 'Failed'}
                </span>
              </div>

              {/* Inspector Tabs */}
              <Tabs defaultValue="payload" className="flex-none md:flex-1 flex flex-col md:min-h-0 min-w-0 overflow-visible md:overflow-hidden pt-1">
                <div className="relative py-1">
                  <TabsList
                    variant="line"
                    className="callback-tabs-list console-scroll-tabs w-full max-w-full min-w-0 overflow-hidden sm:overflow-x-auto sm:overflow-y-hidden justify-start rounded-xl !border-0 bg-[#edf5ff] p-1 h-auto gap-1 shadow-none"
                  >
                  <TabsTrigger
                    value="payload"
                    className="group/callback-tab min-h-10 w-full sm:w-auto justify-start sm:justify-center rounded-lg !border-0 px-2.5 sm:px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/70 hover:text-foreground data-active:bg-white data-active:text-primary data-active:shadow-sm cursor-pointer shrink-0 after:hidden"
                  >
                    <FileJson size={14} />
                    Parsed Payload
                  </TabsTrigger>
                  <TabsTrigger
                    value="raw"
                    className="group/callback-tab min-h-10 w-full sm:w-auto justify-start sm:justify-center rounded-lg !border-0 px-2.5 sm:px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/70 hover:text-foreground data-active:bg-white data-active:text-primary data-active:shadow-sm cursor-pointer shrink-0 after:hidden"
                  >
                    <Code2 size={14} />
                    Raw Body
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="group/callback-tab min-h-10 w-full sm:w-auto justify-start sm:justify-center rounded-lg !border-0 px-2.5 sm:px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/70 hover:text-foreground data-active:bg-white data-active:text-primary data-active:shadow-sm cursor-pointer shrink-0 after:hidden"
                  >
                    <ListChecks size={14} />
                    Headers
                    <span className="min-w-5 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none text-primary">
                      {Object.keys(selectedItem.requestHeaders).length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="crypto"
                    className="group/callback-tab min-h-10 w-full sm:w-auto justify-start sm:justify-center rounded-lg !border-0 px-2.5 sm:px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/70 hover:text-foreground data-active:bg-white data-active:text-primary data-active:shadow-sm cursor-pointer shrink-0 after:hidden"
                  >
                    <GitBranch size={14} />
                    <span>Verification<span className="hidden min-[400px]:inline"> Pipeline</span></span>
                    <span className={`hidden sm:inline rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${
                      selectedItem.signatureVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {selectedItem.signatureVerified ? 'Verified' : 'Failed'}
                    </span>
                  </TabsTrigger>
                  </TabsList>
                </div>

                {/* Parsed Payload Tab */}
                <TabsContent value="payload" className="flex-none md:flex-1 overflow-visible md:overflow-y-auto p-3 m-0 bg-background">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Formatted JSON</span>
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                      <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs sm:w-56">
                        <Search size={12} className="shrink-0 text-muted-foreground" />
                        <input
                          value={payloadSearch}
                          onChange={(event) => setPayloadSearch(event.target.value)}
                          placeholder="Search payload…"
                          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                        />
                        {payloadSearch && (
                          <button type="button" onClick={() => setPayloadSearch('')} className="text-muted-foreground hover:text-foreground">
                            <X size={11} />
                          </button>
                        )}
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(selectedItem.payload, null, 2), 'payload')}
                        className="h-8 shrink-0 rounded-lg px-2.5 text-xs gap-1.5 cursor-pointer"
                      >
                        {copied === 'payload' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                        {copied === 'payload' ? 'Copied' : 'Copy payload'}
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <JsonTree key={selectedItem.id} data={selectedItem.payload} searchQuery={payloadSearch} />
                  </div>
                </TabsContent>

                {/* Raw Body Tab */}
                <TabsContent value="raw" className="flex-none md:flex-1 overflow-visible md:overflow-y-auto p-3 m-0 bg-background">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Original webhook body</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedItem.rawBody, 'raw')}
                      className="h-8 rounded-lg px-2.5 text-xs gap-1.5 cursor-pointer"
                    >
                      {copied === 'raw' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                      {copied === 'raw' ? 'Copied' : 'Copy raw body'}
                    </Button>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <pre className="text-xs font-mono text-secondary-foreground whitespace-pre-wrap break-all leading-relaxed select-text">
                      {selectedItem.rawBody}
                    </pre>
                  </div>
                </TabsContent>

                {/* Headers Tab */}
                <TabsContent value="headers" className="flex-none md:flex-1 overflow-visible md:overflow-y-auto p-3 m-0 bg-background">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Inbound request headers</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(selectedItem.requestHeaders, null, 2), 'headers')}
                      className="h-8 rounded-lg px-2.5 text-xs gap-1.5 cursor-pointer"
                    >
                      {copied === 'headers' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                      {copied === 'headers' ? 'Copied' : 'Copy headers'}
                    </Button>
                  </div>
                  <div className="border border-border rounded-xl overflow-x-auto bg-card shadow-sm">
                    <table className="w-full min-w-[520px] text-xs font-mono">
                      <tbody className="divide-y divide-border">
                        {Object.entries(selectedItem.requestHeaders).map(([k, v]) => (
                          <tr key={k} className="hover:bg-accent/50 transition-colors">
                            <td className="p-2 w-1/3 border-r border-border font-sans text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                              {k}
                            </td>
                            <td className="p-2 text-foreground break-all">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Crypto Verification Tab */}
                <TabsContent value="crypto" className="flex-none md:flex-1 overflow-visible md:overflow-y-auto p-3 m-0 space-y-3 text-xs bg-background">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Verification details</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        [
                          `Status: ${selectedItem.signatureVerified ? 'Verified' : 'Failed'}`,
                          `Event ID: ${selectedItem.eventId}`,
                          `Timestamp: ${selectedItem.eventTimestamp}`,
                          `Signature: ${selectedItem.signature}`,
                          `Deduplication: ${selectedItem.duplicate ? 'Duplicate Event' : 'Unique Event Recorded'}`,
                          `Message: ${selectedItem.verificationMessage}`,
                        ].join('\n'),
                        'verification'
                      )}
                      className="h-8 rounded-lg px-2.5 text-xs gap-1.5 cursor-pointer"
                    >
                      {copied === 'verification' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                      {copied === 'verification' ? 'Copied' : 'Copy details'}
                    </Button>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                      Canonical Signature Formula
                    </span>
                    <code className="text-xs font-mono text-primary block bg-card p-2.5 rounded-lg border border-border">
                      {selectedItem.eventId}\n{selectedItem.eventTimestamp}\n{'<RAW_PAYLOAD_BODY>'}
                    </code>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                      Received Inbound Signature (X-Signature)
                    </span>
                    <code className="text-xs font-mono text-warning block bg-card p-2.5 rounded-lg border border-border break-all">
                      {selectedItem.signature}
                    </code>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                    <div className="p-2.5 rounded-lg bg-card border border-border">
                      <span className="block font-sans text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Event Timestamp</span>
                      <strong className="text-foreground text-xs">{selectedItem.eventTimestamp}</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-card border border-border">
                      <span className="block font-sans text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Deduplication</span>
                      <strong className="text-foreground text-xs">
                        {selectedItem.duplicate ? 'Duplicate Event' : 'Unique Event Recorded'}
                      </strong>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Webhook size={28} className="mb-2 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
