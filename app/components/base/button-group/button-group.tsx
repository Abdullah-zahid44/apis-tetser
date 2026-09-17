import React from 'react';
import { ButtonGroup as ShadcnButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
}

export function ButtonGroup({ className, children, ...props }: ButtonGroupProps) {
  return (
    <ShadcnButtonGroup className={cn('inline-flex', className)} {...props}>
      {children}
    </ShadcnButtonGroup>
  );
}

export interface ButtonGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id?: string;
  iconLeading?: React.ElementType;
  isSelected?: boolean;
}

export function ButtonGroupItem({
  id,
  iconLeading: IconLeading,
  children,
  className,
  ...props
}: ButtonGroupItemProps) {
  return (
    <Button
      variant="outline"
      size="xs"
      className={cn(
        'h-7 px-2.5 text-xs font-medium gap-1.5 cursor-pointer border-[var(--border)] text-secondary-foreground hover:text-foreground hover:border-[var(--primary)]/40',
        className
      )}
      style={{ background: 'var(--surface-4)' }}
      {...props}
    >
      {IconLeading && <IconLeading size={12} className="shrink-0" />}
      {children && <span>{children}</span>}
    </Button>
  );
}
