import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, ChevronDown } from "lucide-react";
import headerImg from "@/assets/header-park.jpg";
import { BrandMark } from "./BrandMark";
import { BottomTabBar } from "./BottomTabBar";
import { CheckSheet } from "./CheckSheet";
import { FacilityPicker } from "./FacilityPicker";
import { navItems } from "./nav-items";
import { useAppStore } from "@/lib/app-store";
import { getFacility } from "@/data/facilities";

export function AppShell({ children }: { children: ReactNode }) {
  const { setCheckOpen, facilityId, setFacilityId } = useAppStore();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-6 lg:flex">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-primary">
          <BrandMark /> 올팍 행사체크
        </Link>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">장소 선택</p>
          <button onClick={() => setPickerOpen(true)} className="flex w-full items-center justify-between rounded-xl bg-lime px-4 py-3 text-left font-bold text-lime-foreground">
            <span className="truncate">{getFacility(facilityId)?.name}</span>
            <ChevronDown className="h-5 w-5 shrink-0" />
          </button>
        </div>
        <button onClick={() => setCheckOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-bold text-primary-foreground shadow-fab hover:opacity-95">
          <Camera className="h-5 w-5" /> 행사 확인
        </button>
        <nav className="flex flex-col gap-1">
          {navItems.map((n) => (
            <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold ${path === n.to ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              <n.icon className="h-5 w-5" /> {n.desktopLabel}
            </Link>
          ))}
        </nav>
        <p className="mt-auto text-xs text-muted-foreground">시연용 데이터로 동작하는 프로토타입이에요.</p>
      </aside>

      <div className="relative min-w-0 flex-1 pb-28 lg:pb-12">
        <img src={headerImg} alt="" width={1536} height={512} className="pointer-events-none absolute right-0 top-0 h-40 w-full object-cover object-right opacity-90 lg:h-56" />
        <div className="relative mx-auto w-full max-w-xl px-4 pt-5 lg:max-w-5xl lg:px-10 lg:pt-10">
          <Link to="/" className="mb-3 flex items-center gap-2 text-xl font-extrabold text-primary lg:hidden">
            <BrandMark /> 올팍 행사체크
          </Link>
          {children}
        </div>
      </div>

      <BottomTabBar onCheck={() => setCheckOpen(true)} />
      <CheckSheet />
      <FacilityPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedId={facilityId}
        onSelect={(id) => {
          setFacilityId(id);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
