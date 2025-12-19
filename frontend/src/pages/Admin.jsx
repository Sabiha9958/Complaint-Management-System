// src/pages/Admin.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import Complaints from "./admin/Complaints";
import Users from "./admin/Users";
import Reports from "./admin/Reports";
import AdminSetting from "./admin/AdminSetting";
import RolesPermissions from "./admin/RolesPermissions";

export default function Admin() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="complaints/*" element={<Complaints />} />
        <Route path="users" element={<Users />} />
        <Route path="roles" element={<RolesPermissions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<AdminSetting />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
