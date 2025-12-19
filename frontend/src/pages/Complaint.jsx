import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { FiFileText, FiUser, FiGrid, FiPlusCircle } from "react-icons/fi";

import MyComplaints from "./complaints/MyComplaints";
import AllComplaints from "./complaints/ComplaintsShowcase";
import ComplaintDetailPage from "./complaints/ComplaintDetailPage";
import ComplaintEditPage from "./complaints/ComplaintEditPage";
import SubmitComplaint from "./complaints/SubmitComplaint";

/* Central config: tabs + routes in one place */
const TABS = [
  { to: "/complaints/my", label: "My", sub: "Your submissions", Icon: FiUser },
  { to: "/complaints/all", label: "All", sub: "Browse all", Icon: FiGrid },
  {
    to: "/complaints/new",
    label: "New",
    sub: "Submit complaint",
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

export default function Complaint() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                  <FiFileText className="h-5 w-5" />
                </span>
                Complaints
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Submit, track, and manage complaints in one place.
              </p>
            </div>

            {/* Optional quick action (keeps UX fast even if user scrolls) */}
            <NavLink
              to="/complaints/new"
              className={({ isActive }) =>
                [
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition shadow-sm",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50",
                ].join(" ")
              }
            >
              <FiPlusCircle className="h-5 w-5" />
              Submit
            </NavLink>
          </div>
        </header>

        {/* Tabs (sticky) */}
        <nav
          aria-label="Complaints sections"
          className="sticky top-3 z-10 rounded-2xl border border-gray-200 bg-white/85 backdrop-blur shadow-sm p-2"
        >
          <div className="grid grid-cols-3 gap-2">
            {TABS.map((t) => (
              <TabLink
                key={t.to}
                to={t.to}
                label={t.label}
                sub={t.sub}
                Icon={t.Icon}
              />
            ))}
          </div>
        </nav>

        {/* Nested Routes */}
        <section className="min-h-[50vh]">
          <Routes>
            {ROUTES.map((r, i) =>
              r.index ? (
                <Route key={`idx-${i}`} index element={r.element} />
              ) : (
                <Route key={r.path} path={r.path} element={r.element} />
              )
            )}

            <Route
              path="*"
              element={
                <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    Unknown complaints page
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Use the tabs above to navigate.
                  </p>
                </div>
              }
            />
          </Routes>
        </section>
      </div>
    </main>
  );
}

/* Segmented Tab */
function TabLink({ to, label, sub, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group relative rounded-xl border px-3 py-2.5 transition text-left",
          isActive
            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
        ].join(" ")
      }
    >
      <div className="flex items-center gap-2.5">
        <span
          className={[
            "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition",
            "shrink-0",
            "group-hover:scale-[1.02]",
            // icon capsule
            "bg-white/10 border-white/20 text-white",
          ].join(" ")}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-extrabold leading-tight truncate">
            {label}
          </p>
          <p className="text-[11px] opacity-90 leading-tight truncate">{sub}</p>
        </div>
      </div>
    </NavLink>
  );
}
