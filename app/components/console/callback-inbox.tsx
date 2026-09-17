'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import type { WebhookEventItem } from './types';

interface CallbackInboxProps {
  countrySlug: string;
  environment: string;
  onRefreshHistory?: () => void;
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

  // Compute public callback URL
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const callbackUrl = `${origin}/api/callbacks/assanpay/${countrySlug}`;

  const fetchCallbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/callbacks?environment=${environment}&limit=50`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { callbacks?: WebhookEventItem[] };
        const list = data.callbacks || [];
        setCallbacks(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [environment, selectedId]);

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

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-background select-none">
      {/* Top Banner with Webhook URL */}
      <div className="px-3 sm:px-4 py-2 bg-card border-b border-border flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0">
        <div className="flex items-start gap-2 min-w-0 w-full lg:w-auto">
          <Webhook className="text-primary" size={17} />
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-foreground leading-tight">
              Callbacks
            </h2>
          </div>
        </div>

        {/* Public Inbound URL Pill */}
        <div className="order-3 lg:order-none flex items-center gap-2 bg-background border border-border px-2.5 py-1 rounded-md w-full lg:w-auto lg:max-w-lg min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            Inbound:
          </span>
          <span className="min-w-0 flex-1 text-[11px] font-mono text-secondary-foreground truncate select-all" title={callbackUrl}>
            {callbackUrl}
          </span>
          <button
            onClick={() => copyToClipboard(callbackUrl, 'url')}
            className="text-xs text-primary hover:text-primary ml-1 flex items-center gap-1 cursor-pointer shrink-0"
          >
            {copied === 'url' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
            <span>{copied === 'url' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-card border-border text-primary cursor-pointer"
            />
            <span className="text-[11px]">Auto-refresh (5s)</span>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchCallbacks()}
            disabled={loading}
            className="h-7 text-xs bg-card border-border hover:bg-muted text-secondary-foreground gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'spin text-primary' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Split Panels */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Side: Events List */}
        <div className={`${mobileSection === 'detail' ? 'hidden md:flex' : 'flex'} w-full md:w-96 h-full md:h-auto shrink-0 border-b md:border-b-0 md:border-r border-border flex-col min-h-0 bg-card`}>
          {/* Search & Filter Bar */}
          <div className="p-2.5 border-b border-border space-y-2 bg-card">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by event ID or body..."
                className="w-full h-7 pl-8 pr-7 bg-card border border-border rounded text-xs text-foreground placeholder:text-muted-foreground font-mono outline-none focus:border-primary/50 transition-colors"
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

            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setFilterVerified('all')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filterVerified === 'all'
                    ? 'bg-accent text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({callbacks.length})
              </button>
              <button
                onClick={() => setFilterVerified('verified')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filterVerified === 'verified'
                    ? 'bg-success/10 text-success border border-success/25 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setFilterVerified('invalid')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filterVerified === 'invalid'
                    ? 'bg-destructive/10 text-destructive border border-destructive/25 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Invalid
              </button>
            </div>
          </div>

          {/* Events List */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Webhook size={20} />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm">No callbacks yet</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    No callbacks received.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const timeStr = new Date(item.receivedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedId(item.id); setMobileSection('detail'); }}
                    className={`w-full text-left p-2.5 transition-colors duration-150 flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-accent border-l-2 border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock size={11} />
                        {timeStr}
                      </span>
                      {item.signatureVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-success/10 border border-success/25 text-success font-bold">
                          <CheckCircle2 size={10} />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-destructive/10 border border-destructive/25 text-destructive font-bold">
                          <XCircle size={10} />
                          INVALID
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono font-semibold text-foreground truncate">
                      {item.eventId}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span className="uppercase">{item.environment}</span>
                      {item.duplicate && (
                        <span className="text-warning bg-warning/10 px-1 rounded">
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
        <div className={`${mobileSection === 'detail' ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0 min-w-0 overflow-hidden bg-background p-2.5 sm:p-4`}>
          {selectedItem ? (
            <div className="flex-1 flex flex-col min-h-0 min-w-0 space-y-3">
              <Button variant="ghost" size="sm" onClick={() => setMobileSection('list')} className="md:hidden self-start h-8 gap-1 text-muted-foreground">
                <ArrowLeft size={14} /> Back to callbacks
              </Button>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border min-w-0">
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Event ID</span>
                  <h3 className="text-base font-mono font-bold text-foreground break-all">
                    {selectedItem.eventId}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(selectedItem.payload, null, 2),
                        'payload'
                      )
                    }
                    className="h-7 text-xs text-secondary-foreground hover:text-primary gap-1 cursor-pointer font-mono"
                  >
                    {copied === 'payload' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                    <span>Payload</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedItem.rawBody, 'raw')}
                    className="h-7 text-xs text-secondary-foreground hover:text-primary gap-1 cursor-pointer font-mono"
                  >
                    {copied === 'raw' ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
                    <span>Raw Body</span>
                  </Button>
                </div>
              </div>

              {/* Status Alert Banner */}
              <div
                className={`p-3 rounded-md border text-xs flex items-center gap-2.5 ${
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
                <div>
                  <strong className="font-semibold block font-mono">
                    {selectedItem.signatureVerified
                      ? 'Cryptographic HMAC-SHA256 Signature Validated'
                      : 'Cryptographic Signature Verification Failed'}
                  </strong>
                  <span className="text-[11px] opacity-90">{selectedItem.verificationMessage}</span>
                </div>
              </div>

              {/* Inspector Tabs */}
              <Tabs defaultValue="payload" className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden pt-1">
                <TabsList className="console-scroll-tabs w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden bg-card border-b border-border justify-start rounded-none p-0 h-auto gap-4 px-3">
                  <TabsTrigger
                    value="payload"
                    className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-xs py-2 px-1 text-muted-foreground font-medium cursor-pointer"
                  >
                    Parsed Payload
                  </TabsTrigger>
                  <TabsTrigger
                    value="raw"
                    className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-xs py-2 px-1 text-muted-foreground font-medium cursor-pointer"
                  >
                    Raw Body
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-xs py-2 px-1 text-muted-foreground font-medium cursor-pointer"
                  >
                    Headers ({Object.keys(selectedItem.requestHeaders).length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="crypto"
                    className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-xs py-2 px-1 text-muted-foreground font-medium cursor-pointer"
                  >
                    Verification Pipeline
                  </TabsTrigger>
                </TabsList>

                {/* Parsed Payload Tab */}
                <TabsContent value="payload" className="flex-1 overflow-y-auto p-3 m-0 bg-background">
                  <pre className="text-xs font-mono text-primary/90 whitespace-pre-wrap break-all leading-relaxed select-text">
                    {JSON.stringify(selectedItem.payload, null, 2)}
                  </pre>
                </TabsContent>

                {/* Raw Body Tab */}
                <TabsContent value="raw" className="flex-1 overflow-y-auto p-3 m-0 bg-background">
                  <pre className="text-xs font-mono text-secondary-foreground whitespace-pre-wrap break-all leading-relaxed select-text">
                    {selectedItem.rawBody}
                  </pre>
                </TabsContent>

                {/* Headers Tab */}
                <TabsContent value="headers" className="flex-1 overflow-y-auto p-3 m-0 bg-background">
                  <div className="border border-border rounded-lg overflow-x-auto">
                    <table className="w-full min-w-[520px] text-xs font-mono">
                      <tbody className="divide-y divide-border">
                        {Object.entries(selectedItem.requestHeaders).map(([k, v]) => (
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
                </TabsContent>

                {/* Crypto Verification Tab */}
                <TabsContent value="crypto" className="flex-1 overflow-y-auto p-3 m-0 space-y-3 text-xs bg-background">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                      Canonical Signature Formula
                    </span>
                    <code className="text-xs font-mono text-primary block bg-card p-2.5 rounded border border-border">
                      {selectedItem.eventId}\n{selectedItem.eventTimestamp}\n{'<RAW_PAYLOAD_BODY>'}
                    </code>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                      Received Inbound Signature (X-Signature)
                    </span>
                    <code className="text-xs font-mono text-warning block bg-card p-2.5 rounded border border-border break-all">
                      {selectedItem.signature}
                    </code>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                    <div className="p-2.5 rounded bg-card border border-border">
                      <span className="text-xs uppercase text-muted-foreground block">Event Timestamp</span>
                      <strong className="text-foreground text-xs">{selectedItem.eventTimestamp}</strong>
                    </div>

                    <div className="p-2.5 rounded bg-card border border-border">
                      <span className="text-xs uppercase text-muted-foreground block">Deduplication</span>
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
              <p className="text-xs font-mono">Select a callback event from the inbox list to inspect details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
