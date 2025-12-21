import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  UploadCloud,
  X,
  FileText,
  Image as ImageIcon,
  Send,
  Loader2,
  User,
  Mail,
  Phone,
  Type,
  AlignLeft,
  Tag,
  Flag,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ComplaintAPI } from "../../api/complaints";
import { FILE_UPLOAD, validateFilesUpload } from "../../utils/constants";

// --- Utility Components ---

const cn = (...inputs) => twMerge(clsx(inputs));

const Section = ({ title, description, children, className }) => (
  <div
    className={cn(
      "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden",
      className
    )}
  >
    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </div>
);

const Label = ({ children, required }) => (
  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

const ErrorMsg = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-rose-600 animate-in slide-in-from-top-1">
      <AlertCircle className="w-3.5 h-3.5" />
      {message}
    </div>
  );
};

const InputWrapper = ({ icon: Icon, error, children }) => (
  <div className="relative group">
    {Icon && (
      <div className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
    )}
    {children}
    {error && (
      <div className="absolute right-3.5 top-3.5 text-rose-500">
        <AlertCircle className="w-5 h-5" />
      </div>
    )}
  </div>
);

const baseInputStyles = (hasIcon, hasError) =>
  cn(
    "w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200",
    hasIcon ? "pl-11" : "",
    hasError
      ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
      : "border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
  );

// --- File Handling Logic ---

const FilePreview = ({ file, onRemove }) => {
  const isImg = file.type.startsWith("image/");
  const size = (file.size / 1024 / 1024).toFixed(2); // MB

  return (
    <div className="group relative flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all">
      <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
        {isImg ? (
          <ImageIcon className="w-5 h-5" />
        ) : (
          <FileText className="w-5 h-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-700 truncate">{file.name}</p>
        <p className="text-xs text-slate-400">{size} MB</p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Main Form Component ---

export default function ComplaintForm({
  currentUser,
  categoryOptions = ["technical", "billing", "service", "other"],
  priorityOptions = ["low", "medium", "high", "urgent"],
  onSubmitStart,
  onSubmitSuccess,
  onSubmitError,
  isSubmitting = false,
}) {
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
  });

  // Attachments State
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Sync user data if it changes
  useEffect(() => {
    if (currentUser) {
      reset((vals) => ({
        ...vals,
        contactName: currentUser.name || vals.contactName,
        contactEmail: currentUser.email || vals.contactEmail,
        contactPhone: currentUser.phone || vals.contactPhone,
      }));
    }
  }, [currentUser, reset]);

  // File Handlers
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    // Validate
    const validation = validateFilesUpload(
      [...files, ...selected],
      FILE_UPLOAD
    );
    if (!validation.valid) {
      onSubmitError?.(validation.error);
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submission Handler
  const onSubmit = async (data) => {
    try {
      onSubmitStart?.();

      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("description", data.description.trim());
      formData.append("category", data.category);
      formData.append("priority", data.priority);

      formData.append(
        "contactInfo",
        JSON.stringify({
          name: data.contactName.trim(),
          email: data.contactEmail.trim(),
          phone: data.contactPhone.trim(),
        })
      );

      files.forEach((f) => formData.append("attachments", f));

      const res = await ComplaintAPI.create(formData);
      const payload = res?.data || res;

      if (payload.success === false) throw new Error(payload.message);

      reset();
      setFiles([]);
      onSubmitSuccess?.(payload);
    } catch (err) {
      onSubmitError?.(err.message || "Failed to create ticket");
    }
  };

  // Watchers for character counts
  const titleVal = watch("title") || "";
  const descVal = watch("description") || "";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 max-w-4xl mx-auto"
      noValidate
    >
      {/* 1. Details Section */}
      <Section
        title="Ticket Details"
        description="Please provide a clear title and detailed description of the issue."
      >
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label required>Title</Label>
            <span className="text-[10px] font-medium text-slate-400">
              {titleVal.length}/100
            </span>
          </div>
          <InputWrapper icon={Type} error={errors.title}>
            <input
              type="text"
              placeholder="E.g., Login page not loading"
              maxLength={100}
              className={baseInputStyles(true, errors.title)}
              {...register("title", {
                required: "Title is required",
                minLength: { value: 5, message: "Title is too short" },
              })}
            />
          </InputWrapper>
          <ErrorMsg message={errors.title?.message} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <Label required>Description</Label>
            <span className="text-[10px] font-medium text-slate-400">
              {descVal.length}/2000
            </span>
          </div>
          <InputWrapper error={errors.description}>
            <textarea
              rows={5}
              placeholder="Describe what happened, steps to reproduce, and any error messages..."
              maxLength={2000}
              className={cn(
                baseInputStyles(false, errors.description),
                "resize-none"
              )}
              {...register("description", {
                required: "Description is required",
                minLength: {
                  value: 20,
                  message: "Please provide more detail (min 20 chars)",
                },
              })}
            />
          </InputWrapper>
          <ErrorMsg message={errors.description?.message} />
        </div>
      </Section>

      {/* 2. Classification Section */}
      <Section title="Classification" className="overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label required>Category</Label>
            <InputWrapper icon={Tag}>
              <select
                className={cn(
                  baseInputStyles(true, errors.category),
                  "appearance-none cursor-pointer"
                )}
                {...register("category", {
                  required: "Please select a category",
                })}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </InputWrapper>
          </div>

          <div>
            <Label>Priority</Label>
            <InputWrapper icon={Flag}>
              <select
                className={cn(
                  baseInputStyles(true, false),
                  "appearance-none cursor-pointer"
                )}
                {...register("priority")}
              >
                {priorityOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </InputWrapper>
          </div>
        </div>
      </Section>

      {/* 3. Evidence / Attachments */}
      <Section
        title="Evidence"
        description="Attach screenshots or logs to help us resolve the issue faster."
      >
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer group relative flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400 transition-all duration-200"
        >
          <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6 text-indigo-500" />
          </div>
          <p className="text-sm font-bold text-slate-700">
            Click to upload files
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Max {FILE_UPLOAD.MAX_FILES} files ({FILE_UPLOAD.MAX_SIZE_MB}MB each)
          </p>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in zoom-in-95">
            {files.map((f, i) => (
              <FilePreview
                key={`${f.name}-${i}`}
                file={f}
                onRemove={() => removeFile(i)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* 4. Contact Info */}
      <Section title="Contact Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label required>Reporter Name</Label>
            <InputWrapper icon={User} error={errors.contactName}>
              <input
                type="text"
                className={baseInputStyles(true, errors.contactName)}
                {...register("contactName", { required: "Name is required" })}
              />
            </InputWrapper>
            <ErrorMsg message={errors.contactName?.message} />
          </div>

          <div>
            <Label required>Email Address</Label>
            <InputWrapper icon={Mail} error={errors.contactEmail}>
              <input
                type="email"
                className={baseInputStyles(true, errors.contactEmail)}
                {...register("contactEmail", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: "Invalid email format",
                  },
                })}
              />
            </InputWrapper>
            <ErrorMsg message={errors.contactEmail?.message} />
          </div>

          <div className="md:col-span-2">
            <Label>Phone Number (Optional)</Label>
            <InputWrapper icon={Phone}>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                className={baseInputStyles(true, false)}
                {...register("contactPhone")}
              />
            </InputWrapper>
          </div>
        </div>
      </Section>

      {/* Submit Action */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95",
            isSubmitting
              ? "bg-slate-400 cursor-not-allowed shadow-none"
              : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25 hover:-translate-y-1"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Ticket...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Ticket
            </>
          )}
        </button>
      </div>
    </form>
  );
}
