import React, { useId, useRef, useState } from "react";
import { PlusCircle, Trash } from "lucide-react";
import PropTypes from "prop-types";
import apiClient from "../../api/apiClient";
import {
  ATTACHMENT_CONFIG,
  validateFilesUpload,
  formatFileSize,
  getFileTypeLabel,
  isImageFile,
} from "../../utils/constants";

/**
 * FileUploader
 * - Multi-file upload with:
 *   - Type & size validation via ATTACHMENT_CONFIG
 *   - Upload progress per file (Axios onUploadProgress)
 *   - Image/document preview
 *   - Notifies parent on successful uploads
 *
 * Expects backend to return:
 *   - Either an array of attachments
 *   - Or { attachments: [...] } / { files: [...] }
 * via the apiClient interceptor shape: { success, data, message, status }.
 */
const FileUploader = ({
  initialFiles = [], // [{ _id, url, filename, mimeType, size }]
  uploadUrl, // API endpoint to POST attachments
  maxFiles = ATTACHMENT_CONFIG.MAX_FILES,
  maxFileSize = ATTACHMENT_CONFIG.MAX_SIZE_BYTES,
  onUploadSuccess, // (newFiles) => void
  onError, // (message) => void
  label = "Add Attachments",
}) => {
  const [files, setFiles] = useState(initialFiles);
  const [uploadingFiles, setUploadingFiles] = useState({});
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

    if (files.length + selectedFiles.length > maxFiles) {
      onError?.(`You can upload up to ${maxFiles} files.`);
      resetInput();
      return;
    }

    // Validate batch (count, total size, types)
    const validation = validateFilesUpload(selectedFiles, effectiveConfig);
    if (!validation.valid) {
      onError?.(validation.error);
      resetInput();
      return;
    }

    for (const file of selectedFiles) {
      const clientId = `${file.name}-${file.size}-${file.lastModified}`;

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

        // apiClient wraps the response: { success, data, message, status }
        const payload = response.data;

        let newAttachments = [];
        if (Array.isArray(payload)) {
          newAttachments = payload;
        } else if (Array.isArray(payload?.attachments)) {
          newAttachments = payload.attachments;
        } else if (Array.isArray(payload?.files)) {
          newAttachments = payload.files;
        }

        if (!newAttachments.length) {
          throw new Error("Server did not return uploaded attachments");
        }

        setFiles((prev) => [...prev, ...newAttachments]);
        onUploadSuccess?.(newAttachments);

        setUploadingFiles((prev) => {
          const copy = { ...prev };
          delete copy[clientId];
          return copy;
        });
      } catch (error) {
        const msg = error?.message || "Unknown upload error";
        onError?.(`Failed to upload ${file.name}: ${msg}`);

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
    // Optional: parent can call backend delete API here
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
        />
      );
    }

    // Non-image: simple icon + type label
    return (
      <div className="h-12 w-12 rounded flex items-center justify-center bg-gray-100 border border-gray-200 text-xs text-gray-500">
        {getFileTypeLabel(mime).split(" ")[0] || "FILE"}
      </div>
    );
  };

  const totalUploading = Object.keys(uploadingFiles).length;

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition"
      >
        <PlusCircle className="h-6 w-6 text-blue-500" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {label} (up to {maxFiles})
          </span>
          <span className="text-xs text-gray-500">
            Max {effectiveConfig.MAX_SIZE_MB.toFixed(1)} MB per file •{" "}
            {effectiveConfig.ALLOWED_EXTENSIONS.join(", ")}
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

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <p className="text-xs text-gray-500">
          {files.length} file{files.length > 1 ? "s" : ""} attached.
        </p>
      )}

      <ul className="space-y-2">
        {files.map((file) => (
          <li
            key={file._id || file.filename}
            className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg p-2 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              {renderPreview(file)}
              <div className="min-w-0">
                {file.url ? (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-mono text-sm text-blue-600 hover:underline"
                    title={file.filename}
                  >
                    {file.filename}
                  </a>
                ) : (
                  <span className="block truncate font-mono text-sm text-gray-700">
                    {file.filename}
                  </span>
                )}
                <p className="text-xs text-gray-500">
                  {file.size ? formatFileSize(file.size) : ""}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleRemoveFile(file._id)}
              className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50"
              aria-label={`Remove ${file.filename}`}
              type="button"
            >
              <Trash className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>

      {/* Upload Progress */}
      {Object.entries(uploadingFiles).map(([clientId, meta]) => (
        <div key={clientId} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="truncate max-w-xs">{meta.name}</span>
            <span>{meta.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 transition-all"
              style={{ width: `${meta.progress}%` }}
            />
          </div>
        </div>
      ))}

      {/* Optional "no files" state */}
      {!files.length && !totalUploading && (
        <p className="text-xs text-gray-500">
          No attachments uploaded yet. Supported: images, PDFs, documents.
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
