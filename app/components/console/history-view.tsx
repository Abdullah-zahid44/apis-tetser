'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
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
  const [mobileSection, setMobileSection] = useState<'list' | 'detail'>('list');
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
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-background select-none">
      {/* Top Header */}
      <div className="min-h-12 px-3 sm:px-4 py-2 bg-card border-b border-border flex items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
            <History size={16} className="text-primary" />
            <span>History</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-7 text-xs bg-card border-border hover:bg-muted text-secondary-foreground gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'spin text-primary' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Split Workstation Panes */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Side: History Item List */}
        <div className={`${mobileSection === 'detail' ? 'hidden md:flex' : 'flex'} w-full md:w-96 h-full md:h-auto shrink-0 border-b md:border-b-0 md:border-r border-border flex-col min-h-0 bg-card`}>
          {/* Search & Filter Bar */}
          <div className="p-2.5 border-b border-border space-y-2 bg-card">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history by name, path, ID..."
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

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-accent text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({history.length})
              </button>
              <button
                onClick={() => setStatusFilter('success')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  statusFilter === 'success'
                    ? 'bg-success/10 text-success border border-success/25 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                2xx OK
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  statusFilter === 'failed'
                    ? 'bg-destructive/10 text-destructive border border-destructive/25 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Errors
              </button>
            </div>
          </div>

          {/* List Scroll */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <History size={20} />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm">No audit records</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    No matching requests.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
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
                    onClick={() => { setSelectedId(item.id); setMobileSection('detail'); }}
                    className={`w-full text-left p-2.5 transition-colors duration-150 flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-accent border-l-2 border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={getMethodBadgeClass(item.method)}>
                          {item.method}
                        </span>
                        <span className="text-xs font-mono px-1 py-0.5 rounded bg-muted text-secondary-foreground uppercase">
                          {item.environment}
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-xs font-bold ${
                          isSuccess
                            ? 'bg-success/10 text-success border border-success/25'
                            : 'bg-destructive/10 text-destructive border border-destructive/25'
                        }`}
                      >
                        {item.responseStatus}
                      </span>
                    </div>

                    <strong className="text-xs font-semibold text-foreground truncate block mt-0.5">
                      {item.requestName}
                    </strong>

                    <div className="text-xs font-mono text-muted-foreground truncate">
                      {item.url}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mt-0.5">
                      <span>{timeStr}</span>
                      <span>{item.durationMs} ms</span>
                    </div>
                  </button>
                );
              })
            )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Detailed Audit Inspector */}
        <div className={`${mobileSection === 'detail' ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0 min-w-0 overflow-hidden bg-background p-2.5 sm:p-4`}>
          {selectedItem ? (
            <div className="flex-1 flex flex-col min-h-0 min-w-0 space-y-3">
              <Button variant="ghost" size="sm" onClick={() => setMobileSection('list')} className="md:hidden self-start h-8 gap-1 text-muted-foreground">
                <ArrowLeft size={14} /> Back to history
              </Button>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={getMethodBadgeClass(selectedItem.method)}>
                      {selectedItem.method}
                    </span>
                    <h3 className="text-sm font-bold text-foreground break-words min-w-0">
                      {selectedItem.requestName}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-primary break-all block mt-0.5">
                    {selectedItem.url}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => onLoadIntoWorkbench(selectedItem)}
                    className="h-8 text-xs bg-primary hover:bg-primary text-primary-foreground gap-1.5 font-semibold cursor-pointer shadow-xs w-full sm:w-auto"
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
                      ? 'bg-success/10 text-success border-success/25'
                      : 'bg-destructive/10 text-destructive border-destructive/25'
                  }`}
                >
                  HTTP {selectedItem.responseStatus} {selectedItem.responseStatusText}
                </span>
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <Clock size={12} className="text-muted-foreground" />
                  <span>{selectedItem.durationMs} ms</span>
                </span>
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <Activity size={12} className="text-muted-foreground" />
                  <span>{(selectedItem.payloadSize / 1024).toFixed(2)} KB</span>
                </span>
                <span className="text-muted-foreground text-[11px] ml-auto">
                  {new Date(selectedItem.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Inspector Tabs */}
              <Tabs defaultValue="response" className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden pt-1">
                <TabsList className="console-scroll-tabs w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden bg-card border-b border-border justify-start rounded-none p-0 h-auto gap-4 px-3">
                  <TabsTrigger
                    value="response"
                    className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-xs py-2 px-1 text-muted-foreground font-medium cursor-pointer"
                  >
                    Response Body
                  </TabsTrigger>
                  <TabsTrigger
                    value="request"
                    className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-xs py-2 px-1 text-muted-foreground font-medium cursor-pointer"
                  >
                    Request Sent
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-xs py-2 px-1 text-muted-foreground font-medium cursor-pointer"
                  >
                    Headers
                  </TabsTrigger>
                  <TabsTrigger
                    value="meta"
                    className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-xs py-2 px-1 text-muted-foreground font-medium cursor-pointer"
                  >
                    Security & Metadata
                  </TabsTrigger>
                </TabsList>

                {/* Response Body Tab */}
                <TabsContent value="response" className="flex-1 min-w-0 overflow-auto p-3 m-0 bg-background">
                  <pre className="text-xs font-mono text-primary/90 whitespace-pre-wrap break-all leading-relaxed select-text">
                    {selectedItem.responseBody || '// No response body'}
                  </pre>
                </TabsContent>

                {/* Request Sent Tab */}
                <TabsContent value="request" className="flex-1 overflow-y-auto p-3 m-0 space-y-3 bg-background">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                      Request Body
                    </span>
                    <pre className="p-2.5 rounded bg-card border border-border font-mono text-xs text-secondary-foreground whitespace-pre-wrap break-all">
                      {selectedItem.requestBody || '// (Empty request body)'}
                    </pre>
                  </div>
                </TabsContent>

                {/* Headers Tab */}
                <TabsContent value="headers" className="flex-1 overflow-y-auto p-3 m-0 space-y-4 bg-background">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground block mb-1">
                      Response Headers
                    </span>
                    <div className="border border-border rounded-lg overflow-x-auto">
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
                <TabsContent value="meta" className="flex-1 overflow-y-auto p-3 m-0 bg-background">
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
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
              <History size={24} className="mb-2 text-muted-foreground" />
              <p className="text-xs font-mono">Select a history entry from the list to inspect details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
