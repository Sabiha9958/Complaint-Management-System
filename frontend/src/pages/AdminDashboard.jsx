import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../components/Layout/Sidebar";
import Dashboard from "../components/Admin/Dashboard";
import ComplaintList from "../components/Admin/ComplaintList";
import Users from "../pages/admin/Users"; // ← ADD THIS
import Reports from "../pages/admin/Reports"; // ← ADD THIS

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="complaints" element={<ComplaintList />} />
          <Route path="users" element={<Users />} /> {/* ← CHANGED */}
          <Route path="reports" element={<Reports />} /> {/* ← CHANGED */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
