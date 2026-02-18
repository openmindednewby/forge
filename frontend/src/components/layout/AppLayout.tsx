import {
  Box,
  Image,
  Layers,
  MonitorCog,
  Sparkles,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";

const NAV_ITEMS = [
  { to: "/", icon: Sparkles, label: "Generate" },
  { to: "/gallery", icon: Image, label: "Gallery" },
  { to: "/models", icon: Box, label: "Models" },
  { to: "/settings", icon: MonitorCog, label: "Settings" },
] as const;

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface-0">
        <Outlet />
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <nav className="flex w-16 flex-col items-center gap-1 border-r border-neutral-800 bg-surface-1 py-4">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-forge-500 font-bold text-white">
        <Layers className="h-5 w-5" />
      </div>

      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex h-12 w-12 flex-col items-center justify-center rounded-lg text-[10px] transition-colors ${
              isActive
                ? "bg-forge-500/15 text-forge-400"
                : "text-neutral-500 hover:bg-surface-3 hover:text-neutral-300"
            }`
          }
        >
          <Icon className="mb-0.5 h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
