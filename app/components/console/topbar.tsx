'use client';

import React from 'react';
import {
  ShieldCheck,
  LogOut,
  ServerCog,
  AlertTriangle,
  Search,
  Sun,
  Moon,
  Monitor,
  Palette,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import type { Country, Environment, SafeConfig } from './types';

interface TopbarProps {
  countries: Country[];
  selectedCountry: string;
  onCountryChange: (slug: string) => void;
  environment: Environment;
  onEnvironmentChange: (env: Environment) => void;
  config: SafeConfig | null;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  } | null;
  onOpenStatus: () => void;
  onOpenCommandPalette?: () => void;
  gatewayLatencyMs?: number | null;
  theme: 'dark' | 'light' | 'system';
  onThemeChange: (theme: 'dark' | 'light' | 'system') => void;
}

function LatencyIndicator({ ms }: { ms: number | null | undefined }) {
  if (ms == null) {
    return (
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--surface-4)] border border-[var(--border)] text-xs text-slate-500">
        <Loader2 size={11} className="spin text-slate-500" />
        <span className="font-mono text-[10.5px]">Checking...</span>
      </div>
    );
  }

  const isGood = ms < 300;
  const isMid = ms < 1000;

  return (
    <div
      className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10.5px] font-mono transition-colors ${
        isGood
          ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
          : isMid
          ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
          : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
      }`}
      title={`Gateway latency: ${ms}ms`}
    >
      {isGood ? (
        <Wifi size={11} className="text-emerald-400 status-dot-live" />
      ) : isMid ? (
        <Wifi size={11} className="text-amber-400" />
      ) : (
        <WifiOff size={11} className="text-rose-400" />
      )}
      <span>{ms} ms</span>
    </div>
  );
}

function UserAvatar({ name, email, role }: { name?: string | null; email?: string | null; role?: string }) {
  const initials = name ? name.substring(0, 2).toUpperCase() : 'AP';
  return (
    <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-[var(--border)]">
      <div className="text-right hidden md:block leading-tight">
        <p className="text-[11.5px] font-semibold text-slate-200 leading-tight">
          {name || 'AssanPay Support'}
        </p>
        <p className="text-[9.5px] text-slate-500 font-mono truncate max-w-[140px]">
          {email || 'support@assanpay.com'}
        </p>
      </div>
      <div
        className="relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono select-none shrink-0 cursor-default"
        style={{
          background: 'linear-gradient(135deg, #1a2a4a 0%, #1e3461 100%)',
          boxShadow: '0 0 0 1.5px rgba(91,141,239,0.35), 0 0 8px rgba(91,141,239,0.12)',
          color: '#93b4f5',
        }}
        title={`${name} · ${role || 'support'}`}
      >
        {initials}
      </div>
    </div>
  );
}

export function Topbar({
  countries,
  selectedCountry,
  onCountryChange,
  environment,
  onEnvironmentChange,
  config,
  user,
  onOpenStatus,
  onOpenCommandPalette,
  gatewayLatencyMs,
  theme,
  onThemeChange,
}: TopbarProps) {
  const currentCountryObj = countries.find((c) => c.slug === selectedCountry);
  const currentEnvConfig = config?.[selectedCountry]?.[environment];
  const isConfigured = Boolean(currentEnvConfig?.configured);
  const isProduction = environment === 'production';

  return (
    <>
      {/* Production Live Warning — full-width strip above topbar */}
      {isProduction && (
        <div className="h-7 shrink-0 flex items-center justify-center gap-2 bg-amber-950/60 border-b border-amber-700/50 text-amber-200 text-xs font-semibold animate-fade-in z-40 select-none">
          <AlertTriangle size={12} className="text-amber-400 shrink-0 status-dot-live" />
          <span>LIVE ENVIRONMENT — Real transactions will be executed. Proceed with caution.</span>
        </div>
      )}

      <header className="h-[52px] shrink-0 border-b border-[var(--border)] flex items-center justify-between px-3 sm:px-4 gap-2 z-30 select-none inset-shadow"
        style={{ background: 'var(--topbar-bg)' }}>

        {/* Brand — always visible on all breakpoints */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{
              background: 'linear-gradient(135deg, #3a6fd8 0%, #5b8def 100%)',
              boxShadow: '0 2px 8px rgba(91,141,239,0.3)',
            }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-[13px] font-semibold tracking-tight text-foreground">AssanPay</span>
              <span className="text-[11px] text-muted-foreground font-normal">Console</span>
            </div>
            <div className="text-[9px] text-muted-foreground/80 font-mono tracking-wider uppercase mt-0.5">
              Developer API Workspace
            </div>
          </div>
        </div>

        {/* Center: Selectors */}
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
          {/* Country Selector */}
          <Select
            value={selectedCountry}
            onValueChange={(val) => { if (val) onCountryChange(val); }}
          >
            <SelectTrigger
              className="w-[120px] sm:w-[155px] xl:w-[175px] h-8 text-sm font-medium shadow-none focus:ring-1 focus:ring-[var(--primary)] transition-all bg-[var(--surface-4)] border-[var(--border)] text-foreground"
            >
              <SelectValue>
                {currentCountryObj ? (
                  <span className="flex items-center gap-1.5 w-full">
                    <span className="text-xs leading-none">{currentCountryObj.flagEmoji}</span>
                    <span className="font-medium truncate">{currentCountryObj.name}</span>
                    <span className="hidden xl:inline text-[10px] font-mono text-muted-foreground ml-auto">
                      {currentCountryObj.currency}
                    </span>
                  </span>
                ) : 'Select Market'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <SelectGroup>
                {countries.map((c) => (
                  <SelectItem
                    key={c.slug}
                    value={c.slug}
                    className="cursor-pointer text-foreground text-xs hover:bg-[var(--surface-4)] focus:bg-[var(--surface-4)]"
                  >
                    <span className="flex items-center gap-2 w-full">
                      <span className="text-sm leading-none">{c.flagEmoji}</span>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground ml-auto">({c.currency})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Environment Selector */}
          <Select
            value={environment}
            onValueChange={(val) => { if (val) onEnvironmentChange(val as Environment); }}
          >
            <SelectTrigger
              className={`w-[112px] sm:w-[132px] h-8 text-sm font-medium transition-all shadow-none focus:ring-1 ${
                isProduction
                  ? 'bg-amber-950/40 border-amber-600/60 text-amber-200 focus:ring-amber-500/60'
                  : 'bg-[var(--surface-4)] border-[var(--border)] text-foreground focus:ring-[var(--primary)]'
              }`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isProduction ? 'bg-amber-400 status-dot-live' : 'bg-emerald-400 status-dot-live'
                  }`}
                />
                <span className="text-xs sm:text-sm truncate">
                  {isProduction ? 'Production' : 'Sandbox'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <SelectGroup>
                <SelectItem value="sandbox" className="cursor-pointer text-foreground text-xs hover:bg-[var(--surface-4)] focus:bg-[var(--surface-4)]">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="font-medium">Sandbox (Mock Rails)</span>
                  </span>
                </SelectItem>
                <SelectItem value="production" className="cursor-pointer text-amber-200 text-xs hover:bg-amber-950/40 focus:bg-amber-950/40">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="font-bold">Production (Live Rails)</span>
                  </span>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Quick Search Button */}
          {onOpenCommandPalette && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCommandPalette}
              className="hidden md:flex h-8 gap-1.5 text-slate-400 hover:text-slate-200 border-[var(--border)] bg-[var(--surface-4)] hover:bg-[var(--surface-5)] transition-all"
              title="Search API Catalog & Commands (Ctrl+K)"
            >
              <Search size={13} />
              <span className="text-xs">Search</span>
              <Kbd className="text-[9px]">Ctrl K</Kbd>
            </Button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <LatencyIndicator ms={gatewayLatencyMs} />

          {/* Status Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenStatus}
            className="h-8 px-2 text-slate-400 hover:text-slate-200 hover:bg-[var(--surface-5)] flex items-center gap-1.5 transition-colors rounded-md"
            title="Environment Readiness Matrix"
          >
            <ServerCog size={13} className="text-sky-400" />
            <span className="hidden sm:inline text-xs font-medium">Status</span>
            {isConfigured && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-dot-live" />
            )}
          </Button>

          {/* Appearance Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-slate-200 hover:bg-[var(--surface-5)]" />}
              title="Appearance"
              aria-label="Choose appearance"
            >
              <Palette size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-3 rounded-xl shadow-xl animate-fade-in" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="mb-3 px-1">
                <p className="text-sm font-semibold text-foreground">Appearance</p>
                <p className="text-xs text-muted-foreground mt-0.5">Choose how the console looks.</p>
              </div>
              <ToggleGroup value={[theme]} onValueChange={(value) => value[0] && onThemeChange(value[0] as 'light' | 'dark' | 'system')} className="grid grid-cols-3">
                <ToggleGroupItem value="light"><Sun size={13} />Light</ToggleGroupItem>
                <ToggleGroupItem value="dark"><Moon size={13} />Dark</ToggleGroupItem>
                <ToggleGroupItem value="system"><Monitor size={13} />System</ToggleGroupItem>
              </ToggleGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User + Sign Out */}
          <UserAvatar name={user?.name} email={user?.email} role={user?.role} />

          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors ml-0.5"
            onClick={() => void signOut({ callbackUrl: '/login' })}
            title="Sign Out"
          >
            <LogOut size={13} />
          </Button>
        </div>
      </header>
    </>
  );
}
