'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Webhook,
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
import type { WebhookEventItem } from './types';

interface CallbackInboxProps {
  countrySlug: string;
  environment: string;
  onRefreshHistory?: () => void;
}

export function CallbackInbox({ countrySlug, environment }: CallbackInboxProps) {
  const [callbacks, setCallbacks] = useState<WebhookEventItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const callbackUrl = `${origin}/api/callbacks/assanpay/${countrySlug}/${environment}`;

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
    <div className="flex-1 flex flex-col min-h-0 bg-[#080b11] select-none">
      {/* Top Banner with Webhook URL */}
      <div className="px-3 sm:px-4 py-2 bg-[#0d121c] border-b border-[#1a2336] flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Webhook className="text-emerald-400" size={17} />
          <div>
            <h2 className="text-xs font-bold text-white leading-tight">
              AssanPay Webhook Receiver
            </h2>
            <p className="text-[10.5px] text-slate-400 font-mono -mt-0.5">
              Live listener with cryptographic HMAC verification & deduplication
            </p>
          </div>
        </div>

        {/* Public Inbound URL Pill */}
        <div className="order-3 lg:order-none flex items-center gap-2 bg-[#080b11] border border-[#1a2336] px-2.5 py-1 rounded-md w-full lg:w-auto lg:max-w-lg min-w-0">
          <span className="text-[9.5px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
            Inbound:
          </span>
          <span className="text-[11px] font-mono text-slate-300 truncate select-all">
            {callbackUrl}
          </span>
          <button
            onClick={() => copyToClipboard(callbackUrl, 'url')}
            className="text-xs text-sky-400 hover:text-sky-300 ml-1 font-mono flex items-center gap-1 cursor-pointer"
          >
            {copied === 'url' ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied === 'url' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-[#111724] border-[#1a2336] text-sky-500 cursor-pointer"
            />
            <span className="text-[11px]">Auto-refresh (5s)</span>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchCallbacks()}
            disabled={loading}
            className="h-7 text-xs bg-[#111724] border-[#1f2a3e] hover:bg-[#182236] text-slate-300 gap-1.5 cursor-pointer font-mono"
          >
            <RefreshCw size={12} className={loading ? 'spin text-sky-400' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Split Panels */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Side: Events List */}
        <div className="w-full md:w-96 h-[42%] md:h-auto shrink-0 border-b md:border-b-0 md:border-r border-[#1a2336] flex flex-col min-h-0 bg-[#0a0e17]">
          {/* Search & Filter Bar */}
          <div className="p-2.5 border-b border-[#1a2336] space-y-2 bg-[#0d121c]">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-500 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by event ID or body..."
                className="w-full h-7 pl-8 pr-7 bg-[#111724] border border-[#1f2a3e] rounded text-xs text-slate-200 placeholder:text-slate-500 font-mono outline-none focus:border-sky-500/50 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 text-slate-500 hover:text-slate-200 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] font-mono">
              <button
                onClick={() => setFilterVerified('all')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filterVerified === 'all'
                    ? 'bg-[#1a253a] text-sky-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({callbacks.length})
              </button>
              <button
                onClick={() => setFilterVerified('verified')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filterVerified === 'verified'
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setFilterVerified('invalid')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filterVerified === 'invalid'
                    ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Invalid
              </button>
            </div>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#162032]">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No webhook callbacks received yet. Post a callback payload to the inbound URL above.
              </div>
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
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left p-2.5 transition-all duration-150 flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-[#152033] border-l-2 border-emerald-400'
                        : 'hover:bg-[#101726]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        {timeStr}
                      </span>
                      {item.signatureVerified ? (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 font-bold">
                          <CheckCircle2 size={10} />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-700/50 text-rose-300 font-bold">
                          <XCircle size={10} />
                          INVALID
                        </span>
                      )}
                    </div>

                    <div className="text-[12px] font-mono font-semibold text-slate-200 truncate">
                      {item.eventId}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span className="uppercase">{item.environment}</span>
                      {item.duplicate && (
                        <span className="text-amber-400 bg-amber-950/60 px-1 rounded">
                          Duplicate
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Event Details & Cryptography */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-[#070a0f] p-2.5 sm:p-4">
          {selectedItem ? (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1a2336]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">Event ID</span>
                  <h3 className="text-base font-mono font-bold text-white">
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
                    className="h-7 text-xs text-slate-300 hover:text-sky-400 gap-1 cursor-pointer font-mono"
                  >
                    {copied === 'payload' ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>Payload</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedItem.rawBody, 'raw')}
                    className="h-7 text-xs text-slate-300 hover:text-sky-400 gap-1 cursor-pointer font-mono"
                  >
                    {copied === 'raw' ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>Raw Body</span>
                  </Button>
                </div>
              </div>

              {/* Status Alert Banner */}
              <div
                className={`p-3 rounded-md border text-xs flex items-center gap-2.5 ${
                  selectedItem.signatureVerified
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-700/50 text-rose-200'
                }`}
              >
                {selectedItem.signatureVerified ? (
                  <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert size={18} className="text-rose-400 shrink-0" />
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
              <Tabs defaultValue="payload" className="flex-1 flex flex-col min-h-0 pt-1">
                <TabsList className="bg-[#0c111c] border-b border-[#1a2336] justify-start rounded-none p-0 h-auto gap-4 px-3">
                  <TabsTrigger
                    value="payload"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-400 data-[state=active]:bg-transparent data-[state=active]:text-sky-300 text-xs py-2 px-1 text-slate-400 font-medium cursor-pointer"
                  >
                    Parsed Payload
                  </TabsTrigger>
                  <TabsTrigger
                    value="raw"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-400 data-[state=active]:bg-transparent data-[state=active]:text-sky-300 text-xs py-2 px-1 text-slate-400 font-medium cursor-pointer"
                  >
                    Raw Body
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-400 data-[state=active]:bg-transparent data-[state=active]:text-sky-300 text-xs py-2 px-1 text-slate-400 font-medium cursor-pointer"
                  >
                    Headers ({Object.keys(selectedItem.requestHeaders).length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="crypto"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-400 data-[state=active]:bg-transparent data-[state=active]:text-sky-300 text-xs py-2 px-1 text-slate-400 font-medium cursor-pointer"
                  >
                    Verification Pipeline
                  </TabsTrigger>
                </TabsList>

                {/* Parsed Payload Tab */}
                <TabsContent value="payload" className="flex-1 overflow-y-auto p-3 m-0 bg-[#070a0f]">
                  <pre className="text-xs font-mono text-sky-200/95 whitespace-pre-wrap leading-relaxed select-text">
                    {JSON.stringify(selectedItem.payload, null, 2)}
                  </pre>
                </TabsContent>

                {/* Raw Body Tab */}
                <TabsContent value="raw" className="flex-1 overflow-y-auto p-3 m-0 bg-[#070a0f]">
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
                    {selectedItem.rawBody}
                  </pre>
                </TabsContent>

                {/* Headers Tab */}
                <TabsContent value="headers" className="flex-1 overflow-y-auto p-3 m-0 bg-[#070a0f]">
                  <div className="border border-[#1a2336] rounded overflow-x-auto">
                    <table className="w-full min-w-[520px] text-xs font-mono">
                      <tbody className="divide-y divide-[#1a2336]">
                        {Object.entries(selectedItem.requestHeaders).map(([k, v]) => (
                          <tr key={k}>
                            <td className="p-2 text-slate-400 font-semibold w-1/3 border-r border-[#1a2336]">
                              {k}
                            </td>
                            <td className="p-2 text-slate-200 break-all">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Crypto Verification Tab */}
                <TabsContent value="crypto" className="flex-1 overflow-y-auto p-3 m-0 space-y-3 text-xs bg-[#070a0f]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                      Canonical Signature Formula
                    </span>
                    <code className="text-xs font-mono text-sky-300 block bg-[#0c111c] p-2.5 rounded border border-[#1a2336]">
                      {selectedItem.eventId}\n{selectedItem.eventTimestamp}\n{'<RAW_PAYLOAD_BODY>'}
                    </code>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                      Received Inbound Signature (X-Signature)
                    </span>
                    <code className="text-xs font-mono text-amber-300 block bg-[#0c111c] p-2.5 rounded border border-[#1a2336] break-all">
                      {selectedItem.signature}
                    </code>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                    <div className="p-2.5 rounded bg-[#0c111c] border border-[#1a2336]">
                      <span className="text-[10px] uppercase text-slate-500 block">Event Timestamp</span>
                      <strong className="text-slate-200 text-xs">{selectedItem.eventTimestamp}</strong>
                    </div>

                    <div className="p-2.5 rounded bg-[#0c111c] border border-[#1a2336]">
                      <span className="text-[10px] uppercase text-slate-500 block">Deduplication</span>
                      <strong className="text-slate-200 text-xs">
                        {selectedItem.duplicate ? 'Duplicate Event' : 'Unique Event Recorded'}
                      </strong>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Webhook size={28} className="mb-2 text-slate-600" />
              <p className="text-xs font-mono">Select a callback event from the inbox list to inspect details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
