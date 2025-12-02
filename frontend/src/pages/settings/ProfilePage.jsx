// src/pages/ProfilePage.jsx
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  Mail,
  MapPin,
  Edit3,
  Save,
  Shield,
  Calendar,
  User,
  Loader2,
  X,
  Building2,
  Copy,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Camera,
  ImageIcon,
  Shuffle,
  Grid3x3,
  Clock,
  Award,
  TrendingUp,
} from "lucide-react";

/* ================================================================
   🎯 CONSTANTS & CONFIGURATION
   ================================================================ */

const COVER_IMAGES_COUNT = 50;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const VALIDATORS = {
  name: (value) => {
    if (!value?.trim()) return "Name is required";
    if (value.trim().length < 2) return "Min 2 characters required";
    if (value.trim().length > 50) return "Max 50 characters allowed";
    return null;
  },
  title: (value) => (value && value.length > 100 ? "Max 100 characters" : null),
  department: (value) =>
    value && value.length > 50 ? "Max 50 characters" : null,
  location: (value) =>
    value && value.length > 100 ? "Max 100 characters" : null,
  bio: (value) => (value && value.length > 500 ? "Max 500 characters" : null),
};

const validateForm = (formData) => {
  const errors = {};
  Object.keys(VALIDATORS).forEach((field) => {
    const error = VALIDATORS[field](formData[field]);
    if (error) errors[field] = error;
  });
  return errors;
};

const getCoverImageUrl = (coverId) =>
  `https://picsum.photos/seed/cover-${coverId}/1200/400`;

/* ================================================================
   🎨 REUSABLE COMPONENTS
   ================================================================ */

const RoleBadge = ({ role }) => {
  const roleStyles = {
    admin: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200",
      icon: Shield,
      label: "Administrator",
    },
    staff: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: Briefcase,
      label: "Staff Member",
    },
    user: {
      bg: "bg-sky-50",
      text: "text-sky-700",
      border: "border-sky-200",
      icon: User,
      label: "Team Member",
    },
  };

  const style = roleStyles[role] || roleStyles.user;
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${style.bg} ${style.text} ${style.border}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {style.label}
    </span>
  );
};

const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  rows = 1,
  icon: Icon,
  required = false,
  disabled = false,
}) => {
  const Component = rows > 1 ? "textarea" : "input";
  const remaining = maxLength ? maxLength - (value?.length || 0) : null;

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-indigo-600" />}
          {label}
          {required && <span className="text-rose-500">*</span>}
        </span>
        {maxLength && (
          <span
            className={`text-xs font-medium ${remaining < 20 ? "text-rose-600 font-bold" : "text-gray-400"}`}
          >
            {remaining} left
          </span>
        )}
      </label>

      <Component
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 ${
          error
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
            : disabled
              ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
        } ${rows > 1 ? "resize-none" : ""}`}
      />

      {error && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

const AvatarUpload = ({ isEditing }) => {
  const { user, uploadAvatar, loading } = useAuth();
  const fileInputRef = useRef(null);

  const initials = useMemo(() => {
    if (!user?.name) return "?";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    await uploadAvatar(file);
    e.target.value = "";
  };

  const displayImage = user?.profilePicture || user?.avatarUrl || user?.avatar;

  return (
    <div className="relative group">
      <div
        onClick={() => isEditing && !loading && fileInputRef.current?.click()}
        className={`relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl ${
          isEditing && !loading
            ? "cursor-pointer hover:scale-105 transition-all duration-300"
            : ""
        }`}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={user?.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-3xl font-bold">
            {initials}
          </div>
        )}

        {isEditing && !loading && (
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Camera className="w-8 h-8 text-white mb-1" />
            <span className="text-white text-xs font-semibold">
              Change Photo
            </span>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-indigo-600/95 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
            <span className="text-white text-xs font-semibold">
              Uploading...
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!isEditing || loading}
      />
    </div>
  );
};

const CoverSelector = ({ isOpen, onClose, currentCoverId, onSelect }) => {
  const [selectedId, setSelectedId] = useState(currentCoverId || 1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setSelectedId(currentCoverId || 1);
  }, [isOpen, currentCoverId]);

  const handleRandomSelect = () => {
    const randomId = Math.floor(Math.random() * COVER_IMAGES_COUNT) + 1;
    setSelectedId(randomId);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await onSelect(selectedId);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl shadow-lg">
                <Grid3x3 className="w-5 h-5 text-white" />
              </div>
              Choose Cover Image
            </h2>
            <p className="text-gray-600 mt-1 text-sm">
              Select from {COVER_IMAGES_COUNT} beautiful covers
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2.5 hover:bg-white rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            Preview (Cover #{selectedId})
          </p>
          <div className="relative h-44 rounded-xl overflow-hidden shadow-lg ring-2 ring-gray-200">
            <img
              src={getCoverImageUrl(selectedId)}
              alt={`Cover ${selectedId}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: COVER_IMAGES_COUNT }, (_, i) => i + 1).map(
              (id) => (
                <button
                  key={id}
                  onClick={() => setSelectedId(id)}
                  disabled={loading}
                  className={`relative aspect-video rounded-lg overflow-hidden transition-all hover:scale-105 disabled:opacity-50 ${
                    selectedId === id
                      ? "ring-4 ring-indigo-600 shadow-xl"
                      : "ring-2 ring-gray-200 hover:ring-indigo-300"
                  }`}
                >
                  <img
                    src={getCoverImageUrl(id)}
                    alt={`Cover ${id}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedId === id && (
                    <div className="absolute inset-0 bg-indigo-600/25 flex items-center justify-center">
                      <div className="bg-white rounded-full p-2 shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded">
                    #{id}
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={handleRandomSelect}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 hover:border-purple-400 text-gray-700 hover:text-purple-600 rounded-xl font-semibold transition-all disabled:opacity-50"
          >
            <Shuffle className="w-4 h-4" />
            Random Pick
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Apply Cover
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CoverDisplay = ({ coverId, isEditing, onOpenSelector }) => (
  <div
    onClick={isEditing ? onOpenSelector : undefined}
    className={`relative w-full h-full group ${isEditing ? "cursor-pointer" : ""}`}
  >
    <img
      src={getCoverImageUrl(coverId || 1)}
      alt="Profile Cover"
      className="w-full h-full object-cover"
    />
    {isEditing && (
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2.5">
          <Grid3x3 className="w-5 h-5 text-indigo-600" />
          <span className="text-gray-900 font-semibold">Change Cover</span>
        </div>
      </div>
    )}
    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
      Cover #{coverId || 1}
    </div>
  </div>
);

const InfoCard = ({ icon: Icon, label, value, colorScheme, onCopy }) => {
  const schemes = {
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-pink-600",
    emerald: "from-emerald-500 to-teal-600",
    orange: "from-orange-500 to-red-600",
    cyan: "from-cyan-500 to-blue-600",
  };

  return (
    <div
      className={`bg-gradient-to-br ${schemes[colorScheme] || schemes.blue} p-5 rounded-xl shadow-lg`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs font-bold text-white/90 uppercase tracking-wide">
            {label}
          </p>
        </div>
        {onCopy && (
          <button
            onClick={onCopy}
            className="p-2 hover:bg-white/20 rounded-lg text-white transition-all"
            title={`Copy ${label}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="font-semibold text-white text-sm truncate">{value}</p>
    </div>
  );
};

/* ================================================================
   🚀 MAIN COMPONENT
   ================================================================ */

const ProfilePage = () => {
  const { user, updateProfile, loading: authLoading, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [coverSelectorOpen, setCoverSelectorOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    department: "",
    location: "",
    bio: "",
    coverId: 1,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        title: user.title || "",
        department: user.department || "",
        location: user.location || "",
        bio: user.bio || "",
        coverId: user.coverId || 1,
      });
    }
  }, [user]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setErrors({});
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        title: user.title || "",
        department: user.department || "",
        location: user.location || "",
        bio: user.bio || "",
        coverId: user.coverId || 1,
      });
    }
    setIsEditing(false);
    setErrors({});
  }, [user]);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  const handleCoverSelect = useCallback(
    async (coverId) => {
      setCoverSelectorOpen(false);

      if (isEditing) {
        setFormData((prev) => ({ ...prev, coverId }));
        toast.success(
          `Cover #${coverId} selected! Click "Save Changes" to apply.`
        );
      } else {
        setSaving(true);
        try {
          await updateProfile({ coverId });
          await refreshUser();
          toast.success(`Cover #${coverId} applied successfully! 🎉`);
        } catch (error) {
          toast.error(error.message || "Failed to update cover");
        } finally {
          setSaving(false);
        }
      }
    },
    [isEditing, updateProfile, refreshUser]
  );

  const handleSave = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix validation errors");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(formData);
      await refreshUser();
      setIsEditing(false);
      toast.success("Profile updated successfully! 🎉");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const copyEmail = useCallback(() => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      toast.success("Email copied! 📋");
    }
  }, [user?.email]);

  const completeness = useMemo(() => {
    if (!user) return 0;
    const fields = ["name", "title", "bio", "department", "location"];
    const filled = fields.filter((f) => user[f]?.trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-lg">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 pb-20">
        {/* Cover Section */}
        <section className="relative h-[280px] lg:h-[360px]">
          <CoverDisplay
            coverId={isEditing ? formData.coverId : user.coverId}
            isEditing={isEditing}
            onOpenSelector={() => setCoverSelectorOpen(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

          {saving && (
            <div className="absolute top-6 right-6 z-20 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-semibold">
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving changes...
            </div>
          )}
        </section>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-20">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="lg:w-2/3 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-200">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                  {/* Avatar */}
                  <div className="-mt-28 md:-mt-24">
                    <div className="p-2 bg-white rounded-full shadow-2xl inline-block ring-4 ring-white">
                      <AvatarUpload isEditing={isEditing} />
                    </div>
                  </div>

                  {/* Name & Title */}
                  <div className="flex-1 w-full space-y-3">
                    {isEditing ? (
                      <>
                        <FormField
                          label="Full Name"
                          value={formData.name}
                          onChange={(v) => handleInputChange("name", v)}
                          placeholder="Enter your full name"
                          error={errors.name}
                          maxLength={50}
                          icon={User}
                          required
                        />
                        <FormField
                          label="Job Title"
                          value={formData.title}
                          onChange={(v) => handleInputChange("title", v)}
                          placeholder="e.g. Senior Software Engineer"
                          error={errors.title}
                          maxLength={100}
                          icon={Briefcase}
                        />
                      </>
                    ) : (
                      <>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                          {user.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2.5">
                          {user.title && (
                            <p className="text-base font-medium text-gray-600 flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-indigo-600" />
                              {user.title}
                            </p>
                          )}
                          <RoleBadge role={user.role} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 self-end">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-semibold transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-200">
                  {isEditing ? (
                    <>
                      <FormField
                        label="Email"
                        value={user.email}
                        onChange={() => {}}
                        icon={Mail}
                        disabled
                      />
                      <FormField
                        label="Department"
                        value={formData.department}
                        onChange={(v) => handleInputChange("department", v)}
                        placeholder="e.g. Engineering"
                        error={errors.department}
                        maxLength={50}
                        icon={Building2}
                      />
                      <FormField
                        label="Location"
                        value={formData.location}
                        onChange={(v) => handleInputChange("location", v)}
                        placeholder="e.g. San Francisco, CA"
                        error={errors.location}
                        maxLength={100}
                        icon={MapPin}
                      />
                    </>
                  ) : (
                    <>
                      <InfoCard
                        icon={Mail}
                        label="Email"
                        value={user.email}
                        colorScheme="blue"
                        onCopy={copyEmail}
                      />
                      <InfoCard
                        icon={Building2}
                        label="Department"
                        value={user.department || "Not specified"}
                        colorScheme="purple"
                      />
                      <InfoCard
                        icon={MapPin}
                        label="Location"
                        value={user.location || "Not specified"}
                        colorScheme="emerald"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Bio Section */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  About Me
                </h3>

                {isEditing ? (
                  <FormField
                    label="Biography"
                    value={formData.bio}
                    onChange={(v) => handleInputChange("bio", v)}
                    placeholder="Tell your team about yourself, your interests, and what you do..."
                    error={errors.bio}
                    maxLength={500}
                    rows={6}
                  />
                ) : (
                  <div>
                    {user.bio ? (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {user.bio}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">
                        No bio added yet. Click "Edit Profile" to add one!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:w-1/3 space-y-6">
              {/* Profile Strength */}
              <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-indigo-900 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Profile Strength
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Complete your profile
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      {completeness}
                    </span>
                    <span className="text-xl font-medium text-gray-400">%</span>
                  </div>
                </div>

                <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden mb-5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                    style={{ width: `${completeness}%` }}
                  />
                </div>

                {completeness === 100 ? (
                  <div className="bg-emerald-500/20 border-2 border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <p className="font-semibold text-sm">
                      🎉 Profile complete!
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-700/50 rounded-xl p-4">
                    <p className="text-sm text-gray-300">
                      Add {5 - Math.floor((completeness / 100) * 5)} more
                      field(s) to complete
                    </p>
                  </div>
                )}
              </div>

              {/* Account Info */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 space-y-4">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Account Details
                </h3>

                <InfoCard
                  icon={Calendar}
                  label="Member Since"
                  value={new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  colorScheme="blue"
                />

                <InfoCard
                  icon={Shield}
                  label="Status"
                  value="Active & Verified"
                  colorScheme="emerald"
                />

                {user.lastLogin && (
                  <InfoCard
                    icon={Clock}
                    label="Last Login"
                    value={new Date(user.lastLogin).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                    colorScheme="cyan"
                  />
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Cover Selector Modal */}
      <CoverSelector
        isOpen={coverSelectorOpen}
        onClose={() => setCoverSelectorOpen(false)}
        currentCoverId={isEditing ? formData.coverId : user.coverId}
        onSelect={handleCoverSelect}
      />
    </>
  );
};

export default ProfilePage;
