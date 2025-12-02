// src/components/Layout/Navbar.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  FileText,
  PlusCircle,
  User,
  Users,
  Settings,
  BarChart2,
  Download,
  ChevronDown,
  Shield,
  LogOut,
  Menu,
  X,
  Briefcase,
  FolderOpen,
  LayoutDashboard,
  ClipboardList,
} from "lucide-react";

/* ================================================================
   🎯 SCREEN SIZE BREAKPOINTS
   ================================================================ */

const SCREEN_SIZES = {
  XS: 0, // Extra Small: 0-639px (mobile)
  SM: 640, // Small: 640-767px (large mobile)
  MD: 768, // Medium: 768-1023px (tablet)
  LG: 1024, // Large: 1024-1279px (small desktop)
  XL: 1280, // Extra Large: 1280px+ (large desktop)
};

/* ================================================================
   🧰 CUSTOM HOOKS
   ================================================================ */

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

const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState("XL");

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < SCREEN_SIZES.SM) setScreenSize("XS");
      else if (width < SCREEN_SIZES.MD) setScreenSize("SM");
      else if (width < SCREEN_SIZES.LG) setScreenSize("MD");
      else if (width < SCREEN_SIZES.XL) setScreenSize("LG");
      else setScreenSize("XL");
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  return screenSize;
};

/* ================================================================
   🎨 UI COMPONENTS
   ================================================================ */

const Logo = ({ screenSize }) => {
  const navigate = useNavigate();
  const showFull = ["MD", "LG", "XL"].includes(screenSize);

  return (
    <button
      onClick={() => navigate("/")}
      className="flex items-center gap-2.5 group focus:outline-none"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-105">
        <FileText className="w-5 h-5 text-white" />
      </div>
      {showFull && (
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            Complaint<span className="text-indigo-600">MS</span>
          </span>
          <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">
            System
          </span>
        </div>
      )}
    </button>
  );
};

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
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${style.bg} ${style.text} ${style.border}`}
    >
      {role}
    </span>
  );
};

const UserAvatar = ({ user, size = "md" }) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-10 h-10 text-base",
  };
  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div
      className={`${sizes[size]} relative flex items-center justify-center rounded-full ring-2 ring-white shadow-sm font-bold overflow-hidden flex-shrink-0`}
    >
      {user?.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user.name}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          {initial}
        </div>
      )}
    </div>
  );
};

/* ================================================================
   🧭 NAVIGATION COMPONENTS
   ================================================================ */

const NavItem = ({ item, onClick, screenSize }) => {
  const showLabel = ["LG", "XL"].includes(screenSize);

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
          isActive
            ? "text-indigo-600 bg-indigo-50"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`
      }
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {showLabel && <span>{item.label}</span>}
    </NavLink>
  );
};

const NavDropdown = ({ item, screenSize }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const isActive = item.links?.some((link) =>
    location.pathname.startsWith(link.to)
  );
  const showLabel = ["LG", "XL"].includes(screenSize);

  useEffect(() => setIsOpen(false), [location.pathname]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
          isActive || isOpen
            ? "text-indigo-600 bg-indigo-50"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {showLabel && <span>{item.label}</span>}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 z-50 w-56 mt-2 origin-top-left bg-white border shadow-xl rounded-xl border-gray-100"
          >
            <div className="p-1.5">
              {item.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <link.icon className="w-4 h-4 opacity-70" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UserMenu = ({ user, logout, screenSize }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useClickOutside(menuRef, () => setIsOpen(false));

  const showDetails = ["MD", "LG", "XL"].includes(screenSize);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 transition-opacity hover:opacity-80 focus:outline-none"
      >
        {showDetails && (
          <div className="text-right">
            <p className="text-sm font-bold leading-none text-gray-900">
              {user?.name}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wide">
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
            className="absolute right-0 z-50 w-64 mt-3 origin-top-right bg-white border shadow-xl rounded-xl border-gray-100"
          >
            <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} size="md" />
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <RoleBadge role={user?.role} />
              </div>
            </div>
            <div className="p-1.5">
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsOpen(false);
                }}
                className="flex items-center w-full gap-2 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <User className="w-4 h-4" /> View Profile
              </button>
              <button
                onClick={() => {
                  navigate("/settings");
                  setIsOpen(false);
                }}
                className="flex items-center w-full gap-2 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" /> Account Settings
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="flex items-center w-full gap-2 px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ================================================================
   📱 MOBILE MENU
   ================================================================ */

const MobileMenu = ({
  isOpen,
  onClose,
  navigation,
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
          className="overflow-hidden bg-white border-t border-gray-100"
        >
          <div className="p-4 space-y-4 max-h-[calc(100vh-64px)] overflow-y-auto">
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 p-4 border rounded-xl border-gray-100 bg-gray-50">
                <UserAvatar user={user} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <RoleBadge role={user.role} />
              </div>
            )}

            {isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    navigate("/profile");
                    onClose();
                  }}
                  className="flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    navigate("/settings");
                    onClose();
                  }}
                  className="flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </button>
                <div className="border-t border-gray-100 my-2" />
              </>
            )}

            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.id}>
                  {item.type === "dropdown" ? (
                    <div className="py-2">
                      <p className="px-3 mb-2 text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </p>
                      {item.links.map((link) => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg ${
                              isActive
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-600 hover:bg-gray-50"
                            }`
                          }
                        >
                          <link.icon className="w-4 h-4 opacity-70" />
                          {link.label}
                        </NavLink>
                      ))}
                    </div>
                  ) : (
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-gray-600 hover:bg-gray-50"
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 opacity-70" />
                      {item.label}
                    </NavLink>
                  )}
                </div>
              ))}
            </div>

            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <NavLink
                  to="/login"
                  onClick={onClose}
                  className="flex justify-center py-3 text-sm font-bold border rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Log In
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={onClose}
                  className="flex justify-center py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700"
                >
                  Register
                </NavLink>
              </div>
            ) : (
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center justify-center w-full gap-2 py-3 mt-4 text-sm font-bold text-red-600 transition-colors border rounded-xl border-red-100 bg-red-50 hover:bg-red-100"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ================================================================
   🚀 MAIN NAVBAR
   ================================================================ */

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const screenSize = useScreenSize();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const navigation = useMemo(() => {
    const checkPermission = (roles) => {
      if (!roles || roles.length === 0) return true;
      return user && roles.includes(user.role);
    };

    const links = [
      {
        id: "home",
        label: "Home",
        icon: Home,
        to: "/",
        roles: [],
        type: "link",
      },
      {
        id: "new",
        label: "New Complaint",
        icon: PlusCircle,
        to: "/complaints/new",
        roles: ["user", "staff", "admin"],
        type: "link",
      },
      {
        id: "workspace",
        label: "Workspace",
        icon: FolderOpen,
        type: "dropdown",
        roles: ["user", "staff", "admin"],
        links: [
          {
            to: "/complaints/my",
            label: "My Complaints",
            icon: ClipboardList,
            roles: ["user", "staff", "admin"],
          },
          {
            to: "/complaints/all",
            label: "All Complaints",
            icon: FileText,
            roles: ["user", "staff", "admin"],
          },
        ].filter((l) => checkPermission(l.roles)),
      },
      {
        id: "admin",
        label: "Management",
        icon: Briefcase,
        type: "dropdown",
        roles: ["staff", "admin"],
        links: [
          {
            to: "/admin",
            label: "Dashboard",
            icon: LayoutDashboard,
            roles: ["staff", "admin"],
          },
          {
            to: "/admin/users",
            label: "Users",
            icon: Users,
            roles: ["admin"],
          },
          {
            to: "/admin/reports",
            label: "Reports",
            icon: Download,
            roles: ["staff", "admin"],
          },
          {
            to: "/admin/analytics",
            label: "Analytics",
            icon: BarChart2,
            roles: ["admin"],
          },
        ].filter((l) => checkPermission(l.roles)),
      },
    ];

    return links.filter((item) => {
      if (!isAuthenticated) return item.roles.length === 0;
      if (item.type === "dropdown") {
        return item.links.length > 0 && checkPermission(item.roles);
      }
      return checkPermission(item.roles);
    });
  }, [user, isAuthenticated]);

  const showDesktopNav = ["MD", "LG", "XL"].includes(screenSize);
  const showMobileToggle = ["XS", "SM", "MD"].includes(screenSize);

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo screenSize={screenSize} />

          {/* Desktop Navigation */}
          {showDesktopNav && (
            <div className="flex items-center gap-1">
              {navigation.map((item) =>
                item.type === "dropdown" ? (
                  <NavDropdown
                    key={item.id}
                    item={item}
                    screenSize={screenSize}
                  />
                ) : (
                  <NavItem key={item.id} item={item} screenSize={screenSize} />
                )
              )}
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <NavLink
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600"
                >
                  Log In
                </NavLink>
                <NavLink
                  to="/register"
                  className="px-4 py-2 text-sm font-bold text-white transition-transform bg-indigo-600 rounded-lg shadow-md shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105"
                >
                  Get Started
                </NavLink>
              </div>
            ) : (
              <UserMenu user={user} logout={logout} screenSize={screenSize} />
            )}

            {/* Mobile Toggle */}
            {showMobileToggle && (
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                {isMobileOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileToggle && (
        <MobileMenu
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          navigation={navigation}
          user={user}
          logout={logout}
          isAuthenticated={isAuthenticated}
        />
      )}
    </nav>
  );
};

export default Navbar;
