// src/pages/Settings.jsx
import React, { useState } from "react";
import ResetPassword from "./settings/ResetPassword";
import ForgotPassword from "./settings/ForgotPassword";
import ProfilePage from "./settings/ProfilePage";
import NotificationsPage from "./settings/NotificationsPage";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "security" | "notifications"

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/10 to-indigo-50/20 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600">
            Manage your account, security and notification preferences.
          </p>
        </section>

        {/* Tabs */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-wrap gap-2 text-sm">
          <TabButton
            label="Profile"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          <TabButton
            label="Security"
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
          />
          <TabButton
            label="Notifications"
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
          />
        </section>

        {/* Content */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <ProfilePage />
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6">
            {/* You can keep both forms, or only ResetPassword if Forgot is used via email link */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-800">
                Change password
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Update your account password from here.
              </p>
            </div>
            <ResetPassword />

            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-1">
                Forgot password link
              </h2>
              <p className="text-xs text-gray-600 mb-4">
                You can also trigger a password reset email from here for your
                account.
              </p>
              <ForgotPassword />
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <NotificationsPage />
          </div>
        )}
      </div>
    </main>
  );
};

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-blue-600 text-white shadow-sm"
        : "bg-transparent text-gray-600 hover:bg-gray-100"
    }`}
  >
    {label}
  </button>
);

export default Settings;
