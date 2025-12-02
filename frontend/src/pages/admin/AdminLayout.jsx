// src/pages/admin/AdminLayout.jsx
import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  FileWarning,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Define navigation items outside the component to prevent re-creation on render
const NAV_ITEMS = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
    subtitle: "Overview of activity",
  },
  {
    label: "Users",
    to: "/admin/users",
    icon: Users,
    subtitle: "Manage system users",
  },
  {
    label: "Complaints",
    to: "/admin/complaints",
    icon: FileWarning,
    subtitle: "Track and resolve issues",
  },
  {
    label: "Reports",
    to: "/admin/reports",
    icon: BarChart2,
    subtitle: "Analytics & insights",
  },
  {
    label: "Settings",
    to: "/admin/settings",
    icon: Settings,
    subtitle: "Configure admin panel",
  },
];

/**
 * Sub-component for rendering Sidebar Links
 * Handles active state styling and collapsed view logic
 */
const SidebarLink = ({ item, isCollapsed, currentPath, onClick }) => {
  const Icon = item.icon;

  // Exact match for root, startsWith for sub-routes
  const isActive =
    item.to === "/admin"
      ? currentPath === "/admin"
      : currentPath.startsWith(item.to);

  const baseClasses =
    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200";
  const activeClasses = isActive
    ? "bg-blue-50 text-blue-700 shadow-sm"
    : "text-slate-700 hover:bg-slate-100";

  return (
    <NavLink
      to={item.to}
      end={item.to === "/admin"}
      onClick={onClick}
      className={`${baseClasses} ${activeClasses}`}
      title={isCollapsed ? item.label : ""}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
          isActive
            ? "bg-blue-100 text-blue-700"
            : "bg-slate-100 text-slate-600 group-hover:bg-white"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>

      {!isCollapsed && (
        <div className="flex min-w-0 flex-col animate-in fade-in slide-in-from-left-2 duration-200">
          <span className="truncate">{item.label}</span>
          <span className="truncate text-[11px] font-normal text-slate-500">
            {item.subtitle}
          </span>
        </div>
      )}
    </NavLink>
  );
};

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.name || "Admin";
  const roleLabel = user?.role ? user.role.toUpperCase() : "ADMIN";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      // Handle error implicitly or show toast
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "w-20" : "w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static`}
        aria-label="Sidebar"
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-lg font-bold">
              A
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="text-sm font-semibold tracking-tight text-slate-900 truncate">
                  Admin Panel
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  {roleLabel}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="hidden h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 md:flex"
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
            >
              {sidebarCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-900 md:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-slate-200">
          {NAV_ITEMS.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              isCollapsed={sidebarCollapsed}
              currentPath={location.pathname}
              onClick={() => setSidebarOpen(false)} // Close sidebar on mobile when clicked
            />
          ))}
        </nav>

        {/* Footer / User Profile */}
        <div className="border-t border-slate-200 p-3">
          <div
            className={`flex items-center gap-3 mb-3 ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p
                  className="text-sm font-semibold text-slate-900 truncate"
                  title={displayName}
                >
                  {displayName}
                </p>
                <p
                  className="text-xs text-slate-500 truncate"
                  title={user?.email}
                >
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="group w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0 overflow-auto bg-slate-50 flex flex-col h-screen">
        {/* Mobile Header (Hamburger) */}
        <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
          <span className="text-lg font-bold text-slate-900">Admin Panel</span>
          <div className="w-10" aria-hidden="true" />{" "}
          {/* Spacer for alignment */}
        </div>

        {/* Page Content */}
        <div className="flex-1">
          {children || (
            <div className="flex h-full items-center justify-center text-slate-400">
              <p>No content available</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
