'use client';

import { Braces, Code2, Command, History, ServerCog, ShieldCheck, Webhook } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator,
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => onViewChange('workbench')}
              tooltip="AssanPay Developer Console"
              className="group transition-all duration-150"
            >
              {/* Logo with gradient */}
              <span
                className="brand-mark flex size-9 items-center justify-center rounded-[11px] text-white shrink-0 transition-all duration-200 group-hover:scale-105"
              >
                <ShieldCheck size={16} strokeWidth={2.4} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-display text-[13.5px] font-bold tracking-tight text-foreground">AssanPay</span>
                <span className="text-[11.5px] text-muted-foreground font-mono tracking-wider">Console</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] tracking-widest uppercase text-muted-foreground font-semibold px-3 mb-0.5">
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
                        onClick={() => onViewChange(item.id)}
                        className={`relative transition-all duration-150 group/nav-item rounded-xl ${
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
                          className="text-[11px] font-bold bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20 rounded-full px-1.5"
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
                onClick={onOpenCommandPalette}
                className="text-muted-foreground hover:text-secondary-foreground transition-colors"
              >
                <Command size={14} className="text-muted-foreground" />
                <span className="text-xs">Quick search</span>
                <SidebarMenuBadge className="text-[11px] font-mono text-muted-foreground">⌘K</SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
