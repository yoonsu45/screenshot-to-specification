export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M14 4c6 6 9 13 8 20-1 5-4 8-8 8s-7-3-8-8C5 17 8 10 14 4z" fill="var(--lime)" />
      <path d="M27 6c5 5 8 11 7 17-1 5-4 8-7 8s-6-3-7-8c-1-6 2-12 7-17z" fill="var(--success)" />
      <rect x="13" y="22" width="2.4" height="14" rx="1.2" fill="var(--primary)" />
      <rect x="26" y="22" width="2.4" height="14" rx="1.2" fill="var(--primary)" />
    </svg>
  );
}
