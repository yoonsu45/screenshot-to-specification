import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, ChevronDown, MapPin } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { BottomTabBar } from "./BottomTabBar";
import { CheckSheet } from "./CheckSheet";
import { FacilityPicker } from "./FacilityPicker";
import { navItems } from "./nav-items";
import { useAppStore } from "@/lib/app-store";
import { ALL_FACILITIES_ID, getFacility } from "@/data/facilities";
import { LoginDialog } from "./LoginDialog";

export function AppShell({ children }: { children: ReactNode }) {
  const { setCheckOpen, facilityId, setFacilityId } = useAppStore();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [pickerOpen, setPickerOpen] = useState(false);
  const facilityLabel = facilityId === ALL_FACILITIES_ID ? "전체 장소" : (getFacility(facilityId)?.name ?? "장소 선택");

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-7 border-r border-sidebar-border bg-sidebar p-7 lg:flex">
        <Link to="/" aria-label="홈으로 이동">
          <BrandMark className="text-3xl" />
        </Link>
        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">장소 선택</p>
          <button onClick={() => setPickerOpen(true)} className="flex w-full items-center justify-between rounded-full bg-secondary px-4 py-3 text-left font-bold text-primary">
            <span className="flex min-w-0 items-center gap-2"><MapPin className="h-5 w-5 shrink-0" /><span className="truncate">{facilityLabel}</span></span>
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
      </aside>

      <div className="min-w-0 flex-1 pb-32 lg:pb-14">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 sm:px-7 lg:px-10 lg:pt-9">
          <header className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="lg:hidden" aria-label="홈으로 이동">
                <BrandMark className="text-[2.15rem] sm:text-4xl" />
              </Link>
              <div className="ml-auto"><LoginDialog /></div>
            </div>
            <button onClick={() => setPickerOpen(true)} className="mt-7 inline-flex max-w-full items-center gap-2 rounded-full bg-secondary px-5 py-3 text-left text-lg font-extrabold text-primary transition hover:bg-accent" aria-label="장소 선택 열기">
              <MapPin className="h-6 w-6 shrink-0" />
              <span className="truncate">{facilityLabel}</span>
              <ChevronDown className="h-5 w-5 shrink-0" />
            </button>
          </header>
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
