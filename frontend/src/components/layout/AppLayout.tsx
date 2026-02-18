import type { JSX } from "react";

import { NavLink, Outlet } from "react-router";

import {
  Box,
  Image,
  Layers,
  MonitorCog,
  Sparkles,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

const NAV_ITEMS: ReadonlyArray<{
  to: string;
  icon: LucideIcon;
  label: string;
}> = [
  { to: "/", icon: Sparkles, label: "Generate" },
  { to: "/gallery", icon: Image, label: "Gallery" },
  { to: "/models", icon: Box, label: "Models" },
  { to: "/settings", icon: MonitorCog, label: "Settings" },
];

const NavItem = ({
  to,
  icon,
  label,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
}): JSX.Element => {
  const IconComponent = icon;
  return (
    <NavLink
      className={({ isActive }): string =>
        `flex h-12 w-12 flex-col items-center justify-center rounded-lg text-[10px] transition-colors ${
          isActive
            ? "bg-forge-500/15 text-forge-400"
            : "text-neutral-500 hover:bg-surface-3 hover:text-neutral-300"
        }`
      }
      end={to === "/"}
      to={to}
    >
      <IconComponent className="mb-0.5 h-5 w-5" />
      {label}
    </NavLink>
  );
};

const Sidebar = (): JSX.Element => (
  <nav className="flex w-16 flex-col items-center gap-1 border-r border-neutral-800 bg-surface-1 py-4">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-forge-500 font-bold text-white">
      <Layers className="h-5 w-5" />
    </div>

    {NAV_ITEMS.map((item) => (
      <NavItem
        key={item.to}
        icon={item.icon}
        label={item.label}
        to={item.to}
      />
    ))}
  </nav>
);

export const AppLayout = (): JSX.Element => (
  <div className="flex h-screen overflow-hidden">
    <Sidebar />
    <main className="flex-1 overflow-y-auto bg-surface-0">
      <Outlet />
    </main>
  </div>
);
