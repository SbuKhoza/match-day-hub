import { Home, Trophy, Radio, Newspaper, Play, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  mobile: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: Home, mobile: true },
  { to: "/fantasy", label: "Fantasy", icon: Trophy, mobile: true },
  { to: "/match-center", label: "Match Center", icon: Radio, mobile: true },
  { to: "/news", label: "News", icon: Newspaper, mobile: false },
  { to: "/videos", label: "Videos", icon: Play, mobile: true },
  { to: "/profile", label: "Profile", icon: User, mobile: true },
];