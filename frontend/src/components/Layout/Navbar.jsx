// src/components/layout/Navbar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  PlusCircle,
  LayoutDashboard,
  ClipboardList,
  FileText,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Tailwind-aligned breakpoints
const SCREEN_SIZES = { XS: 0, SM: 640, MD: 768, LG: 1024, XL: 1280 };

// Click outside helper
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};

// Screen size detector
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState("XL");

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < SCREEN_SIZES.SM) setScreenSize("XS");
      else if (width < SCREEN_SIZES.MD) setScreenSize("SM");
      else if (width < SCREEN_SIZES.LG) setScreenSize("MD");
      else if (width < SCREEN_SIZES.XL) setScreenSize("LG");
      else setScreenSize("XL");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return screenSize;
};

// Central nav config (ONLY: home, new, dashboard, my, all)
const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    to: "/",
    roles: [], // public
    description: "Go to main dashboard",
  },
  {
    id: "new",
    label: "New",
    icon: PlusCircle,
    to: "/complaints/new",
    roles: ["user", "staff", "admin"],
    description: "Create a new complaint",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/admin",
    roles: ["staff", "admin"],
    description: "Admin dashboard",
  },
  {
    id: "my",
    label: "My",
    icon: ClipboardList,
    to: "/complaints/my",
    roles: ["user", "staff", "admin"],
    description: "Complaints created by you",
  },
  {
    id: "all",
    label: "All",
    icon: FileText,
    to: "/complaints/all",
    roles: ["user", "staff", "admin"],
    description: "Browse complaints based on role",
  },
];

// Logo
const Logo = ({ screenSize }) => {
  const navigate = useNavigate();
  const showFull = ["MD", "LG", "XL"].includes(screenSize);

  return (
    <button
      onClick={() => navigate("/")}
      className="group flex items-center gap-2.5 focus:outline-none"
      type="button"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-105">
        <FileText className="h-5 w-5 text-white" />
      </div>

      {showFull && (
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Complaint<span className="text-indigo-600">MS</span>
          </span>
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">
            System
          </span>
        </div>
      )}
    </button>
  );
};

// Small role pill
const RoleBadge = ({ role }) => {
  const config = {
    admin: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    staff: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    user: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
  };
  const style = config[role] || config.user;

  return (
    <span
      className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.bg} ${style.text} ${style.border}`}
    >
      {role}
    </span>
  );
};

// Avatar with fallback initial
const UserAvatar = ({ user, size = "md" }) => {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-10 w-10 text-base",
  };
  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div
      className={`${sizes[size]} relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ring-2 ring-white shadow-sm`}
    >
      {user?.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          {initial}
        </div>
      )}
    </div>
  );
};

// Desktop nav item
const NavItem = ({ item, screenSize, onNavigate }) => {
  const showLabel = ["MD", "LG", "XL"].includes(screenSize);

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={item.description || item.label}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
          isActive
            ? "bg-indigo-50 text-indigo-600"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`
      }
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      {showLabel && <span>{item.label}</span>}
    </NavLink>
  );
};

// User menu (desktop + md)
const UserMenu = ({ user, logout, screenSize }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const showDetails = ["MD", "LG", "XL"].includes(screenSize);

  useClickOutside(menuRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2.5 transition-opacity hover:opacity-80 focus:outline-none"
        title="Account menu"
        aria-expanded={isOpen}
      >
        {showDetails && (
          <div className="text-right">
            <p className="text-sm font-bold leading-none text-gray-900">
              {user?.name}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {user?.role}
            </p>
          </div>
        )}
        <UserAvatar user={user} size="md" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-3 w-64 origin-top-right rounded-xl border border-gray-100 bg-white shadow-xl"
          >
            <div className="rounded-t-xl border-b border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} size="md" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {user?.email}
                  </p>
                </div>
                <RoleBadge role={user?.role} />
              </div>
            </div>

            <div className="p-1.5">
              <button
                type="button"
                onClick={() => {
                  navigate("/profile");
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <User className="h-4 w-4" /> View Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate("/settings");
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" /> Account Settings
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Mobile menu (XS/SM)
const MobileMenu = ({
  isOpen,
  onClose,
  items,
  user,
  logout,
  isAuthenticated,
}) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-t border-gray-100 bg-white"
        >
          <div className="max-h-[calc(100vh-64px)] space-y-4 overflow-y-auto p-4">
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <UserAvatar user={user} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
                <RoleBadge role={user.role} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.description || item.label}
                  onClick={() => {
                    navigate(item.to);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                <NavLink
                  to="/login"
                  onClick={onClose}
                  className="flex justify-center rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  Log In
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={onClose}
                  className="flex justify-center rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700"
                >
                  Register
                </NavLink>
              </div>
            ) : (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/profile");
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4" /> Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/settings");
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" /> Account
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const screenSize = useScreenSize();

  useEffect(() => setIsMobileOpen(false), [location.pathname]);

  const allowedNavItems = useMemo(() => {
    const hasRole = (roles) => {
      if (!roles || roles.length === 0) return true;
      if (!isAuthenticated || !user) return false;
      return roles.includes(user.role);
    };

    return NAV_ITEMS.filter((item) => {
      if (!isAuthenticated) return item.roles.length === 0;
      return hasRole(item.roles);
    });
  }, [isAuthenticated, user]);

  const showDesktopNav = ["MD", "LG", "XL"].includes(screenSize);
  const showMobileToggle = ["XS", "SM"].includes(screenSize);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo screenSize={screenSize} />

        {showDesktopNav && (
          <div className="flex items-center gap-1">
            {allowedNavItems.map((item) => (
              <NavItem key={item.id} item={item} screenSize={screenSize} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <div className="flex items-center gap-3">
              <NavLink
                to="/login"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600"
              >
                Log In
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-transform hover:scale-105 hover:bg-indigo-700"
              >
                Get Started
              </NavLink>
            </div>
          ) : (
            <UserMenu user={user} logout={logout} screenSize={screenSize} />
          )}

          {showMobileToggle && (
            <button
              type="button"
              onClick={() => setIsMobileOpen((o) => !o)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          )}
        </div>
      </div>

      {showMobileToggle && (
        <MobileMenu
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          items={allowedNavItems}
          user={user}
          logout={logout}
          isAuthenticated={isAuthenticated}
        />
      )}
    </nav>
  );
};

export default Navbar;
