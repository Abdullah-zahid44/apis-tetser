'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/console/topbar';
import { NavRail } from '@/components/console/nav-rail';
import { Sidebar } from '@/components/console/sidebar';
import { Workbench } from '@/components/console/workbench';
import { ResponsePanel } from '@/components/console/response-panel';
import { CallbackInbox } from '@/components/console/callback-inbox';
import { HistoryView } from '@/components/console/history-view';
import { EnvironmentStatusView } from '@/components/console/environment-status';
import { MoneyConfirmModal } from '@/components/console/money-confirm-modal';
import { CommandPalette } from '@/components/console/command-palette';
import { autoRefreshPayloadIdentifiers } from '@/lib/variables/resolver';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Layers,
  Code2,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import type {
  Method,
  Environment,
  View,
  Country,
  Endpoint,
  SavedRequestItem,
  HistoryItem,
  ParamRow,
  HeaderRow,
  ExecutionResult,
  SafeConfig,
} from '@/components/console/types';

export default function ConsoleDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Navigation & Environment State
  const [view, setView] = useState<View>('workbench');
  const [selectedCountry, setSelectedCountry] = useState<string>('pkr');
  const [environment, setEnvironment] = useState<Environment>('sandbox');

  // Loaded Catalog & Records
  const [countries, setCountries] = useState<Country[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [savedRequests, setSavedRequests] = useState<SavedRequestItem[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [config, setConfig] = useState<SafeConfig | null>(null);
  const [gatewayLatencyMs, setGatewayLatencyMs] = useState<number | null>(null);

  // Workbench Current Request State
  const [selectedId, setSelectedId] = useState<string>('');
  const [requestName, setRequestName] = useState<string>('H2H Payin API (Async)');
  const [method, setMethod] = useState<Method>('POST');
  const [url, setUrl] = useState<string>('/api/payments');
  const [body, setBody] = useState<string>('');
  const [paramRows, setParamRows] = useState<ParamRow[]>([]);
  const [headerRows, setHeaderRows] = useState<HeaderRow[]>([]);
  const [requiresSignature, setRequiresSignature] = useState<boolean>(true);
  const [isMoneyMovement, setIsMoneyMovement] = useState<boolean>(false);

  // Execution & Persistence UI State
  const [search, setSearch] = useState<string>('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [dirty, setDirty] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string>('');
  const [loadedHistoryId, setLoadedHistoryId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('light');

  // Responsive mobile active pane (for screens < 768px)
  const [mobilePane, setMobilePane] = useState<'catalog' | 'workbench' | 'response'>('workbench');

  // 1. Authentication guard
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 2. Load last selected country from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('assanpay_last_country');
      if (saved) setSelectedCountry(saved);
      const savedTheme = localStorage.getItem('assanpay_theme');
      const nextTheme = savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system' ? savedTheme : 'light';
      setTheme(nextTheme);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark = theme === 'system' ? media.matches : theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('light', !isDark);
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  const handleThemeChange = (nextTheme: 'dark' | 'light' | 'system') => {
    setTheme(nextTheme);
    localStorage.setItem('assanpay_theme', nextTheme);
  };

  // 3. Fetch countries list
  const fetchCountries = useCallback(async () => {
    try {
      const res = await fetch('/api/countries');
      if (res.ok) {
        const data = (await res.json()) as { countries?: Country[] };
        if (data.countries && data.countries.length > 0) {
          setCountries(data.countries);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // 4. Fetch safe environment readiness config
  const fetchConfig = useCallback(async () => {
    const startedAt = Date.now();
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = (await res.json()) as { environments?: SafeConfig };
        if (data.environments) {
          setConfig(data.environments);
        }
      }
      setGatewayLatencyMs(Date.now() - startedAt);
    } catch {
      setGatewayLatencyMs(null);
    }
  }, []);

  // 5. Fetch endpoints for selected country
  const fetchEndpoints = useCallback(async (countrySlug: string) => {
    try {
      const res = await fetch(`/api/endpoints?country=${countrySlug}`);
      if (res.ok) {
        const data = (await res.json()) as { endpoints?: Endpoint[] };
        const list = data.endpoints || [];
        setEndpoints(list);

        // Select the first endpoint as default if none selected
        if (list.length > 0) {
          const first = list[0];
          setSelectedId(first.id);
          setRequestName(first.name);
          setMethod(first.method);
          setUrl(first.path);
          setBody(autoRefreshPayloadIdentifiers(first.defaultBody || ''));
          setRequiresSignature(first.requiresSignature);
          setIsMoneyMovement(first.isMoneyMovement || false);
          setDirty(false);
          setResult(null);

          // Populate query params if defaultQuery exists
          if (first.defaultQuery && Object.keys(first.defaultQuery).length > 0) {
            setParamRows(
              Object.entries(first.defaultQuery).map(([k, v], idx) => ({
                id: `init-p-${idx}`,
                enabled: true,
                key: k,
                value: v,
              }))
            );
          } else {
            setParamRows([]);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // 6. Fetch saved requests
  const fetchSavedRequests = useCallback(async (env: string) => {
    try {
      const res = await fetch(`/api/saved-requests?environment=${env}`);
      if (res.ok) {
        const data = (await res.json()) as { requests?: SavedRequestItem[] };
        setSavedRequests(data.requests || []);
      }
    } catch {
      // ignore
    }
  }, []);

  // 7. Fetch history items
  const fetchHistory = useCallback(async (env: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/history?environment=${env}&limit=100`);
      if (res.ok) {
        const data = (await res.json()) as { history?: HistoryItem[] };
        setHistoryItems(data.history || []);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    if (status === 'authenticated') {
      void fetchCountries();
      void fetchConfig();
      void fetchSavedRequests(environment);
      void fetchHistory(environment);
    }
  }, [status, fetchCountries, fetchConfig, fetchSavedRequests, fetchHistory, environment]);

  // Load endpoints when country changes
  useEffect(() => {
    if (status === 'authenticated' && selectedCountry) {
      void fetchEndpoints(selectedCountry);
    }
  }, [status, selectedCountry, fetchEndpoints]);

  // Handle Country Change
  const handleCountryChange = (slug: string) => {
    setSelectedCountry(slug);
    if (typeof window !== 'undefined') {
      localStorage.setItem('assanpay_last_country', slug);
    }
    setSearch('');
    setResult(null);
    setLoadedHistoryId(null);
  };

  // Select Built-in Endpoint
  const handleSelectEndpoint = (ep: Endpoint) => {
    setSelectedId(ep.id);
    setRequestName(ep.name);
    setMethod(ep.method);
    setUrl(ep.path);
    setBody(ep.defaultBody || '');
    setRequiresSignature(ep.requiresSignature);
    setIsMoneyMovement(ep.isMoneyMovement || false);
    setResult(null);
    setDirty(false);
    setLoadedHistoryId(null);
    setMobilePane('workbench');

    if (ep.defaultQuery && Object.keys(ep.defaultQuery).length > 0) {
      setParamRows(
        Object.entries(ep.defaultQuery).map(([k, v], idx) => ({
          id: `ep-p-${idx}`,
          enabled: true,
          key: k,
          value: v,
        }))
      );
    } else {
      setParamRows([]);
    }
  };

  // Select Saved Request
  const handleSelectSaved = (saved: SavedRequestItem) => {
    setSelectedId(`saved-${saved.id}`);
    setRequestName(saved.name);
    setMethod(saved.method);
    setUrl(saved.relativeUrl);
    setBody(saved.requestBody || '');
    setResult(null);
    setDirty(false);
    setLoadedHistoryId(null);
    setMobilePane('workbench');

    if (saved.queryParams && Object.keys(saved.queryParams).length > 0) {
      setParamRows(
        Object.entries(saved.queryParams).map(([k, v], idx) => ({
          id: `saved-p-${idx}`,
          enabled: true,
          key: k,
          value: v,
        }))
      );
    } else {
      setParamRows([]);
    }

    if (saved.headers && Object.keys(saved.headers).length > 0) {
      setHeaderRows(
        Object.entries(saved.headers).map(([k, v], idx) => ({
          id: `saved-h-${idx}`,
          enabled: true,
          key: k,
          value: v,
        }))
      );
    } else {
      setHeaderRows([]);
    }
  };

  // Delete Saved Request
  const handleDeleteSaved = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-requests?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchSavedRequests(environment);
      }
    } catch {
      // ignore
    }
  };

  // Duplicate Saved Request
  const handleDuplicateSaved = async (saved: SavedRequestItem) => {
    try {
      const res = await fetch('/api/saved-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${saved.name} (Copy)`,
          country: selectedCountry,
          environment,
          method: saved.method,
          relativeUrl: saved.relativeUrl,
          queryParams: saved.queryParams,
          headers: saved.headers,
          requestBody: saved.requestBody,
        }),
      });

      if (res.ok) {
        await fetchSavedRequests(environment);
      }
    } catch {
      // ignore
    }
  };

  // Load from History
  const handleLoadIntoWorkbench = (item: HistoryItem) => {
    setSelectedId(`history-${item.id}`);
    setRequestName(item.requestName);
    setMethod(item.method);
    setUrl(item.url);
    setBody(item.requestBody || '');
    setLoadedHistoryId(item.id);
    setDirty(false);
    setView('workbench');
    setMobilePane('workbench');

    setResult({
      ok: item.responseStatus >= 200 && item.responseStatus < 300,
      upstream: {
        status: item.responseStatus,
        statusText: item.responseStatusText,
        headers: item.responseHeaders || {},
        body: tryParseJson(item.responseBody),
        rawBody: item.responseBody,
      },
      request: {
        method: item.method,
        url: item.url,
        headers: item.requestHeaders || {},
        body: tryParseJson(item.requestBody),
      },
      meta: {
        country: selectedCountry,
        environment: item.environment,
        durationMs: item.durationMs,
        responseSize: item.payloadSize,
        requestId: item.requestId,
        signed: item.signingStatus === 'signed',
        encrypted: false,
        decrypted: false,
        executedAt: item.createdAt,
      },
      error:
        item.responseStatus >= 200 && item.responseStatus < 300
          ? undefined
          : {
              type: item.errorType || 'ERROR',
              message: item.errorMessage || `HTTP ${item.responseStatus}`,
            },
    });
  };

  // Send request execution logic
  const handleTriggerSend = () => {
    const looksLikeMoneyMovement = method !== 'GET' && /\/(payments|wallet-payouts|checkout\/sessions)(\/|$)/i.test(url.split('?')[0]);
    if (isMoneyMovement || looksLikeMoneyMovement) {
      setIsConfirmModalOpen(true);
      return;
    }
    void executeActiveRequest();
  };

  const executeActiveRequest = async () => {
    setRunning(true);
    setResult(null);
    setMobilePane('response');

    // Prepare query params map
    const qp: Record<string, string> = {};
    paramRows
      .filter((p) => p.enabled && p.key.trim())
      .forEach((p) => {
        qp[p.key.trim()] = p.value;
      });

    // Prepare custom headers map
    const customH: Record<string, string> = {};
    headerRows
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => {
        customH[h.key.trim()] = h.value;
      });

    // Auto-refresh static hardcoded orderId on send if not using {{orderId}} variable
    let payloadBody = method === 'GET' ? undefined : body;
    if (payloadBody && !url.includes('/status-inquiry')) {
      if (!payloadBody.includes('{{orderId}}')) {
        const refreshed = autoRefreshPayloadIdentifiers(payloadBody, { forceRefreshOrderId: true });
        if (refreshed !== payloadBody) {
          payloadBody = refreshed;
          setBody(refreshed);
        }
      }
    }

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: selectedCountry,
          environment,
          method,
          relativePath: url.trim(),
          queryParams: Object.keys(qp).length > 0 ? qp : undefined,
          headers: Object.keys(customH).length > 0 ? customH : undefined,
          body: payloadBody,
          requestName: requestName.trim(),
          requiresSignature,
        }),
      });

      const payload = (await res.json()) as ExecutionResult;
      setResult(payload);
    } catch (err) {
      setResult({
        ok: false,
        upstream: {
          status: 500,
          statusText: 'Internal Client Error',
          headers: {},
          body: { error: err instanceof Error ? err.message : 'Execution failed' },
          rawBody: JSON.stringify({
            error: err instanceof Error ? err.message : 'Execution failed',
          }),
        },
        request: {
          method,
          url,
          headers: customH,
          body,
        },
        meta: {
          country: selectedCountry,
          environment,
          durationMs: 0,
          responseSize: 0,
          requestId: `err-${Date.now()}`,
          signed: false,
          encrypted: false,
          decrypted: false,
          executedAt: new Date().toISOString(),
        },
        error: {
          type: 'CLIENT_ERROR',
          message: err instanceof Error ? err.message : 'Client execution error.',
        },
      });
    } finally {
      setRunning(false);
      void fetchHistory(environment);
    }
  };

  // Save current request
  const handleSaveRequest = async () => {
    if (!requestName.trim() || !url.trim()) return;
    setSaving(true);

    const qp: Record<string, string> = {};
    paramRows
      .filter((p) => p.enabled && p.key.trim())
      .forEach((p) => {
        qp[p.key.trim()] = p.value;
      });

    const hd: Record<string, string> = {};
    headerRows
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => {
        hd[h.key.trim()] = h.value;
      });

    try {
      const res = await fetch('/api/saved-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: requestName.trim(),
          country: selectedCountry,
          environment,
          method,
          relativeUrl: url.trim(),
          queryParams: qp,
          headers: hd,
          requestBody: body,
        }),
      });

      if (res.ok) {
        setDirty(false);
        setSavedMessage('Saved to Collection');
        setTimeout(() => setSavedMessage(''), 1800);
        await fetchSavedRequests(environment);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  // Global Keyboard Shortcuts (Ctrl/Cmd + Enter to Send, Ctrl/Cmd + S to Save, Ctrl/Cmd + K for command palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleTriggerSend();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        void handleSaveRequest();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const views: View[] = ['workbench', 'history', 'callbacks', 'status'];
        setView(views[Number(e.key) - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerSend, handleSaveRequest]);

  const currentCountryObj = countries.find((c) => c.slug === selectedCountry);

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium tracking-tight text-foreground">Verifying AssanPay Session...</span>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider className="h-dvh min-h-0 overflow-hidden select-none" style={{ '--sidebar-width': '15rem' } as React.CSSProperties}>
      <NavRail
        view={view}
        onViewChange={setView}
        historyCount={historyItems.length}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <SidebarInset className="min-w-0 overflow-hidden">
        <Topbar
          countries={countries}
          selectedCountry={selectedCountry}
          onCountryChange={handleCountryChange}
          environment={environment}
          config={config}
          user={session?.user}
          onOpenStatus={() => setView('status')}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          gatewayLatencyMs={gatewayLatencyMs}
          theme={theme}
          onThemeChange={handleThemeChange}
        />

        {/* Main Workspace Frame */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* View Router */}
        {view === 'workbench' && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {/* Mobile Segmented Pane Switcher (< 768px) — shadcn Tabs */}
            <Tabs
              value={mobilePane}
              onValueChange={(value) => value && setMobilePane(value as 'catalog' | 'workbench' | 'response')}
              className="md:hidden mx-2 mt-2 shrink-0"
            >
              <TabsList className="grid w-full grid-cols-3 h-10 bg-muted border border-border rounded-full p-1">
                <TabsTrigger value="catalog" className="min-w-0 px-1 text-[11px] sm:text-sm gap-1 sm:gap-1.5 rounded-full data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm">
                  <Layers size={14} className="hidden sm:block" />Collections
                </TabsTrigger>
                <TabsTrigger value="workbench" className="min-w-0 px-1 text-[11px] sm:text-sm gap-1 sm:gap-1.5 rounded-full data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm">
                  <Code2 size={14} className="hidden sm:block" />Request
                </TabsTrigger>
                <TabsTrigger value="response" className="min-w-0 px-1 text-[11px] sm:text-sm gap-1 sm:gap-1.5 rounded-full data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm">
                  <Activity size={14} className="hidden sm:block" />Response{result ? ` (${result.upstream.status})` : ''}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Desktop: collections + vertically split request/response workspace */}
            <div className="hidden md:flex flex-1 h-full min-h-0 min-w-0 overflow-hidden px-3 pt-2 pb-3 gap-3 bg-background">
              {/* Collapsible Left Catalog Sidebar - Fixed 280px width so it never squishes */}
              {!sidebarCollapsed && (
                <div className="w-[296px] shrink-0 h-full min-h-0 border border-border bg-card rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
                  <Sidebar
                    countryCode={selectedCountry}
                    countryName={currentCountryObj?.name || 'Pakistan'}
                    endpoints={endpoints}
                    savedRequests={savedRequests}
                    selectedId={selectedId}
                    search={search}
                    onSearchChange={setSearch}
                    onSelectEndpoint={handleSelectEndpoint}
                    onSelectSaved={handleSelectSaved}
                    onDeleteSaved={handleDeleteSaved}
                    onDuplicateSaved={handleDuplicateSaved}
                    onToggleCollapse={() => setSidebarCollapsed(true)}
                  />
                </div>
              )}

              {/* Postman-style vertical flow: compose above, inspect below */}
              <div className="flex-1 h-full min-h-0 min-w-0 border border-border bg-card rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
                <ResizablePanelGroup orientation="vertical" className="w-full h-full">
                  {/* Panel: Request Workbench */}
                  <ResizablePanel defaultSize={62} minSize={36} id="workbench-panel">
                    <Workbench
                      countrySlug={selectedCountry}
                      environment={environment}
                      name={requestName}
                      method={method}
                      onMethodChange={(val) => {
                        setMethod(val);
                        setDirty(true);
                      }}
                      url={url}
                      onUrlChange={(val) => {
                        setUrl(val);
                        setDirty(true);
                      }}
                      body={body}
                      onBodyChange={(val) => {
                        setBody(val);
                        setDirty(true);
                      }}
                      paramRows={paramRows}
                      onParamRowsChange={(rows) => {
                        setParamRows(rows);
                        setDirty(true);
                      }}
                      headerRows={headerRows}
                      onHeaderRowsChange={(rows) => {
                        setHeaderRows(rows);
                        setDirty(true);
                      }}
                      onSend={handleTriggerSend}
                      onSave={() => void handleSaveRequest()}
                      running={running}
                      saving={saving}
                      dirty={dirty}
                      savedMessage={savedMessage}
                      loadedHistoryId={loadedHistoryId}
                      config={config}
                      requiresSignature={requiresSignature}
                      sidebarCollapsed={sidebarCollapsed}
                      onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
                    />
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Panel: Response Inspector */}
                  <ResizablePanel defaultSize={38} minSize={20} id="response-panel">
                    <ResponsePanel
                      countrySlug={selectedCountry}
                      result={result}
                      running={running}
                      loadedHistoryId={loadedHistoryId}
                      onClear={() => {
                        setResult(null);
                        setLoadedHistoryId(null);
                      }}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </div>

            {/* Mobile (< 768px) Single Active Pane */}
            <div className="md:hidden flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
              {mobilePane === 'catalog' && (
                <Sidebar
                  countryCode={selectedCountry}
                  countryName={currentCountryObj?.name || 'Pakistan'}
                  endpoints={endpoints}
                  savedRequests={savedRequests}
                  selectedId={selectedId}
                  search={search}
                  onSearchChange={setSearch}
                  onSelectEndpoint={handleSelectEndpoint}
                  onSelectSaved={handleSelectSaved}
                  onDeleteSaved={handleDeleteSaved}
                  onDuplicateSaved={handleDuplicateSaved}
                />
              )}

              {mobilePane === 'workbench' && (
                <Workbench
                  countrySlug={selectedCountry}
                  environment={environment}
                  name={requestName}
                  method={method}
                  onMethodChange={(val) => {
                    setMethod(val);
                    setDirty(true);
                  }}
                  url={url}
                  onUrlChange={(val) => {
                    setUrl(val);
                    setDirty(true);
                  }}
                  body={body}
                  onBodyChange={(val) => {
                    setBody(val);
                    setDirty(true);
                  }}
                  paramRows={paramRows}
                  onParamRowsChange={(rows) => {
                    setParamRows(rows);
                    setDirty(true);
                  }}
                  headerRows={headerRows}
                  onHeaderRowsChange={(rows) => {
                    setHeaderRows(rows);
                    setDirty(true);
                  }}
                  onSend={handleTriggerSend}
                  onSave={() => void handleSaveRequest()}
                  running={running}
                  saving={saving}
                  dirty={dirty}
                  savedMessage={savedMessage}
                  loadedHistoryId={loadedHistoryId}
                  config={config}
                  requiresSignature={requiresSignature}
                />
              )}

              {mobilePane === 'response' && (
                <ResponsePanel
                  countrySlug={selectedCountry}
                  result={result}
                  running={running}
                  loadedHistoryId={loadedHistoryId}
                  onClear={() => {
                    setResult(null);
                    setLoadedHistoryId(null);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {view === 'history' && (
          <HistoryView
            history={historyItems}
            onLoadIntoWorkbench={handleLoadIntoWorkbench}
            onRefresh={() => void fetchHistory(environment)}
            loading={historyLoading}
          />
        )}

        {view === 'callbacks' && (
          <CallbackInbox
            countrySlug={selectedCountry}
            environment={environment}
          />
        )}

        {view === 'status' && (
          <EnvironmentStatusView
            countries={countries}
            config={config}
            onBackToWorkbench={() => setView('workbench')}
          />
        )}
        </div>
      </SidebarInset>

      {/* Global Command Palette Dialog */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        countries={countries}
        endpoints={endpoints}
        selectedCountry={selectedCountry}
        onCountryChange={handleCountryChange}
        environment={environment}
        onViewChange={setView}
        onSelectEndpoint={handleSelectEndpoint}
      />

      {/* Payout Confirmation Safety Modal */}
      <MoneyConfirmModal
        isOpen={isConfirmModalOpen}
        endpointName={requestName}
        method={method}
        url={url}
        country={selectedCountry}
        environment={environment}
        onConfirm={() => {
          setIsConfirmModalOpen(false);
          void executeActiveRequest();
        }}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </SidebarProvider>
  );
}

function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

