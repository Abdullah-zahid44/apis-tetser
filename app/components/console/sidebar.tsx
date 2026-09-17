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
  GET:    { text: '#059669', bg: 'rgba(5, 150, 105, 0.12)',  border: 'rgba(5, 150, 105, 0.28)' },
  POST:   { text: '#e05320', bg: 'rgba(224, 83, 32, 0.12)',  border: 'rgba(224, 83, 32, 0.30)' },
  PUT:    { text: '#0265d2', bg: 'rgba(2, 101, 210, 0.12)',  border: 'rgba(2, 101, 210, 0.28)' },
  PATCH:  { text: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)', border: 'rgba(124, 58, 237, 0.28)' },
  DELETE: { text: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)',  border: 'rgba(220, 38, 38, 0.28)' },
};

function MethodPill({ method }: { method: Method }) {
  const s = METHOD_STYLES[method] ?? METHOD_STYLES.POST;
  return (
    <span
      className="inline-flex items-center justify-center text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded-[4px] shrink-0"
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
              className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-3)] transition-colors"
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
          className="grid grid-cols-2 h-8 p-0.5 rounded-lg bg-muted border border-border gap-1"
        >
          <ToggleGroupItem value="catalog" className="text-xs gap-1.5 rounded-md data-active:bg-surface-2 data-active:text-foreground data-active:border data-active:border-border data-active:shadow-sm">
            <Layers size={12} />
            Catalog
            <Badge variant="secondary" className="text-[10px] font-mono h-4 px-1 ml-0.5">
              {filteredEndpoints.length}
            </Badge>
          </ToggleGroupItem>
          <ToggleGroupItem value="saved" className="text-xs gap-1.5 rounded-md data-active:bg-surface-2 data-active:text-foreground data-active:border data-active:border-border data-active:shadow-sm">
            <BookmarkCheck size={12} />
            Saved
            <Badge variant="secondary" className="text-[10px] font-mono h-4 px-1 ml-0.5">
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
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150 cursor-pointer group/cat"
                      >
                        <span className="text-muted-foreground/60 group-hover/cat:text-foreground transition-colors">
                          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] flex-1 text-left text-muted-foreground/80 group-hover/cat:text-foreground transition-colors">
                          {category}
                        </span>
                        <span className="text-[10px] font-mono tabular-nums font-semibold text-muted-foreground bg-muted border border-border/60 px-1.5 py-0.5 rounded-full">
                          {catEndpoints.length}
                        </span>
                      </button>

                      {/* Endpoints */}
                      {isOpen && (
                        <div className="mt-1 ml-1.5 pl-2 border-l border-border/80 space-y-1.5">
                          {catEndpoints.map((ep) => {
                            const isSelected = selectedId === ep.id;
                            return (
                              <HoverCard key={ep.id}>
                                <HoverCardTrigger>
                                  <button
                                    onClick={() => onSelectEndpoint(ep)}
                                    className={`w-full group/ep relative text-left p-2.5 rounded-[8px] border transition-all duration-150 flex items-start gap-2.5 cursor-pointer select-none ${
                                      isSelected
                                        ? 'bg-card text-foreground border-primary/50 shadow-xs ring-1 ring-primary/20'
                                        : 'bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground border-border/80 hover:border-border hover:shadow-xs'
                                    }`}
                                  >
                                    {isSelected && (
                                      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-primary" />
                                    )}
                                    <div className="pt-0.5 shrink-0">
                                      <MethodPill method={ep.method} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`text-xs leading-snug truncate ${isSelected ? 'font-semibold text-foreground' : 'font-medium text-foreground/90 group-hover/ep:text-foreground'}`}>
                                          {ep.name}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0 ml-1">
                                          {ep.isMoneyMovement && (
                                            <span
                                              title="Money Movement"
                                              className="text-[9px] px-1 py-0.2 rounded font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                                            >
                                              PAY
                                            </span>
                                          )}
                                          {ep.requiresSignature && (
                                            <span
                                              title="HMAC-SHA256 Required"
                                              className={`transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/60 group-hover/ep:text-muted-foreground'}`}
                                            >
                                              <Lock size={11} />
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className={`text-[11px] font-mono truncate mt-1 ${isSelected ? 'text-primary/90 font-medium' : 'text-muted-foreground/70'}`}>
                                        {ep.path}
                                      </div>
                                    </div>
                                  </button>
                                </HoverCardTrigger>
                                <HoverCardContent
                                  side="right"
                                  align="start"
                                  className="w-72 p-3 bg-popover border-border rounded-lg shadow-xl"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <MethodPill method={ep.method} />
                                      <span className="text-xs font-semibold text-foreground">{ep.name}</span>
                                    </div>
                                    <code className="block text-[11px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-1.5 break-all">
                                      {ep.path}
                                    </code>
                                    {ep.description && (
                                      <p className="text-xs text-muted-foreground leading-relaxed">{ep.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {ep.requiresSignature && (
                                        <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                                          <Lock size={10} /> HMAC Signed
                                        </Badge>
                                      )}
                                      {ep.isMoneyMovement && (
                                        <Badge variant="outline" className="text-[10px] gap-1 border-warning/30 text-warning">
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
              <div className="space-y-1.5">
                {filteredSaved.map((saved) => {
                  const isSelected = selectedId === `saved-${saved.id}`;
                  return (
                    <div
                      key={saved.id}
                      className={`group/saved relative flex items-start rounded-[8px] border transition-all duration-150 p-2.5 ${
                        isSelected
                          ? 'bg-card text-foreground border-primary/50 shadow-xs ring-1 ring-primary/20'
                          : 'bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground border-border/80 hover:border-border hover:shadow-xs'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-primary" />
                      )}
                      <button
                        onClick={() => onSelectSaved(saved)}
                        className="flex-1 flex items-start gap-2.5 text-left min-w-0 cursor-pointer"
                      >
                        <div className="pt-0.5 shrink-0">
                          <MethodPill method={saved.method} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs leading-snug truncate ${isSelected ? 'font-semibold text-foreground' : 'font-medium text-foreground/90 group-hover/saved:text-foreground'}`}>
                            {saved.name}
                          </div>
                          <div className={`text-[11px] font-mono truncate mt-1 ${isSelected ? 'text-primary/90 font-medium' : 'text-muted-foreground/70'}`}>
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
                              className="opacity-0 group-hover/saved:opacity-100 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-4)] transition-colors w-6 h-6"
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
