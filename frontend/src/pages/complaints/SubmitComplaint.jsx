import React, { useEffect, useState, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  CheckCircle,
  Info,
  Clock,
  Mail,
  X,
  Eye,
  AlertCircle,
  FileText,
  Paperclip,
  Lock,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ComplaintForm from "../../components/Complaint/ComplaintForm";
import { useAuth } from "../../context/AuthContext";

// ================================================================
// 🎨 ANIMATION VARIANTS
// ================================================================
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ================================================================
// 🔍 PREVIEW MODAL COMPONENT
// ================================================================
const ComplaintPreviewModal = ({ complaint, onClose }) => {
  if (!complaint) return null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "bg-red-100 text-red-700 border-red-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      medium: "bg-blue-100 text-blue-700 border-blue-200",
      low: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[priority] || colors.medium;
  };

  const getCategoryColor = (category) => {
    const colors = {
      IT: "bg-purple-100 text-purple-700",
      Facility: "bg-green-100 text-green-700",
      Food: "bg-yellow-100 text-yellow-700",
      Maintenance: "bg-blue-100 text-blue-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        />
      </AnimatePresence>

      {/* Modal */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-4 sm:inset-8 z-[101] flex items-center justify-center"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Complaint Preview
                </h2>
                <p className="text-xs text-gray-500">
                  Review your submission details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title & ID */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-2xl font-bold text-gray-900 flex-1">
                  {complaint.title}
                </h3>
                {complaint._id && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-mono whitespace-nowrap">
                    ID: {complaint._id.slice(-8)}
                  </span>
                )}
              </div>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getPriorityColor(
                    complaint.priority
                  )}`}
                >
                  {complaint.priority} Priority
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${getCategoryColor(
                    complaint.category
                  )}`}
                >
                  {complaint.category}
                </span>
                {complaint.status && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold">
                    {complaint.status.replace("_", " ").toUpperCase()}
                  </span>
                )}
                {complaint.visibility && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                    {complaint.visibility === "public"
                      ? "🌐 Public"
                      : "🔒 Private"}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>

            {/* Location */}
            {complaint.location && (
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-1">
                  📍 Location
                </h4>
                <p className="text-blue-800">{complaint.location}</p>
              </div>
            )}

            {/* Student Info */}
            {(complaint.studentName ||
              complaint.studentId ||
              complaint.rollNumber) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {complaint.studentName && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Student Name</p>
                    <p className="font-semibold text-gray-900">
                      {complaint.studentName}
                    </p>
                  </div>
                )}
                {complaint.studentId && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Student ID</p>
                    <p className="font-semibold text-gray-900 font-mono">
                      {complaint.studentId}
                    </p>
                  </div>
                )}
                {complaint.rollNumber && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Roll Number</p>
                    <p className="font-semibold text-gray-900 font-mono">
                      {complaint.rollNumber}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments ({complaint.attachments.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.attachments.map((file, idx) => {
                    const mime =
                      file.mimeType ||
                      file.mimetype ||
                      file.type ||
                      "application/octet-stream";
                    const isImg = mime.startsWith("image/");

                    const src =
                      file.url ||
                      (file instanceof File ? URL.createObjectURL(file) : "");

                    return (
                      <div key={idx} className="relative group">
                        {isImg && src ? (
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <img
                              src={src}
                              alt={
                                file.name ||
                                file.originalName ||
                                `Attachment ${idx + 1}`
                              }
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square rounded-lg bg-gray-100 border border-gray-200 flex flex-col items-center justify-center p-3">
                            <FileText className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-xs text-gray-600 text-center truncate w-full">
                              {file.name || file.originalName || "File"}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timestamps */}
            {complaint.createdAt && (
              <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
                <p>Submitted: {formatDate(complaint.createdAt)}</p>
                {complaint.updatedAt &&
                  complaint.updatedAt !== complaint.createdAt && (
                    <p className="mt-1">
                      Last Updated: {formatDate(complaint.updatedAt)}
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95"
            >
              Close Preview
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ================================================================
// 🚀 MAIN SUBMIT COMPLAINT PAGE
// ================================================================
const SubmitComplaint = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [submissionState, setSubmissionState] = useState({
    status: "idle", // 'idle' | 'submitting' | 'success' | 'error'
    complaintData: null,
    message: "",
  });
  const [showPreview, setShowPreview] = useState(false);

  // WebSocket connection for real-time admin updates
  useEffect(() => {
    const wsUrl =
      import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws/complaints";
    let socket;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        // connected
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "NEW_COMPLAINT") {
            toast.success("New complaint received!", {
              duration: 3000,
              position: "bottom-right",
            });
          }
        } catch {
          // ignore malformed messages
        }
      };

      socket.onerror = () => {
        // optionally handle error UI
      };

      socket.onclose = () => {
        // closed
      };
    } catch {
      // WebSocket creation failed
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  const handleSubmissionStart = useCallback(() => {
    setSubmissionState({
      status: "submitting",
      complaintData: null,
      message: "",
    });
  }, []);

  const handleSubmissionSuccess = useCallback(
    (complaintData) => {
      setSubmissionState({
        status: "success",
        complaintData,
        message:
          "Your complaint has been submitted and is now visible to staff and admins for review.",
      });

      toast.success("Complaint submitted successfully!", {
        duration: 2500,
        position: "top-center",
        icon: "✅",
      });

      setTimeout(() => {
        navigate("/complaints/my");
      }, 800);
    },
    [navigate]
  );

  const handleSubmissionError = useCallback((errorMessage) => {
    setSubmissionState({
      status: "error",
      complaintData: null,
      message:
        errorMessage ||
        "Failed to submit complaint. Please check your details and try again.",
    });

    toast.error("Submission failed. Please try again.", {
      duration: 4000,
      position: "top-center",
    });
  }, []);

  const isSubmitting = submissionState.status === "submitting";

  // Guard: login required
  if (!isAuthenticated) {
    return (
      <>
        <Toaster />
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
              <Lock className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Login Required</h1>
            <p className="text-sm text-gray-600">
              Please log in to submit a complaint so we can track it to your
              account.
            </p>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to Login
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Toaster />

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <header className="text-center mb-10 sm:mb-12 animate-fade-in">
            <div className="inline-block mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4 tracking-tight">
              Submit a Complaint
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              Fill out the form with clear details, attach relevant documents,
              and your complaint will be instantly saved and visible to staff.
            </p>
          </header>

          {/* Success Message Card (brief, before redirect) */}
          <AnimatePresence>
            {submissionState.status === "success" &&
              submissionState.complaintData && (
                <motion.section
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 sm:mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 sm:p-8 shadow-lg"
                  role="alert"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-green-900 mb-2">
                        Complaint Submitted Successfully
                      </h2>
                      <p className="text-sm sm:text-base text-green-800">
                        Redirecting you to your complaints list…
                      </p>
                    </div>
                  </div>
                </motion.section>
              )}
          </AnimatePresence>

          {/* Error Message Card */}
          <AnimatePresence>
            {submissionState.status === "error" && (
              <motion.section
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 sm:mb-8 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg"
                role="alert"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <h2 className="text-lg font-semibold text-red-900 mb-1">
                      Submission Failed
                    </h2>
                    <p className="text-sm sm:text-base text-red-800">
                      {submissionState.message}
                    </p>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Complaint Form Container */}
          <section
            className={`relative bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12 border border-gray-100 transition-all duration-300 ${
              isSubmitting
                ? "opacity-75 pointer-events-none"
                : "hover:shadow-2xl"
            }`}
          >
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="inline-block w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                  <p className="text-base sm:text-lg font-semibold text-gray-700">
                    Submitting your complaint...
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Please wait while we save your information
                  </p>
                </div>
              </div>
            )}

            <ComplaintForm
              currentUser={user}
              onSubmitStart={handleSubmissionStart}
              onSubmitSuccess={handleSubmissionSuccess}
              onSubmitError={handleSubmissionError}
              isSubmitting={isSubmitting}
            />
          </section>

          {/* What Happens After You Submit */}
          <section className="mt-8 sm:mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900">
                What Happens After You Submit
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 text-sm sm:text-base">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <p className="text-blue-900 leading-relaxed">
                  <span className="font-semibold">Instant Save:</span> Your
                  complaint is immediately stored in the database with all
                  attachments.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <p className="text-blue-900 leading-relaxed">
                  <span className="font-semibold">Real-Time Updates:</span>{" "}
                  Staff and admins see your complaint instantly in their
                  dashboards via WebSocket.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="flex-shrink-0 w-6 h-6 text-blue-600 mt-0.5" />
                <p className="text-blue-900 leading-relaxed">
                  <span className="font-semibold">Notifications:</span> Updates
                  about status changes are sent to your email and visible in "My
                  Complaints".
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="flex-shrink-0 w-6 h-6 text-blue-600 mt-0.5" />
                <p className="text-blue-900 leading-relaxed">
                  <span className="font-semibold">Response Time:</span> Most
                  complaints receive an initial response within 24–48 business
                  hours.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Preview Modal (only used if you keep user on this page instead of redirect) */}
      <AnimatePresence>
        {showPreview && submissionState.complaintData && (
          <ComplaintPreviewModal
            complaint={submissionState.complaintData}
            onClose={() => setShowPreview(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SubmitComplaint;
