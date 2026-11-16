import { cn } from '@/lib/utils';

type AssanPayLogoProps = {
  showWordmark?: boolean;
  className?: string;
};

export function AssanPayLogo({ showWordmark = true, className }: AssanPayLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 shrink-0', className)} aria-label="AssanPay">
      <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-[#e79543] shadow-[0_5px_14px_rgba(194,104,25,0.2)]">
        <img
          src="/assanpay-logo.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-[1.18] object-cover object-center"
        />
      </span>
      {showWordmark ? (
        <span className="text-[22px] font-bold tracking-[-0.04em] leading-none text-foreground">
          Assan<span className="text-[#df7f2b]">Pay</span>
        </span>
      ) : null}
    </span>
  );
}
