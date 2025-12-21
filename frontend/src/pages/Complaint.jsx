import React from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  FiFileText,
  FiUser,
  FiGrid,
  FiPlusCircle,
  FiActivity,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Import actual components
import MyComplaints from "./complaints/MyComplaints";
import AllComplaints from "./complaints/ComplaintsShowcase";
import ComplaintDetailPage from "./complaints/ComplaintDetailPage";
import ComplaintEditPage from "./complaints/ComplaintEditPage";
import SubmitComplaint from "./complaints/SubmitComplaint";

/* --- Utilities --- */
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* --- Configuration --- */
const TABS = [
  {
    id: "my",
    to: "/complaints/my",
    label: "My Complaints",
    sub: "Track status",
    Icon: FiUser,
  },
  {
    id: "all",
    to: "/complaints/all",
    label: "Browse All",
    sub: "Community view",
    Icon: FiGrid,
  },
  {
    id: "new",
    to: "/complaints/new",
    label: "New Report",
    sub: "File issue",
    Icon: FiPlusCircle,
  },
];

const ROUTES = [
  { index: true, element: <Navigate to="my" replace /> },
  { path: "my", element: <MyComplaints /> },
  { path: "all", element: <AllComplaints /> },
  { path: "new", element: <SubmitComplaint /> },
  { path: ":id", element: <ComplaintDetailPage /> },
  { path: ":id/edit", element: <ComplaintEditPage /> },
];

/* --- Sub Components --- */

/**
 * PageWrapper Component
 * Provides consistent page transitions and layout for all routes
 */
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {children}
    </motion.div>
  );
}

/**
 * TabLink Component
 * Individual navigation tab with active state animation
 */
function TabLink({ to, label, sub, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/complaints/my"}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 sm:px-5",
          "hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
          !isActive && "text-slate-500 hover:text-slate-700"
        )
      }
      aria-label={`${label}: ${sub}`}
    >
      {({ isActive }) => (
        <>
          {/* Active Background Animation (Shared Layout) */}
          {isActive && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}

          {/* Icon Capsule */}
          <span
            className={cn(
              "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
              isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105"
                : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-105"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>

          {/* Text Content */}
          <div className="relative z-10 min-w-0 flex-1 text-left hidden sm:block">
            <p
              className={cn(
                "text-sm font-bold leading-none transition-colors",
                isActive ? "text-slate-900" : "text-slate-600"
              )}
            >
              {label}
            </p>
            <p
              className={cn(
                "mt-1 truncate text-[11px] font-medium leading-none transition-colors",
                isActive ? "text-indigo-600" : "text-slate-400"
              )}
            >
              {sub}
            </p>
          </div>
        </>
      )}
    </NavLink>
  );
}

/**
 * NotFoundState Component
 * 404 error state display
 */
function NotFoundState() {
  return (
    <PageWrapper>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-slate-100 p-6">
          <FiGrid className="h-12 w-12 text-slate-400" aria-hidden="true" />
        </div>
        <h3 className="mt-6 text-xl font-bold text-slate-900">
          Page Not Found
        </h3>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <NavLink
          to="/complaints/my"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
        >
          <FiGrid className="h-4 w-4" />
          Back to Dashboard
        </NavLink>
      </div>
    </PageWrapper>
  );
}

/* --- Main Component --- */

/**
 * Complaint Component
 * Main layout and routing for complaint management system
 */
export default function Complaint() {
  const location = useLocation();

  return (
    <main className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header Section */}
        <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Decorative Background Gradient */}
          <div
            className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-50 blur-3xl opacity-60 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-5">
              {/* App Icon */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <FiFileText className="h-7 w-7" aria-hidden="true" />
              </div>

              {/* Header Text */}
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Complaint Hub
                </h1>
                <p className="text-slate-500 font-medium">
                  Manage grievances, track resolutions, and submit reports.
                </p>

                {/* Status Indicators */}
                <div
                  className="flex items-center gap-4 pt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                  role="status"
                  aria-live="polite"
                >
                  <span className="flex items-center gap-1.5">
                    <FiActivity
                      className="text-emerald-500 h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    System Online
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>Avg. Resolution: 2 Days</span>
                </div>
              </div>
            </div>

            {/* Quick Action Button (Desktop Only) */}
            <NavLink
              to="/complaints/new"
              className={({ isActive }) =>
                cn(
                  "hidden md:inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200",
                  "border shadow-sm hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                  isActive
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 pointer-events-none opacity-50"
                    : "bg-indigo-600 border-transparent text-white hover:bg-indigo-700 hover:shadow-lg shadow-indigo-200"
                )
              }
              aria-label="File a new complaint"
            >
              <FiPlusCircle className="h-5 w-5" aria-hidden="true" />
              <span>File Complaint</span>
            </NavLink>
          </div>
        </header>

        {/* Sticky Navigation Tabs */}
        <div className="sticky top-4 z-30">
          <nav
            className="rounded-2xl border border-white/40 bg-white/80 p-1.5 shadow-xl shadow-slate-200/40 backdrop-blur-xl"
            aria-label="Complaint navigation tabs"
          >
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {TABS.map((tab) => (
                <TabLink key={tab.id} {...tab} />
              ))}
            </div>
          </nav>
        </div>

        {/* Animated Routes Container */}
        <section
          className="min-h-[60vh] relative"
          role="region"
          aria-label="Main content"
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {ROUTES.map((route, index) =>
                route.index ? (
                  <Route key={`index-${index}`} index element={route.element} />
                ) : (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={route.element}
                  />
                )
              )}
              <Route path="*" element={<NotFoundState />} />
            </Routes>
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
