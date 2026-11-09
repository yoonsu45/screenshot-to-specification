import { Link, useRouterState } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { navItems } from "./nav-items";

export function BottomTabBar({ onCheck }: { onCheck: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [a, b, c, d] = navItems;
  const Tab = ({ item }: { item: (typeof navItems)[number] }) => {
    const active = path === item.to;
    return (
      <Link to={item.to} className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${active ? "font-bold text-primary" : "text-muted-foreground"}`}>
        <item.icon className="h-6 w-6" />
        {item.label}
      </Link>
    );
  };
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-end px-2">
        <Tab item={a} />
        <Tab item={b} />
        <button onClick={onCheck} className="flex flex-1 flex-col items-center gap-1 pb-2 text-xs font-bold text-primary" aria-label="행사 확인">
          <span className="-mt-7 grid h-16 w-16 place-items-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-fab">
            <Camera className="h-7 w-7" />
          </span>
          행사 확인
        </button>
        <Tab item={c} />
        <Tab item={d} />
      </div>
    </nav>
  );
}
