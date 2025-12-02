// src/pages/Complaints.jsx
import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";

import MyComplaints from "./complaints/MyComplaints";
import AllComplaints from "./complaints/AllComplaints";
import ComplaintDetailPage from "./complaints/ComplaintDetailPage";
import ComplaintEditPage from "./complaints/ComplaintEditPage";
import SubmitComplaint from "./complaints/SubmitComplaint";

const Complaints = () => {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white shadow-sm">
                <span className="text-lg font-bold">C</span>
              </span>
              Complaints
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Submit, track, and review all complaints in one place.
            </p>
          </div>
        </header>

        {/* Tabs */}
        <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-wrap gap-2 text-sm">
          <TabLink to="/complaints/my" label="My Complaints" />
          <TabLink to="/complaints/all" label="All Complaints" />
          <TabLink to="/complaints/new" label="Submit Complaint" />
        </nav>

        {/* Nested Routes */}
        <section>
          <Routes>
            {/* Default redirect: /complaints -> /complaints/my */}
            <Route index element={<Navigate to="my" replace />} />

            <Route path="my" element={<MyComplaints />} />
            <Route path="all" element={<AllComplaints />} />
            <Route path="new" element={<SubmitComplaint />} />
            <Route path=":id" element={<ComplaintDetailPage />} />
            <Route path=":id/edit" element={<ComplaintEditPage />} />

            {/* Fallback */}
            <Route
              path="*"
              element={
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
                  Unknown complaints page. Use the tabs above to navigate.
                </div>
              }
            />
          </Routes>
        </section>
      </div>
    </main>
  );
};

/* Tab Link Component */
const TabLink = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium transition-colors",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-transparent text-gray-600 hover:bg-gray-100",
      ].join(" ")
    }
  >
    {label}
  </NavLink>
);

export default Complaints;
