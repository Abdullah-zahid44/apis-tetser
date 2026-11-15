'use client';

import { Command, Gauge, History, ServerCog, Webhook } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator, useSidebar,
} from '@/components/ui/sidebar';
import type { View } from './types';
import { AsaanPayLogo } from './asaanpay-logo';

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
        { id: 'workbench' as View, label: 'Dashboard', icon: Gauge, shortcut: 'Alt+1' },
        { id: 'history' as View, label: 'History', icon: History, shortcut: 'Alt+2', badge: historyCount },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'callbacks' as View, label: 'Callbacks', icon: Webhook, shortcut: 'Alt+3', badge: callbackCount },
        { id: 'status' as View, label: 'Environment', icon: ServerCog, shortcut: 'Alt+4' },
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
              <AsaanPayLogo
                showWordmark={state !== 'collapsed' || isMobile}
                className={state === 'collapsed' && !isMobile ? '[&>span:first-child]:!size-8' : undefined}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
                        className={`relative h-10 px-3 transition-colors duration-150 group/nav-item rounded-xl ${
                          item.badge !== undefined && item.badge > 0 ? 'pr-12' : ''
                        } ${
                          isActive
                            ? 'font-semibold !text-white shadow-[0_10px_24px_-14px_rgba(8,120,232,.9)] bg-[linear-gradient(135deg,#1598ee_0%,#0756c9_100%)]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <Icon
                          size={16}
                          className={`transition-colors duration-150 ${
                            isActive ? 'text-white' : 'text-primary'
                          }`}
                        />
                        <span>{item.label}</span>
                      </SidebarMenuButton>

                      {item.badge !== undefined && item.badge > 0 ? (
                        <SidebarMenuBadge
                          className={`!right-2 !top-1/2 !-translate-y-1/2 h-5 min-w-6 rounded-full border px-1.5 text-[10px] font-bold leading-none tabular-nums shadow-none ${
                            isActive
                              ? 'border-white/30 bg-white/15 text-white'
                              : 'border-primary/20 bg-primary/10 text-primary'
                          }`}
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
                className="text-muted-foreground hover:text-foreground transition-colors"
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
