// src/components/Profile/AvatarUpload.jsx
import React, { useRef, useMemo } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { IMAGE_UPLOAD, validateFileUpload } from "../../utils/constants";

const AvatarUpload = ({ isEditing = false, className = "" }) => {
  const { user, uploadAvatar, loading } = useAuth();
  const fileInputRef = useRef(null);

  const AVATAR_CONFIG = IMAGE_UPLOAD.AVATAR;

  const normalizeImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;

    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    let cleanUrl = url;

    if (cleanUrl.startsWith("/api/")) {
      cleanUrl = cleanUrl.replace("/api/", "/");
    }
    if (cleanUrl.startsWith("/")) {
      return `${apiBaseUrl}${cleanUrl}`;
    }
    return `${apiBaseUrl}/uploads/${cleanUrl}`;
  };

  // Prefer optimistic preview → then server profilePicture
  // avatarVersion forces cache refresh
  const displayImage = useMemo(() => {
    const raw =
      user?.avatarPreview ||
      user?.profilePicture ||
      user?.avatarUrl ||
      user?.avatar ||
      user?.image ||
      null;

    if (!raw) return null;

    const base = normalizeImageUrl(raw);
    const version = user?.avatarVersion || user?.updatedAt || Date.now();
    return `${base}?v=${version}`;
  }, [user]);

  const initials = useMemo(
    () =>
      user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?",
    [user?.name]
  );

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFileUpload(file, {
      MAX_SIZE_MB: AVATAR_CONFIG.MAX_SIZE_MB,
      MAX_SIZE_BYTES: AVATAR_CONFIG.MAX_SIZE_BYTES,
      ALLOWED_TYPES: AVATAR_CONFIG.ALLOWED_TYPES,
      ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
      MAX_FILES: 1,
    });

    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = "";
      return;
    }

    try {
      await uploadAvatar(file);
    } finally {
      e.target.value = "";
    }
  };

  const handleClick = () => {
    if (!isEditing) {
      toast.warning("Enable edit mode to change your profile picture");
      return;
    }
    if (loading) return;
    fileInputRef.current?.click();
  };

  const handleImageError = (e) => {
    e.target.style.display = "none";
  };

  const canInteract = isEditing && !loading;

  return (
    <div className={`relative group ${className}`}>
      <div
        onClick={handleClick}
        className={[
          "relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl",
          canInteract
            ? "cursor-pointer hover:scale-105 hover:shadow-2xl transition-transform duration-300"
            : "cursor-not-allowed",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={user?.name || "Avatar"}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-black">
            {initials}
          </div>
        )}

        {canInteract && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Camera className="w-8 h-8 text-white mb-1" />
            <span className="text-white text-xs font-bold">Change Photo</span>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-blue-600/95 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <span className="text-white text-xs font-bold">Uploading...</span>
          </div>
        )}

        {!isEditing && !loading && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white/95 p-2.5 rounded-full shadow-lg">
              <X className="w-5 h-5 text-gray-700" />
            </div>
          </div>
        )}
      </div>

      {canInteract && (
        <p className="mt-2 text-xs text-gray-500 text-center font-medium">
          Click avatar to change
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_CONFIG.ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={!canInteract}
      />
    </div>
  );
};

export default AvatarUpload;
