'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Activity,
  Calendar,
  X,
  RefreshCw,
  Terminal,
  Lock,
  FileJson,
  Send,
  ListChecks,
  ShieldCheck,
  Inbox,
  WalletCards,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { formatAmount } from '@/lib/parse-amount';
import type { HistoryItem, Method } from './types';
import { JsonTree } from './json-tree';

interface HistoryViewProps {
  history: HistoryItem[];
  onLoadIntoWorkbench: (item: HistoryItem) => void;
  onRefresh: () => void;
  loading: boolean;
  // Active environment, passed through to the payout feed fetch.
  environment?: string;
  countrySlug: string;
}

type HistoryKind = 'payin' | 'payout';

function parseJsonBody(value: string): unknown | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function getHistoryErrorMessage(item: HistoryItem): string | null {
  if (item.responseStatus >= 200 && item.responseStatus < 300) return null;

  const storedError = item.errorMessage?.trim();
  const isGenericStoredError = storedError
    ? /^(?:HTTP\s+\d{3}|Request failed with HTTP\s+\d{3})\s*$/i.test(storedError)
    : false;
  if (storedError && !isGenericStoredError) return storedError;

  const parsed = parseJsonBody(item.responseBody);
  if (typeof parsed === 'string' && parsed.trim()) return parsed.trim().slice(0, 500);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const body = parsed as Record<string, unknown>;
    for (const key of ['message', 'errorMessage', 'error', 'reason', 'detail']) {
      const value = body[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = value as Record<string, unknown>;
        const nestedMessage = nested.message ?? nested.detail ?? nested.reason;
        if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage.trim();
      }
    }
  }

  const rawBody = item.responseBody?.trim();
  if (rawBody && rawBody.length <= 500 && !rawBody.startsWith('<')) return rawBody;

  return storedError || item.responseStatusText?.trim() || `Request failed with HTTP ${item.responseStatus}`;
}

function getTransactionStatus(item: HistoryItem) {
  const success = item.responseStatus >= 200 && item.responseStatus < 300;
  return {
    success,
    label: success ? 'Success' : 'Failed',
    errorMessage: getHistoryErrorMessage(item),
  };
}

export function HistoryView({
  history,
  onLoadIntoWorkbench,
  onRefresh,
  loading,
  environment,
  countrySlug,
}: HistoryViewProps) {
  const [kind, setKind] = useState<HistoryKind>('payin');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<'list' | 'detail'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const [payoutItems, setPayoutItems] = useState<HistoryItem[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);

  const fetchPayout = useCallback(async () => {
    setPayoutLoading(true);
    try {
      const params = new URLSearchParams({ kind: 'payout', limit: '100', country: countrySlug });
      if (environment) params.set('environment', environment);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/history?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { history?: HistoryItem[] };
        setPayoutItems(data.history || []);
      }
    } catch {
      // ignore
    } finally {
      setPayoutLoading(false);
    }
  }, [countrySlug, environment, search]);

  // Never leave the previous market's payout rows visible while the selected
  // country is changing and its fresh feed is loading.
  useEffect(() => {
    setPayoutItems([]);
  }, [countrySlug, environment]);

  // Load the team-wide payout feed when the Payout tab becomes active.
  useEffect(() => {
    if (kind === 'payout') {
      void fetchPayout();
    }
  }, [kind, fetchPayout]);

  const handleRefresh = () => {
    if (kind === 'payout') {
      void fetchPayout();
    } else {
      onRefresh();
    }
  };

  const refreshDisabled = kind === 'payout' ? payoutLoading : loading;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  const getMethodBadgeClass = (m: Method) => {
    switch (m) {
      case 'GET':
        return 'method-badge get';
      case 'POST':
        return 'method-badge post';
      case 'PUT':
        return 'method-badge put';
      case 'PATCH':
        return 'method-badge patch';
      case 'DELETE':
        return 'method-badge delete';
      default:
        return 'method-badge post';
    }
  };

  const filtered = history.filter((item) => {
    const isSuccess = item.responseStatus >= 200 && item.responseStatus < 300;
    if (statusFilter === 'success' && !isSuccess) return false;
    if (statusFilter === 'failed' && isSuccess) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.requestName.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.requestId.toLowerCase().includes(q) ||
        (item.errorMessage || '').toLowerCase().includes(q) ||
        String(item.responseStatus).includes(q)
      );
    }
    return true;
  });

  const selectedItem = history.find((h) => h.id === selectedId) || filtered[0] || null;
  const selectedResponseData = selectedItem ? parseJsonBody(selectedItem.responseBody) : undefined;
  const selectedRequestData = selectedItem ? parseJsonBody(selectedItem.requestBody) : undefined;
  const selectedTransactionStatus = selectedItem ? getTransactionStatus(selectedItem) : null;
  const successCount = history.filter((item) => item.responseStatus >= 200 && item.responseStatus < 300).length;
  const failedCount = history.length - successCount;

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-[#f6f9fd] select-none">
      {/* Top Header */}
      <div className="px-3 sm:px-5 py-3 bg-card border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-[0_3px_16px_rgba(15,45,82,0.04)]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <History size={19} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">Request History</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                {kind === 'payin' ? history.length : payoutItems.length}
              </span>
            </div>
            <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
              Inspect previous API requests, responses and execution details
            </p>
          </div>
        </div>

        <div className="order-3 flex w-full items-center gap-2 sm:order-none sm:w-auto">
          {/* Payin / Payout kind switcher */}
          <Tabs
            value={kind}
            onValueChange={(value) => value && setKind(value as HistoryKind)}
            className="min-w-0 flex-1 shrink-0 sm:flex-none"
          >
            <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl border border-border bg-[var(--surface-2)] p-1 sm:w-[210px]">
              <TabsTrigger
                value="payin"
                className="h-full rounded-lg px-3 text-xs font-semibold text-muted-foreground data-active:bg-card data-active:text-primary data-active:shadow-sm cursor-pointer"
              >
                <Inbox size={13} /> Payin
              </TabsTrigger>
              <TabsTrigger
                value="payout"
                className="h-full rounded-lg px-3 text-xs font-semibold text-muted-foreground data-active:bg-card data-active:text-primary data-active:shadow-sm cursor-pointer"
              >
                <WalletCards size={13} /> Payout
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshDisabled}
            className="h-10 rounded-xl text-xs bg-card border-border hover:bg-muted text-secondary-foreground gap-1.5 cursor-pointer px-3"
          >
            <RefreshCw size={12} className={refreshDisabled ? 'spin text-primary' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {kind === 'payin' ? (
      <>
      {/* Split Workstation Panes */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Side: History Item List */}
        <div className={`${mobileSection === 'detail' ? 'hidden md:flex' : 'flex'} w-full md:w-[350px] xl:w-[390px] h-full md:h-auto shrink-0 border-b md:border-b-0 md:border-r border-border flex-col min-h-0 bg-card`}>
          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-border space-y-2.5 bg-card">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history by name, path, ID..."
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

            {/* Quick Status Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--surface-2)] p-1 text-[11px]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-card text-primary font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({history.length})
              </button>
              <button
                onClick={() => setStatusFilter('success')}
                className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'success'
                    ? 'bg-card text-success font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Success ({successCount})
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'failed'
                    ? 'bg-card text-destructive font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Errors ({failedCount})
              </button>
            </div>
          </div>

          {/* List Scroll */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-1.5 p-2">
            {filtered.length === 0 ? (
              <Empty className="m-2 rounded-2xl border border-dashed border-border bg-[var(--surface-2)] py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <History size={20} />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm">No request history yet</EmptyTitle>
                </EmptyHeader>
                <p className="max-w-[230px] text-center text-xs text-muted-foreground">Run an API request from the Dashboard and it will appear here.</p>
              </Empty>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const transactionStatus = getTransactionStatus(item);
                const timeStr = new Date(item.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedId(item.id); setMobileSection('detail'); }}
                    className={`relative w-full overflow-hidden rounded-xl border p-3 text-left transition-all duration-150 flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#eef6ff] border-primary/30 shadow-[0_5px_16px_rgba(2,101,210,0.09)]'
                        : 'border-transparent bg-card hover:border-border hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {isSelected && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={getMethodBadgeClass(item.method)}>
                          {item.method}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-muted text-secondary-foreground uppercase">
                          {item.environment}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          transactionStatus.success
                            ? 'bg-success/10 text-success border border-success/25'
                            : 'bg-destructive/10 text-destructive border border-destructive/25'
                        }`}
                      >
                        {transactionStatus.label} · {item.responseStatus}
                      </span>
                    </div>

                    <strong className="text-xs font-semibold text-foreground truncate block">
                      {item.requestName}
                    </strong>

                    <div className="text-[11px] font-mono text-muted-foreground truncate">
                      {item.url}
                    </div>

                    {transactionStatus.errorMessage && (
                      <div className="flex items-start gap-1.5 rounded-lg bg-destructive/[0.06] px-2 py-1.5 text-[10px] text-destructive" title={transactionStatus.errorMessage}>
                        <AlertCircle size={11} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{transactionStatus.errorMessage}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1"><Clock size={10} />{timeStr}</span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5">{item.durationMs} ms</span>
                    </div>
                  </button>
                );
              })
            )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Detailed Audit Inspector */}
        <div className={`${mobileSection === 'detail' ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0 min-w-0 overflow-x-hidden overflow-y-auto md:overflow-y-hidden bg-[#f6f9fd] p-2.5 sm:p-4`}>
          {selectedItem ? (
            <div className="flex-none md:flex-1 flex flex-col md:min-h-0 min-w-0 space-y-3 pb-4 md:pb-0">
              <Button variant="ghost" size="sm" onClick={() => setMobileSection('list')} className="md:hidden self-start h-8 gap-1 text-muted-foreground">
                <ArrowLeft size={14} /> Back to history
              </Button>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    selectedItem.responseStatus >= 200 && selectedItem.responseStatus < 300 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <Terminal size={17} />
                  </span>
                  <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={getMethodBadgeClass(selectedItem.method)}>
                      {selectedItem.method}
                    </span>
                    <h3 className="text-sm font-bold text-foreground truncate min-w-0" title={selectedItem.requestName}>
                      {selectedItem.requestName}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-primary truncate block mt-0.5" title={selectedItem.url}>
                    {selectedItem.url}
                  </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => onLoadIntoWorkbench(selectedItem)}
                    className="h-9 rounded-xl text-xs bg-primary hover:bg-primary text-primary-foreground gap-1.5 font-semibold cursor-pointer shadow-sm w-full sm:w-auto px-3"
                  >
                    <RotateCcw size={13} />
                    <span>Load into Workbench</span>
                  </Button>
                </div>
              </div>

              {/* Status and execution summary */}
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Transaction status</span>
                  <strong
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] ${
                    selectedTransactionStatus?.success
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {selectedTransactionStatus?.label} · HTTP {selectedItem.responseStatus}
                  </strong>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Duration</span>
                  <strong className="mt-1 flex items-center gap-1.5 font-mono text-xs text-foreground"><Clock size={12} className="text-primary" />{selectedItem.durationMs} ms</strong>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Response size</span>
                  <strong className="mt-1 flex items-center gap-1.5 font-mono text-xs text-foreground"><Activity size={12} className="text-primary" />{(selectedItem.payloadSize / 1024).toFixed(2)} KB</strong>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Executed at</span>
                  <strong className="mt-1 block truncate text-[10px] text-foreground" title={new Date(selectedItem.createdAt).toLocaleString()}>{new Date(selectedItem.createdAt).toLocaleString()}</strong>
                </div>
              </div>

              {selectedTransactionStatus?.errorMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/[0.06] p-3 text-destructive shadow-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <strong className="block text-xs">Transaction failed</strong>
                    <p className="mt-0.5 break-words text-[11px]">{selectedTransactionStatus.errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Inspector Tabs */}
              <Tabs defaultValue="response" className="flex-none md:flex-1 flex flex-col md:min-h-0 min-w-0 overflow-visible md:overflow-hidden pt-1">
                <TabsList variant="line" className="callback-tabs-list console-scroll-tabs w-full max-w-full min-w-0 overflow-hidden sm:overflow-x-auto justify-start rounded-xl !border-0 bg-[#edf5ff] p-1 h-auto gap-1 shadow-none">
                  <TabsTrigger
                    value="response"
                    className="min-h-10 w-full sm:w-auto justify-start sm:justify-center rounded-lg !border-0 px-3 text-xs font-semibold text-muted-foreground hover:bg-white/70 data-active:bg-white data-active:text-primary cursor-pointer after:hidden"
                  >
                    <FileJson size={14} />
                    Response Body
                  </TabsTrigger>
                  <TabsTrigger
                    value="request"
                    className="min-h-10 w-full sm:w-auto justify-start sm:justify-center rounded-lg !border-0 px-3 text-xs font-semibold text-muted-foreground hover:bg-white/70 data-active:bg-white data-active:text-primary cursor-pointer after:hidden"
                  >
                    <Send size={14} />
                    Request Sent
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="min-h-10 w-full sm:w-auto justify-start sm:justify-center rounded-lg !border-0 px-3 text-xs font-semibold text-muted-foreground hover:bg-white/70 data-active:bg-white data-active:text-primary cursor-pointer after:hidden"
                  >
                    <ListChecks size={14} />
                    Headers
                  </TabsTrigger>
                  <TabsTrigger
                    value="meta"
                    className="min-h-10 w-full sm:w-auto justify-start sm:justify-center rounded-lg !border-0 px-3 text-xs font-semibold text-muted-foreground hover:bg-white/70 data-active:bg-white data-active:text-primary cursor-pointer after:hidden"
                  >
                    <ShieldCheck size={14} />
                    <span>Security<span className="hidden min-[400px]:inline"> &amp; Metadata</span></span>
                  </TabsTrigger>
                </TabsList>

                {/* Response Body Tab */}
                <TabsContent value="response" className="flex-none md:flex-1 min-w-0 overflow-visible md:overflow-auto p-3 m-0 bg-background">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Response payload</span>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedItem.responseBody || '', 'response')} className="h-8 rounded-lg gap-1.5 text-xs">
                      {copied === 'response' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                      {copied === 'response' ? 'Copied' : 'Copy response'}
                    </Button>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    {selectedResponseData !== undefined ? (
                      <JsonTree key={`response-${selectedItem.id}`} data={selectedResponseData} />
                    ) : (
                      <pre className="text-xs font-mono text-primary/90 whitespace-pre-wrap break-all leading-relaxed select-text">{selectedItem.responseBody || '// No response body'}</pre>
                    )}
                  </div>
                </TabsContent>

                {/* Request Sent Tab */}
                <TabsContent value="request" className="flex-none md:flex-1 overflow-visible md:overflow-y-auto p-3 m-0 space-y-3 bg-background">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Request body</span>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedItem.requestBody || '', 'request')} className="h-8 rounded-lg gap-1.5 text-xs">
                        {copied === 'request' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                        {copied === 'request' ? 'Copied' : 'Copy request'}
                      </Button>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                      {selectedRequestData !== undefined ? <JsonTree key={`request-${selectedItem.id}`} data={selectedRequestData} /> : (
                        <pre className="font-mono text-xs text-secondary-foreground whitespace-pre-wrap break-all">{selectedItem.requestBody || '// (Empty request body)'}</pre>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Headers Tab */}
                <TabsContent value="headers" className="flex-none md:flex-1 overflow-visible md:overflow-y-auto p-3 m-0 space-y-4 bg-background">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Response headers</span>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(selectedItem.responseHeaders || {}, null, 2), 'headers')} className="h-8 rounded-lg gap-1.5 text-xs">
                        {copied === 'headers' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                        {copied === 'headers' ? 'Copied' : 'Copy headers'}
                      </Button>
                    </div>
                    <div className="border border-border rounded-xl overflow-x-auto bg-card shadow-sm">
                      <table className="w-full min-w-[520px] text-xs font-mono">
                        <tbody className="divide-y divide-border">
                          {Object.entries(selectedItem.responseHeaders || {}).map(([k, v]) => (
                            <tr key={k} className="hover:bg-accent/50 transition-colors">
                              <td className="p-2 text-muted-foreground font-semibold w-1/3 border-r border-border">
                                {k}
                              </td>
                              <td className="p-2 text-foreground break-all">{v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* Metadata Tab */}
                <TabsContent value="meta" className="flex-none md:flex-1 overflow-visible md:overflow-y-auto p-3 m-0 bg-background">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-card border border-border">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Audit ID</span>
                      <strong className="font-mono text-primary text-[11px] break-all">{selectedItem.requestId}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-card border border-border">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Environment</span>
                      <strong className="text-foreground">{selectedItem.environment.toUpperCase()}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-card border border-border">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Signing Status</span>
                      <strong className="text-success">{selectedItem.signingStatus}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-card border border-border">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block">Execution Latency</span>
                      <strong className="text-foreground">{selectedItem.durationMs} ms</strong>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <History size={22} className="text-primary" />
              </div>
              <strong className="mt-3 text-sm text-foreground">Select a request to inspect</strong>
              <p className="mt-1 max-w-xs text-xs">Request and response details will appear here.</p>
            </div>
          )}
        </div>
      </div>
      </>
      ) : (
      /* Payout tab: team-wide read-only feed */
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f6f9fd] p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Team payout activity</h3>
            <p className="text-[11px] text-muted-foreground">Read-only requests attributed to each operator</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-[var(--surface-2)] px-2.5 sm:w-64">
              <Search size={13} className="shrink-0 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search payout history…" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
              {search && <button type="button" onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>}
            </label>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold text-primary">{payoutItems.length} records</span>
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0 rounded-2xl border border-border bg-card shadow-sm">
          {payoutLoading && payoutItems.length === 0 ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <RefreshCw size={14} className="spin text-primary" />
              <span>Loading payout requests...</span>
            </div>
          ) : payoutItems.length === 0 ? (
            <Empty className="min-h-[360px] py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <History size={20} />
                </EmptyMedia>
                  <EmptyTitle className="text-sm">No payout requests yet</EmptyTitle>
              </EmptyHeader>
                <p className="max-w-sm text-center text-xs text-muted-foreground">Team payout requests will appear here with operator, amount and response status.</p>
            </Empty>
          ) : (
            <table className="w-full min-w-[900px] text-xs">
              <thead className="sticky top-0 z-10 bg-[var(--surface-2)]">
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="p-2.5 font-semibold">User</th>
                  <th className="p-2.5 font-semibold">Time</th>
                  <th className="p-2.5 font-semibold">Request</th>
                  <th className="p-2.5 font-semibold text-right">Amount</th>
                  <th className="p-2.5 font-semibold">Status / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payoutItems.map((item) => {
                  const transactionStatus = getTransactionStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-[#f7fbff] transition-colors">
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            title="Attributed to this account"
                            className="shrink-0 text-muted-foreground cursor-help"
                          >
                            <Lock size={11} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-foreground truncate">
                              {item.userName || 'Unknown user'}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {item.userEmail || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="p-2.5">
                        <div className="text-xs font-semibold text-foreground truncate max-w-[220px]">
                          {item.requestName}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground truncate max-w-[220px]">
                          {item.url}
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-xs text-foreground text-right whitespace-nowrap">
                        {formatAmount(item.requestBody)}
                      </td>
                      <td className="p-2.5">
                        <div className="max-w-[300px]">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] font-bold whitespace-nowrap ${
                            transactionStatus.success
                              ? 'bg-success/10 text-success border border-success/25'
                              : 'bg-destructive/10 text-destructive border border-destructive/25'
                          }`}
                          >
                            {transactionStatus.label} · {item.responseStatus}
                          </span>
                          {transactionStatus.errorMessage && (
                            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-destructive" title={transactionStatus.errorMessage}>
                              {transactionStatus.errorMessage}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </div>
      )}
    </div>
  );
}
