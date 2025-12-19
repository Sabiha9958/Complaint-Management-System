// src/components/common/FileUploader.jsx
import React, { useId, useRef, useState } from "react";
import { PlusCircle, Trash, AlertCircle } from "lucide-react";
import PropTypes from "prop-types";
import apiClient from "../../api/apiClient";
import {
  ATTACHMENT_CONFIG,
  validateFilesUpload,
  formatFileSize,
  getFileTypeLabel,
  isImageFile,
} from "../../utils/constants";

const FileUploader = ({
  initialFiles = [],
  uploadUrl,
  maxFiles = ATTACHMENT_CONFIG.MAX_FILES,
  maxFileSize = ATTACHMENT_CONFIG.MAX_SIZE_BYTES,
  onUploadSuccess,
  onError,
  label = "Add Attachments",
}) => {
  const [files, setFiles] = useState(initialFiles);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [errors, setErrors] = useState({});
  const inputRef = useRef(null);
  const inputId = useId();

  const effectiveConfig = {
    ...ATTACHMENT_CONFIG,
    MAX_FILES: maxFiles,
    MAX_SIZE_BYTES: maxFileSize,
    MAX_SIZE_MB: maxFileSize / (1024 * 1024),
  };

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFilesSelected = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    // Check file limit
    if (files.length + selectedFiles.length > maxFiles) {
      const msg = `Maximum ${maxFiles} files allowed. Currently have ${files.length} file(s).`;
      onError?.(msg);
      setErrors((prev) => ({ ...prev, limit: msg }));
      resetInput();
      return;
    }

    // Validate batch
    const validation = validateFilesUpload(selectedFiles, effectiveConfig);
    if (!validation.valid) {
      onError?.(validation.error);
      setErrors((prev) => ({ ...prev, validation: validation.error }));
      resetInput();
      return;
    }

    // Clear previous errors
    setErrors({});

    // Upload each file
    for (const file of selectedFiles) {
      const clientId = `${file.name}-${file.size}-${Date.now()}`;

      const formData = new FormData();
      formData.append("attachments", file);

      try {
        setUploadingFiles((prev) => ({
          ...prev,
          [clientId]: { name: file.name, progress: 0 },
        }));

        const response = await apiClient.post(uploadUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            if (!event.total) return;
            const percent = Math.round((event.loaded * 100) / event.total);
            setUploadingFiles((prev) => ({
              ...prev,
              [clientId]: { name: file.name, progress: percent },
            }));
          },
        });

        // Extract attachments from response
        let newAttachments = [];
        if (Array.isArray(response)) {
          newAttachments = response;
        } else if (Array.isArray(response?.attachments)) {
          newAttachments = response.attachments;
        } else if (Array.isArray(response?.files)) {
          newAttachments = response.files;
        } else if (Array.isArray(response?.data)) {
          newAttachments = response.data;
        }

        if (!newAttachments.length) {
          throw new Error("Server did not return uploaded attachments");
        }

        // Update files list
        setFiles((prev) => [...prev, ...newAttachments]);
        onUploadSuccess?.(newAttachments);

        // Remove from uploading
        setUploadingFiles((prev) => {
          const copy = { ...prev };
          delete copy[clientId];
          return copy;
        });
      } catch (error) {
        const msg = error?.message || "Unknown upload error";
        const errorMsg = `Failed to upload ${file.name}: ${msg}`;
        onError?.(errorMsg);
        setErrors((prev) => ({ ...prev, [clientId]: errorMsg }));

        // Remove from uploading
        setUploadingFiles((prev) => {
          const copy = { ...prev };
          delete copy[clientId];
          return copy;
        });
      }
    }

    resetInput();
  };

  const handleRemoveFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f._id !== fileId));
  };

  const renderPreview = (file) => {
    const mime =
      file.mimeType || file.mimetype || file.type || "application/octet-stream";
    const isImg = mime.startsWith("image/") || isImageFile({ type: mime });

    if (isImg && file.url) {
      return (
        <img
          src={file.url}
          alt={file.filename}
          className="h-12 w-12 rounded object-cover border border-gray-200"
          loading="lazy"
        />
      );
    }

    return (
      <div className="h-12 w-12 rounded flex items-center justify-center bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-600">
        {getFileTypeLabel(mime).split(" ")[0] || "FILE"}
      </div>
    );
  };

  const totalUploading = Object.keys(uploadingFiles).length;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <label
        htmlFor={inputId}
        className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 transition ${
          hasErrors
            ? "border-red-300 bg-red-50 hover:border-red-400 hover:bg-red-100"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <PlusCircle
          className={`h-6 w-6 ${hasErrors ? "text-red-500" : "text-blue-500"}`}
        />
        <div className="flex flex-col flex-1">
          <span className="text-sm font-medium text-gray-700">
            {label} ({files.length}/{maxFiles})
          </span>
          <span className="text-xs text-gray-500">
            Max {effectiveConfig.MAX_SIZE_MB.toFixed(1)} MB per file •{" "}
            {effectiveConfig.ALLOWED_EXTENSIONS.slice(0, 5).join(", ")}
          </span>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={effectiveConfig.ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFilesSelected}
          className="hidden"
          aria-label="Upload attachments"
        />
      </label>

      {/* Error Messages */}
      {hasErrors && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-red-700">
              {Object.values(errors).map((error, idx) => (
                <p key={idx} className="mb-1 last:mb-0">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.entries(uploadingFiles).map(([clientId, meta]) => (
        <div key={clientId} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="truncate max-w-xs font-medium">{meta.name}</span>
            <span className="font-semibold">{meta.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 transition-all duration-300"
              style={{ width: `${meta.progress}%` }}
            />
          </div>
        </div>
      ))}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">
            {files.length} file{files.length > 1 ? "s" : ""} attached
          </p>
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file._id || file.filename}
                className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg p-2 bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {renderPreview(file)}
                  <div className="min-w-0 flex-1">
                    {file.url ? (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate font-mono text-sm text-blue-600 hover:underline font-medium"
                        title={file.filename}
                      >
                        {file.filename}
                      </a>
                    ) : (
                      <span className="block truncate font-mono text-sm text-gray-700 font-medium">
                        {file.filename}
                      </span>
                    )}
                    <p className="text-xs text-gray-500">
                      {file.size ? formatFileSize(file.size) : "Unknown size"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveFile(file._id)}
                  className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition disabled:opacity-50"
                  aria-label={`Remove ${file.filename}`}
                  type="button"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty State */}
      {!files.length && !totalUploading && !hasErrors && (
        <p className="text-xs text-gray-500 text-center py-2">
          No attachments yet. Supported: images, PDFs, documents.
        </p>
      )}
    </div>
  );
};

FileUploader.propTypes = {
  initialFiles: PropTypes.array,
  uploadUrl: PropTypes.string.isRequired,
  maxFiles: PropTypes.number,
  maxFileSize: PropTypes.number,
  onUploadSuccess: PropTypes.func,
  onError: PropTypes.func,
  label: PropTypes.string,
};

export default FileUploader;
