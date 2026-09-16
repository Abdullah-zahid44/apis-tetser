import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-colors duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-primary/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-primary/90',
        outline:
          'border-border bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:bg-accent hover:text-accent-foreground hover:border-[color-mix(in_srgb,var(--border)_55%,var(--primary)_45%)] aria-expanded:bg-accent aria-expanded:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-secondary',
        ghost:
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground',
        destructive:
          'bg-destructive/12 text-destructive border-[color-mix(in_srgb,var(--destructive)_28%,transparent)] hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline font-medium',
      },
      size: {
        default:
          'h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 text-sm',
        xs: "h-7 gap-1.5 rounded-md px-2.5 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-10 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        icon: 'size-9',
        'icon-xs':
          "size-7 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm':
          'size-8 rounded-md in-data-[slot=button-group]:rounded-md',
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
