'use client';

import React from 'react';
import {
  ShieldCheck,
  LogOut,
  ServerCog,
  Search,
  Sun,
  Moon,
  Monitor,
  Palette,
  Wifi,
  WifiOff,
  Loader2,
  PanelLeftOpen,
  PanelLeftClose,
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
import { SidebarTrigger } from '@/components/ui/sidebar';
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
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

function LatencyIndicator({ ms }: { ms: number | null | undefined }) {
  if (ms == null) {
    return (
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border text-xs text-muted-foreground">
        <Loader2 size={11} className="spin text-muted-foreground" />
        <span className="font-mono text-xs">Checking...</span>
      </div>
    );
  }

  const isGood = ms < 300;
  const isMid = ms < 1000;

  return (
    <div
      className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors ${
        isGood
          ? 'bg-success/10 border-success/25 text-success'
          : isMid
          ? 'bg-warning/10 border-warning/25 text-warning'
          : 'bg-destructive/10 border-destructive/25 text-destructive'
      }`}
      title={`Gateway latency: ${ms}ms`}
    >
      {isGood ? (
        <Wifi size={11} className="text-success" />
      ) : isMid ? (
        <Wifi size={11} className="text-warning" />
      ) : (
        <WifiOff size={11} className="text-destructive" />
      )}
      <span>{ms} ms</span>
    </div>
  );
}

function UserAvatar({ name, email, role }: { name?: string | null; email?: string | null; role?: string }) {
  const initials = name ? name.substring(0, 2).toUpperCase() : 'AP';
  return (
    <div className="hidden sm:flex items-center gap-2.5 pl-2.5 border-l border-border">
      <div className="text-right hidden lg:block leading-tight">
        <p className="text-xs font-semibold text-foreground leading-tight">
          {name || 'AssanPay Support'}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[150px]">
          {email || 'support@assanpay.com'}
        </p>
      </div>
      <div
        className="relative w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold select-none shrink-0 cursor-default bg-primary text-primary-foreground"
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
  config,
  user,
  onOpenStatus,
  onOpenCommandPalette,
  gatewayLatencyMs,
  theme,
  onThemeChange,
  sidebarCollapsed,
  onToggleSidebar,
}: TopbarProps) {
  const currentCountryObj = countries.find((c) => c.slug === selectedCountry);
  const currentEnvConfig = config?.[selectedCountry]?.[environment];
  const isConfigured = Boolean(currentEnvConfig?.configured);

  return (
    <>
      <header className="shrink-0 border-b border-[var(--border)] grid grid-cols-[1fr_auto] sm:flex sm:h-14 sm:items-center sm:justify-between px-2.5 sm:px-4 py-2 sm:py-0 gap-x-2 gap-y-2 z-30 select-none"
        style={{ background: 'var(--topbar-bg)' }}>

        {/* Brand — always visible on all breakpoints */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink-0">
          {/* Mobile nav trigger — opens the nav rail as a slide-over Sheet */}
          <SidebarTrigger className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground" />
          <div
            className="brand-mark w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-white shrink-0"
          >
            <ShieldCheck size={16} strokeWidth={2.4} />
          </div>
          <div className="hidden lg:block">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="text-sm font-bold tracking-tight text-foreground">AssanPay</span>
              <span className="text-[11px] text-muted-foreground font-medium">Console</span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground/60 mt-1">
              API Workspace
            </div>
          </div>
          {/* Catalog sidebar toggle — visible on all breakpoints */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[var(--surface-4)] border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer ml-1"
              title={sidebarCollapsed ? "Show collections sidebar" : "Hide collections sidebar"}
              aria-label={sidebarCollapsed ? "Show collections sidebar" : "Hide collections sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          )}
        </div>

        {/* Center: Selectors */}
        <div className="order-3 col-span-2 sm:order-none sm:col-span-1 flex items-center gap-2 min-w-0 sm:flex-1 justify-start sm:justify-center">
          {/* Country Selector */}
          <Select
            value={selectedCountry}
            onValueChange={(val) => { if (val) onCountryChange(val); }}
          >
            <SelectTrigger
              className="w-[120px] sm:w-[120px] lg:w-[155px] xl:w-[175px] h-8 text-sm font-medium shadow-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors bg-[var(--surface-4)] border-[var(--border)] text-foreground px-2 sm:px-3"
            >
              <SelectValue>
                {currentCountryObj ? (
                  <span className="flex items-center gap-1.5 w-full">
                    <span className="text-xs leading-none">{currentCountryObj.flagEmoji}</span>
                    <span className="hidden min-[400px]:inline font-medium truncate">{currentCountryObj.name}</span>
                    <span className="hidden xl:inline text-[11px] font-mono text-muted-foreground ml-auto">
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
                      <span className="text-[11px] font-mono text-muted-foreground ml-auto">({c.currency})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Environment Badge — sandbox only */}
          <div
            className="h-8 px-2 sm:px-3 flex items-center gap-1.5 rounded-md bg-[var(--surface-4)] border border-[var(--border)] select-none"
            title="Sandbox environment (Mock Rails)"
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Sandbox</span>
          </div>

          {/* Quick Search Button */}
          {onOpenCommandPalette && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCommandPalette}
              className="hidden md:flex h-8 gap-1.5 text-muted-foreground hover:text-foreground border-[var(--border)] bg-[var(--surface-4)] hover:bg-[var(--surface-5)] transition-colors rounded-md px-2 lg:px-3"
              title="Search API Catalog & Commands (Ctrl+K)"
            >
              <Search size={13} />
              <span className="hidden lg:inline text-xs">Search</span>
              <Kbd className="hidden lg:inline-flex text-[11px]">Ctrl K</Kbd>
            </Button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-1 shrink-0">
          <LatencyIndicator ms={gatewayLatencyMs} />

          {/* Status Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenStatus}
            className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-5)] flex items-center gap-1.5 transition-colors rounded-md"
            title="Environment Readiness Matrix"
          >
            <ServerCog size={13} className="text-primary" />
            <span className="hidden lg:inline text-xs font-medium">Status</span>
            {isConfigured && (
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
            )}
          </Button>

          {/* Appearance Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground hover:bg-[var(--surface-5)]" />}
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
            className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5"
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
