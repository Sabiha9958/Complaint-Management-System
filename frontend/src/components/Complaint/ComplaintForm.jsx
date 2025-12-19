import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import {
  FiUpload,
  FiX,
  FiFileText,
  FiAlertCircle,
  FiLoader,
  FiSend,
  FiEye,
  FiDownload,
  FiPaperclip,
} from "react-icons/fi";
import { ComplaintAPI } from "../../api/complaints";

const FALLBACK_CATEGORIES = [
  "technical",
  "billing",
  "service",
  "product",
  "harassment",
  "safety",
  "other",
];

const FALLBACK_PRIORITIES = ["low", "medium", "high", "urgent"];

const ATTACHMENTS = {
  MAX_FILES: 10,
  MAX_SIZE_MB: 10,
  ACCEPT: "image/*,application/pdf,.doc,.docx,.txt",
};

const labelize = (str) =>
  String(str || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatFileSize = (bytes = 0) => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const isImage = (file) =>
  String(file?.type || "")
    .toLowerCase()
    .startsWith("image/");

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1.5">
      <FiAlertCircle className="w-4 h-4" />
      {message}
    </p>
  );
}

function PreviewModal({ open, file, url, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !file) return null;

  const img = isImage(file);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 grid place-items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-gray-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>

          <div className="flex items-center gap-2">
            {url ? (
              <a
                href={url}
                download={file.name}
                className="p-2 rounded-xl hover:bg-gray-100 transition"
                title="Download"
              >
                <FiDownload className="h-5 w-5 text-gray-700" />
              </a>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition"
              title="Close"
            >
              <FiX className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-auto max-h-[80vh]">
          {img && url ? (
            <img
              src={url}
              alt={file.name}
              className="max-w-full h-auto rounded-xl"
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <FiFileText className="h-14 w-14 text-gray-400 mx-auto" />
              <p className="mt-3 text-sm font-semibold text-gray-800">
                Preview not available
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Download the file to view it.
              </p>
              {url ? (
                <a
                  href={url}
                  download={file.name}
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                >
                  <FiDownload className="h-4 w-4" />
                  Download
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentCard({ item, onRemove, onPreview }) {
  const { file, previewUrl } = item;
  const img = isImage(file);

  return (
    <div className="group relative rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-md transition">
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 rounded-full bg-white/90 border border-gray-200 p-1.5 opacity-0 group-hover:opacity-100 transition"
        title="Remove"
      >
        <FiX className="h-4 w-4 text-gray-700" />
      </button>

      <button
        type="button"
        onClick={onPreview}
        className="absolute top-2 left-2 z-10 rounded-full bg-white/90 border border-gray-200 p-1.5 opacity-0 group-hover:opacity-100 transition"
        title="Preview"
      >
        <FiEye className="h-4 w-4 text-gray-700" />
      </button>

      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {img && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <FiFileText className="h-10 w-10 text-gray-400" />
        )}
      </div>

      <div className="p-3 border-t border-gray-100">
        <p
          className="text-xs font-semibold text-gray-800 truncate"
          title={file.name}
        >
          {file.name}
        </p>
        <p className="text-[11px] text-gray-500">{formatFileSize(file.size)}</p>
      </div>
    </div>
  );
}

function useAttachments({ onError }) {
  const [items, setItems] = useState([]); // { file, previewUrl }
  const urlsRef = useRef(new Set());

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current.clear();
    };
  }, []);

  const addFiles = useCallback(
    (incoming) => {
      const list = Array.from(incoming || []);
      if (!list.length) return;

      setItems((prev) => {
        if (prev.length + list.length > ATTACHMENTS.MAX_FILES) {
          onError?.(`Maximum ${ATTACHMENTS.MAX_FILES} attachments allowed`);
          return prev;
        }

        for (const f of list) {
          const sizeMb = f.size / (1024 * 1024);
          if (sizeMb > ATTACHMENTS.MAX_SIZE_MB) {
            onError?.(`${f.name} is larger than ${ATTACHMENTS.MAX_SIZE_MB}MB`);
            return prev;
          }
        }

        const next = list.map((file) => {
          let previewUrl = null;
          if (isImage(file)) {
            previewUrl = URL.createObjectURL(file);
            urlsRef.current.add(previewUrl);
          }
          return { file, previewUrl };
        });

        return [...prev, ...next];
      });
    },
    [onError]
  );

  const removeAt = useCallback((idx) => {
    setItems((prev) => {
      const copy = [...prev];
      const removed = copy[idx];
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
        urlsRef.current.delete(removed.previewUrl);
      }
      copy.splice(idx, 1);
      return copy;
    });
  }, []);

  const clear = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl));
      urlsRef.current.clear();
      return [];
    });
  }, []);

  return { items, addFiles, removeAt, clear };
}

export default function ComplaintForm({
  currentUser,
  categoryOptions = FALLBACK_CATEGORIES,
  priorityOptions = FALLBACK_PRIORITIES,
  onSubmitStart,
  onSubmitSuccess,
  onSubmitError,
  isSubmitting = false,
}) {
  const categories = useMemo(
    () =>
      Array.isArray(categoryOptions) && categoryOptions.length
        ? categoryOptions
        : FALLBACK_CATEGORIES,
    [categoryOptions]
  );

  const priorities = useMemo(
    () =>
      Array.isArray(priorityOptions) && priorityOptions.length
        ? priorityOptions
        : FALLBACK_PRIORITIES,
    [priorityOptions]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      contactName: currentUser?.name || "",
      contactEmail: currentUser?.email || "",
      contactPhone: currentUser?.phone || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    reset((prev) => ({
      ...prev,
      contactName: currentUser?.name || "",
      contactEmail: currentUser?.email || "",
      contactPhone: currentUser?.phone || "",
    }));
  }, [currentUser, reset]);

  const titleLen = String(watch("title") || "").length;
  const descLen = String(watch("description") || "").length;

  const { items, addFiles, removeAt, clear } = useAttachments({
    onError: onSubmitError,
  });
  const [preview, setPreview] = useState({ open: false, file: null, url: "" });

  const onFileInputChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const submit = async (values) => {
    try {
      onSubmitStart?.();

      const category = String(values.category || "other")
        .trim()
        .toLowerCase();

      const fd = new FormData();
      fd.append("title", String(values.title || "").trim());
      fd.append("description", String(values.description || "").trim());
      fd.append("category", category);
      fd.append("priority", String(values.priority || "medium"));

      fd.append(
        "contactInfo",
        JSON.stringify({
          name: String(values.contactName || "").trim(),
          email: String(values.contactEmail || "")
            .trim()
            .toLowerCase(),
          phone: String(values.contactPhone || "").trim(),
        })
      );

      items.forEach(({ file }) => fd.append("attachments", file));

      const res = await ComplaintAPI.create(fd);
      const payload = res?.data ?? res;
      if (payload?.success === false)
        throw new Error(payload?.message || "Failed to submit complaint");

      reset({
        title: "",
        description: "",
        category: "other",
        priority: "medium",
        contactName: currentUser?.name || "",
        contactEmail: currentUser?.email || "",
        contactPhone: currentUser?.phone || "",
      });

      clear();
      onSubmitSuccess?.(payload?.data ?? payload);
    } catch (e) {
      onSubmitError?.(e?.message || "Failed to submit complaint");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
        {/* Title */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-extrabold text-gray-900">
              Title <span className="text-rose-600">*</span>
            </label>
            <span className="text-xs font-semibold text-gray-500">
              {titleLen}/200
            </span>
          </div>

          <input
            className={[
              "mt-3 w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition",
              errors.title
                ? "border-rose-300 bg-rose-50"
                : "border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400",
            ].join(" ")}
            placeholder="Short summary of the issue…"
            maxLength={200}
            {...register("title", {
              required: "Title is required",
              minLength: { value: 5, message: "Min 5 characters" },
              maxLength: { value: 200, message: "Max 200 characters" },
            })}
          />
          <FieldError message={errors.title?.message} />
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-extrabold text-gray-900">
              Description <span className="text-rose-600">*</span>
            </label>
            <span className="text-xs font-semibold text-gray-500">
              {descLen}/2000
            </span>
          </div>

          <textarea
            rows={6}
            className={[
              "mt-3 w-full rounded-xl border px-4 py-3 text-sm outline-none transition resize-none",
              errors.description
                ? "border-rose-300 bg-rose-50"
                : "border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400",
            ].join(" ")}
            placeholder="Explain the problem clearly (what happened, where, when)…"
            maxLength={2000}
            {...register("description", {
              required: "Description is required",
              minLength: { value: 10, message: "Min 10 characters" },
              maxLength: { value: 2000, message: "Max 2000 characters" },
            })}
          />
          <FieldError message={errors.description?.message} />
        </div>

        {/* Category + Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <label className="text-sm font-extrabold text-gray-900">
              Category <span className="text-rose-600">*</span>
            </label>

            <select
              className={[
                "mt-3 w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition bg-white",
                errors.category
                  ? "border-rose-300"
                  : "border-gray-200 focus:border-blue-400",
              ].join(" ")}
              {...register("category", { required: "Category is required" })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {labelize(c)}
                </option>
              ))}
            </select>
            <FieldError message={errors.category?.message} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <label className="text-sm font-extrabold text-gray-900">
              Priority
            </label>
            <select
              className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none transition bg-white focus:border-blue-400"
              {...register("priority")}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {labelize(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Attachments */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-gray-900">
                Attachments (optional)
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Up to {ATTACHMENTS.MAX_FILES} files, max{" "}
                {ATTACHMENTS.MAX_SIZE_MB}MB each.
              </p>
            </div>

            <label
              className={[
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-extrabold transition cursor-pointer",
                items.length >= ATTACHMENTS.MAX_FILES
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
              ].join(" ")}
            >
              <FiUpload className="h-4 w-4" />
              Add files
              <input
                type="file"
                multiple
                accept={ATTACHMENTS.ACCEPT}
                onChange={onFileInputChange}
                disabled={items.length >= ATTACHMENTS.MAX_FILES}
                className="hidden"
              />
            </label>
          </div>

          {items.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((item, idx) => (
                <AttachmentCard
                  key={`${item.file.name}-${idx}`}
                  item={item}
                  onRemove={() => removeAt(idx)}
                  onPreview={() =>
                    setPreview({
                      open: true,
                      file: item.file,
                      url: item.previewUrl || "",
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <FiPaperclip className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="mt-2 text-sm font-semibold text-gray-700">
                No attachments added
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Add screenshots or documents if they help.
              </p>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-extrabold text-gray-900">
            Contact information
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">
                Name *
              </label>
              <input
                className={[
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition",
                  errors.contactName
                    ? "border-rose-300 bg-rose-50"
                    : "border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400",
                ].join(" ")}
                placeholder="Full name"
                {...register("contactName", {
                  required: "Name is required",
                  minLength: { value: 2, message: "Min 2 characters" },
                  maxLength: { value: 100, message: "Max 100 characters" },
                })}
              />
              <FieldError message={errors.contactName?.message} />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">
                Email *
              </label>
              <input
                className={[
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition",
                  errors.contactEmail
                    ? "border-rose-300 bg-rose-50"
                    : "border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400",
                ].join(" ")}
                placeholder="name@example.com"
                {...register("contactEmail", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email",
                  },
                })}
              />
              <FieldError message={errors.contactEmail?.message} />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase">
                Phone (optional)
              </label>
              <input
                className={[
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition",
                  errors.contactPhone
                    ? "border-rose-300 bg-rose-50"
                    : "border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400",
                ].join(" ")}
                placeholder="10-digit number"
                maxLength={10}
                {...register("contactPhone", {
                  validate: (v) => {
                    const s = String(v || "").trim();
                    if (!s) return true;
                    return (
                      /^[6-9]\d{9}$/.test(s) ||
                      "Invalid phone (10 digits, starts 6-9)"
                    );
                  },
                })}
              />
              <FieldError message={errors.contactPhone?.message} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={[
            "w-full rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.99]",
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20",
          ].join(" ")}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <FiLoader className="h-5 w-5 animate-spin" />
              Submitting…
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              Submit complaint
              <FiSend className="h-4 w-4" />
            </span>
          )}
        </button>
      </form>

      <PreviewModal
        open={preview.open}
        file={preview.file}
        url={preview.url}
        onClose={() => setPreview({ open: false, file: null, url: "" })}
      />
    </>
  );
}
