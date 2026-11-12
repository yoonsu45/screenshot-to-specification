export function BrandMark({ className = "text-4xl" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center font-black leading-none tracking-[-0.065em] text-primary ${className}`} aria-label="the check">
      <span>the</span>
      <span className="mx-[0.12em] translate-y-[-0.02em] tracking-normal text-brand-orange">:</span>
      <span>check</span>
    </span>
  );
}
