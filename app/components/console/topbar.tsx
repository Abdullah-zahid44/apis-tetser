'use client';

import React from 'react';
import Image from 'next/image';
import {
  Bell,
  LogOut,
  ServerCog,
  Search,
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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { signOut } from 'next-auth/react';
import { AssanPayLogo } from './assanpay-logo';
import { InstallAppButton } from './install-app-button';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';
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
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
        <Loader2 size={11} className="spin text-muted-foreground" />
        <span className="font-mono text-xs">Checking...</span>
      </div>
    );
  }

  const isGood = ms < 300;
  const isMid = ms < 1000;

  return (
    <div
      className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono transition-colors ${
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
      <span className="tabular-nums">{ms} ms</span>
    </div>
  );
}

function UserAvatar({ name, email, role }: { name?: string | null; email?: string | null; role?: string }) {
  const initials = name ? name.substring(0, 2).toUpperCase() : 'AP';
  return (
    <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-border bg-card/80 px-2.5 py-1.5 shadow-[var(--shadow-card)]">
      <div className="text-right hidden lg:block leading-tight">
        <p className="text-xs font-semibold text-foreground leading-tight">
          {name || 'AssanPay Support'}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[150px]">
          {email || 'support@assanpay.com'}
        </p>
      </div>
      <div
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold select-none shrink-0 cursor-default bg-[linear-gradient(135deg,#4e72a8,#183c73)] text-white"
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
      <header className="shrink-0 border-b border-[var(--border)] grid grid-cols-[1fr_auto] sm:flex sm:h-[72px] sm:items-center sm:justify-between px-3 sm:px-6 py-2.5 sm:py-0 gap-x-3 gap-y-2.5 z-30 select-none backdrop-blur-xl"
        style={{ background: 'var(--topbar-bg)' }}>

        {/* Brand — always visible on all breakpoints */}
        <div className="flex md:hidden items-center gap-1 sm:gap-2 min-w-0 shrink-0">
          {/* Mobile nav trigger — opens the nav rail as a slide-over Sheet */}
          <SidebarTrigger className="md:hidden h-10 w-10 text-muted-foreground hover:text-foreground" />
          <AssanPayLogo showWordmark={false} />
          {/* Catalog sidebar toggle — visible on all breakpoints */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent transition-colors cursor-pointer ml-1"
              title={sidebarCollapsed ? "Show collections sidebar" : "Hide collections sidebar"}
              aria-label={sidebarCollapsed ? "Show collections sidebar" : "Hide collections sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          )}
        </div>

        {/* Desktop navigation toggle — remains visible when the rail is collapsed. */}
        <div className="hidden md:flex shrink-0 items-center">
          <SidebarTrigger
            className="h-10 w-10 rounded-xl border border-border bg-card text-muted-foreground shadow-[0_2px_8px_rgba(15,45,82,0.05)] hover:border-primary/25 hover:bg-accent hover:text-primary"
            title="Toggle navigation sidebar"
            aria-label="Toggle navigation sidebar"
          />
        </div>

        {/* Center: Selectors */}
        <div className="order-3 col-span-2 sm:order-none sm:col-span-1 flex items-center gap-3 min-w-0 sm:flex-1 justify-start sm:justify-center">
          {/* Country Selector */}
          <Select
            value={selectedCountry}
            onValueChange={(val) => { if (val) onCountryChange(val); }}
          >
            <SelectTrigger
              className="group/market relative h-12 w-[200px] overflow-hidden !rounded-2xl border border-slate-200/90 bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_100%)] py-0 pl-3 pr-11 text-sm text-foreground shadow-[0_5px_16px_rgba(15,45,82,0.08)] transition-all duration-200 after:absolute after:bottom-2.5 after:right-9 after:top-2.5 after:w-px after:bg-slate-200/90 hover:-translate-y-px hover:border-primary/30 hover:shadow-[0_8px_22px_rgba(15,45,82,0.12)] focus-visible:ring-2 focus-visible:ring-primary/20 sm:w-[226px] lg:w-[238px] [&>svg:last-child]:absolute [&>svg:last-child]:right-3 [&>svg:last-child]:size-4 [&>svg:last-child]:text-slate-500 [&>svg:last-child]:transition-transform [&[data-popup-open]>svg:last-child]:rotate-180"
            >
              <SelectValue>
                {currentCountryObj ? (
                  <span className="flex w-full min-w-0 items-center gap-3">
                    <span className="flex w-9 shrink-0 items-center justify-start">
                      <Image
                        src={`/flags/${currentCountryObj.slug}.svg`}
                        alt={`${currentCountryObj.name} flag`}
                        width={32}
                        height={22}
                        className="h-[22px] w-8 rounded-[3px] border border-slate-200 object-cover shadow-[0_2px_6px_rgba(15,45,82,0.14)]"
                      />
                    </span>
                    <span className="min-w-0 flex-1 text-left leading-none">
                      <span className="block truncate text-[13px] font-bold tracking-[-0.01em] text-slate-900">{currentCountryObj.name}</span>
                      <span className="mt-1 block truncate text-[9px] font-semibold uppercase tracking-[0.09em] text-slate-500">
                        {currentCountryObj.code} <span className="px-0.5 text-slate-300">•</span> {currentCountryObj.currency} Market
                      </span>
                    </span>
                  </span>
                ) : 'Select Market'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              sideOffset={8}
              className="w-[min(310px,calc(100vw-24px))] min-w-[270px] rounded-2xl border-slate-200 bg-card p-2 shadow-[0_20px_55px_rgba(15,45,82,0.18)]"
            >
              <SelectGroup className="p-0.5">
                <SelectLabel className="px-2.5 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Choose a market
                </SelectLabel>
                {countries.map((c) => (
                  <SelectItem
                    key={c.slug}
                    value={c.slug}
                    className="min-h-14 cursor-pointer rounded-xl py-2.5 pr-9 pl-2.5 text-foreground transition-colors hover:bg-[#eef6ff] focus:bg-[#eef6ff] data-selected:bg-[#e8f3ff]"
                  >
                    <span className="flex w-full min-w-0 items-center gap-3">
                      <span className="flex w-9 shrink-0 items-center justify-start">
                        <Image
                          src={`/flags/${c.slug}.svg`}
                          alt={`${c.name} flag`}
                          width={32}
                          height={22}
                          className="h-[22px] w-8 rounded-[3px] border border-slate-200 object-cover shadow-[0_2px_6px_rgba(15,45,82,0.12)]"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold tracking-[-0.01em] text-slate-900">{c.name}</span>
                        <span className="mt-0.5 block text-[10px] font-medium text-slate-500">{c.code} <span className="px-0.5 text-slate-300">•</span> AssanPay APIs</span>
                      </span>
                      <span className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-slate-600 shadow-sm">{c.currency}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Quick Search Button */}
          {onOpenCommandPalette && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCommandPalette}
              className="hidden md:flex h-11 md:w-[240px] lg:w-[320px] xl:w-[400px] 2xl:w-[520px] justify-start gap-3 text-muted-foreground hover:text-foreground border-[var(--border)] bg-card/90 hover:bg-card transition-colors rounded-xl px-4 shadow-[var(--shadow-card)]"
              title="Search API Catalog & Commands (Ctrl+K)"
            >
              <Search size={13} />
              <span className="hidden lg:inline 2xl:hidden min-w-0 flex-1 truncate text-left text-sm">Search APIs...</span>
              <span className="hidden 2xl:inline min-w-0 flex-1 truncate text-left text-sm">Search APIs, collections, or requests...</span>
              <Kbd className="hidden lg:inline-flex text-[11px] ml-auto">Ctrl K</Kbd>
            </Button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-0.5 sm:gap-1 shrink-0">
          <InstallAppButton />

          <Button
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex w-10 h-10 rounded-xl bg-card/85 border-border text-foreground shadow-[var(--shadow-card)]"
            title="Notifications"
          >
            <Bell size={16} />
          </Button>

          {/* MagicUI Animated Theme Toggler */}
          <AnimatedThemeToggler
            theme={theme === 'dark' ? 'dark' : 'light'}
            onThemeChange={(newTheme) => onThemeChange(newTheme)}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
            title="Toggle theme"
          />

          {/* User + Sign Out */}
          <UserAvatar name={user?.name} email={user?.email} role={user?.role} />

          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5"
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
