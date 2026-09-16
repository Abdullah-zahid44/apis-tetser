'use client';

import React, { useState } from 'react';
import {
  Search,
  BookmarkCheck,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Copy,
  Trash2,
  X,
  Lock,
  Layers,
  ShieldAlert,
  PanelLeftClose,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Endpoint, SavedRequestItem, Method } from './types';

interface SidebarProps {
  countryCode: string;
  countryName: string;
  endpoints: Endpoint[];
  savedRequests: SavedRequestItem[];
  selectedId: string;
  search: string;
  onSearchChange: (search: string) => void;
  onSelectEndpoint: (endpoint: Endpoint) => void;
  onSelectSaved: (saved: SavedRequestItem) => void;
  onDeleteSaved?: (id: string) => void;
  onDuplicateSaved?: (saved: SavedRequestItem) => void;
  onToggleCollapse?: () => void;
}

const METHOD_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  GET:    { text: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: 'color-mix(in srgb, var(--primary) 25%, transparent)' },
  POST:   { text: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.2)' },
  PUT:    { text: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)' },
  PATCH:  { text: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)' },
  DELETE: { text: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
};

function MethodPill({ method }: { method: Method }) {
  const s = METHOD_STYLES[method] ?? METHOD_STYLES.POST;
  return (
    <span
      className="inline-flex items-center justify-center text-[11px] font-bold font-mono tracking-wider px-1.5 py-0.5 rounded shrink-0"
      style={{ color: s.text, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {method}
    </span>
  );
}

export function Sidebar({
  countryCode,
  countryName,
  endpoints,
  savedRequests,
  selectedId,
  search,
  onSearchChange,
  onSelectEndpoint,
  onSelectSaved,
  onDeleteSaved,
  onDuplicateSaved,
  onToggleCollapse,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'saved'>('catalog');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    Payin: true,
    Payout: true,
    Checkout: true,
    Status: true,
    Balance: true,
    Verification: true,
  });

  const query = search.trim().toLowerCase();

  const filteredEndpoints = endpoints.filter(
    (ep) =>
      ep.name.toLowerCase().includes(query) ||
      ep.path.toLowerCase().includes(query) ||
      ep.category.toLowerCase().includes(query) ||
      ep.description.toLowerCase().includes(query)
  );

  const categories = Array.from(new Set(filteredEndpoints.map((ep) => ep.category)));

  const filteredSaved = savedRequests.filter(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      s.relativeUrl.toLowerCase().includes(query) ||
      s.method.toLowerCase().includes(query)
  );

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <aside
      className="w-full h-full flex flex-col min-h-0 select-none border-r border-[var(--border)]"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              {countryCode.toUpperCase()}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Gateway</span>
          </div>
          <h2 className="text-sm font-semibold text-foreground tracking-tight">
            Collections
          </h2>
        </div>

        <div className="flex items-center gap-1">
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="w-7 h-7 text-muted-foreground hover:text-secondary-foreground hover:bg-[var(--surface-5)] transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-3 py-2 border-b border-[var(--border)] shrink-0">
        <ToggleGroup
          value={[activeTab]}
          onValueChange={(value) => value[0] && setActiveTab(value[0] as 'catalog' | 'saved')}
          className="grid grid-cols-2 h-9 p-1 rounded-full bg-muted border border-border gap-1"
        >
          <ToggleGroupItem value="catalog" className="text-xs gap-1.5 rounded-full data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm data-active:hover:bg-primary">
            <Layers size={12} />
            Catalog
            <Badge variant="secondary" className="text-[11px] font-mono h-4 px-1 ml-0.5">
              {filteredEndpoints.length}
            </Badge>
          </ToggleGroupItem>
          <ToggleGroupItem value="saved" className="text-xs gap-1.5 rounded-full data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm data-active:hover:bg-primary">
            <BookmarkCheck size={12} />
            Saved
            <Badge variant="secondary" className="text-[11px] font-mono h-4 px-1 ml-0.5">
              {filteredSaved.length}
            </Badge>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[var(--border)] shrink-0">
        <InputGroup>
          <InputGroupAddon>
            <Search size={13} className="text-muted-foreground/60" />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={activeTab === 'catalog' ? `Filter ${countryName} APIs…` : 'Filter saved…'}
            className="text-xs placeholder:text-muted-foreground/60"
          />
          {search && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={() => onSearchChange('')} aria-label="Clear">
                <X size={12} />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {activeTab === 'catalog' ? (
            categories.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyTitle className="text-sm">No endpoints found</EmptyTitle>
                  <EmptyDescription className="text-xs">Try a different search term.</EmptyDescription>
                </EmptyHeader>
                {search && (
                  <EmptyContent>
                    <Button variant="outline" size="sm" onClick={() => onSearchChange('')} className="text-xs h-7">
                      Clear filter
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              <div className="space-y-1">
                {categories.map((category) => {
                  const catEndpoints = filteredEndpoints.filter((ep) => ep.category === category);
                  const isOpen = openCategories[category] ?? true;

                  return (
                    <div key={category}>
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-100 cursor-pointer group/cat"
                      >
                        <span className="text-muted-foreground/60 group-hover/cat:text-muted-foreground transition-colors">
                          {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] flex-1 text-left">
                          {category}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {catEndpoints.length}
                        </span>
                      </button>

                      {/* Endpoints */}
                      {isOpen && (
                        <div className="mt-0.5 ml-2 pl-2 border-l border-[var(--border)] space-y-0.5">
                          {catEndpoints.map((ep) => {
                            const isSelected = selectedId === ep.id;
                            return (
                              <HoverCard key={ep.id}>
                                <HoverCardTrigger>
                              <button
                                onClick={() => onSelectEndpoint(ep)}
                                className={`w-full group/ep text-left px-2 py-2 rounded-md transition-colors duration-100 flex items-center gap-2 cursor-pointer ${
                                  isSelected
                                    ? 'bg-foreground text-background font-medium shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                }`}
                              >
                                <MethodPill method={ep.method} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate leading-snug">
                                    {ep.name}
                                  </div>
                                  <div className={`text-[11px] font-mono truncate mt-0.5 ${isSelected ? 'text-background/60' : 'text-muted-foreground/60'}`}>
                                    {ep.path}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {ep.isMoneyMovement && (
                                    <span title="Money Movement" className={isSelected ? 'text-background/60' : 'text-muted-foreground/60'}>
                                      <ShieldAlert size={11} />
                                    </span>
                                  )}
                                  {ep.requiresSignature && (
                                    <span title="HMAC-SHA256 Required" className={isSelected ? 'text-background/60' : 'text-muted-foreground/60'}>
                                      <Lock size={10} />
                                    </span>
                                  )}
                                </div>
                              </button>
                                </HoverCardTrigger>
                                <HoverCardContent
                                  side="right"
                                  align="start"
                                  className="w-72 p-4 bg-popover border-border rounded-lg shadow-xl"
                                >
                                  <div className="space-y-2.5">
                                    <div className="flex items-center gap-2">
                                      <MethodPill method={ep.method} />
                                      <span className="text-sm font-bold text-foreground">{ep.name}</span>
                                    </div>
                                    <code className="block text-[11px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-1.5 break-all">
                                      {ep.path}
                                    </code>
                                    {ep.description && (
                                      <p className="text-xs text-muted-foreground leading-relaxed">{ep.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {ep.requiresSignature && (
                                        <Badge variant="outline" className="text-[11px] gap-1 border-primary/30 text-primary">
                                          <Lock size={10} /> HMAC Signed
                                        </Badge>
                                      )}
                                      {ep.isMoneyMovement && (
                                        <Badge variant="outline" className="text-[11px] gap-1 border-warning/30 text-warning">
                                          <ShieldAlert size={10} /> Money Movement
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Saved Requests */
            filteredSaved.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><BookmarkCheck /></EmptyMedia>
                  <EmptyTitle className="text-sm">No saved requests</EmptyTitle>
                  <EmptyDescription className="text-xs">Configure and save a request to this collection.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-0.5">
                {filteredSaved.map((saved) => {
                  const isSelected = selectedId === `saved-${saved.id}`;
                  return (
                    <div
                      key={saved.id}
                      className={`group/saved flex items-center rounded-md border transition-colors duration-100 px-2 py-1.5 ${
                        isSelected
                          ? 'bg-foreground text-background border-transparent font-medium shadow-sm'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/50'
                      }`}
                    >
                      <button
                        onClick={() => onSelectSaved(saved)}
                        className="flex-1 flex items-center gap-2 text-left min-w-0 cursor-pointer"
                      >
                        <MethodPill method={saved.method} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate leading-snug">
                            {saved.name}
                          </div>
                          <div className={`text-[11px] font-mono truncate mt-0.5 ${isSelected ? 'text-background/60' : 'text-muted-foreground/60'}`}>
                            {saved.relativeUrl}
                          </div>
                        </div>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="opacity-0 group-hover/saved:opacity-100 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-6 h-6"
                            />
                          }
                          title="Options"
                        >
                          <MoreVertical size={12} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                          <DropdownMenuGroup>
                            {onDuplicateSaved && (
                              <DropdownMenuItem onClick={() => onDuplicateSaved(saved)} className="text-xs">
                                <Copy data-icon="inline-start" size={12} />
                                <span>Duplicate</span>
                              </DropdownMenuItem>
                            )}
                            {onDeleteSaved && (
                              <DropdownMenuItem variant="destructive" onClick={() => onDeleteSaved(saved.id)} className="text-xs">
                                <Trash2 data-icon="inline-start" size={12} />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </ScrollArea>

      {/* Footer — Security info strip */}
      <div className="px-3 py-2 border-t border-[var(--border)] flex items-center gap-1.5 shrink-0">
        <ShieldCheck size={11} className="text-success shrink-0" />
        <span className="text-[11px] font-mono text-muted-foreground/60 truncate">
          HMAC-SHA256 · Nonce · Timestamp
        </span>
      </div>
    </aside>
  );
}
