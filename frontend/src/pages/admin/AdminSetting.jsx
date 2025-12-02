// src/pages/admin/AdminSetting.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const TABS = {
  PROFILE: "PROFILE",
  PASSWORD: "PASSWORD",
};

const AdminSetting = () => {
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);

  // profile states
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // password states
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // common UI state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // TODO: replace with your auth system (token from localStorage / context)
  const token = localStorage.getItem("token");

  // Fetch current admin profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setError("");
        const res = await axios.get("/api/admin/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // expect: { name, email, phone }
        setProfile({
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
        });
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load admin profile."
        );
      } finally {
        setProfileLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [token]);

  // handle profile form change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // handle password form change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const validateProfile = () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      setError("Name and email are required.");
      return false;
    }
    // very basic email check
    if (!profile.email.includes("@")) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const validatePasswords = () => {
    const { currentPassword, newPassword, confirmPassword } = passwords;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return false;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return false;
    }
    return true;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateProfile()) return;

    try {
      setProfileLoading(true);
      await axios.put(
        "/api/admin/profile",
        { ...profile },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update admin profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validatePasswords()) return;

    try {
      setPasswordLoading(true);
      await axios.put(
        "/api/admin/change-password",
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Password changed successfully.");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Admin Settings
          </h2>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-4 border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab(TABS.PROFILE);
              setError("");
              setSuccess("");
            }}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === TABS.PROFILE
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab(TABS.PASSWORD);
              setError("");
              setSuccess("");
            }}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === TABS.PASSWORD
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Alerts */}
        <div className="px-6 pt-4">
          {error && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {activeTab === TABS.PROFILE && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin name"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin email"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                  autoComplete="off"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className={`inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    profileLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === TABS.PASSWORD && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Re-enter new password"
                  autoComplete="off"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className={`inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    passwordLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSetting;
