import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileWarning,
  BarChart2,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ShieldUser,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// --- Configuration ---
const NAV_ITEMS = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Complaints", to: "/admin/complaints", icon: FileWarning },
  { label: "Reports", to: "/admin/reports", icon: BarChart2 },
  { label: "Roles", to: "/admin/roles", icon: Shield },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const SIDEBAR_WIDTH = { expanded: 210, collapsed: 64 }; // px

// --- Utility: Class Name Helper ---
const cn = (...classes) => classes.filter(Boolean).join(" ");

// --- Hook: LocalStorage ---
function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// --- Component: Sidebar Item ---
// Handles the logic for showing/hiding text based on collapsed state
const SidebarItem = ({ item, collapsed, onClick }) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center rounded-xl px-3 py-2 mx-2 my-0.5",
          "transition-all duration-300 ease-in-out",
          isActive
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )
      }
    >
      {/* Icon Wrapper - Always centered if collapsed */}
      <div className="flex items-center justify-center min-w-[24px]">
        <Icon size={20} />
      </div>

      {/* Text Label - Animates width to 0 when collapsed */}
      <div
        className={cn(
          "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
          collapsed
            ? "w-0 opacity-0 translate-x-4"
            : "w-auto opacity-100 ml-3 translate-x-0"
        )}
      >
        <span className="text-sm font-semibold">{item.label}</span>
      </div>

      {/* Hover Tooltip (Only visible when collapsed) */}
      {collapsed && (
        <div className="absolute left-full ml-4 hidden group-hover:block z-50">
          <div className="bg-slate-900 text-white text-xs font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {item.label}
          </div>
        </div>
      )}
    </NavLink>
  );
};

// --- Component: Sidebar Content (Logo + Nav + Footer) ---
const SidebarContent = ({
  collapsed,
  setCollapsed,
  onLogout,
  mobile = false,
}) => {
  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div
        className={cn(
          "flex h-16 items-center px-4 transition-all duration-300",
          collapsed ? "justify-center" : "justify-start"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <ShieldUser size={20} />
          </div>

          <div
            className={cn(
              "flex flex-col overflow-hidden transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-32 opacity-100"
            )}
          >
            <span className="text-sm font-extrabold text-slate-900 leading-none">
              ADMIN
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">
              Console
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.to}
            item={item}
            collapsed={collapsed}
            onClick={mobile ? () => setCollapsed(false) : undefined}
          />
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-slate-100 p-3 mb-20">
        <button
          onClick={onLogout}
          className="flex w-full items-center rounded-xl px-3 py-3 text-red-600 hover:bg-red-50 transition-colors group relative"
        >
          <div className="flex items-center justify-center min-w-[24px]">
            <LogOut size={20} />
          </div>
          <div
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-3"
            )}
          >
            <span className="text-sm font-semibold">Logout</span>
          </div>
          {/* Logout Tooltip */}
          {collapsed && (
            <div className="absolute left-full ml-4 hidden group-hover:block z-50">
              <div className="bg-red-900 text-white text-xs font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
                Logout
              </div>
            </div>
          )}
        </button>

        {/* Toggle Button (Desktop Only) */}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mt-2 flex w-full items-center justify-center rounded-lg py-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft
              size={20}
              className={cn(
                "transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main Layout Component ---
export default function AdminLayout() {
  const [collapsed, setCollapsed] = useLocalStorageState(
    "admin_sidebar_collapsed",
    false
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handlers
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed", error);
    }
  }, [logout, navigate]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- Mobile Header --- */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-slate-900">Admin Console</span>
        </div>
      </header>

      {/* ✅ Mobile Main Content (was missing) */}
      <main className="md:hidden min-w-0 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>

      {/* --- Desktop Layout Grid --- */}
      <div
        className="hidden md:grid min-h-screen transition-all duration-300 ease-in-out"
        style={{
          gridTemplateColumns: collapsed
            ? `${SIDEBAR_WIDTH.collapsed}px 1fr`
            : `${SIDEBAR_WIDTH.expanded}px 1fr`,
        }}
      >
        {/* Desktop Sidebar */}
        <aside className="sticky top-0 h-screen">
          <SidebarContent
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            onLogout={handleLogout}
          />
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      {/* --- Mobile Sidebar Overlay --- */}
      {/* Wrapper */}
      <div
        className={cn(
          "relative z-50 md:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 w-[80%] max-w-xs bg-white shadow-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Close Button inside Drawer */}
          <div className="absolute right-4 top-4">
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <SidebarContent
            collapsed={false} // Always expanded on mobile
            setCollapsed={() => setMobileOpen(false)}
            onLogout={handleLogout}
            mobile={true}
          />
        </div>
      </div>
    </div>
  );
}
