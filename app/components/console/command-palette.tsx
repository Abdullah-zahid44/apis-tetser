'use client';

import React, { useEffect } from 'react';
import {
  Command,
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
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
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

  const isMobile = useIsMobile();

  const commandBody = (
    <>
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
            className="cursor-pointer hover:bg-accent"
          >
            <Code2 className="mr-2 h-4 w-4 text-primary" />
            <span>API Workbench</span>
            <CommandShortcut>Alt+1</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => onViewChange('history'))}
            className="cursor-pointer hover:bg-accent"
          >
            <History className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Execution History</span>
            <CommandShortcut>Alt+2</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => onViewChange('callbacks'))}
            className="cursor-pointer hover:bg-accent"
          >
            <Webhook className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Callback & Webhook Inbox</span>
            <CommandShortcut>Alt+3</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => onViewChange('variables'))}
            className="cursor-pointer hover:bg-accent"
          >
            <Braces className="mr-2 h-4 w-4 text-amber-400" />
            <span>Environment Variables</span>
            <CommandShortcut>Alt+4</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => onViewChange('status'))}
            className="cursor-pointer hover:bg-accent"
          >
            <ServerCog className="mr-2 h-4 w-4 text-purple-400" />
            <span>Environment Readiness Status</span>
            <CommandShortcut>Alt+5</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="bg-border" />

        {/* Country & Environment Switcher */}
        <CommandGroup heading="Markets & Environment">
          {countries.map((c) => (
            <CommandItem
              key={c.slug}
              onSelect={() => handleSelect(() => onCountryChange(c.slug))}
              className="cursor-pointer hover:bg-accent"
            >
              <span className="mr-2 text-sm">{c.flagEmoji}</span>
              <span>
                Switch to {c.name} ({c.currency})
              </span>
              {selectedCountry === c.slug && (
                <span className="ml-auto text-[11.5px] text-primary font-bold">ACTIVE</span>
              )}
            </CommandItem>
          ))}

          <CommandItem
            onSelect={() =>
              handleSelect(() =>
                onEnvironmentChange(environment === 'sandbox' ? 'production' : 'sandbox')
              )
            }
            className="cursor-pointer hover:bg-accent"
          >
            <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>
              Toggle Environment: Currently {environment.toUpperCase()}
            </span>
            <CommandShortcut>
              {environment === 'sandbox' ? 'Switch to Prod' : 'Switch to Sandbox'}
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="bg-border" />

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
              className="cursor-pointer hover:bg-accent flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className={`method-badge ${ep.method.toLowerCase()}`}>{ep.method}</span>
                <span className="font-semibold text-foreground">{ep.name}</span>
                <span className="text-[11px] text-muted-foreground font-mono">({ep.path})</span>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </>
  );

  // Mobile: bottom-sheet Drawer (native pattern). Desktop: centered Dialog.
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-popover border-border rounded-t-[20px] max-h-[85dvh]">
          <DrawerTitle className="sr-only">Search and commands</DrawerTitle>
          <Command className="bg-transparent">
            {commandBody}
          </Command>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="bg-popover border border-border shadow-2xl text-foreground rounded-[14px]"
    >
      {commandBody}
    </CommandDialog>
  );
}
