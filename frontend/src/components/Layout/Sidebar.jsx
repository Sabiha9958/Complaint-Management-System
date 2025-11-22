import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiHome, FiFileText, FiUsers, FiBarChart2 } from "react-icons/fi";

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/admin", icon: FiHome, label: "Dashboard" },
    { path: "/admin/complaints", icon: FiFileText, label: "All Complaints" },
    { path: "/admin/users", icon: FiUsers, label: "Users" },
    { path: "/admin/reports", icon: FiBarChart2, label: "Reports" },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
