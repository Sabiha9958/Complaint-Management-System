// src/pages/complaints/ComplaintEditPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ComplaintAPI } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import {
  FiArrowLeft,
  FiFileText,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiMapPin,
  FiTag,
  FiFlag,
  FiUpload,
  FiTrash2,
  FiPaperclip,
  FiUser,
  FiCalendar, // ✅ Added
  FiClock, // ✅ Added
  FiInfo, // ✅ Added
  FiSave,
  FiX,
} from "react-icons/fi";

/* ================================================================
   🎨 CONSTANTS
   ================================================================ */

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const STATUS_OPTIONS = ["pending", "in_progress", "resolved", "rejected"];

const CATEGORY_OPTIONS = [
  "IT",
  "Facilities",
  "HR",
  "Finance",
  "Security",
  "Other",
];

/* ================================================================
   🛠️ UTILITY FUNCTIONS
   ================================================================ */

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ================================================================
   🚀 MAIN COMPONENT
   ================================================================ */

const ComplaintEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "",
    location: "",
    priority: "medium",
    status: "pending",
  });

  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState([]);

  const isAdminOrStaff = useMemo(
    () => ["admin", "staff"].includes(user?.role),
    [user?.role]
  );

  // Fetch complaint
  useEffect(() => {
    const fetchComplaint = async () => {
      setLoading(true);
      try {
        const res = await ComplaintAPI.getById(id);
        if (!res.success || !res.data) {
          throw new Error(res.message || "Complaint not found");
        }

        const c = res.data;
        setComplaint(c);
        setAttachments(c.attachments || []);
        setForm({
          title: c.title || "",
          description: c.description || "",
          department: c.department || c.category || "",
          location: c.location || "",
          priority: c.priority || "medium",
          status: c.status || "pending",
        });
      } catch (err) {
        toast.error(err.message || "Failed to load complaint");
        navigate("/complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id, navigate]);

  // Form handlers
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    } else if (form.title.trim().length < 4) {
      newErrors.title = "Title must be at least 4 characters";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!PRIORITY_OPTIONS.includes(form.priority)) {
      newErrors.priority = "Invalid priority";
    }

    if (!STATUS_OPTIONS.includes(form.status)) {
      newErrors.status = "Invalid status";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaint) return;

    if (!validate()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        department: form.department.trim() || undefined,
        location: form.location.trim() || undefined,
        priority: form.priority,
      };

      // Only admin/staff can change status
      if (isAdminOrStaff) {
        payload.status = form.status;
      }

      const res = await ComplaintAPI.update(complaint._id, payload);
      if (!res.success) {
        throw new Error(res.message || "Failed to update complaint");
      }

      toast.success("Complaint updated successfully!");
      navigate(`/complaints/${complaint._id}`);
    } catch (err) {
      toast.error(err.message || "Failed to update complaint");
    } finally {
      setSaving(false);
    }
  };

  // Attachment handlers
  const handleUploadAttachments = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !complaint) return;

    setUploading(true);
    try {
      const res = await ComplaintAPI.uploadAttachments(complaint._id, files);
      if (!res.success) {
        throw new Error(res.message || "Failed to upload attachments");
      }

      const updatedComplaint = res.data || {};
      setAttachments(updatedComplaint.attachments || []);
      toast.success("Attachments uploaded successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to upload attachments");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!complaint) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this attachment?"
    );
    if (!confirmed) return;

    try {
      const res = await ComplaintAPI.deleteAttachment(
        complaint._id,
        attachmentId
      );
      if (!res.success) {
        throw new Error(res.message || "Failed to remove attachment");
      }

      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
      toast.success("Attachment removed successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to remove attachment");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading complaint...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complaint Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The complaint you are trying to edit does not exist or has been
            removed.
          </p>
          <button
            onClick={() => navigate("/complaints")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Complaints
          </button>
        </div>
      </div>
    );
  }

  const isReadOnlyStatus = !isAdminOrStaff;

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => navigate(`/complaints/${complaint._id}`)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors group"
          >
            <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to complaint detail
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <FiFileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Edit Complaint
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                ID:{" "}
                <span className="font-mono">
                  #{complaint._id?.slice(-8) || complaint._id}
                </span>
              </p>
            </div>
          </div>
        </header>

        {/* Info Bar */}
        <section className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <FiUser className="w-4 h-4 text-gray-400" />
            <span className="font-semibold">
              {complaint.user?.name || complaint.studentName || "Anonymous"}
            </span>
            {complaint.user?.email && (
              <span className="text-gray-500">({complaint.user.email})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <span>
              Created: <strong>{formatDate(complaint.createdAt)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4 text-gray-400" />
            <span>
              Updated: <strong>{formatDate(complaint.updatedAt)}</strong>
            </span>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                      errors.title
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300"
                    }`}
                    maxLength={120}
                    placeholder="Enter a clear, concise title..."
                  />
                </div>
                {errors.title && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 min-h-[140px] resize-vertical transition-all ${
                    errors.description
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Describe the issue in detail..."
                  maxLength={2000}
                />
                {errors.description && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" />
                    {errors.description}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-gray-500">
                  {form.description.length} / 2000 characters
                </p>
              </div>

              {/* Department & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={form.department}
                      onChange={(e) =>
                        handleChange("department", e.target.value)
                      }
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select department...</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                      placeholder="e.g., Block A, Lab 3..."
                    />
                  </div>
                </div>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiFlag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={form.priority}
                      onChange={(e) => handleChange("priority", e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                        errors.priority
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.priority && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.priority}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Status
                    {isReadOnlyStatus && (
                      <span className="ml-2 text-[10px] text-gray-500">
                        (staff only)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <FiCheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={form.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      disabled={isReadOnlyStatus}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                        errors.status
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300"
                      } ${
                        isReadOnlyStatus
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt === "in_progress"
                            ? "In Progress"
                            : opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.status && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.status}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate(`/complaints/${complaint._id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                >
                  {saving ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Attachments */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FiPaperclip className="w-4 h-4 text-blue-600" />
                Attachments ({attachments.length})
              </h2>

              <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                <FiUpload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Files"}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleUploadAttachments}
                  disabled={uploading}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </label>

              <p className="text-[11px] text-gray-500">
                Attach screenshots, documents, or files to help explain the
                issue.
              </p>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {attachments.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">
                    No attachments yet
                  </p>
                ) : (
                  attachments.map((file) => {
                    const url = file.url || file.path || file.secure_url;
                    const name =
                      file.originalName || file.filename || "Attachment";

                    return (
                      <div
                        key={file._id || file.filename}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs group hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FiFileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-gray-700 hover:text-blue-600 hover:underline"
                          >
                            {name}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(file._id)}
                          className="p-1.5 rounded-full hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove attachment"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Tips Card */}
            <section className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900">
              <div className="flex gap-3">
                <FiInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-2">
                    Tips for Clear Complaints
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Be specific about location and time</li>
                    <li>Add screenshots or documents</li>
                    <li>Keep title short but descriptive</li>
                    <li>Explain impact and urgency</li>
                  </ul>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </motion.main>
  );
};

export default ComplaintEditPage;
