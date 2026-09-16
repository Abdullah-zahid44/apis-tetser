'use client';

import React, { useEffect } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Code2,
  History,
  Webhook,
  Braces,
  ServerCog,
  Globe,
  Layers,
  Send,
  ArrowRight,
} from 'lucide-react';
import type { Country, Endpoint, Environment, View } from './types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countries: Country[];
  endpoints: Endpoint[];
  selectedCountry: string;
  onCountryChange: (slug: string) => void;
  environment: Environment;
  onEnvironmentChange: (env: Environment) => void;
  onViewChange: (view: View) => void;
  onSelectEndpoint: (ep: Endpoint) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  countries,
  endpoints,
  selectedCountry,
  onCountryChange,
  environment,
  onEnvironmentChange,
  onViewChange,
  onSelectEndpoint,
}: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (callback: () => void) => {
    callback();
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="bg-[#0b1018] border border-[#1a2336] shadow-2xl text-slate-200"
    >
      <CommandInput
        placeholder="Search APIs, endpoints, country, or jump to view..."
        className="text-xs font-mono"
      />
      <CommandList className="max-h-80 overflow-y-auto font-mono text-xs">
        <CommandEmpty>No matching commands or endpoints found.</CommandEmpty>

        {/* Navigation Group */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => handleSelect(() => onViewChange('workbench'))}
            className="cursor-pointer hover:bg-[#152033]"
          >
            <Code2 className="mr-2 h-4 w-4 text-sky-400" />
            <span>API Workbench</span>
            <CommandShortcut>Alt+1</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => onViewChange('history'))}
            className="cursor-pointer hover:bg-[#152033]"
          >
            <History className="mr-2 h-4 w-4 text-slate-400" />
            <span>Execution History</span>
            <CommandShortcut>Alt+2</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => onViewChange('callbacks'))}
            className="cursor-pointer hover:bg-[#152033]"
          >
            <Webhook className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Callback & Webhook Inbox</span>
            <CommandShortcut>Alt+3</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => onViewChange('variables'))}
            className="cursor-pointer hover:bg-[#152033]"
          >
            <Braces className="mr-2 h-4 w-4 text-amber-400" />
            <span>Environment Variables</span>
            <CommandShortcut>Alt+4</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => onViewChange('status'))}
            className="cursor-pointer hover:bg-[#152033]"
          >
            <ServerCog className="mr-2 h-4 w-4 text-purple-400" />
            <span>Environment Readiness Status</span>
            <CommandShortcut>Alt+5</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="bg-[#1a2336]" />

        {/* Country & Environment Switcher */}
        <CommandGroup heading="Markets & Environment">
          {countries.map((c) => (
            <CommandItem
              key={c.slug}
              onSelect={() => handleSelect(() => onCountryChange(c.slug))}
              className="cursor-pointer hover:bg-[#152033]"
            >
              <span className="mr-2 text-sm">{c.flagEmoji}</span>
              <span>
                Switch to {c.name} ({c.currency})
              </span>
              {selectedCountry === c.slug && (
                <span className="ml-auto text-[10px] text-sky-400 font-bold">ACTIVE</span>
              )}
            </CommandItem>
          ))}

          <CommandItem
            onSelect={() =>
              handleSelect(() =>
                onEnvironmentChange(environment === 'sandbox' ? 'production' : 'sandbox')
              )
            }
            className="cursor-pointer hover:bg-[#152033]"
          >
            <Layers className="mr-2 h-4 w-4 text-slate-400" />
            <span>
              Toggle Environment: Currently {environment.toUpperCase()}
            </span>
            <CommandShortcut>
              {environment === 'sandbox' ? 'Switch to Prod' : 'Switch to Sandbox'}
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="bg-[#1a2336]" />

        {/* Endpoints in active country */}
        <CommandGroup heading={`Endpoints (${selectedCountry.toUpperCase()})`}>
          {endpoints.map((ep) => (
            <CommandItem
              key={ep.id}
              onSelect={() =>
                handleSelect(() => {
                  onSelectEndpoint(ep);
                  onViewChange('workbench');
                })
              }
              className="cursor-pointer hover:bg-[#152033] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className={`method-badge ${ep.method.toLowerCase()}`}>{ep.method}</span>
                <span className="font-semibold text-slate-100">{ep.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">({ep.path})</span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-400" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
