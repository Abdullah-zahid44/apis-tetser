'use client';

import { Braces, Code2, Command, History, PanelLeftClose, ServerCog, ShieldCheck, Webhook, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator, useSidebar,
} from '@/components/ui/sidebar';
import type { View } from './types';

interface NavRailProps {
  view: View;
  onViewChange: (view: View) => void;
  callbackCount?: number;
  historyCount?: number;
  onOpenCommandPalette?: () => void;
}

export function NavRail({ view, onViewChange, callbackCount, historyCount, onOpenCommandPalette }: NavRailProps) {
  const { isMobile, state, setOpenMobile, toggleSidebar } = useSidebar();
  const selectView = (nextView: View) => {
    onViewChange(nextView);
    if (isMobile) setOpenMobile(false);
  };
  const groups = [
    {
      label: 'Workspace',
      items: [
        { id: 'workbench' as View, label: 'Workbench', icon: Code2, shortcut: 'Alt+1' },
        { id: 'history' as View, label: 'History', icon: History, shortcut: 'Alt+2', badge: historyCount },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'callbacks' as View, label: 'Callbacks', icon: Webhook, shortcut: 'Alt+3', badge: callbackCount },
        { id: 'variables' as View, label: 'Variables', icon: Braces, shortcut: 'Alt+4' },
        { id: 'status' as View, label: 'Environment', icon: ServerCog, shortcut: 'Alt+5' },
      ],
    },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      {/* Brand Header */}
      <SidebarHeader className="flex flex-row items-center gap-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => state === 'collapsed' && !isMobile ? toggleSidebar() : selectView('workbench')}
              tooltip={state === 'collapsed' ? 'Expand sidebar' : 'AssanPay Developer Console'}
              className="transition-colors duration-150"
            >
              {/* Logo */}
              <span
                className="brand-mark flex size-9 items-center justify-center rounded-md text-white shrink-0"
              >
                <ShieldCheck size={16} strokeWidth={2.4} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground">AssanPay</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Console</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="shrink-0 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
          title={isMobile ? 'Close sidebar' : 'Collapse sidebar'}
          aria-label={isMobile ? 'Close sidebar' : 'Collapse sidebar'}
        >
          {isMobile ? <X /> : <PanelLeftClose />}
        </Button>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-3 mb-0.5">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = view === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={`${item.label} (${item.shortcut})`}
                        onClick={() => selectView(item.id)}
                        className={`relative transition-colors duration-150 group/nav-item rounded-xl ${
                          isActive
                            ? 'font-semibold shadow-sm'
                            : 'text-foreground/70 hover:text-foreground hover:bg-accent'
                        }`}
                        style={isActive ? {
                          background: 'var(--foreground)',
                          color: 'var(--background)',
                        } : undefined}
                      >
                        <Icon
                          size={16}
                          className={`transition-colors duration-150 ${
                            isActive ? 'text-background' : 'text-primary'
                          }`}
                        />
                        <span>{item.label}</span>
                      </SidebarMenuButton>

                      {item.badge !== undefined && item.badge > 0 ? (
                        <SidebarMenuBadge
                          className="text-xs font-semibold tabular-nums bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {onOpenCommandPalette ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Quick search (Ctrl+K)"
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                  onOpenCommandPalette();
                }}
                className="text-muted-foreground hover:text-secondary-foreground transition-colors"
              >
                <Command size={14} className="text-muted-foreground" />
                <span className="text-xs">Quick search</span>
                <Kbd className="ml-auto">⌘K</Kbd>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
