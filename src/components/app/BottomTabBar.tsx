import { Link, useRouterState } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { navItems } from "./nav-items";

export function BottomTabBar({ onCheck }: { onCheck: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [a, b, c, d] = navItems;
  const Tab = ({ item }: { item: (typeof navItems)[number] }) => {
    const active = path === item.to;
    return (
      <Link to={item.to} className={`flex flex-1 flex-col items-center gap-1.5 py-3 text-xs font-extrabold sm:text-sm ${active ? "text-brand-orange" : "text-primary"}`}>
        <item.icon className="h-7 w-7" />
        {item.label}
      </Link>
    );
  };
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-20px_rgba(7,31,75,0.35)] backdrop-blur lg:hidden">
      <div className="mx-auto flex h-[5.35rem] max-w-2xl items-end px-1.5">
        <Tab item={a} />
        <Tab item={b} />
        <button onClick={onCheck} className="flex flex-1 flex-col items-center gap-1 pb-3 text-xs font-extrabold text-primary sm:text-sm" aria-label="행사 확인">
          <span className="relative -mt-9 grid h-[4.6rem] w-[4.6rem] place-items-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-fab">
            <Camera className="h-8 w-8" />
            <span className="pointer-events-none absolute h-2.5 w-2.5 rounded-full border-2 border-brand-orange" />
          </span>
          행사 확인
        </button>
        <Tab item={c} />
        <Tab item={d} />
      </div>
    </nav>
  );
}
