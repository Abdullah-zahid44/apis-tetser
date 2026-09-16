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
                className="flex size-8 items-center justify-center rounded-lg text-white shrink-0 transition-all duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #3a6fd8 0%, #5b8def 100%)',
                  boxShadow: '0 2px 8px rgba(91,141,239,0.3)',
                }}
              >
                <ShieldCheck size={16} strokeWidth={2.2} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[13px] font-semibold tracking-tight text-slate-100">AssanPay</span>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider">Developer Console</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[9.5px] tracking-widest uppercase text-slate-600 font-semibold px-3 mb-0.5">
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
                        className={`relative transition-all duration-150 group/nav-item ${
                          isActive
                            ? 'text-slate-100 font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        style={isActive ? {
                          background: 'linear-gradient(90deg, rgba(91,141,239,0.12) 0%, rgba(91,141,239,0.04) 100%)',
                          boxShadow: 'inset 2px 0 0 var(--primary)',
                        } : undefined}
                      >
                        <Icon
                          size={16}
                          className={`transition-all duration-150 ${
                            isActive
                              ? 'text-[var(--primary)]'
                              : 'text-slate-500 group-hover/nav-item:text-slate-300'
                          }`}
                          style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(91,141,239,0.5))' } : undefined}
                        />
                        <span>{item.label}</span>
                      </SidebarMenuButton>

                      {item.badge !== undefined && item.badge > 0 ? (
                        <SidebarMenuBadge
                          className="text-[9px] font-bold bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20 rounded-full px-1.5"
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
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Command size={14} className="text-slate-600" />
                <span className="text-xs">Quick search</span>
                <SidebarMenuBadge className="text-[9px] font-mono text-slate-600">⌘K</SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
