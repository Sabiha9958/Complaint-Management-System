// src/components/profile/AvatarUpload.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { IMAGE_UPLOAD, validateFileUpload } from "../../utils/constants";

const getInitials = (name) =>
  name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

const AvatarUpload = ({ isEditing = false, className = "" }) => {
  const { user, uploadAvatar, loading } = useAuth();
  const fileInputRef = useRef(null);

  const [imgError, setImgError] = useState(false);

  const displaySrc = useMemo(() => {
    return user?.profilePicture || user?.avatar || user?.image || null;
  }, [user?.profilePicture, user?.avatar, user?.image]);

  useEffect(() => {
    setImgError(false);
  }, [displaySrc]);

  const canInteract = isEditing && !loading;

  const openPicker = useCallback(() => {
    if (!isEditing)
      return toast.info("Click 'Edit Profile' to change your photo");
    if (!loading) fileInputRef.current?.click();
  }, [isEditing, loading]);

  const handleFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const config = IMAGE_UPLOAD.AVATAR;
      const validation = validateFileUpload(file, {
        MAX_SIZE_MB: config.MAX_SIZE_MB,
        MAX_SIZE_BYTES: config.MAX_SIZE_BYTES,
        ALLOWED_TYPES: config.ALLOWED_TYPES,
        ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
        MAX_FILES: 1,
      });

      if (!validation.valid) {
        toast.error(validation.error, { toastId: "avatar-validation" });
        e.target.value = "";
        return;
      }

      setImgError(false);

      try {
        const result = await uploadAvatar(file); // AuthContext sets blob instantly and swaps to server URL
        if (!result?.success)
          throw new Error(result?.message || "Upload failed");
        toast.success("Profile picture updated!");
      } catch (err) {
        toast.error(err?.message || "Failed to upload image");
      } finally {
        e.target.value = "";
      }
    },
    [uploadAvatar]
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={openPicker}
        disabled={!canInteract}
        className={[
          "relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-slate-50 shadow-xl transition-all duration-200",
          canInteract
            ? "cursor-pointer hover:scale-105 hover:shadow-2xl hover:ring-4 hover:ring-blue-100"
            : "",
          loading ? "cursor-wait opacity-90" : "",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        ].join(" ")}
        aria-label={canInteract ? "Change profile picture" : "Profile picture"}
      >
        {displaySrc && !imgError ? (
          <img
            src={displaySrc}
            alt={user?.name ? `${user.name}'s avatar` : "Profile"}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-slate-800 text-white">
            <span className="text-3xl font-bold tracking-wider">
              {getInitials(user?.name)}
            </span>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-black/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {canInteract && !loading && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity duration-200 hover:opacity-100">
            <div className="flex flex-col items-center">
              <Camera className="h-8 w-8 text-white drop-shadow-md" />
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white">
                Change
              </span>
            </div>
          </div>
        )}
      </button>

      {isEditing && (
        <p className="mt-3 text-center text-xs font-medium text-slate-500">
          Tap image to edit
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_UPLOAD.AVATAR.ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={!canInteract}
      />
    </div>
  );
};

export default AvatarUpload;
