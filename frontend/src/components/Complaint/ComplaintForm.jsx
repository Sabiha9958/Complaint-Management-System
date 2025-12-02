/**
 * ================================================================
 * 📝 COMPLAINT FORM - File upload with preview and validation
 * ================================================================
 */

import React, { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { ComplaintAPI } from "../../api/api";
import {
  COMPLAINT_CATEGORY,
  COMPLAINT_PRIORITY,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  ATTACHMENT_CONFIG,
  validateFiles,
  formatFileSize,
  getFileIcon,
} from "../../utils/constants";
import {
  FiUpload,
  FiX,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiSend,
  FiEye,
  FiDownload,
} from "react-icons/fi";

// ============================================================================
// CONFIGURATION
// ============================================================================

const FIELD_LIMITS = {
  title: { min: 5, max: 100 },
  description: { min: 20, max: 1000 },
  name: { min: 2, max: 50 },
  phone: { length: 10 },
};

const INITIAL_FORM_STATE = {
  title: "",
  description: "",
  category: COMPLAINT_CATEGORY.TECHNICAL,
  priority: COMPLAINT_PRIORITY.MEDIUM,
  contactInfo: {
    name: "",
    email: "",
    phone: "",
  },
};

// ============================================================================
// VALIDATION
// ============================================================================

const validateField = (name, value) => {
  const errors = {};

  switch (name) {
    case "title": {
      const trimmed = value?.trim();
      if (!trimmed) {
        errors.title = "Title is required";
      } else if (trimmed.length < FIELD_LIMITS.title.min) {
        errors.title = `Minimum ${FIELD_LIMITS.title.min} characters required`;
      } else if (value.length > FIELD_LIMITS.title.max) {
        errors.title = `Maximum ${FIELD_LIMITS.title.max} characters allowed`;
      }
      break;
    }

    case "description": {
      const trimmed = value?.trim();
      if (!trimmed) {
        errors.description = "Description is required";
      } else if (trimmed.length < FIELD_LIMITS.description.min) {
        errors.description = `Minimum ${FIELD_LIMITS.description.min} characters required`;
      } else if (value.length > FIELD_LIMITS.description.max) {
        errors.description = `Maximum ${FIELD_LIMITS.description.max} characters allowed`;
      }
      break;
    }

    case "contactInfo.name": {
      const trimmed = value?.trim();
      if (!trimmed) {
        errors["contactInfo.name"] = "Name is required";
      } else if (trimmed.length < FIELD_LIMITS.name.min) {
        errors["contactInfo.name"] =
          `Minimum ${FIELD_LIMITS.name.min} characters required`;
      }
      break;
    }

    case "contactInfo.email": {
      if (!value) {
        errors["contactInfo.email"] = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors["contactInfo.email"] = "Invalid email address";
      }
      break;
    }

    case "contactInfo.phone": {
      if (value && !/^\d{10}$/.test(value)) {
        errors["contactInfo.phone"] = "Must be 10 digits";
      }
      break;
    }

    default:
      break;
  }

  return errors;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const FieldStatus = ({ value, error, touched }) => {
  if (!touched || !value) return null;
  return error ? (
    <FiAlertCircle className="w-5 h-5 text-red-500" />
  ) : (
    <FiCheckCircle className="w-5 h-5 text-green-500" />
  );
};

const CharacterCounter = ({ current, max }) => {
  const percentage = (current / max) * 100;
  const colorClass =
    percentage > 90
      ? "text-red-600"
      : percentage > 75
        ? "text-amber-600"
        : "text-gray-500";

  return (
    <span className={`text-xs font-medium ${colorClass}`}>
      {current}/{max}
    </span>
  );
};

// File preview with modal
const FilePreview = ({ file, previewUrl, index, onRemove, onPreview }) => {
  const isImage = file.type.startsWith("image/");
  const icon = getFileIcon(file.type);

  return (
    <div className="relative group bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-all">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
      >
        <FiX className="w-3 h-3" />
      </button>

      {isImage && previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-24 object-cover rounded cursor-pointer"
            onClick={() => onPreview(file, previewUrl)}
          />
          <button
            type="button"
            onClick={() => onPreview(file, previewUrl)}
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded"
          >
            <FiEye className="w-6 h-6 text-white" />
          </button>
        </div>
      ) : (
        <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
          <FiFileText className="w-10 h-10 text-gray-400" />
        </div>
      )}

      <p
        className="text-xs text-gray-700 font-medium truncate mt-2"
        title={file.name}
      >
        {file.name}
      </p>
      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
    </div>
  );
};

// Preview Modal
const PreviewModal = ({ file, previewUrl, onClose }) => {
  if (!file) return null;

  const isImage = file.type.startsWith("image/");

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{file.name}</h3>
            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={previewUrl}
              download={file.name}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <FiDownload className="h-5 w-5 text-gray-600" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isImage ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="max-w-full h-auto rounded-lg"
            />
          ) : (
            <div className="text-center py-12">
              <FiFileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Preview not available</p>
              <a
                href={previewUrl}
                download={file.name}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiDownload className="h-4 w-4" />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Props:
 * - currentUser (optional, if you want to prefill contact info)
 * - onSubmitStart: () => void
 * - onSubmitSuccess: (complaint) => void
 * - onSubmitError: (message) => void
 * - isSubmitting: boolean (controlled by parent)
 */
const ComplaintForm = ({
  currentUser,
  onSubmitStart,
  onSubmitSuccess,
  onSubmitError,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState(() => {
    if (currentUser) {
      return {
        ...INITIAL_FORM_STATE,
        contactInfo: {
          name: currentUser.name || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
        },
      };
    }
    return INITIAL_FORM_STATE;
  });

  const [attachments, setAttachments] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [previewFile, setPreviewFile] = useState(null);

  // Handle input change
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      if (name.startsWith("contactInfo.")) {
        const key = name.split(".")[1];
        setFormData((prev) => ({
          ...prev,
          contactInfo: { ...prev.contactInfo, [key]: value },
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }

      if (touchedFields[name]) {
        const errors = validateField(name, value);
        setFieldErrors((prev) => {
          const updated = { ...prev };
          if (Object.keys(errors).length === 0) {
            delete updated[name];
          } else {
            Object.assign(updated, errors);
          }
          return updated;
        });
      }
    },
    [touchedFields]
  );

  // Handle blur
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));

    const errors = validateField(name, value);
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (Object.keys(errors).length === 0) {
        delete updated[name];
      } else {
        Object.assign(updated, errors);
      }
      return updated;
    });
  }, []);

  // Handle file upload
  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validation = validateFiles(files, ATTACHMENT_CONFIG);
    if (!validation.valid) {
      toast.error(validation.errors[0], { toastId: "file-error" });
      e.target.value = "";
      return;
    }

    setAttachments((prev) => {
      const newFiles = [...prev, ...files];
      if (newFiles.length > ATTACHMENT_CONFIG.MAX_FILES) {
        toast.error(`Maximum ${ATTACHMENT_CONFIG.MAX_FILES} files allowed`, {
          toastId: "max-files",
        });
        return prev;
      }
      return newFiles;
    });

    // Create preview URLs
    const newPreviews = files.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null
    );
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    toast.success(`${files.length} file(s) added`, { toastId: "files-added" });
    e.target.value = "";
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    toast.info("File removed", { toastId: "file-removed" });
  }, []);

  // Open preview
  const openPreview = useCallback((file, url) => {
    setPreviewFile({ file, url });
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    const allErrors = {};

    ["title", "description"].forEach((field) => {
      Object.assign(allErrors, validateField(field, formData[field]));
    });

    ["name", "email", "phone"].forEach((field) => {
      Object.assign(
        allErrors,
        validateField(`contactInfo.${field}`, formData.contactInfo[field])
      );
    });

    setFieldErrors(allErrors);
    setTouchedFields({
      title: true,
      description: true,
      "contactInfo.name": true,
      "contactInfo.email": true,
      "contactInfo.phone": true,
    });

    return Object.keys(allErrors).length === 0;
  }, [formData]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        toast.error("Please fix all errors", {
          toastId: "validation-error",
        });
        onSubmitError?.("Validation failed");
        return;
      }

      onSubmitStart?.();

      try {
        const submitData = new FormData();
        submitData.append("title", formData.title.trim());
        submitData.append("description", formData.description.trim());
        submitData.append("category", formData.category);
        submitData.append("priority", formData.priority);
        submitData.append("contactInfo", JSON.stringify(formData.contactInfo));

        attachments.forEach((file) => {
          submitData.append("attachments", file);
        });

        const response = await ComplaintAPI.create(submitData);

        if (!response.success) {
          const msg = response.message || "Failed to submit complaint";
          toast.error(msg, { toastId: "submit-error" });
          onSubmitError?.(msg);
          return;
        }

        // Cleanup previews
        previewUrls.forEach((url) => url && URL.revokeObjectURL(url));

        // Reset form local state
        setFormData(
          currentUser
            ? {
                ...INITIAL_FORM_STATE,
                contactInfo: {
                  name: currentUser.name || "",
                  email: currentUser.email || "",
                  phone: currentUser.phone || "",
                },
              }
            : INITIAL_FORM_STATE
        );
        setAttachments([]);
        setPreviewUrls([]);
        setFieldErrors({});
        setTouchedFields({});

        onSubmitSuccess?.(response.data);
      } catch (error) {
        const msg = error.message || "Failed to submit complaint";
        toast.error(msg, { toastId: "submit-error" });
        onSubmitError?.(msg);
      }
    },
    [
      formData,
      attachments,
      previewUrls,
      validateForm,
      onSubmitStart,
      onSubmitSuccess,
      onSubmitError,
      currentUser,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Title */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <CharacterCounter
              current={formData.title.length}
              max={FIELD_LIMITS.title.max}
            />
          </div>
          <div className="relative">
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Brief description of your complaint"
              maxLength={FIELD_LIMITS.title.max}
              className={`w-full px-4 py-2.5 pr-12 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                fieldErrors.title && touchedFields.title
                  ? "border-red-400 focus:ring-red-200 bg-red-50"
                  : touchedFields.title && formData.title
                    ? "border-green-400 focus:ring-green-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <FieldStatus
                value={formData.title}
                error={fieldErrors.title}
                touched={touchedFields.title}
              />
            </div>
          </div>
          {fieldErrors.title && touchedFields.title && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
              <FiAlertCircle className="w-4 h-4" />
              {fieldErrors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-700"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <CharacterCounter
              current={formData.description.length}
              max={FIELD_LIMITS.description.max}
            />
          </div>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={6}
            maxLength={FIELD_LIMITS.description.max}
            placeholder="Provide detailed information..."
            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:outline-none resize-none transition-all ${
              fieldErrors.description && touchedFields.description
                ? "border-red-400 focus:ring-red-200 bg-red-50"
                : touchedFields.description && formData.description
                  ? "border-green-400 focus:ring-green-200"
                  : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
            }`}
          />
          {fieldErrors.description && touchedFields.description && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
              <FiAlertCircle className="w-4 h-4" />
              {fieldErrors.description}
            </p>
          )}
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
            >
              {Object.values(COMPLAINT_CATEGORY).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
            >
              {Object.values(COMPLAINT_PRIORITY).map((pri) => (
                <option key={pri} value={pri}>
                  {PRIORITY_LABELS[pri]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Attachments */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
          <div className="text-center">
            <FiUpload className="mx-auto h-12 w-12 text-blue-500 mb-3" />
            <label
              htmlFor="file-upload"
              className={`relative cursor-pointer bg-white rounded-lg px-6 py-2.5 inline-block font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all ${
                attachments.length >= ATTACHMENT_CONFIG.MAX_FILES
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <span>Upload Attachments</span>
              <input
                id="file-upload"
                type="file"
                multiple
                accept={ATTACHMENT_CONFIG.ALLOWED_TYPES.join(",")}
                onChange={handleFileChange}
                disabled={attachments.length >= ATTACHMENT_CONFIG.MAX_FILES}
                className="sr-only"
              />
            </label>
            <p className="text-sm text-gray-600 mt-2">
              {ATTACHMENT_CONFIG.ALLOWED_EXTENSIONS.join(", ")} • Max{" "}
              {ATTACHMENT_CONFIG.MAX_SIZE_MB}MB
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {attachments.length}/{ATTACHMENT_CONFIG.MAX_FILES} files
            </p>
          </div>

          {attachments.length > 0 && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {attachments.map((file, index) => (
                <FilePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  previewUrl={previewUrls[index]}
                  index={index}
                  onRemove={removeAttachment}
                  onPreview={openPreview}
                />
              ))}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="border-t-2 pt-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">
            Contact Information
          </h3>

          <div>
            <label
              htmlFor="contactName"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="contactName"
                name="contactInfo.name"
                type="text"
                value={formData.contactInfo.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Your full name"
                className={`w-full px-4 py-2.5 pr-12 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                  fieldErrors["contactInfo.name"] &&
                  touchedFields["contactInfo.name"]
                    ? "border-red-400 focus:ring-red-200 bg-red-50"
                    : touchedFields["contactInfo.name"] &&
                        formData.contactInfo.name
                      ? "border-green-400 focus:ring-green-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <FieldStatus
                  value={formData.contactInfo.name}
                  error={fieldErrors["contactInfo.name"]}
                  touched={touchedFields["contactInfo.name"]}
                />
              </div>
            </div>
            {fieldErrors["contactInfo.name"] &&
              touchedFields["contactInfo.name"] && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <FiAlertCircle className="w-4 h-4" />
                  {fieldErrors["contactInfo.name"]}
                </p>
              )}
          </div>

          <div>
            <label
              htmlFor="contactEmail"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="contactEmail"
                name="contactInfo.email"
                type="email"
                value={formData.contactInfo.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="your.email@example.com"
                className={`w-full px-4 py-2.5 pr-12 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                  fieldErrors["contactInfo.email"] &&
                  touchedFields["contactInfo.email"]
                    ? "border-red-400 focus:ring-red-200 bg-red-50"
                    : touchedFields["contactInfo.email"] &&
                        formData.contactInfo.email
                      ? "border-green-400 focus:ring-green-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <FieldStatus
                  value={formData.contactInfo.email}
                  error={fieldErrors["contactInfo.email"]}
                  touched={touchedFields["contactInfo.email"]}
                />
              </div>
            </div>
            {fieldErrors["contactInfo.email"] &&
              touchedFields["contactInfo.email"] && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <FiAlertCircle className="w-4 h-4" />
                  {fieldErrors["contactInfo.email"]}
                </p>
              )}
          </div>

          <div>
            <label
              htmlFor="contactPhone"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Phone (Optional)
            </label>
            <input
              id="contactPhone"
              name="contactInfo.phone"
              type="tel"
              value={formData.contactInfo.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="10-digit number"
              maxLength={10}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            />
            {fieldErrors["contactInfo.phone"] &&
              touchedFields["contactInfo.phone"] && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <FiAlertCircle className="w-4" />
                  {fieldErrors["contactInfo.phone"]}
                </p>
              )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 transform hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <FiLoader className="w-5 h-5 animate-spin" />
              Submitting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Submit Complaint
              <FiSend className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      {/* Preview Modal */}
      {previewFile && (
        <PreviewModal
          file={previewFile.file}
          previewUrl={previewFile.url}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
};

export default ComplaintForm;
