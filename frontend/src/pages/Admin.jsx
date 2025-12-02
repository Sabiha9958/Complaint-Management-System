// src/pages/Admin.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Adjust paths according to your folder structure
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import Complaints from "./admin/Complaints";
import ComplaintList from "./admin/ComplaintList";
import Users from "./admin/Users";
import Reports from "./admin/Reports";
import AdminSetting from "./admin/AdminSetting";

const Admin = () => {
  return (
    <AdminLayout>
      <Routes>
        {/* /admin */}
        <Route index element={<AdminDashboard />} />

        {/* /admin/complaints (main, modern complaints list) */}
        <Route path="complaints" element={<Complaints />} />

        {/* /admin/complaints/list (older grid/list, if still needed) */}
        <Route path="complaints/list" element={<ComplaintList />} />

        {/* /admin/users */}
        <Route path="users" element={<Users />} />

        {/* /admin/reports */}
        <Route path="reports" element={<Reports />} />

        {/* /admin/settings */}
        <Route path="settings" element={<AdminSetting />} />

        {/* Fallback: redirect unknown admin routes back to dashboard */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default Admin;
