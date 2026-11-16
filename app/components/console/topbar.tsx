'use client';

import React from 'react';
import Image from 'next/image';
import {
  Bell,
  LogOut,
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
    <div className="hidden h-11 items-center gap-3 rounded-full border border-slate-200/90 bg-white pl-4 pr-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 sm:flex">
      <div className="hidden flex-col items-end justify-center leading-none lg:flex">
        <p className="text-[12.5px] font-bold leading-tight tracking-[-0.01em] text-slate-900 dark:text-white">
          {name || 'AssanPay Support'}
        </p>
        <p className="mt-0.5 max-w-[160px] truncate text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
          {email || 'support@assanpay.com'}
        </p>
      </div>
      <div
        className="flex h-8 w-8 shrink-0 cursor-default select-none items-center justify-center rounded-full bg-[#1e3a6d] text-xs font-bold tracking-wide text-white shadow-sm"
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
      <header className="z-30 grid shrink-0 select-none grid-cols-[1fr_auto] gap-x-3 gap-y-2.5 border-b border-slate-200/70 bg-[#f4f8fd]/90 px-3 py-2.5 backdrop-blur-md transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-950/90 sm:px-5 md:flex md:h-16 md:items-center md:justify-between md:py-0">

        {/* Brand — always visible on all breakpoints */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 md:hidden">
          {/* Mobile nav trigger — opens the nav rail as a slide-over Sheet */}
          <SidebarTrigger className="h-11 w-11 rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-blue-300 hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300" />
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
            className="h-11 w-11 rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-150 hover:border-blue-300 hover:bg-white hover:text-slate-900 hover:shadow-[0_4px_12px_-2px_rgba(15,23,42,0.07)] focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
            title="Toggle navigation sidebar"
            aria-label="Toggle navigation sidebar"
          />
        </div>

        {/* Center: Selectors */}
        <div className="order-3 col-span-2 flex min-w-0 items-center justify-start gap-2.5 sm:gap-3 md:order-none md:col-span-1 md:max-w-4xl md:flex-1 md:justify-center">
          {/* Country Selector */}
          <Select
            value={selectedCountry}
            onValueChange={(val) => { if (val) onCountryChange(val); }}
          >
            <SelectTrigger
              className="group/market relative h-11 w-[190px] shrink-0 overflow-hidden !rounded-full border border-slate-200/90 bg-white py-0 pl-2.5 pr-10 text-sm text-foreground shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-150 after:absolute after:bottom-3 after:right-8 after:top-3 after:w-px after:bg-slate-200/80 hover:border-blue-300 hover:bg-white hover:shadow-[0_4px_12px_-2px_rgba(15,23,42,0.07)] focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:after:bg-slate-800 dark:hover:border-slate-700 sm:w-[210px] [&>svg:last-child]:absolute [&>svg:last-child]:right-2.5 [&>svg:last-child]:size-3.5 [&>svg:last-child]:text-slate-500 [&>svg:last-child]:transition-all group-hover/market:[&>svg:last-child]:text-slate-800 dark:group-hover/market:[&>svg:last-child]:text-white [&[data-popup-open]>svg:last-child]:rotate-180"
            >
              <SelectValue>
                {currentCountryObj ? (
                  <span className="flex w-full min-w-0 items-center gap-2.5">
                    <span className="flex w-7 shrink-0 items-center justify-start">
                      <Image
                        src={`/flags/${currentCountryObj.slug}.svg`}
                        alt={`${currentCountryObj.name} flag`}
                        width={28}
                        height={20}
                        className="h-5 w-7 rounded-[4px] border border-slate-200/80 object-cover dark:border-slate-700"
                      />
                    </span>
                    <span className="min-w-0 flex-1 text-left leading-none">
                      <span className="block truncate text-[13px] font-bold leading-tight tracking-[-0.01em] text-[#111827] dark:text-white">{currentCountryObj.name}</span>
                      <span className="mt-0.5 hidden truncate text-[9.5px] font-semibold uppercase tracking-[0.06em] text-[#64748b] dark:text-slate-400 sm:block">
                        {currentCountryObj.code} <span className="px-0.5 text-slate-300">•</span> {currentCountryObj.currency} Market
                      </span>
                    </span>
                  </span>
                ) : 'Select Market'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              sideOffset={10}
              className="w-[min(350px,calc(100vw-24px))] min-w-[280px] rounded-[22px] border-slate-200/90 bg-white p-2.5 shadow-[0_20px_38px_-10px_rgba(15,23,42,0.14),0_8px_16px_-6px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900"
            >
              <SelectGroup className="p-0">
                <SelectLabel className="px-3 pb-2 pt-1.5 text-[10.5px] font-bold uppercase tracking-[0.09em] text-[#64748b] dark:text-slate-400">
                  Choose a market
                </SelectLabel>
                {countries.map((c) => (
                  <SelectItem
                    key={c.slug}
                    value={c.slug}
                    className="min-h-14 cursor-pointer rounded-2xl py-2.5 pl-3 pr-10 text-foreground transition-all duration-150 hover:bg-slate-50 focus:bg-slate-50 data-selected:bg-[#eef5ff] dark:hover:bg-slate-800/70 dark:focus:bg-slate-800/70 dark:data-selected:bg-blue-950/60"
                  >
                    <span className="flex w-full min-w-0 items-center gap-3">
                      <span className="flex w-8 shrink-0 items-center justify-start">
                        <Image
                          src={`/flags/${c.slug}.svg`}
                          alt={`${c.name} flag`}
                          width={32}
                          height={22}
                          className="h-5 w-8 rounded-[4px] border border-slate-200/80 object-cover dark:border-slate-700"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-bold tracking-[-0.01em] text-[#111827] dark:text-white">{c.name}</span>
                        <span className="mt-0.5 block text-[11px] font-medium text-[#64748b] dark:text-slate-400"><span className="font-semibold">{c.code}</span> <span className="px-0.5 text-slate-300 dark:text-slate-600">•</span> AssanPay APIs</span>
                      </span>
                      <span className="shrink-0 rounded-full border border-slate-200/90 bg-white px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em] text-[#475569] shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{c.currency}</span>
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
              className="hidden h-11 min-w-0 flex-1 justify-start gap-2.5 rounded-full border border-slate-200/90 bg-white px-4 text-slate-400 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-150 hover:border-blue-300 hover:bg-white hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:text-slate-200 md:flex md:max-w-xl"
              title="Search API Catalog & Commands (Ctrl+K)"
            >
              <Search size={16} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left text-[13px]">Search APIs, collections, or requests...</span>
              <Kbd className="ml-auto hidden shrink-0 rounded-full border border-slate-200/70 bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 lg:inline-flex">Ctrl K</Kbd>
            </Button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <InstallAppButton />

          <Button
            variant="outline"
            size="icon"
            className="relative hidden h-11 w-11 rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-150 hover:border-blue-300 hover:bg-white hover:text-slate-900 hover:shadow-[0_4px_12px_-2px_rgba(15,23,42,0.07)] focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white sm:inline-flex"
            title="Notifications"
          >
            <Bell size={18} strokeWidth={1.9} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
          </Button>

          {/* MagicUI Animated Theme Toggler */}
          <AnimatedThemeToggler
            theme={theme === 'dark' ? 'dark' : 'light'}
            onThemeChange={(newTheme) => onThemeChange(newTheme)}
            className="h-11 w-11 rounded-full border border-slate-200/90 bg-white p-0 text-slate-600 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-150 hover:border-blue-300 hover:bg-white hover:text-slate-900 hover:shadow-[0_4px_12px_-2px_rgba(15,23,42,0.07)] focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
            title="Toggle theme"
          />

          {/* User + Sign Out */}
          <UserAvatar name={user?.name} email={user?.email} role={user?.role} />

          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full border-slate-200/90 bg-white text-slate-600 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-150 hover:border-rose-300 hover:bg-rose-50/60 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            onClick={() => void signOut({ callbackUrl: '/login' })}
            title="Sign Out"
          >
            <LogOut size={18} strokeWidth={1.9} />
          </Button>
        </div>
      </header>
    </>
  );
}
