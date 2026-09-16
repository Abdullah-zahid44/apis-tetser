'use client';

import React, { useState } from 'react';
import {
  History,
  Search,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Activity,
  Calendar,
  X,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { HistoryItem, Method } from './types';

interface HistoryViewProps {
  history: HistoryItem[];
  onLoadIntoWorkbench: (item: HistoryItem) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function HistoryView({
  history,
  onLoadIntoWorkbench,
  onRefresh,
  loading,
}: HistoryViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [copied, setCopied] = useState<string | null>(null);

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
        String(item.responseStatus).includes(q)
      );
    }
    return true;
  });

  const selectedItem = history.find((h) => h.id === selectedId) || filtered[0] || null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080b11] select-none">
      {/* Top Header */}
      <div className="min-h-12 px-3 sm:px-4 py-2 bg-[#0d121c] border-b border-[#1a2336] flex items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <History size={16} className="text-sky-400" />
            <span>Audit Execution History</span>
            <Badge
              variant="outline"
              className="hidden sm:inline-flex h-4 px-1.5 text-[9px] font-mono border-slate-700 text-slate-400"
            >
              {history.length} Audited Calls
            </Badge>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-7 text-xs bg-[#111724] border-[#1f2a3e] hover:bg-[#182236] text-slate-300 gap-1.5 cursor-pointer font-mono"
          >
            <RefreshCw size={12} className={loading ? 'spin text-sky-400' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Split Workstation Panes */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Side: History Item List */}
        <div className="w-full md:w-96 h-[42%] md:h-auto shrink-0 border-b md:border-b-0 md:border-r border-[#1a2336] flex flex-col min-h-0 bg-[#0a0e17]">
          {/* Search & Filter Bar */}
          <div className="p-2.5 border-b border-[#1a2336] space-y-2 bg-[#0d121c]">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-500 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history by name, path, ID..."
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

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#1a253a] text-sky-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({history.length})
              </button>
              <button
                onClick={() => setStatusFilter('success')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  statusFilter === 'success'
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2xx OK
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  statusFilter === 'failed'
                    ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Errors
              </button>
            </div>
          </div>

          {/* List Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#162032]">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No audit records match the current filter.
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isSuccess = item.responseStatus >= 200 && item.responseStatus < 300;
                const timeStr = new Date(item.createdAt).toLocaleTimeString([], {
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
                        ? 'bg-[#152033] border-l-2 border-sky-400'
                        : 'hover:bg-[#101726]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={getMethodBadgeClass(item.method)}>
                          {item.method}
                        </span>
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#162032] text-slate-300 uppercase">
                          {item.environment}
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                          isSuccess
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/30'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/30'
                        }`}
                      >
                        {item.responseStatus}
                      </span>
                    </div>

                    <strong className="text-[12px] font-semibold text-slate-200 truncate block mt-0.5">
                      {item.requestName}
                    </strong>

                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {item.url}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>{timeStr}</span>
                      <span>{item.durationMs} ms</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Audit Inspector */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-[#070a0f] p-2.5 sm:p-4">
          {selectedItem ? (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1a2336]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={getMethodBadgeClass(selectedItem.method)}>
                      {selectedItem.method}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {selectedItem.requestName}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-sky-400 break-all block mt-0.5">
                    {selectedItem.url}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => onLoadIntoWorkbench(selectedItem)}
                    className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white gap-1.5 font-semibold cursor-pointer shadow-xs"
                  >
                    <RotateCcw size={13} />
                    <span>Load into Workbench</span>
                  </Button>
                </div>
              </div>

              {/* Status & Latency Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span
                  className={`px-2 py-0.5 rounded font-bold border ${
                    selectedItem.responseStatus >= 200 && selectedItem.responseStatus < 300
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40'
                      : 'bg-rose-950/60 text-rose-300 border-rose-700/40'
                  }`}
                >
                  HTTP {selectedItem.responseStatus} {selectedItem.responseStatusText}
                </span>
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Clock size={12} className="text-slate-500" />
                  <span>{selectedItem.durationMs} ms</span>
                </span>
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Activity size={12} className="text-slate-500" />
                  <span>{(selectedItem.payloadSize / 1024).toFixed(2)} KB</span>
                </span>
                <span className="text-slate-500 text-[11px] ml-auto">
                  {new Date(selectedItem.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Inspector Tabs */}
              <Tabs defaultValue="response" className="flex-1 flex flex-col min-h-0 pt-1">
                <TabsList className="bg-[#0c111c] border-b border-[#1a2336] justify-start rounded-none p-0 h-auto gap-4 px-3">
                  <TabsTrigger
                    value="response"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-400 data-[state=active]:bg-transparent data-[state=active]:text-sky-300 text-xs py-2 px-1 text-slate-400 font-medium cursor-pointer"
                  >
                    Response Body
                  </TabsTrigger>
                  <TabsTrigger
                    value="request"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-400 data-[state=active]:bg-transparent data-[state=active]:text-sky-300 text-xs py-2 px-1 text-slate-400 font-medium cursor-pointer"
                  >
                    Request Sent
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-400 data-[state=active]:bg-transparent data-[state=active]:text-sky-300 text-xs py-2 px-1 text-slate-400 font-medium cursor-pointer"
                  >
                    Headers
                  </TabsTrigger>
                  <TabsTrigger
                    value="meta"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-400 data-[state=active]:bg-transparent data-[state=active]:text-sky-300 text-xs py-2 px-1 text-slate-400 font-medium cursor-pointer"
                  >
                    Security & Metadata
                  </TabsTrigger>
                </TabsList>

                {/* Response Body Tab */}
                <TabsContent value="response" className="flex-1 overflow-y-auto p-3 m-0 bg-[#070a0f]">
                  <pre className="text-xs font-mono text-sky-200/95 whitespace-pre-wrap leading-relaxed select-text">
                    {selectedItem.responseBody || '// No response body'}
                  </pre>
                </TabsContent>

                {/* Request Sent Tab */}
                <TabsContent value="request" className="flex-1 overflow-y-auto p-3 m-0 space-y-3 bg-[#070a0f]">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                      Request Body
                    </span>
                    <pre className="p-2.5 rounded bg-[#0d121c] border border-[#1a2336] font-mono text-xs text-slate-300 whitespace-pre-wrap">
                      {selectedItem.requestBody || '// (Empty request body)'}
                    </pre>
                  </div>
                </TabsContent>

                {/* Headers Tab */}
                <TabsContent value="headers" className="flex-1 overflow-y-auto p-3 m-0 space-y-4 bg-[#070a0f]">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                      Response Headers
                    </span>
                    <div className="border border-[#1a2336] rounded overflow-x-auto">
                      <table className="w-full min-w-[520px] text-xs font-mono">
                        <tbody className="divide-y divide-[#1a2336]">
                          {Object.entries(selectedItem.responseHeaders || {}).map(([k, v]) => (
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
                  </div>
                </TabsContent>

                {/* Metadata Tab */}
                <TabsContent value="meta" className="flex-1 overflow-y-auto p-3 m-0 bg-[#070a0f]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-[#0d121c] border border-[#1a2336]">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Audit ID</span>
                      <strong className="font-mono text-sky-300 text-[11px] break-all">{selectedItem.requestId}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-[#0d121c] border border-[#1a2336]">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Environment</span>
                      <strong className="text-slate-200">{selectedItem.environment.toUpperCase()}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-[#0d121c] border border-[#1a2336]">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Signing Status</span>
                      <strong className="text-emerald-400">{selectedItem.signingStatus}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-[#0d121c] border border-[#1a2336]">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Execution Latency</span>
                      <strong className="text-slate-200">{selectedItem.durationMs} ms</strong>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
              <History size={24} className="mb-2 text-slate-600" />
              <p className="text-xs font-mono">Select a history entry from the list to inspect details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
