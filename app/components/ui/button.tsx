import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/25 active:not-aria-[haspopup]:translate-y-px active:not-aria-[haspopup]:scale-[0.99] disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_4px_14px_var(--glow-primary),0_2px_6px_rgba(0,0,0,0.25)] hover:-translate-y-px hover:brightness-105',
        outline:
          'border-border bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:bg-accent hover:text-accent-foreground hover:border-[color-mix(in_srgb,var(--border)_55%,var(--primary)_45%)] hover:-translate-y-px aria-expanded:bg-accent aria-expanded:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] hover:-translate-y-px aria-expanded:bg-secondary',
        ghost:
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground',
        destructive:
          'bg-destructive/12 text-destructive border-[color-mix(in_srgb,var(--destructive)_28%,transparent)] hover:bg-destructive/20 hover:-translate-y-px focus-visible:border-destructive/40 focus-visible:ring-destructive/25',
        link: 'text-primary underline-offset-4 hover:underline font-medium',
      },
      size: {
        default:
          'h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 text-[13px]',
        xs: "h-7 gap-1.5 rounded-[8px] px-2.5 text-xs in-data-[slot=button-group]:rounded-[8px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[9px] px-3 text-[12.5px] in-data-[slot=button-group]:rounded-[9px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-10 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        icon: 'size-9',
        'icon-xs':
          "size-7 rounded-[8px] in-data-[slot=button-group]:rounded-[8px] [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm':
          'size-8 rounded-[9px] in-data-[slot=button-group]:rounded-[9px]',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
