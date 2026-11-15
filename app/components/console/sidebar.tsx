'use client';

import React, { useState } from 'react';
import {
  Search,
  BookmarkCheck,
  SearchX,
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
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
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

/* Method colors: theme-aware tokens (--color-method-* in globals.css), soft tint + strong text per §2/§7 badge recipe. */
const METHOD_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  GET:    { text: 'text-method-get',    bg: 'bg-method-get/10',    border: 'border-method-get/25' },
  POST:   { text: 'text-method-post',   bg: 'bg-method-post/10',   border: 'border-method-post/25' },
  PUT:    { text: 'text-method-put',    bg: 'bg-method-put/10',    border: 'border-method-put/25' },
  PATCH:  { text: 'text-method-patch',  bg: 'bg-method-patch/10',  border: 'border-method-patch/25' },
  DELETE: { text: 'text-method-delete', bg: 'bg-method-delete/10', border: 'border-method-delete/25' },
};

function MethodPill({ method }: { method: Method }) {
  const s = METHOD_STYLES[method] ?? METHOD_STYLES.POST;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border text-xs font-semibold px-2 py-0.5 shrink-0 ${s.text} ${s.bg} ${s.border}`}
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
  // Start every catalog category collapsed for every user/session.
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

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
      className="w-full h-full flex flex-col min-h-0"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">API Collections</h2>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-3 py-3 shrink-0">
        <ToggleGroup
          value={[activeTab]}
          onValueChange={(value) => value[0] && setActiveTab(value[0] as 'catalog' | 'saved')}
          className="grid grid-cols-2 h-10 p-1 rounded-full bg-muted gap-1"
        >
          <ToggleGroupItem value="catalog" className="text-sm gap-1.5 rounded-full text-muted-foreground data-active:bg-card data-active:text-primary data-active:shadow-sm">
            <Layers size={12} />
            Catalog
            <Badge variant="secondary" className="text-[11px] tabular-nums font-semibold h-5 px-1.5 ml-0.5 rounded-full">
              {filteredEndpoints.length}
            </Badge>
          </ToggleGroupItem>
          <ToggleGroupItem value="saved" className="text-sm gap-1.5 rounded-full text-muted-foreground data-active:bg-card data-active:text-primary data-active:shadow-sm">
            <BookmarkCheck size={12} />
            Saved
            <Badge variant="secondary" className="text-[11px] tabular-nums font-semibold h-5 px-1.5 ml-0.5 rounded-full">
              {filteredSaved.length}
            </Badge>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Search */}
      <div className="px-3 pb-3 border-b border-[var(--border)] shrink-0">
        <InputGroup>
          <InputGroupAddon>
            <Search size={13} className="text-muted-foreground/60" />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={activeTab === 'catalog' ? `Filter ${countryName} APIs…` : 'Filter saved…'}
            className="text-sm placeholder:text-muted-foreground/60"
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
        <div className="p-2.5">
          {activeTab === 'catalog' ? (
            categories.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><SearchX /></EmptyMedia>
                  <EmptyTitle className="text-sm">No endpoints found</EmptyTitle>
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
                  const isOpen = query.length > 0 || (openCategories[category] ?? false);

                  return (
                    <div key={category}>
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full min-h-9 flex items-center gap-2 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 cursor-pointer group/cat"
                      >
                        <span className="text-muted-foreground/60">
                          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        <FolderOpen size={15} className="text-primary" />
                        <span className="text-xs font-semibold flex-1 text-left text-foreground">
                          {category}
                        </span>
                        <span className="text-[11px] tabular-nums font-semibold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-full">
                          {catEndpoints.length}
                        </span>
                      </button>

                      {/* Endpoints */}
                      {isOpen && (
                        <div className="mt-1.5 space-y-1.5">
                          {catEndpoints.map((ep) => {
                            const isSelected = selectedId === ep.id;
                            return (
                              <HoverCard key={ep.id}>
                                <HoverCardTrigger>
                                  <button
                                    onClick={() => onSelectEndpoint(ep)}
                                    className={`w-full min-h-14 group/ep relative text-left p-3 rounded-xl border transition-colors duration-150 flex items-start gap-3 cursor-pointer ${
                                      isSelected
                                        ? 'bg-primary/10 text-foreground border-primary/25 shadow-[inset_3px_0_0_var(--primary)]'
                                        : 'bg-transparent text-muted-foreground hover:text-foreground border-transparent hover:border-border hover:bg-accent'
                                    }`}
                                  >
                                    <div className="pt-0.5 shrink-0">
                                      <MethodPill method={ep.method} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`text-sm leading-snug truncate ${isSelected ? 'font-semibold text-primary' : 'font-medium text-foreground'}`}>
                                          {ep.name}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0 ml-1">
                                          {ep.isMoneyMovement && (
                                            <span
                                              title="Money Movement"
                                              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-warning/10 text-warning border border-warning/25"
                                            >
                                              PAY
                                            </span>
                                          )}
                                          {ep.requiresSignature && (
                                            <span
                                              title="HMAC-SHA256 Required"
                                              className={`transition-colors ${isSelected ? 'text-primary/70' : 'text-muted-foreground/60 group-hover/ep:text-muted-foreground'}`}
                                            >
                                              <Lock size={11} />
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className={`text-[11px] font-mono truncate mt-1 ${isSelected ? 'text-primary/75' : 'text-muted-foreground/60'}`}>
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
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-1.5">
                {filteredSaved.map((saved) => {
                  const isSelected = selectedId === `saved-${saved.id}`;
                  return (
                    <div
                      key={saved.id}
                      className={`group/saved relative flex items-start rounded-xl border transition-colors duration-150 p-3 ${
                        isSelected
                          ? 'bg-primary/10 text-foreground border-primary/25 shadow-[inset_3px_0_0_var(--primary)]'
                          : 'bg-transparent text-muted-foreground hover:text-foreground border-transparent hover:border-border hover:bg-accent'
                      }`}
                    >
                      <button
                        onClick={() => onSelectSaved(saved)}
                        className="flex-1 flex items-start gap-2.5 text-left min-w-0 cursor-pointer"
                      >
                        <div className="pt-0.5 shrink-0">
                          <MethodPill method={saved.method} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm leading-snug truncate ${isSelected ? 'font-semibold text-primary' : 'font-medium text-foreground'}`}>
                            {saved.name}
                          </div>
                          <div className={`text-[11px] font-mono truncate mt-1 ${isSelected ? 'text-primary/75' : 'text-muted-foreground/60'}`}>
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

    </aside>
  );
}
