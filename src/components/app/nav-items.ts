import { CalendarDays, Home, MapPin, Route as RouteIcon } from "lucide-react";

export const navItems = [
  { to: "/", label: "홈", desktopLabel: "홈", icon: Home },
  { to: "/events", label: "행사", desktopLabel: "행사", icon: CalendarDays },
  { to: "/nearby", label: "주변", desktopLabel: "공연장 주변", icon: MapPin },
  { to: "/directions", label: "가는 길", desktopLabel: "가는 길·주차", icon: RouteIcon },
] as const;
