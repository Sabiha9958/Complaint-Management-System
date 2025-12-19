// src/pages/Settings.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { User, Shield, Bell, Key, Mail, Trash2 } from "lucide-react";

// --- REPLACE THESE WITH YOUR ACTUAL IMPORTS ---
import ResetPassword from "./settings/ResetPassword";
import ForgotPassword from "./settings/ForgotPassword";
import ProfilePage from "./settings/ProfilePage";
import NotificationsPage from "./settings/NotificationsPage";
// ----------------------------------------------

const TAB_IDS = ["profile", "security", "notifications"];

const Settings = () => {
  const tabs = useMemo(
    () => [
      { id: "profile", label: "Profile", icon: User, element: <ProfilePage /> },
      {
        id: "security",
        label: "Security",
        icon: Shield,
        element: <SecuritySection />,
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        element: <NotificationsPage />,
      },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState(() => getInitialTabFromHash(tabs));

  // Deep-linking: keep tab in sync with URL hash
  useEffect(() => {
    const onHashChange = () => setActiveTab(getInitialTabFromHash(tabs));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [tabs]);

  const setTab = (id) => {
    setActiveTab(id);
    // Update hash without adding extra history entries on every click:
    window.history.replaceState(null, "", `#${id}`);
  };

  const active = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Settings
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account preferences, privacy, and security.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
          {/* Sidebar (Tabs) */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Preferences
                </p>
              </div>

              <SettingsTabs
                tabs={tabs}
                activeId={activeTab}
                onChange={setTab}
              />

              <div className="px-4 pb-4 pt-2 text-xs text-gray-500">
                Tip: Use arrow keys to switch tabs.
              </div>
            </div>
          </aside>

          {/* Content */}
          <section
            className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            aria-live="polite"
          >
            <div className="border-b border-gray-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {active?.label}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {activeTab === "profile" &&
                  "Update your personal info and account details."}
                {activeTab === "security" &&
                  "Update password and recovery options."}
                {activeTab === "notifications" &&
                  "Control how and when you get notified."}
              </p>
            </div>

            <div className="p-4 sm:p-6">
              {/* Panel wrapper for a11y */}
              <div
                role="tabpanel"
                id={`panel-${active?.id}`}
                aria-labelledby={`tab-${active?.id}`}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {active?.element ?? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700">
                    This section is unavailable.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

/** Accessible tabs with keyboard navigation */
const SettingsTabs = ({ tabs, activeId, onChange }) => {
  const btnRefs = useRef({});

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeId)
  );

  const focusTab = (index) => {
    const tab = tabs[index];
    if (!tab) return;
    onChange(tab.id);
    requestAnimationFrame(() => btnRefs.current[tab.id]?.focus?.());
  };

  const onKeyDown = (e) => {
    // Typical tab patterns: Arrow keys move among tabs [web:2][web:8]
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      focusTab((activeIndex + 1) % tabs.length);
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      focusTab((activeIndex - 1 + tabs.length) % tabs.length);
    }
    if (e.key === "Home") {
      e.preventDefault();
      focusTab(0);
    }
    if (e.key === "End") {
      e.preventDefault();
      focusTab(tabs.length - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Settings sections"
      onKeyDown={onKeyDown}
      className="
        flex lg:flex-col gap-1 px-2 pb-2
        overflow-x-auto lg:overflow-visible
        [scrollbar-width:none] [-ms-overflow-style:none]
      "
    >
      {/* hide scrollbar for webkit */}
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeId;

        return (
          <button
            key={tab.id}
            ref={(node) => (btnRefs.current[tab.id] = node)}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={[
              "hide-scrollbar",
              "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              isActive
                ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                : "text-gray-700 hover:bg-gray-50",
            ].join(" ")}
          >
            <span
              className={[
                "grid place-items-center rounded-lg p-2 transition",
                isActive
                  ? "bg-white text-blue-700"
                  : "bg-gray-50 text-gray-500 group-hover:text-gray-700",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
            </span>

            <span className="whitespace-nowrap">{tab.label}</span>

            {isActive && (
              <span className="ml-auto hidden lg:inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                Active
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const SecuritySection = () => {
  const onDelete = () => {
    // Hook your actual delete flow here
    // e.g., open modal -> confirm -> call API -> logout -> redirect
    alert("Wire this to your delete-account flow (modal + API call).");
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-start gap-4 border-b border-gray-100 p-5">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
            <Key className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              Change password
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Use a strong, unique password to protect your account.
            </p>
          </div>
        </div>
        <div className="p-5 bg-gray-50/60">
          <ResetPassword />
        </div>
      </div>

      {/* Recovery */}
      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-start gap-4 border-b border-gray-100 p-5">
          <div className="rounded-xl bg-purple-50 p-2 text-purple-700">
            <Mail className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              Account recovery
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Send a password reset email if you can’t access your account.
            </p>
          </div>
        </div>
        <div className="p-5 bg-gray-50/60">
          <ForgotPassword />
        </div>
      </div>

      {/* Danger */}
      <div className="rounded-2xl border border-red-200 bg-red-50/40">
        <div className="border-b border-red-200/60 p-5">
          <p className="text-xs font-bold tracking-wider text-red-700 uppercase">
            Danger zone
          </p>
          <h3 className="mt-2 text-base font-semibold text-gray-900">
            Delete account
          </h3>
          <p className="mt-1 text-sm text-gray-700">
            Permanently remove your account and all associated data.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5">
          <p className="text-sm text-gray-700">This action cannot be undone.</p>

          <button
            type="button"
            onClick={onDelete}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white
              hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
            "
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
};

function getInitialTabFromHash(tabs) {
  const hash = (window.location.hash || "").replace("#", "").trim();
  const valid = tabs.some((t) => t.id === hash);
  return valid ? hash : (tabs?.[0]?.id ?? "profile");
}

export default Settings;
