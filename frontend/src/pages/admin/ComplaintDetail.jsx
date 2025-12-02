import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Clock, User, Mail, Phone, AlertCircle } from "lucide-react";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComplaint(response.data.complaint || response.data.data);
    } catch (err) {
      console.error("Fetch complaint error:", err);
      setError(err.response?.data?.message || "Failed to load complaint");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_BASE_URL}/complaints/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComplaint((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Update status error:", err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading complaint...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/admin/complaints")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Complaints
          </button>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Complaint not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/complaints")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Complaints
          </button>
          <h1 className="text-3xl font-bold text-slate-900">
            Complaint Details
          </h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-90">Complaint ID</p>
                <p className="text-xl font-bold">
                  #{complaint._id?.slice(-8).toUpperCase()}
                </p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    complaint.priority === "high"
                      ? "bg-red-500"
                      : complaint.priority === "medium"
                        ? "bg-orange-500"
                        : "bg-green-500"
                  }`}
                >
                  {complaint.priority?.toUpperCase()}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    complaint.status === "resolved"
                      ? "bg-green-500"
                      : complaint.status === "in-progress"
                        ? "bg-blue-500"
                        : "bg-yellow-500"
                  }`}
                >
                  {complaint.status?.replace("-", " ").toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Title & Description */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {complaint.title || "No Title"}
              </h2>
              <p className="text-slate-600 whitespace-pre-wrap">
                {complaint.description || "No description provided"}
              </p>
            </div>

            {/* User Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                User Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="text-slate-400" size={20} />
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="font-medium text-slate-900">
                      {complaint.user?.name ||
                        complaint.createdBy?.name ||
                        "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-slate-400" size={20} />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">
                      {complaint.user?.email ||
                        complaint.createdBy?.email ||
                        "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="font-medium text-slate-900">
                    {complaint.category || "Uncategorized"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created At</p>
                  <p className="font-medium text-slate-900">
                    {new Date(complaint.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Update Status
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus("open")}
                  disabled={updating || complaint.status === "open"}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                >
                  Mark as Open
                </button>
                <button
                  onClick={() => updateStatus("in-progress")}
                  disabled={updating || complaint.status === "in-progress"}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Mark as In Progress
                </button>
                <button
                  onClick={() => updateStatus("resolved")}
                  disabled={updating || complaint.status === "resolved"}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
